# 🔍 Guide de Debug - Erreur Paiement

## 🎯 Problème actuel
```
⚠️ Erreur de paiement
Échec de la communication avec le service de paiement
```

## 🚀 Solution rapide (TL;DR)

**Le problème** : Les credentials Money Fusion sur Render sont encore en `temp_placeholder`

**La solution** :
1. Attendre l'approbation de l'app "WEND-KABRE" sur Money Fusion Dashboard
2. Récupérer les vraies credentials (TOKEN, API_KEY, WEBHOOK_SECRET)
3. Les mettre dans Render Environment Variables
4. Render redéploiera automatiquement

---

## 🔧 Comment tester pendant l'attente ?

### Option 1 : Tester en mode développement local

Si tu veux tester le flow complet avant d'avoir les vraies credentials :

1. **Cloner le repo payment-service** localement
```bash
cd payment-service
npm install
```

2. **Créer un `.env` local** avec mode test
```bash
NODE_ENV=development
DATABASE_URL=postgresql://...
MONEY_FUSION_TOKEN=temp_placeholder
MONEY_FUSION_API_KEY=temp_placeholder
MONEY_FUSION_WEBHOOK_SECRET=temp_placeholder
# ... autres variables
```

3. **Lancer le service en local**
```bash
npm run dev
```

4. **Le provider utilisera le fallback sandbox** (ligne 71-80 de `MoneyFusionProvider.ts`)
```typescript
// En mode dev, si l'API échoue, un mock URL est retourné
const mockPaymentUrl = `https://pay.moneyfusion.net/checkout?ref=${params.reference}&token=${moneyFusionConfig.token}`;
```

⚠️ **Ce fallback n'est JAMAIS utilisé en production** pour des raisons de sécurité.

### Option 2 : Vérifier les logs Render en temps réel

Pour voir exactement pourquoi l'API Money Fusion rejette :

1. **Ouvrir les logs Render**
```
https://dashboard.render.com/web/srv-<ton-service-id>/logs
```

2. **Tester un paiement** depuis https://wend-kabre-bf.vercel.app/tarifs

3. **Observer les logs** en temps réel :

**Logs attendus en cas d'erreur credentials** :
```bash
[INFO] Initialisation du paiement Money Fusion pour la référence: WK-PAY-...
[DEBUG] Payload transmis à l'API Money Fusion: { totalPrice: 15000, ... }
[ERROR] Échec appel Money Fusion /payUrl (ref=WK-PAY-...)
[ERROR] [PRODUCTION] Échec appel Money Fusion /payUrl. Fallback sandbox INTERDIT.
[ERROR] Erreur lors de la création du paiement Money Fusion: Impossible d'initialiser...
```

**Logs attendus avec vraies credentials** :
```bash
[INFO] Initialisation du paiement Money Fusion pour la référence: WK-PAY-...
[DEBUG] Payload transmis à l'API Money Fusion: { totalPrice: 15000, ... }
[INFO] Réponse Money Fusion reçue: { url: "https://pay.moneyfusion.net/...", token: "..." }
[INFO] Transaction WK-PAY-... enregistrée en BDD avec statut PENDING
[INFO] [event=PAYMENT_CREATED] userId=... planId=PREMIUM amount=15000 ref=WK-PAY-...
```

### Option 3 : Tester manuellement l'API Payment Service

Tu peux appeler directement l'API Render avec `curl` ou Postman :

```bash
curl -X POST https://payment-service-1-sex9.onrender.com/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "email": "test@example.com",
    "phone": "+22670000000",
    "amount": 15000,
    "planId": "PREMIUM"
  }'
```

**Réponse attendue avec credentials invalides** :
```json
{
  "success": false,
  "error": "Impossible d'initialiser le paiement Money Fusion (erreur API: 401 Unauthorized)"
}
```

**Réponse attendue avec vraies credentials** :
```json
{
  "success": true,
  "paymentUrl": "https://pay.moneyfusion.net/checkout?ref=WK-PAY-...",
  "transactionId": "cm...",
  "reference": "WK-PAY-...",
  "message": "Lien de paiement généré avec succès"
}
```

---

## 📊 Checklist de diagnostic

### 1. Vérifier que le backend est bien déployé
```bash
curl https://payment-service-1-sex9.onrender.com/health
```

**Attendu** :
```json
{
  "status": "OK",
  "uptime": 123.45,
  "environment": "production",
  "timestamp": "2026-08-08T..."
}
```

### 2. Vérifier que la route `/api/payment/create` existe
```bash
curl https://payment-service-1-sex9.onrender.com/api/payment/create
```

**Attendu** : Erreur 400 (validation body manquant) = route existe ✓
```json
{
  "success": false,
  "error": "Champs requis manquants"
}
```

### 3. Vérifier les variables d'environnement Render

Se connecter au dashboard Render → Environment → Vérifier :

```bash
✅ DATABASE_URL = postgresql://...
✅ JWT_SECRET = b98b73ff8cc1a...
✅ NODE_ENV = production
✅ PORT = 10000
✅ APP_URL = https://wend-kabre-bf.vercel.app
✅ RENDER_EXTERNAL_URL = https://payment-service-1-sex9.onrender.com
✅ CORS_ORIGIN = https://wend-kabre-bf.vercel.app

