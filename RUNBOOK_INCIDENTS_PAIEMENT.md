# 🚨 RUNBOOK — INCIDENTS PAIEMENT WEND-KABRÉ

**Version :** 1.0  
**Date :** 2026-08-07  
**Public :** Équipe Support / Dev / Ops

---

## 🎯 OBJECTIF

Ce document liste les incidents paiement les plus fréquents et leurs procédures de résolution étape par étape.

---

## 📞 CONTACTS URGENCE

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| Dev Lead | zidadesire20@gmail.com | 24/7 |
| Money Fusion Support | [À compléter] | Heures bureau |
| Supabase Support | support@supabase.com | Email |
| Render Support | support@render.com | Email |

---

## 🔥 INCIDENT #1 — Paiement Bloqué en PENDING

### Symptômes
- L'utilisateur a payé via Mobile Money
- Money Fusion confirme paiement réussi
- **MAIS** : Transaction reste `status = PENDING` dans BDD Supabase
- Dashboard Admin n'affiche pas le paiement

### Causes Probables
1. ❌ Callback Money Fusion non reçu par Render
2. ❌ Callback reçu mais rejeté (HMAC invalide)
3. ❌ Callback reçu mais erreur lors du traitement

### Procédure Diagnostic (5 min)

#### Étape 1 : Vérifier logs Render
```bash
# Ouvrir Render Dashboard → payment-service → Logs
# Rechercher la référence : WKB-PRE-XXXXX-YYYY
```

**Si aucun log contenant la référence :**
→ **Cause : Callback non reçu** → Aller à **Résolution A**

**Si logs montrent :**
```
[WEBHOOK_SECURITY] Échec validation HMAC. Fournie: abc123...
```
→ **Cause : HMAC invalide** → Aller à **Résolution B**

**Si logs montrent :**
```
ERROR: Erreur lors de la mise à jour transaction: P2025 Record not found
```
→ **Cause : Transaction introuvable BDD** → Aller à **Résolution C**

---

### RÉSOLUTION A — Callback Non Reçu

**Vérifications :**

1. **URL Callback enregistrée chez Money Fusion ?**
   ```
   Dashboard MF → Webhooks → Vérifier URL callback
   Attendu : https://<RENDER_URL>/api/payment/callback
   ```
   - ❌ Si absente ou incorrecte : **Corriger + Demander renvoi callback MF**

2. **Service Render UP ?**
   ```bash
   curl https://<RENDER_URL>/health
   ```
   - ❌ Si erreur : **Restart Render service**

3. **Firewall/Proxy bloque Money Fusion ?**
   - Vérifier `MONEY_FUSION_ALLOWED_IPS` si configuré
   - Désactiver temporairement pour test

**Action Manuelle — Forcer Mise à Jour Transaction :**

```sql
-- Se connecter Supabase SQL Editor
UPDATE "PaymentTransaction"
SET 
  status = 'SUCCESS',
  "updatedAt" = NOW()
WHERE reference = 'WKB-PRE-XXXXX-YYYY';

-- Créer/Activer Subscription
INSERT INTO "Subscription" (
  "userId", plan, status, "startDate", "endDate", "createdAt", "updatedAt"
)
VALUES (
  '<userId_de_la_transaction>',
  'PREMIUM',
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
)
ON CONFLICT ("userId")
DO UPDATE SET
  plan = 'PREMIUM',
  status = 'ACTIVE',
  "endDate" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW();
```

**⚠️ IMPORTANT :** Créer un AuditLog manuel :
```sql
INSERT INTO "AuditLog" (
  "userId", "actionType", details, "createdAt"
)
VALUES (
  '<userId>',
  'MANUAL_PAYMENT_CORRECTION',
  '{"reference": "WKB-PRE-XXXXX", "reason": "Callback MF non reçu", "operator": "support@wend-kabre.com"}',
  NOW()
);
```

**Synchroniser Firebase :**
```bash
# Via Firebase Console ou script
# Mettre à jour /users/{uid}
{
  "isSubscribed": true,
  "subscriptionPlan": "PREMIUM",
  "subscriptionExpiresAt": <timestamp_+30j>
}
```

---

### RÉSOLUTION B — HMAC Invalide

**Cause :** Secret webhook mal configuré ou Money Fusion a changé algo

**Vérifications :**

1. **Secret correct dans Render ?**
   ```
   Render → payment-service → Environment → MONEY_FUSION_WEBHOOK_SECRET
   ```
   - Comparer avec Dashboard Money Fusion → Webhooks → Secret
   - ❌ Si différent : **Corriger + Redéployer**

