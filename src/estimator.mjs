const GIB = 1024 ** 3;

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function nestedConfig(config) {
  return config.text_config ?? config;
}

function firstDefined(config, keys) {
  for (const key of keys) {
    if (config[key] !== undefined && config[key] !== null) return config[key];
  }
  return null;
}

export function modelFacts(config) {
  const value = nestedConfig(config);
  return {
    model_type: firstDefined(value, ["model_type"]),
    dtype: firstDefined(value, ["torch_dtype", "dtype"]),
    hidden_layers: numberOrNull(firstDefined(value, ["num_hidden_layers"])),
    hidden_size: numberOrNull(firstDefined(value, ["hidden_size"])),
    routed_experts: numberOrNull(firstDefined(value, ["n_routed_experts", "num_local_experts"])),
    active_experts_per_token: numberOrNull(firstDefined(value, ["num_experts_per_tok", "num_experts_per_token"])),
    max_position_embeddings: numberOrNull(firstDefined(value, ["max_position_embeddings"])),
    first_dense_layers: numberOrNull(firstDefined(value, ["first_k_dense_replace"])),
    quantization: value.quantization_config?.format ?? null
  };
}

export function buildBudget({ facts, publishedStorageBytes, indexedStorageBytes, shardCount, ramBytes, diskBytes, ramCacheBytes, weightCache }) {
  const storageBytes = publishedStorageBytes ?? indexedStorageBytes ?? null;
  const averageLayerBytes = storageBytes && facts.hidden_layers ? Math.round(storageBytes / facts.hidden_layers) : null;
  const averageShardBytes = storageBytes && shardCount ? Math.round(storageBytes / shardCount) : null;
  const wholeLayerFits = averageLayerBytes === null ? "unknown" : averageLayerBytes <= ramBytes * 0.45;
  const activeExpertFraction = facts.active_experts_per_token && facts.routed_experts
    ? facts.active_experts_per_token / facts.routed_experts
    : null;

  return {
    schema_version: 1,
    created_at: new Date().toISOString(),
    host: {
      memory_budget_bytes: ramBytes,
      disk_cache_budget_bytes: diskBytes,
      ram_weight_cache_bytes: weightCache === "ram-only" ? ramCacheBytes : 0,
      disk_weight_cache_bytes: weightCache === "disk-bounded" ? diskBytes : 0
    },
    cache_policy: weightCache,
    range_read_policy: "planned; safetensors header parser not implemented",
    observed: {
      published_storage_bytes: publishedStorageBytes,
      indexed_storage_bytes: indexedStorageBytes,
      shard_count: shardCount,
      model: facts
    },
    estimates: {
      average_layer_bytes: averageLayerBytes,
      average_shard_bytes: averageShardBytes,
      active_expert_fraction: activeExpertFraction,
      active_window_bytes: null,
      kv_allocation_bytes: null,
      cold_token_network_bytes: null
    },
    feasibility: {
      classification: "estimator_only",
      whole_layer_fit: wholeLayerFits,
      active_slice_fit: "unknown",
      reason: "No safetensors byte-range sizing or executor correctness proof exists yet."
    },
    assumptions: [
      "Average layer and shard sizes are planning estimates, not tensor-level measurements.",
      "Active expert memory and network cost require safetensors header byte ranges.",
      "A model is not runnable merely because its metadata is inspectable."
    ]
  };
}

export function defaultBudgets({ ramGb, diskGb, ramCacheGb, hostRamBytes }) {
  const totalRamGb = ramGb ?? hostRamBytes / GIB;
  return {
    ramBytes: Math.round(totalRamGb * GIB),
    diskBytes: Math.round((diskGb ?? 32) * GIB),
    ramCacheBytes: Math.round((ramCacheGb ?? Math.min(1, totalRamGb / 4)) * GIB)
  };
}
