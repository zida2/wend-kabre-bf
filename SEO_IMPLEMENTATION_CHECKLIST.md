# ✅ Checklist d'Implémentation SEO - Wend-Kabré

## 📦 Fichiers Créés

### ✅ Fait

1. **`SEO_GUIDE_COMPLET.md`** — Guide stratégique SEO complet
2. **`src/lib/seo-metadata.js`** — Métadonnées centralisées pour toutes les pages
3. **`src/components/SEO/JsonLd.jsx`** — Composant pour données structurées
4. **`src/app/sitemap.js`** — Sitemap dynamique amélioré (inclut les marchés)

---

## 🎯 Actions à Faire Maintenant (Avant le Domaine)

### 1. Ajouter les Métadonnées aux Pages Client

Chaque page importante doit exporter ses métadonnées. Comme les pages sont en `'use client'`, il faut créer des **wrappers** ou utiliser un **layout parent**.

#### Option A : Layout Parent (RECOMMANDÉE)

Créer un layout pour chaque section avec métadonnées :

```javascript
// src/app/(client)/marches/layout.js
import { marchesPageMetadata } from '@/lib/seo-metadata';

export const metadata = marchesPageMetadata;

export default function MarchesLayout({ children }) {
  return <>{children}</>;
}
```

#### Option B : Composant Head Dynamique

Pour les pages de détails dynamiques :

```javascript
// src/app/(client)/marches/details/page.js (si converti en server component)
import { createMarcheDetailMetadata } from '@/lib/seo-metadata';

export async function generateMetadata({ searchParams }) {
  // Récupérer le marché depuis Firebase
  const marche = await getMarche(searchParams.id);
  return createMarcheDetailMetadata(marche);
}
```

### 2. Ajouter les Schemas JSON-LD

#### Page d'Accueil (déjà fait partiellement)
✅ Organization Schema  
✅ WebSite Schema  
⚠️ **À AJOUTER** : FAQ Schema

```javascript
// Dans src/app/layout.js, ajouter :
import { faqJsonLd } from '@/lib/seo-metadata';

// Dans le <head> ou <body> :
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
/>
```

#### Page Marchés
⚠️ **À AJOUTER** : ItemList Schema

```javascript
// Dans src/app/(client)/marches/page.js
// Après le chargement des marchés :
import { generateMarchesJsonLd } from '@/lib/seo-metadata';

const marchesJsonLd = generateMarchesJsonLd(marches);

// Dans le JSX :
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(marchesJsonLd) }}
/>
```

#### Page Recrutements
⚠️ **À AJOUTER** : JobPosting Schema (pour chaque offre)

#### Page Assistant
⚠️ **À AJOUTER** : SoftwareApplication Schema

```javascript
import { assistantSoftwareJsonLd } from '@/lib/seo-metadata';
```

### 3. Optimiser les Images

#### Images existantes
- ✅ Vérifier que `/public/wend_kabre_banner.png` existe (1200x630px)
- ⚠️ Ajouter un `favicon.ico` optimisé
- ⚠️ Ajouter des images de différentes tailles pour le manifest

#### Toutes les images dans les composants
```javascript
// Utiliser le composant Next.js Image
import Image from 'next/image';

<Image
  src="/wend_kabre_banner.png"
  alt="Wend-Kabré — Marchés Publics du Burkina Faso"
  width={1200}
  height={630}
  priority // Pour les images au-dessus de la ligne de flottaison
/>
```

### 4. Optimiser les Liens Internes

#### Créer un maillage interne solide

**Pages à lier entre elles :**
- Accueil → Marchés, Recrutements, Tarifs, Assistant
- Marchés → Guide Soumission, Assistant, Tarifs
- Assistant → Marchés, Guide Soumission
- Tarifs → Toutes les pages

**Exemple :**
```javascript
// Dans chaque page, footer ou sidebar :
<nav aria-label="Navigation principale">
  <Link href="/marches">Marchés Publics</Link>
  <Link href="/recrutements">Recrutements</Link>
  <Link href="/assistant">Assistant IA</Link>
  <Link href="/tarifs">Tarifs</Link>
</nav>
```

### 5. Améliorer la Structure HTML

#### Vérifier la hiérarchie des titres

```javascript
// ✅ BON
<h1>Titre principal de la page (UN SEUL)</h1>
<h2>Section importante</h2>
  <h3>Sous-section</h3>
<h2>Autre section</h2>

// ❌ MAUVAIS
<h1>Titre 1</h1>
<h3>Saut de niveau</h3>
<h1>Plusieurs H1</h1>
```

#### Ajouter des landmarks ARIA

```javascript
<main role="main">
  <article>
    <header>
      <h1>Titre de l'article</h1>
    </header>
    <section>
      <h2>Contenu</h2>
    </section>
  </article>
</main>

<aside role="complementary">
  Contenu secondaire
</aside>

<nav role="navigation" aria-label="Navigation principale">
  Liens de navigation
</nav>
```

