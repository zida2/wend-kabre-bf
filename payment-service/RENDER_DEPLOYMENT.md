# 🚀 Guide Déploiement Render Multi-Services (Render Free Tier)

Ce guide détaille le déploiement séparé et interconnecté des deux services sur la plateforme **Render.com** sans coût et sans obligation de nom de domaine payant.

---

## 🏗️ Architecture des Services sur Render

1. **Base de Données PostgreSQL** : `wendkabre-db` (Render Managed PostgreSQL)
2. **Service 1 - Payment Service** : `payment-service-wendkabre` (Web Service Node.js / Express)
   - URL publique : `https://payment-service-wendkabre.onrender.com`
3. **Service 2 - Application SaaS Principale** : `wend-kabre-backend` (Next.js App)
   - URL publique : `https://wend-kabre.onrender.com` (ou Vercel `https://wend-kabre.vercel.app`)

---

## 📋 Étape 1 : Création de la Base PostgreSQL sur Render

1. Rendez-vous sur le tableau de bord Render -> **New +** -> **PostgreSQL**.
2. Nommez la BDD : `wendkabre-db`.
3. Plan : **Free**.
4. Copiez l'URL de connexion : `Internal Database URL`.

---

## 🛠️ Étape 2 : Déploiement du Microservice Payment Service

1. Cliquez sur **New +** -> **Web Service**.
2. Connectez votre dépôt Git et sélectionnez le dossier `payment-service/`.
3. Renseignez les commandes :
   - **Environment** : `Node`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
4. Ajoutez les variables d'environnement dans le panneau **Environment** :
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `RENDER_EXTERNAL_URL` = `https://payment-service-wendkabre.onrender.com`
   - `DATABASE_URL` = `<votre_Internal_Database_URL>`
   - `JWT_SECRET` = `<votre_cle_jwt_secrete>`
   - `MONEY_FUSION_API_URL` = `https://api.moneyfusion.net/v1`
   - `MONEY_FUSION_TOKEN` = `<votre_token_money_fusion>`
   - `MONEY_FUSION_API_KEY` = `<votre_cle_api_money_fusion>`
   - `MONEY_FUSION_WEBHOOK_SECRET` = `<votre_secret_webhook>`

---

## 🌐 Étape 3 : Déploiement de l'Application Principale Wend-Kabré

1. Cliquez sur **New +** -> **Web Service**.
2. Sélectionnez le dossier racine du projet.
3. Renseignez :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
4. Ajoutez la variable d'environnement clé :
   - `PAYMENT_SERVICE_URL` = `https://payment-service-wendkabre.onrender.com`

---

## 🔔 Étape 4 : Enregistrement du Callback chez Money Fusion

Dans votre espace marchand Money Fusion :

- **URL Webhook Callback** :
  `https://payment-service-wendkabre.onrender.com/api/payment/callback`
- **URL de Redirection Succès/Retour** :
  `https://payment-service-wendkabre.onrender.com/api/payment/return`

---

## 📌 Note sur la transition vers un nom de domaine payant futur

Si vous achetez un nom de domaine plus tard (ex: `wend-kabre.com` & `payment.wend-kabre.com`) :
Il vous suffira de remplacer les variables `PAYMENT_SERVICE_URL` et `RENDER_EXTERNAL_URL` par vos nouvelles URLs personnalisées sans toucher au code source !
