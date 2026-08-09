# 🚀 Guide de Migration : Studio de Candidature

**Date** : 9 août 2026  
**Version** : 2.0 - Page Dédiée  
**Status** : ✅ Implémenté

---

## 📋 TABLE DES MATIÈRES

1. [Résumé des Changements](#résumé-des-changements)
2. [Architecture Avant/Après](#architecture-avantaprès)
3. [Nouvelles Fonctionnalités](#nouvelles-fonctionnalités)
4. [Fichiers Créés](#fichiers-créés)
5. [Fichiers Modifiés](#fichiers-modifiés)
6. [Tests à Effectuer](#tests-à-effectuer)
7. [Déploiement](#déploiement)

---

## ✅ RÉSUMÉ DES CHANGEMENTS

### Phase 1 : Corrections Rapides (✓ Terminé)

**Modal Actuel Amélioré** (`ClientDetails.jsx`)
- ✅ Liste des 6 pièces ARCOP complétées (était 3/6)
- ✅ Accord de groupement ajouté avec checkbox conditionnelle
- ✅ Barre de progression % ajoutée au stepper
- ✅ Navigation libre entre étapes (boutons aperçu)
- ✅ État `enGroupement` géré dans le state

### Phase 2 : Page Dédiée (✓ Terminé)

**Nouvelle Page Studio** (`/marches/studio`)
- ✅ URL dédiée avec paramètre `?id={marcheId}`
- ✅ Sauvegarde Firestore automatique
- ✅ Architecture modulaire (4 composants)
- ✅ Navigation libre entre toutes les étapes
- ✅ Barre de progression globale interactive

---

## 🏗️ ARCHITECTURE AVANT/APRÈS

### AVANT (Modal)

```
src/app/(client)/marches/details/
└── ClientDetails.jsx
    └── {showStudio && <Modal>...</Modal>}
        ├── État local (volatile)
        ├── Navigation séquentielle
        └── Fermeture = perte de données
```

**Limitations :**
- ❌ Pas d'URL partageable
- ❌ Données perdues à la fermeture
- ❌ Impossible de reprendre plus tard
- ❌ Navigation bloquée séquentiellement

### APRÈS (Page Dédiée)

```
src/app/(client)/marches/studio/
├── page.js                          → Layout principal avec router
├── components/
│   ├── ProgressBar.jsx             → Stepper cliquable + barre %
│   ├── Step1Admin.jsx              → 6 pièces ARCOP + groupement
│   ├── Step2Technical.jsx          → Génération IA
│   └── Step3Verification.jsx       → Téléchargement + validation
└── Firestore Collection: `studio`
    └── {userId}_{marcheId}
        ├── step: number
        ├── selectedFiles: File[]
        ├── extractedData: object
        ├── enGroupement: boolean
        ├── agreedToTerms: boolean
        └── lastUpdated: timestamp
```

**Avantages :**
- ✅ URL : `/marches/studio?id=xxx`
- ✅ Sauvegarde automatique Firestore
- ✅ Reprise possible à tout moment
- ✅ Navigation libre entre étapes
- ✅ Architecture modulaire et maintenable

---

## 🎨 NOUVELLES FONCTIONNALITÉS

### 1. Barre de Progression Interactive

**ProgressBar.jsx**
- Affichage du % de complétion (0-100%)
- 3 cartes cliquables (étape 1, 2, 3)
- Indicateurs visuels : actif, complété, en attente
- Message de félicitations à 100%

```jsx
<ProgressBar 
  currentStep={1} 
  progress={33} 
  onStepClick={(step) => goToStep(step)}
/>
```

### 2. Sauvegarde Automatique

**Firestore Collection `studio`**
```javascript
{
  userId: "abc123",
  marcheId: "marche456",
  step: 2,
  selectedFiles: [...],
  extractedData: {...},
  enGroupement: true,
  agreedToTerms: false,
  lastUpdated: "2026-08-09T10:30:00Z"
}
```

**Déclencheurs :**
- Changement d'étape
- Modification de données (`updateStudioData`)
- Clic sur bouton "Sauvegarder"


### 3. Navigation Libre

**Avant** : 1 → 2 → 3 (séquentiel strict)  
**Après** : Clic sur n'importe quelle étape à tout moment

```jsx
// Boutons de navigation dans chaque composant
<button onClick={() => goToStep(1)}>← Étape 1</button>
<button onClick={() => goToStep(2)}>← Étape 2</button>
<button onClick={() => goToStep(3)}>Voir Résultat →</button>
```

### 4. Accord de Groupement Intégré

**Step1Admin.jsx**
```jsx
<label>
  <input 
    type="checkbox" 
    checked={studioData.enGroupement}
    onChange={(e) => updateStudioData({ enGroupement: e.target.checked })}
  />
  Je soumissionne en groupement
</label>

{enGroupement && (
  <p>⚠️ N'oubliez pas de joindre l'accord de groupement signé.</p>
)}
```

### 5. 6 Pièces ARCOP Complètes

**Référentiel respecté** (src/lib/arcop.js)
1. Attestation de non-redevance fiscale (DGI)
2. Attestation CNSS à jour
3. Certificat de non-engagement Trésor (AJE)
4. Certificat réglementation du travail (INSS)
5. Copie du RCCM (CEFORE)
6. Certificat de non-faillite (Tribunal)

---

## 📁 FICHIERS CRÉÉS

### Nouveaux Fichiers (6)

1. **`src/app/(client)/marches/studio/page.js`** (167 lignes)
   - Layout principal
   - Gestion du state global
   - Auth et chargement données
   - Sauvegarde Firestore

2. **`src/app/(client)/marches/studio/components/ProgressBar.jsx`** (75 lignes)
   - Barre de progression %
   - Stepper cliquable
   - États visuels

3. **`src/app/(client)/marches/studio/components/Step1Admin.jsx`** (145 lignes)
   - 6 pièces ARCOP
   - Accord de groupement
   - Sélection fichiers

4. **`src/app/(client)/marches/studio/components/Step2Technical.jsx`** (115 lignes)
   - Génération IA
   - Animation progression
   - Gestion erreurs

5. **`src/app/(client)/marches/studio/components/Step3Verification.jsx`** (180 lignes)
   - Score de concordance
   - Génération DOCX
   - Validation finale

6. **`GUIDE_MIGRATION_STUDIO.md`** (ce fichier)
   - Documentation complète

---

## 🔧 FICHIERS MODIFIÉS

### 1. `src/app/(client)/marches/details/ClientDetails.jsx`

**Ligne ~250 : Ajout state groupement**
```jsx
const [enGroupement, setEnGroupement] = useState(false);
```

**Ligne ~860 : Liste pièces complétée (3 → 6)**
```jsx
<ul>
  <li>RCCM</li>
  <li>Attestation de non-redevance fiscale (DGI)</li>
  <li>Attestation CNSS</li>
  <li>Certificat non-engagement Trésor</li>
  <li>Certificat réglementation travail</li>
  <li>Certificat de non-faillite</li>
</ul>
```

**Ligne ~870 : Section accord groupement**
```jsx
<label>
  <input 
    type="checkbox" 
    checked={enGroupement}
    onChange={(e) => setEnGroupement(e.target.checked)}
  />
  Je soumissionne en groupement
</label>
```

**Ligne ~823 : Barre de progression ajoutée**
```jsx
<div>
  <span>{Math.round((studioStep / 3) * 100)}%</span>
  <div style={{ width: `${(studioStep / 3) * 100}%` }} />
</div>
```

**Ligne ~890 : Boutons navigation ajoutés**
```jsx
<button onClick={() => setStudioStep(1)}>← Étape 1</button>
<button onClick={() => setStudioStep(2)}>Aperçu Étape 2</button>
<button onClick={() => setStudioStep(3)}>Aperçu Étape 3</button>
```

**Ligne ~792 : Redirection vers nouvelle page**
```jsx
<button onClick={() => window.location.href = `/marches/studio?id=${marche.id}`}>
  Générer mon Dossier 🪄
</button>
```

---

## ✅ TESTS À EFFECTUER

### Tests Unitaires

#### Test 1 : Chargement Page Studio
```
✓ URL : /marches/studio?id=TEST_ID
✓ Auth : Redirection si non connecté
✓ Marché : Chargement correct depuis Firestore
✓ État : Récupération sauvegarde précédente
```

#### Test 2 : Navigation Entre Étapes
```
✓ Clic sur étape 1 → Affichage Step1Admin
✓ Clic sur étape 2 → Affichage Step2Technical
✓ Clic sur étape 3 → Affichage Step3Verification
✓ Progression : Mise à jour % correcte
```

#### Test 3 : Sauvegarde Firestore
```
✓ Upload fichiers → Sauvegarde automatique
✓ Changement étape → Sauvegarde state.step
✓ Checkbox groupement → Sauvegarde enGroupement
✓ Fermeture/réouverture → État restauré
```

#### Test 4 : Accord de Groupement
```
✓ Checkbox affichée dans Step1Admin
✓ Message d'avertissement si coché
✓ État sauvegardé dans Firestore
✓ Visible dans page Dossier également
```

#### Test 5 : Génération IA
```
✓ Appel API /api/analyze-documents
✓ Animation progression affichée
✓ Résultat stocké dans extractedData
✓ Redirection auto vers étape 3
```

#### Test 6 : Téléchargement DOCX
```
✓ Checkbox "J'accepte" obligatoire
✓ Génération document avec docx.js
✓ Nom de fichier correct
✓ Contenu complet (7 sections)
```

### Tests d'Intégration

#### Scénario Complet
```
1. Utilisateur clique "Générer mon Dossier" → Redirection /marches/studio
2. Sélectionne 3 fichiers PDF → Sauvegarde automatique
3. Coche "Je soumissionne en groupement" → État mis à jour
4. Clique "Continuer" → Étape 2 affichée
5. Lance génération IA → Animation 60s
6. Étape 3 auto-affichée → Score 85%
7. Accepte termes → Télécharge DOCX
8. Ferme page → Réouverture = état restauré
```

---

## 🚀 DÉPLOIEMENT

### Prérequis
- ✅ Firebase Firestore activé
- ✅ Collection `studio` créée (auto si inexistante)
- ✅ Règles Firestore mises à jour

### Règles Firestore à Ajouter

```javascript
// firestore.rules
match /studio/{studioId} {
  // Format : {userId}_{marcheId}
  allow read: if request.auth != null && 
                 studioId.matches('^' + request.auth.uid + '_.*');
  
  allow write: if request.auth != null && 
                  studioId.matches('^' + request.auth.uid + '_.*') &&
                  request.resource.data.userId == request.auth.uid;
}
```

### Commandes de Déploiement

```bash
# 1. Vérifier les fichiers créés
ls -la src/app/(client)/marches/studio/

# 2. Build local
npm run build

# 3. Tester en local
npm run dev
# Ouvrir : http://localhost:3000/marches/studio?id=TEST_ID

# 4. Déployer Firebase rules
firebase deploy --only firestore:rules

# 5. Déployer l'application
vercel --prod
# OU
npm run deploy
```

### Vérifications Post-Déploiement

```bash
# 1. URL accessible
curl https://wend-kabre.bf/marches/studio?id=TEST

# 2. Firestore rules actives
firebase firestore:rules:list

# 3. Logs d'erreur
vercel logs --follow
```

---

## 📊 MONITORING

### Métriques à Suivre

1. **Taux d'utilisation Studio**
   - Nombre de sessions démarrées
   - Taux de complétion (étape 3 atteinte)
   - Temps moyen par étape

2. **Sauvegarde Firestore**
   - Nombre de documents `studio` créés
   - Taille moyenne des sauvegardes
   - Erreurs d'écriture

3. **Génération IA**
   - Succès vs échecs
   - Temps moyen de génération
   - Taille des fichiers uploadés

### Logs Importants

```javascript
// Dans page.js
console.log('Studio chargé pour marché:', marcheId);
console.log('État restauré:', studioData);
console.log('Sauvegarde effectuée:', lastUpdated);
```

---

## 🐛 TROUBLESHOOTING

### Problème 1 : État non sauvegardé

**Symptôme** : Données perdues après fermeture  
**Cause** : Règles Firestore bloquantes  
**Solution** :
```bash
firebase firestore:rules:get
# Vérifier que la règle match /studio/{studioId} existe
```

### Problème 2 : Redirection échoue

**Symptôme** : Clic sur bouton sans effet  
**Cause** : URL mal formée  
**Solution** :
```jsx
// Vérifier dans ClientDetails.jsx ligne 792
onClick={() => window.location.href = `/marches/studio?id=${marche.id}`}
```

### Problème 3 : Étape 3 vide

**Symptôme** : "Aucune offre générée"  
**Cause** : extractedData non stocké  
**Solution** :
```jsx
// Dans Step2Technical.jsx après génération
updateStudioData({ extractedData: data });
```

---

## 📚 RÉFÉRENCES

- [RAPPORT_ANALYSE_FRONTEND_BACKEND.md](./RAPPORT_ANALYSE_FRONTEND_BACKEND.md) - Analyse complète
- [src/lib/arcop.js](./src/lib/arcop.js) - Référentiel pièces administratives
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [docx.js Documentation](https://docx.js.org/)

---

## 🎯 PROCHAINES ÉTAPES

### Court Terme (Semaine 1)
- [ ] Tester en environnement de staging
- [ ] Former les utilisateurs beta
- [ ] Collecter feedback initial

### Moyen Terme (Mois 1)
- [ ] Ajouter export PDF en plus de DOCX
- [ ] Historique des dossiers générés
- [ ] Notification email à complétion

### Long Terme (Trimestre 1)
- [ ] Templates personnalisables par secteur
- [ ] Collaboration multi-utilisateurs
- [ ] Signature électronique intégrée

---

**Document créé le** : 9 août 2026  
**Dernière mise à jour** : 9 août 2026  
**Auteur** : Kiro AI  
**Version** : 1.0
