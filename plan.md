# Implementation Plan

## Goal
Ship the MVP (Phase 1) as a static site fed by a tested pipeline, starting from sample data and swapping in real Ho Chi Minh City data once the crawler works.

## Assumptions
- muasamcong exposes a JSON API usable for list and detail data (TODO: verify via spike)
- Data refresh once per day is enough
- Zero hosting cost is a hard constraint

## Non-goals
See `spec.md`.

## Vertical Slice Strategy
Each slice goes end to end: normalized data → metric in `pipeline/metrics.py` (tested) → JSON in `build_site_data.py` (tested) → page in `web/src/features/` (tested) → deployed.

## Walking Skeleton
Sample `tenders.jsonl` → `build_site_data.py` → home page showing national indicators → deployed by CI. Proves the whole path before adding pages.

## Steps

### Step 1 — Project skeleton / tooling
Repo rules and context files, CI running ruff + pytest + typecheck + vitest + build. ✅ in progress

### Step 2 — Walking skeleton
Sample data → site JSON → home page with national indicators → deploy.

### Step 3 — First real feature slice
Tender search + tender detail page (bidders, savings, disclosure, source link).

### Step 4 — Tests and verification
Remaining pages (contractor, buyer, topic, methodology) each with tests; browser check at desktop and phone widths.

### Step 5 — Review and hardening
Second-pass AI review, accessibility pass, then replace sample data with crawler output (separate plan once the spike report exists).

## Tests Needed
- Unit: every metric (edge cases: unknown bids, zero estimate, empty groups)
- Integration: `build_site_data.py` on a small fixture produces the documented files and numbers
- Web unit: number/date formatting, diacritic-insensitive search, data loader errors
- Web behavior: pages render key numbers from fixture JSON; sample banner shows when `is_sample`
- Smoke: built site serves every route

## Risks
See `spec.md`.

## Open Questions
- Indicator definitions sign-off
- Spike results (bid list completeness, detail endpoint)

## Recommended First Coding Task
Walking skeleton: home page reading `meta.json` through the `DataSource` port, with a failing behavior test first.
