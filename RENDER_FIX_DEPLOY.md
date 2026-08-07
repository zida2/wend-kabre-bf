# 🔧 RENDER DEPLOYMENT FIX — Payment Service

**Date :** 2026-08-07  
**Problème :** Build failed - "Could not find Prisma Schema"  
**Solution :** ✅ CORRIGÉ

---

## 🐛 ERREUR RENCONTRÉE

```
Error: Could not find Prisma Schema that is required for this command.
Checked following paths:
  schema.prisma: file not found
  prisma/schema.prisma: file not found
```

**Cause :**
- Build command : `npm install && npm run build && npx prisma migrate deploy`
- Prisma cherchait le schema à la racine, mais il est dans `payment-service/prisma/`

---

## ✅ CORRECTION APPLIQUÉE

### Fichier `render.yaml` modifié :

**AVANT :**
```yaml
buildCommand: npm install && npm run build && npx prisma migrate deploy
startCommand: npm start
```

**APRÈS :**
```yaml
buildCommand: npm install && npx prisma generate && npm run build
startCommand: node dist/server.js
```

### Changements :
1. ✅ `npx prisma generate` **avant** `npm run build`
   - Génère le Prisma Client nécessaire pour la compilation TypeScript
   
2. ✅ Suppression de `npx prisma migrate deploy` du build
   - Les migrations doivent être exécutées **manuellement** après le premier déploiement
   - Raison : Évite erreurs si BDD pas encore configurée
   
3. ✅ `startCommand: node dist/server.js`
   - Lancement direct du fichier compilé
   - Plus rapide que `npm start`

4. ✅ `rootDir: payment-service` (déjà correct)
   - Render build depuis le dossier `payment-service/`
   - Prisma trouve correctement `payment-service/prisma/schema.prisma`

---

## 🚀 PROCÉDURE DÉPLOIEMENT RENDER

### 1. Configuration Initiale (Une fois)

#### A. Créer le service sur Render Dashboard

1. Se connecter à https://dashboard.render.com
2. New + → Web Service
3. Connecter le repository GitHub : `zida2/wend-kabre-bf`
4. **Root Directory :** `payment-service`
5. **Runtime :** Node
6. **Build Command :** `npm install && npx prisma generate && npm run build`
7. **Start Command :** `node dist/server.js`
8. **Plan :** Free (ou Starter)

#### B. Configurer les Variables d'Environnement

**Variables OBLIGATOIRES :**

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<Supabase_Pooled_Connection_String>
DIRECT_URL=<Supabase_Direct_Connection_String>
JWT_SECRET=<32_caractères_aléatoires>
APP_URL=https://wend-kabre.com
RENDER_EXTERNAL_URL=https://payment-service-wendkabre.onrender.com
MONEY_FUSION_API_URL=https://api.moneyfusion.net/v1
MONEY_FUSION_TOKEN=<Token_Live_MF>
MONEY_FUSION_API_KEY=<API_Key_Live_MF>
MONEY_FUSION_WEBHOOK_SECRET=<Secret_Webhook_MF>
PAYMENT_CURRENCY=XOF
```

**Variables OPTIONNELLES :**

```bash
MONEY_FUSION_ALLOWED_IPS=<IP1,IP2,IP3>
```

#### C. Exécuter les Migrations Prisma (Première fois)

**⚠️ IMPORTANT : À faire APRÈS le premier déploiement réussi**

1. Ouvrir le Shell Render :
   ```
   Dashboard → payment-service → Shell (bouton en haut à droite)
   ```

2. Exécuter :
   ```bash
   npx prisma migrate deploy
   ```

3. Vérifier :
   ```bash
   npx prisma db pull
   ```

**Ou en local :**

```bash
cd payment-service
npx prisma migrate deploy
```

---

### 2. Déploiements Suivants (Automatique)

Render redéploie automatiquement à chaque push sur `master` :

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin master
```

Render détecte le push et :
1. Clone le repo
2. `cd payment-service`
3. `npm install`
4. `npx prisma generate`
5. `npm run build` (compile TypeScript → `dist/`)
6. `node dist/server.js` (démarre le service)

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Build Réussi

