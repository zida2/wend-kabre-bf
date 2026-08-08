# 🔄 Système de Fallback Paiement - Documentation

## 📋 Résumé

En attendant l'approbation et les credentials Money Fusion, un **système de paiement de secours (fallback)** a été mis en place pour permettre aux utilisateurs de payer dès maintenant.

## ✅ Ce qui a été implémenté

### 1. Page Contact pour Plan Entreprise (/contact)

**Problème résolu** : Cliquer sur "Contacter les ventes" (plan Entreprise) redirige vers page noire vide

**Solution** : Page `/contact` complète créée

#### Fonctionnalités
- **Formulaire de contact professionnel**
  - Nom complet (requis)
  - Email professionnel (requis)
  - Téléphone (requis)
  - Nom de l'entreprise (requis)
  - Plan souhaité (select: Premium / Enterprise / Custom)
  - Message (textarea libre)

- **Design moderne**
  - Hero section avec badge "Plan Entreprise"
  - Card glassmorphism pour le formulaire
  - États: normal / loading / success / error
  - Bouton submit avec loader animé
  - Message de succès avec ✓ et redirection auto

- **Informations de contact alternatives**
  - Email : contact@wend-kabre.com
  - WhatsApp : +226 70 00 00 00
  - Horaires : Lun-Ven 8h-18h

- **Tracking analytics**
  - `contact_form_submit` : Soumission formulaire
  - `contact_form_success` : Succès envoi

#### TODO Backend
```javascript
// À intégrer avec service d'email (SendGrid, Resend, etc.)
// Actuellement en console.log - remplacer par vraie API
```

---

### 2. Page Paiement OCR Temporaire (/paiement-ocr)

**Problème résolu** : Impossible de payer tant que Money Fusion n'est pas approuvé

**Solution** : Système de paiement manuel Orange Money avec validation sous 24h

#### Workflow utilisateur

1. **User sur /tarifs** clique "Souscrire au Premium 🚀"
2. **Modal Money Fusion** s'ouvre et tente l'appel API
3. **Si Money Fusion échoue** → Redirection automatique vers `/paiement-ocr?plan=premium&amount=15000`
4. **User voit bandeau** "⚠️ Mode de paiement temporaire"
5. **Instructions Orange Money** affichées step-by-step :
   ```
   #144*82# → Transfert → +226 70 00 00 00 → 15,000 FCFA → Screenshot SMS
   ```
6. **User upload screenshot** via drag & drop ou sélection
7. **Aperçu image** affiché avant soumission
8. **Submit** → Sauvegarde Firestore `payment_requests` collection
9. **Message succès** "✓ Paiement en cours de validation"
10. **Redirection auto** vers `/dashboard?payment=pending` après 3s

#### Stockage Firestore

Collection : `payment_requests`

```javascript
{
  userId: "firebase-user-id",
  userEmail: "user@example.com",
  plan: "PREMIUM", // ou "ENTERPRISE"
  amount: 15000,
  paymentMethod: "ORANGE_MONEY_OCR",
  status: "PENDING",
  screenshotName: "screenshot.jpg",
  screenshotSize: 123456,
  createdAt: Timestamp,
  processedAt: null,
  notes: "En attente de validation manuelle - Système OCR temporaire"
}
```

#### Design
- **Bandeau avertissement** orange avec icône ⚠️
- **Instructions Orange Money** numérotées avec highlights
- **Zone drag & drop** stylée avec aperçu image
- **Bouton submit** avec loader et états disabled
- **Message succès** avec animation et redirection

#### Tracking analytics
- `payment_ocr_submit` : Soumission preuve paiement
- `payment_fallback_ocr` : Fallback depuis Money Fusion
- `payment_error_fallback` : Erreur réseau → fallback

---

### 3. Logique de Fallback Automatique dans /tarifs

**Modification** : `handleMoneyFusionPayment()` dans `src/app/(client)/tarifs/page.js`

#### Comportement avant
```javascript
if (data.success && data.paymentUrl) {
  window.location.href = data.paymentUrl;
} else {
  setErrorMessage(data.error);  // ❌ User bloqué
}
```

