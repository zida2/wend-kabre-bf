# 📘 Guide d'Utilisation du Dashboard Admin Amélioré

**Pour**: Le propriétaire de Wend-Kabré  
**Date**: August 9, 2026  
**Version**: 2.0 (UI Restructurée)

---

## 🚀 Démarrage Rapide

### Accès au Dashboard
```
URL: https://wend-kabre.bf/admin
Email requis: zidadesire20@gmail.com
```

### Premier Login
1. Cliquez sur le bouton "Connexion Admin"
2. Entrez votre email Wend-Kabré
3. Authentifiez-vous avec Firebase
4. Redirection automatique vers Overview

---

## 📊 Vue d'Ensemble (Tableau de Bord)

**Accès**: Section "DASHBOARD" → Tableau de bord

### Contenu Principal

#### 1. KPIs (En-Tête avec Badges)
```
⚠️ 3 paiements en attente     ← URGENT (rouge)
✓ 45 utilisateurs             ← Info standard
📊 892 marchés                ← Info standard
```

- **Visible depuis n'importe quelle page**
- **Se met à jour en temps réel**
- **Cliquable pour naviguer** (en futur)

#### 2. Dashboard Complet

**Cartes KPI** (8 tiles):
```
- 👥 Utilisateurs (45 total)
- 💎 Abonnés Premium (12 total)
- 💰 Chiffre d'affaires (sync Money Fusion)
- 📈 Taux de conversion (26,7%)
- 📄 Marchés en base (892 total)
- 🆕 Nouveaux marchés (12 dernières 24h)
- ⏳ Expirent bientôt (38 sous 7 jours)
- 💳 Paiements en attente (3 actions requises)
- 🔔 Alertes actives (28 utilisateurs)
```

**Graphiques**:
- Croissance cumulative des inscriptions (6 mois)
- Répartition des marchés par secteur (barres horizontales)
- Santé du scraping (status + derniers runs)
- Activité récente (8 dernières actions admin)

---

## 👥 Section BUSINESS

### Utilisateurs
**Accès**: BUSINESS → Utilisateurs

#### Fonctionnalités
1. **Tableau de tous les utilisateurs**
   - Colonnes: Nom, Email, Contact, Statut, Expiration, Actions
   - Recherche: Nom / Email / Téléphone
   - Filtres: Premium, Essai, Expiré, Suspendu, Gratuit

2. **Gestion Individual**
   - Bouton "⚙️ Gérer le compte" par utilisateur
   - Modal détaillé avec:
     * Infos de profil complet
     * Statut d'abonnement
     * Historique de paiements
     * Actions rapides

3. **Actions Disponibles**
   ```
   - 💎 Ajouter 30 jours Premium
   - 🎁 Ajouter 7 jours d'essai
   - 🚫 Retirer l'abonnement
   - ⏸️ Suspendre le compte
   - 🗑️ Supprimer définitivement
   - 💬 Contacter WhatsApp
   - ✉️ Envoyer email
   ```

#### Cas d'Usage
**Scénario 1: Activer essai gratuit**
1. Rechercher l'utilisateur → Nom/Email
2. Cliquer "Gérer le compte"
3. Cliquer "Ajouter 7 jours d'essai"
4. Confirmation toast ✅
5. Utilisateur reçoit notification (futur)

**Scénario 2: Suspendre utilisateur abusif**
1. Rechercher utilisateur
2. Cliquer "Gérer le compte"
3. Cliquer "Suspendre le compte"
4. Log audit créé automatiquement
5. Compte désactivé pour ce user

---

### Paiements (BADGE ⚠️ ROUGE)
**Accès**: BUSINESS → Paiements (badge rouge si en attente)

#### Workflow de Validation
```
Status: PENDING
  ↓
1. Admin reçoit notification ⚠️ en header
2. Va à section Paiements
3. Voit tableau avec demandes en attente
4. Examine le reçu OCR (image du paiement)
5. Valide (✅ APPROVED) ou rejette (🚫 REJECTED)
  ↓
Si APPROVED:
  - Active l'abonnement (durée = plan)
  - Crée log audit
  - Email confirmation (TODO)
  
Si REJECTED:
  - Marque comme rejeté
  - Crée log audit
  - Email raison (TODO)
```

#### Boutons d'Actions
```
👁️ Voir le reçu       → Affiche l'image en modal
✅ Valider             → Approuver + activer abo
🚫 Rejeter             → Refuser la demande
📋 Détails             → Voir infos complètes
```

