const GROUPS = ["embedding", "attention", "dense_mlp", "router", "routed_expert", "shared_expert", "norm", "head", "unknown"];

function classifyTensor(name) {
  const value = name.toLowerCase();
  if (/(embed_tokens|token_embd|embeddings)\./.test(value)) return "embedding";
  if (/(lm_head|output\.weight)$/.test(value)) return "head";
  if (/shared_experts?(\.|$)/.test(value)) return "shared_expert";
  if (/(^|\.)experts(\.|$)/.test(value)) return "routed_expert";
  if (/(mlp\.gate\.weight|router\.|gate\.weight$)/.test(value)) return "router";
  if (/(self_attn|self_attention|attention|\.attn\.)/.test(value)) return "attention";
  if (/(layernorm|layer_norm|\.norm\.)/.test(value)) return "norm";
  if (/\.mlp\./.test(value)) return "dense_mlp";
  return "unknown";
}
function matchNumber(name, expression) {
  const value = name.match(expression)?.[1];
  return value === undefined ? null : Number(value);
}
function add(map, key, bytes) {
  const value = (map.get(key) ?? 0) + bytes;
  if (!Number.isSafeInteger(value)) throw new Error("Tensor byte aggregate exceeds integer precision");
  map.set(key, value);
}

export function normalizeTensorIndex(index, source, { detail = "full", headerInspection = null } = {}) {
  const weightMap = index.weight_map;
  if (!weightMap || typeof weightMap !== "object" || Array.isArray(weightMap)) throw new Error("Safetensors index does not contain a weight_map.");
  if (!new Set(["summary", "full"]).has(detail)) throw new Error("Tensor detail must be summary or full.");

  const groupCounts = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  const groupBytes = new Map(GROUPS.map((g) => [g, 0]));
  const records = [];
  const shards = new Set();
  const layers = new Set();
  const layerTotals = new Map();
  const layerStatic = new Map();
  const layerPacked = new Map();
  const perExpert = new Map();
  const perShard = new Map();
  let globalWeightBytes = 0;
  const headerByShard = new Map((headerInspection?.inspected_shards ?? []).map((h) => [h.shard, h]));
  let accountedBytes = 0, unknownGroupBytes = 0, unresolvedCount = 0;
  const mismatches = [];
  const seenHeader = new Map();
  for (const [name, shard] of Object.entries(weightMap)) {
    if (typeof shard !== "string") throw new Error("Weight map shard path must be a string");
    const group = classifyTensor(name);
    const layer = matchNumber(name, /(?:^|\.)layers\.(\d+)\./);
    const expert = matchNumber(name, /(?:^|\.)experts\.(\d+)\./);
    groupCounts[group]++;
    shards.add(shard);
    if (layer !== null) layers.add(layer);
    const header = headerByShard.get(shard);
    const tensor = header?.records[name] ?? null;
    if (!tensor) {
      unresolvedCount++;
      if (header) mismatches.push({ type: "indexed_tensor_missing_from_header", shard, tensor: name });
    } else {
      add(seenHeader, shard, 1);
      accountedBytes += tensor.byte_length;
      if (!Number.isSafeInteger(accountedBytes)) throw new Error("Tensor byte sum exceeds integer precision");
      add(groupBytes, group, tensor.byte_length);
      add(perShard, shard, tensor.byte_length);
      if (group === "unknown") unknownGroupBytes += tensor.byte_length;
      if (layer === null) globalWeightBytes += tensor.byte_length;
      if (layer !== null) {
        add(layerTotals, layer, tensor.byte_length);
        if (group === "routed_expert") {
          if (expert === null) add(layerPacked, layer, tensor.byte_length);
          else add(perExpert, `${layer}:${expert}`, tensor.byte_length);
        } else add(layerStatic, layer, tensor.byte_length);
      }
    }
    if (detail === "full") records.push({
      source_tensor_name: name, source_shard: shard,
      byte_range: tensor?.byte_range ?? null, dtype: tensor?.dtype ?? null,
      byte_length: tensor?.byte_length ?? null, shape: tensor?.shape ?? null,
      group, layer, expert
    });
  }

  for (const header of headerByShard.values()) {
    for (const name of Object.keys(header.records)) {
      if (weightMap[name] !== header.shard) {
        mismatches.push({ type: "header_tensor_not_indexed_in_same_shard", shard: header.shard, tensor: name });
      }
    }
    if (header.gap_bytes || header.trailing_bytes) {
      mismatches.push({ type: "unaccounted_shard_payload", shard: header.shard, gap_bytes: header.gap_bytes, trailing_bytes: header.trailing_bytes });
    }
  }
  const shardList = [...shards].sort();
  const layerList = [...layers].sort((a, b) => a - b);
  const indexBytes = index.metadata?.total_size ?? null;
  const validIndexBytes = Number.isSafeInteger(indexBytes) && indexBytes >= 0;
  const difference = validIndexBytes && unresolvedCount === 0 ? accountedBytes - indexBytes : null;
  if (difference !== null && difference !== 0) mismatches.push({ type: "index_total_size_mismatch", indexed_bytes: indexBytes, accounted_bytes: accountedBytes });
  const allInspected = headerInspection !== null && headerInspection.failures.length === 0 && headerByShard.size === shardList.length;
  const complete = allInspected && unresolvedCount === 0 && mismatches.length === 0 && validIndexBytes;
  const detailPerLayer = layerList.map((layer) => {
    const experts = [...perExpert.entries()]
      .filter(([key]) => key.startsWith(`${layer}:`))
      .map(([key, bytes]) => ({ expert: Number(key.slice(key.indexOf(":") + 1)), bytes }))
      .sort((a, b) => a.expert - b.expert);
    return { layer, total_bytes: layerTotals.get(layer) ?? null,
      non_routed_bytes: layerStatic.get(layer) ?? null,
      packed_routed_expert_bytes: layerPacked.get(layer) ?? null, experts };
  });
  const normalized = {
    schema_version: 1, created_at: new Date().toISOString(), source,
    parser_version: "0.2.0", detail, index_metadata: index.metadata ?? {},
    tensor_count: Object.keys(weightMap).length,
    shard_count: shardList.length, shards: shardList, layer_ids: layerList,
    unknown_tensor_count: groupCounts.unknown, group_counts: groupCounts,
    byte_ranges_discoverable: complete,
    byte_accounting: {
      status: headerInspection === null ? "not_requested" : complete ? "complete" : "partial",
      indexed_storage_bytes: validIndexBytes ? indexBytes : null,
      accounted_tensor_bytes: headerInspection === null ? null : accountedBytes,
      unknown_group_bytes: headerInspection === null ? null : unknownGroupBytes,
      unresolved_tensor_count: unresolvedCount,
      index_difference_bytes: difference,
      checked_shards: headerByShard.size,
      failed_shards: headerInspection?.failures ?? [],
      mismatches
    },
    group_bytes: headerInspection === null ? null : Object.fromEntries(groupBytes),
    global_weight_bytes: headerInspection === null ? null : globalWeightBytes,
    shard_details: headerInspection === null ? null : shardList.map((shard) => {
      const h = headerByShard.get(shard);
      return h ? {
        shard, indexed_tensor_bytes: perShard.get(shard) ?? 0,
        header_tensor_bytes: h.tensor_bytes, header_bytes: h.header_bytes, whole_shard_bytes: h.file_bytes,
        gap_bytes: h.gap_bytes, trailing_bytes: h.trailing_bytes
      } : { shard, indexed_tensor_bytes: null, whole_shard_bytes: null };
    }),
    layer_bytes: headerInspection === null ? null : detailPerLayer,
    notes: complete ? ["Offsets are absolute, half-open HTTP byte ranges derived from safetensors headers.", "Header bytes were fetched; no weight payload was fetched."] : [
      "A safetensors index maps names to shards but does not contain tensor offsets.",
      headerInspection === null ? "Use --fetch-shard-headers to inspect bounded header ranges only." : "Some headers were inaccessible or failed byte reconciliation; execution remains blocked."
    ]
  };
  if (detail === "full") normalized.tensors = records;
  return normalized;
}
