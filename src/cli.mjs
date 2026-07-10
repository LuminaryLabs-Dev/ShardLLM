import os from "node:os";
import { resolve } from "node:path";
import { writeArtifacts } from "./artifacts.mjs";
import { buildBudget, defaultBudgets, modelFacts } from "./estimator.mjs";
import { buildExecutionPlan, validateExecutionOptions } from "./execution-plan.mjs";
import { inspectHuggingFaceModel } from "./huggingface-client.mjs";
import { normalizeTensorIndex } from "./tensor-index.mjs";

const VERSION = "0.1.0";

function usage() {
  return [
    "Usage:",
    "  shardllm inspect <owner/model> [options]",
    "",
    "Options:",
    "  --output <directory>",
    "  --ram-gb <number>",
    "  --disk-gb <number>",
    "  --ram-cache-gb <number>",
    "  --weight-cache <ram-only|disk-bounded|none>",
    "  --execution-mode <local-stream|remote-expert|remote-block>",
    "  --gateway-url <http(s)://endpoint>",
    "  --speculative-tokens <1-32>",
    "  --tensor-detail <full|summary>",
    "",
    "Reads public Hugging Face metadata, config, and safetensors index only. It never downloads weight shards."
  ].join("\n");
}

function parseArgs(args) {
  if (args[0] !== "inspect" || !args[1]) throw new Error(usage());
  const options = {
    modelId: args[1],
    outputRoot: ".shardllm-cache",
    executionMode: "local-stream",
    weightCache: "ram-only",
    speculativeTokens: 1,
    tensorDetail: "full"
  };
  const supported = new Set([
    "--output",
    "--ram-gb",
    "--disk-gb",
    "--ram-cache-gb",
    "--weight-cache",
    "--execution-mode",
    "--gateway-url",
    "--speculative-tokens",
    "--tensor-detail"
  ]);
  for (let index = 2; index < args.length; index += 1) {
    const option = args[index];
    const value = args[index + 1];
    if (!value || !supported.has(option)) throw new Error(usage());
    if (option === "--output") options.outputRoot = value;
    if (option === "--ram-gb") options.ramGb = Number(value);
    if (option === "--disk-gb") options.diskGb = Number(value);
    if (option === "--ram-cache-gb") options.ramCacheGb = Number(value);
    if (option === "--weight-cache") options.weightCache = value;
    if (option === "--execution-mode") options.executionMode = value;
    if (option === "--gateway-url") options.gatewayUrl = value;
    if (option === "--speculative-tokens") options.speculativeTokens = Number(value);
    if (option === "--tensor-detail") options.tensorDetail = value;
    index += 1;
  }
  for (const [name, value] of [["RAM", options.ramGb], ["disk", options.diskGb], ["RAM cache", options.ramCacheGb]]) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`${name} budget must be a non-negative number.`);
    }
  }
  if (!new Set(["summary", "full"]).has(options.tensorDetail)) {
    throw new Error("Tensor detail must be summary or full.");
  }
  return validateExecutionOptions(options);
}

function event(runId, sequence, name, payload) {
  return {
    schema_version: 1,
    run_id: runId,
    sequence,
    timestamp: new Date().toISOString(),
    event: name,
    payload
  };
}