#### Colonnes Tableau
| Colonne | Description |
|---------|-------------|
| Utilisateur | Email et nom |
| Plan | Starter, Premium, Enterprise |
| Montant | Somme en FCFA |
| Date | Quand la demande a été créée |
| Reçu | Thumbnail image |
| Statut | pending, approved, rejected |
| Actions | Boutons d'action |

---

## 📈 Section ANALYTICS

### Analytique
**Accès**: ANALYTICS → Analytique

Affiche:
- Trafic visiteurs (Google Analytics format)
- Sources de trafic
- Pages populaires
- Taux de rebond
- Conversion: Visiteur → Utilisateur → Premium

### Statistiques Avancées
**Accès**: ANALYTICS → Statistiques

Affiche:
- Marchés par ministère/région/secteur
- Valeur moyenne des marchés
- Qualité du scraping (ajoutés/total/semaine)
- Top catégories (par nombre)

---

## 🎯 Section MARKETING

### Coupons
**Accès**: MARKETING → Coupons

**Actions**:
1. Créer nouveau coupon
   - Code: AUTO ou manuel
   - % Réduction: 10%, 25%, 50%
   - Utilisable: Unlimited ou Max uses
   - Dates: From/To

2. Gérer existants
   - Activer/Désactiver
   - Voir nombre d'utilisations
   - Modifier expiration

### Diffusions (Relance)
**Accès**: MARKETING → Diffusions

**Envoi Message Ciblé**:
1. Choisir audience:
   - Tous les utilisateurs
   - Utilisateurs Premium uniquement
   - Utilisateurs gratuits (relance)
   - Sans abonnement depuis 7j

2. Composer message:
   - Présets disponibles
   - Variables: {name}, {plan}, {daysLeft}

3. Planifier:
   - Immédiat
   - Programmé (date/heure)

4. Vérifier + Envoyer

### Avis Clients
**Accès**: MARKETING → Avis

**Modération**:
- Liste des avis en attente (submitted)
- Affichage du texte complet
- Actions:
  * ✅ Approuver → Publié sur homepage
  * ⭐ Mettre en avant
  * 🚫 Rejeter → Non affiché

---

## 📄 Section CONTENU

### Marchés
**Accès**: CONTENU → Marchés

**Tableau Complet**:
- Titre du marché
- Source/URL
- Secteur (catégorie)
- Date de publication
- Statut (actif, expiré, etc)
- Actions

**Actions par Marché**:
- 👁️ Voir détails
- 🔗 Ouvrir source
- 🤖 Re-analyser (IA)
- 🗑️ Supprimer

**Filtres/Recherche**:
- Par secteur
- Par source
- Par date
- Recherche full-text

### Extraction (Scraper)
**Accès**: CONTENU → Extraction

**Contrôle du Robot d'Aspiration**:

1. **Status Courant**
   ```
   ✓ Opérationnel | Dernier run: il y a 3 heures
   Ajoutés: +24 | Analysés: 178
   ```

2. **Actions**
   ```
   🚀 Lancer scraping maintenant
     → Force une extraction immédiate
     → Montre logs en temps réel
     → Ajoute données à Firestore
   ```

3. **Logs**
   ```
   > Initialisation des modules d'extraction...
   > Connexion aux serveurs RSS...
   > Aspiration et normalisation en cours...
   > TERMINÉ: 24 nouveaux marchés enregistrés
   ```

4. **Historique**
   - Derniers 10 runs
   - Status (success/error)
   - Timestamp
   - Nombre de résultats

---

## 🔍 Section MONITORING

### Transactions DB
**Accès**: MONITORING → Transactions

Affiche les transactions PostgreSQL du système de paiement Money Fusion:
- ID transaction
- User ID
- Montant
- Status
- Timestamp

### Webhooks
**Accès**: MONITORING → Webhooks

Journal des callbacks reçus de Money Fusion:
- Succès: ✅ (fond vert)
- Erreurs: ❌ (fond rouge)
- Rejeux: 🔄 (fond orange)

Chaque entry affiche:
- Type d'event
- Timestamp
- Statut
- Response
- Détails JSON

### Journal d'Audit
**Accès**: MONITORING → Audit

Historique de toutes les actions admin:
```
✅ Paiement validé — 12500 FCFA — user@example.com · il y a 2h
💎 Abonnement +30j — admin@wend-kabre.bf · il y a 5h
🚫 Paiement rejeté — user2@example.com · il y a 8h
🗑️ Marché supprimé — DAO 2024-1234 · il y a 1j
⏸️ Compte suspendu — user3@example.com · il y a 2j
```

