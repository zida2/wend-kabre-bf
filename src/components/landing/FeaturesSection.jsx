'use client';

import { useEffect, useState } from 'react';
import styles from './FeaturesSection.module.css';

const FEATURES = [
  {
    icon: '📋',
    title: '100+ Marchés/Mois',
    description: 'Tous les appels d\'offres du Burkina en un seul endroit. Actualisés chaque jour.'
  },
  {
    icon: '🤖',
    title: 'Analyse IA',
    description: 'L\'IA extrait les infos clés et les pièces exigées. Prête à utiliser.'
  },
  {
    icon: '📧',
    title: 'Alertes Intelligentes',
    description: 'Notifications en temps réel quand un marché correspond à votre profil.'
  },
  {
    icon: '📊',
    title: 'Studio de Génération',
    description: 'Générez vos dossiers en 15min avec l\'IA et vos données entreprise.'
  }
];

export default function FeaturesSection() {
  const [visibleFeatures, setVisibleFeatures] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(entry.target.parentChildren || []).indexOf(entry.target);
          setVisibleFeatures(prev => new Set([...prev, index]));
          
          if (window.gtag) {
            window.gtag('event', 'scroll_to_section', {
              section: 'features'
            });
          }
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(`.${styles.featureCard}`).forEach((el, idx) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        <h2 className={styles.title}>Comment Wend-Kabré Fonctionne</h2>
        <p className={styles.subtitle}>
          Une solution complète pour trouver et remporter les meilleurs marchés publics
        </p>

        <div className={styles.featuresGrid}>
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className={`${styles.featureCard} ${
                visibleFeatures.has(idx) ? styles.visible : ''
              }`}
              style={{
                animationDelay: `${idx * 100}ms`
              }}
            >
              <div className={styles.icon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <div className={styles.arrow}>→</div>
            </div>
          ))}
        </div>

        {/* How it works - Step by step */}
        <div className={styles.stepsSection}>
          <h3 className={styles.stepsTitle}>3 Étapes pour Réussir</h3>
          <div className={styles.stepsContainer}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>S'inscrire</h4>
                <p>Créez votre compte en 2 minutes. Gratuit.</p>
              </div>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Recevez les Marchés</h4>
                <p>Nous vous envoyons 10+ marchés qui vous conviennent chaque jour.</p>
              </div>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Remportez le Marché</h4>
                <p>Utilisez l'IA pour générer votre dossier et envoyer.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
