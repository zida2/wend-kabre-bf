# 💳 Wend-Kabré - Microservice de Paiement Indépendant (Money Fusion)

Microservice backend professionnel et autonome développé en **Node.js**, **Express.js**, **TypeScript** et **Prisma ORM** avec **PostgreSQL** pour centraliser la gestion des abonnements et paiements de la plateforme SaaS de marchés publics **Wend-Kabré** (Burkina Faso).

---

## 🏗️ Architecture Globale SaaS

```text
               +----------------------------------+
               |      Frontend Wend-Kabré         |
               |     (React / Next.js Client)     |
               +----------------------------------+
                                |
                                | POST /api/subscription/checkout
                                v
               +----------------------------------+
               |     Backend Principal Wend-Kabré  |
               |      (Next.js App Router API)    |
               +----------------------------------+
                                |
                                | via PaymentServiceClient
                                v
               +----------------------------------+
               |   Payment Service Microservice   |
               |   (Node.js / Express / Prisma)   |
               +----------------------------------+
                                |
                   +------------+------------+
                   |                         |
                   v                         v
       +-----------------------+   +--------------------+
       | Money Fusion Gateway  |   |  Orange / Moov     |
       |  (PayUrl & Callback)  |   | (Providers Stubs)  |
       +-----------------------+   +--------------------+
```

---

## 🌟 Fonctionnalités Principales

1. **Création de paiement Money Fusion** (`POST /api/payment/create`) : Génère une référence unique (`WK-PAY-xxxx`), initialise la transaction en BDD et retourne le lien vers la passerelle Money Fusion.
2. **Gestion Automatisée du Callback / Webhook** (`POST /api/payment/callback`) : Réception des notifications en temps réel, vérification de la signature HMAC et des montants, prévention des doubles validations (idempotence), et **activation automatique de l'abonnement utilisateur**.
3. **Architecture Extensible Multi-Fournisseurs (Interface `PaymentProvider`)** : Conçue pour intégrer de nouveaux moyens de paiement (**Orange Money**, **Moov Money**, cartes bancaires) sans modifier l'application principal Wend-Kabré.
4. **Client Interne `PaymentServiceClient`** : Module TypeScript à intégrer dans l'application principale pour des appels HTTP fiables et sécurisés.
5. **Dashboard Administrateur** (`GET /api/payment/stats`) : Calcul des statistiques de conversion, chiffre d'affaires total, taux de succès, et abonnements actifs.
6. **Sécurité Avancée** : Validation stricte des données avec **Zod**, limitation de débit (**express-rate-limit**), en-têtes sécurisés avec **Helmet**, protection CORS et authentification JWT.
7. **Prêt pour l'Hébergement Gratuit sur Render** : Fichier `render.yaml` et guide [DEPLOYMENT.md](DEPLOYMENT.md) clé en main pour déploiement automatique sur Render Free Tier.

---

## 📂 Structure des Fichiers

```text
payment-service/
├── src/
│   ├── config/
│   │   ├── database.ts             # Client Prisma PostgreSQL
│   │   ├── environment.ts          # Validation des variables d'environnement (Zod)
│   │   └── moneyFusion.config.ts   # Configuration de la passerelle Money Fusion
│   ├── controllers/
│   │   └── payment.controller.ts   # Contrôleurs HTTP
│   ├── services/
│   │   ├── payment.service.ts      # Logique métier et calcul des statistiques
│   │   ├── moneyFusion.service.ts  # Service wrapper pour l'API Money Fusion
│   │   ├── webhook.service.ts      # Traitement du callback & activation d'abonnements
│   │   └── providers/
│   │       ├── PaymentProvider.interface.ts # Interface standard PaymentProvider
│   │       ├── MoneyFusionProvider.ts       # Implémentation Money Fusion
│   │       ├── OrangeMoneyProvider.ts       # Structure préparée Orange Money
│   │       ├── MoovMoneyProvider.ts         # Structure préparée Moov Money
│   │       └── paymentProvider.factory.ts   # Fabrique de providers
│   ├── routes/
│   │   └── payment.routes.ts       # Endpoints API avec validateurs Zod
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # Validation des jetons JWT
│   │   ├── error.middleware.ts     # Gestionnaire centralisé d'erreurs
│   │   ├── rateLimit.middleware.ts # Protection contre le sur-trafic
│   │   └── validation.middleware.ts# Middleware de validation Zod
│   ├── types/
│   │   └── payment.types.ts        # Interfaces TypeScript et détails des Plans SaaS
│   ├── utils/
│   │   ├── logger.ts               # Logger structuré
│   │   └── errors.ts               # Classes d'erreurs HTTP personnalisées
│   ├── app.ts                      # Configuration Express.js
│   └── server.ts                   # Démarrage du serveur et Graceful Shutdown
├── prisma/
│   └── schema.prisma               # Modèles BDD User, Subscription et PaymentTransaction
├── test_integration.mjs            # Suite de tests automatisée (10 tests validés)
├── DEPLOYMENT.md                   # Guide pas-à-pas de déploiement Render
├── .env.example                    # Modèle des variables d'environnement
├── render.yaml                     # Manifeste de déploiement Render Blueprint
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Lancement Local & Tests

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer Prisma BDD
npx prisma db push

# 3. Lancer les tests d'intégration automatisés
node test_integration.mjs

# 4. Démarrer en mode développement
npm run dev
```

---

## 🔒 Licence & Auteur

Plateforme SaaS **Wend-Kabré** - Centralisation des marchés publics du Burkina Faso.
