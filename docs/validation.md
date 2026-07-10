# Validation Plan

Status: active

ShardLLM must validate each uncertainty separately. A low memory reading does not prove correct inference, and correct output from a one-token spike does not prove cache or long-run viability.

## Claim Levels

| Claim | Required proof | Not enough on its own |
|---|---|---|
| Inspectable | Remote metadata and index are read without full-weight download. | A model card or guessed parameter count. |
| Plannable | Tensor map and bounded cache plan are generated. | Average bytes per layer. |
| Hybrid plannable | Local/remote ownership, data motion, cache policy, and blockers are explicit. | Selecting `remote-expert` or `remote-block` in a config. |
| Executable slice | A selected tensor group runs against a reference result. | Loading tensors into memory. |
| Bounded runtime | Peak RAM, cache disk, and network use stay within configured budgets. | A successful one-off run. |
| Resumable | An interrupted run restores its declared state and continues correctly. | Persisting a log file. |
| Long-context viable | A declared KV policy preserves acceptable task behavior over the target context length. | Compression ratio alone. |

## Validation Sequence

```text
metadata and index truth
-> byte-accounting truth
-> small-model executor correctness
-> selected-slice correctness
-> bounded-cache behavior
-> pause/resume recovery
-> KV policy quality and resource behavior
-> long-run feasibility classification
```

Do not move a result to the next stage when an earlier stage has no recorded baseline.

## Gate 1 - Remote Metadata and Index

Purpose: prove that planning does not require downloading all model weights.

Procedure:

1. Fetch the repository metadata, config, and safetensors index.
2. Record every request URL, response size, content identifier where available, and timestamp.
3. Verify that no full shard payload was stored in the cache.

Pass condition:

- The emitted manifest identifies source revision, config fields, shard files, and index availability.
- The run records downloaded bytes separately from published model storage.

## Gate 2 - Tensor and Byte Accounting

Purpose: prove that the planner understands what would be loaded.

Procedure:

1. Parse index tensor names into embeddings, attention, dense MLP, router, routed expert, shared expert, norm, and head groups.
2. Sum tensor byte ranges by group, layer, expert, and shard.
3. Compare every aggregate with the index and shard metadata.

Pass condition:

- Every indexed tensor is classified or explicitly recorded as unknown.
- Accounted bytes plus unknown bytes equal indexed bytes within the index format's own alignment or metadata limits.
- The report identifies the largest required whole-shard fallback and the smallest possible active slice.

## Gate 3 - Executor Correctness

Purpose: prove that eviction-oriented execution still computes the intended model operation.

Start with a small, locally obtainable, architecture-compatible model. Massive targets are not the first correctness oracle.

Procedure:

1. Run a fixed prompt through a reference backend with the same model revision and deterministic settings.
2. Run the same prompt through the ShardLLM adapter with full local availability.
3. Run again while loading and evicting the target layer or tensor group.
4. Compare layer outputs or logits when available, then generated token IDs.

Pass condition:

- The adapter identifies its reference backend, model revision, dtype, device, and deterministic settings.
- Numerical differences remain within an explicitly recorded tolerance appropriate to the backend and dtype.
- The generated token sequence matches for the declared deterministic test window, or any divergence is reported with the first differing token and logit evidence.

## Gate 4 - Bounded Cache and Resource Behavior

Purpose: prove that the runtime respects the target device instead of merely succeeding once.

Procedure:

1. Configure RAM, disk-cache, and network policies.
2. Run a repeatable prompt long enough to cause cache reuse and eviction.
3. Record resident memory, cache bytes, fetched bytes, hit/miss counts, I/O wait, token timing, and thermal or pressure signals when exposed by the host.
4. Repeat the same run from an empty cache and a warm cache.

Pass condition:

- Measured peaks do not exceed declared budgets, apart from a separately reported measurement tolerance.
- Evictions leave the cache in a recoverable state.
- Cold and warm runs report their costs independently.

## Gate 5 - Pause and Resume

Purpose: prove that multi-hour exploration can survive interruption.

Procedure:

1. Pause at a declared token boundary.
2. Persist cache-plan identity, source revision, generation settings, token history, KV policy state, and checkpoint references.
3. Resume in a new process and compare its next tokens with an uninterrupted baseline.

Pass condition:

- The resumed run either produces the baseline continuation or clearly labels the state as approximate and measures the divergence.
- Missing cache entries are recovered through the recorded source and policy, never silently substituted.

## Gate 5A - Hybrid Adapter

Purpose: prove that moving compute toward remote weights reduces client data motion without changing model behavior silently.

Procedure:

1. Run a small-model local reference under deterministic settings.
2. Run the same layer or expert through the remote adapter.
3. Compare output tensors, logits, and generated token IDs where available.
4. Record activation bytes, protocol overhead, round trips, remote compute time, and client weight bytes avoided.
5. Confirm the declared RAM and persistent weight-storage policies on the client.
6. Exercise timeout, retry, disconnect, and untrusted-response handling.

Pass condition:

- Numerical differences remain within a declared tolerance.
- Remote execution moves fewer client bytes than its local-stream baseline.
- Credentials are absent from artifacts and nonlocal traffic uses an approved secure transport.
- Client persistent weight storage matches the declared policy.
- Failures produce explicit proof events and do not silently corrupt continuation state.

## Gate 6 - KV Policies

Purpose: measure whether a history-saving policy trades quality for memory acceptably.

Baseline: exact KV under the same backend, model revision, prompt, sampling settings, and context length.

Measure each policy independently:

- exact KV with a hard cap
- sliding window
- quantized KV
- paged or offloaded KV
- retrieval summary or distilled context
- learned reconstruction, only after the above baselines exist

Required measurements:

- KV bytes by token and layer where observable
- peak memory and latency
- first divergent token and logit distance where available
- retrieval, factual, and instruction retention on a fixed prompt suite
- tool-call or structured-output stability when applicable
- recovery behavior after pause/resume

Pass condition:

- The report declares a task-specific quality threshold before examining results.
- Memory savings, added latency, and quality delta are reported together.
- Learned reconstruction never replaces an exact baseline silently.

## Final Classification

| Classification | Meaning |
|---|---|
| `not feasible` | One or more required resource, compatibility, or correctness gates fail. |
| `estimator only` | Metadata and planning work, but no correct executor proof exists. |
| `slice feasible` | A correct bounded layer or expert slice runs, but full generation or recovery is unproven. |
| `research feasible` | Bounded, resumable generation works at the declared context and policy, with measured quality. |

Interactive speed is not required for `research feasible`; transparent timing and resource costs are required.
