FROM library/node:latest

RUN apt-get update && \
  apt-get install -y postgresql redis-tools

WORKDIR /src

COPY package.json /src/

RUN npm install --production

COPY . /src

ENTRYPOINT ["./wait.sh"]

CMD ["db", "npm", "start"]
