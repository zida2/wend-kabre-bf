# ✅ SPEC: Tasks - Implementation Plan

**Status:** 🔴 Ready to Start  
**Version:** 1.0  
**Dependencies:** requirements.md, design.md  
**Estimated Effort:** 40-50 hours

---

## 📋 Task Breakdown

### PHASE 1: Foundation (Week 1) - 16 hours

#### 1.1 Project Setup & Infrastructure
**Effort:** 3 hours | **Priority:** 🔴 CRITICAL

- [ ] Create `/vente` page structure
- [ ] Setup analytics (GA4 + events)
- [ ] Configure email service (Resend)
- [ ] Create Firebase collections (leads, campaigns)
- [ ] Setup environment variables

**Files to Create:**
- `src/app/(client)/vente/page.jsx`
- `src/app/api/leads.js`
- `src/lib/analytics.js`
- `.env.local` updates

**Acceptance Criteria:**
- ✅ Page loads without errors
- ✅ GA4 events firing
- ✅ Resend configured
- ✅ Test email sends successfully

---

#### 1.2 Hero Section Component
**Effort:** 4 hours | **Priority:** 🔴 CRITICAL

Create the most important section (first fold)

**Component:** `HeroSection.jsx`

```jsx
Props:
- headline: string (required)
- subheadline: string (required)
- backgroundImage: string (url)
- primaryCta: {text, href, onClick}
- secondaryCta: {text, href, onClick}
- animated: boolean (default: true)
```

**Features:**
- Parallax scrolling on background
- Fade-in animation on load
- Responsive text sizing
- Both CTAs working
- Mobile-optimized

**Acceptance Criteria:**
- ✅ Renders on desktop + tablet + mobile
- ✅ Text is readable (contrast ≥ 4.5:1)
- ✅ Hero image loads fast (< 2s)
- ✅ Parallax works smoothly (60fps)
- ✅ Both CTAs track correctly in GA4

**Testing:**
```
Desktop: 1440px, 1024px
Tablet: 768px
Mobile: 375px, 320px
```

---

#### 1.3 Social Proof Section
**Effort:** 3 hours | **Priority:** 🔴 CRITICAL

Build trust with real numbers

**Component:** `SocialProofSection.jsx`

```jsx
Props:
- stats: [{number, label}]
- testimonials: [{quote, author, company}]
- logos: [{name, url}]
- animated: boolean
```

**Features:**
- Stats counter animation
- Testimonial slider (auto-scroll)
- Company logos grid
- Responsive layout

**Content (Real Data!):**
```javascript
stats: [
  {number: "500+", label: "PME actives"},
  {number: "10,000+", label: "Marchés trouvés"},
  {number: "75%", label: "Taux de succès"},
  {number: "4.8★", label: "Sur 200+ avis"}
]

testimonials: [
  {
    quote: "Wend-Kabré m'a économisé 100k FCFA en 3 mois",
    author: "Amadou Traoré",
    company: "SARL FASO DIGITAL"
  },
  // ... 3 more
]
```

**Acceptance Criteria:**
- ✅ Stats animate on scroll (counter effect)
- ✅ Testimonial slider works (auto + manual)
- ✅ Logos display without distortion
- ✅ Mobile: Stack vertically
- ✅ Load time < 3s

---

#### 1.4 Problems Section
**Effort:** 2 hours | **Priority:** 🟠 HIGH

Show before/after transformation

**Component:** `ProblemsSection.jsx`

```jsx
Props:
- problems: [{before, after}]
- animated: boolean
```

**Content:**
```javascript
[
  {
    before: "10h/semaine à chercher",
    after: "5 min/jour d'alertes"
  },
  {
    before: "Google search mauvais",
    after: "Marchés triés pour vous"
  },
  {
    before: "Dates limites oubliées",
    after: "Notifications auto"
  },
  {
    before: "Dossiers faibles",
    after: "Générés par l'IA"
  }
]
```

**Features:**
- Before/After comparison
- Icons animate in
- Color coding (red/green)
- Mobile-optimized

**Acceptance Criteria:**
- ✅ Icons visible and clear
- ✅ Text is readable
- ✅ Animations smooth
- ✅ Mobile layout works

---

### PHASE 2: Features & Details (Week 1) - 14 hours

#### 2.1 Features Section
**Effort:** 5 hours | **Priority:** 🔴 CRITICAL

Show the 4 main features with visuals

**Component:** `FeaturesSection.jsx`

