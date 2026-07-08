# Concept

Status: draft

ShardLLM explores whether massive language models can be used from constrained devices by trading speed for memory control.

The target user experience is not fast chat. The target is a research runtime that refuses to fail just because a model is too large to fit in RAM.

## Core Idea

Instead of loading a full model, ShardLLM should work in small execution windows:

```text
model metadata
-> shard manifest
-> tensor index
-> active layer or expert window
-> bounded local cache
-> executor
-> KV state policy
-> resumable output
```

The runtime should be allowed to take minutes or hours if that is what the hardware budget requires.

## Why This Might Work

Many frontier-scale open models are sparse MoE models. They may contain hundreds of billions or more total parameters, but each token activates only a subset of experts.

That creates a possible path:

```text
do not load every expert
-> load routing and required shared tensors
-> identify active experts
-> load only active expert tensors
-> run the current layer
-> evict or persist cache entries
```

This is stronger than plain layer-by-layer inference because whole layers can still be too large. The more precise target is active-slice inference.

## What ShardLLM Should Learn

- How large each layer, expert group, and cache window is.
- Whether remote shard metadata can drive a useful runtime plan.
- Whether Hugging Face shard files can be used through partial reads instead of full downloads.
- Whether local SSD cache and eviction can make long runs practical.
- How much KV cache can be compressed, paged, summarized, or reconstructed before output quality collapses.
- Whether the result can become a Nexus Engine domain kit.

## Working Hypothesis

ShardLLM may become useful if it can keep peak memory bounded and tolerate extremely low token speed.

The likely success condition is:

```text
slow but resumable
bounded memory
bounded local cache
measured quality drift
clear failure reports
```

The likely failure condition is:

```text
network I/O dominates every token
KV cache grows beyond budget
partial tensor reads are too fragmented
approximate KV reconstruction drifts too much
executor integration cannot run the needed tensor groups
```