#### Comportement après
```javascript
if (data.success && data.paymentUrl) {
  // ✅ Money Fusion fonctionne
  track('payment_redirect', { planId, reference });
  window.location.href = data.paymentUrl;
} else {
  // 🔄 FALLBACK vers OCR
  console.warn('Money Fusion indisponible, fallback vers ancien système');
  track('payment_fallback_ocr', { planId, reason: data.error });
  setShowPayModal(false);
  router.push(`/paiement-ocr?plan=${planId.toLowerCase()}&amount=${finalPrice}`);
}

// En cas d'erreur réseau
catch (error) {
  // 🔄 FALLBACK aussi
  track('payment_error_fallback', { planId, error: error.message });
  setShowPayModal(false);
  router.push(`/paiement-ocr?plan=${planId.toLowerCase()}&amount=${finalPrice}`);
}
```

#### Avantages
- ✅ **User jamais bloqué** - toujours une solution de paiement
- ✅ **Transition transparente** - si Money Fusion échoue, OCR prend le relais
- ✅ **Tracking précis** - on sait combien de users utilisent le fallback
- ✅ **Message d'avertissement** - user informé que c'est temporaire

---

## 🎯 Flux utilisateur complet

### Scénario 1 : Money Fusion fonctionne (futur)
```
/tarifs → Modal → Money Fusion API ✓ → Redirection Money Fusion → Paiement → Webhook → Success
```

### Scénario 2 : Money Fusion indisponible (actuel)
```
/tarifs → Modal → Money Fusion API ❌ → /paiement-ocr → Upload screenshot → Firestore → Dashboard
                                           ↓
                                    Validation manuelle
                                      sous 24h
```

### Scénario 3 : Plan Entreprise
```
/tarifs → Click "Contacter les ventes" → /contact → Formulaire → Email équipe → Callback sous 24h
```

---

## 📊 Statistiques attendues

### Pendant la période de fallback
```
Paiements Money Fusion: 0%
Paiements OCR fallback: 100%
Conversion /contact: X%
```

### Après activation Money Fusion
```
Paiements Money Fusion: ~95%  (instantané)
Paiements OCR fallback: ~5%   (si problème technique)
Conversion /contact: X%
```

---

## 🔧 Validation manuelle des paiements OCR

### Dashboard Admin Amélioré ✅

Le dashboard admin a été **amélioré** avec une interface complète pour gérer les paiements OCR :

#### 1. **Section Paiements (`/admin` → Paiements)**

**Statistiques en temps réel** :
- ⏳ **Nombre en attente** : Demandes à valider
- ✓ **Nombre validés** : Historique des paiements approuvés
- ✕ **Nombre rejetés** : Demandes refusées
- 💰 **Total validé** : Somme en FCFA des paiements approuvés

**Tableau des paiements avec** :
- 👤 **Utilisateur** : Nom + Email
- 📅 **Date de demande** : Format court + heure
- 💳 **Plan & Montant** : Badge plan + montant formaté
- 📱 **Méthode** : Orange Money 🟠 / Moov Money 🔵 avec icône
- 🖼️ **Preuve** : Bouton "Voir" pour screenshot + info fichier (nom, taille)
- 🏷️ **Statut** : Badge coloré (En attente / Validé / Rejeté) + date de traitement
- ⚙️ **Actions** : 
  - Bouton "✓ Approuver" (vert)
  - Bouton "✕ Rejeter" (rouge)
  - Disposés en colonne pour meilleure lisibilité

**Box d'instructions** (visible si paiements en attente) :
```
💡 Instructions de validation
Orange Money : 62 20 28 77 • Moov Money : 06 13 90 16
Vérifiez le montant, la date et le numéro de destinataire sur la preuve de paiement avant validation.
```

**Filtres** :
- 📊 **Par statut** : En attente / Validé / Rejeté
- 💳 **Par méthode** : Orange Money / Moov Money / Money Fusion
- 🔍 **Recherche** : Par nom, email ou plan

**Tri et pagination** :
- Tri par date, statut, utilisateur
- 15 résultats par page

