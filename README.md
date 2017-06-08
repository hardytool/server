# Server
This is SEAL's backend and website.

## Dependencies
### Run locally
* nodejs
* npm
* postgres
* redis

### Run in Docker
* docker

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
REDIS_HOST='localhost'
REDIS_PORT='6379'
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
