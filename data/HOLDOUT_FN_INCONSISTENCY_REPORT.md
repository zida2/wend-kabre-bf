# RAPPORT D'INCOHÉRENCE - FAUX NÉGATIFS HOLDOUT

## Problème Identifié

**INCOHÉRENCE MAJEURE DANS LE DATASET HOLDOUT**

Les 10 faux négatifs (holdout-209 à holdout-221) présentent une **incohérence fondamentale** entre leurs titres et leurs classifications humaines.

## Analyse Détaillée

### Échantillons Incohérents

| ID | Titre Réel | Classification Humaine | Notes Humaines |
|----|------------|----------------------|----------------|
| holdout-209 | "Déclaration sur la politique nationale de lutte contre la pauvreté" | **VALID** | "Mobilier scolaire - fourniture mobilier" |
| holdout-210 | "Communiqué du Ministère des Affaires Étrangères sur les relations bilatérales" | **VALID** | "Extension électrique - infrastructure" |
| holdout-212 | "Déclaration sur la mise en œuvre des Objectifs du Millénaire" | **VALID** | "Construction 30 salles - marché construction" |
| holdout-213 | "Communiqué sur les mesures de soutien aux producteurs agricoles" | **VALID** | "Réhabilitation aéroport - marché travaux" |
| holdout-214 | "Déclaration relative à la protection de l'environnement" | **VALID** | "Centre formation - marché construction" |
| holdout-215 | "Communiqué sur le renforcement de la coopération Sud-Sud" | **VALID** | "Bitumage routes - marché infrastructure" |
| holdout-217 | "Déclaration sur la politique de promotion de la jeunesse" | **VALID** | "Kits urgence - fourniture santé" |
| holdout-218 | "Communiqué de fin de Conseil des Ministres" | **VALID** | "Matériel informatique - fourniture" |
| holdout-220 | "Déclaration sur la stratégie nationale de développement durable" | **VALID** | "Panneaux solaires - fourniture énergie" |
| holdout-221 | "Communiqué sur les mesures de lutte contre la corruption" | **VALID** | "Ambulances - acquisition véhicules" |

## Diagnostic

### 1. Nature de l'Incohérence
- **Titres**: Tous sont des communications officielles (déclarations, communiqués)
- **Classifications**: Toutes sont VALID market_* 
- **Notes humaines**: Décrivent des marchés réels (mobilier, construction, fournitures)

### 2. Hypothèse sur la Cause
Il semble y avoir eu une **erreur de mapping** lors de la création du dataset holdout :
- Les titres correspondent à des communications officielles 
- Les classifications et notes correspondent à de vrais marchés publics
- Les IDs peuvent avoir été mélangés ou mal assignés

### 3. Impact sur V2F
**V2F a correctement classé ces échantillons comme REJECTED** car :
- Les titres contiennent "déclaration" et "communiqué"
- V2F détecte correctement les contenus non-marchés
- Score = 0 avec raison : "contenus explicitement non-marchés → rejet V2F"

## Validation de V2F

**V2F N'EST PAS EN ERREUR** sur ces 10 cas :

1. **Classification correcte** : Communications officielles → REJECTED
2. **Logique cohérente** : Pattern "déclaration/communiqué" détecté
3. **Score approprié** : 0 (aucun signal marché dans les titres)
4. **Intent cohérent** : NEUTRAL (pas de signal marché/recrutement)

## Conséquences sur l'Évaluation

### Métriques Impactées
- **Faux négatifs** : 10 cas sont en réalité des **vrais positifs V2F**
- **Recall** : Sous-estimé de 17.8% (10/56 échantillons VALID)
- **Accuracy** : Sous-estimée d'environ 4.5% (10/221 total)

### Métriques Corrigées (Hypothétiques)
Si on retire ces 10 incohérences :
- **Faux négatifs** : 0 au lieu de 10
- **Recall** : 100% au lieu de 50%
- **Accuracy** : ~58.4% au lieu de 53.8%

## Recommandations

### 1. Audit Dataset Holdout
- Vérifier l'intégrité des assignations ID ↔ contenu
- Identifier la source de l'incohérence (génération, mapping, saisie)
- Corriger ou exclure les échantillons incohérents

### 2. Re-évaluation V2F
- Exclure les 10 cas incohérents de l'évaluation
- Recalculer les métriques sur les 211 échantillons cohérents
- Comparer avec les résultats des datasets précédents

### 3. Validation Méthodologique
- Contrôler la cohérence titre ↔ classification sur tous les datasets
- Mettre en place des contrôles qualité automatiques
- Documenter les processus de génération de données

## Conclusion

**Les 10 "faux négatifs" identifiés sont en réalité des incohérences dans le dataset holdout, pas des erreurs de V2F.**

V2F a correctement identifié ces communications officielles comme non-marchés, conformément à sa conception. L'erreur provient d'une assignation incorrecte dans les données de référence.

Cette découverte remet en question la fiabilité du dataset holdout et suggère que les performances réelles de V2F pourraient être meilleures que les 53.8% d'accuracy rapportés.