#### 2. **Workflow de Validation**

Quand l'admin clique sur **"✓ Approuver"** :

1. ✅ **Mise à jour Firestore `payment_requests`** :
   ```javascript
   {
     status: "approved",
     processedAt: "2026-08-08T15:30:00Z",
     processedBy: "admin@wend-kabre.com"
   }
   ```

2. 🎯 **Activation automatique de l'abonnement** :
   - **Starter / Free** → 7 jours
   - **Premium** → 30 jours
   - **Enterprise** → 365 jours (1 an)
   
3. 📝 **Création log d'audit admin** :
   ```javascript
   {
     action: "payment_approved",
     message: "Paiement OCR validé — 15000 FCFA — user@example.com",
     target: "payment_request_id",
     targetUser: "user_id",
     amount: 15000,
     plan: "premium",
     createdAt: Timestamp
   }
   ```

4. 📧 **Email de confirmation** (TODO) :
   - Template "payment-approved"
   - Variables : nom, plan, montant, durée, date
   - Lien vers dashboard

5. 🎉 **Toast succès** :
   ```
   ✅ Paiement validé ! Abonnement PREMIUM activé pour 30 jours.
   ```

Quand l'admin clique sur **"✕ Rejeter"** :

1. ❌ **Mise à jour Firestore** :
   ```javascript
   {
     status: "rejected",
     processedAt: "2026-08-08T15:30:00Z",
     processedBy: "admin@wend-kabre.com"
   }
   ```

2. 📝 **Log d'audit** :
   ```javascript
   {
     action: "payment_rejected",
     message: "Paiement OCR rejeté — 15000 FCFA — user@example.com",
     ...
   }
   ```

3. 📧 **Email de rejet** (TODO) :
   - Template "payment-rejected"
   - Raison du rejet
   - Lien pour soumettre nouveau paiement

4. ℹ️ **Toast info** :
   ```
   🚫 Demande de paiement rejetée.
   ```

#### 3. **Modale Screenshot**

Quand l'admin clique sur **"👁️ Voir"** :
- Overlay avec flou backdrop
- Image centrée, max 70vh
- Bouton fermer en haut à droite
- Titre "Reçu de paiement"

#### 4. **Données Firestore**

Collection : `payment_requests`

**Avant validation** :
```javascript
{
  id: "auto-generated-id",
  userId: "user-firebase-id",
  userEmail: "user@example.com",
  plan: "PREMIUM",
  amount: 15000,
  paymentMethod: "ORANGE_MONEY_OCR", // ou MOOV_MONEY_OCR
  status: "PENDING",
  screenshot: "https://firebasestorage...",
  screenshotName: "screenshot.jpg",
  screenshotSize: 245678,
  createdAt: Timestamp,
  processedAt: null,
  processedBy: null,
  notes: "En attente de validation manuelle - Système OCR temporaire"
}
```

**Après validation** :
```javascript
{
  // ... mêmes champs
  status: "approved", // ou "rejected"
  processedAt: Timestamp,
  processedBy: "zidadesire20@gmail.com"
}
```

---

### Process admin détaillé

1. **Recevoir notification** (TODO)
   - Email admin : "Nouveau paiement à valider"
   - Badge rouge sur section Paiements dans sidebar

2. **Ouvrir dashboard admin** 
   - https://wend-kabre-bf.vercel.app/admin
   - Connexion avec compte admin
   - Cliquer sur "💳 Paiements" dans sidebar

3. **Consulter la liste**
   - Voir statistiques rapides en haut
   - Filtrer par "En attente" si besoin
   - Trier par date (plus récent en premier)

4. **Pour chaque demande en attente** :
   - Cliquer sur "👁️ Voir" pour ouvrir screenshot
   - **Vérifier** :
     * ✅ Le montant correspond au plan
     * ✅ La date est récente (< 7 jours)
     * ✅ Le numéro de destinataire est correct :
       - Orange Money : **62 20 28 77**
       - Moov Money : **06 13 90 16**
     * ✅ Le message SMS est clair et complet
     * ✅ L'utilisateur existe et l'email correspond

