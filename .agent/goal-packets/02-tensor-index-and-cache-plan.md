# Goal Packet 02: Tensor Index and Cache Plan

Status: planned

## Outcome

Normalize tensor-index data and produce a bounded cache plan for a target device.

## Success Criteria

- Classify tensors by layer and group, preserving explicit `unknown` records.
- Reconcile indexed byte totals and report discrepancies.
- Identify whole-shard fallback costs and active-slice opportunities.
- Produce a cache plan under a declared RAM, disk, and network policy.
- Pass `docs/validation.md` Gate 2 and cache simulation evidence.

## Dependency

Packet 01 provides the source manifest and retrieved index.
