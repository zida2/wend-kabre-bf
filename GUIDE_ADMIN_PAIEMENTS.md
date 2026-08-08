# 👨‍💼 Guide Admin - Validation des Paiements OCR

## 📍 Accès au Dashboard Admin

### URL
```
https://wend-kabre-bf.vercel.app/admin
```

### Connexion
- **Email admin** : `zidadesire20@gmail.com`
- **Mot de passe** : Votre mot de passe Firebase

---

## 🎯 Section Paiements

### Accès
1. Connexion au dashboard admin
2. Cliquer sur **"💳 Paiements"** dans la sidebar gauche
3. Badge rouge indique le nombre de demandes en attente

---

## 📊 Vue d'ensemble

### Statistiques en haut de page

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">

**⏳ En attente**  
Nombre de paiements à valider

**✓ Validés**  
Historique des paiements approuvés

**✕ Rejetés**  
Demandes refusées

**💰 Total validé**  
Somme en FCFA des paiements validés

</div>

---

## 📋 Tableau des Paiements

### Colonnes

| Colonne | Description |
|---------|-------------|
| **👤 Utilisateur** | Nom complet + Email |
| **📅 Date de demande** | Date et heure de soumission |
| **💳 Plan & Montant** | Badge plan + montant en FCFA |
| **📱 Méthode** | Orange Money 🟠 ou Moov Money 🔵 |
| **🖼️ Preuve** | Bouton "👁️ Voir" pour screenshot |
| **🏷️ Statut** | Badge coloré (En attente / Validé / Rejeté) |
| **⚙️ Actions** | Boutons Approuver / Rejeter |

---

## 🔍 Filtres et Recherche

### Filtres disponibles

**Par statut** :
- ⏳ En attente
- ✓ Validé
- ✕ Rejeté

**Par méthode** :
- 🟠 Orange Money
- 🔵 Moov Money
- 💳 Money Fusion (futur)

### Barre de recherche
Rechercher par :
- Nom de l'utilisateur
- Email
- Plan (Premium, Enterprise)

---

## ✅ Validation d'un Paiement

### 1. Ouvrir le screenshot
- Cliquer sur **"👁️ Voir"**
- Une modale s'ouvre avec l'image du reçu

### 2. Vérifications à effectuer

**✓ Montant correct** :
- Premium : **15,000 FCFA**
- Enterprise : **55,000 FCFA**

**✓ Numéro de destinataire correct** :
- **Orange Money** : `62 20 28 77`
- **Moov Money** : `06 13 90 16`

**✓ Date récente** :
- Le paiement doit dater de moins de 7 jours

**✓ Message SMS complet** :
- Doit contenir : montant, numéro, date, confirmation

**✓ Utilisateur valide** :
- L'email correspond à un compte existant

### 3. Approuver le paiement
- Cliquer sur **"✓ Approuver"**
- Confirmation immédiate avec toast vert

### 4. Ce qui se passe automatiquement

**a) Mise à jour Firestore** :
```javascript
payment_requests → status: "approved"
                 → processedAt: Date actuelle
                 → processedBy: Votre email admin
```

**b) Activation de l'abonnement** :
```javascript
users → isSubscribed: true
      → subscriptionExpiresAt: Date + durée
      → lastPaymentDate: Date actuelle
```

Durées selon le plan :
- **Free / Starter** : 7 jours
- **Premium** : 30 jours
- **Enterprise** : 365 jours (1 an)

**c) Log d'audit créé** :
```javascript
admin_logs → action: "payment_approved"
           → message: "Paiement OCR validé — 15000 FCFA — user@example.com"
           → target: payment_request_id
           → targetUser: user_id
```

**d) Email de confirmation** (TODO) :
- Template "payment-approved"
- Envoyé automatiquement à l'utilisateur
- Contient : plan, montant, durée, lien dashboard

### 5. Notification utilisateur
✅ Toast de succès affiché :
```
Paiement validé ! Abonnement PREMIUM activé pour 30 jours.
```

---

## ❌ Rejet d'un Paiement

### Quand rejeter ?

**Motifs de rejet** :
- ❌ Screenshot illisible ou incomplet
- ❌ Montant incorrect
- ❌ Mauvais numéro de destinataire
- ❌ Transaction trop ancienne (> 7 jours)
- ❌ Doublon (déjà validé)
- ❌ Suspicion de fraude

