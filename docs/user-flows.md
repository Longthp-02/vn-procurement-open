# User Flows

## MVP Flows (happy path)
1. **Search a tender**: home → type keyword, entity name or tax code (diacritics optional) → filter by province → results list → tender page.
2. **Read a tender**: key numbers (estimate, award, savings, bidders) → indicators next to sector averages → disclosure checklist (published / not published) → bidders table → timeline → source link and collection date.
3. **Follow the money**: tender → winning contractor profile (wins by year, frequent buyers, wins list) → buyer profile (disclosure by document type, top contractors, recent tenders).
4. **Compare provinces**: home → province table (tenders, award value, single-bidder share, savings, top-5 share, disclosure).
5. **Browse a topic**: home → topic card → topic page (indicators, unit cost by province, largest tenders).
6. **Download data**: home → CSV or JSONL.
7. **Report a data error**: any page → opens a prefilled GitHub issue.

## System Flows
1. Daily: crawler (TODO) or sample generator → `tenders.jsonl` → `build_site_data.py` → static deploy.
2. On push/PR: CI runs all tests; deploy only after tests pass.

## Error / Edge Cases To Verify
- Tender with no published bid opening minutes → bidders shown as "not published", excluded from indicators
- Tender not yet awarded or cancelled → no award, no savings
- Contractor with bids but no wins
- Search with no results; search with Vietnamese diacritics removed
- Unknown route or missing JSON file → honest "not found" page
- Data failed to load (network) → visible error with retry
- Sample data mode → banner on every page; no fake source links

## TODO: verify
- Whether readers need a buyer list filtered by province
- Whether topic pages need date filters
