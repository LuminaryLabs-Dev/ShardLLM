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
