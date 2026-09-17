# 🎨 SPEC: Design - Landing Page & Conversion Funnel

**Status:** 🟡 In Design  
**Version:** 1.0  
**Dependencies:** requirements.md

---

## 🎯 Page Structure

### `/vente` - Landing Page de Vente

```
┌─────────────────────────────────────────┐
│          NAVBAR (fixed, top)            │
│  Logo | Links | [S'inscrire] [Premium] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   1. HERO SECTION (100vh)               │
│                                         │
│  🎯 Headline: "Les PME qui trouvent    │
│     les meilleurs marchés publics"      │
│                                         │
│  Subheadline: "Sans passer 10h/semaine│
│     à les chercher"                     │
│                                         │
│  [CTA ROUGE] S'inscrire - 2 min         │
│  [CTA GHOST] Voir les 50 marchés        │
│                                         │
│  Background: Hero image (charts growth) │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   2. SOCIAL PROOF (60vh)                │
│                                         │
│  🏆 "500+ PME nous font confiance"      │
│  📈 "10,000+ marchés trouvés cette année│
│  ⭐ "75% trouvent un marché en 2 mois"  │
│  ✅ "4.8/5 ⭐ sur 200+ avis"            │
│                                         │
│  [Testimonial Slider]                   │
│  "Wend-Kabré m'a économisé 100k FCFA"  │
│  - Amadou, SARL FASO DIGITAL            │
│                                         │
│  [Logos of 6 companies using service]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   3. PROBLEMS SECTION (80vh)            │
│   "Avant vs Après"                      │
│                                         │
│  🔴 AVANT              ✅ APRÈS         │
│  ❌ 10h/semaine       ✅ 5min/jour      │
│  ❌ Google mal        ✅ Marchés triés  │
│  ❌ Dates oubliées    ✅ Alertes auto   │
│  ❌ Dossiers faibles  ✅ IA génère      │
│  ❌ Peu de succès     ✅ Taux 75%       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   4. FEATURES SECTION (100vh)           │
│                                         │
│  🎯 4 colonnes de features              │
│                                         │
│  [📋] 100+ marchés/mois                 │
│       "Tous les appels d'offres         │
│        du Burkina en un seul endroit"   │
│                                         │
│  [🤖] Analyse IA                        │
│       "L'IA extrait les infos clés      │
│        et les pièces à fournir"         │
│                                         │
│  [📧] Alertes intelligentes             │
│       "Notif en temps réel quand        │
│        un marché match votre profil"    │
│                                         │
│  [📊] Studio de génération              │
│       "Générez vos dossiers en 15min    │
│        avec l'IA et vos données"        │
│                                         │
│  [Chaque feature a une mini-démo]       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   5. CTA SECTION (60vh)                 │
│                                         │
│  💡 "Pas sûr? Essayez gratuitement"     │
│                                         │
│  [CTA ROUGE GROS] S'inscrire gratuit    │
│                                         │
│  ✅ Pas de carte bancaire               │
│  ⚡ Accès immédiat                      │
│  💬 Support 24/7 WhatsApp               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   6. PRICING SECTION (80vh)             │
│                                         │
│  💰 GRATUIT          💎 PREMIUM         │
│                                         │
│  📋 5 marchés/mois   📋 Illimité        │
│  ❌ Pas d'IA         ✅ IA complète     │
│  ❌ Pas d'alertes    ✅ Alertes         │
│  ✅ Support email    ✅ Support 24/7    │
│                                         │
│  [0 FCFA/mois]       [15,000 FCFA/mois]│
│  [S'inscrire]        [Essai gratuit]    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   7. FAQ SECTION (70vh)                 │
│                                         │
│  ❓ Comment ça marche?                  │
│     "Vous vous inscrivez, on vous       │
│      envoie les meilleures offres"      │
│                                         │
│  ❓ Combien ça coûte?                   │
│     "Gratuit pour les bases, Premium    │
│      pour l'IA à partir de 15k FCFA"    │
│                                         │
│  ❓ Comment supprimer mon compte?       │
│     "1 clic, pas de problème"           │
│                                         │
│  ❓ Vous n'avez pas de marché?          │
│     "On vous rembourse 100%"            │
│                                         │
│  [Accord/Désaccord animations]          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   8. FOOTER                             │
│  Produit | Entreprise | Légal | Réseaux│
└─────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (1440px+)
- 2-3 colonnes pour features
- Hero image full-width
- Testimonial slider 3 items
- Pricing side by side

### Tablet (768px - 1023px)
- 2 colonnes features
- Hero image 50% width
- Testimonial slider 2 items
- Pricing stacked

### Mobile (320px - 767px)
- 1 colonne features
- Hero image 100% width
- Testimonial slider 1 item (vertical scroll)
- Pricing stacked full width
- Smaller fonts (responsive)

---

## 🎨 Color Scheme

```css
/* Primary (Green - Wend-Kabré) */
--primary: #059669
--primary-light: #10B981
--primary-lighter: #34D399
--primary-dark: #047857

