# 🪄 Studio de Candidature - Guide Complet

**Version** : 2.0  
**Date** : 9 août 2026  
**Status** : ✅ Production Ready

---

## 🎯 APERÇU

Le **Studio de Candidature** est une page dédiée permettant aux entreprises de générer automatiquement leur dossier technique de soumission pour les marchés publics burkinabè, en conformité avec le **référentiel ARCOP**.

### Caractéristiques Principales

- ✅ **Page dédiée** (`/marches/studio?id={marcheId}`)
- ✅ **Sauvegarde automatique** Firestore
- ✅ **Navigation libre** entre 3 étapes
- ✅ **Barre de progression** interactive
- ✅ **6 pièces ARCOP** complètes
- ✅ **Accord de groupement** intégré
- ✅ **Génération IA** de l'offre technique
- ✅ **Export DOCX** professionnel

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd wend-kabre-bf

# Installer les dépendances
npm install

# Variables d'environnement
cp .env.example .env.local
# Configurer Firebase credentials
```

### 2. Déployer les Règles Firestore

```bash
firebase deploy --only firestore:rules
```

**Vérifier** : La règle `match /studio/{studioId}` doit être présente dans `firestore.rules`

### 3. Lancer en Local

```bash
npm run dev
```

Ouvrir : `http://localhost:3000/marches/studio?id=TEST_MARCHE_ID`

### 4. Tester le Flux Complet

1. Se connecter avec un compte test
2. Aller sur un marché → Clic "Générer mon Dossier"
3. Redirection vers `/marches/studio?id=xxx`
4. **Étape 1** : Sélectionner 2-3 fichiers PDF
5. **Étape 2** : Lancer génération IA (60s)
6. **Étape 3** : Télécharger le DOCX généré

---

## 📁 STRUCTURE DES FICHIERS

```
src/app/(client)/marches/
├── details/
│   └── ClientDetails.jsx          → Redirection vers studio
└── studio/
    ├── page.js                    → Layout principal + state
    └── components/
        ├── ProgressBar.jsx        → Stepper cliquable
        ├── Step1Admin.jsx         → Sélection documents
        ├── Step2Technical.jsx     → Génération IA
        └── Step3Verification.jsx  → Téléchargement

firestore.rules                    → Règles collection `studio`

Documentation/
├── RAPPORT_ANALYSE_FRONTEND_BACKEND.md
├── GUIDE_MIGRATION_STUDIO.md
├── TRAVAUX_EFFECTUES_STUDIO.md
└── STUDIO_README.md (ce fichier)
```

---

## 🎨 ARCHITECTURE

### Flow Utilisateur

```
Marché Detail Page
    ↓ (Clic "Générer mon Dossier")
/marches/studio?id=xxx
    ↓
[ProgressBar] 0% → 33% → 66% → 100%
    ↓
[Step1Admin] Sélection fichiers + groupement
    ↓
[Step2Technical] Génération IA (API call)
    ↓
[Step3Verification] Score + Téléchargement DOCX
```

### Stack Technique

- **Framework** : Next.js 14 (App Router)
- **State** : React useState + Firestore
- **Auth** : Firebase Authentication
- **Storage** : Firestore Database
- **Génération** : docx.js + file-saver
- **API** : `/api/analyze-documents`

---

## 🗄️ MODÈLE DE DONNÉES

### Collection `studio`

**Document ID** : `{userId}_{marcheId}`

```javascript
{
  userId: string,           // UID Firebase Auth
  marcheId: string,         // ID du marché
  step: number,             // Étape actuelle (1-3)
  selectedFiles: File[],    // Fichiers uploadés (non stockés, juste métadonnées)
  extractedData: {          // Résultat de l'IA
    extractedCompanyInfo: {
      name: string,
      rccm: string,
      ifu: string,
      address: string,
      managerName: string
    },
    generatedOffer: {
      presentation: string,
      comprehension: string,
      methodology: string,
      humanResources: string,
      materials: string,
      qualityAndRisks: string,
      planning: string
    },
    concordanceScore: number,  // 0-100
    missingDocuments: string[]
  },
  enGroupement: boolean,    // Soumission en groupement
  agreedToTerms: boolean,   // Acceptation relecture
  generationError: string | null,
  lastUpdated: timestamp
}
```

### Règles Firestore

