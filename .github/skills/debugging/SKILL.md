---
name: debugging
description: Root-cause debugging procedure — reproduce with a failing test before fixing, fix minimally, and stop after two failed attempts.
---

# Debugging

1. Write down **actual vs expected** behavior.
2. Write a **reproducing test** at the lowest level that shows the bug.
3. Run it and **confirm it fails** for the bug's reason.
4. Find the **root cause** (evidence: file, line, input data). Do not patch symptoms.
5. Apply the **minimal fix**.
6. **Rerun the focused test only**, confirm it passes; then run the full suite.
7. If two fix attempts fail, **stop** and propose a smaller diagnostic plan (logging, bisect, narrower test).

Use `prompts/debug-root-cause.md` as the prompt.
