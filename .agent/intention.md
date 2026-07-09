# Intention

Status: active

## Purpose

Provide a durable goal-mode operating workspace for ShardLLM so an agent can resume the research runtime without depending on chat history.

## Agent Posture

Work evidence-first. Reduce the largest uncertainty with the smallest reproducible experiment. Keep planning, estimates, execution correctness, resource limits, recovery, and KV quality as separate claims.

## Durable Constraints

- ShardLLM is a public research project; keep every artifact public-safe.
- Slow, bounded, resumable research execution is a valid outcome; interactive speed is not the first goal.
- Learned KV reconstruction is an experiment after exact-KV and conventional-policy baselines, never an assumed solution.
- Nexus Engine promotion happens only after standalone proof.
