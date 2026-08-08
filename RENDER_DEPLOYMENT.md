# 🚀 Déploiement Production Render — Wend-Kabré SaaS (2 Services + PostgreSQL)

## 🏗️ Architecture Finale de Production

```
                 ┌─────────────────────────────┐
                 │     wend-kabre.com          │  (CDN + Next.js SSR)
                 │  Service 1 : wend-kabre-app │
                 └─────────────┬───────────────┘
                               │ HTTPS /api/subscription/*
                               ▼
┌──────────────────────────────┐    ┌─────────────────────────────────────┐
│   payment.wend-kabre.com     │◄───│ Money Fusion Gateway (Callback)     │
│ Service 2 : payment-service  │    └─────────────────────────────────────┘
└─────────────┬────────────────┘
              │ Prisma
              ▼
     ┌────────────────────┐
     │ PostgreSQL Managed │  wendkabre-db
     └────────────────────┘
```

---

## 🗄️ Étape 0 — Prérequis

- Compte Render.com (gratuit acceptable, plan Starter recommandé)
- Dépôt Git connecté (GitHub / GitLab)
- Compte marchand Money Fusion actif
- Nom de domaine (optionnel au début, Render fournit un *.onrender.com gratuit)

---

## 📦 Étape 1 — Création Base PostgreSQL (Réutilisable par les 2 services si 1 BDD, ou séparée)

### Option A : Base unique pour Backend + Paiement (recommandé pour starter)
1. Render → **New +** → **PostgreSQL**
2. **Nom**: `wendkabre-db`
3. **Database**: `wend_kabre`
4. **User**: `wend_kabre_user`
5. **Region**: Frankfurt (EU Central)
6. **Plan**: Free (développement) → Starter (production réelle)
7. Copier **Internal Database URL** pour l'étape suivante.

### Option B : BDD séparées (pour isoler les données paiement)
- BDD 1: `wendkabre-main-db` → Wend-Kabré Next.js
- BDD 2: `wendkabre-payment-db` → Payment Service (actuellement configurée comme ça dans le schema Prisma)

---

## 🛠️ Étape 2 — Service 2 : payment-service (Node / Express)

1. Render → **New +** → **Web Service**
2. Sélectionner votre dépôt Git, puis dossier racine **`payment-service/`**
3. **Nom**: `payment-service-wendkabre`
4. **Region**: Frankfurt (même région que PostgreSQL → latence interne)
5. **Environment**: Node
6. **Build Command**:
   ```bash
   npm install && npm run build && npx prisma migrate deploy
   ```
7. **Start Command**:
   ```bash
   npm start
   ```
8. **Plan**: Free → Starter
9. **Variables d'environnement** (onglet Environment):

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `RENDER_EXTERNAL_URL` | `https://payment-service-wendkabre.onrender.com` (ou `https://payment.wend-kabre.com` si domaine perso) |
| `DATABASE_URL` | Internal Database URL de `wendkabre-payment-db` |
| `JWT_SECRET` | Générer avec: `openssl rand -base64 48` |
| `MONEY_FUSION_API_URL` | `https://api.moneyfusion.net/v1` |
| `MONEY_FUSION_TOKEN` | Token production Money Fusion |
| `MONEY_FUSION_API_KEY` | API Key production Money Fusion |
| `MONEY_FUSION_WEBHOOK_SECRET` | Secret webhook à reporter aussi chez Money Fusion |
| `PAYMENT_CURRENCY` | `XOF` |
| `MONEY_FUSION_ALLOWED_IPS` | IPs Money Fusion (optionnel) |

10. **Créer le service** → Attendre le build & la migration Prisma automatique
11. Vérifier: `https://payment-service-wendkabre.onrender.com/health` → `{"status":"OK"}`

---

## 🌐 Étape 3 — Service 1 : wend-kabre-app (Next.js 16 App Router)

1. Render → **New +** → **Web Service**
2. Sélectionner le même dépôt, dossier racine **`/`**
3. **Nom**: `wend-kabre-app`
4. **Environment**: Node
5. **Build Command**:
   ```bash
   npm install && npm run build
   ```
