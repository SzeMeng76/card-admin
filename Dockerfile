FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM base AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Rebuild better-sqlite3 native binding for runtime arch
COPY --from=deps /app/node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3 \
    ./node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
RUN cd node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3 && npm rebuild better-sqlite3
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
