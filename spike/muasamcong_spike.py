#!/usr/bin/env python3
"""
Data survey spike for muasamcong.mpi.gov.vn (Vietnam National E-Procurement System).

Three steps:
  1. capture  - open a real Chromium window; you search manually while the script records every
                JSON response (XHR/fetch) so we can discover the internal API the site uses.
  2. replay   - re-issue that request, page through results, save raw JSON (resumable, no duplicates).
  3. report   - collect records, flatten them, measure per-field completeness, write report.md + records.csv.

Endpoints and field names are unknown in advance, so everything is auto-detected (heuristics).
See README.md.
"""
import argparse
import csv
import hashlib
import json
import random
import shlex
import sys
import time
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

# ----------------------------------------------------------------- helpers ---

PAGE_KEYS = ["pageNumber", "pageNo", "page", "pageIndex", "currentPage", "pageNum", "offset", "from", "start"]
SIZE_KEYS = ["pageSize", "size", "limit", "rows", "perPage", "length"]
ID_KEYS = ["id", "notifyId", "notifyNo", "bidId", "code", "uuid"]


def find_record_list(obj, path=()):
    """Find the largest list-of-dicts anywhere in a JSON document. Returns (path, list) or (None, None)."""
    best_path, best = None, None
    if isinstance(obj, list):
        if obj and all(isinstance(x, dict) for x in obj):
            best_path, best = path, obj
        for i, x in enumerate(obj[:1]):  # only probe the first element, for speed
            p, found = find_record_list(x, path + (i,))
            if found is not None and (best is None or len(found) > len(best)):
                best_path, best = p, found
    elif isinstance(obj, dict):
        for k, v in obj.items():
            p, found = find_record_list(v, path + (k,))
            if found is not None and (best is None or len(found) > len(best)):
                best_path, best = p, found
    return best_path, best


def set_key_everywhere(obj, key, value):
    """Set `value` on every key with this name, recursively. Returns how many places were set."""
    n = 0
    if isinstance(obj, dict):
        for k in list(obj.keys()):
            if k == key:
                obj[k] = value
                n += 1
            else:
                n += set_key_everywhere(obj[k], key, value)
    elif isinstance(obj, list):
        for x in obj:
            n += set_key_everywhere(x, key, value)
    return n


def find_key(obj, candidates):
    """Return (key, value) for the first candidate (in priority order) present at any depth."""
    found = {}

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in candidates and k not in found and not isinstance(v, (dict, list)):
                    found[k] = v
                walk(v)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(obj)
    for c in candidates:
        if c in found:
            return c, found[c]
    return None, None


def is_empty(v):
    return v is None or v == "" or v == [] or v == {} or (isinstance(v, str) and v.strip().lower() in ("null", "none"))


def flatten(rec, prefix=""):
    """Nested dict -> {"a.b": v}. Scalar lists are joined. Lists of dicts become 'key[]' = item count,
    plus 'key[].sub' = the first non-empty value among the items."""
    out = {}
    if isinstance(rec, dict):
        for k, v in rec.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            if isinstance(v, dict):
                out.update(flatten(v, key))
            elif isinstance(v, list):
                if v and all(isinstance(x, dict) for x in v):
                    out[f"{key}[]"] = len(v)
                    merged = {}
                    for x in v:
                        for fk, fv in flatten(x, f"{key}[]").items():
                            if fk not in merged or is_empty(merged[fk]):
                                merged[fk] = fv
                    out.update(merged)
                else:
                    out[key] = " | ".join(str(x) for x in v) if v else None
            else:
                out[key] = v
    return out


# ----------------------------------------------------------------- capture ---

