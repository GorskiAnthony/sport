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
# .template (pas un .conf copié en dur) : passe par l'entrypoint officiel de l'image nginx, qui
# envsubst les ${VAR} du fichier avant de démarrer — voir frontend/Dockerfile, même mécanisme.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV BACKEND_UPSTREAM=backend:3000
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/www /usr/share/nginx/html
EXPOSE 80
