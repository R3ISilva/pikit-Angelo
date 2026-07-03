---
name: pr-review
description: Review a GitHub PR and emit the findings as a markdown artifact (rendered HTML report in the browser). Use when the user asks to review a PR. Pairs with the gh skill (read-only diff) and the artifact tool (visual report).
---

## Workflow

1. **Gather the diff** using the `gh` skill (read-only wrapper). Load it and follow its instructions — it exposes `gh-ro` with read-only commands like `pr view <number>` (PR metadata, description, checks) and `pr diff <number>` (the full diff). Read the PR description first to understand intent, then the diff.

2. **Review it.** Read the changed files in full (not just the diff hunk) where context is needed — the diff shows what changed, the file shows whether it fits. Form a judgement: would this be safe to merge? What's broken, risky, or worth improving?

3. **Emit one markdown artifact** via the `artifact` tool — `action: "create"`, `kind: "markdown"`. Do **not** paste the review into the terminal; the report is the deliverable.

## Report structure

The artifact is a single markdown document with this shape:

- **Verdict up top** — one line: `Approve` / `Approve with nits` / `Request changes` / `Block`, plus a one-sentence reason. The reader should know the answer before scrolling.
- **Findings table** — ranked by severity, before the prose so the most important issues are visible immediately:

  | Severity | File | Line | Issue |
  |----------|------|------|-------|
  | High | … | … | … |

  Severities: `High` (must fix before merge — bugs, security, data loss), `Medium` (should fix — correctness risk, missing tests, fragile patterns), `Low` / `Nit` (style, naming, optional improvements).

- **Per-file detail** — for each file with findings, a short heading and a fenced ` ```diff ` block quoting the relevant hunk (copy the unified-diff lines straight from `gh pr diff` — the renderer turns ` ```diff ` fences into rendered side-by-side/line-by-line diffs). Lead with what's wrong and why, then the fix. Keep prose tight — the diff speaks for itself.

- **What's good** (optional, brief) — call out non-obvious correct decisions so the review isn't only complaints.

Use `update` (same title → same slug) to revise the report after re-reading; the open browser tab refreshes in place. Open it once with `create` (auto-opens by default).

## Rules

- One artifact per PR. Iterate with `update`, don't `create` duplicates.
- Quote real diff lines in ` ```diff ` fences — don't paraphrase code.
- Every finding must cite a file. No "consider improving the architecture" without pointing at where.
- If the PR is trivially fine, say so in the verdict and skip the findings table — a one-line "LGTM, no findings" report is correct.
- Severity is about merge risk, not taste. A nit is not Medium.