6. **Start Command**:
   ```bash
   npm start
   ```
7. **Plan**: Starter (Next.js a besoin de + de RAM que le Free Tier en production)
8. **Variables d'environnement**:

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://wend-kabre-app.onrender.com` → `https://wend-kabre.com` |
| `PAYMENT_SERVICE_URL` | `https://payment-service-wendkabre.onrender.com` → `https://payment.wend-kabre.com` |
| `DATABASE_URL` | (Si Next.js utilise direct PostgreSQL, sinon laisser Firestore) |
| `JWT_SECRET` | MÊME VALEUR que payment-service (signer tokens admin compatibles) |
| Variables Firebase + Email + Scraper | Voir `.env.production.example` |

9. **Créer le service** → Attendre le build
10. Vérifier: `https://wend-kabre-app.onrender.com` → accueil OK

---

## 🔔 Étape 4 — Configuration Webhook chez Money Fusion

1. Espace Marchand Money Fusion → **Webhooks**
2. **Callback URL (Notification de paiement)** :
   ```
   https://payment-service-wendkabre.onrender.com/api/payment/callback
   ```
3. **Return URL (Redirection utilisateur après paiement)** :
   ```
   https://payment-service-wendkabre.onrender.com/api/payment/return
   ```
   *(Cette URL redirige automatiquement vers /payment/success ou /payment/cancel du frontend)*
4. **Webhook Secret**: Mettre EXACTEMENT la même valeur que `MONEY_FUSION_WEBHOOK_SECRET` dans Render
5. **Événements activés**: `PAYMENT.SUCCESS`, `PAYMENT.FAILED`, `PAYMENT.CANCELLED`

---

## 🌍 Étape 5 — Domaines Personnalisés Production

### 1. Application principale : `wend-kabre.com`
- Render → service `wend-kabre-app` → onglet **Custom Domains** → Add `wend-kabre.com` + `www.wend-kabre.com`
- Chez votre registrar (Gandi, Namecheap, etc.):
  ```
  wend-kabre.com      A     → IP Render indiquée
  www                 CNAME → wend-kabre-app.onrender.com
  ```
- Mettre à jour `NEXT_PUBLIC_APP_URL=https://wend-kabre.com`

### 2. Payment Service : `payment.wend-kabre.com`
- Render → service `payment-service-wendkabre` → Add `payment.wend-kabre.com`
- DNS:
  ```
  payment             CNAME → payment-service-wendkabre.onrender.com
  ```
- Mettre à jour les variables:
  | Service | Variable | Valeur |
  |---|---|---|
  | Payment Service | `RENDER_EXTERNAL_URL` | `https://payment.wend-kabre.com` |
  | Wend-Kabré App | `PAYMENT_SERVICE_URL` | `https://payment.wend-kabre.com` |
  | Money Fusion Webhook | Callback | `https://payment.wend-kabre.com/api/payment/callback` |

### 3. (Optionnel) API dédiée : `api.wend-kabre.com`
- Si vous souhaitez découpler, ajouter un domaine et des rewrites.

---

## ✅ Étape 6 — Tests Post-Deploy

Voir `PRODUCTION_AUDIT.md` et la checklist `Étape 8` du livrable final.

---

## 📜 Étape 7 — Migration Prisma Automatique (Fichier render.yaml)

Le déploiement Blueprints est possible avec un `render.yaml` à la racine.
Le format complet est fourni dans `payment-service/render.yaml` + extension.

---

## 💰 Estimation des coûts Render (Starter)

| Service | Plan | Prix/mois |
|---|---|---|
| wend-kabre-app (Next.js) | Starter 512MB / 0.5 CPU | ~7 € |
| payment-service (Express) | Free → Starter 512MB si traffic | 0 → ~7 € |
| PostgreSQL | Free → Starter 1GB storage | 0 → ~7 € |
| **Total** | | **0 € (Free) → 21 € (Starter)** |

---

## 🔁 Rollback en cas d'échec

- Render retient automatiquement les builds précédents.
- Bouton **Manual Deploy → Deploy Last Successful Commit** sur chaque service.
- Pour la BDD: onglet **Backups** → Restore Point-in-Time.
