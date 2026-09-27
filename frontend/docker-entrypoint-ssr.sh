#!/bin/sh
# Démarre le serveur Node Angular SSR en arrière-plan, puis nginx au premier plan.
# Limite connue : si le process Node meurt, ce script ne le relance pas — nginx continue de
# tourner (le conteneur reste "up") mais les routes SSR (/, /tournaments, /t/:id) répondent alors
# en 502 (proxy_pass vers un port qui n'écoute plus plutôt qu'un crash silencieux). Un superviseur
# de process (s6, tini + healthcheck applicatif...) serait plus robuste si ça devient un problème
# réel en prod ; pour l'instant ça garde une seule image/un seul service, comme le reste du projet.
set -e

node /app/dist/frontend/server/server.mjs &

# L'image nginx officielle ne déclenche son /docker-entrypoint.d/ (dont l'envsubst des templates
# de /etc/nginx/templates/ — voir nginx.conf/${BACKEND_UPSTREAM}) que si le process lancé s'appelle
# littéralement "nginx" (argv[0]) ; un exec "nginx ..." direct ici la contournerait entièrement,
# laissant nginx démarrer sur le default.conf statique de l'image de base. En repassant par
# /docker-entrypoint.sh (l'ENTRYPOINT du Dockerfile, qui a déjà tourné une première fois pour nous
# amener jusqu'ici sans exécuter ces scripts faute d'argv[0] "nginx"), on les déclenche cette fois.
exec /docker-entrypoint.sh nginx -g 'daemon off;'
