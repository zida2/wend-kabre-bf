'use client';

import { useState } from 'react';
import styles from './FAQSection.module.css';

const FAQS = [
  {
    question: 'Comment ça marche?',
    answer: 'Vous vous inscrivez, on vous envoie les meilleures offres adaptées à votre profil chaque jour. Utilisez notre IA pour générer vos dossiers et remportez les marchés.'
  },
  {
    question: 'Combien ça coûte?',
    answer: 'C\'est gratuit pour accès basique (5 marchés/mois). Premium débute à 15 000 FCFA/mois pour marchés illimités + IA + support 24/7.'
  },
  {
    question: 'Que faire si je n\'ai pas trouvé de marché ce mois-ci?',
    answer: 'Nous vous remboursons 100% du mois. Notre garantie de satisfaction est simple : si vous ne trouvez pas de marché, ça ne coûte rien.'
  },
  {
    question: 'Comment supprimer mon compte?',
    answer: 'Un clic en 30 secondes dans les paramètres. Vos données seront supprimées immédiatement. Pas de questions posées.'
  },
  {
    question: 'Quel support avez-vous?',
    answer: 'Support 24/7 via WhatsApp, Email et Chat pour les utilisateurs Premium. Email pour les utilisateurs Gratuit.'
  },
  {
    question: 'Est-ce que l\'IA est vraiment efficace?',
    answer: 'Oui, 75% de nos utilisateurs remportent au moins un marché en 2 mois. L\'IA génère des dossiers qui gagnent vraiment.'
  }
];

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
    
    if (window.gtag) {
      window.gtag('event', 'faq_click', {
        faq_index: index,
        faq_question: FAQS[index].question
      });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Questions Fréquentes</h2>
          <p className={styles.subtitle}>
            Tout ce que vous devez savoir pour commencer
          </p>
        </div>

        <div className={styles.faqList}>
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${
                activeIndex === index ? styles.active : ''
              }`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
              >
                <span>{faq.question}</span>
                <span className={styles.toggle}>
                  {activeIndex === index ? '−' : '+'}
                </span>
              </button>
              
              {activeIndex === index && (
                <div className={styles.faqAnswer}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.contactSection}>
          <p>Vous n'avez pas trouvé votre réponse?</p>
          <a href="/contact" className={styles.contactLink}>
            Contactez notre support
          </a>
        </div>
      </div>
    </section>
  );
}
