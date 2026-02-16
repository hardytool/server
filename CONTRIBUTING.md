# Contributing

## Code style

Enforced by ESLint (`eslint.config.cjs`) and TypeScript strict mode:

- **Quotes**: single quotes
- **Semicolons**: none
- **Indent**: 2 spaces
- **Max line length**: 250 characters
- **Variables**: `const` preferred; `var` forbidden
- **Unused vars**: allowed only when prefixed with `_`
- **`any` type**: warned against — avoid where possible
- **`process.env`**: forbidden in source — use `src/config.ts`

Run `npm test` to check types and lint before committing.

## Adding database migrations

Add a new SQL file under `src/migrations/` using a name that sorts after all
existing files (e.g. `030_add_column.sql`). Migrations run once in order and
are tracked to avoid re-execution.

## Commit style

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests/linting |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Maintenance tasks that don't fit above |
| `revert` | Reverts a previous commit |

### Rules

- Use the **imperative mood** in the short description: "add feature" not "added feature"
- Keep the first line at or under **72 characters**
- Reference GitHub issues in the footer: `Closes #123`
- Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer
- **PR titles** must also follow the conventional commit format — they are used as the squash merge commit message

### Examples

```
feat(auth): add Steam login support

fix(pairing): correct blossom algorithm edge case for odd player count

docs: add CLAUDE.md with development and commit guidelines

build(deps): bump express from 5.0.0 to 5.1.0

ci: add railway validation workflow

feat!: drop support for Node 18

BREAKING CHANGE: minimum Node.js version is now 20
```
