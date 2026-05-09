# Plan Mode Extension

Toggle plan mode via `/plan` command or `Ctrl+Alt+P`.

## Modes

- **OFF** — Normal operation, all tools available
- **PLAN** — Read-only exploration. LLM produces a numbered plan under a `Plan:` header
- **EXECUTE** — Full tools restored. LLM executes steps and marks `[DONE:n]` on completion

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
- Steps are marked `[x]` as `[DONE:n]` markers appear in EXECUTE mode

## How It Works

1. `/plan` (from OFF) → shows picker with existing plans + "Create new plan" option
2. "Create new plan" → optional name input (leave empty for timestamp) → enter PLAN mode
3. LLM explores and produces a numbered plan under a `Plan:` header
4. After LLM response, a menu offers: Execute / Refine
5. Execute mode → all tools restored, LLM executes steps marking `[DONE:n]`
6. All steps complete → automatically returns to OFF mode
- `/plan <name>` with existing plan → load directly into execute mode
- `/plan <name>` with new name → enter plan mode with that name

## State Persistence

Mode and active plan file are stored in the session via `pi.appendEntry`. Plan steps are persisted in the plan file on disk. Forking or resuming a session restores state and re-reads the plan file.