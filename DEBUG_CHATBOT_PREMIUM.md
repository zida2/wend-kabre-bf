# 🔧 DEBUG : Chatbot Refuse Accès Premium

## 🔴 Problème Signalé
Utilisateur connecté avec compte Premium → Chatbot refuse l'accès

## 🔍 Diagnostic

### Causes Possibles

1. **Champ `isPremium` absent ou incorrect dans Firestore**
   - Le document utilisateur n'a pas le champ `isPremium: true`
   - Le champ existe mais a une valeur incorrecte

2. **Vérification Premium côté client échoue**
   - `userData` non chargé correctement
   - Délai de chargement Firestore trop long

3. **Firebase Admin SDK non configuré**
   - Variables d'environnement manquantes
   - Échec de l'initialisation Admin

## ✅ Solutions Appliquées

### 1. Correction API `/api/chat` (Firestore REST)

**Avant** :
```javascript
// Utilise Firebase Admin SDK (peut échouer si non configuré)
const db = getAdminDb();
const userDoc = await db.collection('users').doc(uid).get();
```

**Après** :
```javascript
// Utilise Firestore REST API (toujours disponible)
const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
const userResponse = await fetch(firestoreUrl);
const isPremium = userData?.fields?.isPremium?.booleanValue;
```

**Avantage** :
- Ne dépend pas de Firebase Admin SDK
- Fonctionne toujours avec les variables publiques
- Mode dégradé si erreur (continue au lieu de bloquer)

---

### 2. Ajout Logs Debug Côté Client

**Fichier** : `src/app/(client)/assistant/page.js`

```javascript
const handleSubmit = (e) => {
  // Logs de débogage
  console.log('👤 User data:', userData);
  console.log('💎 isPremium:', userData?.isPremium);
  
  if (!userData?.isPremium) {
    console.warn('❌ Accès refusé : utilisateur non-Premium');
    setShowPremiumModal(true);
    return;
  }
  
  console.log('✅ Utilisateur Premium - Envoi du message');
  // ...
};
```

---

### 3. Script de Correction du Statut

**Fichier** : `fix_premium_status.mjs`

**Usage** :
```bash
node fix_premium_status.mjs <email> <password>
```

**Fonctions** :
- Vérifie le statut Premium actuel
- Corrige `isPremium: false` → `isPremium: true`
- Ajoute `subscriptionStatus: 'active'`
- Valide la correction

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier le Statut dans Firestore

**Console Firebase** :
1. Aller sur https://console.firebase.google.com
2. Sélectionner le projet Wend-Kabré
3. Firestore Database → Collection `users`
4. Chercher votre email
5. Vérifier les champs :
   ```
   isPremium: true (boolean)
   subscriptionStatus: "active" (string)
   subscriptionPlan: "premium" (string)
   ```

**Si `isPremium: false` ou absent** :
```bash
# Utiliser le script de correction
node fix_premium_status.mjs votre@email.com votremotdepasse
```

---

### Test 2 : Console Browser (Logs)

**Ouvrir DevTools** :
1. Aller sur https://wend-kabre-bf.vercel.app/assistant
2. Ouvrir Console (F12)
3. Taper un message
4. Regarder les logs :

**Si vous voyez** :
```
👤 User data: { email: "...", isPremium: false }
❌ Accès refusé : utilisateur non-Premium
```
→ Le champ Firestore est incorrect

**Si vous voyez** :
```
👤 User data: null
```
→ Le document utilisateur n'est pas chargé

**Si vous voyez** :
```
👤 User data: { email: "...", isPremium: true }
✅ Utilisateur Premium - Envoi du message
```
→ Tout fonctionne !

---

### Test 3 : Vérifier la Requête API

**DevTools Network** :
1. Onglet Network
2. Filter: Fetch/XHR
3. Taper un message
4. Chercher requête vers `/api/chat`

**Si HTTP 403** :
```json
{
  "error": "L'Assistant IA est réservé aux abonnés Premium..."
}
```
→ La vérification serveur bloque (champ Firestore incorrect)

**Si HTTP 200** :
→ La vérification serveur passe ✅

---

## 🛠️ Procédure de Correction Manuelle

### Option 1 : Firebase Console (Recommandé)

