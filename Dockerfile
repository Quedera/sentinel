# QUEDERA SENTINEL - local image.
#
# Mirrors the deployed (Azure Container Apps) shape: a single Node process
# serving the Next.js app, talking to Postgres over the compose network.
#
# Deliberately NOT using Next's standalone output: the docusign-esign SDK is
# marked as an external server package, and keeping the full node_modules
# avoids tracing surprises around it.

# ---------- deps ----------
# Node 24 matches the host toolchain (v24.22.1), which builds this app
# cleanly - keeping the versions aligned avoids toolchain drift.
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:24-slim AS builder
WORKDIR /app
# Prisma needs openssl. A placeholder DATABASE_URL so the build never fails
# if a route touches the database while prerendering.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN npx prisma generate && npm run build

# ---------- run ----------
FROM node:24-slim AS runner
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

RUN mkdir -p /app/var/contracts
EXPOSE 3002
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3002", "-H", "0.0.0.0"]
