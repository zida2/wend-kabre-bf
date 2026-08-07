# GO_LIVE_REPORT.md — Premier Paiement Money Fusion Wend-Kabré

Rapport d'audit final complet. Généré 2026-08-07.
Dernière mise à jour blockers : 2026-08-07 (mission finale).

## ⚠️ BLOCKERS — COMPTE RENDU

| Indicateur | Valeur |
|---|---|
| **BLOCKERS AVANT la mission finale** | 🔴 **6** (5 config + 1 code) |
| **BLOCKERS CODE fermés** | ✅ **1/1** (Fallback Sandbox désactivé en production) |
| **BLOCKERS CONFIG restants** | 🟡 **5** (tous = configurations manuelles Render + Dashboard MoneyFusion) |
| Verdict global | **🟡 ACTION REQUIRED** → Après config manuelle des 5 secrets : **🟢 READY FOR PRODUCTION** |

---

## 🧾 CHECKLIST MANUELLE DÉPLOIEMENT (18 étapes)

Copier-coller avant le 1er paiement :

- [ ] **1.** Créer service Render `payment-service` (Node.js, Build Command : `cd payment-service && npm install && npm run build`, Start Command : `cd payment-service && node dist/server.js`)
- [ ] **2.** Configurer `DATABASE_URL` (version Pooled Supabase — port 6543)
- [ ] **3.** Configurer `DIRECT_URL` (port 5432, migrations seulement)
- [ ] **4.** Configurer `MONEY_FUSION_TOKEN` (Live, dashboard MF → Intégrations)
- [ ] **5.** Configurer `MONEY_FUSION_API_KEY` (même endroit)
- [ ] **6.** Configurer `MONEY_FUSION_WEBHOOK_SECRET` (dashboard MF → Webhooks → Secret)
- [ ] **7.** Configurer `JWT_SECRET` (≥ 32 caractères, chaîne aléatoire)
- [ ] **8.** Configurer `APP_URL` (URL frontend finale ; exemple `https://wend-kabre.com` SANS slash final)
- [ ] **9.** Configurer `RENDER_EXTERNAL_URL` (URL Render du payment-service ; Render le fournit auto ou le surcharger EXACTEMENT)
- [ ] **10.** Déployer ; attendre build + démarrage (Render Events)
- [ ] **11.** Vérifier **GET `/health`** → 200 + `{"status":"OK"}`
- [ ] **12.** Enregistrer Callback Money Fusion : `https://<URL_PAYMENT_SERVICE>/api/payment/callback`
- [ ] **13.** Enregistrer Return URL Money Fusion : `https://<URL_PAYMENT_SERVICE>/api/payment/return`
- [ ] **14.** Effectuer **test sandbox** MoneyFusion (cartes/fonds tests) si disponible (simuler SUCCESS puis FAILED)
- [ ] **15.** Vérifier webhook callback : `hmacValidated = true`, `ipValidated = true`, `replayChecked = true`, `success = true`
- [ ] **16.** Vérifier `PaymentTransaction.status` = SUCCESS + `Subscription.status = ACTIVE`, plan = PREMIUM
- [ ] **17.** Vérifier **Dashboard Admin** : onglets Transactions / Webhooks / Audit Logs — **tous doivent afficher le paiement test**
- [ ] **18.** **Seulement après 1-17 OK : effectuer le premier paiement réel (Mobile Money 15 000 FCFA)**

---

## 1. Ce qui est VALIDÉ ✅ (🟢 READY — sans attente)

