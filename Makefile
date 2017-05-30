HOST?=$(shell docker-machine ip)
PORT?="8000"
POSTGRES_DB?="seal"
POSTGRES_USER?="postgres"
POSTGRES_PASSWORD?="postgres"
REDIS_HOST?="redis"
REDIS_PORT?="6379"

check:
	@echo "HOST=$(HOST)"
	@echo "PORT=$(PORT)"
	@echo "POSTGRES_DB=$(POSTGRES_DB)"
	@echo "POSTGRES_USER=$(POSTGRES_USER)"
	@echo "POSTGRES_USER=$(POSTGRES_USER)"
	@echo "REDIS_HOST=$(REDIS_HOST)"
	@echo "REDIS_PORT=$(REDIS_PORT)"

build:
	PORT="$(PORT)" \
	docker-compose build

run:
	POSTGRES_DB="$(POSTGRES_DB)" \
	POSTGRES_USER="$(POSTGRES_USER)" \
	POSTGRES_PASSWORD="$(POSTGRES_PASSWORD)" \
	REDIS_HOST="$(REDIS_HOST)" \
	REDIS_PORT="$(REDIS_PORT)" \
	PORT="$(PORT)" \
	HOST="$(HOST)" \
	STEAM_API_KEY="$(STEAM_API_KEY)" \
	docker-compose up

unmigrate:
	psql -h $(HOST) -U $(POSTGRES_USER) -c 'drop table migration' seal

.PHONY: test build run
