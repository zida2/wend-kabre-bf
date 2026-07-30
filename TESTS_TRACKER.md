# 🧪 Plan de Tests : Tracker de Dossier Interactif

## 📋 Checklist de Validation

### ✅ Tests Fonctionnels

#### 1. Accès au Tracker
- [ ] Depuis le Dashboard, un marché "En préparation" affiche le bouton "📁 Monter le dossier"
- [ ] Le clic sur ce bouton redirige vers `/marches/dossier?id={marcheId}`
- [ ] La page charge correctement avec les informations du marché
- [ ] Un utilisateur non authentifié est redirigé vers `/connexion`

#### 2. Affichage des Informations
- [ ] Le titre du marché s'affiche correctement
- [ ] La catégorie du marché est visible
- [ ] Le bouton "Retour au tableau de bord" fonctionne
- [ ] La barre de progression globale est visible et à 0% par défaut

#### 3. Checklist des Pièces Administratives
- [ ] Les 5 cases à cocher sont présentes et fonctionnelles
- [ ] Le clic sur une case la coche/décoche
- [ ] Les liens vers eSINTAX, CNSS, et ARCOP s'ouvrent dans un nouvel onglet
- [ ] Les cases cochées changent de couleur (fond vert)
- [ ] L'icône ✅ apparaît quand une case est cochée

#### 4. Génération de Documents ARCOP

**Lettre de Soumission :**
- [ ] Le bouton "Générer le document" est présent
- [ ] Si le profil est incomplet (pas de RCCM), un message d'erreur s'affiche
- [ ] Si le profil est complet, le clic génère un fichier .docx
- [ ] Le fichier téléchargé contient :
  - [ ] Le nom de l'entreprise
  - [ ] Le numéro RCCM
  - [ ] Le numéro IFU
  - [ ] Le titre du marché
  - [ ] La date du jour
  - [ ] Toutes les sections de la lettre
- [ ] La case "Lettre de soumission" se coche automatiquement après génération

**Déclaration de Probité :**
- [ ] Le bouton "Générer le document" est présent
- [ ] Même comportement que la Lettre de Soumission
- [ ] Le fichier contient les 5 articles de déclaration
- [ ] La case "Déclaration de probité" se coche automatiquement

#### 5. Gestion des Enveloppes
- [ ] Les 2 cases d'enveloppes sont présentes
- [ ] Elles peuvent être cochées/décochées indépendamment
- [ ] La description de chaque enveloppe est claire
- [ ] Les cases cochées changent de couleur

#### 6. Notes Personnelles
- [ ] La zone de texte pour les notes est présente
- [ ] Le texte saisi est conservé dans l'état local
- [ ] Les notes sont sauvegardées dans Firebase

#### 7. Sauvegarde
- [ ] Le bouton "Sauvegarder" est visible en haut à droite
- [ ] Le clic déclenche une sauvegarde
- [ ] Un toast de confirmation apparaît (fond vert)
- [ ] Le bouton affiche "Sauvegarde..." pendant le traitement
- [ ] Les données sont persistées dans Firebase
- [ ] Un rechargement de page restaure l'état sauvegardé

#### 8. Calcul de Progression
- [ ] La barre de progression reflète l'état des 9 cases
- [ ] Formule : (cases cochées / 9) × 100
- [ ] La progression passe de 0% à 100% selon les cases
- [ ] À 100%, un message de félicitation s'affiche
- [ ] La progression s'affiche aussi dans le Dashboard

#### 9. Intégration Dashboard
- [ ] Dans le Dashboard, colonne "En préparation"
- [ ] La progression (xx%) s'affiche sous chaque marché
- [ ] La progression est chargée depuis Firebase
- [ ] Un marché sans dossier affiche 0%

### ✅ Tests de Sécurité

#### 1. Authentification
- [ ] Un utilisateur non connecté ne peut pas accéder au Tracker
- [ ] Tentative d'accès direct à `/marches/dossier?id=xxx` sans auth → redirection `/connexion`

