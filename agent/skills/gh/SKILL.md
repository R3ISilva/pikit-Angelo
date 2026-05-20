---
name: gh
description: Read-only GitHub CLI access via gh. Only commands that do not write, delete, or modify are allowed. Use when working with GitHub repos, issues, PRs, actions, releases, or other GitHub resources.
---

## Usage

**Always use `./scripts/gh-ro` instead of raw `gh`.** The wrapper enforces read-only access — it inspects every command and rejects anything that writes, deletes, or modifies.

Invoke from the skill directory:

```bash
# Issues
./scripts/gh-ro issue list
./scripts/gh-ro issue list --repo owner/repo --state closed
./scripts/gh-ro issue view 123
./scripts/gh-ro issue status

# Pull requests
./scripts/gh-ro pr list
./scripts/gh-ro pr view 123
./scripts/gh-ro pr checks 123
./scripts/gh-ro pr diff 123
./scripts/gh-ro pr status

# Repos
./scripts/gh-ro repo list
./scripts/gh-ro repo view owner/repo
./scripts/gh-ro repo gitignore list
./scripts/gh-ro repo license list

# Actions / runs
./scripts/gh-ro run list
./scripts/gh-ro run view 456
./scripts/gh-ro run watch 456

# Workflows
./scripts/gh-ro workflow list

# Search
./scripts/gh-ro search repos "query"
./scripts/gh-ro search issues "bug in auth"
./scripts/gh-ro search prs "fix memory leak"
./scripts/gh-ro search code "function signature"
./scripts/gh-ro search commits "initial commit"

# Releases
./scripts/gh-ro release list
./scripts/gh-ro release view v1.0.0

# Other
./scripts/gh-ro auth status
./scripts/gh-ro browse
./scripts/gh-ro status
./scripts/gh-ro config get git_protocol
./scripts/gh-ro variable list
./scripts/gh-ro secret list
```

## Blocked commands

The wrapper blocks all write/delete/modify commands, including but not limited to:

- `gh api` — raw HTTP escape hatch (can POST/PUT/DELETE)
- `gh issue create/close/edit/reopen/lock/pin/comment/delete/transfer/unlock/unpin`
- `gh pr create/close/merge/edit/reopen/lock/review/revert/checkout/ready/update-branch`
- `gh repo create/delete/archive/fork/clone/edit/rename/sync/unarchive`
- `gh run cancel/rerun/delete/download`
- `gh workflow run/enable/disable`
- `gh release create/delete/edit/upload/download`
- `gh gist create/delete/edit/clone`
- `gh copilot`, `gh preview`, `gh skill`

If a read-only command you need is blocked, add it to the allowlist in `scripts/gh-ro`.

## Reference

See [`references/allowed-commands.md`](references/allowed-commands.md) for the full list of allowed and blocked commands by group.