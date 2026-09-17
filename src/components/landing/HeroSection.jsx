'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Track page view event
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: '/vente',
        page_title: 'Landing - Vente'
      });
    }
  }, []);

  const handlePrimaryCTA = () => {
    if (window.gtag) {
      window.gtag('event', 'click_hero_cta', {
        cta_type: 'primary',
        cta_text: 'Sinscrire'
      });
    }
  };

  const handleSecondaryCTA = () => {
    if (window.gtag) {
      window.gtag('event', 'click_hero_cta', {
        cta_type: 'secondary',
        cta_text: 'Voir les marchés'
      });
    }
  };

  return (
    <section className={`${styles.hero} ${isLoaded ? styles.loaded : ''}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.headline}>
            Les PME qui trouvent les meilleurs marchés publics
          </h1>
          <p className={styles.subheadline}>
            Sans passer 10h/semaine à les chercher
          </p>
          
          <div className={styles.ctaGroup}>
            <Link 
              href="/inscription" 
              className={`${styles.cta} ${styles.primary}`}
              onClick={handlePrimaryCTA}
            >
              S'inscrire - 2 min
            </Link>
            <button 
              className={`${styles.cta} ${styles.secondary}`}
              onClick={() => {
                handleSecondaryCTA();
                document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Voir les 50 marchés
            </button>
          </div>

          <div className={styles.trustBadges}>
            <span>✅ Pas de carte bancaire</span>
            <span>⚡ Accès immédiat</span>
            <span>💬 Support 24/7</span>
          </div>
        </div>

        <div className={styles.backgroundImage}></div>
      </div>
    </section>
  );
}
