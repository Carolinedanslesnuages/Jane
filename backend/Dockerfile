# Image de production de l'API Jane.
FROM node:22-alpine AS build
# Prisma a besoin d'openssl sur Alpine.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
EXPOSE 3300
# Le conteneur est « en bonne santé » quand l'API répond et joint sa base de données.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD wget -qO- http://localhost:3300/health || exit 1
# Applique les migrations puis démarre l'API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
