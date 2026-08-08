# 🚀 GUIDE COMPLET — NOUVEAU SERVICE RENDER PAYMENT

**Date :** 2026-08-08  
**Objectif :** Créer le service payment-service sur Render de zéro avec la bonne configuration

---

## ✅ PRÉPARATION (Déjà fait)

- ✅ Code prêt sur GitHub (commit `4bab2b3`)
- ✅ JWT_SECRET généré : `b98b73ff8cc1a94698463263430709aaa7a54a94df9779c8ef1b67fd742c46f5`
- ✅ Template variables : `payment-service/.env.render`
- ✅ Documentation complète (10 fichiers)

---

## 🎯 ÉTAPE 1 — CRÉER LE SERVICE RENDER (5 min)

### 1.1 Accéder au Dashboard

🔗 **Ouvrir** : https://dashboard.render.com

### 1.2 Créer Web Service

1. Cliquer **"New +"** (en haut à droite)
2. Choisir **"Web Service"**

### 1.3 Connecter le Repository

**Si déjà connecté :**
- Sélectionner `zida2/wend-kabre-bf` dans la liste

**Si pas encore connecté :**
1. Click "Connect Account"
2. Autoriser GitHub
3. Sélectionner `zida2/wend-kabre-bf`

---

## 🎯 ÉTAPE 2 — CONFIGURATION SERVICE (2 min)

### Section "Details"

| Champ | Valeur à entrer |
|-------|-----------------|
| **Name** | `payment-service-wendkabre` |
| **Region** | `Frankfurt` (ou le plus proche de vous) |
| **Branch** | `master` |
| **Root Directory** | `payment-service` ⚠️ **CRITIQUE** |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `node dist/server.js` |

### Section "Instance Type"

| Champ | Valeur |
|-------|--------|
| **Plan** | `Free` (ou `Starter` si vous voulez 0 downtime) |

---

## 🎯 ÉTAPE 3 — VARIABLES D'ENVIRONNEMENT (10 min)

### 3.1 Cliquer "Advanced"

Avant de créer le service, ajoutez les variables de base.

### 3.2 Variables de Base (Ajouter maintenant)

Cliquer **"Add Environment Variable"** pour chaque :

```bash
NODE_ENV=production
PORT=10000
```

### 3.3 Créer le Service

**Cliquer "Create Web Service"**

⏳ **Attendre le premier build** (~3-5 min)

---

## 🎯 ÉTAPE 4 — SURVEILLER LE PREMIER BUILD

### Onglet "Logs"

**Vous devriez voir :**

```
✅ ==> Using Root Directory: payment-service
✅ ==> Running build command 'npm install && npx prisma generate && npm run build'
✅ npm install completed
✅ Prisma schema found at: prisma/schema.prisma
✅ Generated Prisma Client
✅ TypeScript compilation successful
✅ Build succeeded
✅ ==> Your service is live 🎉
```

**Si erreur "Prisma Schema not found" :**
- ❌ Root Directory n'a pas été configuré
- → Aller dans Settings → Root Directory = `payment-service` → Save

---

## 🎯 ÉTAPE 5 — NOTER L'URL DU SERVICE

Une fois déployé, Render affiche l'URL :

```
https://payment-service-wendkabre.onrender.com
```

✅ **Copier cette URL** → Vous en aurez besoin pour les variables

---

## 🎯 ÉTAPE 6 — CONFIGURER TOUTES LES VARIABLES (15 min)

### 6.1 Aller dans Environment

Dashboard → `payment-service-wendkabre` → **Environment**

### 6.2 Ouvrir le fichier de référence

**Sur votre machine locale :**

```bash
payment-service/.env.render
```

Ce fichier contient TOUTES les variables avec vos valeurs.

### 6.3 Ajouter les variables UNE PAR UNE

**Cliquer "Add Environment Variable"** et copier-coller depuis `.env.render` :

