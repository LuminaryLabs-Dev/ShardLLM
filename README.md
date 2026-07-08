# ShardLLM

ShardLLM is a research runtime for exploring very large language model inference on constrained devices without requiring the full model to be downloaded or resident in memory.

The core idea is to treat model execution as a sharded, throttled, resumable process:

```text
remote model manifest
-> tensor and shard index
-> active layer or expert selection
-> bounded local cache
-> layer-by-layer execution
-> compressed or paged KV state
-> resumable generation harness
```

## Purpose

ShardLLM exists to test whether large MoE and long-context models can be explored from small machines by prioritizing memory bounds and persistence over token speed.

The first target is feasibility, not interactive performance.

## Initial Scope

- Inspect Hugging Face model metadata without downloading full model weights.
- Build a tensor manifest that maps layers, experts, shard files, byte ranges, dtypes, and estimated memory cost.
- Execute one layer or active expert group at a time.
- Cache only the tensors and state needed for the current step.
- Explore KV cache quantization, paging, summarization, and reconstruction strategies.
- Preserve enough runtime proof to decide whether the approach should become a Nexus Engine domain kit.

## Non-Goals

- Do not promise interactive token speed.
- Do not require full model downloads as the default path.
- Do not treat lossy KV reconstruction as reliable until measured.
- Do not claim model compatibility without manifest and execution proof.

## Status

Status: planning scaffold

This repository currently contains the project intention and operating contract. Implementation should begin with model metadata inspection and memory budgeting before any runtime executor is built.

## Documentation

- [Concept](docs/concept.md) - the full idea in product and research terms.
- [Feasibility](docs/feasibility.md) - what is plausible, risky, and likely to fail.
- [Architecture](docs/architecture.md) - proposed runtime domains and data flow.
- [Model Targets](docs/model-targets.md) - current Kimi K2.6 and GLM-5.2 metadata estimates.
- [KV Cache Strategy](docs/kv-cache-strategy.md) - why KV state is the hard problem and how to test options.
- [Roadmap](docs/roadmap.md) - staged path from metadata estimator to runtime proof.
- [Nexus Engine Path](docs/nexus-engine-path.md) - future domain-kit promotion boundary.
