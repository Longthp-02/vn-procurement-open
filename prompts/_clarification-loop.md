# Clarification Loop

Fill this in before non-trivial work:

```md
Goal:
[clear / missing / vague]

Context:
[clear / missing / vague]

Constraints:
[clear / missing / vague]

Output Format:
[clear / missing / vague]

Scope:
[simple / non-trivial / large / risky]

Risk:
[low / medium / high]

Missing Information:
[list only what matters]
```

Ask one targeted question per missing item that affects correctness. Then merge.

## Example

Original: "Fix this endpoint."

Clarification: "What should this endpoint return, and what does it return now?"

Merged:
- **Goal:** `tender/<id>.json` must include `derived.days` for awarded tenders.
- **Context:** It is null for every tender; `processing_days()` in `pipeline/metrics.py` reads `dates.notice` and `dates.award`.
- **Constraints:** Do not change the field name or other fields; no new dependencies.
- **Output Format:** Failing test first, then a minimal diff, then test output.