```jsx
Props:
- features: [{icon, title, description, image}]
```

**Features:**
1. **📋 100+ Marchés/Mois**
   - Description: "Tous les appels d'offres du Burkina en un seul endroit"
   - Image: Screenshot du dashboard avec marchés

2. **🤖 Analyse IA**
   - Description: "L'IA extrait les infos clés et les pièces exigées"
   - Image: GIF d'analyse en action

3. **📧 Alertes Intelligentes**
   - Description: "Notification en temps réel quand un marché vous match"
   - Image: Screenshot notification

4. **📊 Studio de Génération**
   - Description: "Générez vos dossiers en 15min avec l'IA"
   - Image: GIF du studio

**Interactions:**
- Hover: Feature card scales 1.05
- Stagger animation: Each feature appears 100ms apart
- Image animation: Fade in on scroll

**Acceptance Criteria:**
- ✅ All 4 features render
- ✅ Images load fast
- ✅ Text is readable
- ✅ Hover states work
- ✅ Mobile: 1 column layout
- ✅ Desktop: 4 columns or 2x2

---

#### 2.2 CTA Section
**Effort:** 2 hours | **Priority:** 🟠 HIGH

High-intent call to action

**Component:** `CTASection.jsx`

```jsx
Props:
- headline: string
- subtext: string
- ctaText: string
- ctaLink: string
```

**Content:**
```
Headline: "Pas sûr? Essayez gratuitement"
Subtext: "Accès immédiat, pas de carte bancaire"
CTA: "S'inscrire maintenant"
Trust badges:
  ✅ Pas de carte bancaire
  ⚡ Accès immédiat
  💬 Support 24/7 WhatsApp
```

**Features:**
- Large red button (accent color)
- Trust badges with icons
- Responsive layout
- Button ripple effect on hover

**Acceptance Criteria:**
- ✅ CTA button visible above fold on mobile
- ✅ Text is persuasive
- ✅ Trust badges render
- ✅ Click tracking in GA4

---

#### 2.3 Pricing Section
**Effort:** 4 hours | **Priority:** 🟠 HIGH

Show pricing options clearly

**Component:** `PricingSection.jsx`

```jsx
Props:
- plans: [{name, price, features, cta}]
```

**Plans:**
```javascript
{
  name: "Gratuit",
  price: "0 FCFA",
  features: [
    "📋 5 marchés/mois",
    "❌ Pas d'analyse IA",
    "❌ Pas d'alertes",
    "✅ Support email"
  ],
  cta: {text: "S'inscrire", link: "/inscription"}
},
{
  name: "Premium",
  price: "15,000 FCFA/mois",
  features: [
    "📋 Marchés illimités",
    "✅ Analyse IA complète",
    "✅ Alertes intelligentes",
    "✅ Studio de génération",
    "✅ Support 24/7 WhatsApp"
  ],
  cta: {text: "Essai 7 jours gratuits", link: "/inscription?plan=premium"}
},
```

**Features:**
- Side-by-side comparison (desktop)
- Premium highlighted as "Popular"
- Feature comparison clear
- Smooth toggle

**Acceptance Criteria:**
- ✅ Both plans display
- ✅ Premium is highlighted
- ✅ Features list is clear
- ✅ CTAs route correctly
- ✅ Mobile: Stack vertically
- ✅ Pricing is prominently displayed

---

#### 2.4 FAQ Section
**Effort:** 3 hours | **Priority:** 🟠 HIGH

Answer common questions (reduce support load)

**Component:** `FAQSection.jsx`

```jsx
Props:
- faqs: [{question, answer}]
```

**FAQs:**
```javascript
[
  {
    question: "Comment ça marche?",
    answer: "Vous vous inscrivez, on vous envoie les meilleures offres adaptées à votre profil."
  },
  {
    question: "Combien ça coûte?",
    answer: "Gratuit pour accès basique, 15,000 FCFA/mois pour Premium illimité + IA."
  },
  {
    question: "Je n'ai pas trouvé de marché ce mois-ci, et maintenant?",
    answer: "Nous vous remboursons 100% du mois (politique de satisfaction garantie)."
  },
  {
    question: "Comment supprimer mon compte?",
    answer: "1 clic en 30 secondes dans les paramètres. Vos données seront supprimées."
  },
  {
    question: "Quel support avez-vous?",
    answer: "Support 24/7 via WhatsApp, Email et Chat pour les utilisateurs Premium."
  }
]
```