def cmd_capture(args):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("Missing playwright: pip install playwright && python -m playwright install chromium")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    counter = [len(list(out.glob("*.request.json")))]
    seen = []

    def on_response(resp):
        req = resp.request
        if req.resource_type not in ("xhr", "fetch"):
            return
        if "json" not in (resp.headers.get("content-type") or ""):
            return
        try:
            body = resp.json()
        except Exception:
            return
        counter[0] += 1
        n = counter[0]
        try:
            headers = req.all_headers()
        except Exception:
            headers = req.headers
        meta = {"id": n, "url": req.url, "method": req.method, "headers": headers,
                "post_data": req.post_data, "status": resp.status}
        (out / f"{n:04d}.request.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        (out / f"{n:04d}.response.json").write_text(json.dumps(body, ensure_ascii=False, indent=2), encoding="utf-8")
        _, lst = find_record_list(body)
        size = len(lst) if lst else 0
        seen.append((n, req.method, size, req.url))
        print(f"  [{n:04d}] {req.method} {resp.status} records={size:<4} {req.url[:110]}")

    print(f"Opening browser at {args.url}")
    print("-> Go to the search page, filter (e.g. contractor selection results, Ho Chi Minh City), click Search, go to page 2.")
    print("-> When done, come back to this terminal and press Enter.\n")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        ctx = browser.new_context(locale="vi-VN")
        page = ctx.new_page()
        page.on("response", on_response)
        page.goto(args.url, wait_until="domcontentloaded", timeout=90_000)
        input()
        ctx.storage_state(path=str(out / "storage_state.json"))
        browser.close()

    cands = sorted([s for s in seen if s[2] > 0], key=lambda s: -s[2])
    print("\nCandidate APIs (responses containing a list of records):")
    for n, m, size, url in cands[:10]:
        print(f"  {n:04d}  {m:<5} records={size:<4} {url[:110]}")
    if cands:
        print(f"\nNext: python {Path(sys.argv[0]).name} replay --from-capture {out}/{cands[0][0]:04d}.request.json")
    else:
        print("\nNo JSON response with a record list was captured. The page may be server-rendered, or needs more interaction.")


# ------------------------------------------------------------------ replay ---

def parse_curl(text):
    """Parse a 'Copy as cURL (bash)' command from browser DevTools."""
    tokens = shlex.split(text.replace("\\\n", " "))
    url, method, headers, data = None, None, {}, None
    i = 0
    while i < len(tokens):
        t = tokens[i]
        nxt = tokens[i + 1] if i + 1 < len(tokens) else None
        if t == "curl":
            pass
        elif t in ("-X", "--request"):
            method = nxt; i += 1
        elif t in ("-H", "--header"):
            k, _, v = nxt.partition(":"); headers[k.strip()] = v.strip(); i += 1
        elif t in ("-b", "--cookie"):
            headers["Cookie"] = nxt; i += 1
        elif t in ("--data", "--data-raw", "--data-binary", "-d", "--data-urlencode"):
            data = nxt; i += 1
        elif t.startswith("http"):
            url = t
        elif t.startswith("-"):
            pass  # irrelevant flags: --compressed, -k, ...
        i += 1
    return {"url": url, "method": method or ("POST" if data else "GET"), "headers": headers, "post_data": data}


def load_spec(args):
    if args.from_capture:
        spec = json.loads(Path(args.from_capture).read_text(encoding="utf-8"))
        state = Path(args.from_capture).parent / "storage_state.json"
        if state.exists() and not any(k.lower() == "cookie" for k in spec["headers"]):
            host = urlparse(spec["url"]).hostname or ""
            cookies = json.loads(state.read_text(encoding="utf-8")).get("cookies", [])
            jar = "; ".join(f"{c['name']}={c['value']}" for c in cookies if host.endswith(c["domain"].lstrip(".")))
            if jar:
                spec["headers"]["Cookie"] = jar
        return spec
    if args.curl:
        return parse_curl(Path(args.curl).read_text(encoding="utf-8"))
    sys.exit("Either --from-capture or --curl is required")


def cmd_replay(args):
    import requests

    spec = load_spec(args)
    drop = {"content-length", "host", "accept-encoding", "connection"}
    headers = {k: v for k, v in spec["headers"].items() if k.lower() not in drop and not k.startswith(":")}

    # Body: JSON, form-urlencoded, or none (GET -> paginate via the query string)
    body_kind, body = "none", None
    if spec.get("post_data"):
        try:
            body, body_kind = json.loads(spec["post_data"]), "json"
        except ValueError:
            body, body_kind = dict(parse_qsl(spec["post_data"], keep_blank_values=True)), "form"
    parsed = urlparse(spec["url"])
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    target = body if body_kind != "none" else query

    for kv in args.set or []:
        k, _, v = kv.partition("=")
        try:
            v = json.loads(v)
        except ValueError:
            pass
        n = set_key_everywhere(target, k, v)
        print(f"  --set {k}={v!r}: set in {n} place(s)" + ("  (key not found!)" if n == 0 else ""))

    page_key = args.page_key or find_key(target, PAGE_KEYS)[0]
    if not page_key:
        sys.exit(f"Could not detect the pagination parameter. Use --page-key. Request: {json.dumps(target, ensure_ascii=False)[:400]}")
    _, cur = find_key(target, [page_key])
    start = args.page_start if args.page_start is not None else int(cur or 0)
    size_key, size_val = find_key(target, SIZE_KEYS)
    if args.page_size and size_key:
        set_key_everywhere(target, size_key, args.page_size)
        size_val = args.page_size
    is_offset = page_key in ("offset", "from", "start")
    step = int(size_val or 20) if is_offset else 1
    print(f"Paginating on '{page_key}' from {start}, step {step}" + (f", '{size_key}'={size_val}" if size_key else ""))

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    sess = requests.Session()
    total, value = 0, start
    for i in range(args.max_pages):
        f = out / f"page_{i + 1:05d}.json"
        if f.exists():
            _, lst = find_record_list(json.loads(f.read_text(encoding="utf-8")))
            n = len(lst or [])
            total += n
            print(f"  page {i + 1}: already saved ({n} records), skipping")
            if n == 0:
                break
            value += step
            continue

        set_key_everywhere(target, page_key, value)
        url = urlunparse(parsed._replace(query=urlencode(query))) if body_kind == "none" else spec["url"]
        kwargs = {"headers": headers, "timeout": 60}
        if body_kind == "json":
            kwargs["data"] = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif body_kind == "form":
            kwargs["data"] = body

        data = None
        for attempt in range(1, args.retries + 1):
            try:
                r = sess.request(spec["method"], url, **kwargs)
                if r.status_code >= 500 or r.status_code == 429:
                    raise RuntimeError(f"HTTP {r.status_code}")
                if r.status_code >= 400:
                    sys.exit(f"HTTP {r.status_code} on page {i + 1}: {r.text[:300]}\n"
                             "-> The token/cookie may have expired. Capture again or copy a fresh cURL.")
                data = r.json()
                break
            except (requests.RequestException, RuntimeError, ValueError) as e:
                wait = args.delay * (2 ** attempt)
                print(f"  page {i + 1}: error on attempt {attempt} ({e}), waiting {wait:.0f}s")
                time.sleep(wait)
        if data is None:
            sys.exit(f"Giving up on page {i + 1}. Re-run the same command to resume from that page.")

        _, lst = find_record_list(data)
        n = len(lst or [])
        f.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        total += n
        print(f"  page {i + 1}: {n} records (total {total})")
        if n == 0:
            break
        value += step
        time.sleep(args.delay + random.uniform(0, args.delay / 2))

    print(f"\nDone: {total} records in {out}/. Next: python {Path(sys.argv[0]).name} report --input '{out}/*.json'")


# ------------------------------------------------------------------ report ---

# Keyword heuristics for mapping unknown field names to concepts.
# Vietnamese romanized keywords are kept on purpose: the source system may use them in field names.
CONCEPTS = {
    "Package / estimated price": ["bidprice", "packageprice", "estimat", "giagoi", "dutoan", "budget"],
    "Winning price": ["winprice", "winningprice", "contractprice", "giatrung", "bidwin", "lcntprice"],
    "Contractor ID / tax code": ["taxcode", "contractorcode", "orgcode", "bidderid", "mst", "masothue", "contractorid"],
    "Contractor name": ["contractorname", "biddername", "orgname", "nhathau", "winner"],
    "Procuring entity / investor": ["procuring", "investor", "benmoithau", "chudautu", "owner", "employer"],
    "Location / province": ["province", "location", "address", "tinh", "diadiem", "area"],
    "Selection method": ["method", "hinhthuc", "bidform", "selectiontype", "biddingtype"],
    "Sector": ["field", "linhvuc", "category", "investfield", "bidfield"],
    "Date": ["date", "time", "ngay", "publish"],
    "Number of bidders": ["numbidder", "bidders[]", "contractors[]", "participant", "soluongnhathau"],
}

CORE = ["Package / estimated price", "Winning price", "Contractor ID / tax code", "Procuring entity / investor"]


def cmd_report(args):
    files = sorted({p for pattern in args.input for p in Path().glob(pattern)})
    if not files:
        sys.exit(f"No files match {args.input}")

    records, seen_ids = [], set()
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        _, lst = find_record_list(data)
        for rec in lst or []:
            idk, idv = next(((k, rec[k]) for k in ID_KEYS if k in rec and not is_empty(rec[k])), (None, None))
            key = f"{idk}={idv}" if idk else hashlib.md5(json.dumps(rec, sort_keys=True).encode()).hexdigest()
            if key in seen_ids:
                continue
            seen_ids.add(key)
            records.append(flatten(rec))

    if not records:
        sys.exit("No records found in the input files.")

    n = len(records)
    fields = sorted({k for r in records for k in r})
    stats = []
    for k in fields:
        vals = [r.get(k) for r in records]
        filled = [v for v in vals if not is_empty(v)]
        types = Counter(type(v).__name__ for v in filled)
        samples = []
        for v in filled:
            s = str(v)[:60]
            if s not in samples:
                samples.append(s)
            if len(samples) == 3:
                break
        stats.append({"field": k, "fill": len(filled) / n, "distinct": len({str(v) for v in filled}),
                      "type": types.most_common(1)[0][0] if types else "-", "samples": samples})
    stats.sort(key=lambda s: (-s["fill"], s["field"]))

    concept_rows = []
    for concept, kws in CONCEPTS.items():
        matches = [s for s in stats if any(kw in s["field"].lower().replace("_", "") for kw in kws)]
        best = max(matches, key=lambda s: s["fill"]) if matches else None
        concept_rows.append((concept, best, len(matches)))

    def pct(x):
        return f"{x * 100:.0f}%"

    core_fill = {c: (b["fill"] if b else 0) for c, b, _ in concept_rows if c in CORE}
    worst = min(core_fill.values())
    if worst >= 0.8:
        verdict = "FEASIBLE: all core fields are >= 80% complete."
    elif worst >= 0.5:
        verdict = ("FEASIBLE WITH CAVEATS: some core fields are only 50-80% complete; "
                   "metrics built on them must state their coverage.")
    else:
        verdict = ("NOT ENOUGH YET: a core field is < 50% complete or was not detected. Check the full table below; "
                   "the field may only exist in the per-package detail endpoint rather than in the list.")

    lines = [
        "# muasamcong data survey report", "",
        f"- Files read: **{len(files)}**",
        f"- Records (deduplicated): **{n}**",
        f"- Fields after flattening: **{len(fields)}**", "",
        f"## Preliminary verdict\n\n{verdict}", "",
        "> The concept-to-field mapping below is keyword-based (heuristic). Verify it against the full table.", "",
        "## Core fields", "",
        "| Concept | Best matching field | Completeness | Examples | Matching fields |",
        "|---|---|---|---|---|",
    ]
    for concept, best, cnt in concept_rows:
        if best:
            ex = "; ".join(best["samples"][:2]).replace("|", "/")
            lines.append(f"| {concept} | `{best['field']}` | {pct(best['fill'])} | {ex} | {cnt} |")
        else:
            lines.append(f"| {concept} | _not detected_ | - | - | 0 |")
    lines += ["", "## All fields", "",
              "| Field | Completeness | Distinct values | Type | Examples |", "|---|---|---|---|---|"]
    for s in stats:
        ex = "; ".join(s["samples"]).replace("|", "/").replace("\n", " ")
        lines.append(f"| `{s['field']}` | {pct(s['fill'])} | {s['distinct']} | {s['type']} | {ex} |")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    with open(out / "records.csv", "w", newline="", encoding="utf-8-sig") as fh:  # utf-8-sig so Excel reads Vietnamese text correctly
        w = csv.DictWriter(fh, fieldnames=[s["field"] for s in stats])
        w.writeheader()
        w.writerows(records)

    print(f"{n} records, {len(fields)} fields.\n{verdict}\n")
    for concept, best, _ in concept_rows:
        print(f"  {concept:<30} {(best['field'] if best else '-'):<40} {pct(best['fill']) if best else '-'}")
    print(f"\nWrote {out}/report.md and {out}/records.csv")


# -------------------------------------------------------------------- main ---

def main():
    ap = argparse.ArgumentParser(description="Data survey spike for muasamcong")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("capture", help="open a browser and record the site's JSON APIs")
    c.add_argument("--url", default="https://muasamcong.mpi.gov.vn/web/guest/contractor-selection")
    c.add_argument("--out", default="captures")
    c.set_defaults(func=cmd_capture)

    r = sub.add_parser("replay", help="re-issue an API request, paginate, save raw JSON")
    r.add_argument("--from-capture", help="an NNNN.request.json file from the capture step")
    r.add_argument("--curl", help="a file containing a 'Copy as cURL (bash)' command from DevTools")
    r.add_argument("--out", default="raw")
    r.add_argument("--max-pages", type=int, default=25)
    r.add_argument("--page-key", help="name of the page parameter (auto-detected by default)")
    r.add_argument("--page-start", type=int)
    r.add_argument("--page-size", type=int, help="change the page size if the API allows it")
    r.add_argument("--set", action="append", help="override a request parameter, e.g. --set provinceCode=79 (repeatable)")
    r.add_argument("--delay", type=float, default=3.0, help="seconds between pages (default 3s, be polite to the server)")
    r.add_argument("--retries", type=int, default=4)
    r.set_defaults(func=cmd_replay)

    p = sub.add_parser("report", help="measure field completeness")
    p.add_argument("--input", nargs="+", default=["raw/*.json"], help="globs, e.g. 'raw/*.json' 'captures/*.response.json'")
    p.add_argument("--out", default="report")
    p.set_defaults(func=cmd_report)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
