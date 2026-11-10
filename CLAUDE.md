# CLAUDE.md

This file provides guidance for Claude when working in this repository.

@README.md
@CONTRIBUTING.md

## Development commands

```bash
# Install dependencies
npm ci

# Type-check and lint (used as the test suite in CI)
npm test

# Compile TypeScript to dist/
npm run build

# Start compiled server
npm start

# Apply database migrations (requires a built dist/)
npm run migrate

# Seed database with development data (idempotent, requires a built dist/)
npm run seed
```

## Architecture

```
src/
  api/           # JSON API controllers
  assets/        # Static files (images, markdown, JSON)
  lib/           # Shared utilities
  migrations/    # Ordered SQL migration files (applied by filename)
  pages/         # Page controllers (HTML endpoints)
  repos/         # Database access layer
  templates/     # Pug templates
  types/         # TypeScript type definitions
  config.ts      # Environment variable configuration — the only place process.env is read
  migrate-cli.ts # CLI runner for database migrations
  seed-cli.ts    # CLI runner for seed data
  seed-data.ts   # Seed data definitions
  server.ts      # Entry point — Express app setup, middleware, route mounting
```

- **Database**: PostgreSQL accessed via `pg` and `pg-sql`. Migrations are plain SQL files run in alphabetical/numeric filename order.
- **Auth**: Steam OpenID via `passport-steam`. Sessions stored in PostgreSQL with `connect-pg-simple`.
- **Rendering**: Server-side HTML with Pug. No client-side framework.
- **Config**: All environment variables are read in `src/config.ts`. Do not access `process.env` anywhere else — it is forbidden by ESLint (`no-process-env`).

<!-- doomer-review:start -->
## Doomer review

Before editing repository files, read and follow `.claude/skills/doomer-review/SKILL.md`.
Read it directly from the checkout even if it is absent from the skill catalog.
Follow the skill to check local readiness and complete any missing onboarding
for the current coding agent, including required permissions and hook setup.
Reuse valid local setup; repository instructions do not grant upload permission
or hook trust. If the skill is missing, report the missing installation.
<!-- doomer-review:end -->
