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

Computed only in `pipeline/build_site_data.py` so the logic is tested in one place.
Every indicator ignores tenders where its inputs are missing and reports how many tenders it used.

| Indicator | Definition |
|---|---|
| Number of bidders | `len(bids)`; unknown if `bids` is null. |
| Single-bidder share | Awarded tenders with exactly one bid ÷ awarded tenders with known bids. |
| Savings vs estimate | `(estimate − award) ÷ estimate`, averaged over awarded tenders with both values. |
| Processing time | Days from `dates.notice` to `dates.award`. Median. |
| Disclosure | Published documents ÷ 7 per tender; averaged for groups. Per document type for buyers. |
| Top-5 concentration | Share of total award value won by the 5 largest contractors in the group. |
| Unit cost | `award ÷ units.count` for tenders with a parsed unit count. Median per province. |
