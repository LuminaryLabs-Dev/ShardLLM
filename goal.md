# ShardLLM Goal

Status: active

## Goal

Create a public research runtime that can estimate, schedule, and eventually execute massive LLM inference through shard-aware layer or expert streaming on constrained hardware.

## Success Criteria

- A model can be inspected from remote metadata without downloading all weights.
- The runtime can produce a per-layer and per-expert memory budget.
- The runtime can build a resumable local cache plan for only the needed tensors.
- The runtime can run or simulate layer-by-layer execution under a configured RAM and disk budget.
- KV cache strategies are measured separately from weight streaming.
- The project can clearly report when a model is feasible, barely feasible, or not feasible on a target device.
- Nexus Engine domain-kit promotion is considered only after the standalone harness has proof.

## First Milestone

Build a manifest-only estimator for Kimi K2.6 and GLM-5.2 that reports:

- total model storage
- layer count
- estimated average layer size
- attention/shared/expert tensor groups where discoverable
- minimum local cache window
- expected MacBook Air feasibility band
