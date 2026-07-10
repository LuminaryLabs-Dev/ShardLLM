# ShardLLM Agent Workspace

Status: active

## Start Here

Read these files in order:

1. `../AGENTS.md`
2. `../memory.md`
3. `../goal.md`
4. `intention.md`
5. `memory.md`
6. `goal.md`
7. `goal-packets/README.md` and active packets
8. `workflow.md`
9. `feedback.md` and active feedback packets
10. `lessons/README.md`
11. `change-log.md`

## Current Focus

Complete exact safetensors byte accounting and bounded cache planning before executor or KV reconstruction work. The planner now records local-stream, remote-expert, and remote-block boundaries, but those adapters remain non-executable.

## Guardrails

- Treat `../docs/validation.md` as the proof contract.
- Do not claim runtime feasibility from an estimate alone.
- Do not download full, gated, or private model weights by default.
- Do not commit secrets, auth state, cached weights, or token-bearing logs.
- Preserve existing working-tree changes; they are the documentation and validation-plan baseline currently under review.
