# AGENTS.md

## Global

- Maintain `memory.md` as the durable repo memory for purpose, architecture shape, and major conventions.
- Maintain `goal.md` as the live success criteria for the active project goal.
- Update `memory.md` only when a lasting repo decision, architecture preference, design pattern, or user preference changes.
- Remove outdated memory instead of accumulating duplicates.
- Communicate with short, high-value wording.
- Prefer direct validation through CLI commands, app startup, existing scripts, or interactive checks.

## Work Style

- Prefer completing the requested task over producing a long plan.
- Follow existing repo conventions before introducing new patterns.
- Ask before destructive actions, major architecture changes, deployments, credential use, payments, or unclear product direction.
- Do not add new unit or smoke test files unless asked.
- Run existing relevant checks when available.

## Coding

- Make the smallest coherent change.
- Keep public safety in mind: never commit secrets, auth stores, private keys, `.env` contents, downloaded gated weights, or token-bearing logs.
- For model work, inspect metadata and manifests before downloading weights.

## Validation

- Prefer measured proof: memory use, cache size, shard size, token timing, and reproducible commands.
- If validation cannot run, explain why and provide the closest manual verification step.

## Output

- Keep results concise: result, files changed, validation, next step.
