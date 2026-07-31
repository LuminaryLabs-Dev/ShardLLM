# Changelog

All notable project changes are documented here. Current behavior is defined by the implementation and documentation; planned runtime work is labeled explicitly.

## 0.1.0 - Unreleased

### Added

- Added the dependency-free Node.js `shardllm inspect <owner/model>` CLI for metadata-only model inspection.
- Added remote metadata, configuration, and safetensors-index reads without downloading full weight shards.
- Added normalized tensor-to-shard indexing with layer, expert, and tensor-group classification, with `full` and compact `summary` output.
- Added conservative memory and storage budgeting, plus feasibility reports classified as `estimator_only` until execution correctness is proven.
- Added versioned local planning artifacts: `manifest.json`, `tensor-index.json`, `budget.json`, `cache-plan.json`, `execution-plan.json`, `run-config.json`, `proof.jsonl`, and `report.json`.
- Added planning options for RAM-only, disk-bounded, and no-weight-cache policies; local-stream, remote-expert, and remote-block execution modes; and speculative-token settings.
- Added validation, artifact-contract, experiment, architecture, feasibility, KV-cache, hybrid-execution, roadmap, and model-target documentation.

### Verified

- Recorded manifest-only inspections for Kimi K2.6 and GLM-5.2 completed with zero full weight shards downloaded.

### Planned / Not Implemented

- Safetensors header range parsing for exact tensor byte ranges, dtypes, and active-expert window sizes.
- Weight fetching, bounded cache eviction, pause/resume, and executor adapters.
- Remote expert and remote block protocols, gateway communication, and speculative verification.
- KV-cache policy experiments and long-run runtime proof.

## Historical Notes

- 2026-07-08: Initialized the research scaffold and documented the project direction.
- 2026-07-09: Added the validation baseline, proof-artifact contracts, experiment matrix, and goal-mode tracking.
- 2026-07-10: Added the manifest estimator and hybrid-execution planning CLI.

## Release Status

No release tags are present in the inspected repository history. A published release date for version `0.1.0` is not recorded.
