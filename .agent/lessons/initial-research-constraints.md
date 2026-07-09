# Initial Research Constraints

Status: provisional

## Observation

Whole-layer inference is too coarse as the primary MacBook Air strategy for the documented massive MoE targets. Active-expert planning and bounded local cache behavior are the relevant uncertainty reducers.

## Basis

The current target metadata and feasibility analysis are recorded in `../../docs/model-targets.md` and `../../docs/feasibility.md`.

## Practice

Start new work with remote manifest and tensor-index inspection. Report whole-layer fallback cost, but design the planner around the smallest executable expert or tensor slice that the source layout permits.

## Limit

This is a planning constraint, not executor proof. Revisit it after a real tensor index and backend measurement exist.