**Features:**
- Accordion expand/collapse
- Smooth animations
- Search functionality (optional)

**Acceptance Criteria:**
- ✅ FAQs render
- ✅ Accordion works
- ✅ Mobile responsive
- ✅ Text readable

---

### PHASE 3: Forms & Conversion (Week 1-2) - 12 hours

#### 3.1 Optimize `/inscription` Page
**Effort:** 4 hours | **Priority:** 🔴 CRITICAL

Reduce friction on sign-up

**Changes:**
- Remove RCCM field (make optional)
- Remove "Informations complémentaires" accordion
- Keep only: Nom + Email + Password
- Add password strength meter
- Add terms checkbox with link

**Form Layout:**
```
[Nom de l'Entreprise] *
[Email] *
[Mot de Passe] * (min 6 chars)
[Voir la force du mot de passe]
☐ J'accepte les conditions d'utilisation *

[Créer mon compte]

Vous avez déjà un compte? Se connecter
```

**Features:**
- Real-time validation
- Clear error messages
- Password strength indicator (weak/medium/strong)
- Submit button disabled until valid
- Loading state on submit

**Acceptance Criteria:**
- ✅ Form validates correctly
- ✅ Errors are clear
- ✅ Password strength visible
- ✅ Mobile: Full width, readable
- ✅ Submit time < 2s
- ✅ Success redirects to dashboard

**Testing:**
```
✅ Valid email + password → success
❌ No email → error
❌ Password too short → error
❌ Missing terms → disabled button
```

---

#### 3.2 Success Page
**Effort:** 3 hours | **Priority:** 🟠 HIGH

Delight users after signup

**Page:** `/inscription/success`

```
✅ Inscription réussie!

Bienvenue sur Wend-Kabré 🎉

Email de confirmation envoyé à: {email}

[Accès au Dashboard]

Prochaines étapes:
1. ✅ Vérifiez votre email (5 min)
2. 📋 Explorez les 10 marchés recommandés
3. 📧 Configurez vos alertes
4. 🤖 Essayez l'analyse IA

Besoin d'aide? Chat support en bas
```

**Features:**
- Confirmation message
- Next steps guidance
- Dashboard link
- Live chat support widget
- Email verification status

**Acceptance Criteria:**
- ✅ Page displays after signup
- ✅ Next steps are clear
- ✅ Dashboard link works
- ✅ Chat widget visible
- ✅ Email verification link sent

---

#### 3.3 Email Capture Form (For Popup)
**Effort:** 2 hours | **Priority:** 🟠 HIGH

Lead magnet form

**Component:** `EmailCaptureForm.jsx`

```jsx
Props:
- headline: string
- description: string
- placeholder: string
- ctaText: string
- onSubmit: (email) => void
```

**Features:**
- Email input validation
- Loading state
- Success message
- Error handling

**Acceptance Criteria:**
- ✅ Validates email format
- ✅ Sends to Firebase
- ✅ Success confirmation
- ✅ Responds to errors

---

#### 3.4 Exit-Intent Popup
**Effort:** 3 hours | **Priority:** 🟠 HIGH

Capture users about to leave

**Component:** `ExitIntentPopup.jsx`

```jsx
Props:
- headline: string
- description: string
- inputPlaceholder: string
- ctaText: string
- onClose: () => void
- onSubmit: (email) => void
```

**Behavior:**
- Triggers when cursor leaves viewport (top)
- Only once per session
- Slide up animation
- Close button (X)
- Semi-transparent backdrop
- Form submission tracking

**Content:**
```
Headline: "7 jours Premium gratuits"
Description: "Entrez votre email pour débloquer l'accès complet + guide des 50 marchés"
Input placeholder: "Votre email professionnel"
CTA: "Débloquer l'accès"
Guarantee: "✅ Pas de spam, désinscription en 1 clic"
```

**Features:**
- Smooth animations
- Email validation
- Submit tracking in GA4
- Auto-close after 10s or submit
- Mobile-friendly (full-width on mobile)

**Acceptance Criteria:**
- ✅ Triggers on exit intent
- ✅ Only once per session (localStorage)
- ✅ Form works
- ✅ Sends to Firebase
- ✅ GA4 event tracked
- ✅ Mobile responsive

---

### PHASE 4: Email & Automation (Week 2) - 8 hours

#### 4.1 Email Templates
**Effort:** 4 hours | **Priority:** 🟠 HIGH

Create 5 email sequences

**Using:** Resend + React Email

**Emails:**