### 6. Ajouter un Fichier next.config.js Optimisé

```javascript
// next.config.js (si pas déjà existant)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  compress: true, // Compression Gzip/Brotli
  poweredByHeader: false, // Masquer "X-Powered-By: Next.js"
  
  // Redirections (à configurer après le domaine)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'wend-kabre-bf.vercel.app',
          },
        ],
        destination: 'https://wend-kabre.bf/:path*',
        permanent: true,
      },
    ];
  },
  
  // Headers de sécurité et performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🚀 Actions Après Achat du Domaine

### 1. Configuration DNS chez le Registrar

```
Type    Name    Value                           TTL
A       @       76.76.21.21                     3600
CNAME   www     cname.vercel-dns.com            3600
TXT     @       verification-code-google        3600
```

### 2. Configuration Vercel

1. Aller dans **Settings → Domains**
2. Ajouter `wend-kabre.bf` et `www.wend-kabre.bf`
3. Suivre les instructions de vérification
4. Le SSL sera automatique

### 3. Mise à Jour de la Variable d'Environnement

```bash
# .env.production
NEXT_PUBLIC_SITE_URL=https://wend-kabre.bf
```

Puis redéployer :
```bash
git add .env.production
git commit -m "chore: update site URL to production domain"
git push origin main
```

### 4. Google Search Console

1. Aller sur https://search.google.com/search-console
2. **Ajouter une propriété** → `https://wend-kabre.bf`
3. **Vérification par DNS** (TXT record) :
   ```
   Type    Name    Value                           TTL
   TXT     @       google-site-verification=...    3600
   ```
4. Une fois vérifié, **soumettre le sitemap** :
   ```
   https://wend-kabre.bf/sitemap.xml
   ```

### 5. Google Analytics 4

1. Créer un compte GA4 : https://analytics.google.com
2. Créer une propriété "Wend-Kabré"
3. Récupérer le `MEASUREMENT_ID` (format : `G-XXXXXXXXXX`)
4. Ajouter dans `.env.production` :
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
5. Le composant `<AnalyticsTracker />` est déjà intégré ✅

### 6. Bing Webmaster Tools

1. Aller sur https://www.bing.com/webmasters
2. Ajouter `https://wend-kabre.bf`
3. Importer depuis Google Search Console (plus rapide)
4. Soumettre le sitemap

### 7. Test Final

#### Outils à Utiliser :

1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Tester : `https://wend-kabre.bf`
   - Objectif : Score > 90 sur Mobile et Desktop

2. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Vérifier que les schemas JSON-LD sont détectés

3. **Schema Markup Validator**
   - https://validator.schema.org/
   - Coller le code source de chaque page

4. **Google Mobile-Friendly Test**
   - https://search.google.com/test/mobile-friendly
   - Objectif : 100% mobile-friendly

5. **GTmetrix**
   - https://gtmetrix.com/
   - Analyser la performance et les optimisations possibles

---

## 📊 Suivi des Performances SEO

### Semaine 1 Après Lancement

- [ ] Vérifier l'indexation dans Search Console (Coverage)
- [ ] Vérifier les Core Web Vitals
- [ ] Corriger les erreurs 404 s'il y en a
- [ ] Vérifier que le sitemap est bien lu

### Mois 1

- [ ] Suivre les impressions dans Search Console
- [ ] Identifier les premières requêtes qui amènent du trafic
- [ ] Optimiser les pages avec le plus d'impressions mais faible CTR
- [ ] Publier 2-3 articles de blog

### Mois 2-3

- [ ] Analyser les mots-clés qui performent
- [ ] Créer du contenu ciblé sur ces mots-clés
- [ ] Commencer la stratégie de backlinks
- [ ] Améliorer les pages avec taux de rebond élevé

### Mois 4-6

- [ ] Viser le Top 10 sur les mots-clés principaux
- [ ] Augmenter la fréquence de publication (1-2 articles/semaine)
- [ ] Obtenir 50+ backlinks de qualité
- [ ] Optimiser les conversions

---

## 🎨 Améliorations du Contenu

### Page d'Accueil

#### Section "Comment ça marche" (à ajouter)

```html
<section>
  <h2>Comment Wend-Kabré Vous Aide à Gagner des Marchés</h2>
  
  <div class="steps">
    <div class="step">
      <h3>1. Recevez les alertes</h3>
      <p>Marchés publics et recrutements en temps réel par WhatsApp et SMS</p>
    </div>
    
    <div class="step">
      <h3>2. Analysez avec l'IA</h3>
      <p>Notre assistant vérifie la conformité de votre dossier</p>
    </div>
    
    <div class="step">
      <h3>3. Soumissionnez en confiance</h3>
      <p>Documents complets, délais respectés, chances maximisées</p>
    </div>
  </div>
</section>
```

#### Section Témoignages (à ajouter)

```html
<section>
  <h2>Ils Nous Font Confiance</h2>
  
  <div class="testimonials">
    <blockquote>
      <p>"Grâce à Wend-Kabré, nous avons remporté 3 marchés en 2 mois."</p>
      <cite>— PME BTP, Ouagadougou</cite>
    </blockquote>
  </div>
</section>
```

