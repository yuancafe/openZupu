FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @openzupu/database build
# Generate Prisma Client (writes to packages/database/node_modules/.prisma/client)
RUN pnpm --filter @openzupu/database exec prisma generate
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma-seed.cjs ./apps/api/prisma-seed.cjs

EXPOSE 3001
# Apply Prisma schema to the connected database on startup, then seed demo data if empty
CMD sh -c "cd packages/database && ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss && cd ../.. && node apps/api/prisma-seed.cjs && node apps/api/dist/main.js"
