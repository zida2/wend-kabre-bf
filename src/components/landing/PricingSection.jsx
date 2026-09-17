'use client';

import Link from 'next/link';
import styles from './PricingSection.module.css';

const PLANS = [
  {
    name: 'Gratuit',
    price: 0,
    currency: 'FCFA',
    description: 'Parfait pour commencer',
    features: [
      { text: '5 marchés/mois', included: true },
      { text: 'Alertes basiques', included: true },
      { text: 'Support email', included: true },
      { text: 'Analyse IA', included: false },
      { text: 'Studio de génération', included: false },
      { text: 'Support 24/7', included: false }
    ],
    cta: {
      text: "S'inscrire",
      href: '/inscription'
    },
    highlighted: false
  },
  {
    name: 'Premium',
    price: 15000,
    currency: 'FCFA',
    billing: '/mois',
    description: 'Pour les entreprises sérieuses',
    features: [
      { text: 'Marchés illimités', included: true },
      { text: 'Alertes intelligentes', included: true },
      { text: 'Support 24/7 WhatsApp', included: true },
      { text: 'Analyse IA complète', included: true },
      { text: 'Studio de génération', included: true },
      { text: 'Priorité support', included: true }
    ],
    cta: {
      text: 'Essai 7 jours gratuits',
      href: '/inscription?plan=premium'
    },
    badge: 'POPULAIRE',
    highlighted: true
  }
];

export default function PricingSection() {
  const trackPricingClick = (plan) => {
    if (window.gtag) {
      window.gtag('event', 'pricing_cta_click', {
        plan_name: plan,
        event_category: 'pricing'
      });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tarification Simple et Transparente</h2>
          <p className={styles.subtitle}>
            Pas de frais cachés. Annulez à tout moment.
          </p>
        </div>

        <div className={styles.plansContainer}>
          {PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`${styles.planCard} ${
                plan.highlighted ? styles.highlighted : ''
              }`}
            >
              {plan.badge && (
                <div className={styles.badge}>{plan.badge}</div>
              )}

              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.pricing}>
                <span className={styles.price}>{plan.price.toLocaleString('fr-FR')}</span>
                <span className={styles.currency}>{plan.currency}</span>
                {plan.billing && (
                  <span className={styles.billing}>{plan.billing}</span>
                )}
              </div>

              <div className={styles.features}>
                {plan.features.map((feature, fidx) => (
                  <div
                    key={fidx}
                    className={`${styles.feature} ${
                      feature.included ? styles.included : styles.notIncluded
                    }`}
                  >
                    <span className={styles.featureCheck}>
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.cta.href}
                className={`${styles.cta} ${
                  plan.highlighted ? styles.primary : styles.secondary
                }`}
                onClick={() => trackPricingClick(plan.name)}
              >
                {plan.cta.text}
              </Link>

              {plan.highlighted && (
                <p className={styles.guarantee}>
                  ✅ 7 jours gratuits, pas de carte bancaire
                </p>
              )}
            </div>
          ))}
        </div>

        <div className={styles.additionalInfo}>
          <h3>Questions sur les tarifs?</h3>
          <p>
            Contactez notre équipe pour un plan personnalisé adapté à votre entreprise.
          </p>
          <Link href="/contact" className={styles.contactLink}>
            Contactez-nous
          </Link>
        </div>
      </div>
    </section>
  );
}
