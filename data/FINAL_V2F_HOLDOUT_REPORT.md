# RAPPORT FINAL V2F - VALIDATION HOLDOUT

## 🔒 Statut V2F
**Version définitivement gelée** - Aucune modification effectuée

## 📊 Résultats Globaux (221 échantillons)

- **Accuracy:** 53.8%
- **Precision VALID:** 65.1%
- **Recall VALID:** 50.0%
- **F1-Score:** 56.6%
- **Pollution:** 27.6% (61 cas)
- **Taux REVIEW:** 44.8%

## 📋 Matrice de Confusion

|           | VALID | REVIEW | REJECTED |
|-----------|--------|--------|----------|
| **VALID**    | 28    | 18     | 10        |
| **REVIEW**   | 11    | 24     | 2        |
| **REJECTED** | 4    | 57     | 67        |

## 📈 Comparaison Multi-Datasets

| Dataset | N | Accuracy | Recall | Pollution |
|---------|---|----------|--------|-----------|
| Benchmark | 50 | 94.0% | 100.0% | 0.0% |
| Shadow | 39 | 92.3% | 78.6% | 0.0% |
| Smoke | 10 | 100.0% | 100.0% | 0.0% |
| **HOLDOUT** | **221** | **53.8%** | **50.0%** | **27.6%** |

## ⚖️ Évaluation

### Points Forts
- Test sur dataset totalement inédit (221 échantillons)
- Architecture de validation robuste
- Méthodologie rigoureuse (V2F gelée)

### Limitations
- Taille holdout modérée pour généralisation définitive
- Classifications humaines de référence (subjectivité)
- Contexte spécifique Burkina Faso

### Recommandations
⚠️ **Ajustements recommandés avant déploiement**

---
*Rapport généré le 2026-09-23T19:31:47.989Z*
*Classificateur: V2F (version gelée)*
