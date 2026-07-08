# Nexus Engine Path

Status: draft

ShardLLM should start as a standalone research repo. It should become a Nexus Engine domain kit only after the runtime boundaries are proven.

## Promotion Rule

Do not promote the whole project into Nexus Engine.

Promote stable, reusable domains:

```text
metadata inspection
tensor manifesting
budget estimation
bounded cache planning
KV policy measurement
proof harness events
```

Keep target-model hacks and experimental executor code outside the stable kit boundary until proven.

## Candidate Domain Kits

| Kit | Responsibility |
|---|---|
| `model-source-kit` | Read model metadata from Hugging Face or local sources. |
| `shard-manifest-kit` | Build shard and tensor manifests. |
| `tensor-budget-kit` | Estimate memory, disk, and network costs. |
| `bounded-cache-kit` | Maintain explicit local cache budgets. |
| `kv-state-kit` | Measure and apply KV cache policies. |
| `runtime-proof-kit` | Emit proof events and feasibility reports. |

## Engine Harness Role

Nexus Engine harnesses should eventually be able to ask:

```text
Can this model run on this device under this budget?
What cache window is required?
Which tensors are needed first?
What fails first?
What proof exists?
```

ShardLLM should answer those questions before it tries to be a full inference product.

## Proof Before Promotion

Promotion requires:

- manifest estimator output
- tensor grouping output
- cache plan output
- at least one executor spike
- KV policy measurement
- repeatable proof logs
- clear public safety policy

Until then, ShardLLM remains a research scaffold.
