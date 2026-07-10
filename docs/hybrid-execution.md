# Hybrid Execution

Status: planned

Hybrid execution moves computation closer to persistent weights so a constrained client sends compact activations instead of repeatedly downloading expert tensors.

## Execution Modes

| Mode | Weight location | Mac responsibility | Current status |
|---|---|---|---|
| `local-stream` | Remote source plus optional bounded local cache | Schedule, fetch selected ranges, execute, and retain state | Planning only; no executor exists. |
| `remote-expert` | Expert workers or a tensor-compute gateway | Schedule, run or request routing, retain bounded state, and combine expert outputs | Planning only; no gateway adapter exists. |
| `remote-block` | Remote workers holding complete layer groups | Schedule the session and retain declared client state | Planning only; no block protocol exists. |

Remote modes avoid persistent Mac weight storage, but they do not remove storage from the system. A gateway or worker fleet must keep the required weights near its compute.

## CLI Planning Surface

Plan a compact, RAM-only remote-expert run:

```text
npm run inspect -- moonshotai/Kimi-K2.6 \
  --tensor-detail summary \
  --execution-mode remote-expert \
  --weight-cache ram-only \
  --ram-cache-gb 1 \
  --speculative-tokens 4 \
  --gateway-url https://gateway.example
```

The command currently reads Hugging Face metadata and writes `execution-plan.json`. It does not contact the configured gateway, send activations, or execute a model.

`--tensor-detail summary` keeps per-run artifacts compact by omitting the expanded tensor record list. The source index is still read in memory so counts and groups can be calculated. Use `full` when per-tensor planning records are required.

## RAM-Only Cache

`--weight-cache ram-only` declares that fetched or transformed weights may exist only in a bounded RAM working set. `--ram-cache-gb` controls that budget. Metadata and proof artifacts still persist below the selected output directory.

The intended eviction order is:

```text
expired speculative branch
-> cold expert tensors
-> shared layer tensors
-> router and norm tensors last
```

This policy is not enforced until the cache manager and executor exist.

## Remote Expert Flow

```text
Mac scheduler
-> local or remote router decision
-> hidden activation plus selected expert ids
-> remote expert worker
-> expert output activation
-> Mac state update
```

The exact boundary is still open. Keeping routing local requires router tensors on the Mac. Moving routing into the gateway reduces local weight traffic but exposes more model state and makes the remote service more authoritative.

## Remote Block Flow

```text
Mac session
-> activation to remote block worker
-> one or more complete layers
-> activation to next block or back to Mac
```

This transfers less weight data than local streaming, but sequential network latency and worker availability become first-class constraints.

## Speculative Verification

`--speculative-tokens N` records a plan to verify up to `N` candidate tokens per target-model sweep. Values above `1` require a draft source and a target verification backend. Neither exists yet.

The proof must record:

- candidate count and source
- accepted token count
- target weight sweeps
- bytes transferred per accepted token
- exact token agreement with non-speculative decoding

## Security Boundary

- Gateway URLs may not contain credentials, query strings, or fragments.
- Nonlocal gateways require TLS before activation traffic is sent.
- Hidden activations can reveal information about prompts and model state; remote modes require a privacy review.
- Authentication must come from a runtime secret provider and must never be written to artifacts.
- A remote response is untrusted until correctness and integrity checks exist.

## Promotion Gates

Hybrid execution remains `planned_not_executable` until:

1. Tensor byte ranges and active windows are measured.
2. A versioned expert or block protocol exists.
3. A small-model reference comparison proves correctness.
4. RAM limits and zero persistent weight storage are measured.
5. Remote failure, timeout, retry, and resume behavior are demonstrated.
