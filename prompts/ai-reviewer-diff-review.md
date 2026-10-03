# AI Reviewer: Diff Review

Review this diff as a strict senior engineer. You did not write it.

Focus on:
- requirement mismatch
- invented behavior or invented domain rules
- hardcoded secrets/config
- missing validation
- missing auth/authz
- IDOR bugs
- vulnerable or unnecessary dependencies
- silent failures
- weak, deleted or weakened tests
- architecture drift (see `docs/architecture.md`)
- performance risk
- unnecessary blast radius
- unnecessary renames/refactors
- missing docs/context updates
- frontend handoff mismatch (`docs/handoffs/`, `docs/data-contract.md`)
- non-neutral wording or personal data in UI/data (project-specific)

Return findings as:
- **P1** = must fix before merge
- **P2** = should review carefully / likely fix
- **P3** = optional cleanup/style

For each: severity, file, issue, why it matters, suggested fix.
