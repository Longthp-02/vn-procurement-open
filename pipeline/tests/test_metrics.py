import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import metrics as m  # noqa: E402


def tender(**kw):
    base = {
        "status": "awarded", "estimate_vnd": 100, "award_vnd": 90,
        "bids": [{"contractor": {"id": "c1", "tax_code": "1", "name": "A"}, "amount_vnd": 90, "won": True}],
        "documents": {k: True for k in m.DOC_KEYS},
        "dates": {"notice": "2026-01-01", "award": "2026-01-31"},
    }
    base.update(kw)
    return base


def bids(*ids, winner=None):
    return [{"contractor": {"id": i, "tax_code": i, "name": i}, "amount_vnd": 1, "won": i == winner} for i in ids]


def test_savings_and_days():
    t = tender()
    assert m.savings(t) == pytest.approx(0.10)
    assert m.processing_days(t) == 30


def test_savings_missing_values():
    assert m.savings(tender(award_vnd=None)) is None
    assert m.savings(tender(estimate_vnd=0)) is None


def test_unknown_bids_are_excluded_not_counted_as_zero():
    ts = [tender(bids=None), tender(bids=bids("a", winner="a")), tender(bids=bids("a", "b", winner="a"))]
    r = m.single_bidder_share(ts)
    assert r == {"value": 0.5, "n": 2}


def test_single_bidder_share_ignores_non_awarded():
    ts = [tender(status="open", award_vnd=None), tender(bids=bids("a", "b", winner="b"))]
    assert m.single_bidder_share(ts) == {"value": 0.0, "n": 1}


def test_empty_group_returns_none():
    assert m.single_bidder_share([]) == {"value": None, "n": 0}
    assert m.avg_savings([]) == {"value": None, "n": 0}


def test_disclosure_counts_published_documents():
    docs = {k: False for k in m.DOC_KEYS}
    docs.update(notice=True, award=True)
    assert m.disclosure(tender(documents=docs)) == pytest.approx(2 / 7)


def test_top_share_by_award_value():
    ts = [tender(award_vnd=v, bids=bids(c, winner=c)) for c, v in
          [("a", 50), ("b", 20), ("c", 10), ("d", 10), ("e", 5), ("f", 5)]]
    assert m.top_share(ts) == {"value": pytest.approx(0.95), "n": 6}


def test_median_unit_cost():
    ts = [tender(award_vnd=1200, units={"kind": "classroom", "count": 12}),
          tender(award_vnd=900, units={"kind": "classroom", "count": 10}),
          tender(award_vnd=500, units=None)]
    assert m.median_unit_cost(ts, "classroom") == {"value": 95.0, "n": 2}


def test_top_share_n_counts_tenders_not_contractors():
    ts = [tender(award_vnd=60, bids=bids("a", winner="a")), tender(award_vnd=30, bids=bids("a", winner="a")),
          tender(award_vnd=10, bids=bids("b", winner="b"))]
    assert m.top_share(ts) == {"value": pytest.approx(1.0), "n": 3}
