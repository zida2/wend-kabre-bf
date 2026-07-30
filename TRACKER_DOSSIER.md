# 📁 Tracker de Dossier Interactif

## Vue d'ensemble

Le **Tracker de Dossier Interactif** est un outil complet qui guide les PME burkinabè dans la constitution de leurs dossiers de candidature aux marchés publics.

## Fonctionnalités principales

### 1. Espace de Montage Dédié
Chaque marché en préparation dispose de son propre espace de travail accessible via :
- **Depuis le Dashboard** : Bouton "📁 Monter le dossier" dans la colonne "En préparation" du Kanban CRM

### 2. Barre de Progression Globale
- Affichage en temps réel de l'avancement (0% à 100%)
- Visualisation sur le dashboard dans le Kanban
- Indicateur de complétude du dossier

### 3. Pièces Administratives Centralisées
Au lieu de chercher sur Google, l'outil fournit :

#### Attestations avec accès direct
- ✅ **Attestation de non-redevance fiscale** → Lien direct vers [eSINTAX](https://esintax.impots.bf)
- ✅ **Attestation CNSS à jour** → Lien direct vers [CNSS](https://www.cnss.bf)
- ✅ **Copie du RCCM** (Document CEFORE/Guichet Unique)
- ✅ **Copie de l'IFU** (Identifiant Fiscal Unique)
- ✅ **Agrément ARCOP** → Lien direct vers [ARCOP](https://www.arcop.bf)

Chaque pièce dispose d'une **case à cocher** qui persiste dans la base de données Firebase.

### 4. Génération Automatique ARCOP
L'outil génère automatiquement les documents officiels **pré-remplis** avec :
- Les références du marché spécifique (N° AAO, Objet)
- Les informations de l'entreprise (Nom, RCCM, IFU)

#### Documents générés
- 📄 **Lettre de Soumission**
- 📄 **Déclaration de Probité**

> ⚠️ **Pré-requis** : Le profil utilisateur doit contenir le RCCM et l'IFU pour générer les documents.

### 5. Gestion des Enveloppes
L'interface guide visuellement l'organisation des documents :

- **Enveloppe 1 — Documents Administratifs**
  - Attestations (Impôts, CNSS, RCCM, IFU)
  - Agrément ARCOP
  
- **Enveloppe 2 — Offre Technique & Financière**
  - Lettre de soumission
  - Déclaration de probité
  - Devis détaillé

### 6. Notes Personnelles
Zone de texte libre pour ajouter :
- Remarques spécifiques au marché
- Points à vérifier
- Rappels importants

## Architecture Technique

### Pages
```
src/app/(client)/marches/dossier/page.js
```
- Page dédiée au montage de dossier
- Route : `/marches/dossier?id={marcheId}`

### Base de données Firebase

#### Collection `dossiers`
Document ID format : `{userId}_{marcheId}`

**Structure du document** :
```javascript
{
  userId: string,
  marcheId: string,
  
  // Pièces administratives
  attestationImpots: boolean,
  attestationCNSS: boolean,
  attestationRCCM: boolean,
  attestationIFU: boolean,
  attestationARCOP: boolean,
  
  // Documents ARCOP
  lettresoumission: boolean,
  declarationProbite: boolean,
  
  // Enveloppes
  enveloppe1Complete: boolean,
  enveloppe2Complete: boolean,
  
  // Notes
  notes: string,
  
  // Métadonnées
  lastUpdated: timestamp
}
```

#### Règles Firestore
```javascript
match /dossiers/{dossierId} {
  allow read:   if isSignedIn() && request.auth.uid == resource.data.userId;
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update: if isSignedIn() && request.auth.uid == resource.data.userId;
  allow delete: if isSignedIn() && request.auth.uid == resource.data.userId;
}
```

### Modifications apportées

#### 1. Dashboard (`src/app/(client)/dashboard/page.js`)
- Ajout du bouton "📁 Monter le dossier" dans la colonne "En préparation"
- Affichage de la barre de progression (xx%) pour chaque marché
- Chargement automatique de l'avancement depuis Firebase

#### 2. Règles Firestore (`firestore.rules`)
- Ajout de la collection `dossiers` avec sécurité propriétaire

## Flux Utilisateur

1. **Ajouter un marché au CRM**
   - Depuis la page `/marches`, cliquer sur "⭐ Suivre ce marché"
   - Marquer le statut "En préparation"

2. **Accéder au Tracker**
   - Depuis le Dashboard, cliquer sur "📁 Monter le dossier"

3. **Constituer le dossier**
   - Télécharger les attestations via les liens fournis
   - Cocher les cases au fur et à mesure
   - Générer les documents ARCOP
   - Vérifier les enveloppes

4. **Sauvegarder**
   - Cliquer sur "Sauvegarder" pour persister l'état
   - La progression s'affiche automatiquement sur le Dashboard

5. **Soumettre**
   - Une fois 100% atteint, passer le marché en statut "Soumis"

## Avantages

✅ **Gain de temps** : Fini les recherches Google pour trouver les plateformes officielles  
✅ **Zéro oubli** : Checklist exhaustive des pièces requises  
✅ **Documents conformes** : Génération automatique selon les normes ARCOP  
✅ **Suivi permanent** : La progression est sauvegardée et synchronisée  
✅ **Guidance visuelle** : Organisation claire par enveloppes  

## Prochaines Étapes

- [ ] Notifications par email/WhatsApp quand un document manquant est critique
- [ ] Templates ARCOP enrichis (autres documents selon le type de marché)
- [ ] Export PDF du dossier complet
- [ ] Intégration d'un module de signature électronique
- [ ] Guide vidéo contextuel pour chaque étape

---

**Version** : 1.0.0  
**Date** : 30 juillet 2026  
**Auteur** : Équipe Wend-Kabré
