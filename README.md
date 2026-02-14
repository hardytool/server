# Server

[![Depfu](https://badges.depfu.com/badges/716ec0618e99a09b8ac57861528cefa7/count.svg)](https://depfu.com/github/hardytool/server?project_id=39851)
[![CI status](https://img.shields.io/github/actions/workflow/status/hardytool/server/node.js.yml?logo=github)](https://github.com/hardytool/server/actions/workflows/node.js.yml?query=branch%3Atrunk "View this project's CI run history")
[![Checks status](https://img.shields.io/github/checks-status/hardytool/server/trunk?logo=railway&label=deploy)](https://github.com/hardytool/server/commit/trunk)
[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m787441842-04cf73902b7c489f45837dd0?logo=railway)](https://stats.uptimerobot.com/4zOmnCzkKJ)

This is RD2L's backend and website.

## Installation

First, install the project's dependencies.

```sh
npm install
```

Next, get an api key from <https://steamcommunity.com/dev/apikey>. Either set this
as an environment variable or a variable in a `.env` file - name must be
`STEAM_API_KEY`.

Here's a template with example values for a complete `.env` file:

```bash
POSTGRES_USER='postgres'
POSTGRES_PASSWORD='postgres'
POSTGRES_DB='seal'
POSTGRES_HOST='localhost'
POSTGRES_PORT='5432'
PORT='80'
HTTPS_PORT='443'
SECRET='random characters'
STEAM_API_KEY='get from https://steamcommunity.com/dev/apikey'
```

For HTTPS configuration, include the following entries:

```bash
SSL_KEY='path/to/key.pem'
SSL_CERT='path/to/cert.pem'
SSL_CA='path/to/ca.pem'
```

Auth requests can be forwarded by providing:

```bash
WEBSITE_URL='http://return-to-website.com'
```

Full database configuration can be configured using:

```bash
POSTGRES_USER='postgres'
POSTGRES_PASSWORD='postgres'
POSTGRES_DB='seal'
POSTGRES_HOST='localhost'
POSTGRES_PORT='5432'
POSTGRES_POOL_MAX='10'
POSTGRES_TIMEOUT='30000'
```

## Running

To run locally:

```sh
npm start
```

To run in docker:

```sh
make build
make run
```

Running in docker requires environment variables, not .env variables.
Additionally, and unsurprisingly, it requires docker to be installed and
running.

## Database migrations

Migrations are SQL files in `src/migrations/` and run in filename order
(e.g. `001.sql` before `002.sql`). They are applied automatically on startup
when running via docker compose.

To run migrations manually:

```sh
npm run migrate
```

## Seed data

Seed data populates the database with sample content for local development and
testing. It includes seasons, divisions, teams, and users. Seeding is
idempotent — running it multiple times is safe and will not create duplicates.

When using docker compose, seeds are applied automatically after migrations on
every `docker compose up`.

To run seeds manually (after building):

```sh
npm run seed
```

## Project structure

```bash
├── src
│   ├── api
│   │   └── *.ts       # API-oriented controllers
│   ├── assets
│   │   └── **/*       # Static files (including images, markdown, etc.)
│   ├── lib
│   │   └── *.ts       # Common utilities/shared libraries
│   ├── migrations
│   │   └── *.sql      # Database migration files applied in order (001.sql first)
│   ├── seed-data.ts   # Seed data definitions (seasons, divisions, teams, users)
│   ├── seed-cli.ts    # Standalone CLI entry point for running seeds
│   ├── migrate-cli.ts # Standalone CLI entry point for running migrations
│   ├── pages
│   │   └── *.ts       # Page content controllers
│   ├── repos
│   │   └── *.ts       # Database model repositories
│   ├── templates
│   │   └── **/*.pug   # Template files structured as a hierarchical tree
├── Dockerfile
├── docker-compose.yml # Development-oriented quickstart compose file
├── Makefile           # Command wrapper
├── package.json
└── package-lock.json
```
