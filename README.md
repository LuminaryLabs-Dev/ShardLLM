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

Status: manifest-only estimator available

The first CLI reads public Hugging Face metadata, configuration, and safetensors indexes, then writes local planning artifacts. It does not download weight shards or claim executor compatibility.

## Quick Start

Requires Node.js 20 or later. The CLI has no runtime package dependencies.

```text
npm run inspect -- moonshotai/Kimi-K2.6
npm run inspect -- zai-org/GLM-5.2 --ram-gb 16 --disk-gb 32
npm run inspect -- moonshotai/Kimi-K2.6 --tensor-detail summary --execution-mode remote-expert --weight-cache ram-only --ram-cache-gb 1 --speculative-tokens 4 --gateway-url https://gateway.example
```

Artifacts are written below `.shardllm-cache/`, which is ignored by Git. Use `--output <directory>` to choose another local artifact root.

Remote expert, remote block, RAM-only weight cache, and speculative-token flags currently produce planning artifacts only. They do not contact a gateway or execute model weights.

## App Structure

```text
bin/shardllm.mjs              CLI entrypoint
src/huggingface-client.mjs     metadata-only remote reads
src/tensor-index.mjs           tensor-to-shard classification
src/estimator.mjs              conservative budget estimates
src/execution-plan.mjs         local and hybrid execution boundaries
src/artifacts.mjs              versioned local proof artifacts
```

## Documentation

- [Concept](docs/concept.md) - the full idea in product and research terms.
- [Feasibility](docs/feasibility.md) - what is plausible, risky, and likely to fail.
- [Architecture](docs/architecture.md) - proposed runtime domains and data flow.
- [Model Targets](docs/model-targets.md) - current Kimi K2.6 and GLM-5.2 metadata estimates.
- [KV Cache Strategy](docs/kv-cache-strategy.md) - why KV state is the hard problem and how to test options.
- [Hybrid Execution](docs/hybrid-execution.md) - RAM-only, remote expert/block, and speculative planning boundaries.
- [Validation Plan](docs/validation.md) - pass/fail proof gates for metadata, execution, cache, KV, and long runs.
- [Experiment Matrix](docs/experiment-matrix.md) - ordered experiments that reduce feasibility uncertainty.
- [Artifact Contracts](docs/artifact-contracts.md) - reproducible manifests, plans, proof events, and reports.
- [Roadmap](docs/roadmap.md) - staged path from metadata estimator to runtime proof.
- [Nexus Engine Path](docs/nexus-engine-path.md) - future domain-kit promotion boundary.
