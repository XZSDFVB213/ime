FROM node:20.17.0-alpine AS build

WORKDIR /app

RUN apk add --no-cache \
    libc6-compat \
    openssl

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
    openssl

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /app/prisma ./prisma

COPY --from=build /app/dist ./dist

COPY --from=build \
    /app/node_modules/.prisma \
    ./node_modules/.prisma

COPY --from=build \
    /app/node_modules/@prisma \
    ./node_modules/@prisma

RUN mkdir -p /app/uploads/materials

EXPOSE 5000

CMD [
  "sh",
  "-c",
  "npx prisma migrate deploy && node dist/main.js"
]