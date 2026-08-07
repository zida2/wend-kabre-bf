# ✅ CHECKLIST GO-LIVE — WEND-KABRÉ PAYMENT SERVICE

**Date de début :** _____________  
**Responsable :** _____________  
**Statut :** 🔴 NOT STARTED / 🟡 IN PROGRESS / 🟢 COMPLETED

---

## 🚨 BLOCKERS CRITIQUES (À résoudre en PREMIER)

### ❌ BLOCKER #1 — Token Money Fusion Live
- [ ] Se connecter au Dashboard Money Fusion
- [ ] Aller dans **Intégrations → Clés API**
- [ ] Copier le **Token Live** (production)
- [ ] Render → payment-service → Environment → Ajouter `MONEY_FUSION_TOKEN=<valeur_copiée>`
- [ ] Sauvegarder et redéployer

### ❌ BLOCKER #2 — API Key Money Fusion Live
- [ ] Même endroit : Dashboard MF → Intégrations → Clés API
- [ ] Copier la **API Key Live**
- [ ] Render → payment-service → Environment → Ajouter `MONEY_FUSION_API_KEY=<valeur_copiée>`
- [ ] Sauvegarder et redéployer

### ❌ BLOCKER #3 — Webhook Secret Money Fusion
- [ ] Dashboard Money Fusion → **Webhooks** ou **Notifications**
- [ ] Copier le **Secret de signature HMAC**
- [ ] Render → payment-service → Environment → Ajouter `MONEY_FUSION_WEBHOOK_SECRET=<valeur_copiée>`
- [ ] Sauvegarder et redéployer
- [ ] ⚠️ **SANS CE SECRET, TOUS LES CALLBACKS SERONT REFUSÉS (HTTP 401)**

### ❌ BLOCKER #4 — URL Frontend (APP_URL)
- [ ] Déterminer l'URL publique finale du frontend Next.js :
  - Domaine custom : `https://wend-kabre.com` ✅
  - OU Vercel : `https://wend-kabre-bf.vercel.app`
- [ ] Vérifier : **SANS SLASH FINAL**
- [ ] Render → payment-service → Environment → Ajouter `APP_URL=<url_frontend>`
- [ ] Sauvegarder et redéployer

### ❌ BLOCKER #5 — URL Render Payment Service
- [ ] Une fois le service Render créé, noter l'URL auto-générée
- [ ] Exemple : `https://payment-service-wendkabre.onrender.com`
- [ ] Si différente du défaut, surcharger :
- [ ] Render → payment-service → Environment → Modifier `RENDER_EXTERNAL_URL=<url_exacte>`
- [ ] Sauvegarder et redéployer
- [ ] ⚠️ **CETTE URL EST ENVOYÉE À MONEY FUSION, ELLE DOIT ÊTRE EXACTE**

---

## 🔧 CONFIGURATION RENDER

### Création Service
- [ ] **1.** Créer un nouveau **Web Service** sur Render
- [ ] **2.** Nom : `payment-service-wendkabre` (ou autre)
- [ ] **3.** Repository : Connecter GitHub/GitLab
- [ ] **4.** Root Directory : `payment-service`
- [ ] **5.** Runtime : **Node**
- [ ] **6.** Build Command : `npm install && npm run build`
- [ ] **7.** Start Command : `node dist/server.js`

### Variables d'Environnement Essentielles
- [ ] **8.** `NODE_ENV=production`
- [ ] **9.** `PORT` (laisser Render gérer automatiquement)
- [ ] **10.** `DATABASE_URL` (Supabase Pooled Connection String — port 6543)
  - Format : `postgres://...pooler.supabase.com:6543/postgres?pgbouncer=true`
- [ ] **11.** `DIRECT_URL` (Supabase Direct — port 5432)
  - Format : `postgres://...supabase.com:5432/postgres`
- [ ] **12.** `JWT_SECRET` (≥ 32 caractères)
  - Générer : `openssl rand -hex 32`
- [ ] **13.** `PAYMENT_CURRENCY=XOF`

