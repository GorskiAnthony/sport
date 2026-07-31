# Mobile

Application mobile (iOS + Android) pour les organisateurs de tournoi. Permet de suivre ses
tournois et le score des matchs en temps réel depuis un téléphone.

Stack : **Ionic + Angular (standalone) + Capacitor**, pour partager la syntaxe et une bonne
partie des patterns (signals, services, HttpClient) avec `frontend/`, tout en compilant vers de
vraies apps iOS/Android via Capacitor.

## Périmètre actuel

- Connexion organisateur (JWT, même API que le web)
- Liste des tournois de l'organisateur connecté
- Score des matchs en temps réel (WebSocket STOMP, même canal que le web —
  `/topic/tournaments/{id}`)

**Pas encore fait** : le dialogue organisateur ↔ arbitres. Le backend n'a aujourd'hui aucun
rôle `REFEREE` ni système de chat — ce sera un chantier backend à part avant de pouvoir
l'exposer côté mobile.

## Démarrer en local

```bash
npm install
ionic serve          # ou: npm start — lance dans le navigateur sur http://localhost:8100
```

Le backend doit tourner en local (`cd ../backend && mvn spring-boot:run`, voir le `README.md`
à la racine du repo). `src/environments/environment.ts` pointe par défaut sur
`http://localhost:3000/api` :

- **Navigateur / iOS Simulator** : `localhost` fonctionne tel quel.
- **Émulateur Android** : remplacer par `http://10.0.2.2:3000/api` (l'émulateur a sa propre
  boucle locale, `localhost` y désigne l'émulateur lui-même).
- **Device physique** (iOS ou Android) : remplacer par l'IP LAN de la machine qui fait tourner
  le backend (ex. `http://192.168.1.42:3000/api`), le téléphone et l'ordi doivent être sur le
  même réseau.

Le CORS/WebSocket du backend autorise déjà ces origines par défaut en dev (voir
`app.cors.additional-origins` dans `backend/src/main/resources/application.yml`) : le serveur
de dev Ionic (`http://localhost:8100`) et les WebViews Capacitor (`capacitor://localhost`,
`http://localhost`).

## Build natif (iOS / Android)

Pour tester sur un device/émulateur en local, utiliser `npm run build:dev` (configuration
`development`, garde `environment.ts`) — **pas** `npm run build` tout court : ce dernier est en
configuration `production` par défaut (voir `angular.json`, `defaultConfiguration`), qui bascule
sur `environment.prod.ts` et son URL placeholder (`https://sport.example.com/api`, qui ne
résout nulle part) — l'app compile sans erreur mais tous les appels réseau échouent
silencieusement (`ERR_NAME_NOT_RESOLVED`), symptôme trompeur qui ressemble à un problème de
réseau ou de token invalide alors que c'est juste la mauvaise configuration compilée.

```bash
npm run build:dev
npx cap sync               # copie le build web dans ios/ et android/, met à jour les plugins natifs
npx cap run android        # build + installe + lance sur l'appareil branché

# ou, pour ouvrir l'IDE natif à la place de cap run :
npx cap open ios           # ouvre Xcode (nécessite Xcode + un Mac)
npx cap open android       # ouvre Android Studio
```

`npm run build` (configuration `production`) est réservé au build destiné aux stores — et dans
ce cas, remplacer d'abord l'URL placeholder de `src/environments/environment.prod.ts` par le
vrai domaine de prod.

## Tests

```bash
npm test               # ng test, Karma/Jasmine + Chrome headless — hérité du template Ionic,
                        # contrairement à frontend/ qui est passé à Vitest
```

## Cohérence visuelle avec le web

La palette, la typo et les conventions de statut (couleurs des badges, etc.) sont documentées
dans `.claude/skills/design-system/SKILL.md` — à consulter avant d'ajouter un écran pour rester
cohérent avec `frontend/`. Le thème Ionic (`src/theme/variables.scss`) applique déjà cette
palette.