2. **Header signature correct ?**
   ```
   Logs Render : chercher "x-moneyfusion-signature" ou "x-webhook-signature"
   ```
   - Vérifier que Money Fusion envoie bien le header

3. **Tester HMAC manuellement :**
   ```bash
   # Récupérer rawBody du callback dans logs Render
   BODY='{"status":"SUCCESS","reference":"WKB-XXX","amount":15000}'
   SECRET='<MONEY_FUSION_WEBHOOK_SECRET>'
   
   # SHA256 HEX
   echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET"
   
   # SHA256 Base64
   echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64
   ```
   - Comparer avec signature fournie par MF dans logs
   - ❌ Si ne matche pas : **Contacter Money Fusion Support**

**Action si Secret Confirmé Correct :**
- Demander à Money Fusion de **renvoyer le callback**
- OU appliquer **Résolution A** (mise à jour manuelle)

---

### RÉSOLUTION C — Transaction Introuvable BDD

**Cause :** Transaction jamais créée OU référence incorrecte dans callback

**Vérifications :**

1. **Transaction existe dans Supabase ?**
   ```sql
   SELECT * FROM "PaymentTransaction"
   WHERE reference = 'WKB-PRE-XXXXX-YYYY';
   ```
   - ❌ Si 0 résultat : **Transaction jamais créée**

2. **Vérifier payload callback Money Fusion :**
   ```
   Logs Render : chercher rawBody callback
   Vérifier champs : reference, customRef, order_ref, ref
   ```
   - ❌ Si champ vide/manquant : **Bug Money Fusion**
   - ❌ Si référence différente : **Mapping incorrect**

**Action si Transaction Manquante :**

```sql
-- Créer manuellement la transaction
INSERT INTO "PaymentTransaction" (
  "userId", reference, amount, currency, status, "planId", "createdAt", "updatedAt"
)
VALUES (
  '<userId_utilisateur>',
  'WKB-PRE-XXXXX-YYYY',
  15000,
  'XOF',
  'SUCCESS',
  'PREMIUM',
  NOW() - INTERVAL '10 minutes',
  NOW()
);
```

Puis appliquer **Résolution A** (subscription + audit log + Firebase).

---

## 🔥 INCIDENT #2 — Callback Refusé (HTTP 401)

### Symptômes
- Logs Money Fusion : HTTP 401 Unauthorized
- Render Logs : `[WEBHOOK_SECURITY] ALERTE CRITIQUE: MONEY_FUSION_WEBHOOK_SECRET non configuré`

### Cause
- ❌ `MONEY_FUSION_WEBHOOK_SECRET` absent ou incorrect en production

### Résolution (2 min)

1. **Vérifier Render Env Vars :**
   ```
   Render → payment-service → Environment → MONEY_FUSION_WEBHOOK_SECRET
   ```

2. **Si absent :**
   ```
   Récupérer depuis Dashboard MF → Webhooks → Secret
   Ajouter dans Render → MONEY_FUSION_WEBHOOK_SECRET=<valeur>
   Sauvegarder + Redéployer
   ```

3. **Si présent mais invalide :**
   ```
   Régénérer dans Dashboard MF
   Mettre à jour Render
   Redéployer
   Demander renvoi callback MF
   ```

---

## 🔥 INCIDENT #3 — Double Paiement (Transaction Dupliquée)

### Symptômes
- Utilisateur débité 2 fois (30 000 FCFA au lieu de 15 000)
- BDD Supabase : 2 transactions SUCCESS avec références différentes

### Cause Probable
- Utilisateur a cliqué 2 fois "Passer au Premium"
- OU erreur frontend (double appel `/api/subscription/checkout`)

### Prévention
✅ **Code actuel prévient cela :**
```typescript
// payment-service/src/services/payment.service.ts
// Vérifie si userId a déjà un abonnement ACTIVE avant création transaction
```

### Résolution

1. **Identifier la transaction légitime :**
   ```sql
   SELECT * FROM "PaymentTransaction"
   WHERE "userId" = '<uid>'
     AND status = 'SUCCESS'
     AND "planId" = 'PREMIUM'
   ORDER BY "createdAt" ASC;
   ```
   - Prendre la **plus ancienne** (1er paiement)

2. **Annuler la transaction dupliquée :**
   ```sql
   UPDATE "PaymentTransaction"
   SET status = 'REFUNDED'
   WHERE reference = '<reference_duplicate>';
   ```

