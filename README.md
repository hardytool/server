# Server

[![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/hardytool/server?logo=npm&logoColor=FFFFFF)](https://libraries.io/github/hardytool/server/dependencies)
[![CI status](https://img.shields.io/github/actions/workflow/status/hardytool/server/node.js.yml?logo=github)](https://github.com/hardytool/server/actions/workflows/node.js.yml?query=branch%3Atrunk "View this project's CI run history")
[![Checks status](https://img.shields.io/github/checks-status/hardytool/server/trunk?logo=railway&label=deploy)](https://github.com/hardytool/server/commit/trunk)
[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m787441842-04cf73902b7c489f45837dd0?logo=railway)](https://stats.uptimerobot.com/4zOmnCzkKJ)

This is RD2L's backend and website.

## Installation

First, install the project's dependencies.
```sh
npm install
```

Next, get an api key from https://steamcommunity.com/dev/apikey. Either set this
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

Steam bot support can be activated by providing the following:
```bash
STEAM_BOT_USERNAME='steam_username'
STEAM_BOT_PASSWORD='steam_password'
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

## Project structure
```bash
├── src
│   ├── api
│   │   └── *.js         # API-oriented controllers
│   ├── assets
│   │   └── **/*         # Static files (including images, markdown, etc.)
│   ├── lib
│   │   └── *.js         # Common utilities/shared libraries
│   ├── migrations
│   │   └── (\d\d\d).sql # Database migration files run at startup in order starting from 001.sql
│   ├── pages
│   │   ├── masters
│   │   │   ├── *.js     # Masters-specific controllers
│   │   └── *.js         # Page content controllers
│   ├── repos
│   │   └── *.js         # Database model repositories
│   └── templates
│   │   └── **/*.pug     # Template files structure as a hierarchical tree
├── Dockerfile
├── docker-compose.yml   # Development-oriented quickstart compose file
├── Makefile             # Command wrapper
├── package.json
└── package-lock.json
```
