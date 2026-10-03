# Frontend Handoff — review fixes (2026-10-04)

## What changed
Fixes from the second-pass review of PR #1.

## Endpoints affected
`latest.json` (new), `tender/<id>.json`, `buyer/<id>.json`, `download/tenders.csv`

## Request changes
None.

## Response changes
- New `latest.json`: up to 5 awarded index rows, newest first. The home page reads this instead of the full `tenders.json`.
- `tender/<id>.json` → `context.buyer_since` and `buyer/<id>.json` → `since` may now be `null` (missing notice dates).
- `source_url` is `null` unless it is an https link on the official system.
- `top5_share.n` now counts tenders (was: contractors).

## Validation / auth / error changes
- Build fails on unsafe ids (path traversal) instead of writing outside the output folder.
- CSV cells starting with `= + - @` are prefixed with `'`.

## Frontend actions required
Done in the same PR: `DataSource.latest()`, nullable `since` types and copy, status-aware result line on tender cards, source links re-checked in the browser (`officialSourceUrl`).

## Example payloads
```json
[{"id": "SMP-2026-00360", "status": "awarded", "winner_name": null, "award": 19470000000, "date": "2026-09-30"}]
```

## TODO verify
- Whether a crawled award notice can name the winner when bid opening minutes are missing (would add a winner field independent of `bids`).
