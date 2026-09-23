'use client';
import { useState } from 'react';
import styles from './FAQ.module.css';

const faqs = [
  {
    question: "Comment accéder aux marchés publics du Burkina Faso ?",
    answer: "Wend-Kabré centralise tous les appels d'offres des sources officielles (ARCOP, DGCMEF). Créez un compte gratuit pour consulter les titres et catégories, ou souscrivez au plan Premium pour accéder aux détails complets, PDF et alertes personnalisées."
  },
  {
    question: "Quels sont les tarifs de Wend-Kabré ?",
    answer: "Nous proposons 3 plans : Découverte (gratuit), Premium (15 000 FCFA/mois) avec accès complet, alertes et assistant IA, et Entreprise (55 000 FCFA/mois) pour jusqu'à 10 utilisateurs avec fonctionnalités avancées."
  },
  {
    question: "Comment fonctionne l'assistant IA ?",
    answer: "L'assistant IA analyse vos dossiers d'appels d'offres, vérifie la conformité avec les exigences, suggère des améliorations et répond à vos questions sur les procédures de marchés publics au Burkina Faso."
  },
  {
    question: "Puis-je recevoir des alertes pour des catégories spécifiques ?",
    answer: "Oui ! Les abonnés Premium peuvent configurer des alertes personnalisées par catégorie (BTP, informatique, fournitures, etc.), région et seuil de montant. Les alertes sont envoyées par WhatsApp et SMS en temps réel."
  },
  {
    question: "Les documents PDF sont-ils disponibles ?",
    answer: "Oui, pour les marchés qui disposent de documents officiels PDF (DAO, TDR, etc.), les abonnés Premium peuvent les télécharger directement depuis la plateforme."
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faqSection}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-green" style={{ marginBottom: '12px' }}>
            FAQ
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
            Questions Fréquentes
          </h2>
          <p className="text-secondary text-sm" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Tout ce que vous devez savoir sur Wend-Kabré et les marchés publics au Burkina Faso.
          </p>
        </div>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className={styles.questionText}>{faq.question}</span>
                <span className={styles.icon} aria-hidden="true">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              
              {openIndex === index && (
                <div className={styles.faqAnswer}>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <p className="text-secondary text-sm" style={{ marginBottom: '16px' }}>
            Vous ne trouvez pas la réponse à votre question ?
          </p>
          <a href="/contact" className="btn btn-outline btn-sm">
            Contactez-nous
          </a>
        </div>
      </div>
    </section>
  );
}