#### 2. Autorisation Firebase
- [ ] Un utilisateur A ne peut pas lire le dossier d'un utilisateur B
- [ ] Tentative de lecture : `dossiers/{userB}_{marcheId}` → Permission denied
- [ ] Un utilisateur ne peut créer un dossier qu'avec son propre userId

#### 3. Validation API
- [ ] L'API `/api/generate-doc` refuse les requêtes sans paramètres requis
- [ ] Erreur 400 si `type`, `entreprise`, ou `rccm` manquent
- [ ] Erreur 400 si `type` n'est ni "lettre-soumission" ni "declaration-probite"

### ✅ Tests d'Intégrité des Données

#### 1. Structure du Document Firestore
```javascript
const dossier = {
  userId: "abc123",
  marcheId: "marche456",
  attestationImpots: true,
  attestationCNSS: false,
  // ... autres champs
  lastUpdated: "2026-07-30T10:00:00.000Z"
}
```
- [ ] Tous les champs booléens existent
- [ ] `lastUpdated` est un timestamp valide
- [ ] `userId` correspond à l'utilisateur authentifié
- [ ] `marcheId` correspond au marché consulté

#### 2. Cohérence de Progression
- [ ] La progression dans le Dashboard correspond au calcul réel
- [ ] Après modification et sauvegarde, le Dashboard se met à jour
- [ ] Un rechargement du Dashboard reflète les derniers changements

### ✅ Tests de Performance

#### 1. Temps de Chargement
- [ ] La page Tracker charge en < 2 secondes
- [ ] Le Dashboard charge en < 3 secondes
- [ ] La génération d'un document prend < 5 secondes

#### 2. Réactivité UI
- [ ] Les cases se cochent instantanément (< 100ms)
- [ ] Le toast apparaît immédiatement après une action
- [ ] La barre de progression se met à jour en temps réel

### ✅ Tests de Compatibilité

