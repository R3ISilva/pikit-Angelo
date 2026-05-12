# Allowed `gh` Commands (Read-Only)

> **`gh api` is entirely blocked.** It can perform any HTTP method including POST, PUT, and DELETE. No amount of flag filtering can make it safe.

---

## auth

| Subcommand | Allowed |
|------------|---------|
| `status` | ✅ Shows authentication state |

Blocked: `login`, `logout`, `refresh`, `setup-git`, `token` (exposes secret), `switch`

## browse

Bare command allowed. Opens a URL in the browser — no API mutation.

## completion

Bare command allowed. Generates shell completions — no API calls.

## issue

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `status` | ✅ |
| `view` | ✅ |

Blocked: `close`, `comment`, `create`, `delete`, `develop`, `edit`, `lock`, `pin`, `reopen`, `transfer`, `unlock`, `unpin`

## pr

| Subcommand | Allowed |
|------------|---------|
| `checks` | ✅ |
| `diff` | ✅ |
| `list` | ✅ |
| `status` | ✅ |
| `view` | ✅ |

Blocked: `checkout` (local mutation), `close`, `comment`, `create`, `edit`, `lock`, `merge`, `ready`, `reopen`, `revert`, `review`, `unlock`, `update-branch`

## repo

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |
| `gitignore list` | ✅ |
| `gitignore view` | ✅ |
| `license list` | ✅ |
| `license view` | ✅ |

Blocked: `archive`, `clone` (local write), `create`, `delete`, `deploy-key add`, `deploy-key delete`, `edit`, `fork`, `rename`, `set-default`, `sync`, `unarchive`, `autolink create`, `autolink delete`

## run

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |
| `watch` | ✅ |

Blocked: `cancel`, `delete`, `download` (local write), `rerun`

## workflow

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |

Blocked: `disable`, `enable`, `run`

## search

All subcommands are read-only:

| Subcommand | Allowed |
|------------|---------|
| `code` | ✅ |
| `commits` | ✅ |
| `issues` | ✅ |
| `prs` | ✅ |
| `repos` | ✅ |

## codespace

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |
| `logs` | ✅ |

Blocked: `code`, `cp`, `create`, `delete`, `edit`, `jupyter`, `ports` (has mutation subcommands), `rebuild`, `ssh`, `stop`

## gist

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |

Blocked: `clone` (local write), `create`, `delete`, `edit`

## project

| Subcommand | Allowed |
|------------|---------|
| `field-list` | ✅ |
| `item-list` | ✅ |
| `list` | ✅ |
| `view` | ✅ |

Blocked: `close`, `copy`, `create`, `delete`, `edit`, `field-create`, `field-delete`, `item-add`, `item-archive`, `item-create`, `item-delete`, `item-edit`, `link`, `mark-template`, `unlink`

## release

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |

Blocked: `create`, `delete`, `download` (local write), `edit`, `upload`

## cache

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |

Blocked: `delete`

## org

`list` only.

## label

`list` only.

Blocked: `clone`, `create`, `delete`, `edit`

## ruleset

| Subcommand | Allowed |
|------------|---------|
| `check` | ✅ |
| `list` | ✅ |
| `view` | ✅ |

## secret

`list` only. Shows names, not values.

Blocked: `delete`, `set`

## variable

| Subcommand | Allowed |
|------------|---------|
| `get` | ✅ |
| `list` | ✅ |

Blocked: `delete`, `set`

## attestation

| Subcommand | Allowed |
|------------|---------|
| `trusted-root` | ✅ |
| `verify` | ✅ |

Blocked: `download` (local write)

## gpg-key

`list` only.

Blocked: `add`, `delete`

## ssh-key

`list` only.

Blocked: `add`, `delete`

## status

Bare command allowed. Shows GitHub notification status.

## licenses

Bare command allowed. Shows open-source license metadata.

## agent-task

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `view` | ✅ |

Blocked: `create`

## alias

`list` only.

Blocked: `delete`, `import`, `set`

## extension

| Subcommand | Allowed |
|------------|---------|
| `list` | ✅ |
| `search` | ✅ |

Blocked: `browse` (side effect), `create`, `install`, `remove`, `upgrade`

## config

| Subcommand | Allowed |
|------------|---------|
| `get` | ✅ |
| `list` | ✅ |

Blocked: `set` (mutation), `clear-cache` (mutation)

---

## Entirely blocked commands

These top-level commands have no read-only safe usage:

| Command | Reason |
|---------|--------|
| `api` | Raw HTTP escape hatch — can POST/PUT/DELETE any endpoint |
| `copilot` | Runs an external tool |
| `preview` | Preview/unstable features |
| `skill` | Install/publish/update — all writes |