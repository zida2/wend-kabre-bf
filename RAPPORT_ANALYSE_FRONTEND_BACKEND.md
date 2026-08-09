# 📊 RAPPORT D'ANALYSE : Frontend vs Backend

**Date** : 9 août 2026  
**Projet** : Wend-Kabre.bf  
**Analyse** : Cohérence Frontend/Backend + Studio de Candidature

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Problèmes Identifiés

1. ❌ **Studio de Candidature** : Actuellement un MODAL au lieu d'une page dédiée
2. ❌ **Accords de Groupement** : Implémentés au backend mais partiellement visibles au frontend
3. ❌ **Barre de progression** : Absente du Studio Modal
4. ❌ **Navigation** : Impossible de voir les autres niveaux sans enregistrer
5. ❌ **Pièces administratives** : Liste incomplète dans le Studio (3/6 pièces manquantes)

---

## 📁 1. STUDIO DE CANDIDATURE

### État Actuel

**Frontend :**
- Localisation : `src/app/(client)/marches/details/ClientDetails.jsx` (lignes 805-1000)
- Type : **MODAL** (overlay avec position: fixed)
- Navigation : Séquentielle stricte (étape 1 → 2 → 3)
- Progression : Stepper visuel simple sans %
- Sauvegarde : Aucune (tout en mémoire)

**Backend :**
- API `/api/analyze-documents` : ✅ Fonctionnelle
- Génération IA : ✅ Opérationnelle
- Extraction OCR : ✅ Opérationnelle

### Problème

```jsx
// Actuellement dans ClientDetails.jsx
{showStudio && (
  <div style={{ 
    position: 'fixed',  // ← MODAL, pas une page
    top: 0, left: 0, 
    width: '100%', 
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999
  }}>
    {/* Contenu du studio */}
  </div>
)}
```

**Limitations :**
- ❌ Pas d'URL dédiée (`/marches/studio?id=xxx`)
- ❌ Impossible de partager un lien
- ❌ Pas de sauvegarde entre sessions
- ❌ Fermeture accidentelle = perte de données
- ❌ Navigation limitée

---

## 🤝 2. ACCORDS DE GROUPEMENT

### Backend (✅ Implémenté)

**Fichier : `src/lib/arcop.js`**
```javascript
{
  id: 'accordGroupement',
  titre: 'Accord de groupement',
  controle: 'En cas de groupement, s\'assurer que l\'accord est signé de toutes les parties.',
}
```

**Fichier : `src/app/(client)/marches/dossier/page.js`**
- Checkbox conditionnelle "Je soumissionne en groupement"
- Validation : accord comptabilisé uniquement si groupement activé
- Intégration dans calcul de progression

### Frontend (⚠️ Partiellement Visible)

**Présent dans :**
- ✅ Page `/marches/dossier` : Affichage complet avec checkbox
- ❌ Studio Modal : **ABSENT**
- ❌ Guide de soumission : Mention textuelle uniquement

**Code dans dossier/page.js :**
```javascript
{CHECKLIST_DEPOT.filter((b) => b.id !== 'piecesAdministratives').map((bloc) => {
  const estGroupement = bloc.id === 'accordGroupement';
  const inactif = estGroupement && !dossier.enGroupement;
  // ... affichage conditionnel
})}
```

### Verdict

✅ Backend : 100% implémenté  
⚠️ Frontend : 60% reflété (page dossier OK, studio KO)

---

## 📋 3. PIÈCES ADMINISTRATIVES

### Backend Référentiel (arcop.js)

```javascript
PIECES_ADMINISTRATIVES = [
  { id: 'situationFiscale', label: 'Attestation non-redevance fiscale', emetteur: 'DGI' },
  { id: 'situationCotisante', label: 'Attestation CNSS', emetteur: 'CNSS' },
  { id: 'nonEngagementAJE', label: 'Certificat non-engagement Trésor', emetteur: 'Trésor' },
  { id: 'reglementationTravail', label: 'Certificat réglementation travail', emetteur: 'INSS' },
  { id: 'rccm', label: 'Copie du RCCM', emetteur: 'CEFORE' },
  { id: 'nonFaillite', label: 'Certificat de non-faillite', emetteur: 'Tribunal' },
];
```

### Frontend Studio Modal

**Ce qui est mentionné (ClientDetails.jsx, ligne 860) :**
```jsx
<ul>
  <li>Registre de Commerce (RCCM)</li>
  <li>Attestation de Situation Fiscale (ASF) ou IFU</li>
  <li>Attestation de la CNSS</li>
</ul>
```