1. **Welcome Email (Day 0)**
```
Subject: "Bienvenue sur Wend-Kabré 🎉"
CTA: "Voir mes premiers marchés"
Content:
- Welcome message
- What to do next
- Dashboard link
- Support contact
```

2. **First Markets Email (Day 1)**
```
Subject: "📋 Vos 10 premiers marchés attendent"
CTA: "Consulter les marchés"
Content:
- 3-5 market cards
- Budget, deadline
- "Analyzed by AI" badge
- Dashboard link
```

3. **AI Tutorial Email (Day 2)**
```
Subject: "🤖 Générez votre dossier en 15 min (démo)"
CTA: "Découvrir le Studio"
Content:
- How Studio works
- Before/after
- Video embed
- Studio link
```

4. **Premium Offer Email (Day 3)**
```
Subject: "✨ Débloquez l'accès illimité (7 jours gratuits)"
CTA: "Essai gratuit"
Content:
- Benefits vs Free
- 7 days free mention
- Upgrade link
- Money-back guarantee
```

5. **Check-in Email (Day 7)**
```
Subject: "Comment se passe votre première semaine?"
CTA: "Consulter le Dashboard"
Content:
- Progress summary
- Markets viewed
- Next tips
- Support offer
```

**Features:**
- Responsive design
- Clear hierarchy
- Unsubscribe link
- Mobile preview

**Acceptance Criteria:**
- ✅ All 5 templates created
- ✅ Sendable via Resend
- ✅ Mobile preview works
- ✅ Unsubscribe links functional
- ✅ Content accurate

---

#### 4.2 Email Automation Setup
**Effort:** 2 hours | **Priority:** 🟠 HIGH

Configure Firestore triggers

**Triggers:**
```javascript
User created (signup_complete event)
  → Day 0, 0:00: Send Welcome Email
  → Day 1, 9:00: Send First Markets Email
  → Day 2, 9:00: Send AI Tutorial Email
  → Day 3, 9:00: Send Premium Offer Email
  → Day 7, 9:00: Send Check-in Email

Lead captured (email only)
  → Day 0, 1:00: Send Welcome Email (lead version)
  → Day 3, 9:00: Send Premium Offer Email
  → Day 5, 9:00: Send Last Chance Email
```

**Backend Logic:**
```javascript
// Cloud Function: sendScheduledEmails
// Runs daily at 8:55 AM (timezone: Africa/Ouagadougou)
// Finds users with pending emails
// Sends via Resend
// Updates Firestore (email_sent_at)
```

**Acceptance Criteria:**
- ✅ Cloud Function deployed
- ✅ Emails send on schedule
- ✅ Firebase logs show sends
- ✅ Users receive emails
- ✅ Unsubscribe works

---

#### 4.3 WhatsApp Notifications (Optional MVP+)
**Effort:** 2 hours | **Priority:** 🟡 MEDIUM

Send SMS alerts via Twilio

**Messages:**
```
Day 1: "Bienvenue sur Wend-Kabré! 🎉 
Nous avons 10 marchés pour vous.
[Link to dashboard]"

Day 7: "📊 Résumé de votre semaine:
- 10 marchés consultés
- 2 favoris sauvegardés
- Passez Premium pour débloquer l'IA
[Link to upgrade]"
```

**Features:**
- Opt-in on signup form
- Unsubscribe via SMS reply
- Track opens/clicks

**Acceptance Criteria:**
- ✅ Messages send on schedule
- ✅ Opt-in tracked
- ✅ Unsubscribe works

---

### PHASE 5: Analytics & Testing (Week 2) - 10 hours

#### 5.1 Analytics Setup
**Effort:** 3 hours | **Priority:** 🔴 CRITICAL

Track the entire conversion funnel

**GA4 Events to Track:**

```javascript
// Vente page views
"page_view" {page_location: "/vente"}

// Hero CTAs
"click_hero_cta" {cta_type: "primary" | "secondary"}

// Section scrolls
"scroll_to_section" {section: "features" | "pricing" | "faq"}

// Popup interactions
"exit_intent_popup_shown" {}
"exit_intent_popup_email_captured" {email_domain}
"exit_intent_popup_closed" {}

// Signup
"signup_start" {}
"signup_complete" {source: "landing" | "popup" | "direct"}
"signup_error" {error: string}

// Email engagement
"email_sent" {email_type: "welcome" | "markets" | ...}
"email_opened" {email_type}
"email_clicked" {email_type, link_name}

// Premium conversion
"upgrade_initiated" {}
"upgrade_completed" {price}
```

