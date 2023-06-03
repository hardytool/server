FROM library/node:latest
WORKDIR /src
COPY package.json package-lock.json /src/
RUN npm install --production
COPY . /src
CMD ["npm", "start"]