3. **Contacter Money Fusion :**
   - Demander remboursement du 2e paiement
   - Fournir les 2 références

4. **Audit Log :**
   ```sql
   INSERT INTO "AuditLog" (
     "userId", "actionType", details, "createdAt"
   )
   VALUES (
     '<userId>',
     'REFUND_DUPLICATE_PAYMENT',
     '{"references": ["WKB-XXX-1", "WKB-XXX-2"], "refunded": "WKB-XXX-2"}',
     NOW()
   );
   ```

---

## 🔥 INCIDENT #4 — Abonnement Non Activé (Paiement SUCCESS)

### Symptômes
- Transaction `status = SUCCESS` dans BDD
- **MAIS** : `Subscription.status = PENDING` OU pas de subscription
- Frontend `/subscription` affiche "Aucun abonnement"

### Cause Probable
- Erreur dans `SubscriptionService.activateSubscription()`
- Erreur Firebase sync

### Résolution

1. **Vérifier Subscription BDD :**
   ```sql
   SELECT * FROM "Subscription"
   WHERE "userId" = '<uid>';
   ```

2. **Si absente, créer :**
   ```sql
   INSERT INTO "Subscription" (
     "userId", plan, status, "startDate", "endDate", "createdAt", "updatedAt"
   )
   VALUES (
     '<userId>',
     'PREMIUM',
     'ACTIVE',
     NOW(),
     NOW() + INTERVAL '30 days',
     NOW(),
     NOW()
   );
   ```

3. **Si présente mais status != ACTIVE :**
   ```sql
   UPDATE "Subscription"
   SET 
     status = 'ACTIVE',
     plan = 'PREMIUM',
     "endDate" = NOW() + INTERVAL '30 days',
     "updatedAt" = NOW()
   WHERE "userId" = '<uid>';
   ```

4. **Synchroniser Firebase :**
   ```
   Firebase Console → Firestore → users/{uid} → Éditer
   {
     "isSubscribed": true,
     "subscriptionPlan": "PREMIUM",
     "subscriptionExpiresAt": <Timestamp +30j>
   }
   ```

5. **Demander à l'utilisateur de rafraîchir `/subscription`**

---

## 🔥 INCIDENT #5 — Erreur BDD "Too Many Connections" (P1001)

### Symptômes
- Logs Render : `Prisma Error P1001: Can't reach database server`
- Ou : `Error: too many connections for role`

### Cause
- `DATABASE_URL` utilise connexion directe (port 5432) au lieu de pooled (port 6543)

### Résolution (5 min)

1. **Vérifier DATABASE_URL Render :**
   ```
   Render → payment-service → Environment → DATABASE_URL
   ```

