# Plan Mode Extension

Toggle plan mode via `/plan` command or `Ctrl+Alt+P`.

## Modes

- **OFF** — Normal operation, all tools available
- **PLAN** — Read-only exploration. LLM produces a numbered plan under a `Plan:` header
- **EXECUTE** — Full tools restored. LLM executes steps and calls `step_done(step)` to mark completion

## Commands

| Command | Action |
|---|---|
| `/plan` | OFF → show picker (if plans exist) or enter plan mode · PLAN/EXECUTE → turn off |
| `/plan <name>` | If plan exists: load & execute · if not: enter plan mode (create new) |
| `/plan off` | Force off, restores all tools |
| `/plan status` | Show current mode and progress |
| `/plan list` | List all plan files with completion counts |

## Keyboard Shortcuts

- `Ctrl+Alt+P` — Toggle plan mode on/off

## CLI Flag

- `--plan` — Start in plan mode

## Plan Files

Plans are stored as markdown files in `.pi/plans/` with checkbox syntax:

```markdown
# Plan: Refactor Auth Module

- [ ] 1. Analyze current auth flow
- [ ] 2. Extract auth middleware to separate module
- [x] 3. Write tests for auth module
- [ ] 4. Update documentation
```

- `- [ ]` = incomplete, `- [x]` = complete
- Plan files are created automatically when the LLM produces a plan
- Steps are marked `[x]` when `step_done` is called in execute mode

## How It Works

1. `/plan` (from OFF) → shows picker with existing plans + "Create new plan" option
2. "Create new plan" → optional name input (leave empty for timestamp) → enter PLAN mode
3. LLM explores and produces a numbered plan under a `Plan:` header
4. After LLM response, a menu offers: Execute / Refine
5. Execute mode → all tools restored, LLM calls `step_done(n)` after completing each step
6. Checklist updates in real time as steps complete
7. All steps complete → automatically returns to OFF mode
- `/plan <name>` with existing plan → load directly into execute mode
- `/plan <name>` with new name → enter plan mode with that name

## `step_done` Tool

A custom tool registered by this extension. The LLM calls `step_done({ step: n })` after completing step n.

- The tool returns `{ status: "ok", step: n }`
- The extension marks the corresponding step complete in the checklist and plan file
- Tool calls and results are stripped from LLM context (zero context cost)
- Tool calls and results are suppressed from chat display

## State Persistence

Mode and active plan file are stored in the session via `pi.appendEntry`. Plan steps are persisted in the plan file on disk. Forking or resuming a session restores state and re-reads the plan file.