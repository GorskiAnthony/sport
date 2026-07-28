# Intégration Stripe

Ce guide documente la configuration Stripe du projet (abonnements Classic/Pro mensuel+annuel,
Pass Événement) et les pièges déjà rencontrés, pour ne pas les re-découvrir à chaque fois.

## Un compte Stripe dédié par projet

Si tu gères plusieurs projets avec un seul identifiant de connexion Stripe : **ne partage pas un
compte Stripe entre plusieurs projets**. Le nom/logo affiché sur la page de paiement Stripe
Checkout vient des informations publiques du **compte** (Réglages → Image de marque), pas du
produit — un compte partagé affiche donc la marque d'un autre projet (ou ton nom perso) sur la
page de paiement.

Solution : clique sur le nom du compte en haut à gauche du dashboard Stripe → **"Créer un
compte"**. Chaque compte a sa propre image de marque, ses propres clés API, ses propres
produits/prix, son propre webhook — totalement isolé, sans changer d'identifiant de connexion.
Tu bascules entre comptes via ce même menu.

## Vue d'ensemble du flux

- **Abonnements Classic/Pro** (mensuel + annuel) : `SubscriptionController`/`SubscriptionService`
  (backend), page `/pricing` (frontend). Checkout Stripe en mode `subscription`. Le webhook
  (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)
  met à jour `User.plan` et persiste une ligne `Subscription` (statut, fin de période).
- **Pass Événement** (12€, paiement unique) : `EventPassController`/`EventPassService`. Checkout
  Stripe en mode `payment`. Le webhook crée un crédit (`EventPassPurchase`, statut `AVAILABLE`),
  consommé à la création d'un tournoi (`useEventPass: true`) qui devient alors exempté de la
  limite d'équipes du plan pour ce tournoi précis (`Tournament.eventPassExpiresAt`).
- Les deux passent par le **même** endpoint webhook (`/api/subscriptions/webhook`) — le dispatch
  se fait en interne sur `metadata.type == "EVENT_PASS"` (voir `SubscriptionService.onCheckoutCompleted`).
  Pas besoin de deux endpoints webhook séparés dans Stripe.

## Où trouver chaque valeur dans le dashboard Stripe

Les clés API (Publishable/Secret) sont sur une page, le webhook secret et les Price ID sont
ailleurs — facile de chercher au mauvais endroit.

| Variable | Où la trouver |
|---|---|
| `STRIPE_SECRET_KEY` | Developers → API keys → "Secret key" (`sk_live_...` en prod, `sk_test_...` en test) |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → clique sur l'endpoint créé → "Signing secret" → Reveal (`whsec_...`) |
| `STRIPE_PRICE_CLASSIC` | Catalogue produits → produit "Classic" → prix **mensuel** → `price_...` |
| `STRIPE_PRICE_CLASSIC_ANNUAL` | Même produit → prix **annuel** → `price_...` |
| `STRIPE_PRICE_PRO` | Produit "Pro" → prix **mensuel** → `price_...` |
| `STRIPE_PRICE_PRO_ANNUAL` | Produit "Pro" → prix **annuel** → `price_...` |
| `STRIPE_PRICE_EVENT_PASS` | Produit "Pass Événement" → prix **paiement unique** → `price_...` |

⚠️ **Product ID (`prod_...`) ≠ Price ID (`price_...`)**. Le "ID du produit" affiché en haut de la
fiche produit (`prod_...`) n'est PAS ce qu'attendent ces variables. Il faut descendre dans la
section tarification du produit : chaque ligne de prix a son propre identifiant `price_...`
(souvent avec une icône copier à côté), distinct de l'ID produit. Utiliser un `prod_...` à la
place d'un `price_...` fait échouer l'appel Stripe silencieusement côté serveur (voir Dépannage).

