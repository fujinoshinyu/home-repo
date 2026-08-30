FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS build
ENV NODE_ENV=development
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/gateway/package.json apps/gateway/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN cd packages/shared && pnpm exec tsc
RUN cd apps/gateway && pnpm exec nest build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/gateway/node_modules ./apps/gateway/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/gateway/dist ./apps/gateway/dist
RUN mkdir -p /app/node_modules/@home-repo && \
    ln -sf /app/packages/shared/dist /app/node_modules/@home-repo/shared
EXPOSE 3000
CMD ["node", "apps/gateway/dist/main.js"]
