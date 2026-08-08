# 💾 Stratégie de Sauvegarde et Restauration PostgreSQL (Wend-Kabré)

Ce document présente les procédures de sauvegarde, d'exportation et de restauration des données de transactions et d'abonnements pour la plateforme **Wend-Kabré**.

---

## 🔁 1. Sauvegarde Automatique sur Render PostgreSQL

Render Managed PostgreSQL effectue des sauvegardes automatiques quotidiennes conservées pendant 7 jours sur le plan gratuit.

Pour télécharger une sauvegarde depuis le tableau de bord Render :
1. Allez sur Render -> Votre Base PostgreSQL (`wendkabre-db`).
2. Cliquez sur l'onglet **Backups**.
3. Sélectionnez la sauvegarde souhaitée et cliquez sur **Download**.

---

## 🛠️ 2. Exportation Manuel via `pg_dump` (Ligne de Commande)

Vous pouvez exporter l'intégralité de la base de données à tout moment depuis votre terminal local :

```bash
# Exportation complète de la base au format SQL compressé
pg_dump "postgresql://user:password@wendkabre-db.frankfurt-postgres.render.com/wend_kabre_payment?sslmode=require" \
  -F c -b -v -f "backup_wendkabre_$(date +%Y%m%m_%H%M%S).dump"
```

### Exportation d'une table spécifique (ex: PaymentTransaction) :
```bash
pg_dump "postgresql://user:password@wendkabre-db.frankfurt-postgres.render.com/wend_kabre_payment?sslmode=require" \
  -t payment_transactions -f "payment_transactions_backup.sql"
```

---

## 📥 3. Procédure de Restauration des Données

Pour restaurer un fichier de sauvegarde `.dump` sur une nouvelle instance PostgreSQL :

```bash
pg_restore --clean --no-acl --no-owner \
  -h wendkabre-db.frankfurt-postgres.render.com \
  -U user \
  -d wend_kabre_payment \
  backup_wendkabre_20260807.dump
```

---

## 🔒 4. Recommandations de Sécurité des Sauvegardes
- Conservez au moins une sauvegarde hors-site (ex: Google Drive / S3 sécurisé).
- Les sauvegardes contiennent des données personnelles (emails, numéros de téléphone) : chiffrez les dumps avec GPG ou AES-256 avant stockage.
