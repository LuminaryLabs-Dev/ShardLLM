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
