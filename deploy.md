# Déploiement en production avec Dokploy

Ce guide déploie les 3 services (Postgres, backend, frontend) sur une instance [Dokploy](https://dokploy.com/)
en utilisant les images Docker déjà construites et versionnées par la CI/CD (`ghcr.io/gorskianthony/sport-backend`
et `sport-frontend`), via `docker-compose.prod.yml`.

## Vue d'ensemble

```
Internet ─▶ Dokploy (Traefik, SSL auto) ─▶ frontend (nginx, port 80) ─┬─▶ /api/*  → backend:3000 (réseau interne)
                                                                       └─▶ le reste → SPA Angular
                                                                              backend ─▶ postgres (5432)
```

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
3. Source : connecte le repo Git `GorskiAnthony/sport`, branche `main` (ou `dev` pour tester une pre-release).
4. **Compose Path** : `docker-compose.prod.yml` (pas `docker-compose.yml`, qui est pour le dev local).
5. **Compose Type** : `docker-compose` (pas Stack/Swarm).

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

BACKEND_TAG=latest
FRONTEND_TAG=latest
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
  dernière release. Si le build servi est manifestement plus vieux, `pull_policy: always` (voir "Mises à jour"
  ci-dessus) devrait déjà empêcher ce cas ; sinon force un `docker compose -f docker-compose.prod.yml pull`
  suivi d'un `up -d` directement sur le serveur.
- **Le backend ne démarre pas / boucle** : vérifie les logs — le plus souvent `DATABASE_URL`/`DATABASE_PASSWORD`
  incorrects, ou `postgres` pas encore healthy (le `depends_on: condition: service_healthy` du compose devrait
  déjà gérer ça).
- **CORS bloqué côté navigateur** : `CLIENT_URL` ne correspond pas exactement au domaine du frontend (schéma
  `https://` inclus, pas de `/` final).
- **`docker pull` échoue sur les images GHCR** : packages toujours privés sans registry configuré côté Dokploy
  (voir étape 1).
- **Certificat SSL ne se génère pas** : le DNS ne pointe pas encore vers le serveur, ou le port 80/443 n'est pas
  accessible depuis l'extérieur (pare-feu/groupe de sécurité).
