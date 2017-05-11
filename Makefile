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

.PHONY: test build run