### Procédure

1. **Cliquer sur "✕ Rejeter"**
2. Confirmation immédiate avec toast orange

### Ce qui se passe

**a) Mise à jour Firestore** :
```javascript
payment_requests → status: "rejected"
                 → processedAt: Date actuelle
                 → processedBy: Votre email admin
```

**b) Log d'audit** :
```javascript
admin_logs → action: "payment_rejected"
           → message: "Paiement OCR rejeté — 15000 FCFA — user@example.com"
```

**c) Email de rejet** (TODO) :
- Template "payment-rejected"
- Explique la raison du rejet
- Lien pour soumettre un nouveau paiement

**d) Notification admin** :
```
🚫 Demande de paiement rejetée.
```

### Bonne pratique
⚠️ **Contacter l'utilisateur** si rejet pour expliquer le problème et l'aider à soumettre un nouveau paiement correct.

---

## 💡 Box d'Instructions

En haut de la section Paiements, une box verte vous rappelle :

```
💡 Instructions de validation

Orange Money : 62 20 28 77 • Moov Money : 06 13 90 16

Vérifiez le montant, la date et le numéro de destinataire 
sur la preuve de paiement avant validation.
```

Cette box est visible **uniquement s'il y a des paiements en attente**.

---

## 📱 Numéros de Paiement

### Orange Money
- **Code USSD** : `*144#`
- **Numéro destinataire** : `62 20 28 77`
- **Opération** : Transfert d'argent

### Moov Money
- **Code USSD** : `*555#`
- **Numéro destinataire** : `06 13 90 16`
- **Opération** : Transfert d'argent

---

## 🚀 Workflow Complet

### Du côté utilisateur

```
1. User sur /tarifs clique "Souscrire au Premium"
   ↓
2. Modal Money Fusion tente paiement
   ↓
3. Money Fusion échoue → Redirection /paiement-ocr
   ↓
4. User voit instructions Orange/Moov Money
   ↓
5. User effectue le transfert via mobile
   ↓
6. User prend screenshot du SMS de confirmation
   ↓
7. User upload screenshot sur /paiement-ocr
   ↓
8. Soumission → Firestore payment_requests créé
   ↓
9. Message succès + redirection /dashboard?payment=pending
```

### Du côté admin (vous)

```
1. Notification email "Nouveau paiement à valider" (TODO)
   ↓
2. Connexion au dashboard admin
   ↓
3. Section Paiements → Badge rouge avec nombre en attente
   ↓
4. Clic "👁️ Voir" pour ouvrir screenshot
   ↓
5. Vérification : montant, numéro, date
   ↓
6. Si OK → Clic "✓ Approuver"
   ↓
7. Système active automatiquement l'abonnement
   ↓
8. Email confirmation envoyé au user (TODO)
   ↓
9. User reçoit accès immédiat à son compte Premium
```

---

## 📈 Statistiques Utiles

### Suivi des paiements
- **Taux d'approbation** : Validés / (Validés + Rejetés)
- **Délai de traitement** : Temps entre soumission et validation
- **Revenu total** : Somme des paiements validés

### Exemples de KPIs
```
⏳ En attente : 3 demandes
✓ Validés : 47 paiements
✕ Rejetés : 2 paiements
💰 Total validé : 705,000 FCFA

Taux d'approbation : 95.9%
Revenu moyen : 15,000 FCFA/paiement
```

---

## 🔔 Notifications (TODO)

### Email admin à implémenter

**Quand ?**
- Nouveau paiement soumis → Email immédiat

**Contenu** :
```
Sujet : 🔔 Nouveau paiement à valider - Wend-Kabré

Bonjour Admin,

Un nouveau paiement vient d'être soumis :

👤 Utilisateur : John Doe (john@example.com)
💳 Plan : PREMIUM
💰 Montant : 15,000 FCFA
📱 Méthode : Orange Money
📅 Date : 8 août 2026 à 15:30

🔗 Valider maintenant : https://wend-kabre-bf.vercel.app/admin

---
Wend-Kabré Admin Panel
```

### Badge notification

Dans la sidebar, afficher un badge rouge avec le nombre de paiements en attente :

```
💳 Paiements [3]
```

---

## 🛠️ Dépannage