/* Accent (Gold - Call to Action) */
--accent: #D97706
--accent-light: #F59E0B
--accent-lighter: #FCD34D

/* Success (Green for check marks) */
--success: #16A34A
--danger: #DC2626

/* Backgrounds */
--bg: #F9FAFB
--bg-secondary: #F3F4F6
--surface: #FFFFFF
--surface-hover: #F0F1F3

/* Text */
--text-primary: #1F2937
--text-secondary: #6B7280
--text-muted: #9CA3AF
```

---

## 🔤 Typography

### Headings
- **H1**: 48px, Bold, Primary color
- **H2**: 36px, Bold, Primary color
- **H3**: 24px, SemiBold, Primary color
- **H4**: 18px, SemiBold, Primary color

### Body
- **Large**: 16px, Regular
- **Base**: 14px, Regular
- **Small**: 12px, Regular
- **Muted**: 12px, Regular, Gray

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

---

## 🎬 Animations & Interactions

### Hero Section
- Fade-in on load
- Parallax effect on scroll
- Hero image slides in from right

### Features
- Stagger animation (items appear 100ms apart)
- Scale on hover
- Icon bounce on load

### CTA Buttons
- Red button: `background: --accent`
- Hover: Slight glow + scale up 1.05
- Click: Scale down 0.95
- Loading: Spinner animation

### Testimonials Slider
- Auto-scroll every 5 seconds
- Smooth transition
- Dot indicators clickable

### Popup Exit-Intent
- Slide up from bottom (0.3s)
- Semi-transparent backdrop
- Close button (X) top right

---

## 📱 Mobile Optimizations

1. **Touch targets**: Min 44px (iOS standard)
2. **Font sizes**: Min 16px to avoid zoom on iOS
3. **Forms**: Use native inputs (tel, email)
4. **Images**: Lazy load + responsive srcset
5. **Video**: Use video poster + play icon
6. **Navigation**: Hamburger menu on mobile

---

## ♿ Accessibility

1. **Contrast**: WCAG AA (4.5:1 minimum)
2. **Alt text**: All images have descriptive alt
3. **Form labels**: Associated with inputs
4. **Focus states**: Visible outline on tab
5. **Semantic HTML**: Use `<header>`, `<nav>`, `<section>`, etc.
6. **ARIA labels**: For interactive elements
7. **Skip link**: "Skip to main content"

---

## 🔄 Components Spec

### Hero Component
```jsx
<HeroSection 
  headline="..."
  subheadline="..."
  backgroundImage="..."
  primaryCta={{text: "...", href: "..."}}
  secondaryCta={{text: "...", href: "..."}}
/>
```

### Social Proof Component
```jsx
<SocialProofSection 
  stats={[
    {number: "500+", label: "PME"},
    {number: "10k+", label: "Marchés"},
    {number: "75%", label: "Succès"}
  ]}
  testimonials={[...]}
  logos={[...]}
/>
```

### Features Component
```jsx
<FeaturesSection 
  features={[
    {
      icon: "...",
      title: "...",
      description: "...",
      image: "..."
    }
  ]}
/>
```

### Pricing Component
```jsx
<PricingSection 
  plans={[
    {
      name: "Gratuit",
      price: 0,
      features: [...],
      cta: "S'inscrire"
    },
    {
      name: "Premium",
      price: 15000,
      features: [...],
      cta: "Essai gratuit"
    }
  ]}
/>
```

### Popup Component
```jsx
<ExitIntentPopup 
  headline="7 jours Premium gratuits"
  description="..."
  inputPlaceholder="Votre email"
  ctaText="Débloquer l'accès"
  onClose={() => {}}
/>
```

---

## 📊 Performance Targets

- **Lighthouse Score**: 90+ (desktop)
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **Total Bundle Size**: < 150KB (gzipped)
- **Images Size**: < 100KB total (optimized)

---

## 🎯 Conversion Points

1. **Top Hero CTA**: Red button "S'inscrire"
   - Goal: 3-5% conversion from homepage
   
2. **Secondary Hero CTA**: "Voir les 50 marchés"
   - Goal: Interest indicator (not conversion yet)
   
3. **Exit-intent Popup**: Lead capture
   - Goal: 20%+ of visitors who would leave
   
4. **Bottom CTA Section**: Red button "S'inscrire"
   - Goal: 1-2% conversion from scrollers
   
5. **Pricing CTA**: "Essai gratuit" for Premium
   - Goal: 5-10% of visitors

---

## ✅ Checklist

Design Phase:
- [ ] Figma wireframes créées
- [ ] Color palette validée
- [ ] Responsive layouts testées
- [ ] Animations spécifiées
- [ ] Component specs écrites
- [ ] Accessibility reviewed

---

**Next:** Créer le TASKS Spec (implementation)
