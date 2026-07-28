# Déploiement en production avec Dokploy

Ce guide déploie les 3 services (Postgres, backend, frontend) sur une instance [Dokploy](https://dokploy.com/)
en utilisant les images Docker déjà construites et versionnées par la CI/CD (`ghcr.io/gorskianthony/sport-backend`
et `sport-frontend`), via `docker-compose.prod.yml`.

## Vue d'ensemble

```
Internet ─▶ Dokploy (Traefik, SSL auto) ─▶ frontend (nginx, port 80) ─┬─▶ /api/*        → backend:3000 (réseau interne)
                                                                       └─▶ pages HTML   → serveur Node Angular SSR
                                                                              (127.0.0.1:4000, même conteneur)
                                                                              backend ─▶ postgres (5432)
```

- Le conteneur **frontend** fait tourner nginx **et** un serveur Node (Angular SSR) côte à côte (voir
  `docker-entrypoint-ssr.sh`) : nginx sert les assets statiques et les pages prérendues au build, proxie `/api/*`
  vers le backend comme avant, et proxie tout le reste vers le serveur Node qui rend les pages à la demande
  (classement/organisateur/tournoi public — voir `frontend/src/app/app.routes.server.ts`). Limite connue : si le
  process Node plante, nginx reste up mais ces pages répondent en 502 (pas de superviseur de process).

- **frontend** et **backend** : images publiées automatiquement par `.github/workflows/release-*.yml` à chaque
  release (voir README.md pour la stratégie de branches `dev`/`main`).
- **postgres** : conteneur géré directement dans le compose (pas besoin du service "Database" natif de Dokploy).
- Rien n'est buildé sur le serveur de prod — Dokploy ne fait que `docker pull` + `docker compose up`.
- Le frontend appelle l'API en chemin relatif (`/api/...`) — nginx la relaie en interne vers le conteneur
  `backend` (`proxy_pass` dans `frontend/nginx.conf`). Le navigateur ne parle donc jamais directement au
  domaine du backend : pas de CORS à configurer côté navigateur, et le même build d'image fonctionne derrière
  n'importe quel domaine sans reconstruction. Le domaine du backend reste utile pour un accès API direct
  (Postman, future app mobile) mais n'est pas requis pour que le site fonctionne.

## Pré-requis

1. Une instance Dokploy déjà installée et accessible (voir [docs Dokploy](https://docs.dokploy.com/)).
2. Un nom de domaine (ou sous-domaine) pointant vers le serveur Dokploy, par ex. :
   - `sport.example.com` → frontend
   - `api.sport.example.com` → backend
3. Avoir mergé au moins une fois `dev` → `main` pour obtenir une image `:latest` stable (sinon utilise le tag
   `:dev` en attendant, cf. README.md).

## 1. Rendre les images GHCR accessibles

Par défaut, les packages GHCR créés par une Action GitHub sont **privés**. Deux options :

**Option A — rendre les packages publics (le plus simple)**
Sur GitHub : `github.com/GorskiAnthony?tab=packages` → `sport-backend` → *Package settings* → *Change visibility*
→ **Public**. Répéter pour `sport-frontend`.

**Option B — garder privé et donner l'accès à Dokploy**
Dans Dokploy, section *Registry* (ou *Docker* selon la version) : ajouter un registry privé avec :
- Registry URL : `ghcr.io`
- Username : ton nom d'utilisateur GitHub
- Password : un [Personal Access Token](https://github.com/settings/tokens) avec le scope `read:packages`

## 2. Créer le projet dans Dokploy

1. **Create Project** → nom libre, ex. `tournoi-center`.
2. Dans le projet, **Create Service** → **Compose**.
3. Source : connecte le repo Git `GorskiAnthony/sport`, branche `main` (prod) **ou** `dev` (préprod/staging).
4. **Compose Path** : `docker-compose.prod.yml` (pas `docker-compose.yml`, qui est pour le dev local).
5. **Compose Type** : `docker-compose` (pas Stack/Swarm).

⚠️ **La branche choisie ici et les tags d'image (`BACKEND_TAG`/`FRONTEND_TAG`, section suivante) doivent
correspondre**, sinon un déploiement peut sembler réussir (bon commit affiché dans l'onglet Deployments) tout
en tournant avec l'ancienne image : la branche ne détermine que le contenu du repo (donc de
`docker-compose.prod.yml`) que Dokploy lit, **pas** l'image Docker réellement tirée — ça, c'est uniquement les
variables d'environnement `BACKEND_TAG`/`FRONTEND_TAG` qui le décident, indépendamment de la branche source.
Concrètement :
- Service sur branche `main` → `BACKEND_TAG=latest` / `FRONTEND_TAG=latest` (le tag stable, mis à jour par une
  release sur `main`).
- Service sur branche `dev` → `BACKEND_TAG=dev` / `FRONTEND_TAG=dev` (le tag pre-release, mis à jour par
  *chaque* push sur `dev` — pas besoin de merger vers `main` pour tester).

Si un environnement de préprod pointe sur `dev` mais garde `BACKEND_TAG`/`FRONTEND_TAG` à leur valeur par défaut
(`latest`), il restera bloqué sur le dernier `main` publié, même après un redeploy — voir "Dépannage" plus bas.

## 3. Variables d'environnement

Dans l'onglet **Environment** du service Compose, colle et complète (voir `.env.prod.example` dans le repo pour
la liste commentée) :

```env
POSTGRES_DB=tournoi_center
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<généré avec: openssl rand -base64 24>

JWT_SECRET=<généré avec: openssl rand -base64 32>
JWT_EXPIRATION_DAYS=7
CLIENT_URL=https://sport.example.com

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_CLASSIC=
STRIPE_PRICE_PRO=

BACKEND_TAG=latest    # dev si ce service suit la branche dev — voir l'avertissement de l'étape 2
FRONTEND_TAG=latest   # idem
```

**Important** : `CLIENT_URL` doit être l'URL exacte (avec `https://`) du domaine du frontend. Le navigateur ne
l'utilise plus pour CORS sur le parcours principal (proxifié par nginx), mais le backend s'en sert pour
construire les URLs de redirection Stripe (checkout success/cancel) — une valeur incorrecte casse ces
redirections.

Ne jamais committer ce fichier rempli — `.env.prod.example` (le template vide) est le seul versionné.

## 4. Domaines et SSL

Toujours dans le service Compose, onglet **Domains** :

| Service (container) | Port interne | Domaine |
|---|---|---|
| `frontend` | 80 | `sport.example.com` |
| `backend` | 3000 | `api.sport.example.com` |

Active **HTTPS** sur les deux — Dokploy provisionne et renouvelle les certificats Let's Encrypt automatiquement
via Traefik, aucune config manuelle nécessaire. Assure-toi juste que le DNS pointe déjà vers le serveur avant
d'activer HTTPS (sinon la validation Let's Encrypt échoue).

## 5. Premier déploiement

Clique **Deploy**. Dokploy va :
1. Pull `postgres:16-alpine`, `ghcr.io/gorskianthony/sport-backend:latest`, `sport-frontend:latest`.
2. Démarrer `postgres`, attendre son healthcheck.
3. Démarrer `backend` (qui applique automatiquement les migrations Flyway au démarrage).
4. Démarrer `frontend`.

Suis les logs dans l'onglet **Logs** du service. Le backend est prêt quand tu vois `Started TournoiCenterApplication`.

## 6. Vérification post-déploiement

```bash
curl https://api.sport.example.com/health
# {"status":"ok","ts":"..."}

curl -X POST https://api.sport.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Prod","email":"test-prod@example.com","password":"password123"}'
# doit renvoyer un token + user
```

Puis ouvre `https://sport.example.com` dans le navigateur : inscription → connexion → redirection vers le
dashboard/espace spectateur selon le rôle.

## Compte administrateur

Le rôle `ADMIN` (tableau de bord `/admin` : vue d'ensemble, clients, tournois, localisations) n'a **aucune
voie self-service** — l'inscription ne peut créer que `ORGANIZER`/`SPECTATOR` (`RegisterRequest.resolveRole`),
par design, pour qu'aucun endpoint public ne permette de devenir admin. Pour obtenir un premier compte admin
en prod : crée un compte normal via `/register`, puis promeus-le directement en base, par ex. depuis le
serveur :

```bash
docker exec -it <conteneur_postgres> psql -U postgres -d tournoi_center \
  -c "UPDATE users SET role = 'ADMIN' WHERE email = 'ton-email@exemple.com';"
```

Le tableau de bord `/admin` est en lecture seule (aucune action de modification) — voir le code de
`AdminController`/`AdminService` pour son périmètre exact.

## Emails de réinitialisation de mot de passe (EmailJS)

Le "mot de passe oublié" envoie l'email **depuis le backend**, via l'API REST serveur-à-serveur
d'[EmailJS](https://www.emailjs.com/) (pas le SDK navigateur — celui-ci aurait obligé à renvoyer le
token de réinitialisation dans la réponse de l'API pour que le frontend puisse l'envoyer lui-même,
ce qui aurait permis à n'importe qui connaissant un email de récupérer le token directement sans
jamais recevoir le mail). L'appel serveur-à-serveur utilise la **clé privée** du compte EmailJS
(distincte de la clé publique), qui contourne la vérification d'origine navigateur d'EmailJS.

Comme pour Stripe, ce sont des variables d'environnement Dokploy classiques (voir `.env.prod.example`) :

```env
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=   # dashboard.emailjs.com > Account > API Keys — à garder secrète, jamais côté frontend
```

Le template EmailJS doit définir les variables `{{to_email}}` et `{{reset_link}}`. Tant que
`EMAILJS_PRIVATE_KEY` n'est pas renseignée, `/forgot-password` continue de répondre normalement (succès
générique) mais l'envoi échoue silencieusement côté serveur (visible dans les logs backend) — le compte
n'est jamais bloqué, seul l'email n'part pas.

## Capacité et supervision

Réglages pensés pour **une seule instance backend, dimensionnée un peu plus large** (pas de scaling horizontal —
voir plus bas pourquoi ça changerait des choses). Tous ajustables sans rebuild via les variables d'environnement
du service (voir `.env.prod.example`) :

| Variable | Défaut | Rôle |
|---|---|---|
| `DB_POOL_MAX_SIZE` | `20` | Taille max du pool de connexions Postgres (HikariCP). Le défaut Spring Boot (10) est un goulot d'étranglement sous charge réelle — quasi chaque requête fait un aller-retour DB. |
| `TOMCAT_MAX_THREADS` | `400` | Threads HTTP max côté backend. Le vrai plafond reste le pool DB ci-dessus ; cette marge sert juste à laisser les pics de connexions attendre gentiment plutôt que d'être refusés direct. |
| `CACHE_TTL_SECONDS` | `3` | Durée du cache en mémoire (Caffeine) sur la liste des tournois publics et le détail d'un tournoi. Absorbe une rafale de spectateurs qui rafraîchissent la même page en même temps (ex. juste après un but) en une seule requête DB au lieu de N. |

**Monitoring** : Spring Boot Actuator tourne sur un **port séparé** (`MANAGEMENT_PORT`, défaut `8081`), jamais
proxifié par nginx ni exposé publiquement — c'est la vraie barrière de sécurité, pas l'auth applicative. Pour le
consulter :
```bash
# Depuis le serveur (SSH), ou via docker exec dans le conteneur backend
curl http://localhost:8081/actuator/health
curl http://localhost:8081/actuator/metrics/hikaricp.connections.active
```
Si tu veux y accéder depuis un navigateur, ajoute un domaine Dokploy dédié pointant vers le port `8081` du
service `backend`, protégé par une **Basic Auth** au niveau de Traefik (middleware Dokploy) — ne l'expose jamais
sans ça, les métriques et l'état interne de l'appli ne sont pas destinés au public.

**Avant un pic de trafic annoncé** (ex. un beta testeur qui prévoit ~250 req/s) :
1. Simule-le d'abord avec un outil de test de charge (ex. [`k6`](https://k6.io/), `autocannon`) contre un
   environnement de staging plutôt que de deviner — ça dit précisément ce qui plie en premier.
2. Si besoin de plus de marge que les défauts ci-dessus, **augmente d'abord les ressources du serveur** (CPU/RAM)
   plutôt que de multiplier les instances : passer à plusieurs instances backend en parallèle demande de
   remplacer le rate-limiter (`RateLimitingFilter`, en mémoire — voir sa javadoc) et le broker WebSocket
   (`SimpleBrokerMessageHandler`, également en mémoire) par des versions partagées (Redis) puisque chaque
   instance a aujourd'hui son propre état ; un vrai chantier, à ne lancer que si le trafic doit rester élevé
   durablement, pas pour un pic ponctuel.

## Mises à jour

- Un push sur `dev` publie une pre-release (`:dev`) — utile pour tester en staging avant de promouvoir.
- Une PR mergée `dev` → `main` publie une release stable et met à jour le tag `:latest`.
- `docker-compose.prod.yml` déclare `pull_policy: always` sur `backend`/`frontend` : un simple **Redeploy**
  (ou un `docker compose up`) revérifie donc toujours le registre, même si le nom du tag (`:latest`) n'a pas
  changé. Sans ça, Docker réutilise silencieusement l'image déjà présente en local sur le serveur et une
  nouvelle release ne se déploie jamais tant qu'on n'a pas fait un `pull` explicite — c'est le piège classique
  à connaître si un service semble "en retard" après une release.
- Dans Dokploy, active **Auto Deploy** (webhook) sur le service si tu veux qu'un nouveau `:latest` redéploie
  automatiquement, ou clique **Redeploy** manuellement après une release (grâce au point ci-dessus, les deux
  approches repartent bien de l'image la plus récente).
- Pour figer une version précise plutôt que suivre `:latest`, mets `BACKEND_TAG`/`FRONTEND_TAG` à un numéro de
  version exact (ex. `1.2.0`) dans les variables d'environnement du service.

## Rollback

Repasse `BACKEND_TAG` et/ou `FRONTEND_TAG` (variables d'environnement du service) à la version précédente
(visible dans les tags Git `backend-vX.Y.Z` / GitHub Releases), puis **Redeploy**. Aucune image à reconstruire,
c'est juste un changement de tag suivi d'un `docker compose up`.

## Dépannage

- **Je viens de redeployer mais je ne vois pas les derniers changements** : vérifie d'abord que la release
  a bien réussi (onglet Actions du repo GitHub), puis compare la date de build réellement servie —
  `curl -sI https://sport.example.com/main-*.js | grep -i last-modified` (le nom exact du fichier `main-*.js`
  est visible dans le `<script>` de `curl -s https://sport.example.com/ | grep main-`) — à l'heure de la
  dernière release. Deux causes possibles, à vérifier dans cet ordre :
  1. **Mauvais tag suivi** : le service est sur la branche `dev` mais `BACKEND_TAG`/`FRONTEND_TAG` valent encore
     `latest` (ou l'inverse) — voir l'avertissement de l'étape 2. C'est la cause la plus probable si le *bon*
     commit apparaît dans l'onglet **Deployments** mais que le site ne change pas : le commit affiché reflète la
     branche source, pas l'image réellement tirée. Corrige les tags pour qu'ils correspondent à la branche, puis
     redeploy.
  2. **Image locale pas re-tirée** : si les tags correspondent déjà bien à la branche, `pull_policy: always`
     (voir "Mises à jour" ci-dessus) devrait empêcher ce cas ; sinon force un
     `docker compose -f docker-compose.prod.yml pull` suivi d'un `up -d` directement sur le serveur.
- **Le backend ne démarre pas / boucle** : vérifie les logs — le plus souvent `DATABASE_URL`/`DATABASE_PASSWORD`
  incorrects, ou `postgres` pas encore healthy (le `depends_on: condition: service_healthy` du compose devrait
  déjà gérer ça).
- **CORS bloqué côté navigateur** : `CLIENT_URL` ne correspond pas exactement au domaine du frontend (schéma
  `https://` inclus, pas de `/` final).
- **`docker pull` échoue sur les images GHCR** : packages toujours privés sans registry configuré côté Dokploy
  (voir étape 1).
- **Certificat SSL ne se génère pas** : le DNS ne pointe pas encore vers le serveur, ou le port 80/443 n'est pas
  accessible depuis l'extérieur (pare-feu/groupe de sécurité).