5. **Valider ou Rejeter**
   - Si tout est OK → Cliquer "✓ Approuver"
   - Si problème → Cliquer "✕ Rejeter"
   - Attendre le toast de confirmation
   - Vérifier que le statut passe à "Validé" ou "Rejeté"

6. **Notification utilisateur** (TODO)
   - Email automatique envoyé
   - User reçoit confirmation ou raison du rejet

---

### Code exemple validation (déjà implémenté)

```javascript
// src/app/(admin)/admin/page.js
const handleRequestAction = async (requestId, userId, planId, status) => {
  try {
    const request = paymentRequests.find(r => r.id === requestId);
    const requestUser = usersList.find(u => u.id === userId);
    
    // 1. Mettre à jour Firestore
    await updateDoc(doc(db, 'payment_requests', requestId), { 
      status,
      processedAt: new Date().toISOString(),
      processedBy: user.email
    });
    
    if (status === 'approved') {
      // 2. Déterminer durée selon plan
      let days = 30;
      const planLower = (planId || '').toLowerCase();
      if (planLower === 'starter' || planLower === 'free') days = 7;
      else if (planLower === 'premium') days = 30;
      else if (planLower === 'enterprise') days = 365;
      
      // 3. Activer abonnement
      await applySubscription(userId, days);
      
      // 4. Log admin
      await logAdminAction('payment_approved', {
        message: `Paiement OCR validé — ${request?.amount} FCFA — ${requestUser?.email}`,
        target: requestId,
        targetUser: userId,
        amount: request?.amount,
        plan: planId,
      });
      
      // 5. TODO: Envoyer email
      // await fetch('/api/send-email', { ... });
      
      showToast(`✅ Paiement validé ! Abonnement ${planId.toUpperCase()} activé pour ${days} jours.`, 'success');
    } 
    else if (status === 'rejected') {
      await logAdminAction('payment_rejected', { ... });
      // TODO: Email rejet
      showToast('🚫 Demande de paiement rejetée.', 'info');
    }
    
    fetchAdminData();
  } catch (err) {
    console.error(err);
    showToast('❌ Erreur : ' + err.message, 'error');
  }
};
```

---

## 📝 TODO Liste

### Court terme (avant credentials Money Fusion)
- [x] Page `/contact` créée
- [x] Page `/paiement-ocr` créée
- [x] Logique fallback dans `/tarifs`
- [x] Tracking analytics en place
- [x] **Dashboard admin validation paiements OCR** ✅
  - [x] Section Paiements améliorée avec statistiques
  - [x] Colonnes enrichies (méthode, date formatée, etc.)
  - [x] Filtres par statut et méthode de paiement
  - [x] Box d'instructions pour validation
  - [x] Workflow complet validation/rejet
  - [x] Logs d'audit automatiques
  - [x] Activation automatique abonnement selon plan
- [ ] **Intégration service email** (SendGrid/Resend)
  - [x] Templates HTML créés (EMAIL_TEMPLATES.md)
  - [ ] Créer route API `/api/send-email`
  - [ ] Décommenter code email dans admin
  - [ ] Tester envoi emails
- [ ] **Notifications admin** quand nouveau payment_request
  - [ ] Email admin sur nouvelle demande
  - [ ] Badge notification sur sidebar

### Long terme (après Money Fusion)
- [ ] Récupérer credentials Money Fusion
- [ ] Mettre à jour variables Render
- [ ] Tester Money Fusion end-to-end
- [ ] **Garder le fallback OCR** comme backup (en cas de panne Money Fusion)
- [ ] Monitoring : ratio Money Fusion vs OCR fallback

---

## 🎨 Design Highlights

### Page Contact
- Hero avec badge "Plan Entreprise"
- Formulaire 2 colonnes responsive (email + phone)
- Select pour choix de plan
- Textarea pour message libre
- Grid 3 colonnes pour infos contact alternatives
- Animation submit → success

