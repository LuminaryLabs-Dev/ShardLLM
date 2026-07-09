# ShardLLM Documentation

Status: active

This folder documents the ShardLLM research direction before runtime implementation.

## Reading Order

1. [Concept](concept.md)
2. [Feasibility](feasibility.md)
3. [Architecture](architecture.md)
4. [Model Targets](model-targets.md)
5. [KV Cache Strategy](kv-cache-strategy.md)
6. [Validation Plan](validation.md)
7. [Experiment Matrix](experiment-matrix.md)
8. [Artifact Contracts](artifact-contracts.md)
9. [Roadmap](roadmap.md)
10. [Nexus Engine Path](nexus-engine-path.md)

## Documentation Rule

Every claim about running a model must eventually map to one of these proof types:

- remote metadata read
- local shard index read
- memory estimate
- cache estimate
- command output
- timing output
- correctness or drift measurement
- reproducible runtime proof

Until then, claims stay marked as planned, inferred, or speculative.

## Required Before Runtime Claims

- `validation.md` defines what each proof must measure and what can fail.
- `experiment-matrix.md` sequences the smallest experiments that reduce the most uncertainty.
- `artifact-contracts.md` defines the JSON artifacts that make runs reproducible and comparable.
