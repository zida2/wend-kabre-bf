'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './tarifs.module.css';

const PLANS = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    price: 0,
    duration: 'Accès illimité',
    description: 'Pour démarrer et explorer',
    features: [
      '✅ Accès aux 100+ marchés publics',
      '✅ Recherche et filtrage basiques',
      '✅ Alertes (5/jour)',
      '✅ Support email',
      '❌ Analyse de documents',
      '❌ Génération de modèles',
    ],
    cta: 'Commencer Gratuitement',
    ctaLink: '/inscription',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 5000,
    currency: 'XOF',
    duration: 'par mois',
    description: 'Pour professionnels sérieux',
    features: [
      '✅ Tous les services Gratuit +',
      '✅ Alertes illimitées',
      '✅ Analyse de documents PDF',
      '✅ Comparaison de marchés',
      '✅ Support prioritaire (24h)',
      '❌ Génération avancée de documents',
    ],
    cta: 'Passer à Premium',
    ctaAction: 'premium',
    popular: true,
    badge: 'Populaire',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    currency: 'XOF',
    duration: 'par mois',
    description: 'Pour agences & PME',
    features: [
      '✅ Tous les services Premium +',
      '✅ Génération de documents',
      '✅ Modèles personnalisés',
      '✅ Analyse prédictive IA',
      '✅ Support VIP 24/7',
      '✅ Rapports mensuels',
    ],
    cta: 'Passer à Pro',
    ctaAction: 'pro',
    popular: false,
  },
];

export default function TarifsPage() {
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('gratuit');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check user auth status
  useState(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // TODO: Fetch user's current plan
        setCurrentPlan('gratuit');
      }
    });
    return () => unsub();
  }, []);

  const handleUpgrade = (planId) => {
    if (!user) {
      router.push('/inscription');
      return;
    }

    setLoading(true);
    router.push(`/payment/checkout?plan=${planId}`);
  };

  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Plans d'Abonnement</h1>
          <p className={styles.subtitle}>
            Choisissez le plan qui correspond à votre activité
          </p>
          <p className={styles.description}>
            Tous les plans incluent l'accès aux 100+ marchés publics du Burkina Faso
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className={styles.pricingSection}>
        <div className={styles.cardsContainer}>
          {PLANS.map((plan) => (
            <div key={plan.id} className={`${styles.card} ${plan.popular ? styles.popular : ''}`}>
              {plan.badge && <div className={styles.badge}>{plan.badge}</div>}

              {/* Card Header */}
              <div className={styles.cardHeader}>
                <h2 className={styles.planName}>{plan.name}</h2>
                <div className={styles.priceSection}>
                  {plan.price > 0 ? (
                    <>
                      <span className={styles.price}>{plan.price.toLocaleString('fr-FR')}</span>
                      <span className={styles.currency}> {plan.currency}</span>
                      <span className={styles.duration}>/{plan.duration}</span>
                    </>
                  ) : (
                    <span className={styles.free}>{plan.duration}</span>
                  )}
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              {/* Features List */}
              <div className={styles.featuresList}>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className={styles.feature}>
                    <span className={styles.featureIcon}>
                      {feature.startsWith('✅') ? '✅' : '❌'}
                    </span>
                    <span className={styles.featureText}>{feature.replace(/^(✅|❌)\s/, '')}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className={styles.ctaWrapper}>
                {plan.ctaLink ? (
                  <Link href={plan.ctaLink} className={`${styles.ctaButton} ${styles.link}`}>
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    className={`${styles.ctaButton} ${currentPlan === plan.id ? styles.current : ''}`}
                    onClick={() => handleUpgrade(plan.ctaAction)}
                    disabled={loading || currentPlan === plan.id}
                  >
                    {currentPlan === plan.id ? 'Plan actuel' : plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.comparisonTitle}>Comparaison Complète</h2>

        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th className={styles.feature}>Fonctionnalité</th>
                <th>Gratuit</th>
                <th className={styles.highlight}>Premium</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.feature}>Base de marchés</td>
                <td>✅ 100+</td>
                <td className={styles.highlight}>✅ 100+</td>
                <td>✅ 100+</td>
              </tr>
              <tr>
                <td className={styles.feature}>Alertes par jour</td>
                <td>5</td>
                <td className={styles.highlight}>Illimités</td>
                <td>Illimités</td>
              </tr>
              <tr>
                <td className={styles.feature}>Recherche avancée</td>
                <td>❌</td>
                <td className={styles.highlight}>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td className={styles.feature}>Analyse de documents</td>
                <td>❌</td>
                <td className={styles.highlight}>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td className={styles.feature}>Génération de modèles</td>
                <td>❌</td>
                <td className={styles.highlight}>❌</td>
                <td>✅</td>
              </tr>
              <tr>
                <td className={styles.feature}>Support</td>
                <td>Email</td>
                <td className={styles.highlight}>Prioritaire 24h</td>
                <td>VIP 24/7</td>
              </tr>
              <tr>
                <td className={styles.feature}>Rapports personnalisés</td>
                <td>❌</td>
                <td className={styles.highlight}>❌</td>
                <td>✅ Mensuels</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Questions Fréquentes</h2>

        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>❓ Puis-je changer de plan à tout moment?</h3>
            <p className={styles.faqAnswer}>
              Oui! Vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements 
              prennent effet immédiatement.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>❓ Y a-t-il un engagement minimum?</h3>
            <p className={styles.faqAnswer}>
              Non, aucun engagement. Vous pouvez vous désabonner à tout moment sans frais d'annulation.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>❓ Quels sont les moyens de paiement?</h3>
            <p className={styles.faqAnswer}>
              Nous acceptons Orange Money, MTN Money, Wave et les virements bancaires. Paiements sécurisés 
              via Money Fusion.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>❓ Puis-je essayer Premium gratuitement?</h3>
            <p className={styles.faqAnswer}>
              Actuellement non, mais vous pouvez commencer avec le plan Gratuit et passer à Premium 
              à tout moment.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>❓ Comment fonctionne la facturation?</h3>
            <p className={styles.faqAnswer}>
              Vous êtes facturé à la date d'inscription et chaque mois à la même date. Vous recevrez 
              une facture par email.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>❓ Que se passe-t-il à l'expiration de mon abonnement?</h3>
            <p className={styles.faqAnswer}>
              Votre accès revient au plan Gratuit. Vous recevrez un email de rappel 7 jours avant l'expiration.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Prêt à démarrer?</h2>
          <p className={styles.ctaSubtitle}>
            Commencez gratuitement ou passez à Premium pour débloquer toutes les fonctionnalités
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/inscription" className={styles.ctaButtonPrimary}>
              Commencer Gratuitement
            </Link>
            <Link href="/connexion" className={styles.ctaButtonSecondary}>
              Se Connecter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
