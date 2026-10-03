# System Patterns

## Architecture Direction
Static-first: pipeline produces files, web reads files. No server, no database.

## Vertical Slices
`web/src/features/<feature>/` holds a page's components, logic and tests. Shared code goes to `web/src/lib/` only after it is reused (rule of three).

## Ports and Adapters
- Web: `DataSource` port (`web/src/lib/data.ts`); the static-JSON adapter is the only implementation. Tests use an in-memory fake.
- Pipeline: any source (sample generator, crawler) emits normalized `tenders.jsonl` (`docs/data-contract.md`).

## Module Boundaries
Features never import from another feature's internals. Indicator math lives only in `pipeline/metrics.py`.

## TDD Workflow
Test strategy first → one failing test → confirm right failure → minimum implementation → green → refactor. See `prompts/tdd-ai-workflow.md`.

## Debugging Workflow
Actual vs expected → reproducing test → confirm failure → root cause → minimal fix → rerun focused test. Stop after two failed attempts.

## Performance Priority
Small JSON payloads, no heavy client libraries, fast first paint on phones. Pipeline runtime matters once data is nationwide.

## Second-Pass Review
After implementation, run `.github/skills/second-pass-review/SKILL.md` with a fresh agent.

## Handoff Rule
Any change to pipeline output shape gets a note in `docs/handoffs/` and an update to `docs/data-contract.md`.