### Variables Money Fusion (BLOCKERS 1-3)
- [ ] **14.** `MONEY_FUSION_API_URL=https://api.moneyfusion.net/v1` (à confirmer avec MF)
- [ ] **15.** `MONEY_FUSION_TOKEN` (voir BLOCKER #1)
- [ ] **16.** `MONEY_FUSION_API_KEY` (voir BLOCKER #2)
- [ ] **17.** `MONEY_FUSION_WEBHOOK_SECRET` (voir BLOCKER #3)

### Variables URLs (BLOCKERS 4-5)
- [ ] **18.** `APP_URL` (voir BLOCKER #4)
- [ ] **19.** `RENDER_EXTERNAL_URL` (voir BLOCKER #5)

### Variables Optionnelles (Sécurité Renforcée)
- [ ] **20.** `MONEY_FUSION_ALLOWED_IPS` (récupérer liste IPs MF, format CSV)

---

## 🔗 CONFIGURATION DASHBOARD MONEY FUSION

### URLs à Enregistrer
- [ ] **21.** Se connecter au Dashboard Money Fusion
- [ ] **22.** Aller dans **Webhooks** ou **Intégrations** ou **Notifications**
- [ ] **23.** Enregistrer **Callback URL** :
  - `https://<RENDER_URL>/api/payment/callback`
  - Remplacer `<RENDER_URL>` par la vraie URL Render du service
  - Exemple : `https://payment-service-wendkabre.onrender.com/api/payment/callback`
- [ ] **24.** Enregistrer **Return URL** :
  - `https://<RENDER_URL>/api/payment/return`
  - Exemple : `https://payment-service-wendkabre.onrender.com/api/payment/return`
- [ ] **25.** Activer **Signature HMAC** (webhook secret) dans le dashboard MF
- [ ] **26.** Vérifier que le secret configuré correspond à celui mis dans Render (BLOCKER #3)

### Informations à Récupérer de Money Fusion
- [ ] **27.** URL API Production exacte : ___________________________
- [ ] **28.** Nom du header signature HMAC : ___________________________
  - `x-moneyfusion-signature` ? `x-webhook-signature` ? `signature` ?
- [ ] **29.** Algorithme HMAC : ___________________________
  - SHA256 ? SHA512 ? SHA1 ?
- [ ] **30.** Encoding signature : ___________________________
  - HEX ? Base64 ? Préfixe `sha256=` ?
- [ ] **31.** Liste des IPs émettrices MF : ___________________________
- [ ] **32.** Statuts possibles callback : ___________________________
  - SUCCESS, FAILED, CANCELLED... ?
- [ ] **33.** Environnement Sandbox disponible ? ☐ OUI ☐ NON

---

## 🧪 TESTS AVANT PAIEMENT RÉEL

### Vérification Basique
- [ ] **34.** Déployer le service sur Render
- [ ] **35.** Attendre que le build soit **SUCCESS** (vérifier Render Events)
- [ ] **36.** Tester Health Check :
  - `curl https://<RENDER_URL>/health`
  - Attendu : `{"status":"OK","timestamp":"...","service":"payment-service"}`
- [ ] **37.** Vérifier logs Render : aucune erreur Prisma P1001 (connexion BDD)
- [ ] **38.** Vérifier logs Render : aucune erreur `MONEY_FUSION_WEBHOOK_SECRET non configuré`

### Test Callback (Manuel avec curl/Postman)
- [ ] **39.** Créer une transaction test dans Supabase (status=PENDING)
- [ ] **40.** Générer une signature HMAC test :
  ```bash
  echo -n '{"status":"SUCCESS","reference":"WKB-TEST-001","amount":15000}' | \
  openssl dgst -sha256 -hmac "<VOTRE_WEBHOOK_SECRET>" | awk '{print $2}'
  ```
- [ ] **41.** Envoyer callback test :
  ```bash
  curl -X POST https://<RENDER_URL>/api/payment/callback \
    -H "Content-Type: application/json" \
    -H "x-moneyfusion-signature: <signature_calculée>" \
    -d '{"status":"SUCCESS","reference":"WKB-TEST-001","amount":15000,"currency":"XOF"}'
  ```
- [ ] **42.** Vérifier logs Render : `[WEBHOOK_SECURITY] Signature HMAC validée`
- [ ] **43.** Vérifier Supabase : `PaymentTransaction.status = SUCCESS`
- [ ] **44.** Vérifier Supabase : `WebhookEvent` créé avec `hmacValidated=true`

### Test Sandbox Money Fusion (Si Disponible)
- [ ] **45.** Effectuer un paiement test avec fonds/carte sandbox MF
- [ ] **46.** Vérifier que Money Fusion envoie le callback automatiquement
- [ ] **47.** Vérifier logs Render : callback reçu + validé
- [ ] **48.** Vérifier `PaymentTransaction.status = SUCCESS`
- [ ] **49.** Vérifier `Subscription.status = ACTIVE`, `plan = PREMIUM`
- [ ] **50.** Vérifier Dashboard Admin `/admin` :
  - Onglet Transactions : affiche le paiement test
  - Onglet Webhooks : affiche le webhook reçu
  - Onglet Audit Logs : affiche les actions

---

## 💳 PREMIER PAIEMENT RÉEL (15 000 FCFA)

### ⚠️ NE PAS EXÉCUTER AVANT QUE TOUS LES TESTS PRÉCÉDENTS SOIENT ✅

### Préparation
- [ ] **51.** Ouvrir 3 écrans :
  1. Mobile (utilisateur) → Frontend `/tarifs`
  2. Desktop → Supabase SQL Editor
  3. Desktop → Render Logs (temps réel)
- [ ] **52.** Se connecter avec un compte utilisateur Firebase **NON ADMIN**
- [ ] **53.** Vérifier solde Mobile Money : au moins 15 500 FCFA disponibles

### Exécution
- [ ] **54.** Mobile → Cliquer **"Souscrire Premium"**
- [ ] **55.** `/subscription` → Cliquer **"Passer au Plan Premium"**
- [ ] **56.** Vérifier redirection vers Money Fusion
- [ ] **57.** Noter la référence affichée : `WKB-PRE-XXXXX-YYYY`
- [ ] **58.** Supabase → Vérifier création `PaymentTransaction` (status=PENDING)
- [ ] **59.** Mobile → Compléter le paiement Mobile Money (15 000 FCFA)
- [ ] **60.** Attendre confirmation Money Fusion

### Vérification Callback (< 30 secondes)
- [ ] **61.** Render Logs → Vérifier callback reçu : `POST /api/payment/callback`
- [ ] **62.** Render Logs → Vérifier `[WEBHOOK_SECURITY] Signature HMAC validée`
- [ ] **63.** Supabase → Vérifier `PaymentTransaction.status = SUCCESS`
- [ ] **64.** Supabase → Vérifier `Subscription` créée :
  - `status = ACTIVE`
  - `plan = PREMIUM`
  - `endDate = today + 30 jours`
- [ ] **65.** Supabase → Vérifier `WebhookEvent` :
  - `hmacValidated = true`
  - `ipValidated = true`
  - `replayChecked = true`
  - `success = true`

### Vérification Frontend
- [ ] **66.** Mobile → Vérifier redirection `/payment/success?ref=...&status=SUCCESS`
- [ ] **67.** Mobile → Vérifier message "Abonnement Activé"
- [ ] **68.** Mobile → Attendre countdown 8s → redirection `/subscription`
- [ ] **69.** `/subscription` → Vérifier badge **● Actif**
- [ ] **70.** `/subscription` → Vérifier affichage **Plan Premium**
- [ ] **71.** `/subscription` → Vérifier date d'expiration (aujourd'hui + 30j)

### Vérification Dashboard Admin
- [ ] **72.** Se connecter en tant qu'ADMIN sur `/admin`
- [ ] **73.** Onglet **Transactions** :
  - Affiche la transaction
  - Montant : 15 000 FCFA
  - Plan : PREMIUM
  - Statut : SUCCESS
  - Utilisateur correct
- [ ] **74.** Onglet **Webhooks** :
  - Affiche le webhook
  - eventType = PAYMENT_SUCCESS
  - delivery = DELIVERED
  - Flags verts : hmacValidated, ipValidated, replayChecked
  - Expand JSON : payload cohérent
- [ ] **75.** Onglet **Audit Logs** :
  - Affiche 1-2 entrées
  - actionType = PAYMENT_VALIDATION
  - Expand JSON : référence + montant corrects

---

## 📊 MONITORING POST-GO-LIVE (24h)

### Métriques à Surveiller
- [ ] **76.** Health check toutes les 5 min : `curl https://<RENDER_URL>/health`
- [ ] **77.** Uptime Render : doit rester 100%
- [ ] **78.** Logs erreurs : aucune erreur P1001 (BDD) ou JWT
- [ ] **79.** Callbacks rejetés : `WebhookEvent.success=false` < 5%
- [ ] **80.** Transactions bloquées : aucune PENDING > 10 minutes

### Alertes à Configurer (Optionnel)
- [ ] **81.** Slack/Email : erreur critique webhook (HMAC invalide)
- [ ] **82.** Slack/Email : transaction PENDING > 10 min
- [ ] **83.** Slack/Email : downtime Render > 1 min
- [ ] **84.** Slack/Email : erreur BDD Prisma

---

## 🎉 FINALISATION

### Documentation
- [ ] **85.** Documenter l'URL finale Render dans wiki/Confluence
- [ ] **86.** Documenter les variables Render (sans valeurs secrètes)
- [ ] **87.** Archiver les logs du premier paiement réel
- [ ] **88.** Créer runbook "Incident Paiement Bloqué"

### Formation Équipe
- [ ] **89.** Former équipe support sur procédure paiement
- [ ] **90.** Former équipe support sur Dashboard Admin
- [ ] **91.** Former équipe support sur lecture logs Render
- [ ] **92.** Partager checklist debugging paiement bloqué

### Communication
- [ ] **93.** Annoncer Go-Live à l'équipe
- [ ] **94.** Annoncer Go-Live aux utilisateurs (si pertinent)
- [ ] **95.** Préparer FAQ paiement pour utilisateurs
- [ ] **96.** Préparer message support "Paiement en attente"

---

## 📝 NOTES & INCIDENTS

**Date :** _____________  
**Incident/Note :** _______________________________________________  
**Résolution :** _______________________________________________

**Date :** _____________  
**Incident/Note :** _______________________________________________  
**Résolution :** _______________________________________________

**Date :** _____________  
**Incident/Note :** _______________________________________________  
**Résolution :** _______________________________________________

---

## ✅ VALIDATION FINALE

- [ ] **Tous les blockers résolus** (5/5)
- [ ] **Tous les tests réussis** (sandbox + callback manuel)
- [ ] **Premier paiement réel effectué** (15 000 FCFA)
- [ ] **Dashboard Admin fonctionnel** (3 sections affichent données)
- [ ] **Documentation à jour**
- [ ] **Équipe formée**

**Signature Responsable :** _____________  
**Date Go-Live :** _____________  
**Statut Final :** 🟢 PRODUCTION LIVE

---

**Dernière mise à jour :** 2026-08-07  
**Version :** 1.0  
**Contact :** zidadesire20@gmail.com