**❌ Pièces manquantes :**
- Certificat non-engagement Trésor
- Certificat réglementation du travail
- Certificat de non-faillite

### Verdict

Backend : 6 pièces  
Frontend Studio : 3 pièces (50% de couverture)

---

## 📊 4. TABLEAU COMPARATIF

| Fonctionnalité | Page Dossier | Studio Modal | Backend |
|----------------|--------------|--------------|---------|
| Accord de groupement | ✅ Complet | ❌ Absent | ✅ Implémenté |
| 6 pièces admin ARCOP | ✅ Toutes | ❌ 3/6 | ✅ Référencées |
| Barre de progression % | ✅ Oui | ❌ Non | ✅ Logique |
| Sauvegarde état | ✅ Firestore | ❌ Aucune | ✅ API prête |
| Navigation libre | ✅ Oui | ❌ Séquentiel | N/A |
| URL dédiée | ✅ Oui | ❌ Modal | N/A |
| Notes personnelles | ✅ Zone texte | ❌ Absente | ✅ Structure |

---

## 🔧 5. SOLUTIONS RECOMMANDÉES

### Option A : Transformer le Modal en Page Dédiée (⭐ Recommandé)

**Avantages :**
- URL partageable : `/marches/studio?id={marcheId}`
- Sauvegarde automatique à chaque étape
- Navigation libre entre niveaux
- Barre de progression visuelle
- Intégration avec page Dossier

**Structure proposée :**
```
/marches/studio/
├── page.js            → Layout principal avec stepper
├── components/
│   ├── Step1Admin.jsx    → Pièces administratives (6 pièces complètes)
│   ├── Step2Technical.jsx → Génération IA offre
│   ├── Step3Verification.jsx → Validation finale
│   └── ProgressBar.jsx   → Barre % de complétion
```

### Option B : Améliorer le Modal Actuel

**Modifications :**
- Ajouter sauvegarde locale (localStorage)
- Permettre navigation non-linéaire entre étapes
- Ajouter barre de progression %
- Compléter liste des 6 pièces ARCOP
- Intégrer accord de groupement

---

## 🚀 6. PLAN D'ACTION PRIORITAIRE

### Phase 1 : Urgences (2-3h)
1. ✅ Compléter la liste des pièces admin dans le Studio Modal (3 → 6)
2. ✅ Ajouter accord de groupement dans le Studio
3. ✅ Ajouter barre de progression % dans le modal

### Phase 2 : Architecture (1 journée)
4. Créer `/marches/studio/page.js` comme page dédiée
5. Migrer la logique du modal vers la nouvelle page
6. Implémenter sauvegarde Firestore à chaque étape
7. Permettre navigation libre entre étapes

### Phase 3 : Harmonisation (4h)
8. Synchroniser Studio et page Dossier
9. Tests utilisateurs du nouveau flux
10. Documentation mise à jour

---

## 📝 7. FICHIERS À MODIFIER

### Modification Immédiate
- `src/app/(client)/marches/details/ClientDetails.jsx`
  - Lignes 860-875 : Compléter liste pièces administratives
  - Lignes 480-490 : Ajouter accord groupement au Step 1
  - Ajouter barre de progression au stepper (ligne 823)

### Création Nouvelle Page
- `src/app/(client)/marches/studio/page.js` (nouveau fichier)
- `src/app/(client)/marches/studio/layout.js` (optionnel)
- `src/components/studio/` (dossier de composants)

---

## ✅ 8. CONCLUSION

### État Actuel
- ✅ **Backend** : Cohérent et complet (ARCOP référentiel respecté)
- ⚠️ **Frontend** : Incohérent entre pages Dossier et Studio
- ❌ **Studio** : Modal limité au lieu d'une vraie page

### Recommandation Principale
**Créer une page dédiée `/marches/studio`** pour :
- Améliorer l'UX (navigation, progression)
- Refléter fidèlement le backend
- Permettre sauvegarde et reprise
- Harmoniser avec la page Dossier existante

### Prochaine Étape Immédiate
Souhaitez-vous que je :
1. **Corrige immédiatement** les 3 pièces manquantes dans le modal actuel ?
2. **Crée la nouvelle page Studio** complète avec navigation libre ?
3. Les deux ?

---

**Rapport généré par Kiro AI**  
*Analyse basée sur l'état du projet au 9 août 2026*