**Colonnes**:
- Action (icône + texte)
- Par qui (email admin)
- Quand (time ago)
- Détails supplémentaires

---

## 🎨 Navigation Sidebar

### Structure Groupée

```
DASHBOARD
└─ Tableau de bord      → Vue d'ensemble système

ANALYTICS
├─ Analytique           → Trafic & comportement
└─ Statistiques         → Marchés & scraping

BUSINESS
├─ Utilisateurs         → Gestion PME
└─ Paiements        ⚠️ 3 → Validation OCR

MARKETING
├─ Coupons              → Codes promo
├─ Diffusions           → Messages ciblés
└─ Avis                 → Modération

CONTENU
├─ Marchés          📊892 → Catalogue
└─ Extraction            → Robot scraper

MONITORING
├─ Transactions         → DB paiements
├─ Webhooks             → Logs callbacks
└─ Audit                → Historique actions

🚪 Se déconnecter
```

### Navigation Rapide

**Clavier**:
- Les sections sont accessibles au clic
- Persist la section active lors du reload

**Mobile** (<900px):
- Sidebar devient barre horizontale
- Scrollable horizontalement
- Categories masquées (icônes seulement)

---

## ⌨️ Raccourcis & Tips

### Tips Productivité

1. **Paiements en attente**
   - Badge rouge en header immédiatement visible
   - Cliquez n'importe où → badge affiche "3 en attente"
   - Allez à Paiements pour traiter

2. **Utilisateurs récents**
   - Searchbar filtre en temps réel
   - Taper email, tél ou nom
   - Résultats instantanés

3. **Alertes Critiques**
   - Expirent bientôt: 38 marchés (< 7j)
   - Premium bientôt expiré: Dans "Utilisateurs"
   - Paiements rejetés: Voir statut

4. **Export de Données** (futur)
   - Tous les tableaux: bouton "Exporter CSV"
   - Filtres appliqués → export respecte les filtres
   - Exemple: Export utilisateurs Premium → utiliser en campagne marketing

---

## 🔐 Sécurité & Limitations

**Compte Admin Requis**:
- Email: `zidadesire20@gmail.com`
- Seul ce compte accède à /admin
- Les autres comptes sont redirects

**Actions Enregistrées**:
- Tout changement d'abonnement → log audit
- Toute suppression → confirmation obligatoire
- Tous les paiements approuvés → log détaillé

**Firestore Rules**:
- Seul l'admin peut modifier les documents sensibles
- Users ne peuvent pas se modifier eux-mêmes (abo, plan, etc)

---

## 🐛 Troubleshooting

### Problem: "Connexion requise"
**Solution**: Vous n'êtes pas connecté  
→ Cliquez "Connexion Admin"  
→ Authentifiez avec email admin

### Problem: "Accès refusé"
**Solution**: Votre email n'est pas admin  
→ Seul `zidadesire20@gmail.com` accède  
→ Demander au propriétaire

### Problem: "Données ne se mettent pas à jour"
**Solution**: Rechargez la page  
→ CMD+R (Mac) ou CTRL+R (Windows)  
→ Ou attendez quelques secondes (auto-sync)

### Problem: "Badge paiements encore visible après validation"
**Solution**: Rechargez la page  
→ Les données se synchronisent au prochain chargement

---

## 📱 Responsive

**Desktop (>900px)**:
- Sidebar fixe à gauche
- Contenu full-width
- 2 colonnes pour graphiques

**Tablet (600-900px)**:
- Sidebar devient barre horizontale
- Contenu scrollable
- Graphiques empilés

**Mobile (<600px)**:
- Icônes seulement pour navigation
- Contenu full-width
- Optimisé pour touch

---

## 🎓 Formation Complète

**Durée estimée**: 30 min  
**Prérequis**: Compte admin Firebase

### Module 1: Comprendre le Dashboard (5 min)
- Vue d'ensemble des sections
- Structure des données
- Indicateurs clés

### Module 2: Gérer les Utilisateurs (10 min)
- Chercher utilisateurs
- Ajouter abonnements/essais
- Suspendre comptes

### Module 3: Valider les Paiements (10 min)
- Workflow OCR
- Approuver/Rejeter
- Tracer les transactions

### Module 4: Monitoring (5 min)
- Lire les logs
- Comprendre les alertes
- Utiliser les filtres

---

**Version**: 2.0  
**Last Updated**: August 9, 2026  
**Next Review**: À chaque ajout de section
