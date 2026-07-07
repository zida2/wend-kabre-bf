'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// ──────────────────────────────────────────────────────────────────────────────
// Composant Paywall : CTA Premium affiché sur les cartes verrouillées
// ──────────────────────────────────────────────────────────────────────────────
function PremiumLock({ label = "Débloquer" }) {
  return (
    <Link href="/tarifs" className="btn btn-sm" style={{
      background: 'var(--grad-accent)',
      color: '#fff',
      fontWeight: 700,
      gap: '6px',
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '50px',
      border: 'none',
      boxShadow: '0 4px 14px rgba(217,119,6,0.32)',
    }}>
      🔐 {label}
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Offres d'exemple "Passé" pour les non-abonnés
// ──────────────────────────────────────────────────────────────────────────────
const DEMO_OFFERS = [
  {
    id: 'demo-1',
    title: "Appel d'Offres pour l'acquisition de 500 kits solaires et matériels informatiques",
    category: 'Informatique',
    description: "Le Programme des Nations Unies pour le Développement (PNUD) lance un appel d'offres ouvert pour la fourniture et l'installation de matériels informatiques et de kits solaires au profit de 50 mairies rurales. Le DAO complet est retirable au bureau du PNUD à Ouagadougou. Date limite dépassée.",
    source: 'PNUD Burkina Faso',
    publishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true
  },
  {
    id: 'demo-2',
    title: "Recrutement d'un cabinet pour l'évaluation finale du projet Eau et Assainissement",
    category: 'Prestation',
    description: "L'ONG WaterAid recherche un cabinet d'études pour réaliser l'évaluation finale de son programme triennal d'accès à l'eau potable dans le Nord. Les candidats doivent justifier d'au moins 5 ans d'expérience dans l'évaluation de projets WASH. Dépôt des offres techniques et financières sous plis fermés.",
    source: 'WaterAid / ONG',
    publishedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true
  },
  {
    id: 'demo-3',
    title: "Travaux de construction et d'aménagement de 3 Centres de Santé (CSPS)",
    category: 'Construction',
    description: "Le Ministère de la Santé lance un appel d'offres pour la construction de trois CSPS complets (dispensaire, maternité, logements, forages) dans la région de la Boucle du Mouhoun. Visite de site obligatoire. Caution de soumission de 2 millions FCFA exigée.",
    source: 'Ministère de la Santé',
    publishedAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true
  }
];

// ──────────────────────────────────────────────────────────────────────────────
// Composant texte flouté avec overlay premium
// ──────────────────────────────────────────────────────────────────────────────
function BlurredText({ text, lines = 2 }) {
  const preview = text ? text.substring(0, 60) + '██████████ ████ ████████ ██ ████ █████████████.' : '██████ ████████████ ████ █████████ ███████████.';
  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <p className="text-secondary text-sm" style={{
        filter: 'blur(4px)',
        userSelect: 'none',
        pointerEvents: 'none',
        WebkitUserSelect: 'none',
        lineHeight: 1.7,
        opacity: 0.7,
      }}>
        {preview}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Bannière d'accueil pour nouveaux visiteurs
// ──────────────────────────────────────────────────────────────────────────────
function WelcomeBanner({ marcheCount }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(5,150,105,0.07) 0%, rgba(6,78,59,0.04) 100%)',
      border: '1px solid var(--color-border-hover)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px',
      marginBottom: '40px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
      <h2 className="heading-md" style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
        {marcheCount > 0 ? `${marcheCount} offres de recrutement disponibles aujourd'hui` : 'Recrutements et Formations'}
      </h2>
      <p className="text-secondary text-sm" style={{ maxWidth: '520px', margin: '0 auto 24px' }}>
        Vous voyez les <strong style={{ color: 'var(--primary-dark)' }}>titres & catégories</strong> gratuitement.
        Pour accéder aux détails complets, à la source officielle et au lien de dépôt —
        <strong style={{ color: 'var(--accent)' }}> passez Premium.</strong>
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/tarifs" className="btn btn-accent btn-sm">
          Voir les offres Premium 🚀
        </Link>
        <Link href="/inscription" className="btn btn-outline btn-sm">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page principale
// ──────────────────────────────────────────────────────────────────────────────
export default function RecrutementsPage() {
  const [marches, setMarches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          if (snap.exists()) setUserData(snap.data());
        } catch (e) { console.error(e); }
      } else {
        setUserData(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Chargement des marchés
  useEffect(() => {
    const fetchMarches = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'marches'), orderBy('publishedAt', 'desc'));
        const snap = await getDocs(q);
        setMarches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erreur chargement:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMarches();
  }, []);

  const isSubscribed = userData?.isSubscribed === true;

  const filteredMarches = marches.filter(m => {
    if (m.category !== 'Recrutement') return false;
    const matchSearch = (m.title || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });


  // ──────────────────────────────────────────────────────────────────────────
  // Rendu
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <main className="container section animate-fadeIn">
      {/* En-tête */}
      <div style={{ marginBottom: '40px' }}>
        <span className="badge badge-green" style={{ marginBottom: '10px' }}>Emplois et Formations 🇧🇫</span>
        <h1 className="heading-lg">Burkina Faso — Recrutements & Formations</h1>
        <p className="text-secondary text-sm">
          Offres de recrutement, opportunités de stages et formations professionnelles.
        </p>
      </div>

      {/* Bandeau d'accès libre : les recrutements sont 100% gratuits */}
      <div style={{
        background: 'var(--success-muted)',
        border: '1px solid rgba(5,150,105,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '30px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '1.4rem' }}>✅</span>
        <p className="text-sm" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
          Consultation <strong>100% gratuite</strong> : recrutements, stages et formations sont en accès libre, avec tous les détails.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="card" style={{ marginBottom: '30px', background: 'var(--color-bg-2)', padding: '20px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">🔍 Filtrer par mot-clé</label>
          <input
            type="text"
            placeholder="Ex: consultant, assistant, formateur..."
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grille des marchés */}
      {loading || authLoading ? (
        <div className="text-center" style={{ padding: '80px 0' }}>
          <span className="loader" style={{ width: '40px', height: '40px' }}></span>
          <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement des opportunités...</p>
        </div>
      ) : filteredMarches.length === 0 ? (
        <div className="card text-center" style={{ padding: '80px 40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📭</div>
          <h3 className="heading-md">Aucun marché trouvé</h3>
          <p className="text-secondary text-sm" style={{ marginTop: '12px' }}>
            Modifiez vos filtres ou revenez plus tard pour de nouvelles opportunités.
          </p>
        </div>
      ) : (
        <div className="grid grid-2 gap-6">
          {filteredMarches.map((m) => (
            <div key={m.id} className="card flex flex-col justify-between" style={{ height: '100%' }}>
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                  <span className="badge badge-green">{m.category || 'Général'}</span>
                  <span className="text-muted text-xs">
                    {m.publishedAt ? new Date(m.publishedAt).toLocaleDateString('fr-FR') : 'Récent'}
                  </span>
                </div>

                <h3 className="heading-md text-primary" style={{ marginBottom: '12px', fontSize: '1.1rem', lineHeight: 1.5 }}>
                  {m.title}
                </h3>

                <p className="text-secondary text-sm" style={{ marginBottom: '20px', lineHeight: 1.7 }}>
                  {(m.description || '').substring(0, 160)}
                  {(m.description || '').length > 160 ? '…' : ''}
                </p>
              </div>

              <div className="divider" style={{ margin: '16px 0' }}></div>

              <div className="flex justify-between items-center" style={{ gap: '12px' }}>
                <div>
                  <p className="text-xs text-muted">ÉMETTEUR</p>
                  <p className="text-xs text-secondary" style={{ fontWeight: 600 }}>{m.source || 'Source officielle'}</p>
                </div>
                <Link href={`/marches/details?id=${m.id}`} className="btn btn-primary btn-sm">
                  Voir les détails 📄
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
