# CLAUDE.md

This file provides guidance for Claude when working in this repository.

## Project Overview

RD2L server — a Node.js + TypeScript backend and website for a competitive gaming league. It uses Express.js, Pug templates, and PostgreSQL.

## Development Commands

```bash
# Install dependencies
npm ci

# Run in development (hot reload via nodemon + ts-node)
npm run dev

# Type-check and lint (used as the test suite in CI)
npm test

# Compile TypeScript to dist/
npm run build

# Start compiled server
npm start

# Apply database migrations
npm run migrate

# Seed database with development data (idempotent)
npm run seed

# Build Docker image
npm run docker
```

## Environment Setup

Copy `.env.example` (if present) or provide the following environment variables:

| Variable | Description |
|---|---|
| `STEAM_API_KEY` | Steam Web API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret |
| `SSL_CERT` / `SSL_KEY` | TLS certificate paths (production) |

Do **not** access `process.env` directly in source files — it is forbidden by ESLint (`no-process-env`). Read env vars in a dedicated config module and import from there.

## Architecture

```
src/
  server.ts          # Entry point — Express app setup, middleware, route mounting
  migrate-cli.ts     # CLI runner for database migrations
  seed-cli.ts        # CLI runner for seed data
  migrations/        # Ordered SQL migration files (applied by filename)
  routes/            # Express routers, one file per feature area
  views/             # Pug templates
  public/            # Static assets
```

- **Database**: PostgreSQL accessed via `pg` and `pg-sql`. Migrations are plain SQL files run in alphabetical/numeric filename order.
- **Auth**: Steam OpenID via `passport-steam`. Sessions stored in PostgreSQL with `connect-pg-simple`.
- **Rendering**: Server-side HTML with Pug. No client-side framework.

## Code Style

Enforced by ESLint (`eslint.config.cjs`) and TypeScript strict mode:

- **Quotes**: single quotes
- **Semicolons**: none
- **Indent**: 2 spaces
- **Max line length**: 250 characters
- **Variables**: `const` preferred; `var` forbidden
- **Unused vars**: allowed only when prefixed with `_`
- **`any` type**: warned against — avoid where possible
- **`process.env`**: forbidden in source — use a config module

Run `npm test` to check types and lint before committing.

## Database Migrations

Add a new SQL file under `src/migrations/` using a name that sorts after all existing files (e.g. `030_add_column.sql`). Migrations run once in order and are tracked to avoid re-execution.

## Commit Style

This project uses **Conventional Commits** (https://www.conventionalcommits.org/en/v1.0.0/).

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
