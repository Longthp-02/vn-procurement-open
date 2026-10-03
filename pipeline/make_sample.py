#!/usr/bin/env python3
"""
Generate a deterministic SAMPLE dataset in the normalized format (docs/data-contract.md).

Every name is visibly fake ("Mẫu" = "sample"), tax codes start with "00" (never a valid
Vietnamese tax code) and source_url is null, so sample records can never be mistaken for real ones.
Vietnamese strings below are sample *content* shown to Vietnamese readers, not code.

Usage: python pipeline/make_sample.py --out data/normalized/tenders.jsonl
"""
import argparse
import json
import random
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

SEED = 20261003

# Province profiles shape the sample so indicators differ between provinces.
# (id, name, weight, single_bid_rate, disclosure_rate)
PROVINCES = [
    ("ho-chi-minh", "TP. Hồ Chí Minh", 0.28, 0.20, 0.92),
    ("ha-noi", "Hà Nội", 0.27, 0.24, 0.89),
    ("hai-phong", "Hải Phòng", 0.13, 0.28, 0.86),
    ("da-nang", "Đà Nẵng", 0.12, 0.31, 0.85),
    ("can-tho", "Cần Thơ", 0.10, 0.34, 0.80),
    ("khanh-hoa", "Khánh Hòa", 0.10, 0.38, 0.75),
]

BUYER_KINDS = [
    ("pmu", "Ban QLDA Mẫu"),
    ("ward", "UBND Phường Mẫu"),
    ("dept", "Sở Mẫu"),
    ("hospital", "Bệnh viện Mẫu"),
    ("school", "Trường Mẫu"),
]

CONTRACTOR_PREFIX = ["Công ty TNHH", "Công ty CP", "Công ty TNHH MTV"]
CONTRACTOR_TRADE = ["Xây dựng", "Thiết bị", "Kỹ thuật", "Thương mại", "Đầu tư", "Công trình"]

SCHOOL_LEVELS = ["Mầm non", "Tiểu học", "THCS", "THPT"]

# Topic templates: (topic slug, sector, weight, title builder, value range in million VND)
TOPICS = [
    ("schools", "construction", 0.22, "school", (3_000, 120_000)),
    ("medical-equipment", "goods", 0.20, "medical", (500, 40_000)),
    ("roads", "construction", 0.20, "road", (5_000, 250_000)),
    ("other", "mixed", 0.38, "other", (200, 30_000)),
]

MEDICAL_ITEMS = ["máy siêu âm", "máy X-quang", "máy thở", "vật tư tiêu hao", "giường bệnh", "máy xét nghiệm"]
OTHER_WORKS = [
    ("construction", "Cải tạo trụ sở làm việc"),
    ("construction", "Sửa chữa hệ thống thoát nước khu vực"),
    ("construction", "Lắp đặt hệ thống chiếu sáng tuyến đường"),
    ("goods", "Mua sắm thiết bị công nghệ thông tin"),
    ("non_consulting", "Dịch vụ vệ sinh, chăm sóc cây xanh"),
    ("consulting", "Tư vấn lập báo cáo kinh tế kỹ thuật"),
    ("construction", "Cải tạo công viên"),
]

DOC_KEYS = ["plan", "notice", "tender_docs", "opening_minutes", "evaluation_report", "award", "contract"]
# Documents that are always published when a tender exists vs. those that are often missing.
DOC_BASE_RATE = {"plan": 0.99, "notice": 1.0, "tender_docs": 0.98, "opening_minutes": 0.93,
                 "evaluation_report": 0.62, "award": 1.0, "contract": 0.55}


def pick_weighted(rng, items, weight_index):
    return rng.choices(items, weights=[it[weight_index] for it in items], k=1)[0]


def make_entities(rng):
    buyers, contractors = [], []
    for p_id, p_name, *_ in PROVINCES:
        for i in range(1, 11):
            kind, label = BUYER_KINDS[(i - 1) % len(BUYER_KINDS)]
            buyers.append({"id": f"sample-b-{p_id}-{i:02d}", "name": f"{label} {i:02d} ({p_name})",
                           "kind": kind, "province": {"id": p_id, "name": p_name}})
    for i in range(1, 161):
        home = pick_weighted(rng, PROVINCES, 2)
        name = f"{rng.choice(CONTRACTOR_PREFIX)} {rng.choice(CONTRACTOR_TRADE)} Mẫu {i:03d}"
        contractors.append({"id": f"sample-c-{i:03d}", "tax_code": f"00{i:08d}", "name": name,
                            "home": home[0], "skill": rng.random()})
    return buyers, contractors


def title_for(rng, builder):
    if builder == "school":
        level = rng.choice(SCHOOL_LEVELS)
        rooms = rng.choice([6, 8, 9, 10, 12, 15, 16, 18, 20, 24])
        verb = rng.choice(["Xây dựng mới", "Xây dựng khối", "Cải tạo, mở rộng"])
        return f"{verb} {rooms} phòng học, Trường {level} Mẫu {rng.randint(1, 99):02d}", {"kind": "classroom", "count": rooms}
    if builder == "medical":
        return f"Mua sắm {rng.choice(MEDICAL_ITEMS)} cho đơn vị y tế Mẫu {rng.randint(1, 60):02d}", None
    if builder == "road":
        km = rng.randint(1, 12)
        return f"Nâng cấp tuyến đường Mẫu {rng.randint(1, 80):02d}, đoạn Km0–Km{km}", None
    sector, text = rng.choice(OTHER_WORKS)
    return f"{text} Mẫu {rng.randint(1, 99):02d}", None


