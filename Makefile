HOST?=$(shell docker-machine ip)
PORT?="8000"
REDIS_HOST?="redis"
REDIS_PORT?="6379"

test:
	echo "$(HOST)"
	echo "$(PORT)"
	echo "$(REDIS_HOST)"
	echo "$(REDIS_PORT)"

build:
	HOST=$(HOST) \
	PORT=$(PORT) \
	STEAM_API_KEY=$(STEAM_API_KEY) \
	REDIS_HOST=$(REDIS_HOST) \
	REDIS_PORT=$(REDIS_PORT) \
	docker-compose build

run:
	HOST=$(HOST) \
	PORT=$(PORT) \
	STEAM_API_KEY=$(STEAM_API_KEY) \
	REDIS_HOST=$(REDIS_HOST) \
	REDIS_PORT=$(REDIS_PORT) \
	docker-compose up

.PHONY: test build run
