# Contributing

ShardLLM is a research project for investigating bounded, shard-aware large-model inference. Contributions should preserve the distinction between measured behavior, estimates, and planned runtime work.

## Current Scope

Implemented today:

- `shardllm inspect <owner/model>` reads public Hugging Face metadata, `config.json`, and a safetensors index without downloading weight shards.
- The CLI writes local manifests, tensor-index summaries, budgets, cache plans, execution plans, proof events, and reports.
- `local-stream`, `remote-expert`, and `remote-block` are planning modes only.

Not implemented:

- Safetensors header range parsing and tensor byte-range accounting.
- Cache eviction, executor adapters, pause/resume, and KV policies.
- Local or remote model execution.

Do not describe planned behavior as working inference.

## Local Setup and Checks

Use Node.js 20 or later. The package declares no runtime dependencies.

After changing JavaScript source, run:

```text
npm run check
```

`package.json` currently declares `inspect` and `check` scripts only. Use the smallest relevant validation available, and do not add generated artifacts or downloaded model data to the repository.

## Change Guidelines

- Keep changes focused and follow the existing module boundaries in `src/`.
- Preserve metadata-only inspection as the default path; inspect metadata and manifests before considering weight downloads.
- Treat estimates as estimates. Runtime feasibility claims require the evidence and gates defined in `docs/validation.md`.
- Keep artifact formats versioned and public-safe. Review `docs/artifact-contracts.md` when changing artifacts written under `.shardllm-cache/`.
- Update documentation when a change affects a documented interface, artifact contract, validation gate, or implemented status.
- Keep durable architectural decisions in `memory.md` and active success criteria in `goal.md` when a change warrants it.

## Artifact and Safety Rules

`.shardllm-cache/` is local generated output and is ignored by Git. Do not commit:

- downloaded model weights, shard ranges, caches, checkpoints, or generated proof output;
- `.env` files, tokens, credentials, browser profiles, private keys, or authentication caches; or
- private paths, private logs, or prompts containing secrets.

Remote execution is not implemented. If work touches its planning surface, keep gateway URLs free of credentials, query strings, and fragments, and do not place authentication data in artifacts.

## Documentation and Evidence

Documentation should label work accurately as implemented, planned, estimated, inferred, or speculative. A claim that a model can run on a target device needs repeatable, public-safe proof artifacts; metadata inspection or an average-layer estimate alone is not sufficient.

For research or runtime changes, use the ordered experiments in `docs/experiment-matrix.md` and the validation sequence in `docs/validation.md`. Reports must distinguish measured values from estimates and identify the next unresolved experiment.

## Licensing

No `LICENSE` file is currently present. Public repository visibility does not itself grant reuse rights; maintainers must establish licensing terms before external redistribution or incorporation.
