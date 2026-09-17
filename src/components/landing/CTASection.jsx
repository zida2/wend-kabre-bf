'use client';

import Link from 'next/link';
import styles from './CTASection.module.css';

export default function CTASection() {
  const handleCTA = () => {
    if (window.gtag) {
      window.gtag('event', 'cta_section_click', {
        section: 'cta_middle',
        cta_text: 'Sinscrire'
      });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.headline}>Pas sûr? Essayez gratuitement</h2>
        <p className={styles.subheadline}>
          Accédez immédiatement à 10 marchés recommandés pour tester
        </p>

        <Link
          href="/inscription"
          className={styles.cta}
          onClick={handleCTA}
        >
          S'inscrire maintenant
        </Link>

        <div className={styles.trustBadges}>
          <div className={styles.badge}>
            <span className={styles.icon}>✓</span>
            <span>Pas de carte bancaire</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.icon}>✓</span>
            <span>Accès immédiat</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.icon}>✓</span>
            <span>Assistance 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}