❌ MONEY_FUSION_TOKEN = temp_placeholder  ← À REMPLACER
❌ MONEY_FUSION_API_KEY = temp_placeholder  ← À REMPLACER
❌ MONEY_FUSION_WEBHOOK_SECRET = temp_placeholder  ← À REMPLACER
```

### 4. Vérifier l'état de l'application Money Fusion

- Se connecter au Money Fusion Dashboard
- Chercher l'application "WEND-KABRE"
- Statut actuel : "⏳ En attente d'approbation"
- **Action** : Attendre approbation ou contacter support

### 5. Vérifier que les IPs Render sont whitelistées

Dans Money Fusion Dashboard → Application "WEND-KABRE" → IPs autorisées :

```
✅ 216.24.57.1
✅ 216.24.57.7
```

Ces IPs sont celles du service Render (déjà configurées lors de la création de l'app).

---

## 🐛 Erreurs courantes et solutions

### Erreur : "CORS: Origin not allowed"
**Cause** : Le frontend Vercel n'est pas dans la liste CORS du backend

**Solution** : Vérifier dans `payment-service/src/app.ts` ligne 16-25
```typescript
const corsAllowedOrigins = [
  'https://wend-kabre-bf.vercel.app',  // ← Doit être présent
  // ...
];
```

### Erreur : "Route non trouvée: [GET] /"
**Cause** : Render fait un health check sur `/` avec méthode HEAD

**Solution** : Déjà fixé dans `payment-service/src/app.ts` ligne 99-106
```typescript
app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ ... });
});
```

### Erreur : "Cannot set headers after they are sent"
**Cause** : Double `res.json()` dans le code

**Solution** : Déjà fixé - toutes les routes ont `return res.json()`

### Erreur : "Délai dépassé (timeout)"
**Cause** : L'API Money Fusion ne répond pas en moins de 15s

**Solution** : Augmenter le timeout dans `paymentServiceClient.ts` ligne 87
```typescript
timeout: 20000,  // 20s au lieu de 15s
```

---

## 📞 Support et contacts

### Money Fusion
- **Dashboard** : https://dashboard.moneyfusion.net
- **Support** : support@moneyfusion.net (ou contact fourni)
- **Documentation** : https://docs.moneyfusion.net

### Render
- **Dashboard** : https://dashboard.render.com
- **Service** : https://dashboard.render.com/web/srv-payment-service-1-sex9
- **Logs** : https://dashboard.render.com/web/srv-payment-service-1-sex9/logs

### Vercel
- **Dashboard** : https://vercel.com/dashboard
- **Project** : wend-kabre-bf

---

## ✅ Test de bout en bout (quand credentials OK)

1. **User visite** https://wend-kabre-bf.vercel.app/tarifs
2. **User clique** "Souscrire au Premium 🚀"
3. **Modal s'ouvre** avec design glassmorphism
4. **User clique** "Procéder au paiement sécurisé"
5. **Frontend appelle** `/api/subscription/checkout`
6. **Next.js API appelle** Render payment-service `/api/payment/create`
7. **Payment service appelle** Money Fusion API `/payUrl`
8. **Money Fusion retourne** `{ url: "https://pay.moneyfusion.net/..." }`
9. **Frontend redirige** vers Money Fusion payment page
10. **User paie** avec Orange Money / Moov Money / Carte
11. **Money Fusion webhook** appelle Render `/api/payment/callback`
12. **Payment service update** transaction status → SUCCESS
13. **Payment service redirige** user vers `/payment/success?ref=WK-PAY-...`
14. **User voit** page de succès avec confirmation

---

## 🎯 Résumé final

**Pourquoi ça ne marche pas maintenant ?**
- Les credentials Money Fusion sont invalides (`temp_placeholder`)
- L'API Money Fusion rejette les requêtes avec erreur 401 Unauthorized

**Que faire immédiatement ?**
1. Vérifier le statut de l'app Money Fusion (approuvée ou en attente)
2. Si approuvée → récupérer TOKEN, API_KEY, WEBHOOK_SECRET
3. Mettre à jour les variables Render
4. Tester un paiement

**Combien de temps ?**
- Mise à jour variables Render : 1 minute
- Redéploiement automatique Render : 2-3 minutes
- Test complet : 1 minute
- **Total : ~5 minutes** après obtention des credentials

---

**Date** : 8 août 2026  
**Version** : 1.0  
**Statut** : ⏳ En attente credentials Money Fusion
