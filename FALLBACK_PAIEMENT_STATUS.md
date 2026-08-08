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

### Process admin à implémenter

1. **Dashboard admin** → Section "Paiements en attente"
2. **Liste des payment_requests** avec `status: PENDING`
3. **Pour chaque demande** :
   - Afficher screenshot
   - Vérifier montant, date, numéro
   - Valider ✓ ou rejeter ✗
4. **Si validé** :
   - Créer transaction dans `payment_transactions`
   - Activer abonnement user
   - Mettre à jour `payment_requests.status = APPROVED`
   - Envoyer email confirmation
5. **Si rejeté** :
   - Mettre à jour `payment_requests.status = REJECTED`
   - Envoyer email avec raison

### Code exemple validation
```javascript
// pages/api/admin/validate-payment.ts
export async function POST(req) {
  const { requestId, action } = await req.json();
  
  if (action === 'approve') {
    // 1. Récupérer payment_request
    const request = await getDoc(doc(db, 'payment_requests', requestId));
    
    // 2. Créer transaction SUCCESS
    await addDoc(collection(db, 'payment_transactions'), {
      userId: request.userId,
      amount: request.amount,
      planId: request.plan,
      status: 'SUCCESS',
      paymentMethod: 'ORANGE_MONEY_MANUAL',
      reference: `WK-MANUAL-${Date.now()}`,
      createdAt: new Date()
    });
    
    // 3. Activer abonnement
    await updateDoc(doc(db, 'users', request.userId), {
      subscriptionPlan: request.plan,
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: new Date()
    });
    
    // 4. Update request
    await updateDoc(doc(db, 'payment_requests', requestId), {
      status: 'APPROVED',
      processedAt: new Date()
    });
    
    // 5. Envoyer email
    await sendEmail({
      to: request.userEmail,
      subject: 'Paiement validé - Wend-Kabré',
      template: 'payment-approved'
    });
  }
}
```

---

## 📝 TODO Liste

### Court terme (avant credentials Money Fusion)
- [x] Page `/contact` créée
- [x] Page `/paiement-ocr` créée
- [x] Logique fallback dans `/tarifs`
- [x] Tracking analytics en place
- [ ] **Dashboard admin validation paiements OCR**
- [ ] **Intégration service email** (SendGrid/Resend) pour contact form
- [ ] **Notifications admin** quand nouveau payment_request

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
| Dashboard admin validation | ⏳ TODO | Nécessaire pour valider paiements OCR |
| Service email contact | ⏳ TODO | Remplacer console.log par SendGrid |
| Notifications admin | ⏳ TODO | Email quand nouveau payment_request |

---

**Date** : 8 août 2026  
**Version** : 1.0  
**Commits** : `82aaa34` (features), `c62ab05` (docs)  
**Statut** : ✅ Système de fallback opérationnel
