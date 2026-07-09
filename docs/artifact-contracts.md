# Artifact Contracts

Status: active

ShardLLM needs stable artifacts before it needs a broad runtime API. These files make an estimate or experiment reproducible without copying model weights into the repository.

## Run Directory

```text
.shardllm-cache/models/<source-id>/runs/<run-id>/
  manifest.json
  tensor-index.json
  budget.json
  cache-plan.json
  run-config.json
  proof.jsonl
  report.json
  checkpoints/
```

All artifacts must include `schema_version`, `created_at`, and a source identifier. Generated artifacts may contain public URLs and hashes, but must not contain access tokens, cookies, private paths, prompts with secrets, or downloaded weights.

## Manifest

`manifest.json` describes what was observed remotely.

Required fields:

```json
{
  "schema_version": 1,
  "source": {"provider": "huggingface", "model_id": "owner/model", "revision": "commit-or-tag"},
  "retrieved_at": "ISO-8601 timestamp",
  "config_url": "public URL",
  "index_url": "public URL or null",
  "published_storage_bytes": 0,
  "shards": [],
  "downloaded_metadata_bytes": 0
}
```

## Tensor Index

`tensor-index.json` is a normalized interpretation, not a replacement for the upstream index.

Required fields:

- source manifest identity
- source tensor name
- source shard and byte range when discoverable
- dtype and byte length when discoverable
- group: embedding, attention, dense MLP, router, routed expert, shared expert, norm, head, or unknown
- layer and expert identifiers when applicable
- parser version and unknown-tensor count

## Budget and Cache Plan

`budget.json` declares the target and resulting estimates:

- host memory and disk budgets
- cache policy and range-read policy
- whole-shard fallback size
- estimated active window, KV allocation, and network cost
- assumptions that made an estimate uncertain

`cache-plan.json` converts that estimate into ordered entries with content identity, priority, expected size, eviction class, and recovery source.

## Run Configuration

`run-config.json` makes comparisons honest. It records:

- ShardLLM version and backend version
- source model and revision
- device, OS, architecture, and available RAM
- dtype, quantization, and deterministic settings
- prompt-suite identifier and sanitized prompt inputs
- cache and KV policy configuration
- correctness tolerance and quality thresholds declared before the run

## Proof Events

`proof.jsonl` is append-only. Every event has:

```json
{
  "schema_version": 1,
  "run_id": "string",
  "sequence": 1,
  "timestamp": "ISO-8601 timestamp",
  "event": "token_completed",
  "payload": {}
}
```

Use the event names in `architecture.md`. Resource samples must state units. A failure event must include the gate, failing limit or condition, and enough public-safe context to reproduce it.

## Report

`report.json` is the final classification for one run. It includes:

- claim level reached
- passed and failed validation gates
- peak RAM, cache disk, network bytes, and token timing
- correctness comparison result
- KV policy and quality result
- pause/resume result
- limiting factor and next experiment

Reports must distinguish measured data from estimates and inferred values.
