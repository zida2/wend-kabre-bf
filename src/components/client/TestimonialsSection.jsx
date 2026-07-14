'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import TestimonialForm from './TestimonialForm';

const STATIC_TESTIMONIALS = [
  {
    name: 'Ousmane S.',
    role: 'Gérant PME BTP (Ouagadougou)',
    content: "Grâce à Wend-Kabré, nous ne ratons plus aucun appel d'offres. L'alerte est tombée à pic pour le dernier marché du ministère !",
    rating: 5,
  },
  {
    name: 'Awa C.',
    role: 'Directrice (Fournitures & Services)',
    content: "L'assistant IA m'a sauvé la mise. Il a détecté qu'il manquait mon quitus fiscal à 48h de la clôture d'une demande de cotation.",
    rating: 5,
  },
  {
    name: 'Seydou T.',
    role: 'Fournisseur Matériel Informatique',
    content: "La clarté des procédures est incroyable. On sait exactement où aller déposer notre dossier physique et ce qu'il faut mettre dedans.",
    rating: 5,
  }
];

export default function TestimonialsSection() {
  const [dynamicTestimonials, setDynamicTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const q = query(
          collection(db, 'testimonials'), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDynamicTestimonials(fetched);
      } catch (err) {
        console.error('Erreur lors du chargement des avis:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  const allTestimonials = [...STATIC_TESTIMONIALS, ...dynamicTestimonials];

  return (
    <section className="section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: '52px' }}>
          <span className="badge badge-accent" style={{ marginBottom: '16px' }}>⭐ Vos Avis</span>
          <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
            Ils gagnent des marchés avec nous
          </h2>
          <p className="lead mx-auto" style={{ maxWidth: '580px' }}>
            Découvrez les retours des entrepreneurs burkinabè qui utilisent déjà Wend-Kabré pour développer leur chiffre d'affaires.
          </p>
        </div>

        <div className="grid grid-3 gap-6">
          {allTestimonials.map((testi, i) => (
            <div key={testi.id || i} className={`card-glass hover-lift animate-fadeInUp delay-${(i % 5) + 1}`} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex gap-1">
                {[...Array(testi.rating || 5)].map((_, j) => (
                  <span key={j} style={{ color: '#F59E0B', fontSize: '1.2rem' }}>★</span>
                ))}
              </div>
              <p className="text-secondary" style={{ lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>
                "{testi.content}"
              </p>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: 'auto' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{testi.name}</p>
                <p className="text-muted text-xs">{testi.role}</p>
              </div>
            </div>
          ))}
        </div>

        <TestimonialForm />
      </div>
    </section>
  );
}
