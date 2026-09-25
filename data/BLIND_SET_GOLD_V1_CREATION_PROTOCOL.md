# BLIND SET GOLD V1 - PROTOCOLE DE CRÉATION

## OBJECTIFS
- Créer un dataset indépendant de ≥100 échantillons
- Distribution naturelle reflétant le contenu réel Wend-Kabré
- Labels GOLD assignés AVANT toute prédiction V2F/V2G
- Aucune contamination des datasets précédents

## CRITÈRES STRICTS
1. **INDÉPENDANCE TOTALE** : Aucun échantillon des datasets précédents
2. **DISTRIBUTION NATURELLE** : Pas d'équilibrage artificiel
3. **LABELLISATION AVEUGLE** : Labels assignés sans consulter V2F/V2G
4. **FROZEN STATUS** : Dataset verrouillé avant validation

## SOURCES AUTORISÉES
- Nouveaux appels d'offres Wend-Kabré non utilisés
- Données réelles de la plateforme
- Échantillons collectés indépendamment

## SOURCES INTERDITES
- holdout-validation-dataset.json (221 échantillons)
- gold-dataset-v1.json (compromis)
- benchmark datasets V1/V2x
- Tous datasets ayant servi à l'entraînement/validation

## PROCESSUS
1. Collecte de ≥100 échantillons nouveaux
2. Assignment des labels GOLD par expertise humaine
3. Vérification de l'indépendance totale
4. Freeze du dataset
5. Validation V2F vs V2G

## STATUS ACTUEL
- [ ] Échantillons collectés
- [ ] Labels GOLD assignés
- [ ] Indépendance vérifiée
- [ ] Dataset FROZEN
- [ ] Validation prête

**RÈGLE ABSOLUE** : Aucune prédiction V2F/V2G avant FROZEN = TRUE