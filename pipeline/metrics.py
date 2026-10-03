"""
Indicator definitions. Pure functions over normalized tender dicts (docs/data-contract.md).

Every group indicator returns {"value": ..., "n": <tenders used>} so the site can always show
how many tenders a number is based on. value is None when n == 0.
"""
from datetime import date
from statistics import mean, median

DOC_KEYS = ["plan", "notice", "tender_docs", "opening_minutes", "evaluation_report", "award", "contract"]


def _ind(value, n):
    return {"value": value, "n": n}


def is_awarded(t):
    return t.get("status") == "awarded" and t.get("award_vnd") is not None


def bidder_count(t):
    """Number of bidders, or None when bid opening minutes were not published."""
    bids = t.get("bids")
    return None if bids is None else len(bids)


def savings(t):
    """(estimate - award) / estimate, or None if either value is missing or estimate is 0."""
    e, a = t.get("estimate_vnd"), t.get("award_vnd")
    if not e or a is None:
        return None
    return (e - a) / e


def processing_days(t):
    d = t.get("dates") or {}
    if not d.get("notice") or not d.get("award"):
        return None
    return (date.fromisoformat(d["award"]) - date.fromisoformat(d["notice"])).days


def disclosure(t):
    docs = t.get("documents") or {}
    return sum(1 for k in DOC_KEYS if docs.get(k)) / len(DOC_KEYS)


def winner(t):
    for b in t.get("bids") or []:
        if b.get("won"):
            return b["contractor"]
    return None


# ---------------------------------------------------------------- group indicators ---

def single_bidder_share(tenders):
    counts = [bidder_count(t) for t in tenders if is_awarded(t)]
    counts = [c for c in counts if c is not None]
    return _ind(sum(1 for c in counts if c == 1) / len(counts) if counts else None, len(counts))


def avg_bidders(tenders):
    counts = [c for c in (bidder_count(t) for t in tenders if is_awarded(t)) if c is not None]
    return _ind(mean(counts) if counts else None, len(counts))


def avg_savings(tenders):
    vals = [s for s in (savings(t) for t in tenders if is_awarded(t)) if s is not None]
    return _ind(mean(vals) if vals else None, len(vals))


def median_processing_days(tenders):
    vals = [d for d in (processing_days(t) for t in tenders if is_awarded(t)) if d is not None]
    return _ind(median(vals) if vals else None, len(vals))


def avg_disclosure(tenders):
    vals = [disclosure(t) for t in tenders]
    return _ind(mean(vals) if vals else None, len(vals))


def disclosure_by_document(tenders):
    n = len(tenders)
    return {k: _ind(sum(1 for t in tenders if (t.get("documents") or {}).get(k)) / n if n else None, n)
            for k in DOC_KEYS}


def award_value(tenders):
    return sum(t["award_vnd"] for t in tenders if is_awarded(t))


def top_share(tenders, k=5):
    """Share of total award value won by the k largest contractors."""
    by_c, used = {}, 0
    for t in tenders:
        w = winner(t)
        if is_awarded(t) and w:
            by_c[w["id"]] = by_c.get(w["id"], 0) + t["award_vnd"]
            used += 1
    total = sum(by_c.values())
    if not total:
        return _ind(None, 0)
    return _ind(sum(sorted(by_c.values(), reverse=True)[:k]) / total, used)


def median_unit_cost(tenders, kind):
    vals = [t["award_vnd"] / t["units"]["count"] for t in tenders
            if is_awarded(t) and t.get("units") and t["units"].get("kind") == kind and t["units"].get("count")]
    return _ind(median(vals) if vals else None, len(vals))
