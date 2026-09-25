# GROUND TRUTH POLICY V1 - WEND-KABRÉ

## Contexte et Objectif

Cette politique définit **précisément** les critères de classification des contenus pour la plateforme Wend-Kabré Burkina Faso. Elle s'appuie sur l'analyse des 221 échantillons holdout et l'adjudication des 24 incohérences identifiées.

**Objectif** : Classifier les avis, annonces et communications selon leur **pertinence pour les marchés publics** exploitables par les entreprises burkinabè.

## Définition des Classes

### 🟢 VALID - Opportunité de Marché Exploitable

**Définition** : Contenu qui constitue une **opportunité de marché public directement exploitable** pour les entreprises.

#### Critères Nécessaires (TOUS requis) :

1. **Procédure contractuelle explicite**
   - Appel d'offres publié
   - Marché public annoncé
   - Demande de soumissions/candidatures
   - Procédure d'acquisition formalisée

2. **Objet commercial défini**
   - Fourniture de biens identifiés
   - Prestation de services spécifiés
   - Travaux de construction/réhabilitation décrits
   - Acquisition d'équipements listés

3. **Actionnable pour entreprises**
   - Possibilité de soumissionner
   - Critères de participation énoncés
   - Échéances précisées (ou prochainement disponibles)
   - Contact ou procédure mentionnés

#### Exemples VALID Confirmés :

✅ **"Appel d'offres pour la construction de 30 salles de classe dans la région du Centre-Est"**
- Procédure : appel d'offres
- Objet : construction définie
- Actionnable : entreprises BTP peuvent soumissionner

✅ **"Acquisition de matériel informatique pour 100 écoles primaires"**
- Procédure : acquisition publique
- Objet : matériel spécifié
- Actionnable : fournisseurs IT concernés

✅ **"Marché de travaux de réhabilitation de l'aéroport de Bobo-Dioulasso"**
- Procédure : marché public
- Objet : travaux décrits
- Actionnable : entreprises infrastructure

#### Exclusions VALID :

❌ Annonces de politiques générales sans procédure spécifique
❌ Communications institutionnelles sans appel commercial
❌ Projets futurs sans processus de sélection lancé
❌ Recrutements directs de personnel

---

### 🟡 REVIEW - Contenu Potentiellement Pertinent

**Définition** : Contenu **potentiellement pertinent** mais nécessitant une **validation humaine** pour déterminer sa pertinence marchés publics.

#### Critères Déclencheurs (AU MOINS UN requis) :

1. **Ambiguïté procédurale**
   - Mentions de "prestation" sans précision sur la procédure
   - "Services de..." pouvant être marchés ou recrutement
   - "Mission d'expertise" sans clarté contractuelle

