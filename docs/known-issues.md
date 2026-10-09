# Known limits and unresolved proof

These are project-confirmed capability limits, not runtime failures reproduced in this pass.

## Implemented vs. planned

- The current CLI is a **manifest-only estimator**. It reads remote metadata/configuration/indexes and creates local planning artifacts.
- No full-model or selected-layer executor has been demonstrated by the committed implementation.
- Safetensors header range analysis for exact byte offsets/dtypes is planned rather than implemented.
- Bounded remote weight fetch, cache eviction and persistence, process pause/resume, and execution-state recovery are not implemented.
- Remote-expert and remote-block communication, a validated gateway protocol, and speculative verification are planning surfaces only.
- KV cache quantization, paging, reconstruction, memory/quality drift comparisons, and long-context research proof remain future experiments.
- No `npm test` script or automated executor/quality test suite is declared in the root manifest.

## Unverified constraints

- Real public-source availability and access permission for the currently named models at the time of execution.
- Accurate layer/expert byte accounting for arbitrary model formats and architectures.
- Feasible inference speed, memory ceiling, network cost, token correctness, privacy and gateway trust.
- Effective cross-process recovery, long-context performance, and future Nexus Engine integration.

The authoritative gates and explicit claim levels are in [validation](validation.md) and [feasibility](feasibility.md). **Estimator-only** must never be reworded as working large-model inference.