```javascript
match /studio/{studioId} {
  // Lecture : utilisateur propriétaire uniquement
  allow read: if isSignedIn() && 
                 studioId.matches('^' + request.auth.uid + '_.*');
  
  // Écriture : utilisateur propriétaire uniquement
  allow create, update: if isSignedIn() && 
                          request.resource.data.userId == request.auth.uid &&
                          studioId.matches('^' + request.auth.uid + '_.*');
  
  // Suppression : utilisateur propriétaire uniquement
  allow delete: if isSignedIn() && 
                   resource.data.userId == request.auth.uid;
}
```

---

## 🔌 API UTILISÉES

### `/api/analyze-documents`

**Méthode** : POST  
**Auth** : Optionnelle (mais recommandée)

**Request Body** :
```json
{
  "market": {
    "id": "marche123",
    "title": "Construction d'une école primaire",
    "description": "...",
    "category": "Travaux",
    "source": "MENA"
  },
  "files": [
    {
      "name": "rccm.pdf",
      "mimeType": "application/pdf",
      "data": "base64EncodedString..."
    }
  ]
}
```

**Response** :
```json
{
  "extractedCompanyInfo": { ... },
  "generatedOffer": { ... },
  "concordanceScore": 85,
  "missingDocuments": ["Attestation CNSS"]
}
```

**Temps de réponse** : 30-60 secondes

---

## ⚙️ COMPOSANTS

### ProgressBar

**Props** :
- `currentStep` : number (1-3)
- `progress` : number (0-100)
- `onStepClick` : (step: number) => void

**Fonctionnalités** :
- Affichage % global
- 3 cartes cliquables
- États : actif, complété, en attente

**Exemple** :
```jsx
<ProgressBar 
  currentStep={2} 
  progress={66} 
  onStepClick={(step) => setCurrentStep(step)}
/>
```

---

### Step1Admin

**Props** :
- `marche` : Object (données du marché)
- `studioData` : Object (état du studio)
- `updateStudioData` : (updates: Object) => void
- `goToStep` : (step: number) => void

**Fonctionnalités** :
- Liste 6 pièces ARCOP
- Documents spécifiques au marché
- Checkbox accord de groupement
- Sélection fichiers multiples

**Validation** :
- Minimum 1 fichier pour continuer
- Formats acceptés : PDF, JPG, PNG

---

### Step2Technical

**Props** :
- `marche` : Object
- `studioData` : Object
- `updateStudioData` : Function
- `goToStep` : Function

**Fonctionnalités** :
- Conversion fichiers en Base64
- Appel API `/api/analyze-documents`
- Animation progression
- Gestion erreurs

**États** :
- `idle` : Bouton "Lancer génération"
- `generating` : Animation + messages
- `success` : Redirection auto étape 3
- `error` : Message d'erreur + retry

---

### Step3Verification

**Props** :
- `marche` : Object
- `userData` : Object (profil utilisateur)
- `studioData` : Object
- `updateStudioData` : Function
- `goToStep` : Function

**Fonctionnalités** :
- Score de concordance
- Liste documents manquants
- Checkbox "J'accepte de relire"
- Génération DOCX
- Téléchargement fichier

**Document généré** :
- Format : `.docx`
- Sections : 7 (présentation → planning)
- Taille : ~15-30 pages
- Nom : `Dossier_Technique_{EntrepriseName}.docx`

---

## 🧪 TESTS

### Tests Manuels

#### Test 1 : Navigation
```
✓ Cliquer sur étape 1 → Affichage Step1Admin
✓ Cliquer sur étape 2 → Affichage Step2Technical
✓ Cliquer sur étape 3 → Affichage Step3Verification
✓ Progression % mise à jour
```

#### Test 2 : Sauvegarde
```
✓ Uploader 2 fichiers → Vérifier Firestore
✓ Cocher groupement → Vérifier Firestore
✓ Fermer page → Rouvrir → État restauré
```

#### Test 3 : Génération
```
✓ Lancer génération → Animation 60s
✓ Succès → Redirection étape 3
✓ Échec → Message d'erreur affiché
```

#### Test 4 : Téléchargement
```
✓ Checkbox "J'accepte" → Bouton activé
✓ Clic téléchargement → Fichier .docx
✓ Ouvrir fichier → 7 sections présentes
```

### Tests Automatisés (À implémenter)

```javascript
// tests/studio.test.js
describe('Studio de Candidature', () => {
  test('Redirection si non authentifié', async () => {
    // ...
  });
  
  test('Chargement état sauvegardé', async () => {
    // ...
  });
  
  test('Sauvegarde automatique', async () => {
    // ...
  });
});
```

---

## 🐛 TROUBLESHOOTING

### Problème 1 : État non sauvegardé

