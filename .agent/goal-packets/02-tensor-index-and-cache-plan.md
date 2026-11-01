# Goal Packet 02: Tensor Index and Cache Plan

Status: active

## Outcome

Normalize tensor-index data and produce a bounded cache plan for a target device.

## Success Criteria

- Classify tensors by layer and group, preserving explicit `unknown` records.
- Reconcile indexed byte totals and report discrepancies.
- Identify whole-shard fallback costs and active-slice opportunities.
- Produce a cache plan under a declared RAM, disk, and network policy.
- Produce an execution plan for local-stream, remote-expert, or remote-block mode.
- Support RAM-only weight-cache planning and compact per-run tensor summaries.
- Record speculative verification as planned until a draft source and verifier exist.
- Pass `docs/validation.md` Gate 2 and cache simulation evidence.

## Dependency

Packet 01 provides the source manifest and retrieved index.

## Current Progress

- CLI options and `execution-plan.json` now represent local and hybrid boundaries.
- Compact `summary` tensor output is available without removing existing `full` behavior.
- Remote adapters, cache enforcement, and speculative verification remain unimplemented.
- `npm run check` and a compact Kimi K2.6 remote-expert planning run passed with zero weight shards downloaded and eight small proof artifacts.

## Source Integration — 2026-10-31

- Implemented opt-in safetensors header-only HTTP 206 range inspection (`--fetch-shard-headers`), with strict bounds, file-size/ETag consistency checks, and closed-failure behavior.
- Reconciles tensor byte ranges and dtype/shape against index mappings; provides group, layer, expert, shard, unknown, and mismatch accounting.
- Produces conservative logical active-window, whole-shard fallback, and RAM/disk cache policy estimates. These are planning artifacts, not measured runtime caches.
- The default `inspect` remains index-only; execution modes are still `planned_not_executable`.
- Sandboxed Node syntax check passed. Seven offline synthetic cases passed: valid, metadata-only, ignored range, bad offset, large header, changed ETag, and index-total mismatch. Fixture indexed tensor bytes matched exactly at **30/30** on the valid case, with no weight payload consumed; this is not large-model proof.
- Changes were pushed to `main` with no test branch. Source integrity verified against the sandbox file hashes.

**Still open:** inspect real Kimi K2.6 / GLM-5.2 headers, reconcile their packed MoE layouts, pass live Gate 2, and run E2 cold/warm cache simulation under declared limits. Keep this packet **active**; do not promote Gate 3 execution claims.
