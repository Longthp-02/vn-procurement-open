# Project Spec

## Project Name
vn-procurement-open (working Vietnamese site name: "Minh bạch đấu thầu" — TODO: verify final name)

## Problem
Vietnam's public procurement data is published on the National E-Procurement System, but it is hard to use: tenders are searched one at a time, provinces cannot be compared, a contractor's or procuring entity's track record is not visible in one place, and many documents are never published. Existing third-party tools are commercial and serve contractors who want to win bids.

## Target Users
- Citizens who want to see how public money is spent near them
- Journalists investigating procurement
- Researchers and students
- TODO: verify priority order and whether civil-society organizations are a primary audience

## Goal
A free, neutral, source-linked website plus an open dataset that turns published procurement data into numbers anyone can read and verify.

## MVP Scope
- Phase 0: data survey spike (field completeness of muasamcong data)
- Phase 1 (MVP): Ho Chi Minh City tenders
  - crawler + normalization into `docs/data-contract.md` format
  - pages: home, tender search/list, tender detail, contractor profile, procuring-entity profile, topic page, methodology
  - indicators: bidders, single-bidder share, savings vs estimate, processing time, disclosure, top-5 concentration, unit cost (schools)
  - open-data downloads (CSV, JSONL)
- Until the crawler exists, the site runs on clearly labeled sample data.

## Non-goals
- No "risk", "red flag" or "suspicious" labels or scores; no conclusions on the reader's behalf
- No personal data
- No citizen complaint/whistleblowing system (only "report a data error")
- No accounts, auth, or user-generated content
- No monetization
- No budget data (Phase 3) and no public API (Phase 4) in the MVP

## Current State
- `spike/` data-survey script, not yet run against the live site
- `pipeline/` sample generator, indicator metrics (tested), site-data builder
- Design canvas approved (5 screens); web app in progress

## Desired Behavior
A reader can search tenders, open any tender, see its numbers next to sector averages, see which documents were published, follow links to the winning contractor and the procuring entity, compare provinces, and download the data. Every number shows its source and collection date.

## Core User Flows
See `docs/user-flows.md`.

## Domain Rules
- Neutrality, attribution, organizations-only — see `docs/domain-context.md`.
- Indicator definitions in `docs/data-contract.md` are **proposed** by the AI and need owner sign-off. TODO: verify.

## Data / State Needed
Normalized tenders (`tenders.jsonl`). No runtime state; all pages are static reads of prebuilt JSON.

## External Integrations
- muasamcong.mpi.gov.vn (read-only crawling; internal API undocumented — TODO: verify via spike)
- GitHub Actions (CI, scheduled crawl), static hosting

## Security / Privacy Notes
See `docs/threat-model.md`. Main risks: publishing personal data, misleading numbers, defamation, crawler being blocked, supply-chain risk in dependencies.

## Acceptance Criteria
- [ ] Every page states when data is sample data, and sample names are visibly fake
- [ ] Every tender page shows its source (link or "sample: no original page") and collection date
- [ ] Every indicator shows how many tenders it is based on, and unknown inputs are excluded, not counted as zero
- [ ] Search matches Vietnamese text with or without diacritics
- [ ] All pages are usable at 360 px width
- [ ] CI runs pipeline and web tests, typecheck, lint and build on every push and PR
- [ ] Data downloads contain the same records the site shows

## Risks
- muasamcong may block foreign IPs or change its internal API
- Bid lists may be incomplete (single-bidder indicator unreliable) — TODO: verify via spike
- Legal/terms-of-use constraints on crawling — TODO: verify
- Static JSON per tender will not scale nationwide (file-count limits on hosts)

## Test Plan
See `docs/testing-strategy.md`.

## Rollback / Recovery Plan
Static deploys are immutable: redeploy the previous commit. Data builds are reproducible from `tenders.jsonl`; keep the last good normalized file.

## TODO: verify
- Final site name and domain
- Target-user priority
- Indicator definitions (owner sign-off)
- muasamcong terms of use for automated collection
- Vietnamese UI copy exception to the English-only repo rule
