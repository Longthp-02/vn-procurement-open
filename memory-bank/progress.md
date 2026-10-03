# Progress

## What Exists
- Spike data-survey script (`spike/`)
- Connectivity-check workflow (result not yet seen)
- Pipeline: sample generator, metrics, site-data builder — 36 tests, 99% coverage; input validation (ids, source URLs, null dates, CSV formulas)
- Web: home, tender list/search, tender, contractor, buyer, topic, lists, methodology — 79 tests, 99% line coverage; source scan keeps Vietnamese copy in `vi.ts`
- Red/green proof for 19 modules (`scripts/prove_red_green.py`)
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

- 2026-10-04: second-pass review of PR #1 (fresh agent): 6 P2 + P3s fixed with failing tests first; browser check found one more bug (static host returns index.html for missing JSON → shown as network error)

## Next Steps
1. Owner runs the spike (Python 3.12 needed on macOS)
2. Crawler plan from the spike report
3. Owner sign-off on indicator definitions
