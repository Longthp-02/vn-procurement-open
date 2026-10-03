#!/usr/bin/env python3
"""
Build the static JSON the website reads, from normalized tenders (docs/data-contract.md).

Usage: python pipeline/build_site_data.py --input data/normalized/tenders.jsonl --out web/public/data [--sample]

Output layout (all paths relative to --out):
  meta.json                  national indicators, sector baselines, build info
  provinces.json             one row per province
  topics.json                one row per topic
  tenders.json               compact index of every tender (search and lists)
  tender/<id>.json           full tender record plus context
  contractor/<id>.json       contractor profile
  buyer/<id>.json            procuring-entity profile
  topic/<id>.json            topic page
  buyers.json, contractors.json   list pages
  download/tenders.{jsonl,csv}    open-data downloads
"""
import argparse
import csv
import json
import shutil
import sys
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import metrics as m  # noqa: E402

TOPIC_UNITS = {"schools": "classroom"}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def group_indicators(ts):
    return {
        "tenders": len(ts),
        "awarded": sum(1 for t in ts if m.is_awarded(t)),
        "award_value_vnd": m.award_value(ts),
        "single_bidder_share": m.single_bidder_share(ts),
        "avg_bidders": m.avg_bidders(ts),
        "avg_savings": m.avg_savings(ts),
        "median_days": m.median_processing_days(ts),
        "disclosure": m.avg_disclosure(ts),
        "top5_share": m.top_share(ts),
    }


def last_date(t):
    d = t.get("dates") or {}
    return d.get("award") or d.get("opening") or d.get("notice")


def index_row(t):
    w = m.winner(t)
    docs = t.get("documents") or {}
    return {
        "id": t["id"], "title": t["title"], "province": t["province"]["id"], "sector": t["sector"],
        "method": t["method"], "topics": t.get("topics") or [], "status": t["status"],
        "buyer": t["buyer"]["id"], "buyer_name": t["buyer"]["name"],
        "winner": w["id"] if w else None, "winner_name": w["name"] if w else None,
        "winner_tax": w["tax_code"] if w else None,
        "estimate": t.get("estimate_vnd"), "award": t.get("award_vnd"),
        "bidders": m.bidder_count(t), "date": last_date(t),
        "docs": sum(1 for k in m.DOC_KEYS if docs.get(k)),
    }


def by_year(ts):
    out = defaultdict(int)
    for t in ts:
        if m.is_awarded(t):
            out[t["dates"]["award"][:4]] += t["award_vnd"]
    return [{"year": y, "value_vnd": v} for y, v in sorted(out.items())]


def share_rank(ts, key, name_key, limit=5):
    """Rank related entities by share of this group's award value."""
    total = m.award_value(ts)
    agg = {}
    for t in ts:
        if not m.is_awarded(t):
            continue
        k, name = key(t), name_key(t)
        if k is None:
            continue
        row = agg.setdefault(k, {"id": k, "name": name, "count": 0, "value_vnd": 0})
        row["count"] += 1
        row["value_vnd"] += t["award_vnd"]
    rows = sorted(agg.values(), key=lambda r: -r["value_vnd"])[:limit]
    for r in rows:
        r["share"] = r["value_vnd"] / total if total else None
    return rows


def recent(ts, limit=20):
    return [index_row(t) for t in sorted(ts, key=lambda t: last_date(t) or "", reverse=True)[:limit]]


def largest(ts, limit=10):
    return [index_row(t) for t in sorted((t for t in ts if m.is_awarded(t)), key=lambda t: -t["award_vnd"])[:limit]]


