# Guide d'Intégration Payment Service - Wend-Kabré

## 📋 Vue d'ensemble

Ce document décrit l'intégration complète entre le frontend Wend-Kabré (Vercel) et le microservice de paiement (Render + Money Fusion).

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  Money Fusion   │──────│  Frontend        │──────│  Payment        │
│  Gateway        │      │  (Vercel)        │      │  Service        │
│                 │      │                  │      │  (Render)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
       │                         │                          │
       │  1. Redirect            │  2. Callback             │
       │     Payment             │     Relay                │  3. Webhook
       │                         │                          │     Updates
       │                         │                          │
       └─────────────────────────┴──────────────────────────┘
```

---

## 🔑 URLs Clés

### **Frontend (Vercel)**
- Production: `https://wend-kabre-bf.vercel.app`
- Route callback: `https://wend-kabre-bf.vercel.app/api/payment/callback`
- Page succès: `https://wend-kabre-bf.vercel.app/payment/success`
- Page annulation: `https://wend-kabre-bf.vercel.app/payment/cancel`

### **Backend Payment Service (Render)**
- Production: `https://payment-service-1-sex9.onrender.com`
- Health check: `https://payment-service-1-sex9.onrender.com/health`
- Webhook Money Fusion: `https://payment-service-1-sex9.onrender.com/webhooks/money-fusion`
- API callback return: `https://payment-service-1-sex9.onrender.com/api/payment/return`

