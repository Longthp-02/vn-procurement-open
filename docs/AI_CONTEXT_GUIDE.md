# AI Context Guide

- Start every AI session by reading `AGENTS.md`.
- For long-running work, also read `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- At the end of every meaningful session, update the memory files (`.github/skills/context-maintenance/SKILL.md`).

| Location | Holds |
|---|---|
| `AGENTS.md` | Always-true project rules (keep under ~60 lines) |
| `CONSTITUTION.md` | Non-negotiables |
| `memory-bank/` | Project memory: brief, product, patterns, tech, current focus, progress |
| `.github/skills/` | Reusable procedures |
| `docs/` | Domain, architecture, data contract, testing, threat model, handoffs |
| `prompts/` | Copy/paste prompts for planning, TDD, debugging, review |
| `spec.md`, `plan.md` | Current spec and implementation plan |

Tool wrappers (`CLAUDE.md`, `.cursor/rules/core.mdc`, `.github/copilot-instructions.md`) only point back to `AGENTS.md`.
