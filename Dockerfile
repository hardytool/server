FROM library/node:latest

COPY . /src

WORKDIR /src

RUN npm install --production

ENTRYPOINT ["npm"]

CMD ["start"]
