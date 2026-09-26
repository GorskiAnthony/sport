# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine AS runtime
# nodejs d'apk (pas un binaire copié depuis node:24-alpine : lié dynamiquement à des libstdc++/
# libgcc précises absentes de cette image, testé et ça plante au démarrage avec des erreurs de
# relocation symbol-not-found). nginx sert les assets statiques + le proxy /api comme avant, et
# proxie en plus les routes SSR dynamiques (/, /tournaments, /t/:id) vers le serveur Node Angular
# qui tourne dans le même conteneur — voir docker-entrypoint-ssr.sh pour le compromis "un seul conteneur".
# icu-data-full : le paquet nodejs d'Alpine embarque par défaut des données ICU réduites
# (anglais uniquement) — new Date(...).toLocaleDateString('fr-FR', ...) ne plante pas mais
# retombe silencieusement sur l'anglais ("Aug 20, 2026" au lieu de "20 août 2026"), constaté
# dans les dates générées côté SSR (og:description, JSON-LD...).
RUN apk add --no-cache nodejs icu-data-full
WORKDIR /app
COPY nginx.conf /etc/nginx/conf.d/default.conf
# outputMode "server" ne génère plus de index.html à la racine (seules les routes prérendues en
# ont un, dans leur propre sous-dossier) : sans ce rm, l'index.html par défaut de l'image nginx de
# base restait sur disque et try_files le servait pour "/" avant même d'atteindre le fallback SSR.
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY --from=build /app/dist/frontend/browser /app/dist/frontend/browser
COPY --from=build /app/dist/frontend/server /app/dist/frontend/server
COPY docker-entrypoint-ssr.sh /docker-entrypoint-ssr.sh
RUN chmod +x /docker-entrypoint-ssr.sh
ENV PORT=4000
EXPOSE 80
CMD ["/docker-entrypoint-ssr.sh"]
