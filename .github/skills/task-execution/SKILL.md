---
name: task-execution
description: How to execute bug fixes, larger features, pipeline/web handoffs and performance checks in this repository.
---

# Task Execution

## Bug Workflow
Follow `.github/skills/debugging/SKILL.md`: reproducing failing test → root cause → minimal fix → focused test → full suite.

## Large Feature Workflow
1. Fill the clarification record (`prompts/_clarification-loop.md`).
2. Write or update a spec (`prompts/spec-template.md`) and plan (`prompts/plan-first.md`).
3. Walking skeleton first, then one vertical slice at a time (`prompts/implement-one-step.md`).
4. TDD per step (`prompts/tdd-ai-workflow.md`).
5. Run all checks; prepare the author package (`prompts/ai-author-review-package.md`); offer second-pass review.

## Frontend Handoff Workflow
When pipeline output changes:
1. Update `docs/data-contract.md`.
2. Add `docs/handoffs/YYYY-MM-DD-<topic>.md` from `_template.md` with example payloads.
3. Update web types in `web/src/lib/types.ts` and the affected feature tests.

## Performance Check
- Web: compare `npm run build` output sizes before/after; JSON payload per page should stay small (target < 200 KB gzipped, TODO: verify).
- Pipeline: time `build_site_data.py` on the full dataset before/after.