#### Variables Runtime (déjà faites)
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000`

#### Variables URLs

```bash
RENDER_EXTERNAL_URL=https://payment-service-wendkabre.onrender.com
APP_URL=https://wend-kabre.com
```

⚠️ **Remplacer** `https://payment-service-wendkabre.onrender.com` par l'URL réelle de l'étape 5

#### Variables Base de Données

🔗 **Aller chercher dans Supabase** :

1. Ouvrir https://supabase.com/dashboard
2. Votre projet → Settings → Database
3. Section "Connection string"
4. **Copier "Connection pooling" (port 6543)** → C'est votre `DATABASE_URL`
5. **Copier "Direct connection" (port 5432)** → C'est votre `DIRECT_URL`

```bash
DATABASE_URL=postgres://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgres://postgres.xxxxx:[PASSWORD]@aws-0-xxx.supabase.com:5432/postgres
```

#### Variable JWT (déjà générée)

```bash
JWT_SECRET=b98b73ff8cc1a94698463263430709aaa7a54a94df9779c8ef1b67fd742c46f5
```

✅ **Copier exactement cette valeur** depuis `.env.render`

#### Variables Money Fusion

🔗 **Aller chercher dans Money Fusion** :

1. Ouvrir Dashboard Money Fusion
2. Section **Intégrations** ou **API**
3. Copier **Token Live** → `MONEY_FUSION_TOKEN`
4. Copier **API Key Live** → `MONEY_FUSION_API_KEY`
5. Section **Webhooks** → Copier **Secret** → `MONEY_FUSION_WEBHOOK_SECRET`

```bash
MONEY_FUSION_API_URL=https://api.moneyfusion.net/v1
MONEY_FUSION_TOKEN=<copier_depuis_dashboard_MF>
MONEY_FUSION_API_KEY=<copier_depuis_dashboard_MF>
MONEY_FUSION_WEBHOOK_SECRET=<copier_depuis_dashboard_MF>
PAYMENT_CURRENCY=XOF
```

#### Variables Optionnelles

```bash
# Si Money Fusion vous fournit des IPs
MONEY_FUSION_ALLOWED_IPS=xxx.xxx.xxx.xxx,yyy.yyy.yyy.yyy
```

### 6.4 Sauvegarder

**Cliquer "Save Changes"** en bas

⏳ Render redéploie automatiquement (~2 min)

---

## 🎯 ÉTAPE 7 — EXÉCUTER LES MIGRATIONS PRISMA (2 min)

### Option 1 : Via Shell Render (Recommandé)

1. Dashboard → `payment-service-wendkabre`
2. Cliquer **"Shell"** (bouton en haut à droite)
3. Attendre que le shell s'ouvre
4. Exécuter :

```bash
npx prisma migrate deploy
```

5. Vérifier la sortie :

```
✓ Prisma Migrate applied 5 migrations
  Database is now in sync
```

### Option 2 : En local

```bash
cd payment-service

# Créer un fichier .env temporaire
echo "DATABASE_URL=<copier_depuis_Render>" > .env

# Exécuter migrations
npx prisma migrate deploy

# Supprimer le .env
rm .env
```

---

## 🎯 ÉTAPE 8 — CONFIGURER HEALTH CHECK (1 min)

1. Dashboard → `payment-service-wendkabre` → **Settings**
2. Scroller jusqu'à **"Health Checks"**
3. **Health Check Path** : `/health`
4. **Save Changes**

---

## 🎯 ÉTAPE 9 — TESTER LE SERVICE (2 min)

### Test 1 : Health Check

```bash
curl https://payment-service-wendkabre.onrender.com/health
```

**Attendu :**

```json
{
  "status": "OK",
  "timestamp": "2026-08-08T...",
  "service": "payment-service",
  "version": "1.0.0",
  "uptime": 123.456,
  "database": "connected"
}
```

### Test 2 : Vérifier les Logs

Dashboard → Logs

**Chercher :**
```
✓ Server listening on port 10000
✓ Database connection established
✓ Prisma Client initialized
```

---

## 🎯 ÉTAPE 10 — ENREGISTRER URLS CHEZ MONEY FUSION (5 min)

