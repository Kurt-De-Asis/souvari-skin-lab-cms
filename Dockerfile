# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

RUN npm ci --prefix client
RUN npm ci --prefix server

COPY server/prisma ./server/prisma
RUN npm run db:generate --prefix server

COPY . .
RUN npm run build --prefix client
RUN npm run build --prefix server

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Manila
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates tzdata \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/client/dist ./client/dist

WORKDIR /app/server
EXPOSE 3000

CMD ["/bin/sh", "-c", "for i in 1 2 3 4 5; do npx prisma migrate deploy && break || { echo 'prisma migrate deploy failed, retrying in 10s...'; sleep 10; }; done && node dist/server.js"]