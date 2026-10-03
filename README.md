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
crawler / sample generator ──► tenders.jsonl ──► pipeline/build_site_data.py ──► JSON files
                                                                                    │
                                          Static site (Vite + Preact) on Cloudflare Pages
```

No always-on server or database. Data is refreshed daily, so prebuilt JSON is enough, and the dataset is open by design (CSV/JSONL downloads). Nationwide scale will move to sharded files or Parquet queried in the browser. If muasamcong blocks foreign IPs, the crawler moves to a small VPS in Vietnam. Details: [`docs/architecture.md`](docs/architecture.md), [`docs/data-contract.md`](docs/data-contract.md).

The site currently runs on **clearly labeled sample data** until the crawler exists.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Spike: API discovery and data completeness ([`spike/`](spike/)) | 🟡 In progress |
| 0.5 | Web MVP on sample data, tested pipeline, CI/CD | ✅ Done |
| 1 | Ho Chi Minh City tenders: crawler, normalization, search page, contractor pages | ⏳ |
| 2 | Nationwide coverage, cross-province indicators | ⏳ |
| 3 | Budget data for 3–5 provinces, PDF extraction with LLMs | ⏳ |
| 4 | Public API, analysis write-ups | ⏳ |

## Development

```bash
pip install -r requirements-dev.txt
python pipeline/make_sample.py && python pipeline/build_site_data.py --sample   # sample data
cd web && npm ci && npm run dev                                                  # http://localhost:5173
```

Checks (all run in CI on every pull request):

```bash
ruff check pipeline spike scripts && python -m pytest --cov=pipeline
cd web && npm run typecheck && npm run coverage && npm run build
python scripts/prove_red_green.py      # every test suite fails without its implementation
```

Contributors and AI agents: start with [`AGENTS.md`](AGENTS.md). Data survey of the live source: [`spike/README.md`](spike/README.md).

## Data source

Source data belongs to the Vietnam National E-Procurement System (muasamcong.mpi.gov.vn). This project is independent and not affiliated with any government agency.

## License

Code: [MIT](LICENSE).
