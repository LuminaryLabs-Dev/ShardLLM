# Agent Memory

Status: active

## Durable Project Facts

- The first target is an estimator that reads remote metadata and safetensors indexes without downloading full model weights.
- MoE expert-level planning is more promising than whole-layer planning because a full sparse layer may exceed MacBook Air memory.
- Hugging Face is a source and cache-fill origin, not a dependable per-token runtime transport.
- Feasibility requires separate evidence for correctness, resource bounds, resume behavior, and KV quality.

## Working Conventions

- Keep run inputs and results in versioned, public-safe artifacts described by `../docs/artifact-contracts.md`.
- Treat unknown tensor groups and unsupported backend features as explicit report fields, not hidden assumptions.
- Capture reusable results in `lessons/`; capture user corrections or review concerns in `feedback-packets/`.
