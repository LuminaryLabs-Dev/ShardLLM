# Development

## Start with the existing CLI

Requires **Node.js 20 or newer**. This repository does not declare third-party runtime packages or an application build/transpilation step.

```sh
npm run check
npm run inspect -- moonshotai/Kimi-K2.6
npm run inspect -- zai-org/GLM-5.2 --ram-gb 16 --disk-gb 32
```

The `check` script runs `node --check` against the CLI and current `src/*.mjs` modules. It is a **syntax check**, not an inference correctness test. The inspect commands request remote public metadata; they should not download model weight shards according to the current CLI design.

## Code map

- `bin/shardllm.mjs`: CLI executable.
- `src/cli.mjs`: inspect command and options.
- `src/huggingface-client.mjs`: public model metadata retrieval.
- `src/tensor-index.mjs`: tensor names, groups and shard classifications.
- `src/estimator.mjs`: conservative RAM/disk/network planning.
- `src/execution-plan.mjs`: local/hybrid mode **planning**, not execution.
- `src/artifacts.mjs`: local manifests, reports and proof outputs.

Inspect the [artifact contracts](artifact-contracts.md) before changing report shapes and read [validation](validation.md) before making feasibility claims. Keep outputs reproducible, explicitly unknown where evidence is missing, and free of tokens or secrets.

## Current development boundary

Do **not** treat remote-expert, remote-block, RAM-only policy, speculative token settings, pause/resume, KV reconstruction, or true layer execution as implemented just because flags and plans exist. Their next gates are documented in the [experiment matrix](experiment-matrix.md) and [roadmap](roadmap.md).

The current documentation pass inspected source and project records. It did not execute `npm run check` or live external model requests.
