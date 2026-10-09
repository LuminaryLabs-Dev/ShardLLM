# ShardLLM repository profile

- **Repository:** `LuminaryLabs-Dev/ShardLLM`
- **Default branch observed:** `main`
- **Baseline source:** `6e53eca362914e5619af16e515473deea063e110`
- **Type:** Research / metadata inspection and feasibility-planning CLI
- **Declared package version:** `0.1.0` (unreleased in changelog)
- **Runtime:** Node.js 20+, native ESM, no declared npm runtime dependencies
- **CLI:** `bin/shardllm.mjs` and `src/`
- **Implemented:** remote metadata/config/index inspection, tensor grouping, budget and execution **plans**, versioned local artifacts
- **Not implemented:** full or sharded model inference execution, validated KV policy, bounded live cache, remote expert gateway, resumable generation
- **Existing check:** `npm run check` syntax validation; not run in this documentation pass
- **Authority:** root `AGENTS.md`, `goal.md`, `.agent/start-here.md`, `docs/validation.md`
- **Release/rights:** no demonstrated release or root LICENSE file; inspect third-party model terms separately

Preserve the distinction between **estimating whether inference might be feasible** and **proving inference can run correctly**.
