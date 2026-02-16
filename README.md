# Server

[![Depfu](https://badges.depfu.com/badges/716ec0618e99a09b8ac57861528cefa7/count.svg)](https://depfu.com/github/hardytool/server?project_id=39851)
[![CI status](https://img.shields.io/github/actions/workflow/status/hardytool/server/node.js.yml?logo=github)](https://github.com/hardytool/server/actions/workflows/node.js.yml?query=branch%3Atrunk "View this project's CI run history")
[![Checks status](https://img.shields.io/github/checks-status/hardytool/server/trunk?logo=railway&label=deploy)](https://github.com/hardytool/server/commit/trunk)
[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m787441842-04cf73902b7c489f45837dd0?logo=railway)](https://stats.uptimerobot.com/4zOmnCzkKJ)

RD2L's backend and website — a Node.js + TypeScript server built with Express.js, Pug templates, and PostgreSQL.

## Installation

Install dependencies:

```sh
npm ci
```

## Environment

Create a `.env` file with the following variables:

```bash
# Required
STEAM_API_KEY='get from https://steamcommunity.com/dev/apikey'
SECRET='random characters'

# Database (individual connection parameters)
POSTGRES_USER='postgres'
POSTGRES_PASSWORD='postgres'
POSTGRES_DB='seal'
POSTGRES_HOST='localhost'
POSTGRES_PORT='5432'

# Server
PORT='80'
HTTPS_PORT='443'
HOST='localhost'
```

Optional variables:

```bash
# Forward auth return requests to a different URL
WEBSITE_URL='http://return-to-website.com'

# Database connection tuning
POSTGRES_POOL_MAX='10'
POSTGRES_TIMEOUT='30000'
POSTGRES_SSL='true'
```

> **Note:** Do not access `process.env` directly in source files — it is forbidden by ESLint. Read env vars in `src/config.ts` and import from there.

## Running

Build the TypeScript source, then start the server:

```sh
npm run build
npm start
```

To run with Docker Compose (automatically handles migrations and seeds):

```sh
npm run docker:build
npm run docker:run
```

`npm run docker:run` requires `STEAM_API_KEY` and `SECRET` to be set. Docker Compose reads `.env` automatically, so you can use the same file for both local and Compose workflows.

## Database migrations

Migrations are SQL files in `src/migrations/` and run in filename order
(e.g. `001.sql` before `002.sql`). They are applied automatically on startup
when running via Docker Compose.

To run migrations manually (after building):

```sh
npm run migrate
```

## Seed data

Seed data populates the database with sample content for local development and
testing. It includes seasons, divisions, teams, and users. Seeding is
idempotent — running it multiple times is safe and will not create duplicates.

When using Docker Compose, seeds are applied automatically after migrations on
every `docker compose up`.

To run seeds manually (after building):

```sh
npm run seed
```

## Project structure

```
src/
  api/           # JSON API controllers
  assets/        # Static files (images, markdown, JSON)
  lib/           # Shared utilities
  migrations/    # SQL migration files applied in order
  pages/         # Page controllers (HTML endpoints)
  repos/         # Database access layer
  templates/     # Pug templates
  types/         # TypeScript type definitions
  config.ts      # Environment variable configuration
  migrate-cli.ts # CLI entry point for migrations
  seed-cli.ts    # CLI entry point for seeding
  seed-data.ts   # Seed data definitions
  server.ts      # Application entry point
scripts/         # Node.js helper scripts for npm run commands
Dockerfile
docker-compose.yml  # Development-oriented quickstart compose file
package.json
package-lock.json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for code style, commit conventions, and how to add database migrations.