#### 1. Navigateurs
- [ ] Chrome/Edge (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (si disponible sur Mac)

#### 2. Appareils
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablette (paysage et portrait)
- [ ] Mobile (responsive design)

#### 3. Systèmes d'exploitation
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux (Ubuntu/Debian)

### ✅ Tests d'Expérience Utilisateur

#### 1. Feedback Visuel
- [ ] Les cases cochées sont clairement différenciables
- [ ] La barre de progression est visible et claire
- [ ] Les toasts de confirmation sont lisibles
- [ ] Les boutons ont un effet hover

#### 2. Messages d'Erreur
- [ ] Les erreurs sont explicites et en français
- [ ] Un profil incomplet affiche un message clair
- [ ] Les erreurs de sauvegarde sont notifiées

#### 3. Guidage
- [ ] Les titres de sections sont clairs
- [ ] Les descriptions expliquent chaque élément
- [ ] Les liens externes sont identifiables (icône ExternalLink)

---

## 🔍 Scénarios de Test Complets

### Scénario 1 : Nouveau Dossier (Happy Path)
1. Se connecter à l'application
2. Naviguer vers `/marches`
3. Cliquer sur "⭐ Suivre ce marché" sur un marché
4. Aller au Dashboard
5. Passer le marché en "En préparation"
6. Cliquer sur "📁 Monter le dossier"
7. Vérifier que la progression est à 0%
8. Cocher toutes les cases des pièces administratives
9. Générer la Lettre de Soumission
10. Générer la Déclaration de Probité
11. Cocher les enveloppes
12. Ajouter une note
13. Cliquer sur "Sauvegarder"
14. Vérifier le toast de confirmation
15. Retourner au Dashboard
16. Vérifier que la progression affiche 100%

**Résultat attendu :** Toutes les étapes se déroulent sans erreur.

### Scénario 2 : Profil Incomplet
1. Se connecter avec un compte sans RCCM
2. Naviguer vers un dossier en préparation
3. Cliquer sur "Générer le document" pour la Lettre
4. Vérifier qu'un message d'erreur s'affiche
5. Aller dans Paramètres → Profil
6. Remplir le RCCM
7. Sauvegarder
8. Retourner au Tracker
9. Cliquer sur "Générer le document"
10. Vérifier que le document se télécharge

**Résultat attendu :** Le système empêche la génération sans RCCM, puis autorise après complétion.

### Scénario 3 : Reprise d'un Dossier en Cours
1. Se connecter
2. Naviguer vers un dossier existant (progression 45%)
3. Vérifier que les cases déjà cochées le sont toujours
4. Vérifier que les notes précédentes sont affichées
5. Cocher 2 cases supplémentaires
6. Sauvegarder
7. Actualiser la page
8. Vérifier que la progression a augmenté
9. Vérifier que les nouvelles cases sont toujours cochées

**Résultat attendu :** L'état est persisté et restauré correctement.

### Scénario 4 : Accès Non Autorisé
1. Se connecter avec le compte utilisateur A
2. Créer un dossier pour un marché
3. Noter l'URL : `/marches/dossier?id=marche123`
4. Se déconnecter
5. Se connecter avec le compte utilisateur B
6. Tenter d'accéder à l'URL du dossier de A
7. Vérifier qu'aucune donnée de A n'est visible
8. Vérifier que le dossier de B est vide (0%)

**Résultat attendu :** Isolation complète des données entre utilisateurs.

---

## 🐛 Bugs Connus et Solutions

### Bug #1 : Toast ne disparaît pas
**Symptôme :** Le toast reste affiché indéfiniment

**Solution :**
- Vérifier que le `setTimeout` dans `showToast()` est bien appelé
- Vérifier que `setToast(null)` est exécuté après 5 secondes

### Bug #2 : Progression ne se met pas à jour
**Symptôme :** La barre reste à 0% même après avoir coché des cases

**Solution :**
- Vérifier que `calculateProgress()` est appelé lors du render
- Vérifier que l'état `dossier` est bien mis à jour avec `setDossier()`

### Bug #3 : Document ne se télécharge pas
**Symptôme :** Clic sur "Générer" mais rien ne se passe

**Solution :**
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs API (Network tab)
- Vérifier que la bibliothèque `docx` est bien installée : `npm list docx`

---

## ✅ Checklist de Déploiement

Avant de mettre en production :

### Configuration
- [ ] Variables d'environnement Firebase configurées
- [ ] Règles Firestore déployées : `firebase deploy --only firestore:rules`
- [ ] `.env.production` contient les bonnes clés

### Build
- [ ] `npm run build` réussit sans erreur
- [ ] Aucun warning critique dans les logs
- [ ] Taille du bundle est acceptable (< 2 MB)

### Tests
- [ ] Tous les tests fonctionnels passent ✅
- [ ] Tous les tests de sécurité passent ✅
- [ ] Les scénarios complets fonctionnent ✅

### Documentation
- [ ] `TRACKER_DOSSIER.md` est à jour
- [ ] `IMPLEMENTATION_COMPLETE.md` est à jour
- [ ] `GUIDE_UTILISATEUR_TRACKER.md` est disponible

### Monitoring
- [ ] Firebase Analytics configuré
- [ ] Logs d'erreur surveillés (Sentry ou équivalent)
- [ ] Alertes en cas de panne configurées

---

## 📊 Métriques de Succès

### KPIs à surveiller
1. **Taux de complétion des dossiers** : % de dossiers atteignant 100%
2. **Temps moyen de constitution** : Durée entre 0% et 100%
3. **Documents générés** : Nombre de Lettres + Déclarations par mois
4. **Taux d'abandon** : % de dossiers commencés mais jamais complétés
5. **Satisfaction utilisateur** : Note sur 5 étoiles (formulaire de feedback)

### Objectifs
- 🎯 Taux de complétion : > 75%
- 🎯 Temps moyen : < 1 heure
- 🎯 Documents générés : > 100/mois
- 🎯 Taux d'abandon : < 20%
- 🎯 Satisfaction : > 4.5/5

---

## 🔄 Tests de Régression

Après chaque mise à jour, re-tester :
- ✅ Scénario 1 (Happy Path)
- ✅ Génération de documents
- ✅ Sauvegarde et restauration
- ✅ Calcul de progression

---

**Version :** 1.0.0  
**Date :** 30 juillet 2026  
**Responsable QA :** Équipe Wend-Kabré

