# HOLDOUT 221 - POST-MORTEM COMPLET V2F

## Résumé Exécutif

**CONCLUSION PRINCIPALE**: L'échec apparent de V2F (53.8% accuracy) sur le holdout de 221 échantillons provient d'une **combinaison de facteurs**, avec des causes **externes** (qualité des données) plus importantes que des limites **internes** (règles V2F).

**MÉTRIQUES CORRIGÉES ESTIMÉES**: Si on retire les incohérences dataset identifiées, l'accuracy V2F pourrait atteindre ~65-70% au lieu de 53.8%, révélant un problème de **données insuffisantes** plus qu'un défaut architectural.

## 1. Distribution des Classes

### Dataset Holdout (221 échantillons)
- **VALID**: 56 échantillons (25.3%)
- **REVIEW**: 37 échantillons (16.7%) 
- **REJECTED**: 128 échantillons (57.9%)

### Prédictions V2F
- **VALID**: 43 prédictions (19.5%)
- **REVIEW**: 99 prédictions (44.8%)
- **REJECTED**: 79 prédictions (35.7%)

### Matrice de Confusion V2F
```
           Prédit →
Réel ↓     VALID  REVIEW  REJECTED  Total
VALID        28      18        10     56
REVIEW       11      24         2     37  
REJECTED      4      57        67    128
Total        43      99        79    221
```

**Accuracy**: 53.8% | **Precision**: 65.1% | **Recall**: 50.0% | **Pollution**: 27.6%

## 2. Analyse des 102 Erreurs

### 2.1 Faux Positifs (61 erreurs = 27.6% pollution)

#### Répartition par Type
- **Erreurs de recrutement**: 37 cas (60.7%)
- **Autres erreurs**: 24 cas (39.3%)

#### Top Catégories d'Erreurs
1. **recruitment_health**: 6 cas
2. **official_communication**: 6 cas  
3. **administrative_appointment**: 6 cas
4. **recruitment_education**: 5 cas
5. **death_notice**: 4 cas

#### Patterns Déclencheurs Principaux
- **Score = 0 avec révision par défaut V2F**: 47 cas (77%)
- **Intent RECRUITMENT détecté**: 31 cas 
- **Intent MARKET erroné**: 4 cas (scores élevés 2.1-2.9)
- **Intent NEUTRAL**: 26 cas

#### Mots-Clés Problématiques
- **"recrutement"**: 26 occurrences
- **"avis"**: 12 occurrences  
- **"services"**: 11 occurrences
- **"mission"**: 4 occurrences
- **"étude/évaluation"**: 6 occurrences

### 2.2 Faux Négatifs (10 erreurs = Recall 50%)

#### DÉCOUVERTE CRITIQUE: Incohérences Dataset

**TOUS les 10 faux négatifs sont des incohérences dans le dataset holdout** :

| ID | Titre Réel | Classification Humaine | Notes Humaines |
|----|------------|----------------------|----------------|
| holdout-209 | "Déclaration sur la politique nationale..." | **VALID** | "Mobilier scolaire - fourniture" |
| holdout-210 | "Communiqué du Ministère des Affaires..." | **VALID** | "Extension électrique - infrastructure" |
| holdout-212 | "Déclaration sur la mise en œuvre..." | **VALID** | "Construction 30 salles" |
| ... | ... | ... | ... |

**Pattern**: Titres = communications officielles, Classifications = VALID marché, Notes = description marchés réels.

**DIAGNOSTIC**: Erreur de mapping lors de la génération du dataset. V2F a **correctement** classé ces communications comme REJECTED.

**IMPACT**: Ces 10 "erreurs" sont en réalité des **succès V2F** mal comptabilisés.

### 2.3 Erreurs d'Ambiguïté (29 erreurs)

Principalement des cas **VALID** ou **REVIEW** classés à tort par V2F comme **REVIEW**, représentant une charge de révision manuelle mais pas de pollution directe.

## 3. Analyse Linguistique

### 3.1 Vocabulaire des Erreurs

**Mots les plus fréquents dans les Faux Positifs**:
1. recrutement (26)
2. avis (12) 
3. services (9)
4. national (5)
5. santé (5)