2. **Études et consulting borderline**
   - Études de faisabilité (potentiellement marchés d'expertise)
   - Missions de conseil (selon le contexte)
   - Évaluations techniques (si externalisées)
   - Audits spécialisés (selon la procédure)

3. **Services externalisés ambigus**
   - Maintenance pouvant être marché ou recrutement prestataire
   - Nettoyage selon le contexte (marché vs embauche)
   - Gardiennage selon la formulation
   - Formation selon modalités (marché vs académique)

4. **Informations incomplètes**
   - Mention de marché sans détails suffisants
   - Procédure évoquée mais non détaillée
   - Objet défini mais modalités floues

#### Exemples REVIEW :

⚠️ **"Prestation de services d'audit énergétique des bâtiments publics"**
- Peut être marché d'expertise OU mission interne
- Nécessite vérification procédure

⚠️ **"Recrutement prestataire - Services de gardiennage des sites gouvernementaux"**
- Ambiguïté : recrutement direct OU marché de service
- Contexte déterminant

⚠️ **"Étude de faisabilité pour l'implantation d'industries agroalimentaires"**
- Peut être marché d'étude OU recherche interne
- Modalités à clarifier

#### Principe REVIEW :

**"Dans le doute, orienter vers révision humaine"** - Mieux vaut analyser un cas borderline que manquer une opportunité.

---

### 🔴 REJECTED - Contenu Non-Marché

**Définition** : Contenu qui **ne constitue PAS** une opportunité de marché public exploitable.

#### Catégories REJECTED :

##### 1. **Recrutements Directs**
- Avis de recrutement d'agents/fonctionnaires
- Offres d'emploi dans l'administration
- Postes vacants pour personnel permanent
- Concours de recrutement

**Exemples** :
❌ "Avis de recrutement - 100 instituteurs pour l'enseignement primaire"
❌ "Poste vacant - Directeur des Ressources Humaines au Ministère"

##### 2. **Communications Officielles**
- Déclarations de politique générale
- Communiqués institutionnels
- Messages diplomatiques
- Annonces stratégiques sans procédure marchés

**Exemples** :
❌ "Déclaration sur la politique nationale de lutte contre la pauvreté"
❌ "Communiqué du Ministère des Affaires Étrangères sur les relations bilatérales"

##### 3. **Contenus Académiques/Cérémoniels**
- Soutenances de thèses
- Conférences scientifiques
- Séminaires de formation
- Inaugurations/cérémonies
- Remises de prix/diplômes

**Exemples** :
❌ "Soutenance de thèse de Doctorat en Sciences Économiques"
❌ "Inauguration du nouveau Palais de Justice de Koudougou"

##### 4. **Avis de Décès et Condoléances**
- Avis de décès de personnalités
- Messages de condoléances
- Hommages posthumes

**Exemples** :
❌ "Avis de décès - Rappel à Dieu du Professeur Joseph KABORE"

##### 5. **Nominations et Mouvements**
- Décrets de nomination
- Mouvements dans l'administration
- Affectations de personnel
- Promotions administratives

**Exemples** :
❌ "Décret portant nomination du nouveau Gouverneur de la Région"
❌ "Mouvement dans le corps préfectoral - Nouvelles affectations"

---

## Cas Limites et Frontières Critiques

### Frontière 1 : Marché vs Recrutement

| Type | VALID | REVIEW | REJECTED |
|------|-------|--------|----------|
| **Pattern** | "Marché de prestation de X" | "Recrutement prestataire - Services de X" | "Avis de recrutement - Agents X" |
| **Indicateur clé** | Procédure contractuelle | Ambiguïté procédure/statut | Embauche directe |
| **Exemple** | "Appel d'offres maintenance" | "Prestation maintenance jardins" | "Recrutement jardiniers" |

### Frontière 2 : Marché vs Communication Officielle

| Type | VALID | REVIEW | REJECTED |
|------|-------|--------|----------|
| **Pattern** | "Appel d'offres pour construction X" | "Projet de construction X en étude" | "Annonce construction X" |
| **Indicateur clé** | Procédure lancée | Procédure future possible | Annonce générale |
| **Exemple** | "Marché travaux école" | "Étude faisabilité école" | "Politique éducation nationale" |

### Frontière 3 : Service vs Recrutement

| Type | VALID | REVIEW | REJECTED |
|------|-------|--------|----------|
| **Pattern** | "Contrat de service X" | "Services de X" (ambigu) | "Recherche agents X" |
| **Indicateur clé** | Contrat externe | Modalités floues | Personnel interne |
| **Exemple** | "Marché nettoyage" | "Services nettoyage" | "Recrutement personnel entretien" |

---

## Règles de Classification

### Règle 1 : Hiérarchie des Signaux

1. **Signaux VALID prioritaires** : "appel d'offres", "marché public", "soumission"
2. **Signaux REJECTED prioritaires** : "déclaration", "communiqué", "avis de décès"
3. **Signaux REVIEW** : "prestation", "services de", "étude", "mission"

### Règle 2 : Principe de Précaution

**En cas de doute entre VALID et REVIEW** → Classer REVIEW
**En cas de doute entre REVIEW et REJECTED** → Classer REVIEW

### Règle 3 : Contextualisation

**Le même mot peut avoir des sens différents selon le contexte** :
- "Formation" + "prestation" = potentiellement VALID
- "Formation" + "séminaire" = probablement REJECTED
- "Services" + "appel d'offres" = VALID
- "Services" + "recrutement" = REJECTED

### Règle 4 : Exhaustivité vs Précision

**Préférer capturer une opportunité ambiguë (REVIEW) que manquer un vrai marché**

---

## Validation et Contrôle Qualité

### Tests de Cohérence

Pour valider l'application de cette politique, chaque classificateur (humain ou automatique) doit réussir ces tests :

1. **Communications officielles** → systématiquement REJECTED
2. **Appels d'offres explicites** → systématiquement VALID
3. **Recrutements directs** → systématiquement REJECTED
4. **Prestations ambiguës** → systématiquement REVIEW

### Métriques de Qualité

- **Taux d'accord inter-annotateurs** : >90% sur échantillon test
- **Cohérence temporelle** : même classificateur sur même contenu = même résultat
- **Couverture marchés** : aucun marché public réel classé REJECTED

---

## Évolution et Maintenance

### Révisions Autorisées

Cette politique peut être révisée si :
1. **Nouveaux types de contenus** non couverts apparaissent
2. **Retour utilisateurs** indique des manques systématiques
3. **Évolution légale** des marchés publics burkinabè

### Révisions Interdites

❌ Modifier les classes pour améliorer métriques d'un classificateur
❌ Ajuster définitions après avoir vu les résultats d'évaluation
❌ Changer rétroactivement des labels déjà validés

---

## Application Pratique

### Workflow de Classification

1. **Lecture intégrale** du contenu
2. **Identification signaux** VALID/REJECTED évidents
3. **Si évident** → Classer directement
4. **Si ambigu** → Analyser contexte et modalités
5. **Si persistance doute** → REVIEW

### Documentations Requises

Chaque classification doit être accompagnée de :
- **Justification** (1 phrase)
- **Signaux déclencheurs** identifiés
- **Niveau de confiance** (Certain/Probable/Ambigu)

---

*Politique établie le 2026-09-23 suite à l'adjudication de 24 cas problématiques sur dataset holdout-221.*