1. **Aller sur Firestore** :
   - https://console.firebase.google.com
   - Projet : wend-kabre-bf
   - Firestore Database

2. **Trouver l'utilisateur** :
   - Collection : `users`
   - Chercher par email

3. **Modifier les champs** :
   ```
   isPremium: true (boolean)
   subscriptionStatus: "active"
   subscriptionPlan: "premium"
   subscriptionStartDate: "2026-09-01T00:00:00Z"
   subscriptionEndDate: "2027-09-01T00:00:00Z"
   ```

4. **Sauvegarder**

5. **Rafraîchir la page** `/assistant`

---

### Option 2 : Script Node.js

```bash
# Dans le dossier du projet
node fix_premium_status.mjs votre@email.com votremotdepasse
```

**Sortie attendue** :
```
🔍 Recherche de l'utilisateur: votre@email.com
✅ UID: abc123def456...
📄 Données actuelles: { isPremium: false, ... }
⚠️  isPremium = false, correction...
✅ Statut Premium activé !
✅ Données finales: { isPremium: true, ... }
```

---

## 📊 Checklist de Vérification

### Côté Firestore
- [ ] Document `users/{uid}` existe
- [ ] Champ `isPremium` = `true` (boolean, pas string)
- [ ] Champ `subscriptionStatus` = `"active"`
- [ ] Champ `email` correspond à votre compte

### Côté Client
- [ ] Connecté avec le bon compte
- [ ] Page `/assistant` charge correctement
- [ ] Console logs montrent `isPremium: true`
- [ ] Pas de modal Premium qui s'affiche

### Côté Serveur
- [ ] Variables d'environnement configurées :
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] Logs Vercel ne montrent pas d'erreur
- [ ] Requête `/api/chat` retourne HTTP 200

---

## 🚨 Erreurs Fréquentes

### Erreur 1 : `isPremium` est une string

❌ **Incorrect** :
```javascript
isPremium: "true" // string
```

✅ **Correct** :
```javascript
isPremium: true // boolean
```

**Solution** : Modifier dans Firebase Console (Type: boolean)

---

### Erreur 2 : Document utilisateur absent

**Symptôme** : `User data: null`

**Solution** :
1. Vérifier que l'utilisateur s'est inscrit correctement
2. Créer manuellement le document dans Firestore :
   ```javascript
   {
     email: "votre@email.com",
     isPremium: true,
     subscriptionStatus: "active",
     subscriptionPlan: "premium",
     createdAt: new Date().toISOString()
   }
   ```

---

### Erreur 3 : Délai de chargement Firestore

**Symptôme** : `userData` est `null` temporairement

**Solution** : Attendre que `authReady = true`

Le code actuel gère déjà ce cas :
```javascript
{authReady && !authUser ? (
  // Message "Connexion requise"
) : (
  // Chatbox
)}
```

---

## 🔄 Après Correction

1. **Effacer le cache navigateur** (Ctrl+Shift+Delete)
2. **Rafraîchir la page** (Ctrl+R)
3. **Vérifier les logs console**
4. **Tester l'envoi d'un message**

**Si ça marche** :
```
✅ Message envoyé
✅ Réponse IA reçue avec citations articles de loi
✅ Renvoi au Guide /guide-soumission
```

---

## 📞 Support

**Si le problème persiste** :

1. **Fournir les informations suivantes** :
   - Email du compte
   - Screenshot de la console (logs)
   - Screenshot de Firestore (document user)
   - Screenshot de Network (requête /api/chat)

2. **Vérifier les logs Vercel** :
   - https://vercel.com/zida2/wend-kabre-bf/logs
   - Chercher erreurs liées à `/api/chat`

3. **Tester avec un autre compte Premium**
   - Créer un compte test
   - Activer Premium manuellement dans Firestore
   - Tester le chatbot

---

## 🚀 Déploiement des Corrections

**Commits** :
```bash
git add .
git commit -m "fix(chatbot): correction vérification Premium avec Firestore REST + logs debug"
git push origin master
```

**Attendre déploiement Vercel** (~2 minutes)

**Tester à nouveau** sur https://wend-kabre-bf.vercel.app/assistant

---

**✅ Ces corrections devraient résoudre le problème d'accès Premium au chatbot !**