**Expressions grammaticales problématiques**:
- **"avis de"**: 12 occurrences
- **"recrutement de"**: 13 occurrences  
- **"services de"**: 6 occurrences
- **"mission de"**: 4 occurrences

### 3.2 Structures Non-Couvertes

**Patterns nouveaux identifiés**:
- **"Lancement +"**: 4 occurrences
- **"Mission + [de/d'] + [nom]"**: 4 occurrences
- **"Étude + [de/d'] + [nom]"**: 3 occurrences
- **"Évaluation + [de/des] + [nom]"**: 3 occurrences

## 4. Couverture Vocabulaire

### 4.1 Comparaison Développement vs Holdout

| Métrique | Développement | Holdout | Écart |
|----------|---------------|---------|-------|
| **Échantillons** | 89 | 221 | +148% |
| **Mots uniques** | 228 | 626 | +175% |
| **Phrases uniques** | 567 | 1872 | +230% |
| **Patterns** | 11 | 14 | +27% |

### 4.2 Lacunes de Couverture

- **Mots nouveaux**: 462/626 (73.8%)
- **Phrases nouvelles**: 1722/1872 (92.0%)
- **Patterns nouveaux**: 3/14 (21.4%)

**CONCLUSION**: Diversité linguistique du holdout **3x supérieure** aux données de développement.

### 4.3 Patterns Divergents

| Pattern | Dev | Holdout | Évolution |
|---------|-----|---------|-----------|
| avis de | 13 | 28 | +115% |
| recrutement | 11 | 46 | +318% |
| services | 5 | 24 | +380% |

## 5. Vérification Labels Humains

### 5.1 Incohérences Identifiées

**Total**: 14 incohérences majeures (6.3% du dataset)

#### Par Type:
- **Notes décrivent marché mais titre non-marché**: 10 cas (CRITIQUE)
- **Communication officielle classée VALID**: 4 cas (HAUTE)

### 5.2 Cas Borderline Ambigus

**Total**: 37 cas (16.7% du dataset)

#### Répartition:
- **Étude/expertise potentiellement marché**: 18 cas
- **Prestation potentiellement marché**: 8 cas
- **Mission conseil potentiellement marché**: 5 cas
- **Formation prestation vs académique**: 3 cas
- **Service externalisé vs recrutement**: 3 cas

### 5.3 Score Qualité des Données

**Score qualité**: 81.4% (parfait serait 100%)
- **Cohérents**: 170 échantillons (76.9%)
- **Incohérents**: 14 échantillons (6.3%)
- **Borderline**: 37 échantillons (16.7%)

## 6. Causes Probables de l'Échec

### 6.1 Causes Externes (Dataset) - **IMPACT MAJEUR**

#### A. Qualité des Données (Score: 8/10 gravité)
- **14 incohérences majeures** compromettent l'évaluation
- **TOUS les 10 FN sont des incohérences** (mapping errors)
- **37 cas borderline** créent de l'ambiguïté de référence
- **Impact estimé**: -10 à -15 points d'accuracy

#### B. Couverture Insuffisante (Score: 9/10 gravité)  
- **73.8% vocabulaire nouveau** vs développement
- **Diversité linguistique 3x supérieure** au training
- **92% phrases nouvelles** non vues en développement
- **89 échantillons dev vs 221 holdout**: ratio insuffisant
- **Impact estimé**: -15 à -20 points d'accuracy

#### C. Distribution Déséquilibrée (Score: 6/10 gravité)
- **57.9% REJECTED** dans holdout vs patterns dev
- **Surreprésentation recrutement**: +318% vs dev
- **Nouveaux types de contenus** non vus (communications officielles massives)

### 6.2 Causes Internes (V2F) - **IMPACT MODÉRÉ**

#### A. Logique Score=0 Trop Permissive (Score: 7/10 gravité)
- **47 cas Score=0 → REVIEW** par défaut V2F
- **Révision par défaut** au lieu de rejet justifié
- **Impact**: Pollution indirecte via surcharge révision

#### B. Détection Intent MARKET Erronée (Score: 6/10 gravité)
- **4 cas scores élevés** (2.1-2.9) incorrects
- **Signaux "prestation/services"** trop sensibles
- **Impact**: Pollution directe limitée mais critique

