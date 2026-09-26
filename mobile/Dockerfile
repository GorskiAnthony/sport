# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# "production,docker" : garde les budgets/outputHashing de la config production, mais avec
# l'environment.docker.ts (apiUrl relatif) à la place de environment.prod.ts (URL absolue
# réservée aux builds natifs iOS/Android destinés aux stores — voir README.md § Build natif).
RUN npx ng build --configuration production,docker

FROM nginx:1.27-alpine AS runtime
WORKDIR /app
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/www /usr/share/nginx/html
EXPOSE 80
