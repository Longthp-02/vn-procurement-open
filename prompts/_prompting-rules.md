# Prompting Rules

## Prompt Quality Gate
Every non-trivial prompt needs:

1. **Goal** — what outcome is wanted
2. **Context** — relevant files, current behavior, background
3. **Constraints** — what must not change, limits, rules
4. **Output Format** — what to return (diff, plan, JSON, report)

If missing information affects correctness, ask only for the missing piece.
Do not ask the human to rewrite the whole prompt.
Remember the original request, merge the clarification into it, and continue when enough information exists.

## Safe Defaults
- Preserve public APIs unless explicitly changed. Here "public API" includes the data contract and generated JSON shape.
- Preserve database schemas unless explicitly changed (none today).
- Preserve existing behavior unless explicitly changed.
- Do not add dependencies.
- Do not modify unrelated files.
- Keep the diff minimal.
- Follow existing patterns.

## Stop Conditions
Stop and ask when:
- expected behavior is unknown
- a public API / the data contract may change
- a database schema or migration may change
- auth, permissions, payments, security or privacy is involved (including anything that could publish personal data)
- multiple modules are touched and no plan exists
- a refactor is requested without a clear target
