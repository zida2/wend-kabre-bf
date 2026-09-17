'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './success.module.css';
import { track } from '@/lib/track';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const [stepNumber, setStepNumber] = useState(0);

  useEffect(() => {
    // Track success page view
    track('signup_complete_page_view', { email: email || 'unknown' });

    // Auto-advance through steps for visual effect
    const interval = setInterval(() => {
      setStepNumber(prev => prev < 2 ? prev + 1 : prev);
    }, 1500);

    return () => clearInterval(interval);
  }, [email]);

  const nextSteps = [
    {
      number: 1,
      title: 'Vérifiez votre email',
      description: `Un lien de confirmation a été envoyé à ${email}. Cliquez dessus pour activer votre compte.`,
      time: '5 min',
      icon: '📧'
    },
    {
      number: 2,
      title: 'Explorez les marchés',
      description: 'Accédez à votre tableau de bord et découvrez les 10 premiers marchés recommandés pour votre entreprise.',
      time: '10 min',
      icon: '📋'
    },
    {
      number: 3,
      title: 'Configurez vos alertes',
      description: 'Définissez vos préférences pour recevoir les meilleures opportunités adaptées à votre profil.',
      time: '5 min',
      icon: '🔔'
    }
  ];

  const handleContinue = () => {
    track('success_page_continue_click');
    router.push('/dashboard');
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.title}>
            Inscription réussie !
          </h1>
          <p className={styles.subtitle}>
            Bienvenue sur Wend-Kabré 🎉
          </p>
        </div>

        {/* Email Confirmation */}
        <div className={styles.confirmationBox}>
          <p className={styles.confirmText}>
            Email de confirmation envoyé à:
          </p>
          <p className={styles.email}>{email}</p>
          <p className={styles.checkSpam}>
            💡 Vérifiez votre dossier Spam si vous ne voyez pas l'email
          </p>
        </div>

        {/* Next Steps */}
        <section className={styles.nextStepsSection}>
          <h2 className={styles.stepsTitle}>Vos prochaines étapes</h2>
          <div className={styles.stepsContainer}>
            {nextSteps.map((step, idx) => (
              <div
                key={idx}
                className={`${styles.step} ${
                  idx <= stepNumber ? styles.visible : ''
                }`}
              >
                <div className={styles.stepIcon}>{step.icon}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepNumber}>
                    Étape {step.number}
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                  <span className={styles.stepTime}>⏱️ {step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Buttons */}
        <div className={styles.ctaSection}>
          <button
            className={styles.primaryCta}
            onClick={handleContinue}
          >
            Aller au tableau de bord
          </button>
          <Link
            href="/marches"
            className={styles.secondaryCta}
          >
            Explorer les marchés maintenant
          </Link>
        </div>

        {/* Help Section */}
        <div className={styles.helpSection}>
          <h3 className={styles.helpTitle}>Besoin d'aide ?</h3>
          <div className={styles.helpOptions}>
            <div className={styles.helpOption}>
              <span className={styles.helpIcon}>💬</span>
              <div>
                <p className={styles.helpLabel}>Chat en direct</p>
                <p className={styles.helpDesc}>Parlons avec nos experts</p>
              </div>
            </div>
            <div className={styles.helpOption}>
              <span className={styles.helpIcon}>📧</span>
              <div>
                <p className={styles.helpLabel}>Email Support</p>
                <p className={styles.helpDesc}>support@wend-kabre.bf</p>
              </div>
            </div>
            <div className={styles.helpOption}>
              <span className={styles.helpIcon}>📱</span>
              <div>
                <p className={styles.helpLabel}>WhatsApp</p>
                <p className={styles.helpDesc}>+226 70 00 00 00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className={styles.trustBadges}>
          <div className={styles.badge}>✓ Compte activé immédiatement</div>
          <div className={styles.badge}>✓ Données sécurisées (SSL/RGPD)</div>
          <div className={styles.badge}>✓ Support 24/7 disponible</div>
        </div>
      </div>
    </main>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
