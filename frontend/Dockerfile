# Image de production de l'interface web Jane (fichiers statiques servis par nginx).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Les adresses publiques sont fixées à la construction (variables VITE_*).
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM=jane
ARG VITE_KEYCLOAK_CLIENT_ID=jane-web
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
