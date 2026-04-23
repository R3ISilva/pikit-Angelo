# protected-paths

Blocks `read`, `write`, and/or `edit` tool calls to protected paths. Each entry defines a path and an explicit `deny` list — so you can block writes to `node_modules/` while still allowing the agent to read it for docs and type references. The agent is told why it was blocked and recovers gracefully.

## Philosophy

pi prioritizes flexibility. Extensions should be able to modify almost everything—skills, prompts, themes, even other extensions. This extension enforces **minimal, focused restrictions** on only the highest-risk vectors:

1. **`auth.json`** — credentials and API keys. Blocks all access to prevent accidental leakage.
2. **Dangerous bash commands** — handled by the `permission-gate` extension, not this one. Blocks `rm -rf`, `sudo`, `chmod 777`, etc.

Everything else is fair game. **The agent is trusted to shape pi according to your needs.** The infrastructure (credentials, system integrity) is protected, but avoid pasting secrets directly into conversations—treat them like any other tool (Claude, ChatGPT, etc.).

If you want additional restrictions (block session edits, lock down extensions, etc.), override the config. The defaults are intentionally permissive.

## How it works

On every `read`, `write`, or `edit` tool call, the extension checks the target path against the protected entries. Each entry has a `path` and a `deny` array. If the path matches and the current operation is in that entry's `deny` list, the call is blocked. Operations not listed are allowed through.

Two matching strategies are used depending on the entry's `path` format:

**Bare entries** (e.g. `.env`, `node_modules/`)
The incoming path is split into segments and each one is compared exactly. This means `.env` matches a file literally named `.env` at any depth — `/project/.env`, `configs/.env`, `a/b/c/.env` — without false-positives like `.envrc` or `.environment`. Trailing slashes on directory entries are stripped before comparison.

**Absolute / home-relative entries** (e.g. `/etc/`, `~/.pi/agent/configs/`)
Both paths are resolved to absolute and a `startsWith` check is used. Any file nested inside the protected directory at any depth is blocked.

When a call is blocked, a warning notification is shown (if a UI is available) and the reason is sent back to the model so it can respond appropriately.

## Structure

```
protected-paths/
├── package.json
├── README.md
├── protected-paths.example.json
└── src/
    ├── config.ts  — PathEntry type, loadConfig(), built-in defaults
    └── index.ts   — matchesEntry(), getBlockedOps(), tool_call hook
```

## Default protected paths

These entries apply when no config file is present:

| Path | Blocked ops | Rationale |
|------|-------------|-----------|
| `.env` | `read`, `write`, `edit` | Contains secrets — block everything |
| `.git/` | `read`, `write`, `edit` | Git internals — block everything |
| `node_modules/` | `write`, `edit` | Reads allowed (docs/types); writes blocked |
| `~/.pi/agent/auth.json` | `read`, `write`, `edit` | Auth credentials — block everything |

## Configuration

Copy the example config and edit it:

```bash
cp ~/.pi/agent/extensions/protected-paths/protected-paths.example.json \
   ~/.pi/agent/configs/protected-paths.json
```

```json
{
  "paths": [
    { "path": ".env",                    "deny": ["read", "write", "edit"] },
    { "path": ".git/",                   "deny": ["read", "write", "edit"] },
    { "path": "node_modules/",           "deny": ["write", "edit"] },
    { "path": "~/.pi/agent/auth.json",   "deny": ["read", "write", "edit"] }
  ]
}
```

- **`path`** — the file or directory to protect (see matching strategies below)
- **`deny`** — list of operations to block; any op not listed is allowed through. Valid values: `"read"`, `"write"`, `"edit"`

When the config file is present it **replaces** the defaults entirely — add the defaults back if you still want them.

**Note:** The defaults are intentionally minimal (just credentials). If you want stricter controls, add more paths to your config. For example, to prevent all writes to sessions or extensions, add them to your config alongside the defaults.

### Matching strategies

| Path format | How it matches | Example |
|---|---|---|
| Bare name (`.env`) | Exact segment match at any path depth | Blocks `a/b/.env` but not `a/b/.envrc` |
| Bare directory (`node_modules/`) | Exact segment match on any path component | Blocks `a/node_modules/foo.js` at any depth |
| Absolute (`/etc/`) | Resolved `startsWith` — anything nested inside | Blocks all files under `/etc/` |
| Home-relative (`~/.pi/agent/configs/`) | Resolved `startsWith` — anything nested inside | Blocks all files under `~/.pi/agent/configs/` |

### Examples

```json
{
  "paths": [
    { "path": ".env",                    "deny": ["read", "write", "edit"] },
    { "path": ".git/",                   "deny": ["read", "write", "edit"] },
    { "path": "node_modules/",           "deny": ["write", "edit"] },
    { "path": "~/.pi/agent/configs/",   "deny": ["read", "write", "edit"] },
    { "path": "/etc/",                   "deny": ["write", "edit"] }
  ]
}
```
