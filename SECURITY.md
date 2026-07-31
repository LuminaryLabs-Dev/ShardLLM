# Security Policy

## Current Scope

ShardLLM is currently a manifest-only estimator (`0.1.0`). The CLI reads public Hugging Face repository metadata, `config.json`, and `model.safetensors.index.json`, then writes local planning artifacts. It does not download weight shards, execute model weights, contact configured gateways, or implement authentication.

No supported-version policy is currently defined.

## Reporting a Vulnerability

This repository does not currently document a private vulnerability-reporting channel, maintainer contact, or response-time commitment.

Do not publish credentials, private model data, private endpoints, sensitive prompts, or exploit details in a public issue. Include only public-safe information until a private reporting channel is established.

Useful report details include:

- affected repository-relative path and version or commit;
- a minimal, sanitized reproduction;
- observed and expected behavior; and
- impact and any affected local artifacts or inputs.

## Security Boundaries

### Implemented behavior

- Model identifiers must use `owner/model` form before metadata URLs are constructed.
- The metadata client uses Hugging Face HTTPS endpoints.
- `--gateway-url` accepts only HTTP(S) URLs and rejects embedded credentials, query parameters, and fragments.
- Generated artifacts are intended to contain public URLs and hashes only; repository guidance prohibits access tokens, cookies, private paths, secret prompts, downloaded weights, authentication state, and token-bearing logs.
- Local caches, `.env` files, logs, and temporary files are ignored by Git.

### Planned behavior

Remote expert and remote block modes are planning-only surfaces. The documented design requires TLS for nonlocal gateway traffic, a privacy review for activation transfer, runtime-only secret handling, and integrity and correctness checks for remote responses. These controls are not implemented because no gateway adapter exists.

## Handling Local Artifacts

Treat `.shardllm-cache/` and any alternate `--output` directory as potentially sensitive research output. Review artifacts before sharing or committing them, especially manifests, run configurations, proof events, reports, checkpoints, and logs. Do not rely on Git ignore rules as the only safeguard.

## Security Review Priorities

Review changes that affect:

- metadata request construction or parsing;
- artifact paths, serialization, or redaction;
- cache persistence, checkpoints, or prompt handling;
- gateway configuration, authentication, transport, or remote-response validation; and
- safetensors range reads, downloaded weight handling, or executor adapters.
