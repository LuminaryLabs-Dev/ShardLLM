# Model Targets

Status: draft

This file records current model metadata gathered from public Hugging Face repository metadata and `config.json` files on 2026-07-08.

No full model weights were downloaded.

## Sources

- Kimi K2.6: <https://huggingface.co/moonshotai/Kimi-K2.6>
- GLM-5.2: <https://huggingface.co/zai-org/GLM-5.2>

## Current Metadata Snapshot

| Field | Kimi K2.6 | GLM-5.2 |
|---|---:|---:|
| Published storage | 595,263,427,116 bytes | 1,506,687,604,850 bytes |
| Approx storage | 595 GB | 1.5 TB |
| Safetensors parameter count | 1,058,589,420,528 | 753,329,940,480 |
| Shard files | 64 | 282 |
| Hidden layers | 61 | 78 |
| Hidden size | 7168 | 6144 |
| Routed experts | 384 | 256 |
| Active experts per token | 8 | 8 |
| Max position embeddings | 262,144 | 1,048,576 |
| Config dtype | bfloat16 | bfloat16 |
| First dense layers | 1 | 3 |
| Published quantization | pack-quantized | not reported in config snapshot |

## Rough Layer Storage Estimates

These are first-pass estimates based on published storage divided by layer count. They are useful for planning, not proof.

| Model | Approx Storage | Layers | Average Full-Layer Storage |
|---|---:|---:|---:|
| Kimi K2.6 | 595 GB | 61 | 9.8 GB/layer |
| GLM-5.2 | 1.5 TB | 78 | 19.3 GB/layer |

## Interpretation

Whole-layer streaming is probably too coarse for GLM-5.2 on a MacBook Air. A full average layer is roughly larger than, or uncomfortably close to, the usable memory budget of common MacBook Air configurations.

Kimi K2.6 is a better first target because the published model is compressed and has fewer shards, but it still requires careful active-slice loading.

## MacBook Air Feasibility Bands

| Device Memory | Expected Band |
|---:|---|
| 8 GB | Manifest estimation only; runtime proof is unlikely beyond tiny slices. |
| 16 GB | Possible for metadata, cache planning, and maybe active expert slice experiments. |
| 24 GB | Best MacBook Air target for first runtime proof, still likely very slow. |

## First Estimator Output

The first ShardLLM command should produce a report like:

```text
model: moonshotai/Kimi-K2.6
storage: 595 GB
shards: 64
layers: 61
routed_experts: 384
active_experts_per_token: 8
average_layer_storage: 9.8 GB
whole_layer_fit: barely/false
active_slice_fit: unknown until tensor index is parsed
next_required_file: model.safetensors.index.json
```
