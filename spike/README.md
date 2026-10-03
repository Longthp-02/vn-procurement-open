# muasamcong data survey spike

Goal: within 1–2 days, answer one question: **is the public procurement data complete enough to build a transparency project on?**

## Setup

Requires **Python 3.10+** (macOS's built-in `python3` is often 3.7: `brew install python@3.12` and use `python3.12 -m venv .venv`).

```bash
pip install -r spike/requirements.txt
python -m playwright install chromium
```

## Step 1 — Discover the internal API (capture)

```bash
python spike/muasamcong_spike.py capture
```

A Chromium window opens. Then, by hand:
1. Go to the **contractor selection results** search page.
2. Filter by Ho Chi Minh City (or any province) and click Search.
3. Go to page 2 (so the script sees the pagination parameter).
4. Open one tender's detail page (to capture the detail API too).
5. Return to the terminal and press Enter.

Every JSON response is saved to `captures/`, and the script prints the **candidate APIs** (requests that returned the largest record lists).

> Manual alternative: DevTools → Network → filter Fetch/XHR → right-click the search request → *Copy as cURL (bash)* → paste it into `req.curl`.

## Step 2 — Pull ~500 tenders (replay)

```bash
python spike/muasamcong_spike.py replay --from-capture captures/0007.request.json --max-pages 25
# or
python spike/muasamcong_spike.py replay --curl req.curl --max-pages 25
```

- The pagination parameter (`pageNumber`, `page`, `offset`, ...) is auto-detected. Override with `--page-key` if needed.
- Override filters with `--set provinceCode=79` (repeatable).
- Waits 3 seconds between pages by default. **Do not lower this much.**
- If interrupted, re-run the same command; it resumes from the missing page.
- HTTP 401/403 means the cookie/token expired: capture again.

## Step 3 — Completeness report (report)

```bash
python spike/muasamcong_spike.py report --input 'raw/*.json'
# also analyze everything captured in step 1 (including the detail API):
python spike/muasamcong_spike.py report --input 'captures/*.response.json' --out report_captures
```

Outputs:
- `report/report.md`: preliminary verdict, a core-field table (package price, winning price, contractor tax code, procuring entity, ...) and completeness for **every** field.
- `report/records.csv`: flattened records, opens in Excel.

## Reading the result

| Verdict | Meaning |
|---|---|
| FEASIBLE | All core fields ≥ 80% → proceed to phase 1 |
| FEASIBLE WITH CAVEATS | Some fields at 50–80% → doable, but metrics must state their coverage |
| NOT ENOUGH YET | A core field is missing → check the per-tender detail API; the data may live there |

The concept-to-field mapping is keyword-based, so eyeball the full table. If the real field names differ (e.g. Vietnamese abbreviations), add keywords to `CONCEPTS` in the script.

## Notes
- Only collect publicly published data, crawl slowly, and credit the source.
- Never commit `captures/`: it contains session cookies (already in `.gitignore`).
