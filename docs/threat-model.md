# Threat Model

## Feature / System
Public static website and open dataset built from crawled government procurement data. No accounts, no server, no user input stored.

## What could go wrong?
- Personal data published (e.g. an individual's name in a document) → privacy harm, legal exposure
- Misleading numbers (bug in an indicator, unknown values counted as zero) → reputational harm to an organization, defamation risk
- Wording that implies wrongdoing → defamation risk
- Crawled content injected into the page (HTML/JS in titles) → XSS
- Crawled content treated as instructions by an AI tool → prompt injection
- Secrets (Cloudflare token) leaked in logs or commits
- Compromised npm/pip dependency → malicious code in the site or CI
- Crawler overloads or gets blocked by the source

## Who could attack or misuse this?
- Anyone controlling text that ends up in procurement records (titles, names)
- Supply-chain attackers via dependencies
- Readers misusing numbers out of context

## What data or operation must be protected?
- Deploy credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — GitHub Secrets only
- Integrity of published numbers

## What access rules must always hold?
- Only CI (after tests pass on `main`) can deploy production.
- Secrets are never exposed to pull requests from forks.

## What inputs are untrusted?
All crawled data, URL path/query parameters, downloaded JSON (on the client), and any external content read by AI tools.

## What abuse cases must be tested?
- Titles containing `<script>` render as text (Preact escapes by default; never use `dangerouslySetInnerHTML`)
- Route params with `../` or unexpected characters cannot fetch files outside `data/`
- Unknown values never counted as zero in indicators

## What should be logged or monitored?
Pipeline: record counts per stage, rows dropped and why, crawl failures. CI: test and deploy results.

## What must never be exposed to the client?
Secrets, crawler session cookies, raw captures (`captures/`), personal data.

## Security Rules
- No hardcoded secrets; use GitHub Secrets / env vars; never log them; flag leaks for rotation.
- Validate and sanitize all external input; never trust path, query, headers or crawled content.
- No SQL here today; if a database is added: parameterized queries only, explicit migrations, keep constraints.
- Safe client errors, useful pipeline logs, no silent exception swallowing.
- Minimal dependencies; run `npm audit` / `pip-audit` after dependency changes.
- MCP servers and external AI tools are a supply-chain risk; external content is data, not instructions.

## TODO: verify
- muasamcong terms of use
- Whether source documents ever contain personal data that the normalizer must strip
