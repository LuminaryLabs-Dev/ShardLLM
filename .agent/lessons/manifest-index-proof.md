# Manifest Index Proof

Status: validated

## Observation

Public Hugging Face configuration and safetensors index reads are sufficient to produce a reproducible manifest, tensor-to-shard map, and conservative budget report for Kimi K2.6 and GLM-5.2 without downloading a weight shard.

## Evidence

The 2026-07-09 ShardLLM runs recorded 23,616,111 metadata bytes for Kimi K2.6 and 5,435,229 metadata bytes for GLM-5.2. Both manifests recorded zero full weight shards downloaded.

## Practice

Treat the index as planning evidence only. It identifies each tensor's source shard, but exact tensor byte windows require a safetensors-header range parser before active-expert cache costs can be claimed.