### Problème : Screenshot ne s'affiche pas
**Solution** : Vérifier les règles Firebase Storage, l'URL doit être publique ou accessible avec token

### Problème : Bouton "Approuver" ne fonctionne pas
**Solution** : 
1. Ouvrir la console navigateur (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier les permissions Firestore

### Problème : Abonnement non activé après validation
**Solution** :
1. Vérifier logs dans console admin
2. Vérifier collection `users` dans Firestore
3. Champs à vérifier : `isSubscribed`, `subscriptionExpiresAt`, `lastPaymentDate`

### Problème : User ne reçoit pas d'email
**Solution** :
1. Emails non implémentés pour le moment (TODO)
2. Contacter user manuellement via email/WhatsApp
3. Intégrer SendGrid/Resend (voir EMAIL_TEMPLATES.md)

---

## 📞 Support Utilisateurs

### Canaux de contact

**Email** : `contact@wend-kabre.com`  
**WhatsApp** : `+226 06 13 90 16`  
**Horaires** : Lundi au Vendredi, 8h-18h

### Messages types

**Paiement validé** :
```
Bonjour [Nom],

Votre paiement de [Montant] FCFA a été validé avec succès !

Votre abonnement [Plan] est maintenant actif pour [Durée] jours.

Accédez à votre compte : https://wend-kabre-bf.vercel.app/dashboard

Merci de votre confiance !
L'équipe Wend-Kabré
```

**Paiement rejeté** :
```
Bonjour [Nom],

Votre demande de paiement n'a pas pu être validée.

Raison : [Motif du rejet]

Pour soumettre un nouveau paiement :
https://wend-kabre-bf.vercel.app/paiement-ocr?plan=[plan]&amount=[montant]

Besoin d'aide ? Contactez-nous sur WhatsApp : 06 13 90 16

Cordialement,
L'équipe Wend-Kabré
```

---

## ✅ Checklist Quotidienne

### Tâches admin

- [ ] Vérifier les nouveaux paiements en attente
- [ ] Valider ou rejeter chaque demande sous 24h
- [ ] Contacter les users en cas de rejet
- [ ] Vérifier les logs d'audit pour anomalies
- [ ] Surveiller le taux d'approbation
- [ ] Répondre aux messages support

---

## 🔐 Sécurité

### Bonnes pratiques

✅ **Ne jamais partager les credentials admin**  
✅ **Vérifier chaque paiement manuellement**  
✅ **Documenter les rejets dans les logs**  
✅ **Surveiller les tentatives de fraude**  
✅ **Sauvegarder régulièrement Firestore**

### Signaux d'alerte

🚨 **Plusieurs paiements du même user** : Vérifier doublon  
🚨 **Montant incohérent** : Contacter user avant validation  
🚨 **Screenshot flou** : Demander une nouvelle photo  
🚨 **Numéro incorrect** : Probable erreur, rejeter  
🚨 **Date > 7 jours** : Transaction trop ancienne, rejeter  

---

## 📚 Documentation Associée

### Fichiers à consulter

1. **FALLBACK_PAIEMENT_STATUS.md**  
   Documentation complète du système de fallback

2. **EMAIL_TEMPLATES.md**  
   Templates HTML pour SendGrid/Resend

3. **GO_LIVE_REPORT.md**  
   Rapport de mise en production

4. **CHECKLIST_GO_LIVE.md**  
   Checklist pré-lancement

---

## 🎯 Prochaines Étapes

### Intégration Email

1. **Choisir provider** : SendGrid ou Resend
2. **Créer compte** et récupérer API key
3. **Créer route API** : `/api/send-email/route.ts`
4. **Décommenter code email** dans `admin/page.js`
5. **Tester envoi** en local puis production
6. **Configurer SPF/DKIM** pour domaine wend-kabre.com

### Notifications Admin

1. **Trigger Firestore** : Écouter nouveaux `payment_requests`
2. **Cloud Function** : Envoyer email admin
3. **Badge sidebar** : Afficher nombre en attente
4. **Son notification** : Alerte sonore (optionnel)

---

**Date** : 8 août 2026  
**Version** : 1.0  
**Auteur** : Zida Désiré  
**Contact** : zidadesire20@gmail.com  
**Status** : ✅ Dashboard opérationnel
