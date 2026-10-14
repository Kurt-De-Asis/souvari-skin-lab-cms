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

# Startup order, all logged so Railway shows what actually happened:
#  1. predeploy.sql            clears duplicate phone numbers a snapshot import
#                              can leave behind (blocks the unique-phone index).
#  2. predeploy-migrations.sql clears a half-applied migration marker so a
#                              previous failure cannot block every later one.
#  3. two `migrate resolve` calls unblock legacy/failed migrations: the obsolete
#     drop_preferred_staff migration cannot run on a fresh database, and the
#     unique-phone migration may be sitting failed from an earlier boot.
#  4. `migrate deploy` then applies everything, including the product-content
#     columns the chatbot reads, with retries.
#  5. `migrate status` is printed for diagnostics, then the server starts.
# Each preflight step is non-fatal, so a database that cannot run one of them
# still boots and serves traffic.
CMD ["/bin/sh", "-c", "echo '[deploy] preflight: clearing duplicate phones (if any)'; npx prisma db execute --file prisma/predeploy.sql --schema prisma/schema.prisma || echo '[deploy] phone preflight reported an error (continuing)'; echo '[deploy] preflight: clearing half-applied migration markers'; npx prisma db execute --file prisma/predeploy-migrations.sql --schema prisma/schema.prisma || echo '[deploy] migration-marker preflight reported an error (continuing)'; npx prisma migrate resolve --rolled-back 20261002120000_add_unique_user_phone || true; npx prisma migrate resolve --applied 20260929120000_drop_preferred_staff || true; for i in 1 2 3 4 5; do echo '[deploy] running prisma migrate deploy'; npx prisma migrate deploy && break || { echo '[deploy] migrate deploy failed, retrying in 10s...'; sleep 10; }; done; echo '[deploy] final migration status:'; npx prisma migrate status || true; exec node dist/server.js"]