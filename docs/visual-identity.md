# Visual Identity

## Intent

The ShardLLM identity represents a very large model as a stack of separate weight slices, with one bounded slice selected for inspection or planning. The cover follows the implemented estimator flow: public model shards become an index, a constrained working slice, and public-safe proof artifacts. It does not represent successful model execution.

## Palette

| Name | Hex |
| --- | --- |
| Deep navy | `#14213D` |
| Cyan | `#23AFCB` |
| Warm yellow | `#F2C14E` |
| Coral | `#D96C5F` |
| Off-white | `#F5F1E8` |

## Assets

`docs/assets/brand/` contains the generated sources, transparent logo, fixed-size PNGs, editable mask, normalized cover, social card, manifest, and asset guide.

- Preserve the full five-slice mark and its transparent margin.
- Use the cyan bracket and yellow slice together so the bounded-selection meaning remains clear.
- Keep every model shard, index, selector, and proof object fully visible in cover uses.
- Do not add token output, chat interfaces, or generated text that would imply working inference.
- Use the editable `logo-mask.svg` when a single-color mark is required.

## Accessibility

The off-white mark is designed for the deep navy cover background. On light surfaces, use a navy single-color mask variant or place the full-color mark on a dark field. Maintain clear contrast and do not place the mark over detailed imagery.

## Regeneration

Regenerate through the Repo Image Studio workflow, validate `docs/assets/brand/manifest.json`, and inspect the transparent logo, cover, and social card before proposing replacement assets.
