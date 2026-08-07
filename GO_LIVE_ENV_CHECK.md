# GO_LIVE_ENV_CHECK.md — Audit Variables Environnement

Projet : **Wend-Kabré — Money Fusion**
Date de génération : 2026-08-07
Objectif : Lister **toutes** les variables utilisées par l'écosystème Wend-Kabré (Next.js + Firebase + Payment-Service + Prisma + Money Fusion), indiquer leur statut et toute action requise **avant** le premier paiement réel.

Légende :
- 🔴 OBLIGATOIRE = **bloquant** pour le paiement réel
- 🟡 OBLIGATOIRE SAISONNIÈRE = requis pour un module spécifique (SMS, emails, IA, cron…)
- 🟢 OPTIONNEL = améliore l'UX ou le monitoring, sans blocage

---

## 1. Projet Next.js (Racine `wend-kabre-bf`)

Les variables NEXT_PUBLIC_* sont embarquées dans le bundle client. **Jamais** de secret dedans.

| Variable | Service | Obligatoire ? | Valeur présente | Action nécessaire |
|----------|---------|---------------|-----------------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | SEO/Sitemap | 🟡 Bonne pratique | Valeur par défaut : `https://wend-kabre-bf.vercel.app` | ⚠️ Remplacer par domaine réel si personnalisé |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client (Web SDK) | 🔴 OBLIGATOIRE | Valeur via .env.example | ✅ Déjà renseignée (vérifier dans Console Firebase → Paramètres projet → Général) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Client | 🔴 OBLIGATOIRE | ✅ | — |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Client | 🔴 OBLIGATOIRE | ✅ | — |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Client | 🔴 OBLIGATOIRE | ✅ | — |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Client | 🔴 OBLIGATOIRE | ✅ | — |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Client | 🔴 OBLIGATOIRE | ✅ | — |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics | 🟢 OPTIONNEL | À renseigner si Google Analytics activé | — |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK (JSON ou base64) | 🔴 OBLIGATOIRE (serveur) | ❌ à renseigner | 🚨 **CRITIQUE** : compte de service Firebase Admin, JSON complet exporté via IAM & Admin → Comptes de service → Créer / Générer une clé. Sans ça, pas de sync des rôles et abonnements Firestore via backend |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Admin fallback | 🟡 (redondant avec SERVICE_ACCOUNT) | ❌ à renseigner si SERVICE_ACCOUNT absent | — |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin fallback | 🟡 Idem | ❌ à renseigner si SERVICE_ACCOUNT absent | — |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin fallback | 🟡 Idem | ❌ à renseigner si SERVICE_ACCOUNT absent | — |
| `PAYMENT_SERVICE_URL` | Client Next.js → Payment Microservice | 🔴 OBLIGATOIRE | Default `https://payment-service-wendkabre.onrender.com` | ⚠️ Vérifier l'URL Render avant Go-Live (doit pointer service PAYMENT démarré) |
| `GMAIL_EMAIL` | Service emails (Nodemailer) | 🟡 Notifications paiements | ❌ à renseigner | Compte Gmail ou SMTP dédié |
| `GMAIL_APP_PASSWORD` | Emails Nodemailer | 🟡 | ❌ à renseigner | Mot de passe d'application Google (**ne jamais utiliser mot de passe réel du compte**) |
| `TWILIO_ACCOUNT_SID` | SMS/WhatsApp | 🟡 Alertes paiements | ❌ à renseigner | — |
| `TWILIO_AUTH_TOKEN` | SMS/WhatsApp | 🟡 | ❌ à renseigner | — |
| `TWILIO_SMS_FROM` | SMS | 🟡 | ❌ à renseigner | Numéro Twilio long-code ou Short-code appro |
| `TWILIO_WHATSAPP_FROM` | WhatsApp | 🟡 | ❌ à renseigner | Format : `whatsapp:+226xxxxxxxxx` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | IA (chat + analyze-market) | 🟡 IA générative | ❌ à renseigner | Alias : `GEMINI_API_KEY` — créer sur ai.google.dev |
| `GEMINI_API_KEY` | Alias précédent | 🟡 | ❌ à renseigner | — |
| `CRON_SECRET` | Endpoints cron (`/api/scrape`, `/api/notify`) | 🔴 OBLIGATOIRE (si crons activés) | ❌ à renseigner | Longue chaîne aléatoire **unique** (32+ caractères) — utilisé comme Bearer token par Vercel Cron / GitHub Actions |
| `SCRAPER_SECRET` | Endpoints scrape/notify/alerts | 🔴 OBLIGATOIRE (si crons) | ❌ à renseigner | Identique à CRON_SECRET ou générer un 2e secret indépendant |
| `NEXT_PUBLIC_SCRAPER_SECRET` | Dashboard Admin (bouton "Rafraîchir") | 🟢 OPTIONNEL | ❌ à renseigner si bouton déclencheur manuel utilisé | — |