Dashboard Render → Logs :

```
✓ npm install completed
✓ npx prisma generate completed
✓ npm run build completed
✓ Build succeeded
==> Deploying...
==> Your service is live 🎉
```

### 2. Health Check

```bash
curl https://payment-service-wendkabre.onrender.com/health
```

**Attendu :**
```json
{
  "status": "OK",
  "timestamp": "2026-08-07T17:00:00.000Z",
  "service": "payment-service",
  "version": "1.0.0",
  "uptime": 123.456,
  "database": "connected"
}
```

### 3. Connexion BDD

Logs Render → Chercher :

```
✓ Prisma Client initialized
✓ Database connection established
✓ Server listening on port 10000
```

**Erreurs possibles :**

❌ `Prisma Error P1001: Can't reach database server`
→ Vérifier `DATABASE_URL` dans Env Vars

❌ `Error: listen EADDRINUSE: address already in use`
→ Ignorer, Render gère le port automatiquement

---

## 🐛 TROUBLESHOOTING

### Erreur : "Could not find Prisma Schema"

**Solution :** ✅ Déjà corrigée dans `render.yaml`

Si l'erreur persiste :
1. Vérifier `rootDir: payment-service` dans `render.yaml`
2. Vérifier fichier `payment-service/prisma/schema.prisma` existe sur GitHub
3. Forcer redéploiement : Dashboard → Manual Deploy → Deploy latest commit

---

### Erreur : "Module not found: prisma/client"

**Cause :** `prisma generate` pas exécuté avant `npm run build`

**Solution :**
```yaml
buildCommand: npm install && npx prisma generate && npm run build
```

---

### Erreur : "Environment variable not found: DATABASE_URL"

**Solution :**
1. Dashboard Render → payment-service → Environment
2. Ajouter `DATABASE_URL` (Supabase Pooled Connection String)
3. Redéployer

---

### Build OK mais Service Crash au Démarrage

**Logs à chercher :**

```
Error: Cannot find module './dist/server.js'
```

**Solution :** Vérifier `startCommand` :
```yaml
startCommand: node dist/server.js
```

---

### Service Démarre mais Health Check Failed

**Cause possible :** Port incorrect

**Vérifier `server.ts` :**
```typescript
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  logger.info(`Server running on port ${port}`);
});
```

**⚠️ IMPORTANT :** Écouter sur `0.0.0.0`, pas `localhost`

---

## 📊 COMMANDES UTILES

### Vérifier Build Local

```bash
cd payment-service
npm install
npx prisma generate
npm run build
node dist/server.js
```

### Vérifier Prisma Schema

```bash
cd payment-service
npx prisma validate
```

### Vérifier TypeScript

```bash
cd payment-service
npx tsc --noEmit
```

### Tester Health Check Local

```bash
curl http://localhost:5000/health
```

---

## 🎯 RÉSUMÉ

| Étape | Commande | Statut |
|-------|----------|--------|
| 1. Push correction | `git push origin master` | ✅ FAIT |
| 2. Build Render | Automatique | ⏳ EN COURS |
| 3. Health Check | `curl .../health` | ⏳ À VÉRIFIER |
| 4. Migrations Prisma | `npx prisma migrate deploy` | ⏳ À FAIRE (Shell Render) |
| 5. Variables Env | Dashboard Render | 🟡 5 BLOCKERS CONFIG |

---

## 🚀 PROCHAINES ÉTAPES

1. ⏳ **Attendre build Render** (~2-3 min)
2. ✅ **Vérifier logs** : Build succeeded
3. ✅ **Tester Health Check** : `curl .../health`
4. 🔧 **Migrations Prisma** : Shell Render ou local
5. 🟡 **Configurer 5 variables** : Token MF, API Key, Secret, URLs
6. 🚀 **GO FOR PRODUCTION**

---

**Correction appliquée :** Commit `22cac14`  
**Statut :** ✅ CORRIGÉ — En attente build Render  
**Documentation :** Voir `CHECKLIST_GO_LIVE.md`

---

**Contact :** zidadesire20@gmail.com  
**Dernière mise à jour :** 2026-08-07
