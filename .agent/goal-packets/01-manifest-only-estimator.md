# Goal Packet 01: Manifest-Only Estimator

Status: validated

## Outcome

Provide `shardllm inspect <owner/model>` or an equivalent narrow entrypoint that inspects public model metadata and emits planning artifacts without downloading full weights.

## Scope

- Kimi K2.6 and GLM-5.2 are the first report targets.
- Read config, repository metadata, and safetensors index when public and available.
- Estimate storage, shard count, layers, routed experts, active experts, and feasibility band.
- Record unknown or unsupported fields explicitly.

## Evidence

- A saved manifest proves remote reads and downloaded metadata bytes.
- A report distinguishes observed fields from estimates.
- No full shard payload appears in the cache.
- `docs/validation.md` Gate 1 passes.

## Non-Goals

- No full model download.
- No execution backend.
- No claim that a target model runs locally.

## Next Action

Advance to `02-tensor-index-and-cache-plan.md` to add safetensors-header range parsing and exact byte accounting.

## Validation Evidence

- `npm run check` passed on Node.js 25.8.1.
- `shardllm inspect` completed for `moonshotai/Kimi-K2.6` and `zai-org/GLM-5.2`.
- The Kimi run recorded 23,616,111 metadata bytes, 208,550 tensors, 64 shards, and zero weight shards downloaded.
- The GLM run recorded 5,435,229 metadata bytes, 59,585 tensors, 282 shards, and zero weight shards downloaded.
- Both reports remain classified as `estimator_only`; byte-range sizing and executor proof are not claimed.
