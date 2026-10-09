# Dependencies and external services

ShardLLM's committed package describes an **estimator and planning CLI**, not a model inference backend.

| Requirement | Evidence | Role |
| --- | --- | --- |
| Node.js 20+ | `package.json` engines | Runs the native ESM CLI |
| Third-party npm runtime packages | None declared in `package.json` | Current metadata CLI has no installed package dependencies |
| Hugging Face public model metadata and indexes | `src/huggingface-client.mjs`, `README.md` | Network source for configuration, repository metadata and safetensors index |
| Local filesystem | `src/artifacts.mjs` | Writes versioned planning artifacts under `.shardllm-cache/` or selected output directory |
| Model weight executor | Not implemented | Planned work, **not** a dependency that currently runs |
| Remote expert/block gateway | Planning flag only | `--gateway-url` does not establish actual gateway execution |

The package is ESM (`"type": "module"`) with CLI entry point `bin/shardllm.mjs`. It defines `npm run inspect` and `npm run check`; no `npm test` command is declared.

## Important operating conditions

Metadata inspection requires a reachable, accessible source model repository. Do not assume gated model access, model license permission, exact tensor byte ranges, cached weights, or viable inference merely because a remote manifest can be read.

Future llama.cpp/Metal/Transformers or remote-compute adapters are architectural candidates described in the [draft architecture](architecture.md) and [hybrid execution](hybrid-execution.md); none is an installed current runtime dependency.

See [provenance](provenance.md) and [security](../SECURITY.md) before handling credentials or model files.
