# Feasibility

Status: draft

ShardLLM is feasible as a research harness. It is not yet feasible to promise normal interactive local inference for GLM-5.2 or Kimi K2.6 on a MacBook Air.

## Plausible

- Reading model config and repository metadata without downloading full weights.
- Estimating total storage, layer count, shard count, and rough layer size.
- Building a tensor manifest from `model.safetensors.index.json`.
- Running a bounded local cache that downloads or range-reads only selected shards or tensors.
- Simulating layer-by-layer memory windows before implementing execution.
- Measuring KV cache growth separately from weight streaming.
- Producing a "feasible / barely feasible / not feasible" report for a target machine.
- Planning RAM-only, remote-expert, and remote-block execution without claiming that the adapters exist.

## Risky

- Loading a whole sparse layer. A whole MoE layer can still be far too large.
- Depending on live network reads during every token.
- Assuming tensor shard layout is convenient for active expert reads.
- Assuming llama.cpp supports the exact custom architecture and tensor layout needed for each target model.
- Treating lossy KV reconstruction as reliable before drift tests exist.
- Assuming remote expert execution is private, correct, or fast before protocol and latency proof exists.

## Storage-Free Client Direction

The strongest path without persistent Mac weight storage is hybrid execution:

```text
keep weights near remote compute
-> send activations instead of weight tensors
-> keep only bounded state and hot tensors in Mac RAM
-> verify several speculative tokens per expensive target sweep
```

This can reduce client data movement, but it changes the claim from fully local inference to locally orchestrated distributed inference. Storage, compute cost, trust, and privacy move to the remote gateway or workers.

## Likely Wrong In The First Version

The first runtime should not try to be a full replacement for llama.cpp, vLLM, SGLang, or Transformers.

The first runtime should answer:

```text
what would have to be loaded
how large is it
where does it live
what cache budget is required
what breaks first
```

## Main Feasibility Gates

| Gate | Pass Condition | Failure Meaning |
|---|---|---|
| Metadata gate | Config, storage, shard count, and layer count are readable remotely. | The model cannot be budgeted without larger downloads. |
| Tensor index gate | Tensor names map to layers and experts. | Active-slice loading cannot be planned cleanly. |
| Cache gate | A bounded local cache plan fits the target device. | Runtime would require too much disk or repeated network I/O. |
| Executor gate | One target layer or expert group can run correctly. | The project remains estimator-only. |
| KV gate | KV growth can be bounded with acceptable drift. | Long-context runs remain impractical. |

## Current Direction

Start with a manifest-only estimator. Do not build the executor first.

The estimator should make the hard facts visible:

- model storage
- shard count
- layers
- routed experts
- active experts per token
- estimated average layer size
- estimated full MoE layer size
- estimated active expert group size
- minimum cache window
- projected MacBook Air feasibility band
