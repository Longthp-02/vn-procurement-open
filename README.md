# vn-procurement-open

> Open, citizen-facing view of Vietnam's public procurement data: searchable, source-linked, and easy to verify.

## Why

Vietnam's public procurement data is already published on the National E-Procurement System (muasamcong.mpi.gov.vn), but it is hard to use: you search one tender at a time, cannot compare provinces, and cannot see a contractor's track record. Existing tools mostly serve contractors trying to win bids. This project serves **citizens, journalists and researchers**.

## What it will do

- **Tender lookup**: package price, winning price, number of bidders, winning contractor.
- **Contractor pages**: award history by province and by procuring entity.
- **Province indicators**: share of single-bidder tenders, savings versus estimate, market concentration.
- **Open dataset** that anyone can download and reuse.
- Later: provincial **budget data** as context.

## Principles

1. Only publicly published data; crawl slowly and credit the source.
2. Present numbers, not judgments: no "suspicious" labels, no conclusions on the reader's behalf.
3. Every number links to its source document and collection date; methodology is public.
4. Organizations and companies only; no personal data.

## Architecture (static-first, zero cost)

```
GitHub Actions (scheduled crawler)
        │  clean + link
        ▼
Parquet / SQLite files ──► Cloudflare R2 (public, downloadable dataset)
                                   │
                                   ▼
             Static site on Cloudflare Pages
             (queries run in the browser with DuckDB-WASM)
```

No always-on server or database. Data is refreshed daily, so a static site plus files is enough, and the dataset is open by design. If muasamcong blocks foreign IPs, the crawler moves to a small VPS in Vietnam while everything else stays on Cloudflare.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Spike: API discovery and data completeness ([`spike/`](spike/)) | 🟡 In progress |
| 1 | Ho Chi Minh City tenders: crawler, normalization, search page, contractor pages | ⏳ |
| 2 | Nationwide coverage, cross-province indicators | ⏳ |
| 3 | Budget data for 3–5 provinces, PDF extraction with LLMs | ⏳ |
| 4 | Public API, analysis write-ups | ⏳ |

## Getting started

```bash
pip install -r requirements.txt
python -m playwright install chromium
python spike/muasamcong_spike.py capture
```

See [`spike/README.md`](spike/README.md) for details.

## Data source

Source data belongs to the Vietnam National E-Procurement System (muasamcong.mpi.gov.vn). This project is independent and not affiliated with any government agency.

## License

Code: [MIT](LICENSE).
