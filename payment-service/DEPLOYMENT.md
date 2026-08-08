# 🚀 Guide de Déploiement en Production sur Render (Render Free Tier)

Ce guide détaille le processus pas à pas pour déployer le microservice de paiement autonome **`payment-service`** sur Render.

---

## 📋 Prérequis

1. Un compte sur [Render.com](https://render.com).
2. Un compte marchand actif chez **Money Fusion** avec accès au tableau de bord des clés d'API.
3. Le dépôt Git contenant le répertoire `payment-service/`.

---

## 🗄️ Étape 1 : Création de la Base de Données PostgreSQL sur Render

1. Connectez-vous sur le tableau de bord Render.
2. Cliquez sur **New +** -> **PostgreSQL**.
3. Renseignez les informations :
   - **Name** : `wendkabre-payment-db`
   - **Database** : `wend_kabre_payment`
   - **Region** : Frankfurt (EU Central)
   - **Plan** : Free
4. Cliquez sur **Create Database**.
5. Une fois la base provisionnée, copiez l'URL de connexion **Internal Database URL** ou **External Database URL**.

---

## 🌐 Étape 2 : Déploiement Automatique via Render Blueprint

 render.yaml à la racine de `payment-service/` configure automatiquement tous les services.

1. Sur le tableau de bord Render, cliquez sur **New +** -> **Blueprint**.
2. Connectez votre dépôt GitHub / GitLab.
3. Indiquez le chemin vers le fichier `render.yaml` : `payment-service/render.yaml`.
4. Render va détecter :
   - Le Web Service Node.js (`payment-service-wendkabre`)
   - La base de données PostgreSQL associée.

---

## 🔑 Étape 3 : Configuration des Variables d'Environnement Production

Dans les paramètres du service web `payment-service-wendkabre` sur Render -> **Environment**, configurez les clés suivantes :

| Clé | Valeur | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Mode de production |
| `PORT` | `10000` | Port d'écoute Render |
| `RENDER_EXTERNAL_URL` | `https://payment-service-wendkabre.onrender.com` | URL publique du service |
| `DATABASE_URL` | `postgresql://...` | Chaîne de connexion PostgreSQL Render |
| `JWT_SECRET` | `<votre_cle_secrete_production>` | Clé secrète de signature des jetons JWT |
| `MONEY_FUSION_API_URL` | `https://api.moneyfusion.net/v1` | URL officielle de l'API Money Fusion |
| `MONEY_FUSION_TOKEN` | `<votre_token_money_fusion>` | Jeton API marchand fourni par Money Fusion |
| `MONEY_FUSION_API_KEY` | `<votre_cle_api_money_fusion>` | Clé d'API marchande Money Fusion |
| `MONEY_FUSION_WEBHOOK_SECRET` | `<votre_cle_secrete_webhook>` | Clé HMAC pour valider les webhooks |

---

## 🛠️ Étape 4 : Migrations de la Base de Données

Lors du premier déploiement, appliquez les tables Prisma à la base PostgreSQL Render :

Via la console Render Shell du service ou en local avec l'URL externe :

```bash
npx prisma db push
```

---

## 🔔 Étape 5 : Enregistrement de l'URL Callback chez Money Fusion

Dans votre console d'administration **Money Fusion** :

- **URL de Webhook Callback** :
  `https://payment-service-wendkabre.onrender.com/api/payment/callback`
- **URL de Redirection Client (Return URL)** :
  `https://payment-service-wendkabre.onrender.com/api/payment/return`

---

## 🔗 Étape 6 : Connexion avec le Backend Principal Wend-Kabré

Dans l'environnement du backend principal Wend-Kabré (Vercel, Render, ou serveur VPS) :

Ajoutez la variable d'environnement :

```env
PAYMENT_SERVICE_URL=https://payment-service-wendkabre.onrender.com
```

Le backend principal s'interconnecte alors de manière complètement découplée via `PaymentServiceClient`.
