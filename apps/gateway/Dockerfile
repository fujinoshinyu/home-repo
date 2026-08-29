FROM node:20-slim AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/gateway/package.json apps/gateway/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/gateway/node_modules ./apps/gateway/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter gateway build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/gateway/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/gateway/node_modules ./apps/gateway/node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
