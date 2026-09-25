# BLIND SET GOLD V2 - PROTOCOLE RIGOUREUX

## 🚨 MISSION
Créer un dataset de validation indépendant et fiable pour benchmark V2F vs V2G
**Abandonner Blind V1** (défaillant) et construire V2 selon standards méthodologiques stricts.

## 🔬 PROTOCOLE EN 6 PHASES

### PHASE 1 — COLLECTE
- ≥100 **vrais appels d'offres** Wend-Kabré  
- Sources indépendantes des datasets existants
- **AUCUN texte généré artificiellement**
- Conservation texte original, titre, source, identifiant
- Sources prioritaires : données publiques récentes, archives non utilisées

### PHASE 2 — GEL DES DONNÉES BRUTES
```
RAW_GOLD_V2
     ↓
déduplication
     ↓  
contrôle d'indépendance
     ↓
DATASET CANDIDAT
```
**RÈGLE** : Aucune prédiction V2F/V2G à ce stade

### PHASE 3 — LABELLISATION HUMAINE
Processus pour chaque échantillon :
```
Échantillon
    ↓
Label humain (gouvernement/marché/neutre)
    ↓  
Justification courte
    ↓
Confiance (high/medium/uncertain)
    ↓
GOLD
```
- Cas ambigus : `uncertain`/`review_required` 
- **PAS de labelling automatique** pour déterminer GOLD
- Contrôle cohérence automatique autorisé **après coup**

### PHASE 4 — VÉRIFICATION INDÉPENDANCE
Vérifications multiples :
- Hash exact
- Similarité textuelle (seuil 80%)
- Titres identiques/quasi-identiques  
- Identifiants/URLs/sources
- Doublons exacts et quasi-doublons
- Appartenance aux datasets précédents

**RÈGLE** : Contenu GOLD ne doit jamais modifier V2F/V2G avant benchmark

### PHASE 5 — FROZEN 
Fichiers finaux :
```
BLIND_SET_GOLD_V2.json
BLIND_SET_GOLD_V2_SHA256.txt
BLIND_SET_GOLD_V2_INDEPENDENCE_REPORT.json  
BLIND_SET_GOLD_V2_LABELING_PROTOCOL.md
```
STATUS = FROZEN + empreinte SHA-256 conservée

### PHASE 6 — BENCHMARK (SEULEMENT MAINTENANT)
```
             GOLD V2 FROZEN
                  │
          ┌───────┴───────┐
          ▼               ▼
         V2F             V2G
          │               │
          └───────┬───────┘
                  ▼
          GOLD COMPARISON
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
 Accuracy      Macro-F1    Confusion Matrix
```

Structure séparée :
```
GOLD/
  BLIND_SET_GOLD_V2.json

RESULTS/  
  V2F_ON_GOLD_V2.json
  V2G_ON_GOLD_V2.json
  BENCHMARK_V2F_V2G.json
```

## 🚫 RÈGLES ABSOLUES
1. **Aucune prédiction** avant FROZEN = TRUE
2. **Aucun template artificiel** dans les échantillons
3. **Labelling 100% humain** pour déterminer GOLD  
4. **Séparation stricte** GOLD ↔ RESULTS
5. **Aucune recalibration** des modèles sur ce dataset

## 📊 CRITÈRES DE SUCCÈS
- [ ] 100+ échantillons réels collectés
- [ ] Indépendance totale vérifiée (0 contamination)
- [ ] Labels 100% assignés par expertise humaine
- [ ] Distribution naturelle observée  
- [ ] Empreinte SHA-256 calculée
- [ ] Status FROZEN confirmé
- [ ] Validation V2F vs V2G exécutée

**ABANDON OFFICIEL** : Blind Set V1 rejeté pour benchmark (conservation pour audit historique)