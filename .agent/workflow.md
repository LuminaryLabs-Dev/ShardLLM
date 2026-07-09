# Goal Mode Workflow

Status: active

## Operating Loop

1. Read `start-here.md` and identify the active goal packet.
2. Check the working tree before changing files; preserve unrelated work.
3. Make the smallest change that advances the active packet.
4. Run the closest available validation.
5. Record measured evidence or the precise blocker.
6. Update the active goal packet and append a `change-log.md` entry.
7. Promote durable constraints to `.agent/memory.md`; promote reusable lessons to `lessons/`.

## Status Rules

- `planned`: documented but not started.
- `active`: current work slice.
- `blocked`: cannot continue without a stated external condition or user decision.
- `validated`: success criteria have evidence.
- `complete`: validated and no follow-up is required inside the packet.

## Completion Rule

Only mark a packet `complete` when its stated evidence exists. A command that runs without a measured artifact is not completion proof.

## Current Lane

`goal-packets/01-manifest-only-estimator.md` is the active implementation lane.
