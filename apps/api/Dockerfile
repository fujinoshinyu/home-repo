FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS build
ENV NODE_ENV=development
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/swagger/package.json apps/swagger/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN cd packages/shared && pnpm exec tsc
RUN cd apps/swagger && pnpm exec tsc
RUN cd apps/api && pnpm exec nest build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/swagger/node_modules ./apps/swagger/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/swagger/dist ./apps/swagger/dist
COPY --from=build /app/apps/api/dist/apps/api/src ./apps/api/dist
RUN mkdir -p /app/node_modules/@home-repo && \
    ln -sf /app/packages/shared/dist /app/node_modules/@home-repo/shared && \
    ln -sf /app/apps/swagger/dist /app/node_modules/@home-repo/swagger
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
