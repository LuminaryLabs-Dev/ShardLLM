// Logical byte budgets only. No cache manager, executor, or expert routing is implemented.
export function enrichBudgetAndCache({ budget, tensorIndex, facts, source, weightCache, ramCacheBytes, diskBytes, configBytes, indexBytes, configUrl, indexUrl }) {
  const complete = tensorIndex.byte_accounting.status === "complete";
  const entries = [
    { content_id: "config.json", priority: 1, expected_bytes: configBytes, eviction_class: "metadata", recovery_source: configUrl },
    { content_id: "model.safetensors.index.json", priority: 1, expected_bytes: indexBytes, eviction_class: "metadata", recovery_source: indexUrl }
  ];
  const profiles = [];
  if (complete && tensorIndex.global_weight_bytes) entries.push({
    content_id: "global-model-weights", priority: 2, expected_bytes: tensorIndex.global_weight_bytes,
    eviction_class: "persistent_model_weights", recovery_source: "tensor-index.json",
    logical_only: true, range_resolution: "per_tensor_index"
  });
  if (complete) {
    for (const layer of tensorIndex.layer_bytes) {
      const k = facts.active_experts_per_token;
      const worstExperts = layer.experts.slice().sort((a, b) => b.bytes - a.bytes);
      // Unknown routing width cannot justify excluding any expert from the window.
      const selectedCount = Number.isInteger(k) && k >= 1 && k <= worstExperts.length ? k : worstExperts.length;
      const selectedExperts = worstExperts.slice(0, selectedCount);
      const nonRouted = layer.non_routed_bytes ?? 0;
      const packed = layer.packed_routed_expert_bytes ?? 0;
      const expertBytes = selectedExperts.reduce((sum, expert) => sum + expert.bytes, 0);
      const selectedWindowBytes = nonRouted + packed + expertBytes;
      profiles.push({ layer: layer.layer, non_routed_bytes: nonRouted,
        packed_expert_fallback_bytes: packed, active_expert_count_assumed: selectedCount,
        worst_case_selected_expert_bytes: expertBytes, active_window_bytes: selectedWindowBytes,
        selection: "worst_case_top_k_by_size_not_actual_router_output" });
      if (nonRouted + packed) entries.push({
        content_id: `layer-${layer.layer}-base`, priority: 2, expected_bytes: nonRouted + packed,
        eviction_class: "layer_weights", recovery_source: "tensor-index.json",
        logical_only: true, range_resolution: "per_tensor_index"
      });
      if (expertBytes) entries.push({
        content_id: `layer-${layer.layer}-selected-experts`, priority: 3, expected_bytes: expertBytes,
        eviction_class: "routed_expert_weights", recovery_source: "tensor-index.json",
        logical_only: true, range_resolution: "router_selection_required"
      });
    }
  }
  const largestShard = complete ? Math.max(0, ...tensorIndex.shard_details.map((s) => s.whole_shard_bytes)) : null;
  const largestWindow = complete ? (tensorIndex.global_weight_bytes ?? 0) + Math.max(0, ...profiles.map((p) => p.active_window_bytes)) : null;
  const coldSelectedPassBytes = complete ? (tensorIndex.global_weight_bytes ?? 0) + profiles.reduce((sum, p) => sum + p.active_window_bytes, 0) : null;
  budget.range_read_policy = complete ? "safetensors_header_ranges_verified; tensor_payload_reads_not_implemented" : "planned; header range proof incomplete";
  budget.observed.largest_whole_shard_fallback_bytes = largestShard;
  budget.estimates.active_window_bytes = largestWindow;
  budget.estimates.global_weight_bytes = complete ? tensorIndex.global_weight_bytes : null;
  budget.estimates.max_cold_selected_pass_bytes = coldSelectedPassBytes;
  budget.estimates.cold_token_network_bytes = null;
  budget.feasibility.active_slice_fit = complete ? largestWindow <= budget.host.memory_budget_bytes : "unknown";
  budget.feasibility.reason = complete
    ? "Header byte accounting is complete, but cache execution, peak RAM, and model correctness are unproven."
    : "Safetensors byte accounting, cache execution, or model correctness is unproven.";
  budget.assumptions = [...budget.assumptions, "Active-window estimates use the largest K experts by bytes, not actual router outputs.", "Packed expert tensors require a full packed-tensor fallback and cannot be sliced per expert without proven layout."];
  const capacity = weightCache === "ram-only" ? ramCacheBytes : weightCache === "disk-bounded" ? diskBytes : 0;
  const cachePlan = {
    schema_version: 1, created_at: new Date().toISOString(), source,
    policy: weightCache, ram_weight_cache_bytes: weightCache === "ram-only" ? ramCacheBytes : 0,
    disk_weight_cache_bytes: weightCache === "disk-bounded" ? diskBytes : 0,
    metadata_artifacts_persisted: true, entries,
    capacity_assessment: {
      status: !complete ? "unmeasured" : largestWindow <= capacity ? "logical_window_fits_policy_limit" : "logical_window_exceeds_policy_limit",
      policy_limit_bytes: capacity, largest_planned_window_bytes: largestWindow,
      note: "Conservatively holds global weights plus the largest layer selection. This is logical bytes, not measured peak RSS."
    },
    planned_layer_windows: profiles,
    deferred_weight_plan: {
      status: complete ? "range_metadata_ready_executor_missing" : "blocked_on_safetensors_header_parser",
      reason: complete ? "Logical cache plan only; tensor fetching, eviction, router and executor are not implemented." : "Index alone does not identify all tensor byte ranges."
    }
  };
  return { budget, cachePlan };
}
