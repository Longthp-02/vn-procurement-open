# Architecture

## System Shape

```
crawler / sample generator ──► data/normalized/tenders.jsonl ──► pipeline/build_site_data.py ──► web/public/data/*.json
                                                                                                   │
                                                              web (Vite + Preact, static) ◄────────┘ ──► Cloudflare Pages
```

- No server, no database, no auth. The site is static files plus prebuilt JSON.
- `docs/data-contract.md` is the boundary between pipeline and web.
- Indicators are computed once, in `pipeline/metrics.py`. The web only formats and displays them.

## Architecture-for-AI Rules
- Architecture is part of the prompt. Codebase structure, naming, comments, tests and documentation act as AI context.
- Prefer vertical slices / package-by-feature: `web/src/features/<feature>/` holds a page's components, logic and tests.
- Keep feature code close together. Avoid generic technical-layer folders (`components/`, `utils/`) unless justified.
- Features must not import from another feature's internals. Expose a public function when cross-feature behavior is needed.
- Shared code (`web/src/lib/`, `pipeline/metrics.py`) only when genuinely reused. Use the rule of three before abstracting.
- Define ports first: `DataSource` (web) and the normalized-tender format (pipeline). Adapters (static JSON loader, crawler, sample generator) implement them.
- Keep framework, HTTP and SDK types out of domain logic (`metrics.py` is pure functions over dicts; web formatting is pure functions).
- Comments explain why, not what.
- Humans own architecture decisions; AI implements within these boundaries.
- Refactor one feature at a time. No big-bang rewrites.

## Directory Map
| Path | Responsibility |
|---|---|
| `pipeline/metrics.py` | Indicator definitions (pure, unit-tested) |
| `pipeline/build_site_data.py` | Normalized tenders → site JSON (integration-tested) |
| `pipeline/make_sample.py` | Deterministic sample data in the normalized format |
| `spike/` | Throwaway data-survey tooling |
| `web/src/lib/` | `DataSource` port + static adapter, formatting, search normalization, shared UI |
| `web/src/features/*` | One folder per page |
| `web/src/i18n/vi.ts` | All Vietnamese UI copy (only place Vietnamese appears in code) |

## Scaling Notes
One JSON file per tender is fine for one province. Nationwide data needs sharding or querying Parquet in the browser (DuckDB-WASM) to stay under host file-count limits. TODO: verify when Phase 2 starts.
