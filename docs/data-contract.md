# Data contract

The pipeline has two stages with a stable format between them:

```
crawler (or sample generator)  ──►  data/normalized/tenders.jsonl  ──►  build_site_data.py  ──►  web/public/data/*.json
```

Anything that writes `tenders.jsonl` in this format can feed the site. The sample generator
(`pipeline/make_sample.py`) and the future crawler produce the same shape.

## `tenders.jsonl`

One JSON object per line, one line per tender package.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Notice ID (TBMT), e.g. `IB2600012345`. Sample data uses `SMP-…`. |
| `title` | string | Package name as published. |
| `province` | `{id, name}` | Province of the procuring entity. `id` is a slug. |
| `sector` | enum | `construction`, `goods`, `consulting`, `non_consulting`, `mixed`. |
| `method` | enum | `open`, `limited`, `direct`, `quotation`, `other`. |
| `topics` | string[] | Topic slugs (`schools`, `medical-equipment`, `roads`, …). Assigned by rules or a classifier. |
| `funding` | string \| null | Funding source as published. |
| `buyer` | `{id, name, kind}` | Procuring entity. `id` is its code on the national system. |
| `status` | enum | `awarded`, `open`, `cancelled`. |
| `estimate_vnd` | int \| null | Approved package price. |
| `award_vnd` | int \| null | Winning price. Null until awarded. |
| `bids` | array \| null | `[{contractor: {id, tax_code, name}, amount_vnd, won}]`. **Null when the bid opening minutes are not published** (unknown), as opposed to `[]`. |
| `documents` | object | Booleans: `plan`, `notice`, `tender_docs`, `opening_minutes`, `evaluation_report`, `award`, `contract`. True when published. |
| `dates` | object | ISO dates, each nullable: `plan`, `notice`, `opening`, `award`. |
| `units` | `{kind, count}` \| null | Optional unit count parsed from the title/docs, e.g. `{kind: "classroom", count: 12}`. Used for unit-cost indicators. |
| `source_url` | string \| null | Link to the original notice. Null for sample data. |
| `collected_at` | string | ISO timestamp of collection. |

## Indicators

Defined only in `pipeline/metrics.py` (pure, unit-tested) and applied by `pipeline/build_site_data.py`. **Status: proposed, TODO: verify by owner.**
Every indicator ignores tenders where its inputs are missing and returns `{value, n}`, where `n` is the number of tenders it used.

| Indicator | Definition |
|---|---|
| Number of bidders | `len(bids)`; unknown if `bids` is null. |
| Single-bidder share | Awarded tenders with exactly one bid ÷ awarded tenders with known bids. |
| Savings vs estimate | `(estimate − award) ÷ estimate`, averaged over awarded tenders with both values. |
| Processing time | Days from `dates.notice` to `dates.award`. Median. |
| Disclosure | Published documents ÷ 7 per tender; averaged for groups. Per document type for buyers. |
| Top-5 concentration | Share of total award value won by the 5 largest contractors in the group (`n` = awarded tenders with a known winner). |
| Unit cost | `award ÷ units.count` for tenders with a parsed unit count. Median per province. |

## Input validation in `build_site_data.py`

- Tender, buyer and contractor ids must match `^[A-Za-z0-9_-]+$` (they become file names and URL segments). The build stops with an error naming the record otherwise.
- `source_url` is kept only if it is `https://` on `muasamcong.mpi.gov.vn` or `muasamcong.mof.gov.vn`; anything else becomes `null` and the build prints a warning with the count.
- Any date may be null; indicators and "since" years skip missing dates.
- CSV downloads prefix cells starting with `= + - @` with `'` so spreadsheets do not run them as formulas.

## Site files (output of `build_site_data.py`)

The web reads only these files, through the `DataSource` port (`web/src/lib/data.ts`); TypeScript shapes are in `web/src/lib/types.ts`.
Every group indicator below is `{value, n}`.

| File | Shape | Used by |
|---|---|---|
| `meta.json` | build info (`generated_at`, `collected_at`, `is_sample`, `source`, `years`, `counts`), `national` group indicators, `sectors.<sector>` baselines (`avg_bidders`, `avg_savings`, `median_days`) | all pages |
| `provinces.json` | `[{id, name, …group indicators}]`, sorted by award value | home, filters |
| `topics.json` | `[{id, …group indicators}]` | home, topic pages |
| `latest.json` | up to 5 index rows (same shape as `tenders.json`), awarded only, newest first | home |
| `tenders.json` | index rows: `id, title, province, sector, method, topics, status, buyer, buyer_name, winner, winner_name, winner_tax, estimate, award, bidders, date, docs` | search/list |
| `buyers.json`, `contractors.json` | list rows for the list pages | lists |
| `tender/<id>.json` | the normalized tender plus `derived {bidders, savings, days, disclosure}` and `context {sector, buyer_tenders, buyer_since (nullable), winner_wins_with_buyer}` | tender page |
| `buyer/<id>.json` | buyer, `since` (nullable), group indicators, `documents.<doc>` disclosure, `top_contractors`, `recent` | buyer page |
| `contractor/<id>.json` | contractor, `bids`, `wins`, `award_value_vnd`, `buyers`, `provinces`, `by_year`, `top_buyers`, `recent_wins` | contractor page |
| `topic/<id>.json` | topic indicators, `unit`, `unit_cost[{province, name, value, n}]`, `largest` | topic page |
| `download/tenders.{jsonl,csv}` | open-data downloads | home |
