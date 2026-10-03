# Tech Context

## Stack
- Pipeline: Python 3.12+ (CI) / 3.13 (local), stdlib only at runtime
- Web: Vite, Preact, TypeScript, wouter-preact (routing)
- Spike: requests, playwright (local use only)

## Package Managers
pip (pipeline dev tools), npm (web)

## Database
None. Static JSON files; Parquet on Cloudflare R2 planned for the open dataset (TODO: verify).

## Test Tools
- pytest + pytest-cov, ruff (pipeline)
- `scripts/prove_red_green.py`: stubs each implementation file and checks its tests fail, then restores and checks they pass
- vitest + @testing-library/preact + jsdom, tsc (web)

## CI / Build
GitHub Actions: `.github/workflows/ci.yml` (all tests on push/PR), deploy workflow (static host).

## Local Setup
```bash
pip install -r requirements-dev.txt
python pipeline/make_sample.py && python pipeline/build_site_data.py --sample
cd web && npm ci && npm run dev
```

## Deployment Assumptions
- Cloudflare Pages via `wrangler pages deploy` from GitHub Actions (owner decision 2026-10-03)
- Requires repo secrets `CLOUDFLARE_API_TOKEN` (Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`
- Crawler on GitHub Actions unless muasamcong blocks foreign IPs (connectivity check workflow exists, result TODO: verify)

## TODO: verify
- Node version policy (CI uses Node 22)