export async function runCli(args) {
  const options = parseArgs(args);
  const source = await inspectHuggingFaceModel(options.modelId);
  const now = new Date().toISOString();
  const runId = `inspect-${now.replace(/[:.]/g, "-")}`;
  const metadataBytes = source.api.bytes + source.config.bytes + source.index.bytes;
  const sourceIdentity = { provider: "huggingface", model_id: options.modelId, revision: source.revision };
  const tensorIndex = normalizeTensorIndex(source.index.json, sourceIdentity, { detail: options.tensorDetail });
  const facts = modelFacts(source.config.json);
  const { ramBytes, diskBytes, ramCacheBytes } = defaultBudgets({
    ramGb: options.ramGb,
    diskGb: options.diskGb,
    ramCacheGb: options.ramCacheGb,
    hostRamBytes: os.totalmem()
  });
  if (ramCacheBytes > ramBytes) throw new Error("RAM cache budget cannot exceed the total RAM budget.");
  const budget = buildBudget({
    facts,
    publishedStorageBytes: source.api.json.usedStorage ?? null,
    indexedStorageBytes: source.index.json.metadata?.total_size ?? null,
    shardCount: tensorIndex.shard_count,
    ramBytes,
    diskBytes,
    ramCacheBytes,
    weightCache: options.weightCache
  });
  const executionPlan = buildExecutionPlan({
    source: sourceIdentity,
    executionMode: options.executionMode,
    weightCache: options.weightCache,
    ramCacheBytes,
    diskCacheBytes: diskBytes,
    speculativeTokens: options.speculativeTokens,
    gatewayUrl: options.gatewayUrl
  });
  const manifest = {
    schema_version: 1,
    created_at: now,
    source: sourceIdentity,
    retrieved_at: now,
    api_url: source.apiUrl,
    config_url: source.configUrl,
    index_url: source.indexUrl,
    published_storage_bytes: source.api.json.usedStorage ?? null,
    indexed_storage_bytes: source.index.json.metadata?.total_size ?? null,
    shards: tensorIndex.shards,
    downloaded_metadata_bytes: metadataBytes,
    metadata_requests: [
      { url: source.apiUrl, bytes: source.api.bytes, etag: source.api.etag },
      { url: source.configUrl, bytes: source.config.bytes, etag: source.config.etag },
      { url: source.indexUrl, bytes: source.index.bytes, etag: source.index.etag }
    ],
    full_weight_shards_downloaded: 0
  };
  const cachePlan = {
    schema_version: 1,
    created_at: now,
    source: sourceIdentity,
    policy: options.weightCache,
    ram_weight_cache_bytes: options.weightCache === "ram-only" ? ramCacheBytes : 0,
    disk_weight_cache_bytes: options.weightCache === "disk-bounded" ? diskBytes : 0,
    metadata_artifacts_persisted: true,
    entries: [
      { content_id: "config.json", priority: 1, expected_bytes: source.config.bytes, eviction_class: "metadata", recovery_source: source.configUrl },
      { content_id: "model.safetensors.index.json", priority: 1, expected_bytes: source.index.bytes, eviction_class: "metadata", recovery_source: source.indexUrl }
    ],
    deferred_weight_plan: {
      status: "blocked_on_safetensors_header_parser",
      reason: "The index identifies the source shard but not each tensor byte range."
    }
  };
  const runConfig = {
    schema_version: 1,
    created_at: now,
    shardllm_version: VERSION,
    backend: null,
    source: sourceIdentity,
    host: { platform: os.platform(), architecture: os.arch(), total_memory_bytes: os.totalmem() },
    budgets: { memory_bytes: ramBytes, disk_cache_bytes: diskBytes },
    dtype: facts.dtype,
    tensor_detail: options.tensorDetail,
    cache_policy: options.weightCache,
    execution: {
      mode: options.executionMode,
      gateway_url: executionPlan.gateway_url,
      speculative_tokens: options.speculativeTokens
    },
    kv_policy: "not_started",
    prompt_suite: null
  };
  const proofEvents = [
    event(runId, 1, "metadata_read", { downloaded_metadata_bytes: metadataBytes, full_weight_shards_downloaded: 0 }),
    event(runId, 2, "tensor_index_built", { tensor_count: tensorIndex.tensor_count, shard_count: tensorIndex.shard_count, unknown_tensor_count: tensorIndex.unknown_tensor_count }),
    event(runId, 3, "budget_estimated", { classification: budget.feasibility.classification, whole_layer_fit: budget.feasibility.whole_layer_fit }),
    event(runId, 4, "execution_plan_built", { mode: options.executionMode, status: executionPlan.status, blockers: executionPlan.blockers })
  ];
  const report = {
    schema_version: 1,
    created_at: now,
    source: sourceIdentity,
    claim_level: "plannable",
    classification: "estimator_only",
    validation_gates: {
      metadata_and_index: "passed",
      byte_accounting: "partial",
      executor_correctness: "not_started",
      hybrid_execution: "planned",
      bounded_cache: "not_started",
      pause_resume: "not_started",
      kv_policy: "not_started"
    },
    measured: { downloaded_metadata_bytes: metadataBytes, full_weight_shards_downloaded: 0 },
    estimates: budget.estimates,
    limitations: [
      "Tensor byte ranges, dtypes, and sizes require safetensors header range parsing.",
      "Remote expert/block adapters and speculative verification are planning surfaces only.",
      "No executor, cache eviction, pause/resume, or KV proof was run."
    ],
    next_experiment: "Fetch safetensors headers by byte range and calculate exact active-expert tensor windows."
  };
  const directory = await writeArtifacts({
    outputRoot: resolve(options.outputRoot),
    modelId: options.modelId,
    manifest,
    tensorIndex,
    budget,
    cachePlan,
    executionPlan,
    runConfig,
    proofEvents,
    report
  });

  console.log(JSON.stringify({
    model: options.modelId,
    revision: source.revision,
    artifact_directory: directory,
    downloaded_metadata_bytes: metadataBytes,
    full_weight_shards_downloaded: 0,
    layers: facts.hidden_layers,
    shards: tensorIndex.shard_count,
    tensor_detail: options.tensorDetail,
    execution_mode: options.executionMode,
    execution_plan_status: executionPlan.status,
    weight_cache: options.weightCache,
    speculative_tokens: options.speculativeTokens,
    classification: report.classification,
    next_experiment: report.next_experiment
  }, null, 2));
}
