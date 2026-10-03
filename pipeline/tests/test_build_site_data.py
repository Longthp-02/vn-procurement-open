"""Integration tests: run the real builder on a small fixture in a temp directory."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_site_data  # noqa: E402

DOCS = ["plan", "notice", "tender_docs", "opening_minutes", "evaluation_report", "award", "contract"]


def bid(cid, amount, won):
    return {"contractor": {"id": cid, "tax_code": f"00{cid}", "name": f"Contractor {cid}"}, "amount_vnd": amount, "won": won}


def tender(tid, province, buyer, status="awarded", estimate=1000, award=900, bids=None, docs=None, topics=None,
           units=None, notice="2026-01-01", award_date="2026-01-31", sector="construction"):
    return {
        "id": tid, "title": f"Tender {tid} <script>x</script>", "province": {"id": province, "name": province.upper()},
        "sector": sector, "method": "open", "topics": topics or [], "funding": None,
        "buyer": {"id": buyer, "name": f"Buyer {buyer}", "kind": "pmu"}, "status": status,
        "estimate_vnd": estimate, "award_vnd": award if status == "awarded" else None,
        "bids": bids, "documents": {k: True for k in DOCS} if docs is None else docs,
        "dates": {"plan": None, "notice": notice, "opening": None, "award": award_date if status == "awarded" else None},
        "units": units, "source_url": None, "collected_at": "2026-10-03T00:00:00+00:00",
    }


@pytest.fixture
def built(tmp_path, monkeypatch):
    no_contract = {k: k != "contract" for k in DOCS}
    tenders = [
        tender("T1", "hcm", "B1", bids=[bid("c1", 900, True), bid("c2", 950, False)], topics=["schools"],
               units={"kind": "classroom", "count": 9}),
        tender("T2", "hcm", "B1", award=1000, bids=[bid("c1", 1000, True)], docs=no_contract, award_date="2025-03-01",
               notice="2025-01-01"),
        tender("T3", "hn", "B2", bids=None),  # bid opening minutes not published
        tender("T4", "hn", "B2", status="open", bids=[bid("c2", 800, False)]),
    ]
    return build(tmp_path, monkeypatch, tenders)


def build(tmp_path, monkeypatch, tenders):
    src = tmp_path / "tenders.jsonl"
    src.write_text("\n".join(json.dumps(t) for t in tenders), encoding="utf-8")
    out = tmp_path / "out"
    monkeypatch.setattr(sys, "argv", ["build_site_data.py", "--input", str(src), "--out", str(out), "--sample"])
    build_site_data.main()  # in-process so coverage is measured and errors surface directly
    return out


def read(out, rel):
    return json.loads((out / rel).read_text(encoding="utf-8"))


def test_writes_documented_files(built):
    for rel in ["meta.json", "provinces.json", "topics.json", "tenders.json", "buyers.json", "contractors.json",
                "tender/T1.json", "buyer/B1.json", "contractor/c1.json", "topic/schools.json",
                "download/tenders.jsonl", "download/tenders.csv"]:
        assert (built / rel).is_file(), rel


def test_meta_marks_sample_and_counts(built):
    meta = read(built, "meta.json")
    assert meta["is_sample"] is True
    assert meta["counts"] == {"tenders": 4, "buyers": 2, "contractors": 2}
    nat = meta["national"]
    assert nat["awarded"] == 3
    assert nat["award_value_vnd"] == 900 + 1000 + 900
    # T3 has unknown bids and T4 is not awarded: only T1 (2 bids) and T2 (1 bid) count
    assert nat["single_bidder_share"] == {"value": 0.5, "n": 2}


def test_province_rows_sorted_by_award_value(built):
    rows = read(built, "provinces.json")
    assert [r["id"] for r in rows] == ["hcm", "hn"]
    assert rows[0]["disclosure"]["value"] == pytest.approx((1 + 6 / 7) / 2)


def test_tender_detail_has_derived_values_and_context(built):
    t = read(built, "tender/T1.json")
    assert t["derived"] == {"bidders": 2, "savings": pytest.approx(0.1), "days": 30, "disclosure": 1.0}
    assert t["context"]["buyer_tenders"] == 2
    assert t["context"]["buyer_since"] == "2025"
    assert t["context"]["winner_wins_with_buyer"] == 2
    unknown = read(built, "tender/T3.json")
    assert unknown["derived"]["bidders"] is None


def test_contractor_profile(built):
    c = read(built, "contractor/c1.json")
    assert (c["wins"], c["bids"], c["award_value_vnd"]) == (2, 2, 1900)
    assert c["by_year"] == [{"year": "2025", "value_vnd": 1000}, {"year": "2026", "value_vnd": 900}]
    assert c["top_buyers"][0]["id"] == "B1"
    loser = read(built, "contractor/c2.json")
    assert (loser["wins"], loser["bids"]) == (0, 2)


def test_buyer_document_disclosure(built):
    b = read(built, "buyer/B1.json")
    assert b["documents"]["contract"] == {"value": 0.5, "n": 2}
    assert b["documents"]["notice"] == {"value": 1.0, "n": 2}


def test_topic_unit_cost(built):
    t = read(built, "topic/schools.json")
    assert t["unit"] == "classroom"
    hcm = next(r for r in t["unit_cost"] if r["province"] == "hcm")
    assert hcm["value"] == pytest.approx(100.0) and hcm["n"] == 1


def test_index_keeps_raw_text_for_the_client_to_escape(built):
    rows = read(built, "tenders.json")
    assert any("<script>" in r["title"] for r in rows)  # stored as data; the web must render it as text


# --- Review findings (second-pass review of PR #1) -------------------------------------------

def test_latest_lists_recent_awarded_tenders_only(built):
    rows = read(built, "latest.json")
    assert [r["id"] for r in rows] == ["T1", "T3", "T2"]  # awarded only, newest first; T4 is open
    assert all(r["status"] == "awarded" for r in rows)


def test_latest_is_capped(tmp_path, monkeypatch):
    out = build(tmp_path, monkeypatch, [tender(f"T{i}", "hcm", "B1", award_date=f"2026-01-{i + 10:02d}") for i in range(12)])
    assert len(read(out, "latest.json")) == 5


@pytest.mark.parametrize("field", ["id", "buyer", "contractor"])
def test_rejects_ids_that_could_escape_the_output_folder(tmp_path, monkeypatch, field):
    t = tender("T1", "hcm", "B1", bids=[bid("c1", 900, True)])
    if field == "id":
        t["id"] = "../../escape"
    elif field == "buyer":
        t["buyer"]["id"] = "../escape"
    else:
        t["bids"][0]["contractor"]["id"] = "a/b"
    with pytest.raises(ValueError, match="unsafe id"):
        build(tmp_path, monkeypatch, [t])
    assert not list(tmp_path.rglob("escape*"))


def test_null_dates_allowed_by_the_contract_do_not_crash(tmp_path, monkeypatch):
    no_notice = tender("T1", "hcm", "B1", notice=None, bids=[bid("c1", 900, True)])
    no_award_date = tender("T2", "hcm", "B2", award_date=None, bids=[bid("c1", 900, True)])
    no_award_date["dates"]["award"] = None
    out = build(tmp_path, monkeypatch, [no_notice, no_award_date])
    assert read(out, "buyer/B1.json")["since"] is None
    assert read(out, "tender/T1.json")["context"]["buyer_since"] is None
    assert read(out, "tender/T1.json")["derived"]["days"] is None
    assert read(out, "contractor/c1.json")["by_year"] == [{"year": "2026", "value_vnd": 900}]  # T2 has no award date


@pytest.mark.parametrize(("url", "kept"), [
    ("https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?id=1", True),
    ("https://muasamcong.mof.gov.vn/x", True),
    ("javascript:alert(1)", False),
    ("http://muasamcong.mpi.gov.vn/x", False),
    ("https://muasamcong.mpi.gov.vn.evil.com/x", False),
    ("https://evil.com/?muasamcong.mpi.gov.vn", False),
])
def test_source_url_is_limited_to_the_official_system(tmp_path, monkeypatch, url, kept):
    t = tender("T1", "hcm", "B1")
    t["source_url"] = url
    out = build(tmp_path, monkeypatch, [t])
    assert read(out, "tender/T1.json")["source_url"] == (url if kept else None)


def test_csv_neutralizes_spreadsheet_formulas(tmp_path, monkeypatch):
    t = tender("T1", "hcm", "B1")
    t["title"] = '=HYPERLINK("http://evil","x")'
    out = build(tmp_path, monkeypatch, [t])
    csv_text = (out / "download" / "tenders.csv").read_text(encoding="utf-8-sig")
    assert "'=HYPERLINK" in csv_text
    assert ',=HYPERLINK' not in csv_text