### Page Guide de Soumission

Créer un guide complet avec :
- Étapes détaillées
- Checklist téléchargeable
- Vidéos explicatives
- FAQ

**Objectif SEO** : Viser le Featured Snippet Google sur "comment soumissionner marché public burkina faso"

### Blog / Articles

#### Structure recommandée :

```
/blog
  /comment-repondre-appel-offres-burkina-faso
  /arcop-vs-dgcmef-differences
  /10-erreurs-fatales-appels-offres
  /calendrier-marches-publics-2026
  /guide-complet-pme-marches-publics
```

Chaque article :
- 1500-3000 mots
- Structure H2/H3 claire
- Images optimisées avec alt text
- Liens internes vers d'autres pages
- CTA vers inscription/premium

---

## 🔍 Mots-Clés à Cibler (Priorités)

### Haute Priorité (Volume élevé)

1. **"marchés publics burkina faso"** → Page Marchés
2. **"appels d'offres burkina faso"** → Page Marchés
3. **"ARCOP burkina faso"** → Page Marchés + Article dédié
4. **"DGCMEF"** → Article comparatif
5. **"recrutement burkina faso"** → Page Recrutements

### Moyenne Priorité (Longue traîne)

6. "comment soumissionner marché public burkina"
7. "alertes marchés publics ouagadougou"
8. "dossier soumission ARCOP"
9. "pièces administratives appel d'offres burkina"
10. "DAO burkina faso télécharger"

### Basse Priorité (Niche)

11. "marché public informatique burkina"
12. "BTP marché public ouagadougou"
13. "fournitures scolaires appel d'offres"
14. "consultant marché public burkina"
15. "PME préférence nationale burkina"

---

## ⚡ Optimisations Techniques Avancées

### 1. Préchargement des Ressources Critiques

```html
<!-- Dans <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://firebasestorage.googleapis.com">
<link rel="preload" as="image" href="/wend_kabre_banner.png">
```

### 2. Lazy Loading pour les Images

```javascript
<Image
  src="/image.jpg"
  alt="Description"
  loading="lazy" // Pour les images en dessous de la ligne de flottaison
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 3. Code Splitting

```javascript
// Composants lourds chargés à la demande
import dynamic from 'next/dynamic';

const AssistantIA = dynamic(() => import('@/components/AssistantIA'), {
  loading: () => <p>Chargement...</p>,
  ssr: false, // Désactiver le rendu serveur si nécessaire
});
```

### 4. Optimisation des Fonts

```css
/* globals.css */
@font-face {
  font-family: 'Votre Font';
  src: url('/fonts/font.woff2') format('woff2');
  font-display: swap; /* Afficher le texte immédiatement */
  font-weight: 400;
}
```

---

## 📱 Optimisation Mobile

### Core Web Vitals Spécifiques Mobile

1. **LCP (Largest Contentful Paint)** < 2.5s
   - Optimiser l'image hero
   - Utiliser next/image
   - Précharger les ressources critiques

2. **FID (First Input Delay)** < 100ms
   - Réduire le JavaScript
   - Différer les scripts non critiques

3. **CLS (Cumulative Layout Shift)** < 0.1
   - Définir width/height sur toutes les images
   - Réserver l'espace pour les ads/bannières
   - Éviter les insertions dynamiques au chargement

### Test Mobile

```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://wend-kabre.bf --view --preset=mobile
```

---

## ✅ Checklist Finale Avant Go-Live

### Contenu
- [ ] Toutes les pages ont des métadonnées uniques
- [ ] Tous les H1 sont uniques et descriptifs
- [ ] Toutes les images ont des alt text
- [ ] Liens internes en place
- [ ] Pas de contenu dupliqué

### Technique
- [ ] Sitemap généré et accessible
- [ ] Robots.txt configuré
- [ ] SSL/HTTPS actif
- [ ] Redirections 301 en place
- [ ] Pas d'erreurs 404
- [ ] Core Web Vitals > 75/100

### SEO
- [ ] Search Console configuré
- [ ] Analytics configuré
- [ ] Schemas JSON-LD en place
- [ ] Open Graph complet
- [ ] Twitter Cards configurées

### Performance
- [ ] PageSpeed Score > 90
- [ ] Images optimisées (WebP/AVIF)
- [ ] Code minifié
- [ ] Cache configuré

---

## 📚 Ressources Supplémentaires

### Documentation
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org Full Hierarchy](https://schema.org/docs/full.html)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

### Outils de Monitoring
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics 4](https://analytics.google.com)
- [Google PageSpeed Insights](https://pagespeed.web.dev)
- [Ahrefs](https://ahrefs.com) (payant)
- [SEMrush](https://www.semrush.com) (payant)

---

**Créé le** : $(date)  
**Auteur** : Kiro AI pour Wend-Kabré  
**Version** : 1.0
