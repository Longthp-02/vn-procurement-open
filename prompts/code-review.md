# Code Review

Review this diff for:
- logic bugs
- security issues
- missing error handling
- broken edge cases
- incorrect assumptions
- regressions
- weak tests

Return a JSON array:

```json
[
  {"severity": "high|medium|low", "file": "path", "issue": "...", "why_it_matters": "...", "suggested_fix": "..."}
]
```

Return `[]` if there are no findings, then list what was not verified.
