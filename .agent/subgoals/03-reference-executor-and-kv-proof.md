# ShardLLM Subgoal 03 — Reference Executor and KV Proof

Status: planned (not active)
Parent: [Goal Packet 03](../goal-packets/03-executor-and-kv-proof.md)
Depends on: [Goal Packet 02](../goal-packets/02-tensor-index-and-cache-plan.md), `docs/validation.md` Gates 2 and E2 cache simulation.

## Objective

Establish a small-model correctness and resource baseline for ShardLLM's first executable, evictable layer/expert path, then measure exact KV growth and conventional KV policies. This is a **proof subgoal**, not an authorization to claim that Kimi K2.6 or GLM-5.2 executes.

## Entry gates — do not activate early

- Gate 2 has real-model header/index reconciliation evidence, including unsupported layouts and whole-shard fallback sizes.
- E2 cold/warm cache simulation records budget pass/fail behavior (including one intentional-fail budget).
- The reference small model, revision, license, dtype, tokenizer, architecture and runtime backend are identified and obtainable.
- Success thresholds, deterministic settings, reproducibility commands and resource budgets are declared before executable experiments.

If these are missing, leave this subgoal `planned`; continue Goal Packet 02 and log the blocker.

## Work sequence

### 03.1 — Select reference model and fix the oracle

Choose one small, public, architecture-compatible safetensors model. Record immutable source revision, tokenizer and preprocessing, backend/library version, CPU/GPU device, dtype, seed, numerical tolerance and fixed prompts. Run a deterministic full-availability reference baseline; preserve a sample of intermediate tensor values and logits where possible.

**Exit proof:** versioned `run-config.json`, reference output/logit samples, proof events and a reproducible command. No ShardLLM execution claims yet.

### 03.2 — Implement one correct execution slice (Gate 3)

Implement the smallest backend adapter that loads one indexed tensor group or layer/expert slice and executes it using the declared reference semantics. Verify shape, dtype, ordering, dependencies and numerical output against the oracle before extending to generation. Reject unsupported operators or packed MoE layouts explicitly; never silently substitute values.

**Exit proof:** numerical differences within a predeclared tolerance, with generated token IDs matched for a declared deterministic window when generation is supported. Any divergence must record first differing token and relevant logit evidence.

### 03.3 — Add bounded cold/warm cache execution (Gate 4)

Run the same reference through full-local and loading/evicting paths. Enforce a stated RAM/disk policy; record weight bytes moved, RSS/peak memory, disk usage, cache hits/misses, evictions, network traffic and timing. Repeat with empty and warm caches and with expected-pass and intentional-fail budgets. Reject or fail closed if limits cannot be enforced.

**Exit proof:** matching correctness under eviction; measured budget compliance or a documented limiting factor. Logical planning estimates alone do not pass.

### 03.4 — Prove checkpoint resume (Gate 5)

Pause at an identified token boundary. Persist model/source identity, plan version, deterministic settings, token history, exact KV policy/checkpoint references and cache restoration requirements. Resume in a new process and compare the next-token continuation to an uninterrupted run.

**Exit proof:** exact continuation or a transparent divergence report, with no silently substituted state.

### 03.5 — Establish exact KV baseline, then test conventional policies (Gate 6)

Measure exact KV bytes/token/layer, memory and latency for predeclared short, medium and target contexts on fixed prompts. Declare task-quality thresholds before results. Only after exact KV succeeds, compare at least one conventional policy (hard cap, sliding window, quantization or paging/offload), including quality delta, first token divergence where available, added latency, and recovery behavior. Keep learned KV reconstruction explicitly out of scope until conventional baselines exist.

**Exit proof:** quality-versus-memory-versus-latency table, fixed suite and versioned report. No policy is promoted on compression ratio alone.

## Required evidence

Keep outputs in the versioned run layout defined by `docs/artifact-contracts.md`:
- `manifest.json`, `tensor-index.json`, `budget.json`, `cache-plan.json`, `execution-plan.json`
- `run-config.json`, append-only `proof.jsonl`, `report.json` and relevant checkpoint references
- Clearly separate observed resource measurements, numerical comparisons, inferred estimates and unimplemented features
- Include warm/cold and uninterrupted/resumed evidence, model revision, declared thresholds and precise failure conditions

## Stop and escalation conditions

Stop executable claims if the chosen architecture is unsupported, a required tensor layout cannot be resolved, outputs exceed tolerance, memory/disk limits are breached, or resume is not reproducible. Record the smallest repro and next experiment rather than moving a gate to `passed`.

## Completion and handoff

- Gate 3: reference correctness **passed** with numerical/token evidence.
- Gate 4: bounded cache execution **passed** with measured cold/warm budgets.
- Gate 5: pause/resume **passed** with comparison to uninterrupted continuation.
- Gate 6: exact KV baseline plus conventional policy measurement **passed** against predeclared quality thresholds.
- Final report states `estimator only`, `slice feasible` or `research feasible` as the evidence warrants; no massive-model compatibility is inferred.
- Update the parent Goal Packet 03 and `.agent/change-log.md` only when status/evidence changes.

**Next safe action after Goal Packet 02:** select the reference model/backend and capture a deterministic full-local baseline. Do not implement lossy KV reconstruction or promote Nexus Engine kits as part of this subgoal.
