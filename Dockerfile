# Node 24: LTS, подходит Prisma 7 (^20.19 || ^22.12 || >=24.0) и NestJS 11.
FROM node:24.22.2-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Prisma CLI не обращается в сеть за проверкой обновлений при каждом старте.
ENV CHECKPOINT_DISABLE=1

# Сборка: все зависимости, клиент Prisma и компиляция. Эта же стадия запускает тесты.
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# Только production-зависимости. CLI prisma входит в них: он нужен entrypoint для migrate deploy.
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts docker-entrypoint.sh ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations
RUN chown -R node:node /app
USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
