HOST?=$(shell docker-machine ip)

test:
	echo "$(HOST)"

build:
	docker build -t=seal-server .

run:
	docker run -it -p 8080:8080 \
		-e "HOST=$(HOST)" \
		-e "PORT=8080" \
		-e "STEAM_API_KEY=$(STEAM_API_KEY)" \
		seal-server

compose:
	HOST=$(HOST) PORT=8080 STEAM_API_KEY=$(STEAM_API_KEY) docker-compose up

.PHONY: test build run compose
