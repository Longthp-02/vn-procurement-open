# Active Context

_Update after every meaningful AI session._

## Current Focus
Web MVP on sample data is built and tested (PR `feat/web-mvp`); waiting for Cloudflare secrets to deploy.

## Latest Decisions (2026-10-03)
- Static-first, zero-cost architecture (no server/database)
- Neutral indicators, no risk labels
- Repo in English; Vietnamese only in UI copy and sample vocabulary (TODO: verify)
- Sample data clearly labeled; fake names contain "Mẫu", tax codes start with "00"
- TDD for all new code; CI proves each test suite fails when its implementation is stubbed out
- Hosting: Cloudflare Pages (pages.dev URL first, custom domain later)

## Open Questions
- Owner sign-off on indicator definitions
- Spike results from the live site

## Next Safe Step
1. Owner adds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets → CI deploys.
2. Owner runs the spike (`spike/README.md`) and shares `report/report.md`; then plan the crawler.