⚠️ **Test vs Live** : ce sont deux catalogues et deux jeux de clés totalement séparés (toggle en
haut à droite du dashboard). En prod, être en mode **Live** et utiliser des `price_...` créés
**en mode Live** avec une clé `sk_live_...` — un mélange test/live fait échouer les appels avec
`"No such price"`.

## Webhook

Developers → Webhooks → "+ Add endpoint" → type **"Endpoint de webhook"** :
- URL : `https://<domaine-api>/api/subscriptions/webhook`
- Événements à cocher : `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`

## Variables d'environnement

7 variables au total (voir `.env.example`/`.env.prod.example`) :

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_CLASSIC=
STRIPE_PRICE_PRO=
STRIPE_PRICE_CLASSIC_ANNUAL=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_EVENT_PASS=
```

⚠️ **Les définir dans Dokploy (onglet Environment) ne suffit pas.** `docker-compose.yml` et
`docker-compose.prod.yml` listent explicitement quelles variables sont transmises au conteneur
`backend` (bloc `environment:` du service) — une variable absente de cette liste n'atteint
**jamais** l'application, même si elle est bien définie et sauvegardée dans Dokploy. Si tu ajoutes
une nouvelle variable Stripe (nouveau produit, etc.), il faut l'ajouter aux **deux** endroits :
1. `app.stripe.*` dans `application.yml` (côté Spring) + `StripeProperties`
2. Le bloc `environment:` du service `backend` dans `docker-compose.yml` **et** `docker-compose.prod.yml`

Pour vérifier que les variables sont bien arrivées jusqu'au conteneur (terminal Docker du service
backend dans Dokploy) :
```
env | grep STRIPE
```

## Dépannage

- **`400 "Plan invalide"` ou `"Pass Événement indisponible"`** : un Price ID est vide côté
  backend — vérifier `env | grep STRIPE_PRICE` dans le conteneur (voir ci-dessus).
- **`502` renvoyé en JSON par l'appli** (avec un `message` du type "Erreur Stripe lors de la
  création de la session") : l'appel à l'API Stripe a échoué côté Java. Les erreurs Stripe sont
  logguées côté serveur (`SubscriptionService`/`EventPassService`, niveau ERROR) — regarder les
  logs backend juste après la tentative. Causes fréquentes : mélange test/live, `prod_...` au
  lieu de `price_...`, compte pas encore activé pour les paiements live.
- **`502` en page HTML nginx générique** (pas de JSON, `<title>502 Bad Gateway</title>` avec
  `nginx/1.27.5` en pied de page) : la requête n'atteint **pas du tout** le backend — ce n'est pas
  un problème Stripe. Vérifier dans le dashboard Stripe (Developers → Logs) si la requête apparaît
  ne serait-ce qu'en échec : si elle n'apparaît **pas du tout**, le problème est réseau/infra, pas
  applicatif.
  - Cause rencontrée : après plusieurs redeploys successifs du service **backend** (qui change son
    IP interne à chaque recréation de conteneur), le nginx du service **frontend** garde un pool
    de connexions persistantes vers l'ancienne IP et renvoie du 502 de façon intermittente sur
    **toutes** les routes (pas seulement Stripe) — y compris l'inscription, qui ne parle pourtant
    qu'à Postgres. `docker compose up`/un "Redeploy" global ne recrée que les services dont la
    config a changé : si seul `backend` a changé, `frontend` n'est **pas** redémarré et garde ses
    connexions périmées. **Fix** : redémarrer explicitement le conteneur `frontend` (bouton
    Restart sur sa ligne, dans le panneau Containers de Dokploy), pas seulement `backend`.
  - Pour vérifier que le réseau sortant vers Stripe fonctionne (éliminer une piste avant de
    soupçonner l'infra) : terminal du conteneur backend →
    ```
    wget -qO- https://api.stripe.com/v1/charges
    ```
    Un `401 Unauthorized` est normal (pas de clé envoyée) et confirme que le réseau sortant marche.
