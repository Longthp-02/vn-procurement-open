# Write Tests

Target:
<!-- module / behavior -->

Rules:
- Test behavior, not implementation.
- Test the happy path.
- Test important edge cases (unknown values, empty groups, not awarded, missing documents).
- Test error cases.
- Follow the existing test style (`pipeline/tests/`, `web/src/**/*.test.ts(x)`).
- Do not test current broken behavior.
- Do not change production code unless asked.

Return: the tests and their output.
