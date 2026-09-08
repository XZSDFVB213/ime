FROM node:20.17.0-alpine AS base

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

# ---------- BUILD ----------
FROM base AS build

COPY prisma ./prisma
COPY . .

# важно: prisma schema должна быть ДО generate
RUN npx prisma generate

RUN npm run build

# ---------- PRODUCTION ----------
FROM node:20.17.0-alpine AS production

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# копируем prisma (schema + migrations)
COPY --from=build /app/prisma ./prisma

# копируем node_modules с клиентом
COPY --from=build /app/node_modules ./node_modules

# копируем билд
COPY --from=build /app/dist ./dist

# применяем миграции при старте
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]