---
name: code-review
description: Checklist for reviewing a change in this repository before merge.
---

# Code Review

Check:
- **Architecture match**: vertical slices, no cross-feature internals, indicator math only in `pipeline/metrics.py`, data read only through `DataSource`.
- **Silent failures**: no swallowed exceptions; UI shows honest loading/error/empty states.
- **Secrets**: none in code, logs, commits or the client bundle.
- **Auth / validation**: route params and crawled content treated as untrusted; no `dangerouslySetInnerHTML`.
- **Dependencies**: new ones justified; audit run.
- **Test quality**: behavior tests, edge cases, nothing weakened or deleted; red/green proven for new modules.
- **Docs/context updates**: data contract, handoffs, memory bank.
- **Performance**: payload size, bundle size, pipeline runtime.
- **API contract**: generated JSON matches `docs/data-contract.md`.
- **Project-specific**: neutral wording, no personal data, sources and dates shown.

Use `prompts/code-review.md` for JSON output or `prompts/ai-reviewer-diff-review.md` for P1/P2/P3.
