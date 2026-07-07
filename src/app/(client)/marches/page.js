'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { track } from '@/lib/track';
import { expandQuery, normalize } from '@/lib/searchSynonyms';

// ──────────────────────────────────────────────────────────────────────────────
// Composant Paywall : CTA Premium affiché sur les cartes verrouillées
// ──────────────────────────────────────────────────────────────────────────────
function PremiumLock({ label = "Débloquer" }) {
  return (
    <Link href="/tarifs" onClick={() => track('click', { id: 'premium_unlock', label: 'Débloquer' })} className="btn btn-sm" style={{
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
        {marcheCount > 0 ? `${marcheCount} marchés publics disponibles aujourd'hui` : 'Marchés publics en temps réel'}
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
export default function MarchesPage() {
  const [marches, setMarches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // §5 — Filtres avancés (état local)
  const [filterRegion, setFilterRegion] = useState('Toutes');
  const [filterProcedure, setFilterProcedure] = useState('Toutes');
  const [filterUrgence, setFilterUrgence] = useState('Toutes');

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
      setLoadError(false);
      try {
        const q = query(collection(db, 'marches'), orderBy('publishedAt', 'desc'));
        const snap = await getDocs(q);
        setMarches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erreur chargement:", e);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMarches();
  }, []);

  const isSubscribed = userData?.isSubscribed === true;

  const categoriesList = [
    { id: 'All', label: 'Toutes les offres', icon: '📋' },
    { id: 'Informatique', label: 'Informatique & Telecom', icon: '💻' },
    { id: 'Construction', label: 'BTP & Construction', icon: '🏗️' },
    { id: 'Fourniture', label: 'Fournitures & Équipements', icon: '📦' },
    { id: 'Prestation', label: 'Prestations de Services', icon: '⚙️' },
  ];

  // §5 — Options distinctes présentes dans les données (hors recrutements)
  const visibleMarches = marches.filter(m => m.category !== 'Recrutement');
  const distinctOf = (key) =>
    Array.from(new Set(
      visibleMarches
        .map(m => m[key])
        .filter(v => v && v !== 'Non spécifié' && v !== 'Non datée')
    )).sort((a, b) => a.localeCompare(b, 'fr'));

  const regionOptions = distinctOf('region');
  const procedureOptions = distinctOf('procedure');

  // §6 — Termes de recherche étendus (sémantique par synonymes)
  const searchTerms = expandQuery(search); // [] si search vide

  const filteredMarches = marches.filter(m => {
    if (m.category === 'Recrutement') return false; // Ne jamais afficher les recrutements ici

    // §6 — Recherche sémantique : au moins un terme étendu dans le texte du marché
    let matchSearch = true;
    if (searchTerms.length > 0) {
      const haystack = normalize(
        [m.title, m.description, m.category, m.secteur, m.region].filter(Boolean).join(' ')
      );
      matchSearch = searchTerms.some(term => haystack.includes(term));
    }

    const matchCat = activeCategory === 'All' || m.category === activeCategory;

    // §5 — Filtres avancés
    const matchRegion = filterRegion === 'Toutes' || m.region === filterRegion;
    const matchProcedure = filterProcedure === 'Toutes' || m.procedure === filterProcedure;
    const matchUrgence = filterUrgence === 'Toutes' || m.urgence === filterUrgence;

    return matchSearch && matchCat && matchRegion && matchProcedure && matchUrgence;
  });

  const getCategoryCount = (cat) =>
    cat === 'All'
      ? marches.filter(m => m.category !== 'Recrutement').length
      : marches.filter(m => m.category === cat).length;

  // Analytics : recherche (debounce ~600ms, uniquement si la requête est non vide)
  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      track('search', { query: q, resultsCount: filteredMarches.length, context: 'marches' });
      if (filteredMarches.length === 0) {
        track('search_no_result', { query: q, context: 'marches' });
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Analytics : changement de filtre catégorie (on ignore la valeur initiale 'All')
  useEffect(() => {
    if (activeCategory === 'All') return;
    track('filter', { key: 'category', value: activeCategory, context: 'marches' });
  }, [activeCategory]);

  // ──────────────────────────────────────────────────────────────────────────
  // Rendu
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <main className="container section animate-fadeIn">
      {/* En-tête */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }} className="animate-fadeInUp">
        <span className="badge badge-green" style={{ marginBottom: '10px' }}>Plateforme Souveraine 🇧🇫</span>
        <h1 className="heading-lg">Burkina Faso — Marchés Publics</h1>
        <p className="text-secondary text-sm">
          Appels d'offres de l'administration burkinabè, mis à jour automatiquement.
        </p>
      </div>

      {/* Bannière de bienvenue (visible pour les non-abonnés) */}
      {!authLoading && !isSubscribed && (
        <WelcomeBanner marcheCount={marches.filter(m => m.category !== 'Recrutement').length} />
      )}

      {/* Barre de recherche */}
      <div className="card" style={{ marginBottom: '30px', background: 'var(--color-bg-2)', padding: '20px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">🔍 Filtrer par mot-clé ou secteur</label>
          <input
            type="text"
            placeholder="Ex: audit, matériel informatique, forage, construction..."
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Onglets catégories */}
      <div style={{
        display: 'flex', gap: '10px', overflowX: 'auto',
        paddingBottom: '16px', marginBottom: '40px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {categoriesList.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="btn btn-sm"
            style={{
              background: activeCategory === cat.id ? 'var(--grad-primary)' : 'var(--primary-muted)',
              color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)',
              border: activeCategory === cat.id ? 'none' : '1px solid var(--color-border)',
              boxShadow: activeCategory === cat.id ? 'var(--shadow-primary)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
              borderRadius: '50px', whiteSpace: 'nowrap',
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span style={{
              background: activeCategory === cat.id ? 'rgba(255,255,255,0.25)' : 'var(--success-muted)',
              color: activeCategory === cat.id ? '#fff' : 'var(--primary-dark)',
              padding: '2px 8px', borderRadius: '50px',
              fontSize: '0.75rem', fontWeight: '700',
            }}>
              {getCategoryCount(cat.id)}
            </span>
          </button>
        ))}
      </div>

      {/* §5 — Filtres avancés (région / procédure / urgence) */}
      {!loading && !authLoading && !loadError && visibleMarches.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '12px',
          alignItems: 'flex-end', marginBottom: '32px',
        }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 180px', minWidth: '160px' }}>
            <label className="form-label">📍 Région</label>
            <select
              className="form-select"
              value={filterRegion}
              onChange={e => { setFilterRegion(e.target.value); track('filter', { key: 'region', value: e.target.value, context: 'marches' }); }}
            >
              <option value="Toutes">Toutes les régions</option>
              {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, flex: '1 1 180px', minWidth: '160px' }}>
            <label className="form-label">📑 Procédure</label>
            <select
              className="form-select"
              value={filterProcedure}
              onChange={e => { setFilterProcedure(e.target.value); track('filter', { key: 'procedure', value: e.target.value, context: 'marches' }); }}
            >
              <option value="Toutes">Toutes les procédures</option>
              {procedureOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, flex: '1 1 180px', minWidth: '160px' }}>
            <label className="form-label">⏱️ Urgence</label>
            <select
              className="form-select"
              value={filterUrgence}
              onChange={e => { setFilterUrgence(e.target.value); track('filter', { key: 'urgence', value: e.target.value, context: 'marches' }); }}
            >
              <option value="Toutes">Toutes</option>
              <option value="Urgent">Urgent</option>
              <option value="Bientôt">Bientôt</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {(filterRegion !== 'Toutes' || filterProcedure !== 'Toutes' || filterUrgence !== 'Toutes') && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { setFilterRegion('Toutes'); setFilterProcedure('Toutes'); setFilterUrgence('Toutes'); }}
              style={{ flex: '0 0 auto' }}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Grille des marchés */}
      {loading || authLoading ? (
        <div className="text-center" style={{ padding: '80px 0' }}>
          <span className="loader" style={{ width: '40px', height: '40px' }}></span>
          <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement des opportunités...</p>
        </div>
      ) : loadError ? (
        <div className="card text-center" style={{ padding: '80px 40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h3 className="heading-md">Erreur de chargement</h3>
          <p className="text-secondary text-sm" style={{ marginTop: '12px', marginBottom: '20px' }}>
            Impossible de récupérer les marchés. Vérifiez votre connexion.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm">Réessayer</button>
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
          {filteredMarches.map((m) => {
            const isLocked = !isSubscribed;

            return (
              <div
                key={m.id}
                className="card flex flex-col justify-between"
                style={{
                  height: '100%',
                  position: 'relative',
                  border: isLocked ? '1px solid rgba(217,119,6,0.28)' : '1px solid var(--color-border)',
                }}
              >
                {isLocked && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'var(--grad-accent)',
                    color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                    padding: '3px 10px', borderRadius: '50px', letterSpacing: '0.05em',
                    zIndex: 2,
                  }}>
                    PREMIUM
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                    <span className="badge badge-green">{m.category || 'Général'}</span>
                    <span className="text-muted text-xs">
                      {m.publishedAt ? new Date(m.publishedAt).toLocaleDateString('fr-FR') : 'Récent'}
                    </span>
                  </div>

                  {/* Titre : toujours en clair (teaser gratuit, cohérent avec la bannière) */}
                  <h3 className="heading-md text-primary" style={{ marginBottom: '12px', fontSize: '1.1rem', lineHeight: 1.5, paddingRight: isLocked ? '70px' : 0 }}>
                    {m.title}
                  </h3>

                  {/* Description : réservée aux abonnés (aucun contenu réel envoyé si verrouillé) */}
                  {!isLocked ? (
                    <p className="text-secondary text-sm" style={{ marginBottom: '20px', lineHeight: 1.7 }}>
                      {(m.description || '').substring(0, 160)}
                      {(m.description || '').length > 160 ? '…' : ''}
                    </p>
                  ) : (
                    <p className="text-muted text-sm" style={{ marginBottom: '20px', lineHeight: 1.7, fontStyle: 'italic' }}>
                      🔒 Description complète, source officielle et lien de dépôt réservés aux abonnés Premium.
                    </p>
                  )}
                </div>

                <div className="divider" style={{ margin: '16px 0' }}></div>

                <div className="flex justify-between items-center" style={{ gap: '12px' }}>
                  <div>
                    <p className="text-xs text-muted">ÉMETTEUR</p>
                    <p className="text-xs text-secondary" style={{ fontWeight: 600 }}>
                      {!isLocked ? (m.source || 'Source officielle') : '🔒 Visible avec Premium'}
                    </p>
                  </div>

                  {isSubscribed ? (
                    <Link href={`/marches/details?id=${m.id}`} className="btn btn-primary btn-sm">
                      Voir les détails 📄
                    </Link>
                  ) : (
                    <PremiumLock label="Débloquer" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bannière de conversion en bas de page pour les non-abonnés */}
      {!authLoading && !isSubscribed && filteredMarches.length > 0 && (
        <div style={{
          marginTop: '60px',
          background: 'linear-gradient(135deg, rgba(217,119,6,0.09) 0%, rgba(217,119,6,0.03) 100%)',
          border: '1px solid rgba(217,119,6,0.26)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚀</div>
          <h3 className="heading-md" style={{ marginBottom: '12px' }}>
            Ne manquez plus aucune opportunité
          </h3>
          <p className="text-secondary text-sm" style={{ maxWidth: '480px', margin: '0 auto 24px' }}>
            {filteredMarches.length > 0
              ? `${filteredMarches.length} marché${filteredMarches.length > 1 ? 's' : ''} en ligne. Débloquez les détails complets, la source officielle et le lien de dépôt de chacun.`
              : 'Accédez aux détails complets, sources officielles et liens de dépôt de toutes les offres.'}
          </p>
          <Link href="/tarifs" className="btn btn-accent">
            Découvrir les offres Premium →
          </Link>
        </div>
      )}
    </main>
  );
}
