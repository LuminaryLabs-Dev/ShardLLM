# Roadmap

Status: active

## Phase 0 - Documentation Baseline

Goal: capture the project idea, feasibility boundaries, architecture, model targets, KV risk, and Nexus Engine path.

Status: complete

Exit criteria:

- docs folder exists
- README links to docs
- model target metadata is recorded
- first milestone is clear
- validation gates, experiment order, and proof artifact contracts are documented

## Phase 1 - Manifest-Only Estimator

Goal: inspect model repositories without downloading full weights.

Expected commands:

```text
shardllm inspect moonshotai/Kimi-K2.6
shardllm inspect zai-org/GLM-5.2
```

Output:

- config fields
- storage size
- shard count
- tensor index availability
- rough layer budget
- MacBook Air feasibility band

## Phase 2 - Tensor Index Parser

Goal: parse `model.safetensors.index.json` and group tensors.

Groups:

- embeddings
- attention
- dense MLP
- routed experts
- shared experts
- norms
- output head

Output:

- per-layer byte map
- per-expert byte map
- largest tensor groups
- minimum cache window estimate

## Phase 3 - Cache Planner

Goal: create a local cache plan under a fixed disk and RAM budget.

Inputs:

- target model
- target device memory
- max disk cache
- network policy
- whole-shard vs range-read policy
- RAM-only vs disk-bounded weight policy
- local-stream vs remote-expert vs remote-block execution mode
- speculative candidate count

Output:

- cache layout
- eviction policy
- resume plan
- expected network cost
- execution-plan artifact and unresolved adapter blockers

## Phase 4 - Execution Spike

Goal: run one small target path through a backend.

Candidate backends:

- llama.cpp where architecture support exists
- Transformers for reference correctness
- custom safetensors + Metal/CPU spike for a narrow layer group
- remote expert adapter against a small reference MoE
- remote block adapter against a small reference transformer

Success means one layer or active expert group can be loaded, run, measured, and evicted.

Speculative verification follows only after one-token reference correctness exists.

## Phase 5 - KV Manager

Goal: measure KV memory growth and test bounding policies.

Start simple:

- context cap
- projected KV bytes
- quantized KV where backend supports it
- page/offload experiments

Then test:

- summary memory
- distillation
- learned reconstruction

## Phase 6 - Long-Run Harness

Goal: let a constrained device run slowly without losing state.

Requirements:

- pause/resume
- proof JSONL
- checkpointed cache state
- failure reports
- thermal and memory logging where available

## Phase 7 - Nexus Engine Domain Kit Candidate

Goal: promote only the stable parts into Nexus Engine.

Candidate kits:

- `model-source-kit`
- `shard-manifest-kit`
- `tensor-budget-kit`
- `bounded-cache-kit`
- `kv-state-kit`
- `runtime-proof-kit`

Promotion requires standalone proof first.
