# 🛡️ Audit de Sécurité et de Conformité Production (Wend-Kabré SaaS)

Ce document présente l'audit complet réalisé sur l'architecture backend Wend-Kabré et le microservice autonome `payment-service` avant la mise en production sur Render.

---

## 📊 Résumé de l'Audit

| Domaine | Statut | Niveau de Risque | Correctifs Appliqués |
| :--- | :--- | :--- | :--- |
| **Sécurité Webhooks** | ✅ Conforme | Élevé (Résolu) | Signature HMAC sha256 + Protection anti-replay attacks (Nonces) + Validation des montants |
| **Authentification API** | ✅ Conforme | Moyen (Résolu) | Protection JWT sur `/stats` + Rate limiting à 30 req / 15 min sur `/create` |
| **Injections SQL & ORM** | ✅ Conforme | Faible | Requêtes paramétrées via Prisma ORM PostgreSQL |
| **Hébergement Render** | ✅ Conforme | Faible | Configuration HTTPS native + Variables secrètes injectées au niveau du service |
| **Journalisation / Logs** | ✅ Conforme | Faible | Logs structurés persistants enregistrés dans `logs/payment.log` |

---

## 🔍 Niveaux de Priorité & Résolution des Failles

### 1. [HAUTE PRIORITÉ] Risque d'Attaque par Rejeu sur les Webhooks Money Fusion
- **Problème** : Un attaquant rejouant la même notification de paiement validé pouvait essayer de déclencher plusieurs fois l'activation d'abonnements.
- **Correction Appliquée** : Implémentation du service `WebhookSecurityService` avec un registre de nonces en mémoire qui bloque immédiatement tout doublon de notification (`Replay Attack Blocked`).

### 2. [HAUTE PRIORITÉ] Discordance de Montant (Tampering Attack)
- **Problème** : Risque qu'un client modifie le montant dans la passerelle de paiement et envoie une notification de validation avec un montant inférieur au plan choisi.
- **Correction Appliquée** : Comparaison systématique entre le montant réel payé renvoyé par Money Fusion et le montant attendu de la transaction en base de données avec une tolérance stricte de 0 FCFA.

### 3. [MOYENNE PRIORITÉ] Protection contre les Attaques par Déni de Service (DDoS / Brute Force)
- **Problème** : Risque de sur-utilisation des endpoints de création de paiement.
- **Correction Appliquée** : Intégration de `express-rate-limit` limitant à 30 demandes de paiement par tranche de 15 minutes par IP et 120 requêtes/minute au niveau global.

### 4. [MOYENNE PRIORITÉ] En-têtes HTTP de Sécurité
- **Problème** : Vulnérabilité aux attaques XSS, Clickjacking, MIME-sniffing.
- **Correction Appliquée** : Intégration globale de `Helmet.js` et restriction CORS stricte.

---

## 📋 Variables d'Environnement Secrètes

Aucune clé d'API (`MONEY_FUSION_API_KEY`, `MONEY_FUSION_TOKEN`, `JWT_SECRET`) n'est enregistrée dans le dépôt Git.
Seuls les modèles `.env.example` et `.env.production.example` sont versionnés.
