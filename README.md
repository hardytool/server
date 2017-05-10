# Server
This is SEAL's backend.

## Installation
First, install the project's dependencies.
```sh
npm install
```

Next, get an api key from https://steamcommunity.com/dev/apikey. Either set this
as an environment variable or a variable in a `.env` file - name must be
`STEAM_API_KEY`.

Finally, set `.env` or environment variables for HOST and PORT.

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
