# V2F → V2G TRANSITION - CORRECTION PROTOCOLE

## 🚨 ERREUR MÉTHODOLOGIQUE IDENTIFIÉE

**PROBLÈME** : V2F était gelée mais a été modifiée durant l'analyse, créant de facto une V2G non documentée.

## 📋 SITUATION ACTUELLE

### V2F Original (État avant modifications)
- **Statut** : Devait rester gelé pour référence
- **Performance holdout** : 53,8% accuracy, 64,7% vs labels humains
- **Problèmes identifiés** : 4 erreurs critiques, 10 opportunités perdues, 11 pollution modérée

### "V2F Modifié" → **RENOMMER EN V2G**
- **Modifications apportées** :
  - Règles contextuelles gouvernementales
  - Recalibrage signaux marchés (mobilier, infrastructure, etc.)
  - Logique Score=0 moins punitive  
  - Seuil VALID : 1.5 → 2.0
  - Zone grise gouvernementale 1.5-3.0
  - Nouveaux patterns ambigus
  - Signature fonction : ajout paramètre source

## ❌ VALIDATION 65,2% NON FIABLE

**Raisons** :
- Script "simplifié" avec estimations
- Pas de dataset complet 221 textes + labels + prédictions V2G
- Matrice confusion "corrigée estimée" ≠ mesures réelles
- Test sur cas utilisés pour concevoir les règles

## ✅ PLAN CORRECTION IMMÉDIAT

### 1. **GELER V2F ORIGINAL**
```bash
# Backup créé : intentClassifierV2F_frozen_backup.js
# Tag : v2f-frozen-baseline
```

### 2. **CRÉER V2G OFFICIELLE**  
```bash
# Renommer modifications actuelles → V2G
# Documenter TOUTES les différences V2F → V2G
# Geler V2G pendant validation
```

### 3. **VALIDATION INDÉPENDANTE V2G REQUISE**
```text
221 textes holdout
+ 221 prédictions V2G (exécution réelle)
+ 221 labels humains GOLD validés
= Métriques fiables
```

### 4. **BLIND SET NÉCESSAIRE**
- Holdout-221 compromis (utilisé pour développement)
- Nouveau dataset ≥100 échantillons JAMAIS utilisés
- Test final aveugle

## 🎯 CRITÈRES PRODUCTION STRICTS

**Ne PAS déclarer "production-ready" sans :**
- Pollution < 5%
- Recall VALID ≥ 95% 
- Validation blind set réussie
- Aucune régression critique non expliquée

## 📊 MÉTRIQUES À CALCULER PROPREMENT

| Métrique | V2F | V2G | Delta | Méthode |
|----------|-----|-----|-------|---------|
| Accuracy | 53.8% | ? | ? | Direct count |
| VALID Recall | 70.0% | ? | ? | TP/(TP+FN) |
| Pollution | ? | ? | ? | Non-marchés → VALID / Total |
| Critical Errors | 4 | ? | ? | Count REJECTED→VALID |

## 🚫 INTERDICTIONS VALIDATION

- ❌ Modifier V2G pendant validation
- ❌ Utiliser métriques estimées
- ❌ Tester uniquement sur cas connus
- ❌ Déclarer succès avant blind set

## ✅ LIVRABLES REQUIS

1. `V2G_HOLDOUT_VALIDATION_REPORT.md`
2. `V2G_HOLDOUT_PREDICTIONS.json` (221 exécutions réelles)
3. `V2G_METRICS.json` (calculs directs)
4. `V2G_VS_V2F_COMPARISON.md`
5. `V2G_BLIND_SET_VALIDATION.md`

---

**CONCLUSION** : Recommencer validation V2G avec méthodologie rigoureuse.
Les modifications techniques semblent prometteuses mais doivent être **prouvées**, pas estimées.

*Date : 2026-09-23*
*Status : V2F frozen, V2G validation required*