### 10.1 Calculer les URLs

**Votre service Render :**
```
https://payment-service-wendkabre.onrender.com
```

**URLs à enregistrer :**

1. **Callback URL** (POST webhook) :
   ```
   https://payment-service-wendkabre.onrender.com/api/payment/callback
   ```

2. **Return URL** (GET redirect) :
   ```
   https://payment-service-wendkabre.onrender.com/api/payment/return
   ```

### 10.2 Enregistrer dans Money Fusion

1. Ouvrir Dashboard Money Fusion
2. Section **Webhooks** ou **Notifications** ou **Intégrations**
3. **Ajouter Callback URL** : `https://payment-service-wendkabre.onrender.com/api/payment/callback`
4. **Ajouter Return URL** : `https://payment-service-wendkabre.onrender.com/api/payment/return`
5. **Activer signature HMAC** (si option disponible)
6. **Sauvegarder**

---

## ✅ CHECKLIST FINALE

### Render Configuration

- [ ] Service créé : `payment-service-wendkabre`
- [ ] Root Directory : `payment-service`
- [ ] Build Command : `npm install && npx prisma generate && npm run build`
- [ ] Start Command : `node dist/server.js`
- [ ] Health Check Path : `/health`

### Variables d'Environnement (13 variables)

- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `RENDER_EXTERNAL_URL=https://...`
- [ ] `APP_URL=https://wend-kabre.com`
- [ ] `DATABASE_URL=postgres://...6543...`
- [ ] `DIRECT_URL=postgres://...5432...`
- [ ] `JWT_SECRET=b98b73ff...`
- [ ] `MONEY_FUSION_API_URL=https://api.moneyfusion.net/v1`
- [ ] `MONEY_FUSION_TOKEN=<MF_Live>`
- [ ] `MONEY_FUSION_API_KEY=<MF_Live>`
- [ ] `MONEY_FUSION_WEBHOOK_SECRET=<MF_Secret>`
- [ ] `PAYMENT_CURRENCY=XOF`
- [ ] `MONEY_FUSION_ALLOWED_IPS` (optionnel)

### Tests

- [ ] Health Check : `curl .../health` → 200 OK
- [ ] Logs Render : Aucune erreur
- [ ] Prisma migrations : Déployées

### Money Fusion

- [ ] Callback URL enregistrée
- [ ] Return URL enregistrée
- [ ] Signature HMAC activée

---

## 🎯 APRÈS CETTE CONFIGURATION

✅ **Service payment-service LIVE**  
✅ **Build réussit à chaque commit**  
✅ **Base de données connectée**  
✅ **Health Check fonctionnel**  
✅ **Webhooks Money Fusion configurés**

---

## 🚀 PROCHAINES ÉTAPES

1. **Test Sandbox** (si Money Fusion le propose)
   - Effectuer un paiement test
   - Vérifier callback reçu
   - Vérifier transaction en BDD

2. **Premier Paiement Réel** (15 000 FCFA)
   - Suivre `CHECKLIST_GO_LIVE.md` étapes 54-75
   - Monitorer en temps réel
   - Vérifier Dashboard Admin

3. **GO-LIVE PRODUCTION** 🎉

---

## 📞 AIDE & SUPPORT

**Problèmes fréquents :**
- Build failed : Voir `RENDER_FIX_DEPLOY.md`
- Prisma Schema not found : Vérifier Root Directory
- Variables manquantes : Voir `payment-service/.env.render`
- Incident paiement : Voir `RUNBOOK_INCIDENTS_PAIEMENT.md`

**Documentation complète :**
- Navigation : `GO_LIVE_INDEX.md`
- Checklist 96 étapes : `CHECKLIST_GO_LIVE.md`
- Rapport technique : `MISSION_FINALE_RAPPORT.md`

**Contact :** zidadesire20@gmail.com

---

**Dernière mise à jour :** 2026-08-08  
**Version :** 1.0 NOUVEAU SERVICE  
**Statut :** ✅ Prêt pour déploiement
