#!/bin/sh
# Démarre le serveur Node Angular SSR en arrière-plan, puis nginx au premier plan.
# Limite connue : si le process Node meurt, ce script ne le relance pas — nginx continue de
# tourner (le conteneur reste "up") mais les routes SSR (/, /tournaments, /t/:id) répondent alors
# en 502 (proxy_pass vers un port qui n'écoute plus plutôt qu'un crash silencieux). Un superviseur
# de process (s6, tini + healthcheck applicatif...) serait plus robuste si ça devient un problème
# réel en prod ; pour l'instant ça garde une seule image/un seul service, comme le reste du projet.
set -e

node /app/dist/frontend/server/server.mjs &

exec nginx -g 'daemon off;'
