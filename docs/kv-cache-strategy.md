# KV Cache Strategy

Status: draft

KV cache is likely the hardest ShardLLM problem.

Weight streaming controls model parameter memory. KV cache controls memory growth as the context gets longer.

## Why KV Is Hard

For every generated token, transformer attention stores key and value state. Long-context models can support hundreds of thousands or more positions, so KV memory can grow beyond the weight window.

ShardLLM cannot only solve weight streaming. It must also bound history state.

## Strategy Ladder

Use this order before attempting learned KV reconstruction.

| Level | Strategy | Why First |
|---:|---|---|
| 1 | Hard context cap | Establish a known baseline. |
| 2 | Sliding window | Simple and measurable. |
| 3 | KV quantization | Reduces memory without changing attention structure. |
| 4 | KV paging/offload | Moves cold KV to disk under explicit latency cost. |
| 5 | Retrieval summaries | Stores semantic memory outside raw KV. |
| 6 | Context distillation | Replaces older context with shorter learned or generated summaries. |
| 7 | Learned KV prediction | Most speculative; measure drift aggressively. |

## Learned KV Reconstruction Idea

The proposed small transformer would learn transitions or reconstructions of useful state so the main model can carry less raw history.

Possible forms:

```text
raw KV window
-> compression model
-> compact state
-> reconstruction model
-> approximate KV or prompt state
-> next inference step
```

or:

```text
raw conversation/history
-> memory model
-> structured summary state
-> prompt injection or retrieval state
-> main model continuation
```

The second form is safer. The first form is more powerful but more likely to drift.

## Drift Tests

Every KV experiment needs paired runs:

```text
baseline exact KV
vs
compressed/paged/reconstructed KV
```

Measure:

- token divergence
- logit distance where available
- answer quality
- factual retention
- instruction retention
- tool-call stability
- recovery after pause/resume

## Initial KV Policy

The first implementation should support:

- no KV compression
- fixed context cap
- projected KV byte estimate
- placeholder policy file
- proof event when KV exceeds budget

Do not implement learned KV reconstruction until the estimator and basic cache plan are working.
