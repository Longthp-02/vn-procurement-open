# Refactor Safely

Target:
<!-- what and why -->

Rules:
- Do not change behavior.
- Do not change public APIs (including the data contract and generated JSON shape).
- Do not change DB schema.
- Do not add dependencies.
- Do not rename exported functions unless required.
- Preserve tests; all tests must pass before and after.
- Keep the diff minimal; one feature at a time.

Return: the plan, the diff, and test output before and after.
