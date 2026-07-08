# Architecture

Status: draft

ShardLLM should stay modular so the estimator, cache, executor, and KV experiments can evolve independently.

## Runtime Domains

```text
model-source
  reads remote config and repository metadata

shard-manifest
  reads shard lists and safetensors index files

tensor-index
  maps tensors to layer, attention, expert, shared expert, embedding, or head groups

budget-estimator
  estimates RAM, disk, network, and active execution window sizes

cache-manager
  stores selected remote tensors or shards under an explicit disk budget

layer-scheduler
  decides which layer or active expert group is needed next

executor-adapter
  calls llama.cpp, Metal, Transformers, or a custom backend where possible

kv-state-manager
  owns KV cache paging, quantization, summarization, and reconstruction experiments

proof-harness
  records memory, timing, output drift, and reproducible commands
```

## Data Flow

```text
Remote Source
  -> model config
  -> repository metadata
  -> safetensors index
  -> tensor index
  -> budget estimate
  -> cache plan
  -> execution plan
  -> measured proof
```

## Local Cache Shape

The cache should not be "download the model slowly." It should be a bounded working set.

```text
.shardllm-cache/
  models/
    owner--model/
      manifest.json
      tensor-index.json
      cache-plan.json
      blobs/
        <content-addressed tensor or shard ranges>
      runs/
        <run-id>/
          proof.jsonl
          kv-policy.json
          checkpoints/
```

## Execution Window

Whole-layer loading is the simple model:

```text
load layer N
run layer N
evict layer N
load layer N+1
```

For MoE models, the better target is active-slice loading:

```text
load routing and shared tensors
choose active experts
load selected expert tensors
run layer
evict selected expert tensors when budget requires
```

## Proof Events

Every run should emit JSONL proof events.

Example event types:

```text
metadata_read
tensor_index_built
budget_estimated
cache_fetch_started
cache_fetch_completed
layer_window_loaded
kv_bytes_allocated
token_started
token_completed
drift_measured
run_paused
run_resumed
run_failed
```

## Open Architecture Questions

- Can safetensors range reads be made reliable enough over HTTP for the target providers?
- Should ShardLLM cache whole shard files, tensor byte ranges, or converted tensor chunks?
- Which backend should own the first true executor proof?
- How much custom architecture code is needed for GLM-5.2 and Kimi K2.6?
- Can the KV manager operate independently enough to become useful outside ShardLLM?
