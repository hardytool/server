FROM library/node:latest
WORKDIR /src
COPY package.json package-lock.json /src/
RUN npm ci --omit=dev
COPY . /src
CMD ["npm", "start"]
