# Goal Mode Goal

Status: active

## North Star

Determine, with measured evidence, whether a massive model can be explored on constrained hardware through shard-aware active-slice execution, bounded caching, and a controlled KV policy.

## Active Goal

Implement and validate a manifest-only estimator for Kimi K2.6 and GLM-5.2.

## Success Criteria

- Reads public repository metadata, configuration, and safetensors indexes without full-weight download.
- Writes a versioned manifest, normalized tensor index where available, budget, cache plan, proof events, and report.
- Reports known values separately from estimates and unknowns.
- Produces a device-budget classification without claiming executor support.
- Passes the metadata and byte-accounting gates in `../docs/validation.md`.

## Follow-on Goals

- Prove a small-model executor path against a reference backend.
- Prove bounded active-slice loading and cache eviction.
- Measure exact KV limits before testing lossy policies.
