FROM library/node:latest

COPY . /src

WORKDIR /src

RUN npm install --production

EXPOSE 8080

ENTRYPOINT ["npm"]

CMD ["start"]
