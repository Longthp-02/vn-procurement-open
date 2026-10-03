"""Sample data must follow the data contract and must never be mistakable for real records."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import make_sample  # noqa: E402

REQUIRED = {"id", "title", "province", "sector", "method", "topics", "funding", "buyer", "status", "estimate_vnd",
            "award_vnd", "bids", "documents", "dates", "units", "source_url", "collected_at"}


@pytest.fixture(scope="module")
def tenders(tmp_path_factory):
    out = tmp_path_factory.mktemp("sample") / "tenders.jsonl"
    argv = sys.argv
    sys.argv = ["make_sample.py", "--out", str(out), "--count", "300"]
    try:
        make_sample.main()
    finally:
        sys.argv = argv
    return [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines()]


def test_writes_requested_count_with_unique_ids(tenders):
    assert len(tenders) == 300
    assert len({t["id"] for t in tenders}) == 300


def test_every_record_follows_the_contract(tenders):
    for t in tenders:
        assert REQUIRED <= t.keys()
        assert t["sector"] in {"construction", "goods", "consulting", "non_consulting", "mixed"}
        assert t["method"] in {"open", "limited", "direct", "quotation", "other"}
        assert t["status"] in {"awarded", "open", "cancelled"}
        assert set(t["documents"]) == {"plan", "notice", "tender_docs", "opening_minutes", "evaluation_report", "award", "contract"}


def test_sample_records_are_visibly_fake(tenders):
    for t in tenders:
        assert t["id"].startswith("SMP-")
        assert t["source_url"] is None
        assert "Mẫu" in t["buyer"]["name"]
        for b in t["bids"] or []:
            assert "Mẫu" in b["contractor"]["name"]
            assert b["contractor"]["tax_code"].startswith("00")  # never a valid Vietnamese tax code


def test_bids_unknown_exactly_when_opening_minutes_unpublished(tenders):
    for t in tenders:
        assert (t["bids"] is None) == (not t["documents"]["opening_minutes"])


def test_award_consistency(tenders):
    for t in tenders:
        if t["status"] == "awarded":
            assert t["award_vnd"] is not None and t["award_vnd"] <= t["estimate_vnd"]
            assert t["dates"]["award"] is not None
            if t["bids"] is not None:
                assert sum(b["won"] for b in t["bids"]) == 1
        else:
            assert t["award_vnd"] is None
            assert not any(b["won"] for b in t["bids"] or [])


def test_generation_is_deterministic(tmp_path):
    def gen(name):
        out = tmp_path / name
        argv = sys.argv
        sys.argv = ["make_sample.py", "--out", str(out), "--count", "50"]
        try:
            make_sample.main()
        finally:
            sys.argv = argv
        return out.read_text(encoding="utf-8")

    assert gen("a.jsonl") == gen("b.jsonl")
