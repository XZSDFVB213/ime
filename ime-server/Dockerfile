# ---------- BUILD ----------
FROM node:20.17.0-alpine AS build

WORKDIR /app

# Нужно для Prisma + сборки native модулей типа better-sqlite3
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build


# ---------- PRODUCTION ----------
FROM node:20.17.0-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache \
    libc6-compat \
    openssl \
    libstdc++

COPY package*.json ./

# Не делаем второй npm ci.
# Забираем уже установленные зависимости из build.
COPY --from=build /app/node_modules ./node_modules

COPY --from=build /app/prisma ./prisma

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/uploads/materials

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]