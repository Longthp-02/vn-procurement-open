# Testing Strategy

## Principles
- Tests are the definition of done. CI (`.github/workflows/ci.yml`) runs everything on every push and PR; deploy depends on it.
- TDD for new behavior: one failing test → confirm it fails for the right reason → minimum code → green → refactor.
- Proof that tests bite: a test suite must fail when the implementation is removed or stubbed. Run `scripts/prove-red-green.sh` when adding a module.

## Walking Skeleton
First prove the thinnest end-to-end path (sample data → site JSON → home page → deploy), then add slices.

## Test Levels
| Level | Where | What |
|---|---|---|
| Unit | `pipeline/tests/test_metrics.py`, `web/src/lib/*.test.ts` | Pure logic: indicator math, number formatting, search normalization |
| Integration | `pipeline/tests/test_build_site_data.py` | Builder on a small fixture writes the documented files and numbers |
| Behavior (component) | `web/src/features/*/*.test.tsx` | A page renders the right numbers and states from fixture data via a fake `DataSource` |
| Smoke | CI build step | The site builds; every route has an entry point |

## Real Dependencies vs Fakes
- Pipeline tests use real files in a temp directory (no mocking of the filesystem).
- Web behavior tests use an in-memory `DataSource` fake, never network calls.
- Never call muasamcong from tests.

## Flaky Test Rule
A flaky test is a failing test. Fix or delete it with an explanation in the PR; never retry-until-green.

## Test Quality Standards
- Test behavior, not implementation details.
- Cover the happy path, important edge cases (unknown bids, empty groups, zero estimate, not awarded) and error states.
- Do not encode current broken behavior. Do not weaken or delete tests to pass.
- Coverage is reported in CI. Thresholds: pipeline ≥ 85% lines, web `src/lib` ≥ 85% lines (TODO: verify targets).
