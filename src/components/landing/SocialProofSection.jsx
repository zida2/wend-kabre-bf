'use client';

import { useEffect, useState } from 'react';
import styles from './SocialProofSection.module.css';

const STATS = [
  { number: '500+', label: 'PME actives' },
  { number: '10,000+', label: 'Marchés trouvés' },
  { number: '75%', label: 'Taux de succès' },
  { number: '4.8★', label: 'Sur 200+ avis' }
];

const TESTIMONIALS = [
  {
    quote: "Wend-Kabré m'a économisé 100k FCFA en 3 mois. Je passe maintenant 5 minutes par jour au lieu de 10h/semaine.",
    author: "Amadou Traoré",
    company: "SARL FASO DIGITAL",
    avatar: "AT"
  },
  {
    quote: "L'IA m'a aidé à générer des dossiers plus complets. On a décroché 3 marchés en un mois!",
    author: "Rougiatou Diallo",
    company: "ENTREPRISE SERVICES BF",
    avatar: "RD"
  },
  {
    quote: "Les alertes intelligentes m'ont sauvé plusieurs fois. Je ne rate plus jamais une date limite.",
    author: "Hassan Ouedraogo",
    company: "CONSTRUCTION OUEST",
    avatar: "HO"
  }
];

export default function SocialProofSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (!isAutoScroll) return;

    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoScroll]);

  const handleTestimonialClick = (index) => {
    setActiveTestimonial(index);
    setIsAutoScroll(false);
  };

  const trackScroll = () => {
    if (window.gtag) {
      window.gtag('event', 'scroll_to_section', {
        section: 'social_proof'
      });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trackScroll();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    const element = document.querySelector(`.${styles.section}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Pourquoi nos clients font confiance à Wend-Kabré</h2>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {STATS.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className={styles.testimonialSection}>
          <div className={styles.testimonialContainer}>
            {TESTIMONIALS.map((testimonial, idx) => (
              <div
                key={idx}
                className={`${styles.testimonial} ${
                  idx === activeTestimonial ? styles.active : ''
                }`}
              >
                <div className={styles.testimonialContent}>
                  <p className={styles.quote}>"{testimonial.quote}"</p>
                  <div className={styles.author}>
                    <div className={styles.avatar}>{testimonial.avatar}</div>
                    <div>
                      <div className={styles.authorName}>{testimonial.author}</div>
                      <div className={styles.authorCompany}>{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots indicator */}
          <div className={styles.dots}>
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === activeTestimonial ? styles.active : ''}`}
                onClick={() => handleTestimonialClick(idx)}
                aria-label={`Testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className={styles.trustSection}>
          <div className={styles.trustBadge}>
            <span className={styles.badge}>✓</span>
            <span>Appels d'offres vérifiés</span>
          </div>
          <div className={styles.trustBadge}>
            <span className={styles.badge}>✓</span>
            <span>Garantie de satisfaction 30j</span>
          </div>
          <div className={styles.trustBadge}>
            <span className={styles.badge}>✓</span>
            <span>Support 24/7 en français</span>
          </div>
        </div>
      </div>
    </section>
  );
}
