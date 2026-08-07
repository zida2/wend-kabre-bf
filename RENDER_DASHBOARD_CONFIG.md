# ⚙️ CONFIGURATION RENDER DASHBOARD — Payment Service

**Problème :** Le `render.yaml` n'est pas pris en compte si le service a été créé manuellement via Dashboard.

**Solution :** Configurer directement dans Render Dashboard Settings.

---

## 🎯 SOLUTION IMMÉDIATE

### Étape 1 : Ouvrir Settings du Service

1. Aller sur https://dashboard.render.com
2. Cliquer sur **payment-service-wendkabre**
3. Onglet **Settings** (en haut)

---

### Étape 2 : Configurer Root Directory

**Trouver la section "Build & Deploy"**

#### Root Directory
```
payment-service
```

**⚠️ IMPORTANT :** Ceci indique à Render de travailler depuis le dossier `payment-service/`

---

### Étape 3 : Configurer Build Command

#### Build Command
```bash
npm install && npx prisma generate && npm run build
```

**Explication :**
- `npm install` : Installe les dépendances
- `npx prisma generate` : Génère le Prisma Client
- `npm run build` : Compile TypeScript → `dist/`

**⚠️ PAS de `cd payment-service`** car Root Directory est déjà configuré

---

### Étape 4 : Configurer Start Command

#### Start Command
```bash
node dist/server.js
```

**⚠️ Pas `npm start`** - Plus direct et rapide

---

### Étape 5 : Sauvegarder

1. Cliquer **"Save Changes"** en bas de page
2. Render va automatiquement redéployer

---

## 📸 CONFIGURATION VISUELLE

```
╔════════════════════════════════════════════════════════╗
║ Settings → Build & Deploy                              ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║ Root Directory: [payment-service              ]       ║
║                                                        ║
║ Build Command:  [npm install && npx prisma    ]       ║
║                 [generate && npm run build     ]       ║
║                                                        ║
║ Start Command:  [node dist/server.js          ]       ║
║                                                        ║
║               [Save Changes]                           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## ✅ VÉRIFICATIONS APRÈS SAUVEGARDE

### 1. Build Logs

Dashboard → Logs → Chercher :

```
==> Using Root Directory: payment-service
==> Running build command 'npm install && npx prisma generate && npm run build'...

✓ npm install completed
✓ Prisma schema found at: prisma/schema.prisma
✓ Generated Prisma Client
✓ TypeScript compilation successful
✓ Build succeeded

==> Deploying...
```

### 2. Erreurs Disparues

**AVANT :**
```
Error: Could not find Prisma Schema
Checked following paths:
  schema.prisma: file not found
  prisma/schema.prisma: file not found
```

**APRÈS :**
```
✓ Prisma schema found at: prisma/schema.prisma
✓ Generated Prisma Client (5.22.0)
```

---

## 🔧 ALTERNATIVE : Créer Nouveau Service via Blueprint

Si la configuration Dashboard ne fonctionne toujours pas, **supprimer** le service actuel et **recréer** via Blueprint :

### Étape 1 : Supprimer Service Actuel

1. Dashboard Render → payment-service-wendkabre
2. Settings → Scroll down → **Delete Web Service**
3. Confirmer

### Étape 2 : Créer via Blueprint

1. Dashboard Render → **New +**
2. Choisir **"Blueprint"**
3. Connecter repository : `zida2/wend-kabre-bf`
4. Sélectionner **`render.yaml`**
5. Approuver → Render crée automatiquement :
   - Database `wendkabre-payment-db`
   - Service `payment-service-wendkabre` (avec Root Directory correct)
   - Service `wend-kabre-backend`

**Avantage :** Configuration Infrastructure-as-Code (IaC)

---

## 📋 CONFIGURATION DASHBOARD COMPLÈTE

### Build & Deploy

| Paramètre | Valeur |
|-----------|--------|
| **Root Directory** | `payment-service` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `node dist/server.js` |
| **Auto-Deploy** | Yes |

### Environment

| Variable | Valeur | Type |
|----------|--------|------|
| `NODE_ENV` | `production` | Plain |
| `PORT` | `10000` | Plain |
| `DATABASE_URL` | `postgres://...` | Secret |
| `DIRECT_URL` | `postgres://...` | Secret |
| `JWT_SECRET` | `<32 caractères>` | Secret |
| `APP_URL` | `https://wend-kabre.com` | Plain |
| `RENDER_EXTERNAL_URL` | `https://payment-service-wendkabre.onrender.com` | Plain |
| `MONEY_FUSION_API_URL` | `https://api.moneyfusion.net/v1` | Plain |
| `MONEY_FUSION_TOKEN` | `<Token Live MF>` | Secret |
| `MONEY_FUSION_API_KEY` | `<API Key Live MF>` | Secret |
| `MONEY_FUSION_WEBHOOK_SECRET` | `<Secret MF>` | Secret |
| `PAYMENT_CURRENCY` | `XOF` | Plain |

### Health Check

| Paramètre | Valeur |
|-----------|--------|
| **Health Check Path** | `/health` |

---

## 🚨 TROUBLESHOOTING

### Erreur Persiste Après Config Dashboard

**Solution 1 : Forcer Redéploiement**

1. Dashboard → payment-service
2. **Manual Deploy** (bouton en haut)
3. Deploy latest commit

**Solution 2 : Clear Build Cache**

1. Settings → Build & Deploy
2. Cocher **"Clear build cache & deploy"**
3. Deploy

**Solution 3 : Vérifier .gitignore**

```bash
# Localement
cd payment-service
git ls-files prisma/schema.prisma
```

**Attendu :** Affiche `prisma/schema.prisma`

**Si vide :** Le fichier est ignoré par Git !

```bash
# Vérifier .gitignore
cat ../.gitignore | grep prisma
```

**Si trouvé :**
```
prisma/          # ❌ PROBLÈME !
prisma/migrations/  # ✅ OK (seulement migrations)
```

**Corriger `.gitignore` :**
```diff
- prisma/
+ prisma/migrations/
```

Puis :
```bash
git add payment-service/prisma/schema.prisma
git commit -m "fix: Add prisma schema to git"
git push origin master
```

---

## ✅ CHECKLIST FINALE

- [ ] Dashboard → payment-service → Settings
- [ ] **Root Directory** = `payment-service`
- [ ] **Build Command** = `npm install && npx prisma generate && npm run build`
- [ ] **Start Command** = `node dist/server.js`
- [ ] **Health Check Path** = `/health`
- [ ] Save Changes
- [ ] Attendre build (~2-3 min)
- [ ] Vérifier logs : `✓ Prisma schema found`
- [ ] Vérifier logs : `✓ Build succeeded`
- [ ] Tester : `curl .../health`

---

## 🎯 RÉSUMÉ

**Problème :** `render.yaml` ignoré car service créé manuellement

**Solution :** Configurer **Root Directory** dans Dashboard Settings

**Paramètre clé :** `Root Directory: payment-service`

**Résultat attendu :** Build réussit, Prisma trouve son schema

---

**Contact :** zidadesire20@gmail.com  
**Documentation :** RENDER_FIX_DEPLOY.md  
**Dernière mise à jour :** 2026-08-07
