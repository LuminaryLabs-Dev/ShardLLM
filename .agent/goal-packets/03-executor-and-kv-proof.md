# Goal Packet 03: Executor and KV Proof

Status: planned

## Outcome

Establish correctness and resource baselines on a small compatible model before approaching massive targets.

## Success Criteria

- Compare a ShardLLM adapter with a reference backend under deterministic settings.
- Prove a bounded cache and pause/resume path.
- Measure exact KV growth at multiple context lengths.
- Evaluate conventional KV policies before any learned reconstruction attempt.
- Write a final classification using `docs/validation.md`.

## Dependency

Packets 01 and 02 provide reproducible manifests, index data, budgets, and cache plans.

## Implementation Subgoal

[Subgoal 03 — Reference Executor and KV Proof](../subgoals/03-reference-executor-and-kv-proof.md) is **planned** and must not become active until Goal Packet 02's real-model Gate 2 byte-accounting and E2 cold/warm cache simulation prerequisites are documented. Its work sequence covers Gate 3 correctness, Gate 4 bounded cache execution, Gate 5 resume and Gate 6 exact/conventional KV baselines. The present packet status remains `planned`.
