# Goal Packet 01: Manifest-Only Estimator

Status: active

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

Inspect the repository's available language and packaging conventions, then choose the smallest CLI shape that can write the artifact contract.
