# ⚡ Actions Immédiates SEO — À Faire Maintenant

## 🎯 Priorité #1 : ACHETER LE DOMAINE (30 min)

### Étapes :

1. **Choisir le domaine**
   - Option préférée : `wend-kabre.bf`
   - Option alternative : `wend-kabre.com`

2. **Acheter sur un registrar**
   - [Namecheap](https://www.namecheap.com) (recommandé)
   - [Cloudflare](https://www.cloudflare.com/products/registrar/)
   - [OVH Burkina](https://www.ovh.com/bf/)

3. **Configuration DNS**
   ```
   Type    Name    Value                           TTL
   A       @       76.76.21.21                     3600
   CNAME   www     cname.vercel-dns.com            3600
   ```

4. **Ajouter dans Vercel**
   - Settings → Domains
   - Add `wend-kabre.bf` et `www.wend-kabre.bf`

✅ **Fait ? Passer à la priorité #2**

---

## 🎯 Priorité #2 : AJOUTER LES MÉTADONNÉES (2h)

### Créer les layouts pour chaque section

#### Fichier 1 : Marchés
```javascript
// src/app/(client)/marches/layout.js
import { marchesPageMetadata } from '@/lib/seo-metadata';

export const metadata = marchesPageMetadata;

export default function MarchesLayout({ children }) {
  return <>{children}</>;
}
```

#### Fichier 2 : Recrutements
```javascript
// src/app/(client)/recrutements/layout.js
import { recrutementsPageMetadata } from '@/lib/seo-metadata';

export const metadata = recrutementsPageMetadata;

export default function RecrutementsLayout({ children }) {
  return <>{children}</>;
}
```

#### Fichier 3 : Assistant
```javascript
// src/app/(client)/assistant/layout.js
import { assistantPageMetadata } from '@/lib/seo-metadata';

export const metadata = assistantPageMetadata;

export default function AssistantLayout({ children }) {
  return <>{children}</>;
}
```

#### Fichier 4 : Tarifs
```javascript
// src/app/(client)/tarifs/layout.js
import { tarifsPageMetadata } from '@/lib/seo-metadata';

export const metadata = tarifsPageMetadata;

export default function TarifsLayout({ children }) {
  return <>{children}</>;
}
```

### Commandes à exécuter :
```bash
# Créer les fichiers
New-Item -Path "src/app/(client)/marches/layout.js" -ItemType File
New-Item -Path "src/app/(client)/recrutements/layout.js" -ItemType File
New-Item -Path "src/app/(client)/assistant/layout.js" -ItemType File
New-Item -Path "src/app/(client)/tarifs/layout.js" -ItemType File
```

✅ **Fait ? Passer à la priorité #3**

---

## 🎯 Priorité #3 : AJOUTER LE SCHEMA FAQ (30 min)

### Étape 1 : Ajouter le schema dans le layout principal

```javascript
// src/app/layout.js
import { faqJsonLd } from '@/lib/seo-metadata';

// Dans le <body>, après les autres scripts JSON-LD :
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
/>
```

### Étape 2 : Ajouter le composant FAQ sur la page d'accueil

```javascript
// src/app/(client)/page.js
import FAQ from '@/components/FAQ';

// Ajouter avant le footer :
<FAQ />
```

✅ **Fait ? Passer à la priorité #4**

---

## 🎯 Priorité #4 : OPTIMISER LES IMAGES (1h)

### Vérifications à faire :

1. **Vérifier que le banner principal existe et est optimisé**
   ```bash
   # Vérifier la taille
   Get-Item "public/wend_kabre_banner.png" | Select-Object Name, Length
   
   # Si > 200KB, compresser avec https://tinypng.com
   ```

2. **Ajouter des alt text descriptifs**
   
   Chercher tous les `<img>` sans alt :
   ```bash
   # Dans PowerShell
   Select-String -Path "src/**/*.jsx" -Pattern "<img" | Where-Object { $_ -notmatch 'alt=' }
   ```

3. **Remplacer les <img> par <Image> de Next.js**

   ❌ **Avant** :
   ```jsx
   <img src="/image.jpg" />
   ```

   ✅ **Après** :
   ```jsx
   import Image from 'next/image';
   
   <Image 
     src="/image.jpg" 
     alt="Description précise avec mot-clé"
     width={800}
     height={600}
     priority // si au-dessus de la ligne de flottaison
   />
   ```

✅ **Fait ? Passer à la priorité #5**

---

## 🎯 Priorité #5 : ACTIVER L'OPTIMISATION D'IMAGES (5 min)

### Dans next.config.ts

```typescript
// Remplacer
images: {
  unoptimized: true, // ❌
},

// Par
images: {
  unoptimized: false, // ✅
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'firebasestorage.googleapis.com',
    },
  ],
},
```

✅ **Fait ? Passer à la priorité #6**

---

## 🎯 Priorité #6 : TESTER LE BUILD (15 min)

### Commandes :

```bash
# Build de production
npm run build

# Vérifier qu'il n'y a pas d'erreurs

# Si succès, tester localement
npm start

# Ouvrir http://localhost:3000
```

### Vérifications :

- [ ] Le site se charge correctement
- [ ] Pas d'erreurs console
- [ ] Les images s'affichent
- [ ] Les métadonnées sont présentes (voir source HTML)
- [ ] Le sitemap est accessible : `/sitemap.xml`
- [ ] Le robots.txt est accessible : `/robots.txt`

✅ **Fait ? Passer à la priorité #7**

---

## 🎯 Priorité #7 : METTRE À JOUR LA VARIABLE D'ENVIRONNEMENT (5 min)

### Après l'achat du domaine

```bash
# .env.production
NEXT_PUBLIC_SITE_URL=https://wend-kabre.bf  # ← Remplacer par votre domaine
```

### Commiter et déployer

```bash
git add .env.production
git commit -m "feat(seo): update site URL to production domain"
git push origin main
```

✅ **Fait ? Passer à la priorité #8**

---

## 🎯 Priorité #8 : CONFIGURER GOOGLE SEARCH CONSOLE (20 min)

### Étapes détaillées :

1. **Créer un compte**
   - Aller sur https://search.google.com/search-console
   - Se connecter avec un compte Google

2. **Ajouter une propriété**
   - Cliquer sur "Ajouter une propriété"
   - Choisir "Préfixe d'URL"
   - Entrer : `https://wend-kabre.bf`

3. **Vérifier la propriété (méthode DNS)**
   - Copier le code de vérification (format : `google-site-verification=XXXXX`)
   - Ajouter un enregistrement TXT dans les DNS :
     ```
     Type    Name    Value                                   TTL
     TXT     @       google-site-verification=XXXXX...       3600
     ```
   - Attendre 5-10 minutes
   - Cliquer sur "Vérifier"

4. **Soumettre le sitemap**
   - Dans Search Console, aller dans "Sitemaps"
   - Ajouter : `https://wend-kabre.bf/sitemap.xml`
   - Cliquer sur "Envoyer"

✅ **Fait ? Passer à la priorité #9**

---

## 🎯 Priorité #9 : CONFIGURER GOOGLE ANALYTICS 4 (15 min)

### Étapes :

1. **Créer un compte GA4**
   - Aller sur https://analytics.google.com
   - Créer un compte "Wend-Kabré"
   - Créer une propriété "Site Web Wend-Kabré"

2. **Obtenir le Measurement ID**
   - Format : `G-XXXXXXXXXX`
   - Le copier

3. **Ajouter dans .env.production**
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. **Vérifier que AnalyticsTracker est actif**
   ```javascript
   // src/app/layout.js (déjà présent normalement)
   import AnalyticsTracker from '@/components/AnalyticsTracker';
   
   // Dans le <body> :
   <AnalyticsTracker />
   ```

5. **Redéployer**
   ```bash
   git add .env.production
   git commit -m "feat(analytics): add Google Analytics 4"
   git push origin main
   ```

6. **Tester**
   - Attendre le déploiement
   - Visiter le site
   - Vérifier dans GA4 (Rapports en temps réel)

✅ **Fait ? Passer à la priorité #10**

---

## 🎯 Priorité #10 : VALIDER LES SCHEMAS (10 min)

### Outils de validation :

1. **Schema.org Validator**
   - Aller sur https://validator.schema.org/
   - Entrer l'URL : `https://wend-kabre.bf`
   - Vérifier qu'il n'y a pas d'erreurs

2. **Google Rich Results Test**
   - Aller sur https://search.google.com/test/rich-results
   - Entrer l'URL
   - Vérifier les types détectés :
     - ✅ Organization
     - ✅ WebSite
     - ✅ FAQPage
     - ✅ BreadcrumbList (si ajouté)

3. **Corriger les erreurs si nécessaire**

✅ **Fait ? Priorités terminées ! 🎉**

---

## 📊 RÉCAPITULATIF

| Priorité | Tâche | Temps | Status |
|----------|-------|-------|--------|
| #1 | Acheter domaine | 30 min | ⬜ |
| #2 | Ajouter métadonnées | 2h | ⬜ |
| #3 | Ajouter schema FAQ | 30 min | ⬜ |
| #4 | Optimiser images | 1h | ⬜ |
| #5 | Activer optimisation images | 5 min | ⬜ |
| #6 | Tester le build | 15 min | ⬜ |
| #7 | Mettre à jour .env | 5 min | ⬜ |
| #8 | Search Console | 20 min | ⬜ |
| #9 | Google Analytics | 15 min | ⬜ |
| #10 | Valider schemas | 10 min | ⬜ |
| **TOTAL** | | **~5h** | |

---

## 🚀 APRÈS CES 10 PRIORITÉS

Vous aurez un site **100% prêt pour le SEO** avec :

✅ Domaine propre configuré  
✅ Métadonnées optimisées sur toutes les pages  
✅ Schemas JSON-LD complets  
✅ Images optimisées  
✅ Google Search Console actif  
✅ Google Analytics actif  
✅ Sitemap soumis  
✅ Validation technique complète  

**Résultat attendu** : Indexation complète sous 7-14 jours, premières positions sous 30-60 jours.

---

## 📞 BESOIN D'AIDE ?

### Documentation Créée

- **Guide Stratégique** : `SEO_GUIDE_COMPLET.md`
- **Checklist Technique** : `SEO_IMPLEMENTATION_CHECKLIST.md`
- **Résumé Exécutif** : `SEO_RESUME_EXECUTIF.md`
- **Template Articles** : `TEMPLATE_ARTICLE_BLOG_SEO.md`
- **Ce Document** : `ACTIONS_IMMEDIATES_SEO.md`

### Code Créé

- **Métadonnées** : `src/lib/seo-metadata.js`
- **Composant JSON-LD** : `src/components/SEO/JsonLd.jsx`
- **Composant FAQ** : `src/components/FAQ.jsx`
- **Sitemap Dynamique** : `src/app/sitemap.js`
- **Config Next.js** : `next.config.ts`

---

**Version** : 1.0  
**Créé le** : $(date)  
**Auteur** : Kiro AI pour Wend-Kabré  

Bon courage ! 🚀🇧🇫
