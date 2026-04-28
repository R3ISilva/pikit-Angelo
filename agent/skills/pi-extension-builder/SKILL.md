---
name: pi-extension-builder
description: Guidelines for creating or modifying pi.dev extensions in this repo (~/.pi). Load when the user asks to build, edit, debug, or refactor a pi.dev extension.
---

## Pi Extension Development Guidelines

### Before writing any code

- Read the root `README.md` — it documents every extension, the file tree, and setup conventions
- Read the specific extension's `README.md` if one exists
- Read the existing `src/index.ts` of the extension being modified to understand current patterns before changing anything
- The source of truth is always the code, not the `README.md`

### Directory structure

Every extension follows this layout — don't deviate:

```
agent/extensions/<name>/
├── README.md
├── package.json
└── src/
    └── index.ts
```

- Single entry point: `src/index.ts`
- `package.json` must include `"pi": { "extensions": ["./src/index.ts"] }` and follow the same shape as existing extensions (see `web-access/package.json` as reference)
- New extensions must be added to the npm workspace in the root `package.json`

### Code conventions

- Export a single default function receiving `ExtensionAPI` — no classes, no extra exports
- Use existing extensions as reference: `web-access` for tool registration, `startup` for lifecycle hooks, `permission-gate` for interception patterns
- Match the TypeScript style of the file being edited — don't introduce new patterns or abstractions
- Keep extensions small and focused — one concern per extension

### Modularity

- Keep the default export function lean — wiring only (registering tools, commands, event hooks)
- Extract non-trivial logic into named helper functions in the same file
- Only split into additional files under `src/` when a chunk is clearly reusable across multiple parts of the extension
- Pure functions (parsers, formatters, validators) should be extracted and named clearly — they're easier to test and reason about in isolation

### Don't over-engineer

- Only register tools/commands/events explicitly asked for
- No config abstraction layers unless the extension already has one
- No helper files unless the logic genuinely can't fit in `index.ts`
- If in doubt, look at how the simplest existing extension (`spinners` or `env-loader`) handles it

### Documentation

- Update the extension's `README.md` with any new features, tools, or commands added
- If the extension doesn't have a `README.md`, create one with a brief description and usage instructions
- Document any new permissions or lifecycle hooks used by the extension
- Cross-reference and update any other relevant `README.md` files if the change impacts other extensions or the overall (including the root documentation)
- When adding a new extension to the root `README.md`, follow the established style: one short paragraph (what it does, whether it's configurable, slash command only if it's the primary interface), a `→ README` link, no command tables, no implementation detail. Insert under `## Extensions` ordered by category: **UI** (visible every session, zero or minimal config) → **Security** (intercepts or blocks actions) → **Utils** (tools, bridges, integrations) → **Misc** (cosmetic or low-priority). Use judgment to place the new extension in the right category.