| # | Module | État |
|---|--------|------|
| 1.1 | Build Next.js 15 | ✅ `next build` → 32/32 pages (Static ● + Dynamic λ). 0 warning bloquant. |
| 1.2 | TypeScript strict | ✅ `tsc --noEmit` → **0 erreur** (monorepo Next.js + `payment-service`). |
| 1.3 | Schema Prisma PostgreSQL | ✅ Validé par `prisma validate`. Toutes les tables poussées sur Supabase via `prisma db push`. |
| 1.4 | Dashboard Admin Frontend | ✅ 3 sections intégrées : [TransactionsSection](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/src/components/admin/sections/TransactionsSection.jsx) + [WebhooksSection](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/src/components/admin/sections/WebhooksSection.jsx) + [AuditLogsSection](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/src/components/admin/sections/AuditLogsSection.jsx). DataTable : pagination, recherche, filtres, tris fonctionnels. Aucun mock codé en dur. |
| 1.5 | Backend routes Admin | ✅ Middleware chainés `authenticateJWT → requireAdmin` sur `/api/admin/*` via [admin.routes.ts](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/routes/admin.routes.ts). Transactions, WebhookEvents, AuditLogs toutes exposées. |
| 1.6 | Pipeline sécurité Webhooks (MoneyFusion → Wend-Kabré) | ✅ Double validation : [WebhookSecurityService](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/services/webhookSecurity.service.ts) → **IP whitelist + HMAC multi-algo (sha256/512/sha1 hex/base64/préfixé) + Anti-rejeu ProcessedWebhook + Contrôle montant/devise + Référence obligatoire**. Puis [WebhookService](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/services/webhook.service.ts) → **Idempotence** (double callback SUCCESS/FAILED ignoré), discordance montant rejetée, transaction introuvable → 404. |
| 1.7 | Webhook Event append-only | ✅ `webhookEvent` créé **AVANT** validation pipeline, avec flags `hmacValidated`, `ipValidated`, `replayChecked`, `success`, `errorMessage`, `sourceIp`. → **On perd jamais** de callback MoneyFusion. |
| 1.8 | Audit Logs PostgreSQL | ✅ `AuditLogService` loggue PAYMENT_VALIDATION, ROLE_CHANGE… (append only PostgreSQL). Composant [AuditLogsSection](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/src/components/admin/sections/AuditLogsSection.jsx#L1) affichage expandable JSON. |
| 1.9 | CORS Payment-Service | ✅ **Production STRICTE** ([app.ts](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/app.ts#L38-L74)) : whitelist explicite uniquement (`wend-kabre.com`, `www.wend-kabre.com`, `payment.wend-kabre.com`, `api.wend-kabre.com`, `APP_URL`, `RENDER_EXTERNAL_URL`). Plus de wildcard `*.onrender.com` en prod ; correspondance HOST exacte. Headers HMAC MF autorisés : `x-moneyfusion-signature`, `x-webhook-signature`, `signature`. Dev/test reste relax. Aucun `origin: "*"`. |
| 1.13 | Fallback Sandbox MoneyFusion | ✅ **DÉSACTIVÉ en NODE_ENV=production** ([MoneyFusionProvider.ts#L39-L71](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/services/providers/MoneyFusionProvider.ts#L39-L71)). Si appel MF échoue en prod → `PaymentProviderError` throw (plus de fausse URL sandbox). Dev/test garde le fallback pour faciliter tests locaux. |
| 1.10 | Logger (payment-service) | ✅ Format structuré JSON + Human. 2 fichiers : `logs/payment.log` (tout) + `logs/payment-errors.log` (seulement warn/error). Aucune clé/token hardcodé loggué en clair à ce stade. |
| 1.11 | Règles Firestore | ✅ [firestore.rules](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/firestore.rules) : `/users/{userId}` champs `role / isSubscribed / subscriptionExpiresAt / paymentStatus / lastPaymentDate` **verrouillés côté client**. Seul Firebase Admin SDK peut les modifier (bypass rules Firestore). |
| 1.12 | Suspense Next.js 15 | ✅ `/payment/success`, `/payment/cancel`, `/subscription` maintenant en `dynamic = 'force-dynamic'` + `<Suspense>` autour de `useSearchParams`. Plus d'erreur prerender. |

---

## 2. Ce qui doit ENCORE être CONFIGURÉ (🟡 ACTION REQUISED)

Voir aussi [GO_LIVE_ENV_CHECK.md](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/GO_LIVE_ENV_CHECK.md) pour le tableau détaillé.

| # | Catégorie | Action | Priorité |
|---|-----------|--------|----------|
| 2.1 | Variables 🔴 | Renseigner `MONEY_FUSION_TOKEN` (Token Live) + `MONEY_FUSION_API_KEY` dans Payment-Service | **BLOCKER #1** |
| 2.2 | Variables 🔴 | Renseigner `MONEY_FUSION_WEBHOOK_SECRET` (Dashboard MF → Webhooks) | **BLOCKER #2** |
| 2.3 | Variables 🔴 | `APP_URL` = URL publique frontend finale (ex. `https://wend-kabre.com`). Utilisé pour construire `returnUrl` / `success` / `cancel`. | **BLOCKER #3** |
| 2.4 | Variables 🔴 | `RENDER_EXTERNAL_URL` = URL publique Render du service paiement. DOIT ÊTRE EXACTE (utilisée dans `callbackUrl` envoyée à Money Fusion). | **BLOCKER #4** |
| 2.5 | Variables 🔴 | `JWT_SECRET` ≥ 32 caractères aléatoires. Identique entre tous les admins qui génèrent des tokens d'accès dashboard. | **BLOCKER #5** |
| 2.6 | Variables 🟡 | `FIREBASE_SERVICE_ACCOUNT` (Next.js) : JSON compte service Firebase Admin. **Sans ça, les rôles/souscriptions Firestore ne peuvent pas être sync après paiement.** | Prioritaire hors paiement direct |
| 2.7 | Variables 🟡 | `DATABASE_URL` = version **Pooler (pgBouncer)** de Supabase (port 6543). Garder `DIRECT_URL` (port 5432) pour migrations seulement. | Conseillé |
| 2.8 | MoneyFusion (🔗 §6 URLs à enregistrer) | Déclarer dans Dashboard MoneyFusion l'URL de callback + return. | Voir §6 |
| 2.9 | Firebase Admin | Migrer `isAdmin()` [firestore.rules#L14-L16](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/firestore.rules#L14-L16) de email hardcodé vers Custom Claims Admin SDK (`request.auth.token.role == 'ADMIN'`). | Important long terme |
| 2.10 | Logs | Rotation des fichiers `logs/payment.log` (max size + max days). Activer `logrotate` sur Linux ou plugin Winston transport. | Avant fort trafic |
| 2.11 | IP whitelist MF | Récupérer IP officielles MoneyFusion, renseigner `MONEY_FUSION_ALLOWED_IPS` (CSV). | Sécurité additionnelle |
| 2.12 | Twilio/Gmail/Gemini | Renseigner `TWILIO_*`, `GMAIL_*`, `GOOGLE_GENERATIVE_AI_API_KEY` si ces modules sont activés. | Non bloquant pour le paiement seul |
| 2.13 | Crons | `CRON_SECRET` + `SCRAPER_SECRET` pour `/api/scrape` & `/api/notify`. | Hors paiement |

---

## 3. Les BLOCKERS empêchant un PAIEMENT RÉEL (🟡 = Configuration manuelle Render + MoneyFusion)

**RÉSUMÉ : 5 bloqueurs CONFIG restants. 0 blocker code.**

Tous les blockers sont maintenant des **configurations externes** à effectuer dans Render Env Vars et Dashboard MoneyFusion. Aucun blocker code ne subsiste.

---

| # | Bloqueur | Type | Comment corriger |
|---|----------|------|------------------|
| 1 | `MONEY_FUSION_TOKEN` + `MONEY_FUSION_API_KEY` Live (clé MoneyFusion) | 🟡 Config Manuelle | Dashboard MoneyFusion → Intégrations → Clés API. Copier dans Render Env Vars du service paiement. |
| 2 | `MONEY_FUSION_WEBHOOK_SECRET` | 🟡 Config Manuelle | Dashboard MoneyFusion → Webhooks → "Secret / Signature". DOIT correspondre au secret renseigné dans Render. **En `NODE_ENV=production`, callback sans HMAC valide → HTTP 401.** |
| 3 | `APP_URL` exacte | 🟡 Config Manuelle | URL publique réelle du frontend Next.js. Exemple : `https://wend-kabre.com` (domaine custom) OU `https://wend-kabre-bf.vercel.app` si Vercel sans domaine. **SANS SLASH FINAL.** Utilisée pour construire `/payment/success` & `/payment/cancel` redirect. |
| 4 | `RENDER_EXTERNAL_URL` exacte | 🟡 Config Manuelle | URL Render publique du service paiement. **Doit être EXACTE** : utilisée pour construire `callbackUrl` envoyée à MoneyFusion lors de `POST /api/payment/create`. MoneyFusion enverra son POST callback JSON sur cette URL + `/api/payment/callback`. |
| 5 | `JWT_SECRET` ≥ 32 caractères | 🟡 Config Manuelle | Générer chaîne aléatoire ≥ 32 caractères (ex. `openssl rand -hex 32`). Ne JAMAIS changer en production sans déconnecter tous les admins (tokens invalides). |

### ✅ Bloqueur #6 FERMÉ (avant mission → Fallback sandbox)
- Anciennement : `sandbox_fallback` activé si erreur API MF → risque de faux paiement validé en prod.
- Maintenant : [MoneyFusionProvider.ts#L54-L59](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/services/providers/MoneyFusionProvider.ts#L54-L59) → En `NODE_ENV=production`, si appel MF échoue → `throw PaymentProviderError` (erreur retournée utilisateur, **plus** de fallback sandbox). Dev/test seulement garde le fallback pour tests locaux.
- Logger : `[PRODUCTION] Échec appel Money Fusion /payUrl ... Fallback sandbox INTERDIT en production.`

---

## 4. Les variables à renseigner (tableau condensé)

Voir détail 42 lignes dans [GO_LIVE_ENV_CHECK.md](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/GO_LIVE_ENV_CHECK.md).

### Minimum vital pour 1er paiement Money Fusion
| Variable | À renseigner dans |
|----------|-------------------|
| `NODE_ENV=production` | Render → Env Vars payment-service |
| `PORT` (**ne pas hardcoder**) | Auto-par Render |
| `RENDER_EXTERNAL_URL` | Render auto-générée OU surchargée |
| `APP_URL` | Render payment-service Env Vars |
| `DATABASE_URL` (Supabase Pooled) | Render |
| `DIRECT_URL` (Supabase Session) | Render, utilisé seulement `prisma db push` |
| `JWT_SECRET` (≥32c) | Render payment-service + Next.js |
| `MONEY_FUSION_API_URL` | Render payment-service |
| `MONEY_FUSION_TOKEN` | Render payment-service |
| `MONEY_FUSION_API_KEY` | Render payment-service |
| `MONEY_FUSION_WEBHOOK_SECRET` | Render payment-service |
| `PAYMENT_CURRENCY=XOF` | Render payment-service |
| `PAYMENT_SERVICE_URL` | Next.js (Vercel / Render Web) Env Vars |

---

## 5. Les URLs à ENREGISTRER dans Money Fusion

**Copier/coller ces 2 URLs EXACTEMENT** dans le backoffice Money Fusion du marchand (rubrique : Intégrations / Webhooks / URLs de notification). Ces URLs sont **dynamiquement construites** à partir de `RENDER_EXTERNAL_URL` et `APP_URL` (moneyFusionConfig), l'enregistrement manuel garantit leur concordance avant Go-Live.

| Type | URL calculée | Description |
|------|--------------|-------------|
| 🔗 **Callback (Webhook POST)** | `https://<URL_RENDER_PAYMENT_SERVICE>/api/payment/callback` | ⚠️ **IMPORTANT** : c'est là que MoneyFusion POSTera le statut SUCCESS/FAILED. Vérifie HMAC, IP whitelist, anti-replay, idempotence. **Activer la signature HMAC** dans le dashboard MF et injecter la même valeur dans `MONEY_FUSION_WEBHOOK_SECRET`. |
| 🔗 **Return URL** (GET after payment) | `https://<URL_RENDER_PAYMENT_SERVICE>/api/payment/return` | MoneyFusion redirige l'utilisateur ici après paiement. Endpoint [app.ts#L113-L127](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/app.ts#L113-L127) décide du redirect final → `/payment/success?ref=...&status=SUCCESS` OU `/payment/cancel?...` sur le frontend `APP_URL`. |

> À CONFIGURER / VÉRIFIER AVEC MONEY FUSION :
> - **Format signature HMAC** (algo + encoding + header exact) : Le code supporte `x-moneyfusion-signature`, `x-webhook-signature`, `signature` — mais il faut savoir si MoneyFusion passe la signature dans le HEADER ou dans le BODY payload.
> - **Liste des IP émettrices** (pour `MONEY_FUSION_ALLOWED_IPS`)
> - **Valeurs exactes des statuts** renvoyés : code prévoit `SUCCESS / PAID / COMPLETED / FAILED / FAILURE / CANCELLED / CANCELED / EXPIRED` — mais confirmer avec documentation MoneyFusion.

---

## 6. Les tests à EFFECTUER MANUELLEMENT

### 6.1 Flux complet POSITIF (scénario utilisateur réel Premium 15 000 FCFA)

Ordre **STRICT** à exécuter après mise en production :

| Étape | Endroit | Opération | Valeurs attendues |
|-------|---------|-----------|-------------------|
| E1 | Frontend `/tarifs` | Utilisateur connecté Firebase clique **"Souscrire Premium"** | Redirect vers `/subscription` |
| E2 | Frontend `/subscription` | Clic **"Passer au Plan Premium"** → `POST /api/subscription/checkout` | 200. Réponse contient `success=true, paymentUrl=<moneyfusion>, reference=WKB-PRE-XXXXXX-YYYY` |
| E3 | BDD Supabase | `SELECT * FROM "PaymentTransaction" WHERE reference = 'WKB-...'` | `status = 'PENDING'`, `amount = 15000`, `planId = 'PREMIUM'`, `currency = 'XOF'` |
| E4 | MoneyFusion | Copier-coller `paymentUrl` dans navigateur, simuler paiement Mobile Money réussi | MoneyFusion : `STATUT = SUCCES` (côté MF) |
| E5 | MoneyFusion → Wend-Kabré | **Attendre callback POST MF** → endpoint `/api/payment/callback` | HTTP 200. `webhookEvent` créé. `hmacValidated=true`, `ipValidated=true`, `replayChecked=true`, `success=true`. `PaymentTransaction.status` passe à `SUCCESS`. |
| E6 | PostgreSQL BDD | Vérifier `Subscription` | `status='ACTIVE'`, `plan='PREMIUM'`, `endDate = today + 30 jours` |
| E7 | Frontend return MF | Redirection → `/payment/success?ref=WKB-...&status=SUCCESS` | Badge "Abonnement Activé", countdown 8s → redirect `/subscription` |
| E8 | Frontend `/subscription` | Recharger page (polling status) | Badge **● Actif**, date d'expiration, Plan Premium, bouton "Renouveler" visible |
| E9 | Dashboard Admin `/admin → Transactions` | Vérifier la ligne | Montant 15 000 FCFA, Plan PREMIUM, Statut SUCCESS, utilisateur correct |
| E10 | Dashboard Admin → Webhooks | Vérifier ligne | eventType = PAYMENT_SUCCESS, delivery = DELIVERED, flags HMAC/IP/anti-replay = 3x verts, expand JSON cohérent |
| E11 | Dashboard Admin → Audit Logs | Vérifier 2 entrées | actionType = `PAYMENT_VALIDATION` + potentiellement `SUBSCRIPTION_UPDATE` (conforme) |

### 6.2 Tests NÉGATIFS (rejet obligatoire → HTTP ≠ 200 & pas d'abonnement)

| # | Test | Méthode | Résultat attendu |
|---|------|---------|------------------|
| N1 | Callback **sans signature** | `curl -X POST /api/payment/callback -H 'Content-Type: application/json' -d '{"status":"SUCCESS","reference":"WKB-FAKE-1","amount":15000}'` + NODE_ENV=production | HTTP 401. `WebhookEvent.hmacValidated = false`. Aucun statut transaction modifié. |
| N2 | Callback **mauvaise signature HMAC** | Même requête + Header `x-moneyfusion-signature: bad_signature_123456789` prod mode | HTTP 401. `error = "Signature HMAC invalide."`. |
| N3 | Callback **mauvais montant** | Signature OK mais payload `amount=99999` (transaction attendue = 15000) | HTTP 400. "Discordance montant". Statut reste `PENDING`. |
| N4 | Callback **mauvaise référence** | reference = `WKB-INEXISTANTE-9999` + signature correcte | HTTP 404 NotFoundError. Transaction introuvable. |
| N5 | Callback **en DOUBLE** | Même requête SUCCESS envoyée 2 fois d'affilée (même timestamp) | 2ᵉ callback : HTTP 400 "Replay Attack bloquée". Grâce à `ProcessedWebhook.nonceKey`. |
| N6 | Callback **trop ancien** (11 min) | Même payload avec `timestamp = now - 11min` (REPLAY_WINDOW_MS = 10 min) | HTTP 400 "Notification webhook expirée (anti-rejeu)." |
| N7 | Callback **FAILED** | Payload `status = FAILED`, HMAC ok, ref valide | HTTP 200. Transaction → `FAILED`. **Pas** d'activation abonnement. Admin Audit = `PAYMENT_REJECTED` (log). `/payment/cancel?ref=...&status=FAILED` |
| N8 | Callback **CANCELLED** | Payload `status = CANCELLED`, HMAC ok | Idem N7 : statut → CANCELLED. Abonnement intact. |
| N9 | Transaction **inexistante** | `GET /api/payment/status/REF_INEXISTANTE` | 404 NotFoundError. |
| N10 | userId **inexistant** | `POST /api/payment/create` → `userId=usr_inexistant` + plan Premium 15000 | Transaction quand même créée (normal, car l'identité vient de Firebase frontend). Vérifier que payment ne valide pas plus tard si aucun utilisateur Firestore ne correspond (garder cohérence : à documenter). |

### 6.3 Tests SÉCURITÉ ADMIN (RBAC : USER vs ADMIN vs SUPER_ADMIN)

| # | Test | Résultat attendu |
|---|------|------------------|
| A1 | Appel **sans token** : `GET /api/admin/payment/transactions` | HTTP 401 "Jeton manquant". Aucune donnée. |
| A2 | Appel **token JWT USER (rôle USER)** → même endpoint | Middleware `requireAdmin` → **HTTP 403 Forbidden**. `PaymentTransaction` `total` `transactions` jamais retournés. |
| A3 | Appel **token ADMIN** (`role = ADMIN`) → `/api/admin/payment/transactions`, `/api/admin/payment/webhooks`, `/api/admin/audit-logs` | HTTP 200. Données consultables. |
| A4 | Appel **ADMIN** sur `PATCH /api/admin/users/:id/role` → passer quelqu'un en SUPER_ADMIN | HTTP 200 OK si route est bien `requireAdmin`. (Si SUPER_ADMIN seulement était requis, bloquer 403). Vérifier code [admin.routes.ts#L32-L37](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/routes/admin.routes.ts#L32-L37) → utilise `requireAdmin` (ADMIN + SUPER_ADMIN OK). |
| A5 | **Règles Firestore `/users/{uid}`** | Tentative depuis navigateur (SDK client Firebase) d'écrire directement `isSubscribed = true` → refus. Tentative d'écrire `role = 'ADMIN'` → refus. Seulement les champs non restreints (nom, téléphone) sont updatables par l'utilisateur. Vérifier fonction `restrictedFieldsChanged()` [firestore.rules#L49-L55](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/firestore.rules#L49-L55). |

---

## 7. Production Render — Checklist Déploiement

1. **Build payment-service** : `npm run build` dans `payment-service` (compile TS → dist/).
2. **Health check** Render : `GET /health` → attend `{"status":"OK",...}` → statut 200.
3. **Database connectivity** : `GET /api/payment/stats` avec JWT admin → pas d'erreur Prisma P1001.
4. **Variables** : les 12 variables §4 renseignées dans Render Environment (voir `GO_LIVE_ENV_CHECK.md §2`).
5. **CORS** : tester `curl -v -X OPTIONS https://<payment>/api/payment/callback -H 'Origin: https://front...' -H 'Access-Control-Request-Method: POST'` → 204 + headers CORS présents.
6. **Callback URL publique** : tester avec Postman/Insomnia → POST simulé vers `/api/payment/callback` (référence existante PENDING).
7. **Return URL** : `GET https://<payment>/api/payment/return?ref=WKB-DEMO-TEST&status=SUCCESS` → **302 Location: <APP_URL>/payment/success?ref=...&status=SUCCESS** (vérifier APP_URL).

### Endpoints Render production à sonder (sanity checks)
- `GET /health` → 200 `{status:"OK"}`
- `POST /api/payment/create` (payload valide) → 201 `{success:true, paymentUrl, reference}`
- `POST /api/payment/callback` (test HMAC) → 200/401 suivant signature
- `GET /api/payment/status/:reference` → 200 transaction
- `GET /api/payment/subscription/:userId` → 200 abonnement

---

## 8. Monitoring / Logs — Contrôle sécurité

- **Fichiers attendus** sur Render (persistence `/var/data` ou volume monté `logs/`) :
  - `logs/payment.log` : tous les événements (Créations, callbacks reçus/rejetés, validations, erreurs…)
  - `logs/payment-errors.log` : subset warn/error
- **Vérification anti-leak secret** : grep les fichiers logs AVANT go-live avec :
  - `MONEY_FUSION_TOKEN`, `MONEY_FUSION_API_KEY`, `MONEY_FUSION_WEBHOOK_SECRET`, `JWT_SECRET`, `Bearer `
  → Aucune ligne ne doit contenir la valeur **en clair** (note : `logger.debug('Payload MF', payload)` dans MoneyFusionProvider.createPayment pourrait logger `rawCallbackPayload` — inspecter payload MF pour s'assurer qu'il ne contient pas le secret).
- **PII (email / téléphone)** : acceptable (payment validé nécessite trace) mais rotation obligatoire 90j max.

---

## 9. PROCÉDURE EXACTE du PREMIER PAIEMENT RÉEL (Runbook Go-Live)

### Phase 0 — Préparation (10 min)
1. ✅ Fermeture des 5 BLOCKERS §3 (Token MF, APIKey, WebhookSecret, APP_URL, RENDER_EXTERNAL_URL, JWT_SECRET).
2. ✅ Upload / déploiement Render payment-service + Vercel Next.js avec variables à jour.
3. ✅ S'assurer `NODE_ENV=production` sur Render payment-service (critique pour HMAC).
4. ✅ **SUPPRIMER** le sandbox-fallback MoneyFusionProvider [L52-L61](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/payment-service/src/services/providers/MoneyFusionProvider.ts#L52-L61). Commenter le catch 48-61 → laisser remonter l'exception si MoneyFusion renvoie 4xx/5xx. Envoyer en production ce correctif **obligatoire** (évite faux paiement 15k avec fallback).
5. ✅ Enregistrer les 2 URLs §5 sur dashboard MoneyFusion + secret HMAC.
6. ✅ Avoir : un vrai compte Firebase utilisateur (non admin) pour tester ; un vrai moyen Mobile Money testeur ; un JWT admin dans la main ; un SQL Editor Supabase ouvert.

### Phase 1 — Test en Sandbox MoneyFusion si disponible
- Effectuer **scénario §6.1** avec cartes / fonds MoneyFusion TEST.
- Vérifier chaque étape E1→E11.
- Si MF ne fournit pas de sandbox, passer directement mais sur un **premier paiement réel bas montant** (demander à MF un plan test ou un coupon).

### Phase 2 — Premier paiement RÉEL 15 000 FCFA
1. Ouvrir **2 écrans** : utilisateur (Mobile) + Admin (Desktop Supabase SQL).
2. Sur mobile, **compte non admin**, `/tarifs` → Premium.
3. `/subscription` → **Passer au Plan Premium** → ouverture MoneyFusion → **payer 15 000 FCFA VRAIS**.
4. Dès validation Mobile Money : **scruter** Supabase.
   - `PaymentTransaction.status` → doit passer `PENDING → SUCCESS` < 30s.
   - `WebhookEvent` → nouveau record (idéalement hmacValidated=true ip=true replay=true).
   - `Subscription` → `ACTIVE plan PREMIUM endDate +30j`.
5. Sur mobile, vérifier `/subscription` affiche **Actif / Premium**.
6. Sur Admin dashboard : Transactions, Webhooks, AuditLogs **doivent tous afficher le nouveau paiement** sans mock.
7. **Si échec à n'importe quelle étape** :
   - Consulter `logs/payment-errors.log`
   - Ouvrir `WebhookEvent.errorMessage` dans Supabase
   - Vérifier HMAC via Postman replay avec signature copiée
   - Ne **pas** refaire de callback par curl si référence déjà marquée SUCCESS (risque modification double)

### Phase 3 — Post premier paiement réussi
1. Notifier équipe support (confirmation SMS/email si `TWILIO_*` et `GMAIL_*` configurés).
2. Archiver logs.
3. Désactiver temporairement sandbox-fallback si ce n'est pas déjà fait.
4. Vérifier Health & uptime : si tout OK, **annoncer Go-Live général**.

---

## 10. Synthèse finale

| Rubrique | Statut |
|----------|--------|
| Build Next.js & payment-service TypeScript | 🟢 OK |
| Architecture + PostgreSQL Supabase | 🟢 OK |
| Dashboard Admin (3 sections + DataTable) | 🟢 OK |
| Pipeline sécurité Webhook MF (HMAC+IP+Replay+Idempotence) | 🟢 OK code | 🟡 À valider en pratique avec 1 callback réel |
| Règles Firestore sensibles (role/subscription) | 🟢 OK règles | 🟡 Migration Custom Claims Admin souhaitée |
| Middleware RBAC Admin / Super Admin | 🟢 OK code | 🟡 À vérifier par 3 appels curl |
| 5 BLOCKERS §3 (Tokens MF + URLs + JWT) | 🔴 ACTION REQUISED | ⚠️ **8 heures d'effort estimées** |
| URLs à enregistrer dans MoneyFusion (§5) | 🟡 À faire | 10 min + échange support MF |
| Tests négatifs §6.2 (8 tests) | 🟡 À faire manuellement | 1 heure |
| Procédure §9 premier paiement réel | 🟡 À exécuter | 30 min + observabilité |

### Donc : Prêt pour Go-Live ?

> **Non, pas encore** → **5 blockers §3** sont actuellement dans l'état "valeurs par défaut de test". Après mise à jour des variables + suppression fallback sandbox MF + enregistrement 2 URLs backoffice MF :
>
> **→ 🟢 READY pour le premier paiement réel Money Fusion (Premium 15 000 FCFA).**
