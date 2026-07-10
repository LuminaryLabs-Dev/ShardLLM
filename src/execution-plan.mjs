const EXECUTION_MODES = new Set(["local-stream", "remote-expert", "remote-block"]);
const WEIGHT_CACHE_MODES = new Set(["ram-only", "disk-bounded", "none"]);

function publicGatewayUrl(value) {
  if (!value) return null;

  const url = new URL(value);
  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new Error("Gateway URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Gateway URL must not contain credentials, query parameters, or fragments.");
  }
  return url.toString();
}

export function validateExecutionOptions(options) {
  if (!EXECUTION_MODES.has(options.executionMode)) {
    throw new Error(`Execution mode must be one of: ${[...EXECUTION_MODES].join(", ")}.`);
  }
  if (!WEIGHT_CACHE_MODES.has(options.weightCache)) {
    throw new Error(`Weight cache must be one of: ${[...WEIGHT_CACHE_MODES].join(", ")}.`);
  }
  if (!Number.isInteger(options.speculativeTokens) || options.speculativeTokens < 1 || options.speculativeTokens > 32) {
    throw new Error("Speculative token count must be an integer from 1 to 32.");
  }

  return { ...options, gatewayUrl: publicGatewayUrl(options.gatewayUrl) };
}

export function buildExecutionPlan({ source, executionMode, weightCache, ramCacheBytes, diskCacheBytes, speculativeTokens, gatewayUrl }) {
  const remote = executionMode !== "local-stream";
  const blockers = ["safetensors_header_ranges_unavailable", "executor_adapter_not_implemented"];
  if (remote && !gatewayUrl) blockers.push("gateway_url_not_configured");

  const stages = executionMode === "remote-expert"
    ? ["local_scheduler", "local_router", "remote_selected_experts", "local_state_update"]
    : executionMode === "remote-block"
      ? ["local_scheduler", "remote_layer_blocks", "local_state_update"]
      : ["local_scheduler", "range_fetch_weights", "local_layer_execution", "local_state_update"];

  return {
    schema_version: 1,
    created_at: new Date().toISOString(),
    source,
    status: "planned_not_executable",
    execution_mode: executionMode,
    data_motion: remote ? "activations_to_remote_compute" : "selected_weights_to_local_compute",
    gateway_url: gatewayUrl,
    stages,
    local_state: {
      scheduler: true,
      kv_state: "planned",
      ram_weight_cache_bytes: weightCache === "ram-only" ? ramCacheBytes : 0,
      disk_weight_cache_bytes: weightCache === "disk-bounded" ? diskCacheBytes : 0
    },
    speculative_verification: {
      enabled: speculativeTokens > 1,
      candidate_tokens: speculativeTokens,
      draft_source: "not_configured",
      verification_backend: "not_implemented"
    },
    blockers,
    security: {
      credentials_in_artifacts: false,
      activation_privacy_review_required: remote,
      tls_required_for_nonlocal_gateway: remote
    }
  };
}
