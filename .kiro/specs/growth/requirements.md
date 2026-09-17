# 📋 SPEC: Relancer les Inscriptions & Croissance

**Status:** 🟢 In Progress  
**Version:** 1.0  
**Date:** 2026-09-17  
**Auteur:** Growth Team  
**Priorité:** 🔴 CRITIQUE

---

## 🎯 Objectif Global

**Transformer Wend-Kabré en machine de croissance:**
- **Visiteur → Inscription**: 0% → 5%+
- **Inscription → Utilisateur Actif**: 30% → 80%+
- **Utilisateur → Premium**: 0% → 5-10%
- **Résultat:** 50+ nouveaux utilisateurs/semaine en 4 semaines

---

## 📊 Situation Actuelle

### Problèmes Identifiés
1. **Aucune landing page de vente** - Visiteurs vont directement à `/inscription`
2. **Page inscription trop longue** - Trop de champs, trop de friction
3. **Pas de lead magnet** - Les visiteurs qui n'inscrivent pas disparaissent
4. **Zéro email automation** - Les inscrits ne reçoivent rien
5. **Pas de tracking conversion** - On ne sait pas où c'est bloqué
6. **Social proof insuffisant** - Pas de témoignages, pas de chiffres vrais
7. **Mobile UX catastrophique** - Le formulaire ne fonctionne pas bien sur mobile

### Conversion Funnel Actuel
```
100 visiteurs
    ↓
? consultent /inscription (10%?)
    ↓
0 s'inscrivent (0%)
    ↓
0 deviennent actifs (0%)
    ↓
0 deviennent premium (0%)
```

---

## 🎯 Objectifs Spécifiques

### Court terme (Semaine 1-2)
- ✅ Landing page `/vente` attractive et convertissante
- ✅ Formulaire d'inscription allégé (max 3 champs)
- ✅ Exit-intent popup avec lead magnet
- ✅ Analytics setup pour tracker conversions
- **Cible:** 5-10 inscriptions/jour

### Moyen terme (Semaine 3-4)
- ✅ Email automation (5 emails)
- ✅ WhatsApp notifications
- ✅ Success page post-inscription engageante
- **Cible:** 20-30 inscriptions/jour

### Long terme (Semaine 5+)
- ✅ Referral program
- ✅ Content marketing (blog, guides)
- ✅ Paid ads optimization
- **Cible:** 50+ inscriptions/jour

---

## 🎨 Design Principles

1. **Simplicité**: Pas de distractions, un CTA par section
2. **Urgence**: "50 marchés du mois", "Actif maintenant"
3. **Social Proof**: "500+ PME nous font confiance", testimonials vrais
4. **FOMO**: "Voir les marchés avant vos concurrents"
5. **Mobile First**: Responsive sur tous les appareils
6. **Accessibilité**: WCAG AA compliant
7. **Performance**: < 2s load time

---

## 🏗️ Architecture

### Pages à Créer/Modifier

```
/vente                    → Landing page de vente (NEW)
/inscription              → Formulaire allégé (MODIFY)
/inscription/success      → Success page (NEW)
/tarifs                   → Pricing page optimisée (MODIFY)
/api/leads                → Capture leads (NEW)
/api/send-welcome-email   → Email automation (NEW)
```

### Components à Créer

```
<SalesHeroSection />           → Hero viral
<SocialProofSection />         → Testimonials + chiffres
<ProblemsSection />            → Pain points
<FeaturesSection />            → Features principales
<PricingComparison />          → Pricing transparent
<FAQSection />                 → Questions fréquentes
<ExitIntentPopup />            → Lead magnet popup
<EmailCapture />               → Email/WhatsApp form
<SuccessPage />                → Après inscription
```

### Database Changes

```firestore
collections/
  users/
    {uid}/
      signup_source        (string: "landing", "popup", "direct")
      signup_date          (timestamp)
      email_verified       (boolean)
      onboarding_step      (number: 0-5)
      last_login           (timestamp)
      lifecycle_stage      (string: "lead", "active", "premium")

  leads/                    # Pour les emails non convertis
    {id}/
      email                (string)
      source               (string)
      captured_at          (timestamp)
      segment              (string: "high", "medium", "low")
      last_email_sent      (timestamp)
      email_opens          (number)
      email_clicks         (number)

  email_campaigns/          # Automation
    {id}/
      name                 (string)
      template             (string)
      recipients           (number)
      sent_count           (number)
      open_rate            (number)
      click_rate           (number)
```

---

## 📱 User Flows

### Flow 1: Visiteur → Inscription (Landing Page)
```
Visiteur arrive sur /vente
  ↓
Lit Hero Section (5 sec)
  ↓
Scrolls Features (10 sec)
  ↓
Voit Social Proof (3 sec)
  ↓
Clique "S'inscrire" CTA rouge
  ↓
Form simple: Email + Password (30 sec)
  ↓
Reçoit email de confirmation
  ↓
Accès au dashboard
  ↓
Voit 10 meilleurs marchés du moment
```

### Flow 2: Visiteur Non Converti → Lead Capture (Popup)
```
Visiteur visite /vente
  ↓
Reste 30 secondes
  ↓
Scroll de 50%+ OU clique sur CTA rouge
  ↓
Popup Exit-intent: "7 jours Premium gratuits"
  ↓
Entre email (optionnel)
  ↓
Reçoit lien téléchargement: "Guide des 50 marchés"
  ↓
Reçoit séquence email 5 jours
```

