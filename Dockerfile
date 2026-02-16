# Build stage
FROM library/node:latest AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY client ./client
RUN npm run build

# Run stage
FROM library/node:latest
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY src/assets ./dist/assets
COPY src/migrations ./dist/migrations
CMD ["npm", "start"]
