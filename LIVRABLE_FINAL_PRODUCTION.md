# ✅ LIVRABLE FINAL — Déploiement Production Wend-Kabré SaaS

> **Mission : Audit Production & Préparation Déploiement Final**  
> **Date :** 2026-08-07  
> **Système :** Wend-Kabré — Plateforme SaaS Marchés Publics Burkina Faso  
> **Moyens de paiement :** Money Fusion (Orange Money / Moov Money)

---

## 1️⃣ ARCHITECTURE FINALE DE PRODUCTION

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CDN / DOMAINE                              │
│           wend-kabre.com  •  www.wend-kabre.com  •  *.onrender.com      │
└──────────────────────────────────────────────┬──────────────────────────┘
                                               │ HTTPS
            ┌──────────────────────────────────┴───────────────────────────┐
            │                                                              │
  ┌─────────▼────────────────┐                               ┌─────────────▼──────────────────┐
  │ SERVICE 1                │                               │ SERVICE 2                      │
  │ wend-kabre-backend       │                               │ payment-service                │
  │ (Next.js 16 App Router)  │─── /api/subscription/* ─────▶ │ (Node.js 20 / Express 4)       │
  │ React 19 / SSR / Edge    │                               │ Prisma 5 / PostgreSQL          │
  │                          │◀── Statuts Paiements JSON ───│ Routes :                       │
  │  • Pages :               │                               │   POST /api/payment/create     │
  │    /payment/success      │                               │   POST /api/payment/callback   │
  │    /payment/cancel       │◀─── Webhook Money Fusion ──── │   GET  /api/payment/status/:ref│
  │    /subscription         │                               │   GET  /api/payment/sub/:userId│
  │    /tarifs /marches ...  │                               │   GET  /api/payment/stats      │
  │                          │                               │   GET  /health                  │
  │ Firebase Auth / Firestore│                               │                                │
  │ Admin / Analytics ...    │                               │ Helmet / CORS strict / Rate    │
  │                          │                               │ limiting / JWT Admin           │
  └──────────────┬───────────┘                               └──────────────┬─────────────────┘
                 │                                                         │
                 │ Internal DATABASE_URL                                  │ Prisma
                 ▼                                                         ▼
         ┌──────────────────────────────────────────────────────────────────────────┐
         │           POSTGRESQL MANAGÉ RENDER (optionnellement 2 BDD séparées)      │
         │                                                                            │
         │   users  ┃  subscriptions ┃ payment_transactions ┃ [Firestore séparé]     │
         └──────────────────────────────────────────────────────────────────────────┘
                              │                          │
                              │ Sauvegardes Quotidiennes│ Sauvegarde manuelle pg_dump
                              ▼                          ▼
                       RENDER BACKUPS (7j)         S3 / Drive chiffré AES-256 (90j)
```

### URLs Production Finales

| Service | URL (Render Free temporaire) | URL (Domaine Personnalisé Prod) |
|---|---|---|
| Application (SaaS) | `https://wend-kabre-app.onrender.com` | `https://wend-kabre.com` |
| Backend API Next | intégrée à l'app | `https://api.wend-kabre.com` (CNAME) |
| Payment Service | `https://payment-service-wendkabre.onrender.com` | `https://payment.wend-kabre.com` |
| Money Fusion Callback (Webhook) | `https://payment-service-wendkabre.onrender.com/api/payment/callback` | `https://payment.wend-kabre.com/api/payment/callback` |
| Money Fusion Return | `https://payment-service-wendkabre.onrender.com/api/payment/return` | `https://payment.wend-kabre.com/api/payment/return` (302 → /payment/success ou cancel) |

---

## 2️⃣ LISTE DES FICHIERS MODIFIÉS / CRÉÉS

### 📝 Documentation (créés)

| Fichier | Emplacement | Contenu |
|---|---|---|
| **PRODUCTION_AUDIT.md** | racine | Audit complet 12 points de sécurité + corrections |
| **RENDER_DEPLOYMENT.md** | racine | Guide déploiement Render 2 services + PostgreSQL + domaines |
| **DATABASE_BACKUP.md** | racine | Stratégie sauvegarde/restauration/Runbook incident |
| **LIVRABLE_FINAL_PRODUCTION.md** | racine | Ce document (livrable final Étapes 8+10) |
| **.env.production.example** | racine | Template vars environnement prod backend principal |
| **.env.production.example** | `payment-service/` | Template vars environnement prod payment-service |
| **render.yaml** | racine | **Blueprint IaC** — BDD + 2 services Render (déploiement 1 clic) |

### ⚙️ Configuration (créés / modifiés)

| Fichier | Modification |
|---|---|
| `.gitignore` | ✅ Ajout `!.env.production.example` |
| `.env.example` (racine) | ✅ Ajout `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `PAYMENT_SERVICE_URL`, `JWT_SECRET`, Firebase Admin |
| `payment-service/.env.example` | (existait déjà — enrichi implicitement via prod example) |
| `next.config.ts` | (inchangé) |

### 🔧 Payment Service — Backend TypeScript

| Fichier (tous dans `payment-service/src/`) | Changements majeurs |
|---|---|
| `config/environment.ts` | ✅ Ajout `APP_URL`, `MONEY_FUSION_ALLOWED_IPS`, **`getEnvironmentUrls()`** qui adapte `app/callback/return/success/cancel` selon `NODE_ENV` (dev/test/prod) |
| `config/moneyFusion.config.ts` | ✅ Utilise `getEnvironmentUrls()`, ajoute `allowedIps`, `appSuccessUrl`, `appCancelUrl`, `appUrl` |
| `config/database.ts` | ✅ Logs structurés `databaseConnected`, `databaseError` |
| `app.ts` | ✅ **CORS strict** (origine whitelist + `.onrender.com` + localhost en dev) au lieu de `origin: '*'`<br>✅ Helmet + HSTS strict en prod<br>✅ **Raw Body préservé** (pour HMAC webhook)<br>✅ **Route /api/payment/return → redirection 302 intelligente** vers `/payment/success` ou `/payment/cancel` du frontend avec `ref` & `status` en query params |
| `server.ts` | ✅ Log `serverStarted` structuré |
| `services/webhookSecurity.service.ts` | ✅ **Refonte complète** — validation pipeline complet :<br>`validateFullPipeline(req, rawBody, payload, expectedAmount, expectedCurrency)`<br>• `validateIpWhitelist()` IP Money Fusion (optionnelle)<br>• `verifyHMACSignature()` multi-algo (sha256/512/sha1) + **REFUS systématique si secret absent OU sig absente EN PROD**<br>• `preventReplayAttack()` cache 50k entrées + fenêtre temporelle 10 min<br>• `validateWebhookPayload()` montant + devise |
| `services/webhook.service.ts` | ✅ Appel `logger.subscriptionActivated()` à l'activation |
| `services/providers/MoneyFusionProvider.ts` | ✅ Logs temps réponse `logger.moneyFusionApiCall(endpoint, durationMs, success)` sur /payUrl et /transaction/status |
| `services/payment.service.ts` | ✅ **NOUVEAU — `getUserSubscription(userId)`** — récupère abonnement actif, met à jour le statut EXPIRED automatiquement si date dépassée, retourne `plan`, `features`, `lastTransaction` |
| `controllers/payment.controller.ts` | ✅ **UTILISE DÉSORMAIS WebhookSecurityService** au lieu de la faible méthode inline<br>✅ Recherche transaction avant validation pour comparer montant/devise<br>✅ Toutes les routes avec `apiSuccess` / `apiError` / durées & métadonnées<br>✅ **NOUVELLE — `getSubscription(req, res)`** routeur |
| `routes/payment.routes.ts` | ✅ **NOUVELLE ROUTE — `GET /api/payment/subscription/:userId`** (servit le backend Next.js) |
| `utils/logger.ts` | ✅ **Refonte complète Logger structuré**<br>• Double écriture : lisible + JSON-Ligne (ingestion Datadog/ELK facile)<br>• Fichiers séparés : `logs/payment.log` et `logs/payment-errors.log`<br>• Métiers : `paymentCreated`, `webhookReceived/Rejected`, `paymentValidated`, `paymentRefused`, `subscriptionActivated`, `subscriptionExpired`, `moneyFusionApiCall`, `databaseError`, `apiSuccess`, `apiError`, `serverStarted`, `databaseConnected` |
| `middlewares/auth.middleware.ts` | (inchangé) |
| `middlewares/error.middleware.ts` | (inchangé) |

### 🖥️ Frontend + Backend Next.js (racine `src/`)

| Fichier | Changements majeurs |
|---|---|
| `lib/paymentServiceClient.ts` | ✅ **NOUVELLES interfaces** `SubscriptionResult`<br>✅ **NOUVELLE méthode** `getUserSubscription(userId)` → appelle `GET /api/payment/subscription/:userId` |
| `app/api/subscription/status/route.ts` | ✅ **Ne renvoie plus de mock !** Désormais appelle `paymentServiceClient.getUserSubscription(userId)` avec fallback FREE si le payment-service est down |
| `app/api/subscription/checkout/route.ts` | (inchangé, déjà correct) |
| `app/api/admin/payment/stats/route.ts` | (inchangé, déjà correct) |
| `app/subscription/page.tsx` | ✅ **Refonte UX complète** : Intégration Firebase Auth (récupère `uid`, `email`, `phone`)<br>✅ Appel **API réel `/api/subscription/status`**<br>✅ **Polling 5s** si paramètre `?ref=` présent (attend activation post-webhook)<br>✅ Affiche plan actuel, statut, expiration, dernière transaction, features<br>✅ Bouton **Renouveler** si abonnement actif paid<br>✅ Cartes Premium / Entreprise avec checkout |
| `app/payment/success/page.tsx` | ✅ UX : Animation activation, compte à rebours 8s → redirect `/subscription`<br>✅ Affiche `ref` / `status` passés par Money Fusion Return URL |
| `app/payment/cancel/page.tsx` | ✅ UX : Affiche motif, référence, support, liens réessayer / tarifs / abonnement |

---

## 3️⃣ INSTRUCTIONS DE DÉPLOIEMENT

### Option A : Blueprint IaC (recommandée pour 1er déploiement)

```bash
# 1. Pousser tous les changements sur la branche main de votre repo Git connecté à Render
git add . && git commit -m "prod: audit + déploiement final" && git push

# 2. Sur Render.com :
#    New +  →  Blueprint  →  Sélectionner render.yaml  →  Configurer secrets
```

Variables à **remplir manuellement** après Blueprint (marquées `sync: false`) :

| Service | Variable | Où la trouver ? |
|---|---|---|
| payment-service | `MONEY_FUSION_TOKEN` | Espace marchand Money Fusion |
| payment-service | `MONEY_FUSION_API_KEY` | Espace marchand Money Fusion |
| payment-service | `MONEY_FUSION_WEBHOOK_SECRET` | À générer (openssl rand -base64 32) puis reporter **dans Money Fusion** |
| payment-service | `MONEY_FUSION_ALLOWED_IPS` | Liste IP Money Fusion (optionnel — lacher si non documenté) |
| payment-service | `RENDER_EXTERNAL_URL` | Remplir après 1er déploi : `https://payment-service-wendkabre.onrender.com` OU `https://payment.wend-kabre.com` |
| wend-kabre-backend | Toutes Firebase client + Admin | Console Firebase → Paramètres projet |
| wend-kabre-backend | `EMAIL_USER`, `EMAIL_APP_PASSWORD` | Gmail / SMTP |
| wend-kabre-backend | `NEXT_PUBLIC_APP_URL` | Remplir après 1er déploi |

### Option B : Manuel (suivre le guide pas à pas)

Voir **`RENDER_DEPLOYMENT.md`** à la racine pour l'étape par étape avec captures d'écran implicites.

### Ordre de déploiement (impératif)

```
1. PostgreSQL wendkabre-payment-db
2. payment-service (attendre migration Prisma OK + health OK)
3. wend-kabre-backend (Next.js)
4. Enregistrer Webhook chez Money Fusion (avec la payment-service URL)
5. Test paiement sandbox → vérifier callback reçu
6. (Optionnel) Ajouter domaines personnalisés + SSL
```

### Migrations Prisma

**Automatique** : dans `render.yaml`, le build command du payment-service contient `npx prisma migrate deploy`.  
**Manuel si besoin** : shell Render ou local :
```bash
cd payment-service
npx prisma migrate deploy
```

---

## 4️⃣ VARIABLES D'ENVIRONNEMENT NÉCESSAIRES EN PRODUCTION

### 🔐 Backend Principal (Wend-Kabré Next.js)

```
# Obligatoires
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://wend-kabre.com
PAYMENT_SERVICE_URL=https://payment.wend-kabre.com
JWT_SECRET=<32+ chars. IDENTIQUE au payment-service>

# Firebase (obligatoires si Auth utilisé)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optionnels mais recommandés
DATABASE_URL=
SCRAPER_SECRET=
CRON_SECRET=
EMAIL_USER=
EMAIL_APP_PASSWORD=
NEXT_PUBLIC_SCRAPER_SECRET=
```

### 💳 Payment Service (Money Fusion / Express)

```
# Obligatoires
NODE_ENV=production
PORT=10000
RENDER_EXTERNAL_URL=https://payment.wend-kabre.com
DATABASE_URL=postgresql://user:pass@host:5432/wend_kabre_payment?schema=public&sslmode=require
JWT_SECRET=<IDENTIQUE à celui du backend principal>

# Money Fusion Production
MONEY_FUSION_API_URL=https://api.moneyfusion.net/v1
MONEY_FUSION_TOKEN=<à récupérer chez MF>
MONEY_FUSION_API_KEY=<à récupérer chez MF>
MONEY_FUSION_WEBHOOK_SECRET=<générer openssl rand -base64 32>

# Optionnelles sécurité
MONEY_FUSION_ALLOWED_IPS=<séparées par virgule si MF fournit une plage>

# Optionnel
APP_URL=https://wend-kabre.com        (override du calcul automatique dev/test/prod)
PAYMENT_CURRENCY=XOF
```

### Générer des secrets forts

```bash
# JWT Secret, Webhook Secret, Scraper, Cron
openssl rand -base64 48
# ou
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 5️⃣ CHECKLIST PRODUCTION FINALE (Étape 8 — 10 tests à passer avant Go-Live)

> **Mettre `[x]` après chaque test validé en environnement Sandbox Money Fusion, puis rejouer la checklist sur Production après le premier paiement réel.**

### 🔐 Authentification & Comptes

- [ ] **Création compte utilisateur** — Inscription Firebase e-mail/mdp valide → Firestore `users/{uid}` créé
- [ ] **Vérification e-mail** — Bannière + lien d'activation fonctionnent (si activé)
- [ ] **Mot de passe oublié** — Flow reset Firebase

### 💳 Flux Paiement Complet Money Fusion

- [ ] **Choix abonnement Premium** — Bouton `/tarifs` ou `/subscription` → modale → appel `POST /api/subscription/checkout`
- [ ] **Création paiement** — Réponse `success:true` + `paymentUrl` + `reference` type `WK-PAY-xxx` → transaction `PENDING` en base PostgreSQL
- [ ] **Redirection Money Fusion** — La page `paymentUrl` s'ouvre correctement (sandbox OK)
- [ ] **Paiement réussi simulé** (sandbox MF) — Simulation SUCCESS sur la passerelle
- [ ] **Callback reçu** — Log `PAYMENT_RECEIVED` puis `PAYMENT_VALIDATED` dans `logs/payment.log`. Statut transaction `SUCCESS` en base
- [ ] **Activation Premium côté BDD** — Ligne dans `subscriptions` : plan=PREMIUM, status=ACTIVE, endDate = startDate + 30j. Log `SUBSCRIPTION_ACTIVATED`
- [ ] **Redirection Return URL** — /api/payment/return ?ref=&status=SUCCESS → HTTP 302 → /payment/success?ref=&status=SUCCESS
- [ ] **Page /payment/success affiche** — « Abonnement Activé ! », compte à rebours → redirect /subscription

### 🔄 Événements vie de l'abonnement

- [ ] **Expiration abonnement** — Via `getUserSubscription(userId)`, si endDate < maintenant : statut devient EXPIRED. Log `SUBSCRIPTION_EXPIRED`
- [ ] **Renouvellement abonnement** — Depuis /subscription, bouton Renouveler → ref → nouveau paiement → SUCCESS → nouvelle ligne subscription ACTIVE (ancienne conservée historique, désactivée)

### 📊 Admin

- [ ] **Statistiques admin** — `GET /api/admin/payment/stats` (JWT valide) → totalTransactions, totalRevenue, successfulPayments, conversionRatePercentage correspondent aux paiements créés.

### 🛡️ Sécurité Webhook Money Fusion (Tests négatifs — doivent TOUS échouer 401/403/400)

- [ ] **Sans signature** en prod → HTTP 401 : *"Signature HMAC absente de la requête en production"*
- [ ] **Signature fausse** → HTTP 401
- [ ] **Montant trafiqué (payload amount != BDD)** → HTTP 400 : Discordance montant
- [ ] **Replay** 2 webhook identiques → 2ème reçu HTTP 400 : *"Replay Attack bloquée"*
- [ ] **IP non autorisée** (si IP Whitelist activée) → HTTP 403

### ✅ Go-Live final

- [ ] **Paiement réel 1 500 FCFA test** (ou 15 000 FCFA Premium — à rembourser manuellement si besoin)
- [ ] **Tous les services health** : /health, /api/ping retournent 200
- [ ] **Backup BDD** fait immédiatement avant et après le premier paiement réel
- [ ] **Monitoring alertes** activés sur Render (emails sur crash / 5xx)

---

## 6️⃣ RISQUES RESTANTS & RECOMMANDATIONS

### 🔴 Risques Hauts (action requise avant Go-Live)

| # | Risque | Impact | Mitigation |
|---|---|---|---|
| R1 | **JWT_SECRET et MONEY_FUSION_* secrets non remplis** en Render variables → l'app refuse de démarrer ou les webhooks passent sans vérif | Critique | Vérifier manuellement chaque variable avant le 1er déploiement. |
| R2 | **Free Tier Render → Sleep après 15 min d'inactivité** → délai de réponse premier paiement 30-60s, peut timeout MF callback | Élevé | Migrer payment-service vers plan **Starter 7€/mois** AVANT Go-Live. |
| R3 | **Firebase Rules Firestore actuels** (si non strictement verrouillés) — les utilisateurs écrivent directement `isSubscribed=true` contournant le paiement | Critique | Vérifier `firestore.rules` : **interdire write** sur `users/{uid}/{isSubscribed,subscriptionExpiresAt}` SAUF si `request.auth.token.admin == true` (via Custom Claims Admin SDK côté backend uniquement). |

### 🟡 Risques Moyens

| # | Risque | Impact | Mitigation |
|---|---|---|---|
| R4 | **Replay attack cache in-memory** — si pod payment-service redémarre, on perd le registre des nonces. Un attaquant pourrait rejouer pendant la fenêtre de 10 min post-restart. | Moyen | Pour 0 risque : stocker les nonces traités dans une table PostgreSQL `processed_webhook_nonces(reference, created_at)` avec index et TTL. Actuellement OK car contrôle idempotence supplémentaire sur `transaction.status !== PENDING`. |
| R5 | **Render Free PostgreSQL — Expiration 90j** → données perdues si pas de connexion active | Élevé (sur Free) | Migrer BDD vers plan payant ou sauvegardes manuelles hebdo + export pg_dump. |
| R6 | **Paiements Stuck en PENDING** si Money Fusion ne renvoie jamais le callback (down, ou incident réseau) | Moyen | CRON quotidien Next.js : fetch transactions PENDING depuis + de 2h, appelle Money Fusion API `/transaction/status/:ref` en polling de rattrapage. |
| R7 | **CORS strict** bloque si on oublie d'ajouter le domaine personnalisé final | Moyen | Envoyer `payment.wend-kabre.com` et `wend-kabre.com` dans la liste explicitement OU garder l'entrée wildcard `.onrender.com` présente. |

### 🟢 Risques Faibles / Évolutions futures

| # | Risque / Évolution |
|---|---|
| R8 | Ajouter **alerting Slack / Email** sur événements `PAYMENT_VALIDATED`, `PAYMENT_REFUSED`, erreurs critiques. |
| R9 | Centraliser logs JSON-Ligne de `logs/payment.log` vers **Datadog / Grafana Cloud** pour dashboards. |
| R10 | Mettre en place **Sentry.io** sur Next.js et payment-service pour remontée d'exceptions frontend + backend. |
| R11 | **Double validation Devise** côté Money Fusion si plusieurs devises possibles (EUR/XOF) — aujourd'hui fixé XOF. |
| R12 | Ajouter une **page admin** de visualisation des transactions (StatsSection PaymentsSection déjà présente côté composants). |
| R13 | **Passerelle de repli** si Money Fusion down → Moov Money / Orange Money directs (providers déjà implémentés dans `src/services/providers/`). |

---

## 📂 Sommaire des Documents livrés

```
wend-kabre-bf/
├── PRODUCTION_AUDIT.md          ✅ Audit 12 points + sécurité
├── RENDER_DEPLOYMENT.md         ✅ Guide Render 2 services + domaines
├── DATABASE_BACKUP.md           ✅ Stratégie backup + Runbook
├── LIVRABLE_FINAL_PRODUCTION.md ✅ Ce document
├── render.yaml                  ✅ Blueprint 1 clic (PostgreSQL + 2 services)
├── .env.production.example      ✅ Template vars prod Next.js
├── payment-service/
│   └── .env.production.example  ✅ Template vars prod Payment
└── src/  +  payment-service/src ✅ Code corrigé (voir section 2)
```

**Prochaine action recommandée** : lancer le déploiement Sandbox Render avec Blueprint IaC (`render.yaml`) → jouer la checklist de la section 5 ci-dessus, puis confirmer avant la bascule Production nom de domaine + paiements réels.

---

*Fin du livrable final — Audit Production & Préparation Déploiement Wend-Kabré — Version 1.1 — 07/08/2026*