def main():
    ap = argparse.ArgumentParser(description="Build website data")
    ap.add_argument("--input", default="data/normalized/tenders.jsonl")
    ap.add_argument("--out", default="web/public/data")
    ap.add_argument("--sample", action="store_true", help="mark the output as sample data")
    args = ap.parse_args()

    tenders = load(args.input)
    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)

    by_province, by_buyer, by_contractor_won, by_contractor_bid = (defaultdict(list) for _ in range(4))
    by_topic, by_sector = defaultdict(list), defaultdict(list)
    names = {"province": {}, "buyer": {}, "contractor": {}}
    for t in tenders:
        by_province[t["province"]["id"]].append(t)
        names["province"][t["province"]["id"]] = t["province"]["name"]
        by_buyer[t["buyer"]["id"]].append(t)
        names["buyer"][t["buyer"]["id"]] = t["buyer"]
        by_sector[t["sector"]].append(t)
        for topic in t.get("topics") or []:
            by_topic[topic].append(t)
        for b in t.get("bids") or []:
            c = b["contractor"]
            names["contractor"][c["id"]] = c
            by_contractor_bid[c["id"]].append(t)
        w = m.winner(t)
        if w:
            by_contractor_won[w["id"]].append(t)

    national = group_indicators(tenders)
    sector_base = {s: {"avg_bidders": m.avg_bidders(ts), "avg_savings": m.avg_savings(ts),
                       "median_days": m.median_processing_days(ts)} for s, ts in by_sector.items()}
    years = sorted({(t["dates"].get("award") or t["dates"]["notice"])[:4] for t in tenders})

    write(out / "meta.json", {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "collected_at": max(t["collected_at"] for t in tenders),
        "is_sample": args.sample,
        "source": "muasamcong.mpi.gov.vn",
        "years": [years[0], years[-1]] if years else None,
        "counts": {"tenders": len(tenders), "buyers": len(by_buyer), "contractors": len(names["contractor"])},
        "national": national,
        "sectors": sector_base,
    })

    provinces = [{"id": pid, "name": names["province"][pid], **group_indicators(ts)} for pid, ts in by_province.items()]
    provinces.sort(key=lambda p: -p["award_value_vnd"])
    write(out / "provinces.json", provinces)

    topics = []
    for tid, ts in by_topic.items():
        row = {"id": tid, **group_indicators(ts)}
        topics.append(row)
        unit = TOPIC_UNITS.get(tid)
        unit_cost = None
        if unit:
            unit_cost = sorted(
                ({"province": pid, "name": names["province"][pid], **m.median_unit_cost(pts, unit)}
                 for pid, pts in ((pid, [t for t in ts if t["province"]["id"] == pid]) for pid in by_province)),
                key=lambda r: -(r["value"] or 0))
        write(out / "topic" / f"{tid}.json", {**row, "unit": unit, "unit_cost": unit_cost, "largest": largest(ts)})
    topics.sort(key=lambda r: -r["award_value_vnd"])
    write(out / "topics.json", topics)

    write(out / "tenders.json", [index_row(t) for t in sorted(tenders, key=lambda t: last_date(t) or "", reverse=True)])

    for t in tenders:
        w = m.winner(t)
        b_ts = by_buyer[t["buyer"]["id"]]
        write(out / "tender" / f"{t['id']}.json", {
            **t,
            "derived": {"bidders": m.bidder_count(t), "savings": m.savings(t), "days": m.processing_days(t),
                        "disclosure": m.disclosure(t)},
            "context": {
                "sector": sector_base[t["sector"]],
                "buyer_tenders": len(b_ts),
                "buyer_since": min(x["dates"]["notice"] for x in b_ts)[:4],
                "winner_wins_with_buyer": sum(1 for x in b_ts if (m.winner(x) or {}).get("id") == (w or {}).get("id")) if w else None,
            },
        })

    for bid, ts in by_buyer.items():
        b = names["buyer"][bid]
        write(out / "buyer" / f"{bid}.json", {
            **b, "province": ts[0]["province"], "since": min(t["dates"]["notice"] for t in ts)[:4],
            **group_indicators(ts),
            "documents": m.disclosure_by_document(ts),
            "top_contractors": share_rank(ts, lambda t: (m.winner(t) or {}).get("id"), lambda t: (m.winner(t) or {}).get("name")),
            "recent": recent(ts),
        })

    for cid, c in names["contractor"].items():
        won = by_contractor_won.get(cid, [])
        bid = by_contractor_bid.get(cid, [])
        write(out / "contractor" / f"{cid}.json", {
            **c,
            "bids": len(bid), "wins": len(won), "award_value_vnd": m.award_value(won),
            "buyers": len({t["buyer"]["id"] for t in won}),
            "provinces": sorted({t["province"]["name"] for t in won}),
            "by_year": by_year(won),
            "top_buyers": share_rank(won, lambda t: t["buyer"]["id"], lambda t: t["buyer"]["name"]),
            "recent_wins": recent(won),
        })

    write(out / "buyers.json", sorted(
        ({"id": bid, "name": names["buyer"][bid]["name"], "kind": names["buyer"][bid]["kind"],
          "province": ts[0]["province"]["id"], "tenders": len(ts), "award_value_vnd": m.award_value(ts),
          "disclosure": m.avg_disclosure(ts)["value"]} for bid, ts in by_buyer.items()),
        key=lambda r: -r["award_value_vnd"]))
    write(out / "contractors.json", sorted(
        ({"id": cid, "name": c["name"], "tax_code": c["tax_code"], "bids": len(by_contractor_bid.get(cid, [])),
          "wins": len(by_contractor_won.get(cid, [])), "award_value_vnd": m.award_value(by_contractor_won.get(cid, []))}
         for cid, c in names["contractor"].items()),
        key=lambda r: -r["award_value_vnd"]))

    # Open-data downloads: the normalized records as-is, plus a flat CSV of the index.
    dl = out / "download"
    dl.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.input, dl / "tenders.jsonl")
    rows = [index_row(t) for t in tenders]
    with open(dl / "tenders.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows({**r, "topics": "|".join(r["topics"])} for r in rows)

    print(f"Built site data for {len(tenders)} tenders, {len(by_buyer)} buyers, "
          f"{len(names['contractor'])} contractors -> {out}")


if __name__ == "__main__":
    main()