### Page Paiement OCR
- **Bandeau warning orange** bien visible
- **Instructions Orange Money** numérotées en liste <ol>
- **Montant en highlight** vert avec `.toLocaleString()`
- **Zone drag & drop** avec preview image
- **États clairs** : vide / avec image / loading / success
- **Message succès** avec redirection countdown

### Page Tarifs (inchangée visuellement)
- Modal glassmorphism premium conservé
- Fallback **silencieux** pour le user (pas de message d'erreur)
- Redirection fluide vers `/paiement-ocr` si Money Fusion échoue

---

## 🔗 Liens utiles

- **Page contact** : https://wend-kabre-bf.vercel.app/contact
- **Page OCR** : https://wend-kabre-bf.vercel.app/paiement-ocr?plan=premium&amount=15000
- **Page tarifs** : https://wend-kabre-bf.vercel.app/tarifs
- **Collection Firestore** : `payment_requests`

---

## 📱 Numéro Orange Money

**Numéro destinataire** : `+226 70 00 00 00`

⚠️ **À remplacer par le vrai numéro Orange Money de Wend-Kabré**

Lieux à modifier :
1. `src/app/(client)/paiement-ocr/page.js` ligne ~80
2. `src/app/(client)/contact/page.js` ligne ~236 (WhatsApp)

---

## 🚀 Déploiement

### Commit & Push
```bash
git add -A
git commit -m "feat: ajout fallback paiement OCR et page contact Entreprise"
git push origin master
```

### Vercel
- Déploiement automatique sur push master
- URL : https://wend-kabre-bf.vercel.app

### Variables d'environnement
Aucune nouvelle variable requise - utilise Firebase existant

---

## ✅ Tests à effectuer

### 1. Page Contact
- [ ] Ouvrir https://wend-kabre-bf.vercel.app/contact
- [ ] Remplir le formulaire complet
- [ ] Submit → Vérifier message succès
- [ ] Vérifier console pour log des données (TODO: intégrer email)

### 2. Page Paiement OCR
- [ ] Ouvrir https://wend-kabre-bf.vercel.app/paiement-ocr?plan=premium&amount=15000
- [ ] Vérifier bandeau warning affiché
- [ ] Vérifier instructions Orange Money
- [ ] Upload une image test
- [ ] Vérifier aperçu image
- [ ] Submit → Vérifier message succès
- [ ] Vérifier Firestore collection `payment_requests` créée

### 3. Fallback automatique
- [ ] Ouvrir https://wend-kabre-bf.vercel.app/tarifs
- [ ] Se connecter avec un compte test
- [ ] Cliquer "Souscrire au Premium"
- [ ] Modal s'ouvre → cliquer "Procéder au paiement"
- [ ] **Money Fusion échoue** → Redirection automatique vers `/paiement-ocr`
- [ ] Vérifier que l'URL contient `plan=premium&amount=15000`

### 4. Plan Entreprise
- [ ] Ouvrir https://wend-kabre-bf.vercel.app/tarifs
- [ ] Cliquer "Contacter les ventes" (plan Entreprise)
- [ ] **Vérifier redirection vers /contact** (plus de page noire)
- [ ] Formulaire pré-rempli avec `plan=ENTERPRISE`

---

## 📊 Résumé final

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Page `/contact` | ✅ Terminé | Formulaire complet, design moderne |
| Page `/paiement-ocr` | ✅ Terminé | Upload screenshot, Firestore storage |
| Fallback automatique | ✅ Terminé | Redirection si Money Fusion échoue |
| Tracking analytics | ✅ Terminé | 3 nouveaux events trackés |
| Dashboard admin validation | ✅ Terminé | Interface complète avec stats, filtres, workflow |
| Templates email | ✅ Terminé | 3 templates HTML prêts (EMAIL_TEMPLATES.md) |
| Service email API | ⏳ TODO | Route `/api/send-email` à créer |
| Notifications admin | ⏳ TODO | Email + badge quand nouveau payment_request |

---

**Date** : 8 août 2026  
**Version** : 1.0  
**Commits** : `82aaa34` (features), `c62ab05` (docs)  
**Statut** : ✅ Système de fallback opérationnel
