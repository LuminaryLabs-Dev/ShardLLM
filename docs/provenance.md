# Data, model and source provenance

## Repository source and distribution

`ShardLLM` contains research documents, Node ESM estimator/planner source, and generated graphic assets in `docs/assets/brand/`. The inspected tree has **no root `LICENSE` file**, so do not infer an open-source redistribution grant solely from the package name or `private: false` in `package.json`. Confirm rights with the rights holder before repackaging.

## Remote model information

The CLI fetches public metadata, configuration and safetensors indexes from Hugging Face repositories. These records originate with external model owners and hosts. Model cards, repository identities, revision identifiers, licenses, gated access requirements and storage estimates are **source evidence to be attributed**, not proof that ShardLLM owns or may redistribute model weights.

The current baseline does not download full model weight shards. Future shard-range fetching or caching must honor each model's terms, access controls, provider restrictions and storage requirements.

## Runtime and security

The current package declares no third-party npm runtime dependencies. Its remote metadata reads and local artifacts may still carry model identifiers, URLs, timestamps or user-supplied endpoints. Keep secrets and gated credentials out of commits, logs and proof artifacts, as required in root `AGENTS.md` and [SECURITY](../SECURITY.md).

`docs/assets/brand/` contains committed brand images and a manifest; no independent design-rights audit was run in this documentation pass. Rights to the source, branding, external models and future downloaded weights are separate questions.

This is an evidence/rights checklist, not a legal finding.