### **Money Fusion Dashboard**
- Configuration: https://dashboard.moneyfusion.net/
- Application: WEND-KABRE (statut: En attente d'approbation)

---

## 🔄 Flux de Paiement

### **Étape 1 : Initialisation du paiement**
```typescript
// Frontend appelle le backend via PaymentServiceClient
const result = await paymentServiceClient.createPayment({
  userId: 'user123',
  email: 'user@example.com',
  phone: '+22670123456',
  amount: 10000, // 10,000 FCFA
  planId: 'PREMIUM'
});

// Backend génère une session Money Fusion et retourne une URL
// result.paymentUrl = "https://pay.moneyfusion.net/checkout/xxx"
```

### **Étape 2 : Redirection vers Money Fusion**
```typescript
// Frontend redirige l'utilisateur vers Money Fusion
window.location.href = result.paymentUrl;

// L'utilisateur paie via Orange Money, Moov Money, etc.
```

### **Étape 3 : Callback après paiement**
```
Money Fusion redirige vers:
https://wend-kabre-bf.vercel.app/api/payment/callback?ref=TX123&status=SUCCESS

↓

Frontend relay vers backend:
https://payment-service-1-sex9.onrender.com/api/payment/return?ref=TX123&status=SUCCESS

↓

Backend met à jour la BDD (transaction + subscription)

↓

Frontend redirige l'utilisateur:
https://wend-kabre-bf.vercel.app/payment/success?ref=TX123&status=SUCCESS
```

### **Étape 4 : Webhook (asynchrone)**
```
Money Fusion envoie un webhook POST vers:
https://payment-service-1-sex9.onrender.com/webhooks/money-fusion

Payload: {
  "event": "payment.success",
  "transaction_id": "TX123",
  "amount": 10000,
  "status": "completed"
}

↓

Backend vérifie la signature HMAC
Backend met à jour définitivement la transaction
Backend envoie une notification email (optionnel)
```

---

## 📁 Fichiers Modifiés/Créés

### **Frontend (Vercel)**

#### **1. `src/lib/paymentServiceClient.ts`** ✅ Corrigé
```typescript
const PAYMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 
  process.env.PAYMENT_SERVICE_URL || 
  'https://payment-service-1-sex9.onrender.com';
```

#### **2. `src/app/api/payment/callback/route.ts`** ✅ Créé
Route API Next.js qui:
- Reçoit les callbacks Money Fusion
- Forward vers le backend Render
- Redirige l'utilisateur vers success/cancel

#### **3. `.env.production`** ✅ Mis à jour
```env
PAYMENT_SERVICE_URL=https://payment-service-1-sex9.onrender.com
NEXT_PUBLIC_PAYMENT_SERVICE_URL=https://payment-service-1-sex9.onrender.com
```

#### **4. Pages existantes** (déjà en place)
- `src/app/payment/success/page.tsx`
- `src/app/payment/cancel/page.tsx`

---

### **Backend (Render)**

#### **Déjà en place:**
- `src/app.ts` - Configuration Express avec CORS, rate limiting
- `src/routes/payment.routes.ts` - Routes `/api/payment/*`
- `src/controllers/payment.controller.ts` - Logique métier
- `src/services/payment.service.ts` - Interactions Money Fusion
- `src/services/webhook.service.ts` - Traitement webhooks
- `prisma/schema.prisma` - Schéma BDD (Transaction, Subscription)

---

## ⚙️ Variables d'Environnement

### **Frontend Vercel**

À configurer dans **Vercel Dashboard → Settings → Environment Variables** :

```env
# Payment Service
PAYMENT_SERVICE_URL=https://payment-service-1-sex9.onrender.com
NEXT_PUBLIC_PAYMENT_SERVICE_URL=https://payment-service-1-sex9.onrender.com

# App URL (pour génération de liens)
NEXT_PUBLIC_APP_URL=https://wend-kabre-bf.vercel.app
```

### **Backend Render**

Déjà configuré dans **Render Dashboard → Environment** :

```env
# Database
DATABASE_URL=postgresql://payment_service_db_7n68_user:xxx@dpg-xxx-a/payment_service_db_7n68

# Security
JWT_SECRET=b98b73ff8cc1a94698463263430709aaa7a54a94df9779c8ef1b67fd742c46f5

# Money Fusion (À METTRE À JOUR avec vraies valeurs)
MONEY_FUSION_TOKEN=temp_placeholder
MONEY_FUSION_API_KEY=temp_placeholder
MONEY_FUSION_WEBHOOK_SECRET=temp_placeholder

# URLs
APP_URL=https://wend-kabre-bf.vercel.app
RENDER_EXTERNAL_URL=https://payment-service-1-sex9.onrender.com

# Config
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://wend-kabre-bf.vercel.app
```

---

## 🔧 Configuration Money Fusion

### **Dashboard Money Fusion - Application WEND-KABRE**

| Champ | Valeur |
|-------|--------|
| **Nom de votre site/App** | `wend-kabre` |
| **Adresse site/application** | `https://wend-kabre-bf.vercel.app/` |
| **URL de redirection après paiement** | `https://wend-kabre-bf.vercel.app/api/payment/callback` |
| **Adresse IP 1** | `216.24.57.1` |
| **Adresse IP 2** | `216.24.57.7` |

### **Webhook Configuration (Section Développeurs)**

| Champ | Valeur |
|-------|--------|
| **Webhook URL** | `https://payment-service-1-sex9.onrender.com/webhooks/money-fusion` |
| **Events** | `payment.success`, `payment.failed`, `payment.pending` |
| **Secret** | Généré par Money Fusion (à copier dans Render) |

---

## ✅ Checklist Déploiement

### **Frontend Vercel**
- [x] `paymentServiceClient.ts` corrigé avec bonne URL
- [x] Route callback créée (`/api/payment/callback`)
- [x] Variables d'environnement `.env.production` ajoutées
- [ ] Variables d'environnement Vercel Dashboard configurées
- [ ] Code committé et pushé sur GitHub
- [ ] Déploiement Vercel automatique réussi

### **Backend Render**
- [x] Service déployé et opérationnel
- [x] Database PostgreSQL connectée
- [x] Health check fonctionnel
- [x] Trust proxy configuré
- [ ] Credentials Money Fusion réels configurés
- [ ] Test de paiement end-to-end

### **Money Fusion**
- [x] Application WEND-KABRE créée
- [ ] Application approuvée (statut: En attente)
- [ ] Credentials récupérés (API Key, Webhook Secret)
- [ ] URL webhook configurée
- [ ] Test de paiement en mode sandbox

---

## 🧪 Tests à Effectuer

### **Test 1 : Health Check Backend**
```bash
curl https://payment-service-1-sex9.onrender.com/health
```
**Résultat attendu:**
```json
{
  "status": "OK",
  "uptime": 123.45,
  "environment": "production",
  "timestamp": "2026-08-08T12:00:00.000Z"
}
```

### **Test 2 : Callback Route Frontend**
```bash
curl https://wend-kabre-bf.vercel.app/api/payment/callback?ref=TEST123&status=SUCCESS
```
**Résultat attendu:** Redirection 302 vers `/payment/success?ref=TEST123&status=SUCCESS`

### **Test 3 : Création Paiement (après credentials)**
```typescript
// À tester depuis l'interface frontend
const result = await paymentServiceClient.createPayment({
  userId: 'test_user',
  email: 'test@example.com',
  amount: 1000,
  planId: 'PREMIUM'
});

console.log(result.paymentUrl); // URL Money Fusion
```

### **Test 4 : Webhook Simulation**
```bash
# À faire depuis le Dashboard Money Fusion (bouton "Test Webhook")
# Ou avec curl + signature HMAC
```

---

## 🐛 Troubleshooting

### **Problème: "CORS error" lors de l'appel au payment service**

**Solution:** Vérifier que `CORS_ORIGIN` dans Render inclut `https://wend-kabre-bf.vercel.app`

### **Problème: "Cannot find payment service"**

**Solution:** Vérifier les variables d'environnement Vercel:
```bash
vercel env ls
```

### **Problème: "Money Fusion callback failed"**

**Solution:** Vérifier les logs Render:
```bash
# Render Dashboard → Service → Logs
```

### **Problème: "Webhook signature invalid"**

**Solution:** Vérifier que `MONEY_FUSION_WEBHOOK_SECRET` dans Render correspond à celui de Money Fusion Dashboard.

---

## 📞 Support

- **Backend logs:** Render Dashboard → payment-service-1 → Logs
- **Frontend logs:** Vercel Dashboard → wend-kabre-bf → Deployments → Logs
- **Money Fusion support:** Dashboard chat ou email support

---

## 📝 Prochaines Étapes

1. **Obtenir les credentials Money Fusion** (API Key, Webhook Secret)
2. **Mettre à jour les variables Render** avec les vraies valeurs
3. **Configurer les variables Vercel** (PAYMENT_SERVICE_URL)
4. **Tester un paiement complet** en mode sandbox
5. **Basculer en production** une fois validé

---

**Dernière mise à jour:** 2026-08-08  
**Version:** 1.0.0  
**Auteur:** Équipe Wend-Kabré
