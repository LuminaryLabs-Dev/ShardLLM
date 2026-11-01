import os from "node:os";
import { resolve } from "node:path";
import { writeArtifacts } from "./artifacts.mjs";
import { enrichBudgetAndCache } from "./cache-plan.mjs";
import { buildBudget, defaultBudgets, modelFacts } from "./estimator.mjs";
import { buildExecutionPlan, validateExecutionOptions } from "./execution-plan.mjs";
import { inspectHuggingFaceModel } from "./huggingface-client.mjs";
import { inspectSafetensorsHeaders } from "./safetensors-header.mjs";
import { normalizeTensorIndex } from "./tensor-index.mjs";

const VERSION = "0.1.0";
function usage() {
  return [
    "Usage:", "  shardllm inspect <owner/model> [options]", "", "Options:",
    "  --output <directory>", "  --ram-gb <number>", "  --disk-gb <number>",
    "  --ram-cache-gb <number>", "  --weight-cache <ram-only|disk-bounded|none>",
    "  --execution-mode <local-stream|remote-expert|remote-block>",
    "  --gateway-url <http(s)://endpoint>", "  --speculative-tokens <1-32>",
    "  --tensor-detail <full|summary>",
    "  --fetch-shard-headers    opt-in HTTP byte-range header inspection; never fetches weights",
    "", "By default reads public metadata, config, and safetensors index only."
  ].join("\n");
}
function parseArgs(args) {
  if (args[0] !== "inspect" || !args[1]) throw new Error(usage());
  const options = { modelId: args[1], outputRoot: ".shardllm-cache", executionMode: "local-stream", weightCache: "ram-only", speculativeTokens: 1, tensorDetail: "full", fetchShardHeaders: false };
  const supported = new Set(["--output", "--ram-gb", "--disk-gb", "--ram-cache-gb", "--weight-cache", "--execution-mode", "--gateway-url", "--speculative-tokens", "--tensor-detail"]);
  for (let i = 2; i < args.length; i++) {
    const option = args[i];
    if (option === "--fetch-shard-headers") { options.fetchShardHeaders = true; continue; }
    const value = args[++i];
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
  }
  for (const [name, value] of [["RAM", options.ramGb], ["disk", options.diskGb], ["RAM cache", options.ramCacheGb]]) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new Error(`${name} budget must be a non-negative number.`);
  }
  if (!new Set(["summary", "full"]).has(options.tensorDetail)) throw new Error("Tensor detail must be summary or full.");
  return validateExecutionOptions(options);
}
function event(runId, sequence, name, payload) {
  return { schema_version: 1, run_id: runId, sequence, timestamp: new Date().toISOString(), event: name, payload };
}
export async function runCli(args) {
  const options = parseArgs(args);
  const source = await inspectHuggingFaceModel(options.modelId);
  const now = new Date().toISOString();
  const runId = `inspect-${now.replace(/[:.]/g, "-")}`;
  const sourceIdentity = { provider: "huggingface", model_id: options.modelId, revision: source.revision };
  // Index-only mode remains the default, preserving the existing three metadata requests.
  const headerInspection = options.fetchShardHeaders ? await inspectSafetensorsHeaders({
    modelId: options.modelId, revision: source.revision,
    shards: [...new Set(Object.values(source.index.json.weight_map ?? {}))].sort()
  }) : null;
  const tensorIndex = normalizeTensorIndex(source.index.json, sourceIdentity, { detail: options.tensorDetail, headerInspection });
  const facts = modelFacts(source.config.json);
  const { ramBytes, diskBytes, ramCacheBytes } = defaultBudgets({ ramGb: options.ramGb, diskGb: options.diskGb, ramCacheGb: options.ramCacheGb, hostRamBytes: os.totalmem() });
  if (ramCacheBytes > ramBytes) throw new Error("RAM cache budget cannot exceed the total RAM budget.");
  let budget = buildBudget({ facts, publishedStorageBytes: source.api.json.usedStorage ?? null,
    indexedStorageBytes: source.index.json.metadata?.total_size ?? null,
    shardCount: tensorIndex.shard_count, ramBytes, diskBytes, ramCacheBytes, weightCache: options.weightCache });
  const { budget: enrichedBudget, cachePlan } = enrichBudgetAndCache({ budget, tensorIndex, facts, source: sourceIdentity,
    weightCache: options.weightCache, ramCacheBytes, diskBytes,
    configBytes: source.config.bytes, indexBytes: source.index.bytes, configUrl: source.configUrl, indexUrl: source.indexUrl });
  budget = enrichedBudget;
  const executionPlan = buildExecutionPlan({ source: sourceIdentity, executionMode: options.executionMode,
    weightCache: options.weightCache, ramCacheBytes, diskCacheBytes: diskBytes,
    speculativeTokens: options.speculativeTokens, gatewayUrl: options.gatewayUrl });
  if (tensorIndex.byte_accounting.status === "complete") {
    executionPlan.blockers = executionPlan.blockers.filter((blocker) => blocker !== "safetensors_header_ranges_unavailable");
  }
  const metadataBytes = source.api.bytes + source.config.bytes + source.index.bytes + (headerInspection?.metadata_request_bytes ?? 0);
  const manifest = {
    schema_version: 1, created_at: now, source: sourceIdentity, retrieved_at: now,
    api_url: source.apiUrl, config_url: source.configUrl, index_url: source.indexUrl,
    published_storage_bytes: source.api.json.usedStorage ?? null,
    indexed_storage_bytes: source.index.json.metadata?.total_size ?? null,
    shards: tensorIndex.shards, downloaded_metadata_bytes: metadataBytes,
    metadata_requests: [
      { url: source.apiUrl, bytes: source.api.bytes, etag: source.api.etag },
      { url: source.configUrl, bytes: source.config.bytes, etag: source.config.etag },
      { url: source.indexUrl, bytes: source.index.bytes, etag: source.index.etag },
      ...(headerInspection?.inspected_shards ?? []).flatMap((shard) => shard.requests.map((request) => ({ url: request.url, range: [request.start, request.end], bytes: request.bytes, etag: request.etag }))),
      ...(headerInspection?.failures ?? []).flatMap((failure) => (failure.requests ?? []).map((request) => ({ url: `https://huggingface.co/${options.modelId}/resolve/${encodeURIComponent(source.revision)}/${failure.shard}`, range: [request.start, request.end], bytes: request.bytes, etag: request.etag, outcome: "header_inspection_failed" })))
    ],
    header_inspection: headerInspection === null ? "not_requested" : {
      requested_shards: tensorIndex.shard_count,
      inspected_shards: headerInspection.inspected_shards.length,
      failed_shards: headerInspection.failures.length,
      failed_shard_reasons: headerInspection.failures
    },
    full_weight_shards_downloaded: 0,
    weight_payload_bytes_downloaded: 0
  };
  const runConfig = {
    schema_version: 1, created_at: now, shardllm_version: VERSION, backend: null, source: sourceIdentity,
    host: { platform: os.platform(), architecture: os.arch(), total_memory_bytes: os.totalmem() },
    budgets: { memory_bytes: ramBytes, disk_cache_bytes: diskBytes }, dtype: facts.dtype,
    tensor_detail: options.tensorDetail, fetch_shard_headers: options.fetchShardHeaders,
    cache_policy: options.weightCache, execution: { mode: options.executionMode, gateway_url: executionPlan.gateway_url, speculative_tokens: options.speculativeTokens },
    kv_policy: "not_started", prompt_suite: null
  };
  const byteStatus = tensorIndex.byte_accounting.status;
  const proofEvents = [
    event(runId, 1, "metadata_read", { downloaded_metadata_bytes: metadataBytes, full_weight_shards_downloaded: 0, weight_payload_bytes_downloaded: 0 }),
    event(runId, 2, "tensor_index_built", { tensor_count: tensorIndex.tensor_count, shard_count: tensorIndex.shard_count, unknown_tensor_count: tensorIndex.unknown_tensor_count }),
    event(runId, 3, "safetensors_headers_inspected", { status: byteStatus, shards_checked: tensorIndex.byte_accounting.checked_shards, shards_total: tensorIndex.shard_count, failure_count: headerInspection?.failures.length ?? 0 }),
    event(runId, 4, "tensor_byte_accounted", { status: byteStatus, accounted_bytes: tensorIndex.byte_accounting.accounted_tensor_bytes, index_difference_bytes: tensorIndex.byte_accounting.index_difference_bytes, unresolved_tensors: tensorIndex.byte_accounting.unresolved_tensor_count }),
    event(runId, 5, "budget_estimated", { classification: budget.feasibility.classification, active_window_bytes: budget.estimates.active_window_bytes, whole_layer_fit: budget.feasibility.whole_layer_fit }),
    event(runId, 6, "execution_plan_built", { mode: options.executionMode, status: executionPlan.status, blockers: executionPlan.blockers })
  ];
  const report = {
    schema_version: 1, created_at: now, source: sourceIdentity,
    claim_level: byteStatus === "complete" ? "plannable" : "inspectable", classification: "estimator_only",
    validation_gates: {
      metadata_and_index: "passed", byte_accounting: byteStatus === "complete" ? "passed" : byteStatus === "not_requested" ? "not_started" : "partial",
      executor_correctness: "not_started", hybrid_execution: "planned", bounded_cache: "not_started", pause_resume: "not_started", kv_policy: "not_started"
    },
    measured: { downloaded_metadata_bytes: metadataBytes, full_weight_shards_downloaded: 0, weight_payload_bytes_downloaded: 0,
      accounted_tensor_bytes: tensorIndex.byte_accounting.accounted_tensor_bytes,
      index_difference_bytes: tensorIndex.byte_accounting.index_difference_bytes },
    estimates: budget.estimates,
    limitations: [
      ...(byteStatus !== "complete" ? ["Exact byte reconciliation incomplete; inspect shard headers and resolve mismatches."] : []),
      "Cache windows are conservative logical plans, not measured resident memory or executable cache entries.",
      "Remote expert/block adapters and speculative verification are planning surfaces only.",
      "No executor, cache eviction, pause/resume, or KV proof was run."
    ],
    next_experiment: byteStatus === "complete" ? "Simulate cold and warm bounded active-slice cache behavior before executor work." : "Fetch safetensors headers by byte range and reconcile every indexed tensor."
  };
  const directory = await writeArtifacts({ outputRoot: resolve(options.outputRoot), modelId: options.modelId,
    manifest, tensorIndex, budget, cachePlan, executionPlan, runConfig, proofEvents, report });
  console.log(JSON.stringify({ model: options.modelId, revision: source.revision, artifact_directory: directory,
    downloaded_metadata_bytes: metadataBytes, full_weight_shards_downloaded: 0,
    layers: facts.hidden_layers, shards: tensorIndex.shard_count,
    tensor_detail: options.tensorDetail, byte_accounting: byteStatus,
    execution_mode: options.executionMode, execution_plan_status: executionPlan.status,
    weight_cache: options.weightCache, speculative_tokens: options.speculativeTokens,
    classification: report.classification, next_experiment: report.next_experiment }, null, 2));
}
