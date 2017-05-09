FROM library/node:latest

COPY . /src

WORKDIR /src

EXPOSE 8080

ENTRYPOINT ["npm"]

CMD ["start"]