---

## 2. Payment-Service (sous-dossier `payment-service`)

| Variable | Service | Obligatoire ? | Valeur présente | Action nécessaire |
|----------|---------|---------------|-----------------|-------------------|
| `NODE_ENV` | Runtime | 🟢 | Défaut `development` | 🚨 Mettre **`production`** sur Render / prod |
| `PORT` | Port HTTP Express | 🟢 | Défaut `5000` | Laisser Render auto-configurer via variable système (`PORT` alloué par plateforme) — ne PAS hardcoder |
| `RENDER_EXTERNAL_URL` | URLs de base pour callbacks/return | 🔴 OBLIGATOIRE | Default : `https://payment-service-wendkabre.onrender.com` | 🚨 **VÉRIFIER IMPÉRATIVEMENT** avant Go-Live. Doit correspondre EXACTEMENT à l'URL publique Render du service paiement. Utilisé pour construire `callbackUrl` et `returnUrl` envoyés à Money Fusion. |
| `APP_URL` | URL du frontend Next.js | 🔴 OBLIGATOIRE | Default Production : `https://wend-kabre.com` | 🚨 **PRIORITAIRE** : renseigner l'URL publique réelle du frontend (Vercel/domaine custom). Sans ça, `returnUrl` et `success/cancel` renvoient vers localhost ou un faux domaine. |
| `DATABASE_URL` | Prisma → Supabase PostgreSQL | 🔴 OBLIGATOIRE | ✅ déployée via `prisma db push` | 🚨 Toujours utiliser **pooled URL** de Supabase (Pooler - Mode Transaction). Format : `postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true` (évite `too many connections`) |
| `DIRECT_URL` | Prisma migrations / `db push` (sans pooling) | 🔴 OBLIGATOIRE pour migrations | ✅ utilisé précédemment | Doit pointer le port 5432 natif, NON le pooler (Supabase Session pooler port 6543 est OK en alternative si nécessaire) |
| `JWT_SECRET` | Middleware `authenticateJWT` et tokens admin | 🔴 OBLIGATOIRE | Default si absent → **refus** par Zod | 🚨 Longue chaîne aléatoire ≥ 32 caractères **indépendante** des autres secrets. Utilisée pour signer les JWT de connexion admin. **Ne jamais changer** en production sans déconnexion de tous les admins. |
| `MONEY_FUSION_API_URL` | Base URL API Money Fusion | 🔴 OBLIGATOIRE | Default : `https://api.moneyfusion.net/v1` | ⚠️ **À CONFIGURER / VÉRIFIER AVEC MONEY FUSION** : obtenir leur URL API de production officielle (sandbox vs production) |
| `MONEY_FUSION_TOKEN` | Authorization `Bearer <token>` Money Fusion | 🔴 OBLIGATOIRE | Default : `MF_TEST_TOKEN` | 🚨 **CRITIQUE / BLOCKER** : remplacer par le Token Live Money Fusion fourni par leur équipe (Dashboard MF → Intégrations → Clés API) |
| `MONEY_FUSION_API_KEY` | Header `x-api-key` Money Fusion | 🔴 OBLIGATOIRE | Default : `MF_TEST_API_KEY` | 🚨 **CRITIQUE / BLOCKER** : obtenir la clé API associée au compte marchand Money Fusion |
| `MONEY_FUSION_WEBHOOK_SECRET` | HMAC signature webhooks entrants | 🔴 OBLIGATOIRE | Default : `MF_WEBHOOK_SECRET` | 🚨 **CRITIQUE / BLOCKER** : récupérer dans Dashboard Money Fusion → Webhooks → Secret. EN PRODUCTION, un callback dont la signature ne matche PAS ce secret est **automatiquement rejeté** (HTTP 401). |
| `MONEY_FUSION_ALLOWED_IPS` | Whitelist IP webhooks Money Fusion | 🟢 OPTIONNEL (recommandé) | Vide → désactivé | ⚠️ Sécurité additionnelle : récupérer liste d'IP émettrices Money Fusion, ex. `35.241.12.34,35.189.56.78`. Si vide, aucune vérification IP. |
| `PAYMENT_CURRENCY` | Devise par défaut | 🔴 OBLIGATOIRE | Default : `XOF` | ✅ FCFA — ne PAS changer pour le Burkina Faso |