def make_tender(rng, n, buyers, contractors, collected_at):
    p_id, p_name, _, single_rate, disclosure = pick_weighted(rng, PROVINCES, 2)
    topic, sector, _, builder, (lo, hi) = pick_weighted(rng, TOPICS, 2)
    title, units = title_for(rng, builder)
    if builder == "other":
        sector = next(s for s, t in OTHER_WORKS if title.startswith(t))
    buyer = rng.choice([b for b in buyers if b["province"]["id"] == p_id])

    estimate_m = round(rng.uniform(lo, hi) / 10) * 10
    if units:  # classroom cost roughly proportional to rooms, with a provincial spread
        base = {"ho-chi-minh": 1180, "ha-noi": 1240, "hai-phong": 1020, "da-nang": 960,
                "can-tho": 870, "khanh-hoa": 1310}[p_id]
        estimate_m = round(units["count"] * base * rng.uniform(0.85, 1.2) / 10) * 10
    estimate = estimate_m * 1_000_000

    notice = date(2022, 1, 1) + timedelta(days=rng.randint(0, 1735))
    plan = notice - timedelta(days=rng.randint(10, 60))
    opening = notice + timedelta(days=rng.randint(14, 30))
    award_day = opening + timedelta(days=rng.randint(15, 75))
    status = "awarded" if award_day < date(2026, 10, 1) and rng.random() > 0.05 else "open"
    if rng.random() < 0.02:
        status = "cancelled"

    if rng.random() < single_rate:
        n_bids = 1
    else:
        n_bids = rng.choices([2, 3, 4, 5, 6], weights=[30, 30, 20, 12, 8])[0]
    method = "direct" if n_bids == 1 and rng.random() < 0.25 else rng.choices(
        ["open", "limited", "quotation", "other"], weights=[70, 10, 15, 5])[0]

    locals_ = [c for c in contractors if c["home"] == p_id] or contractors
    pool = locals_ if rng.random() < 0.8 else contractors
    bidders = rng.sample(pool, k=min(n_bids, len(pool)))
    bidders.sort(key=lambda c: -c["skill"] + rng.uniform(-0.3, 0.3))

    discount = rng.uniform(0.0, 0.012) if n_bids == 1 else rng.uniform(0.01, 0.03 + 0.012 * n_bids)
    award = int(round(estimate * (1 - discount) / 1_000_000) * 1_000_000)
    bids = []
    for i, c in enumerate(bidders):
        amount = award if i == 0 else int(round(award * rng.uniform(1.005, 1.06) / 1_000_000) * 1_000_000)
        bids.append({"contractor": {"id": c["id"], "tax_code": c["tax_code"], "name": c["name"]},
                     "amount_vnd": amount, "won": i == 0 and status == "awarded"})

    docs = {k: rng.random() < min(1.0, DOC_BASE_RATE[k] * (disclosure / 0.85) ** (0 if DOC_BASE_RATE[k] >= 0.98 else 1))
            for k in DOC_KEYS}
    if status != "awarded":
        docs.update(award=False, contract=False, evaluation_report=False)
        bids = [dict(b, won=False) for b in bids]
    if status == "open":
        docs["opening_minutes"] = docs["opening_minutes"] and opening < date(2026, 10, 1)

    return {
        "id": f"SMP-{notice.year}-{n:05d}",
        "title": title,
        "province": {"id": p_id, "name": p_name},
        "sector": sector,
        "method": method,
        "topics": [topic] if topic != "other" else [],
        "funding": rng.choice(["Ngân sách địa phương", "Ngân sách trung ương", "Nguồn thu sự nghiệp"]),
        "buyer": {"id": buyer["id"], "name": buyer["name"], "kind": buyer["kind"]},
        "status": status,
        "estimate_vnd": estimate,
        "award_vnd": award if status == "awarded" else None,
        "bids": bids if docs["opening_minutes"] else None,
        "documents": docs,
        "dates": {
            "plan": plan.isoformat() if docs["plan"] else None,
            "notice": notice.isoformat(),
            "opening": opening.isoformat() if docs["opening_minutes"] else None,
            "award": award_day.isoformat() if status == "awarded" else None,
        },
        "units": units,
        "source_url": None,
        "collected_at": collected_at,
    }


def main():
    ap = argparse.ArgumentParser(description="Generate the sample dataset")
    ap.add_argument("--out", default="data/normalized/tenders.jsonl")
    ap.add_argument("--count", type=int, default=1800)
    args = ap.parse_args()

    rng = random.Random(SEED)
    buyers, contractors = make_entities(rng)
    collected_at = datetime(2026, 10, 3, 0, 0, tzinfo=UTC).isoformat()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as fh:
        for n in range(1, args.count + 1):
            fh.write(json.dumps(make_tender(rng, n, buyers, contractors, collected_at), ensure_ascii=False) + "\n")
    print(f"Wrote {args.count} sample tenders to {out}")


if __name__ == "__main__":
    main()
