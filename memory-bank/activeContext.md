# Active Context

_Update after every meaningful AI session._

## Current Focus
Web MVP on sample data is live at https://minhbachdauthau.pages.dev (PR #1 merged 2026-10-04). Next: real data via the spike → crawler.

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
1. Second-pass review of PR #1 with a fresh agent (`.github/skills/second-pass-review/SKILL.md`).
2. Owner runs the spike (`spike/README.md`) and shares `report/report.md`; then plan the crawler.