### Flow 3: Inscription → Utilisateur Actif
```
S'inscrit
  ↓
Email jour 0: Bienvenue + activation
  ↓
SMS jour 1: "Voici vos 10 premiers marchés"
  ↓
Email jour 1: Dashboard tutorial
  ↓
Email jour 2: "Comment gagner avec l'IA"
  ↓
Email jour 3: Premium trial offer
  ↓
SMS jour 7: "Résumé de votre semaine"
```

---

## 🔍 Success Metrics

### Vanity Metrics (À ignorer)
- ❌ Nombre de visites
- ❌ Nombre de clics

### Real Metrics (À tracker)
- ✅ **Sign-up Rate**: Visiteurs → Inscrits (Target: 5%+)
- ✅ **Email Capture Rate**: Visiteurs → Email collecté (Target: 20%+)
- ✅ **Activation Rate**: Inscrits → Dashboard utilisé (Target: 70%+)
- ✅ **Premium Conversion**: Actifs → Premium (Target: 10%+)
- ✅ **Cost per Lead**: $ par lead acquis (Target: < $1)
- ✅ **Cost per Premium**: $ par premium acquis (Target: < $20)
- ✅ **Email Open Rate**: (Target: 30%+)
- ✅ **Email Click Rate**: (Target: 5%+)

---

## 🎬 Implementation Phases

### Phase 1: Foundation (Week 1)
**Durée:** 4-5 jours
**What:** Landing page + formulaire optimisé

- [ ] Créer `/vente` page avec tous les sections
- [ ] Réduire `/inscription` à 3 champs
- [ ] Success page avec next steps
- [ ] Google Analytics + conversion tracking
- [ ] Testing sur mobile + desktop

**Deliverables:**
- Landing page déployée
- Formulaire allégé
- 1-2 inscriptions test

---

### Phase 2: Lead Capture (Week 1-2)
**Durée:** 2-3 jours
**What:** Popup + Email collection

- [ ] Exit-intent popup avec lead magnet
- [ ] Email capture form
- [ ] SMS WhatsApp opt-in
- [ ] Lead database
- [ ] Heatmap + session replay

**Deliverables:**
- Popup avec 20%+ capture rate
- 50+ emails collected

---

### Phase 3: Email Automation (Week 2)
**Durée:** 2-3 jours
**What:** Email sequences

- [ ] Welcome email (jour 0)
- [ ] Dashboard tutorial (jour 1)
- [ ] How to win email (jour 2)
- [ ] Premium offer (jour 3)
- [ ] Check-in email (jour 7)
- [ ] Reactivation sequence (week 3)

**Deliverables:**
- 5 emails templates
- Automation workflow
- 30%+ open rate

---

### Phase 4: Optimization & Scale (Week 3+)
**Durée:** ongoing
**What:** A/B testing + improvements

- [ ] Headline A/B tests
- [ ] CTA color/copy tests
- [ ] Form field order tests
- [ ] Email subject lines tests
- [ ] Paid ads if profitable
- [ ] Referral program launch

**Deliverables:**
- 50+ inscriptions/semaine
- 10%+ premium conversion
- Profitable CAC

---

## 🔧 Technical Stack

```
Frontend:
- Next.js 16 (Pages Router)
- React 18
- Tailwind CSS
- Framer Motion (animations)

Backend:
- Firebase (Auth + Firestore)
- Resend (Email)
- Twilio (SMS)
- Plausible (Analytics simple)

Tools:
- Figma (Design)
- Google Analytics 4
- Hotjar (Heatmaps)
- Lemlist (Email)
```

---

## 🚀 Rollout Strategy

### Week 1
- Monday-Wednesday: Développement Phase 1
- Thursday: QA + Testing
- Friday: Deployment `/vente`

### Week 2
- Monday: Phase 2 (Popups)
- Tuesday-Wednesday: Phase 3 (Email)
- Thursday: QA complète
- Friday: Monitoring + Optimizations

### Week 3+
- Daily: Monitor metrics
- 2x/week: A/B tests
- 1x/week: Optimization review

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email goes to spam | 50% | Use Resend, test SPF/DKIM |
| Mobile form breaks | 70% | Test all devices, use native inputs |
| SMS costs high | 20% | Use Twilio smartly, opt-in only |
| Low conversion rate | 80% | A/B test headlines + CTAs |
| Users don't activate | 60% | Strong onboarding emails |
| Privacy issues | 90% | Clear GDPR, opt-in only |

---

## 📞 Communication Plan

**Daily:**
- Slack updates on metrics
- Bug reports in #issues

**Weekly:**
- Tuesday 9am: Sprint planning
- Friday 4pm: Sprint review + demo

**Stakeholders:**
- @Product: Metrics weekly
- @CEO: Results weekly
- @Support: User feedback daily

---

## ✅ Definition of Done

Chaque phase est "Done" quand:
1. ✅ Code reviewed et merged
2. ✅ Deployed to production
3. ✅ Monitoring alerts setup
4. ✅ Documentation updated
5. ✅ Target metrics hit (ou plan B en place)
6. ✅ Team trained on changes

---

## 📚 References

- Growth framework: Pirate Metrics (AARRR)
- Best practices: YCombinator Growth
- Email: Superhuman playbook
- Landing pages: ConvertKit, Notion

---

**Next:** Créer le Design Spec (Phase 2)
