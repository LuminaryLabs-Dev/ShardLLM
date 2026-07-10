const GROUPS = [
  "embedding",
  "attention",
  "dense_mlp",
  "router",
  "routed_expert",
  "shared_expert",
  "norm",
  "head",
  "unknown"
];

function classifyTensor(name) {
  const value = name.toLowerCase();
  if (/(embed_tokens|token_embd|embeddings)\./.test(value)) return "embedding";
  if (/(lm_head|output\.weight)$/.test(value)) return "head";
  if (/shared_experts?\./.test(value)) return "shared_expert";
  if (/experts\.\d+\./.test(value)) return "routed_expert";
  if (/(mlp\.gate\.weight|router\.)/.test(value)) return "router";
  if (/(self_attn|self_attention|attention|\.attn\.)/.test(value)) return "attention";
  if (/(layernorm|layer_norm|\.norm\.)/.test(value)) return "norm";
  if (/\.mlp\./.test(value)) return "dense_mlp";
  return "unknown";
}

function matchNumber(name, expression) {
  const value = name.match(expression)?.[1];
  return value === undefined ? null : Number(value);
}

export function normalizeTensorIndex(index, source, { detail = "full" } = {}) {
  const weightMap = index.weight_map;
  if (!weightMap || typeof weightMap !== "object") {
    throw new Error("Safetensors index does not contain a weight_map.");
  }
  if (!new Set(["summary", "full"]).has(detail)) {
    throw new Error("Tensor detail must be summary or full.");
  }

  const groupCounts = Object.fromEntries(GROUPS.map((group) => [group, 0]));
  const records = [];
  const shards = new Set();
  const layers = new Set();
  for (const [tensorName, shard] of Object.entries(weightMap)) {
    const group = classifyTensor(tensorName);
    const layer = matchNumber(tensorName, /layers\.(\d+)\./);
    const expert = matchNumber(tensorName, /experts\.(\d+)\./);
    groupCounts[group] += 1;
    shards.add(shard);
    if (layer !== null) layers.add(layer);
    if (detail === "full") {
      records.push({
        source_tensor_name: tensorName,
        source_shard: shard,
        byte_range: null,
        dtype: null,
        byte_length: null,
        group,
        layer,
        expert
      });
    }
  }

  const shardList = [...shards].sort();
  const layerList = [...layers].sort((a, b) => a - b);

  const normalized = {
    schema_version: 1,
    created_at: new Date().toISOString(),
    source,
    parser_version: "0.1.0",
    detail,
    index_metadata: index.metadata ?? {},
    tensor_count: Object.keys(weightMap).length,
    shard_count: shardList.length,
    shards: shardList,
    layer_ids: layerList,
    unknown_tensor_count: groupCounts.unknown,
    group_counts: groupCounts,
    byte_ranges_discoverable: false,
    notes: [
      "Safetensors index maps tensors to shards but does not provide tensor byte offsets.",
      "A future range-header parser must populate byte_range, dtype, and byte_length."
    ]
  };
  if (detail === "full") normalized.tensors = records;
  return normalized;
}
