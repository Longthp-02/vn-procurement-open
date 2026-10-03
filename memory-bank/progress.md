# Progress

## What Exists
- Spike data-survey script (`spike/`)
- Connectivity-check workflow (result not yet seen)
- Pipeline: sample generator, metrics, site-data builder — 22 tests, 99% coverage
- Web: home, tender list/search, tender, contractor, buyer, topic, lists, methodology — 70 tests, 99% line coverage
- Red/green proof for 13 modules (`scripts/prove_red_green.py`)
- AI engineering foundation (rules, memory bank, docs, prompts, skills)
- CI (`.github/workflows/ci.yml`): lint, tests, coverage gates, red/green, build, Cloudflare Pages deploy

## Not Built Yet
- Real crawler and normalization
- Budget data, public API, Parquet export

## Known Risks
- Crawler access from outside Vietnam
- Completeness of bid lists
- File-count limits when scaling static JSON nationwide

## Completed Setup Work
- 2026-10-03: repo created, spike, design canvas (5 screens), data contract, pipeline, foundation docs, CI
- 2026-10-04: web MVP deployed to Cloudflare Pages (https://minhbachdauthau.pages.dev); PR previews at `<branch>.minhbachdauthau.pages.dev`

## Next Steps
1. Second-pass review of the web MVP
2. Run spike → crawler plan
3. Owner sign-off on indicator definitions