2. **Si port 5432 (direct) :**
   ```
   Récupérer Supabase Pooled Connection String :
   Supabase Dashboard → Settings → Database → Connection Pooling
   
   Format attendu :
   postgres://...@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. **Remplacer DATABASE_URL :**
   ```
   Render → Environment → DATABASE_URL = <pooled_connection_string>
   Sauvegarder + Redéployer
   ```

4. **Vérifier DIRECT_URL (migrations seulement) :**
   ```
   DIRECT_URL = postgres://...supabase.com:5432/postgres (port 5432 OK)
   ```

---

## 🔥 INCIDENT #6 — Callback Replay Attack Bloqué

### Symptômes
- Logs Render : `[WEBHOOK_SECURITY] Attaque par rejeu détectée`
- HTTP 400 : "Notification webhook déjà traitée (Replay Attack bloquée)"

### Cause
- Money Fusion envoie le même callback 2 fois (retry automatique)
- OU attaquant tente replay attack

### Résolution

**Si callback légitime :**
1. **Vérifier transaction déjà SUCCESS :**
   ```sql
   SELECT status FROM "PaymentTransaction"
   WHERE reference = 'WKB-PRE-XXXXX';
   ```
   - ✅ Si déjà SUCCESS : **Ignorer, c'est normal** (idempotence fonctionne)

**Si callback légitime mais transaction toujours PENDING :**
1. **Supprimer nonce BDD :**
   ```sql
   DELETE FROM "ProcessedWebhook"
   WHERE reference = 'WKB-PRE-XXXXX';
   ```

2. **Demander renvoi callback Money Fusion**

3. **OU appliquer Résolution A** (mise à jour manuelle)

---

## 🔥 INCIDENT #7 — Dashboard Admin Vide (Aucune Transaction)

### Symptômes
- `/admin` s'ouvre correctement
- Onglet Transactions : "Aucune transaction trouvée"
- **MAIS** : BDD Supabase contient des transactions

### Cause Probable
- JWT token admin invalide/expiré
- Erreur API `/api/admin/payment/transactions`

### Résolution

1. **Vérifier JWT :**
   ```bash
   # Ouvrir DevTools → Network → Requête /api/admin/payment/transactions
   # Vérifier Header : Authorization: Bearer <token>
   ```
   - ❌ Si absent : **Utilisateur non connecté admin**
   - ❌ Si présent mais HTTP 401 : **Token expiré, reconnecter**

2. **Vérifier rôle utilisateur BDD :**
   ```sql
   SELECT role FROM "User"
   WHERE email = '<admin_email>';
   ```
   - ❌ Si role != 'ADMIN' : **Promouvoir en ADMIN**
   ```sql
   UPDATE "User"
   SET role = 'ADMIN'
   WHERE email = '<admin_email>';
   ```

3. **Tester API directement :**
   ```bash
   curl -H "Authorization: Bearer <JWT_TOKEN>" \
        https://<RENDER_URL>/api/admin/payment/transactions
   ```
   - ✅ Si retourne JSON : **Frontend problème, F5**
   - ❌ Si HTTP 403 : **Middleware requireAdmin bloque**

---

## 📊 COMMANDES UTILES DEBUG

### 1. Vérifier Health Service
```bash
curl https://<RENDER_URL>/health
```
**Attendu :** `{"status":"OK","timestamp":"...","service":"payment-service"}`

### 2. Lister Transactions PENDING > 10 min
```sql
SELECT reference, "userId", amount, "createdAt"
FROM "PaymentTransaction"
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '10 minutes'
ORDER BY "createdAt" DESC;
```

### 3. Vérifier Webhooks Rejetés (24h)
```sql
SELECT reference, "eventType", "errorMessage", "createdAt"
FROM "WebhookEvent"
WHERE success = false
  AND "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;
```

### 4. Lister Abonnements Actifs
```sql
SELECT u.email, s.plan, s."endDate"
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
WHERE s.status = 'ACTIVE'
ORDER BY s."endDate" DESC;
```

### 5. Audit Logs Paiement (Référence)
```sql
SELECT "actionType", details, "createdAt"
FROM "AuditLog"
WHERE details::text LIKE '%WKB-PRE-XXXXX%'
ORDER BY "createdAt" DESC;
```

---

## 🚨 ESCALADE

### Niveau 1 — Support (Incidents Courants)
- Paiement bloqué PENDING (Résolution A)
- Dashboard vide (Résolution 7)
- Abonnement non activé (Résolution 4)

### Niveau 2 — Dev (Incidents Techniques)
- HMAC invalide (Résolution B)
- Erreur BDD P1001 (Résolution 5)
- Double paiement (Résolution 3)

### Niveau 3 — Money Fusion (Problème Fournisseur)
- Callback jamais reçu après 30 min
- HMAC ne matche jamais malgré secret correct
- Paiement débité côté MF mais aucun callback
- Remboursement nécessaire

---

## 📞 MODÈLES MESSAGES SUPPORT

### Utilisateur — Paiement en Attente
```
Bonjour [Prénom],

Nous avons bien reçu votre paiement de 15 000 FCFA.
Votre abonnement PREMIUM est en cours d'activation (référence : [WKB-XXX]).

Délai habituel : 5 minutes maximum.
Si votre abonnement n'est pas activé dans 15 minutes, 
merci de nous contacter avec cette référence.

Cordialement,
Équipe Wend-Kabré
```

### Money Fusion — Callback Non Reçu
```
Objet : Callback Webhook Non Reçu - Référence [WKB-PRE-XXX]

Bonjour,

Nous n'avons pas reçu le callback webhook pour la transaction suivante :
- Référence : WKB-PRE-XXXXX-YYYY
- Montant : 15 000 FCFA
- Date paiement : [Date]
- Statut Money Fusion : [SUCCESS confirmé par utilisateur]

Notre URL callback : https://payment-service-wendkabre.onrender.com/api/payment/callback

Pouvez-vous :
1. Vérifier que cette URL est bien enregistrée
2. Consulter vos logs d'envoi webhook
3. Renvoyer le callback si nécessaire

Merci,
Équipe Technique Wend-Kabré
```

---

**Dernière mise à jour :** 2026-08-07  
**Version :** 1.0  
**Contact :** zidadesire20@gmail.com
