# 💾 Stratégie de Sauvegarde & Restauration PostgreSQL — Wend-Kabré Production

## 🔁 1. Sauvegardes Automatiques Render

Render PostgreSQL (même plan Free) propose:
- **Sauvegarde quotidienne** automatique
- **Rétention 7 jours** (Free Tier) → **30 jours** (plans payants)
- **Point-in-Time Recovery (PITR)** sur plans Pro+

**Récupération rapide** depuis UI Render:
1. Render → `wendkabre-payment-db` → **Backups**
2. Sélectionner un instantané → **Restore**
3. Choisir "Restore to new instance" (sans écraser la prod) ou remplacer

---

## 🛠️ 2. Sauvegarde Manuelle avec `pg_dump`

### Prérequis
- PostgreSQL CLI installé: `psql --version` (≥ 14 recommandé)
- URL interne ou externe Render (mode **External Database URL** dans Settings → SSL requis)

### Script Windows PowerShell : `scripts/backup-manuel.ps1`
```powershell
# backup-manuel.ps1 — Wend-Kabré
param(
  [string]$DbUrl = $env:DATABASE_URL
)
if (-not $DbUrl) { throw "DATABASE_URL obligatoire" }
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile  = ".\backups\wendkabre_payment_$timestamp.dump"
New-Item -ItemType Directory -Force -Path .\backups | Out-Null
Write-Host "🔄 Dump PostgreSQL vers $dumpFile..."
& pg_dump $DbUrl -F c -b -v -f $dumpFile
if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Sauvegarde OK: $dumpFile"
  $size = (Get-Item $dumpFile).Length / 1KB
  Write-Host ("📦 Taille: {0:N1} KB" -f $size)
} else {
  Write-Error "❌ Échec pg_dump. Code: $LASTEXITCODE"
}
```

### Ligne de commande directe bash / linux / macOS :
```bash
mkdir -p backups
pg_dump "postgresql://user:mdp@host:5432/db?sslmode=require" \
  -F c -b -v \
  -f "backups/wendkabre_payment_$(date +%Y%m%d_%H%M%S).dump"
```

### Sauvegarde d'UNE seule table critique :
```bash
# Table payment_transactions (la plus critique)
pg_dump "$DATABASE_URL" -t payment_transactions -F c \
  -f "backups/payment_tx_$(date +%Y%m%d).dump"

# Table subscriptions
pg_dump "$DATABASE_URL" -t subscriptions -t users -F c \
  -f "backups/subscriptions_$(date +%Y%m%d).dump"
```

---

## 📥 3. Restauration d'un dump

### A) Vérifier l'intégrité avant de restaurer
```bash
pg_restore --list backup.dump | head -n 30
```

### B) Restaurer sur une instance de test (RECOMMANDÉ)
```bash
# Créer une base temporaire sur votre local ou un service staging
createdb -h localhost -U postgres wendkabre_restore_test

# Importer le dump
pg_restore --clean --no-acl --no-owner \
  -h localhost -U postgres \
  -d wendkabre_restore_test \
  backup.dump
```

### C) Restaurer sur Render Production
⚠️ **JAMAIS directement sur la base active sans backup à jour!**
1. Render → PostgreSQL → **Backups** → Restore un point de restauration
2. Ou passer par `pg_restore` en External URL:
```bash
pg_restore --clean --no-acl --no-owner \
  -d "$DATABASE_URL_EXTERNAL" \
  backup.dump
```

---

## 📋 4. Calendrier de Sauvegarde Recommandé

| Type | Fréquence | Rétention | Automatisation |
|---|---|---|---|
| Instantané Render Quotidien | Tous les jours à 02h00 | 30 jours | ✅ Natif Render |
| Dump pg_dump Complet | 1 fois / semaine (dimanche) | 90 jours | Script + CRON serveur / GitHub Actions |
| Dump Tables Critiques | Tous les jours | 30 jours | CRON quotidien |
| Avant Migration Prisma | Systématique | Permanent (git LFS / S3) | Manuel pré-deploy |

---

## 🔒 5. Chiffrement & Stockage Hors-Site

### Problème:
Les dumps contiennent **PII** (emails, téléphones, historiques de transactions). Jamais en clair.

### Solution:
```bash
# Sauvegarder + chiffrer avec GPG ou OpenSSL
pg_dump "$DATABASE_URL" -F c \
  | openssl enc -aes-256-cbc -pbkdf2 -salt \
      -out "backups/wendkabre_$(date +%Y%m%d).dump.enc" \
      -pass env:BACKUP_ENCRYPTION_PASSWORD
```

### Stocker dans:
- **Google Drive / One Drive** → dossier privé chiffré
- **AWS S3 / Cloudflare R2** → Bucket versionné, accès IAM restreint
- **Stockage physique déconnecté** (disque dur externe) tous les trimestres

---

## 🎯 6. Procédure Récupération d'Urgence (Runbook)

**Scénario**: Corruption de données / erreur de migration Prisma / attaque.

1. **🚨 ANNONCER** l'incident interne (stop tout déploiement)
2. **💾 FAIRE** un backup de la base cassée (forensic):
   ```bash
   pg_dump "$DATABASE_URL" -F c -f "backups/FORENSIC_avant_restore.dump"
   ```
3. **↩️ RESTAURER** le dernier backup Sain sur une BDD `staging-wendkabre-db`
4. **🔬 VERIFIER** l'intégrité dans staging:
   - `SELECT COUNT(*) FROM payment_transactions;` correspond au dernier état connu
   - Rejouer un webhook de test
5. **✂️ COUPER** le traffic: Mettre le service en mode Maintenance / 503
6. **🔄 SWITCH** variable `DATABASE_URL` vers la base restaurée
7. **🔓 REDÉMARRER** les services → Santé: /health OK
8. **✅ TESTER** la checklist de production (Étape 8 du livrable)
9. **📢 COMMUNIQUER** aux utilisateurs si indisponibilité > 15min
10. **📝 POST-MORTEM** — documenter la cause et la résolution

---

## ✅ 7. Checklist de Bonnes Pratiques

- [ ] Tester la restauration de sauvegarde **au moins 1 fois par trimestre**
- [ ] Vérifier que l'espace disque du backup storage ne sature pas
- [ ] Rotation: aucun dump ne doit dépasser la durée de rétention définie
- [ ] MDP de chiffrement des dumps: sauvegardé dans un coffre-fort (1Password / Vaultwarden)
- [ ] Audit logs: qui a restauré quoi et quand → accessible dans Render Events