**Dashboards to Create:**
1. **Funnel Overview**
   - Visitors → Landing page views → Signups → Premium
   
2. **Landing Page Performance**
   - Bounce rate, scroll depth, CTA clicks
   
3. **Email Performance**
   - Open rates, click rates, unsubscribe rate
   
4. **Conversion Cohorts**
   - By day, source, email_type

**Acceptance Criteria:**
- ✅ GA4 tags implemented
- ✅ Events firing correctly
- ✅ Dashboards created
- ✅ Real-time view working

---

#### 5.2 Heatmaps & Session Recordings
**Effort:** 2 hours | **Priority:** 🟠 HIGH

Understand user behavior

**Tool:** Hotjar or Microsoft Clarity

**Setup:**
- Heatmap on /vente
- Scroll map
- Session recordings
- Form analytics on /inscription

**Acceptance Criteria:**
- ✅ Heatmaps visible
- ✅ Recordings captured
- ✅ No performance impact

---

#### 5.3 A/B Testing Setup
**Effort:** 3 hours | **Priority:** 🟠 HIGH

Test and optimize conversions

**Tests to Run (Week 2+):**

1. **Headline Test**
   - A: "Les PME qui trouvent les meilleurs marchés publics"
   - B: "Gagnez 10h/semaine + 100k FCFA en trouvant plus de marchés"
   - Metric: Click-through rate to /inscription

2. **CTA Color Test**
   - A: Red (current)
   - B: Orange
   - Metric: Signup rate

3. **Form Fields Test**
   - A: 3 fields (current)
   - B: 2 fields (no password)
   - Metric: Signup completion rate

4. **Popup Copy Test**
   - A: "7 jours Premium gratuits"
   - B: "Débloquez l'accès illimité"
   - Metric: Email capture rate

**Setup:**
- Use Optimizely or custom randomization
- Track variants in GA4
- Run 1 week min
- 95% confidence required

**Acceptance Criteria:**
- ✅ A/B tests deployable
- ✅ Variants tracked
- ✅ Results measurable

---

#### 5.4 QA & Testing Checklist
**Effort:** 2 hours | **Priority:** 🔴 CRITICAL

Comprehensive testing before launch

**Functionality Testing:**
- [ ] All CTAs link correctly
- [ ] Forms submit successfully
- [ ] Emails send (test account)
- [ ] Popup triggers on exit
- [ ] Mobile responsive (320px, 375px, 768px, 1440px)
- [ ] Loading states work
- [ ] Error messages display
- [ ] Success messages display

**Performance Testing:**
- [ ] Page loads < 2.5s (LCP)
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth animations (60fps)
- [ ] Images optimized
- [ ] Bundle size < 150KB

**Security Testing:**
- [ ] Form validation (XSS protection)
- [ ] HTTPS enforced
- [ ] Environment variables secure
- [ ] No console errors/warnings

**Accessibility Testing:**
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast ≥ 4.5:1
- [ ] Alt text on images
- [ ] Form labels present

**Cross-browser Testing:**
- [ ] Chrome, Firefox, Safari, Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile

**Acceptance Criteria:**
- ✅ No critical bugs
- ✅ All tests pass
- ✅ Performance meets targets
- ✅ Ready to launch

---

## 🚀 Deployment Checklist

Before going live to production:

- [ ] All tasks completed and tested
- [ ] Code reviewed by 2 people
- [ ] Hotjar/analytics configured
- [ ] Email service tested
- [ ] Firebase rules updated
- [ ] Error tracking setup (Sentry)
- [ ] Monitoring alerts configured
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Team trained
- [ ] Support aware of changes

---

## 📊 Success Metrics (Week 1-2 Goals)

| Metric | Target | Actual |
|--------|--------|--------|
| Landing page visits | 500+ | — |
| Signup rate | 3-5% | — |
| Email capture rate (popup) | 20%+ | — |
| Email open rate | 25%+ | — |
| Premium trial conversions | 2-3% | — |
| Form completion time | < 1 min | — |
| Page load time | < 2.5s | — |

---

## 📝 Notes

- Use real testimonials (interview 5 customers)
- Use real company data (500+ PME = need verification)
- Test on real devices, not just browser
- Monitor support tickets for issues
- Daily sync during implementation
- Document decisions made

---

**READY TO START!** 🚀

Next: Code implementation begins Monday 9 AM
