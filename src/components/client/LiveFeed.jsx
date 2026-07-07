'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function LiveFeed() {
  const [marches, setMarches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const q = query(collection(db, 'marches'), orderBy('publishedAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMarches(data);
      } catch (err) {
        console.error("Erreur lors de la récupération du Live Feed :", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  if (loading || marches.length === 0) return null;

  return (
    <section className="section" style={{ background: 'var(--color-bg-2)', borderTop: '1px solid var(--color-border)', position: 'relative' }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <span className="badge badge-accent animate-pulse-gold" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span className="dot dot-red" style={{ animation: 'none', background: 'var(--danger)' }}></span> 
            En Direct : Opportunités de la semaine
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
            Ne laissez pas vos concurrents prendre ces marchés
          </h2>
          <p className="lead mx-auto" style={{ maxWidth: '620px' }}>
            Voici les tous derniers appels d'offres publiés au Burkina Faso. Des centaines de PME préparent déjà leurs dossiers.
          </p>
        </div>

        <div className="grid grid-3 gap-6 relative">
          {marches.map((m, i) => (
            <div key={m.id} className={`card-flat hover-lift blur-overlay animate-fadeInUp delay-${(i % 5) + 1}`} style={{ position: 'relative' }}>
              
              {/* Contenu flouté pour frustrer positivement l'utilisateur */}
              <div className="blur-content">
                <div className="flex justify-between items-start gap-2" style={{ marginBottom: '12px' }}>
                  <span className="badge badge-gray">{m.category || 'Appel d\'offres'}</span>
                  {m.urgence && <span className="badge badge-accent">🔥 {m.urgence}</span>}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: '12px', minHeight: '48px' }}>
                  {m.title && m.title.length > 70 ? m.title.substring(0, 70) + '...' : m.title}
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <p className="text-xs text-muted" style={{ marginBottom: '4px' }}><strong>Émetteur :</strong> Ministère / Institution Confidentielle</p>
                  <p className="text-xs text-muted"><strong>Budget :</strong> 💰 Non communiqué</p>
                </div>
                
                <div style={{ height: '40px', background: 'var(--color-border)', borderRadius: 'var(--radius-md)' }}></div>
              </div>

              {/* Call To Action net par-dessus le flou */}
              <div className="blur-cta">
                <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--forest-dark)', textShadow: '0 2px 10px rgba(255,255,255,0.8)', marginBottom: '12px' }}>
                  🔒 Marché Verrouillé
                </p>
                <Link href="/inscription" className="btn btn-primary btn-sm btn-shimmer" style={{ boxShadow: 'var(--shadow-primary)' }}>
                  Créer un compte pour voir
                </Link>
              </div>

            </div>
          ))}
        </div>
        
        <div className="text-center" style={{ marginTop: '32px' }}>
          <p className="text-sm text-secondary">
            + de 140 autres opportunités vous attendent sur la plateforme.
          </p>
        </div>

      </div>
    </section>
  );
}