**Symptôme** : Données perdues après fermeture  
**Causes possibles** :
- Règles Firestore incorrectes
- Utilisateur non authentifié
- Erreur réseau

**Solution** :
```bash
# Vérifier les règles
firebase firestore:rules:get

# Vérifier l'authentification
console.log(auth.currentUser);

# Vérifier les logs
firebase firestore:logs
```

---

### Problème 2 : Génération IA échoue

**Symptôme** : Erreur "Échec de l'analyse"  
**Causes possibles** :
- Fichiers trop volumineux (>5MB)
- API timeout (>60s)
- Format de fichier non supporté

**Solution** :
```javascript
// Limiter taille des fichiers
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

files.forEach(file => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux : ${file.name}`);
  }
});
```

---

### Problème 3 : Navigation ne fonctionne pas

**Symptôme** : Clic sur étape sans effet  
**Causes possibles** :
- État bloqué
- Fonction `goToStep` non passée

**Solution** :
```jsx
// Vérifier dans page.js
const goToStep = (step) => {
  console.log('Navigation vers étape:', step);
  setCurrentStep(step);
  updateStudioData({ step });
};

// Passer aux composants
<Step1Admin goToStep={goToStep} />
```

---

## 📊 MONITORING

### Métriques à Suivre

1. **Utilisation**
   - Sessions studio démarrées / jour
   - Taux de complétion (étape 3 atteinte)
   - Temps moyen par étape

2. **Performance**
   - Temps de génération IA (moy/max)
   - Taux d'erreur API
   - Taille moyenne documents uploadés

3. **Business**
   - Conversions premium (si paywall)
   - Documents téléchargés
   - NPS utilisateurs

### Logs Firebase

```javascript
// Dans studio/page.js
import { track } from '@/lib/track';

// Événements à tracker
track('studio_start', { marcheId });
track('studio_step_complete', { step: 1 });
track('studio_generate_ai', { filesCount: files.length });
track('studio_download_docx', { concordanceScore });
```

---

## 🚀 DÉPLOIEMENT

### Prérequis

- [x] Firebase projet configuré
- [x] Règles Firestore déployées
- [x] Variables d'environnement définies
- [x] Tests passés

### Commandes

```bash
# 1. Build production
npm run build

# 2. Tester le build
npm run start

# 3. Déployer Firestore rules
firebase deploy --only firestore:rules

# 4. Déployer l'app
vercel --prod
# OU
npm run deploy
```

### Vérifications Post-Déploiement

```bash
# URL accessible
curl https://wend-kabre.bf/marches/studio

# Firestore rules actives
firebase firestore:rules:list

# Logs en temps réel
vercel logs --follow
```

---

## 📚 DOCUMENTATION ADDITIONNELLE

- [RAPPORT_ANALYSE_FRONTEND_BACKEND.md](./RAPPORT_ANALYSE_FRONTEND_BACKEND.md) - Analyse des divergences
- [GUIDE_MIGRATION_STUDIO.md](./GUIDE_MIGRATION_STUDIO.md) - Guide de migration complet
- [TRAVAUX_EFFECTUES_STUDIO.md](./TRAVAUX_EFFECTUES_STUDIO.md) - Récapitulatif des modifications
- [src/lib/arcop.js](./src/lib/arcop.js) - Référentiel pièces ARCOP

---

## 🤝 CONTRIBUTION

### Ajout de Fonctionnalités

1. Créer une branche
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   ```

2. Développer + tests

3. Pull Request avec :
   - Description claire
   - Screenshots/vidéo
   - Tests passants

### Code Style

- ESLint : `npm run lint`
- Format : `npm run format`
- Conventions : CamelCase pour fonctions, PascalCase pour composants

---

## 📞 SUPPORT

### Questions Fréquentes

**Q: Puis-je générer plusieurs dossiers pour le même marché ?**  
R: Oui, chaque génération écrase la précédente dans Firestore, mais vous pouvez télécharger plusieurs fois.

**Q: Les fichiers uploadés sont-ils stockés ?**  
R: Non, seul le résultat de l'analyse IA est sauvegardé. Les fichiers originaux ne sont pas conservés.

**Q: Combien de temps l'état est-il sauvegardé ?**  
R: Indéfiniment, jusqu'à ce que vous supprimiez le document ou recommenciez.

### Contact

- Email : support@wend-kabre.bf
- Docs : https://wend-kabre.bf/docs
- GitHub : [Issues](https://github.com/votre-repo/issues)

---

**Version** : 2.0  
**Dernière mise à jour** : 9 août 2026  
**Auteur** : Kiro AI  
**Licence** : Propriétaire
