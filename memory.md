# ShardLLM Memory

## Purpose

ShardLLM is a public LuminaryLabs-Dev research repository for sharded large-model inference on constrained devices.

The durable objective is to explore whether massive models can be run slowly from small machines by streaming and caching only the required model pieces instead of downloading or loading the full model at once.

## Architecture Shape

ShardLLM should be designed as a small set of separable runtime domains:

```text
model-source
-> shard-manifest
-> tensor-index
-> layer-or-expert-scheduler
-> bounded-cache
-> executor-adapter
-> kv-state-manager
-> proof-harness
```

## Major Conventions

- Prefer metadata and shard-index inspection before downloading weights.
- Treat Hugging Face as the remote source of model shards, not as a reliable per-token runtime backing store.
- Cache locally by explicit budget, with eviction and resume support.
- For MoE models, prefer active-expert streaming over whole-layer streaming.
- Keep KV cache work as a first-class domain because long-context KV growth is likely the main constraint.
- Make every feasibility claim proof-backed with measured memory, disk, network, and token timing.
- Separate correctness, resource bounds, resume behavior, and KV quality in versioned validation artifacts; no single measurement establishes feasibility.
- Keep Nexus Engine integration as a later domain-kit promotion path, not the first implementation step.
- Use `.agent/` as the goal-mode workspace for live progress, subgoals, lessons, feedback, and resumable agent handoff.

## Initial Model Targets

- Kimi K2.6-style MoE models are the better first target because active expert loading may reduce per-step memory.
- GLM-5.2-style long-context MoE models are a harder target because full BF16 layer windows are much larger.

## Public Repo Safety

- Do not commit tokens, `.env` files, browser profiles, private keys, downloaded gated weights, auth caches, or private logs.
- Keep feasibility notes public-safe and source-backed.
