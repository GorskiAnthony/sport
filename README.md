# Tournoi Center

Plateforme de gestion de tournois sportifs.

## Structure du repo

```
backend/    API REST — Spring Boot 4 / Java 21 / Maven
frontend/   SPA — Angular 22 / Tailwind CSS 4
mobile/     réservé pour une future app mobile (vide pour l'instant)
```

Chaque paquet (`backend/`, `frontend/`) est versionné et publié indépendamment.

## Développement local

**Backend** (nécessite PostgreSQL, voir `backend/.env.example`) :

```bash
cd backend
mvn spring-boot:run
```

**Frontend** :

```bash
cd frontend
npm install
npm start
```

**Toute la stack via Docker Compose** (Postgres + backend + frontend) :

```bash
cp .env.example .env
docker compose up --build
```

- Frontend : http://localhost:4200
- Backend : http://localhost:3000 (health check sur `/health`)
- Postgres : localhost:5432

Un service `mobile` est réservé (commenté) dans `docker-compose.yml`, à activer une fois l'app mobile initialisée.

## Production

Voir [`deploy.md`](./deploy.md) — déploiement sur [Dokploy](https://dokploy.com/) via `docker-compose.prod.yml`
et les images publiées sur `ghcr.io`.

## Branches et releases

- **`dev`** : branche d'intégration (par défaut). Chaque push y déclenche une **pre-release** (`backend-vX.Y.Z-dev.N` / `frontend-vX.Y.Z-dev.N`), image Docker taguée `:dev`.
- **`main`** : branche stable. Une fois `dev` prête à être promue, ouvrir une PR `dev` → `main` : le merge déclenche une **release stable** (`backend-vX.Y.Z` / `frontend-vX.Y.Z`), image Docker taguée `:latest`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`) : sur chaque PR vers `dev` ou `main`, build + tests du/des paquet(s) modifié(s), et vérification du format des commits.
- **Releases** (`.github/workflows/release-backend.yml`, `release-frontend.yml`) : sur push vers `dev` ou `main`, [semantic-release](https://semantic-release.gitbook.io/) (via `semantic-release-monorepo`) détermine la version suivante à partir des commits, met à jour le changelog et la version (`pom.xml` / `package.json`), crée un tag Git et une GitHub Release, et publie une image Docker sur `ghcr.io`.

### Convention de commit

Ce repo suit [Conventional Commits](https://www.conventionalcommits.org/), obligatoire pour que les releases automatiques fonctionnent :

```
<type>(<scope>): <description>

feat(backend): ajoute l'endpoint de classement
fix(frontend): corrige le formulaire de connexion
```

- **type** : `feat` (minor), `fix` (patch), `perf`, `refactor`, `docs`, `chore`, `test`, `ci`... — un `BREAKING CHANGE:` dans le corps du commit déclenche un major.
- **scope** (optionnel) : `backend`, `frontend`, `mobile`, `ci`, `deps`, `release`.

Un commit qui ne touche que `frontend/` doit être scopé `frontend` (et inversement) pour que le bon paquet soit republié.
