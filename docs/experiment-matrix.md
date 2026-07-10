# Experiment Matrix

Status: active

Run these experiments in order. Each row should become one dated run directory and one short report. Do not begin the learned KV experiment until the exact-KV baseline has passed.

| ID | Experiment | Smallest useful target | Primary evidence | Exit decision |
|---|---|---|---|---|
| E0 | Remote inspection | Kimi K2.6 and GLM-5.2 metadata | manifest and downloaded-byte count | Can the model be planned without full weights? |
| E1 | Index classification | A public safetensors-indexed model | tensor index and byte reconciliation | Are tensors grouped accurately enough to budget? |
| E2 | Cache simulation | E1 manifest, no executor | cache plan, cold/warm estimates | Does a bounded working set exist? |
| E2H | Hybrid plan | E1 manifest, no executor | execution plan and data-motion estimate | Which local/remote boundary moves the fewest bytes safely? |
| E3 | Reference executor | Small compatible model | logits/tokens against reference | Can the adapter run a correct layer path? |
| E4 | Evicting slice | E3 model | same output plus peak-RAM trace | Does loading and eviction preserve correctness? |
| E5 | MoE active slice | Small MoE with inspectable routing | selected experts, bytes, output trace | Is expert-level scheduling actually smaller than a whole layer? |
| E6 | Cache pressure | E4 or E5 target | budget compliance and cache events | Does the cache stay bounded under reuse? |
| E7 | Resume | E6 target | checkpoint and continuation comparison | Can slow work survive a restart? |
| E8 | Exact KV baseline | E6 target at several context lengths | KV bytes, latency, quality suite | What is the uncompressed limit? |
| E9 | Simple KV policies | Same E8 prompt suite | exact vs cap/window/quantized/offloaded results | Which conventional policy is worth keeping? |
| E10 | Semantic memory | Fixed long-history suite | retention and latency results | Can summaries or retrieval reduce raw history safely? |
| E11 | Learned KV reconstruction | Only after E8-E10 | drift and recovery report | Is the speculative path competitive with simpler policies? |

## Required Run Matrix

Each executable experiment should include, where relevant:

| Dimension | Minimum values |
|---|---|
| Cache state | cold and warm |
| Memory budget | one expected-pass budget and one intentional-fail budget |
| Context length | short correctness prompt, mid-length pressure prompt, declared target length |
| Run lifecycle | uninterrupted and pause/resume |
| Reference mode | full-local reference and bounded ShardLLM mode |

## Fixed Prompt Suite

Keep a small, versioned prompt suite once executor work starts. It must include:

- deterministic continuation for token comparison
- long-distance fact retention
- instruction retention after distractor text
- structured output or tool-call format where supported
- recovery prompt that resumes after a checkpoint

The suite measures behavior; it is not a general model benchmark. Prompts, expected checks, settings, and model revision must be stored with every result.

## Stop Conditions

Stop and record the limiting factor when any condition is met:

- tensor layout requires downloading a whole shard larger than the configured disk or RAM window
- the backend cannot execute the target architecture correctly
- cache misses make execution dependent on unstable per-token network reads
- measured peak resources exceed the declared device budget
- a KV policy misses the declared quality threshold
- resume output cannot be explained from the checkpoint and policy state

An informative failure is a successful ShardLLM result when it identifies the real constraint with evidence.