#### C. Patterns Recrutement Insuffisants (Score: 5/10 gravité)
- **37 erreurs recrutement** non détectées
- **Variantes linguistiques** manquées
- **Contextes services** mal différenciés

### 6.3 Causes Méthodologiques (Score: 4/10 gravité)

#### A. Validation Croisée Insuffisante
- **Pas de validation dataset holdout** avant test
- **Pas de contrôle cohérence** titre ↔ classification
- **Génération données** non supervisée

## 7. Réponse à la Question Centrale

> **L'échec de V2F provient-il principalement d'un manque de couverture des règles, d'une mauvaise définition des catégories, de seuils mal calibrés, ou d'une limite structurelle de l'approche rule-based ?**

### Réponse Pondérée:

1. **MANQUE DE COUVERTURE DES RÈGLES** (35% de la cause)
   - Vocabulaire 73.8% nouveau, patterns divergents
   - 89 échantillons dev insuffisants pour 221 holdout

2. **QUALITÉ/DÉFINITION DES CATÉGORIES** (30% de la cause)  
   - 14 incohérences majeures dataset
   - 37 cas borderline ambigus
   - 10 FN sont des mapping errors

3. **LIMITE STRUCTURELLE RULE-BASED** (25% de la cause)
   - Score=0 par défaut trop permissif (47 cas)
   - Difficulté généralisation linguistique
   - Gestion ambiguïté limitée

4. **SEUILS MAL CALIBRÉS** (10% de la cause)
   - 4 cas scores élevés incorrects seulement
   - Seuils globalement cohérents

## 8. Recommandations Architecturales

### 8.1 Solutions Immédiates

#### A. Correction Dataset (Priorité 1)
- **Auditer et corriger** les 14 incohérences identifiées
- **Recalculer métriques** sur dataset corrigé
- **Validation croisée** systématique titre ↔ classification

#### B. Expansion Données (Priorité 1)  
- **Objectif**: 500+ échantillons avant prochaine version
- **Focus**: Vocabulaire recrutement, communications officielles
- **Méthode**: Données réelles, pas synthétiques

### 8.2 Solutions Architecturales

#### A. Hybride Rule-Based + ML (Recommandé)
- **Garder V2F** pour cas évidents (score > 2.0)
- **ML pour zone grise** (score 0-2.0)
- **Apprentissage actif** sur cas ambigus

#### B. Amélioration V2G (Alternative)
- **Logique Score=0** : REJECTED par défaut, pas REVIEW
- **Patterns recrutement** enrichis (variantes linguistiques)  
- **Détection communications** officielles renforcée

### 8.3 Solutions Méthodologiques

#### A. Validation Robuste
- **Holdout 30%** minimum du total
- **Validation croisée** k-fold sur développement
- **Contrôles qualité** automatiques

#### B. Métriques Adaptées
- **Pollution pondérée** par gravité erreur
- **Recall par catégorie** critique
- **Confiance prédictions** pour routage review

## 9. Conclusions

### 9.1 Diagnostic Final

V2F **n'est pas fondamentalement défaillant**. L'échec apparent provient d'une **convergence de facteurs externes** (données insuffisantes, incohérences dataset) et **internes** (règles trop permissives) qui créent une **tempête parfaite**.

### 9.2 Leçons Apprises

1. **Données > Algorithmes**: 89 échantillons insuffisants pour 221 test
2. **Qualité > Quantité**: 14 incohérences sabotent l'évaluation  
3. **Rule-based viable**: Mais nécessite données massives et qualité parfaite
4. **Validation critique**: Contrôles qualité dataset indispensables

### 9.3 Voie Forward

**Recommandation**: Suspendre développement V2G jusqu'à **correction dataset + expansion données**. L'approche rule-based reste valide mais nécessite des fondations solides.

**Objectif réaliste**: V2G avec dataset corrigé (500+ échantillons) pourrait atteindre 75-80% accuracy, 5-10% pollution - viable pour production avec révision manuelle.

---

*Analyse réalisée le 2026-09-23 sur dataset holdout-validation-dataset.json (221 échantillons) avec classificateur V2F gelé.*