---

## 3. Firebase (hors variables .env — Console Firebase)

| Élément | Lieu de configuration | Obligatoire ? | Action nécessaire |
|---------|-----------------------|---------------|-------------------|
| Règles Firestore | Console Firebase → Firestore Database → Règles | 🔴 | Déployer le fichier [firestore.rules](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/firestore.rules) via `firebase deploy --only firestore:rules` |
| Compte de service Admin SDK | IAM → Comptes de service | 🔴 | JSON de clé privée renseigné dans `FIREBASE_SERVICE_ACCOUNT` (Next.js + Payment si demandé) |
| `isAdmin()` hardcodé | [firestore.rules#L14-L16](file:///C:/Users/Dési%20InnovaTech/Desktop/DOSSIER%20CANDIDATURE%20ZIDA%20DESIRE%20INFORMATIQUE%20APPLICATION/Sport/wend-kabre-bf/firestore.rules#L14-L16) | ⚠️ SÉCURITÉ | Remplacer `zidadesire20@gmail.com` par l'email admin réel OU migrer vers Custom Claims Admin SDK (recommandé) |
| Providers Auth activés | Firebase Auth → Sign-in method | 🔴 | Activer au minimum **Email/Password**. Optionnel : Google/Phone |
| Domaines autorisés | Firebase Auth → Settings → Authorized domains | 🔴 | Ajouter domaine frontend final (ex. `wend-kabre.com`) |

---

## 4. Récap actions urgentes (Go / No-Go)

### 🚨 BLOCKERS — à résoudre avant premier paiement réel
1. `MONEY_FUSION_TOKEN` (valeur Live)
2. `MONEY_FUSION_API_KEY` (valeur Live)
3. `MONEY_FUSION_WEBHOOK_SECRET`
4. `APP_URL` = URL publique frontend exacte
5. `RENDER_EXTERNAL_URL` = URL Render du payment-service exacte
6. `DATABASE_URL` Pooled + `DIRECT_URL` Supabase confirmés
7. `JWT_SECRET` ≥ 32 caractères
8. `FIREBASE_SERVICE_ACCOUNT` pour sync abonnements

### 🟡 Actions importantes (non bloquants immédiat, requis pour production complète)
- `GMAIL_EMAIL` + `GMAIL_APP_PASSWORD` → emails paiement
- `TWILIO_*` → SMS/WhatsApp alerts paiements
- `GOOGLE_GENERATIVE_AI_API_KEY` → chatbot marché & analyse IA
- `CRON_SECRET` + `SCRAPER_SECRET` → scraping quotidien des marchés
- Activer `MONEY_FUSION_ALLOWED_IPS` avec IP Money Fusion
- `isAdmin()` Firestore : migrer vers Custom Claims plutôt qu'email hardcodé
