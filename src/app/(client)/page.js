import Link from 'next/link';
import LiveFeed from '@/components/client/LiveFeed';

// ─────────────────────────────────────────────────────────────────────
// Données : Étapes de procédure réelles pour chaque type de marché
// ─────────────────────────────────────────────────────────────────────
const PROCEDURES = [
  {
    cat: 'Appel d\'offres ouvert',
    icon: '📋',
    color: '#059669', // émeraude
    steps: [
      'Obtenir le dossier d\'appel d\'offres (DAO) auprès de la DMP',
      'Constituer les pièces administratives (ASF, CNSS, RCCM à jour)',
      'Préparer l\'offre technique + l\'offre financière séparément',
      'Déposer physiquement avant la date limite à la DMP ou au ministère',
      'Assister à l\'ouverture publique des plis',
    ],
    warning: 'Le dépôt se fait toujours physiquement au guichet — aucune exception.',
  },
  {
    cat: 'Demande de cotation',
    icon: '💬',
    color: '#D97706', // ambre
    steps: [
      'Être contacté ou repérer l\'avis dans le Bulletin des Marchés Publics',
      'Répondre avec un devis chiffré sous 5 à 15 jours',
      'Fournir les attestations fiscales et de régularité sociale',
      'Négociation possible avec le maître d\'ouvrage',
      'Signature du bon de commande ou du contrat simplifié',
    ],
    warning: 'Délai très court. Être alerté à temps est souvent décisif.',
  },
  {
    cat: 'Consultation restreinte',
    icon: '🔒',
    color: 'var(--teal)', // teal
    steps: [
      'Être inscrit sur la liste restreinte du maître d\'ouvrage',
      'Répondre à l\'invitation sur la base d\'une lettre de consultation',
      'Soumettre une offre complète (technique + financière)',
      'Négociation directe possible avant attribution',
      'Signature du contrat simplifié ou marché de gré à gré',
    ],
    warning: 'Accessible uniquement si vous êtes connu du service ou inscrit au registre.',
  },
  {
    cat: 'Manifestation d\'intérêt',
    icon: '✋',
    color: '#065F46', // vert forêt
    steps: [
      'Rédiger une lettre de manifestation d\'intérêt + CV de l\'entreprise',
      'Joindre les références de projets similaires réalisés',
      'Fournir les attestations de capacité technique et financière',
      'Attendre la liste restreinte publiée par le maître d\'ouvrage',
      'Être invité au stade suivant (RFP ou négociation)',
    ],
    warning: 'Étape préliminaire — elle donne accès aux étapes payantes suivantes.',
  },
];

const PAIN_POINTS = [
  {
    icon: '⏳',
    title: 'Vous cherchez sur le web pendant des heures',
    desc: 'Les appels d\'offres burkinabè sont publiés dans le Bulletin des Marchés Publics papier, sur des sites épars, dans des journaux locaux. Aucun portail ne centralise tout — jusqu\'à maintenant.',
    solution: 'Wend-Kabré agrège tout en un seul endroit. Vous ne manquez plus rien.',
  },
  {
    icon: '📄',
    title: 'Vous ignorez quelle procédure s\'applique',
    desc: 'Appel d\'offres ouvert, demande de cotation, consultation restreinte, manifestation d\'intérêt — chaque marché a sa propre procédure, ses propres délais, ses propres exigences légales.',
    solution: 'Chaque offre sur notre plateforme vient avec la procédure détaillée, étape par étape.',
  },
  {
    icon: '📑',
    title: 'Vous oubliez une pièce, votre dossier est rejeté',
    desc: 'Un quitus fiscal expiré d\'un seul jour, un RCCM non certifié, une caution mal libellée — votre dossier est éliminé sans recours. Cela arrive à 60% des nouveaux soumissionnaires.',
    solution: 'Notre assistant IA Wend-Kabré scanne vos exigences et détecte les pièces manquantes avant le dépôt.',
  },
  {
    icon: '🚨',
    title: 'Vous apprenez l\'offre après la date limite',
    desc: 'Le délai moyen de soumission est de 21 à 45 jours. Mais si vous l\'apprenez 3 jours avant la clôture, c\'est trop tard pour constituer un dossier complet et conforme.',
    solution: 'Nos alertes personnalisées vous informent immédiatement dès la publication — jamais trop tard.',
  },
];

const STATS = [
  { value: '2 800+', label: 'Appels d\'offres publiés / an', color: 'var(--primary)' },
  { value: '60%', label: 'Des dossiers rejetés pour non-conformité', color: 'var(--danger)' },
  { value: '21 jours', label: 'Délai moyen de soumission', color: 'var(--accent)' },
  { value: '0 FCFA', label: 'Pour voir les marchés en cours', color: 'var(--primary)' },
];

const STEPS_PLATFORM = [
  { num: '01', title: 'Je m\'inscris', desc: 'Créez votre compte PME en 2 minutes. Indiquez votre secteur d\'activité.', icon: '✍️' },
  { num: '02', title: 'Je suis notifié', desc: 'Dès qu\'un marché dans votre domaine est publié, vous recevez une alerte sur votre espace.', icon: '🔔' },
  { num: '03', title: 'Je consulte la procédure', desc: 'La fiche complète : procédure, pièces requises, délai, contact de l\'émetteur.', icon: '📋' },
  { num: '04', title: 'Je prépare mon dossier avec l\'IA', desc: 'L\'assistant IA vérifie la conformité de vos documents avant que vous déposiez.', icon: '🤖' },
  { num: '05', title: 'Je dépose et je gagne', desc: 'Vous vous présentez au guichet avec un dossier complet et conforme. Votre concurrence, non.', icon: '🏆' },
];

export default function Home() {
  return (
    <main className="animate-fadeIn">

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--grad-hero)',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(60px, 10vw, 100px) 0 clamp(48px, 8vw, 72px)',
      }}>
        <div className="container text-center">
          <div className="badge badge-green animate-pulse-green mx-auto" style={{ marginBottom: '26px', fontSize: '0.82rem' }}>
            <span className="dot dot-green"></span> Plateforme des Marchés PME — Burkina Faso 🇧🇫
          </div>

          <h1 className="heading-xl animate-fadeInUp delay-1" style={{ maxWidth: '920px', margin: '0 auto 26px' }}>
            Arrêtez de chercher.<br />
            <span className="text-gradient">Tout ce qu'il vous faut est ici.</span>
          </h1>

          <p className="lead animate-fadeInUp delay-2" style={{ maxWidth: '700px', margin: '0 auto 18px' }}>
            Les marchés publics burkinabè ne s'obtiennent pas en cherchant sur Google.
            Ils ont leurs propres procédures, leurs propres délais et leurs propres guichets.
            <strong style={{ color: 'var(--text-primary)' }}> Wend-Kabré vous guide de A à Z.</strong>
          </p>

          <p className="text-muted animate-fadeInUp delay-2" style={{ maxWidth: '600px', margin: '0 auto 40px', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Alertes en temps réel · Procédures détaillées · Pièces requises · Assistant IA de conformité
          </p>

          <div className="flex justify-center flex-wrap gap-4 animate-fadeInUp delay-3" style={{ marginBottom: '72px' }}>
            <Link href="/inscription" className="btn btn-primary btn-lg btn-shimmer">
              Commencer gratuitement 🚀
            </Link>
            <Link href="/marches" className="btn btn-outline btn-lg">
              Voir les marchés en cours →
            </Link>
          </div>

          {/* Statistiques */}
          <div className="grid grid-4 gap-6 animate-fadeInUp delay-4">
            {STATS.map((s, i) => (
              <div key={i} className={`card-glass hover-lift animate-popIn delay-${(i % 5) + 1}`} style={{ padding: '22px', textAlign: 'center' }}>
                <p className="font-display" style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800, color: s.color, marginBottom: '6px' }}>
                  {s.value}
                </p>
                <p className="text-muted text-xs" style={{ lineHeight: 1.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          LIVE FEED (FOMO)
      ════════════════════════════════════════════ */}
      <LiveFeed />

      {/* ════════════════════════════════════════════
          SECTION RÉALITÉ
      ════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--color-bg-2)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '52px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '16px' }}>⚠️ La réalité du terrain</span>
            <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
              Pourquoi chercher seul vous coûte des marchés
            </h2>
            <p className="lead mx-auto" style={{ maxWidth: '620px' }}>
              Ces erreurs coûtent des millions à des centaines de PME burkinabè chaque année.
              Voici ce qui se passe en réalité — et comment nous y remédions.
            </p>
          </div>

          <div className="grid grid-2 gap-6">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className={`card hover-lift animate-fadeInUp delay-${(i % 5) + 1}`} style={{ borderLeft: '3px solid var(--danger)' }}>
                <div className="flex gap-4" style={{ marginBottom: '16px' }}>
                  <div className="icon-bounce" style={{ fontSize: '1.9rem', flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <h3 className="heading-sm" style={{ marginBottom: '8px' }}>{p.title}</h3>
                    <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3" style={{
                  background: 'var(--success-muted)',
                  border: '1px solid rgba(5,150,105,0.18)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <p className="text-sm" style={{ color: 'var(--primary-dark)', lineHeight: 1.6 }}>
                    <strong>Notre réponse :</strong> {p.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION PROCÉDURES
      ════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '52px' }}>
            <span className="badge badge-green" style={{ marginBottom: '16px' }}>📖 Guide Procédures</span>
            <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
              Chaque marché a sa propre procédure.<br />
              <span className="text-gradient">Nous vous guidons pour chacune.</span>
            </h2>
            <p className="lead mx-auto" style={{ maxWidth: '660px' }}>
              Contrairement à ce que beaucoup pensent, les marchés publics au Burkina Faso
              <strong style={{ color: 'var(--text-primary)' }}> ne se font pas entièrement en ligne.</strong> Chaque type de marché
              exige une procédure distincte, souvent avec un dépôt physique obligatoire.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {PROCEDURES.map((proc, i) => (
              <div key={i} className={`card hover-lift animate-fadeInUp delay-${(i % 5) + 1}`} style={{ borderLeft: `3px solid ${proc.color}` }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                  <span className="icon-bounce" style={{ fontSize: '1.7rem' }}>{proc.icon}</span>
                  <h3 className="heading-sm" style={{ color: proc.color }}>{proc.cat}</h3>
                </div>

                <div className="grid grid-2 gap-6" style={{ alignItems: 'start' }}>
                  <ol className="flex flex-col gap-3">
                    {proc.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span style={{
                          minWidth: '24px', height: '24px', borderRadius: '50%',
                          background: `${proc.color}1a`, color: proc.color,
                          fontSize: '0.75rem', fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: '1px',
                        }}>
                          {j + 1}
                        </span>
                        <span className="text-secondary text-sm" style={{ lineHeight: 1.6 }}>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="flex flex-col gap-4">
                    <div style={{
                      background: 'var(--danger-muted)',
                      border: '1px solid rgba(220,38,38,0.18)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                    }}>
                      <p className="text-danger" style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                        ⚠️ À SAVOIR IMPÉRATIVEMENT
                      </p>
                      <p className="text-sm text-secondary" style={{ lineHeight: 1.7 }}>{proc.warning}</p>
                    </div>

                    <div style={{
                      padding: '16px',
                      background: 'var(--success-muted)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(5,150,105,0.15)',
                    }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--primary-dark)', fontWeight: 700, marginBottom: '6px' }}>
                        💡 CE QUE WEND-KABRÉ VOUS PRÉPARE
                      </p>
                      <p className="text-muted text-xs" style={{ lineHeight: 1.7 }}>
                        Checklist des pièces · Contacts des guichets · Délais réels · Modèles de documents prêts à l'emploi
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION ÉTAPES
      ════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--color-bg-2)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container container-md">
          <div className="text-center" style={{ marginBottom: '52px' }}>
            <span className="badge badge-green" style={{ marginBottom: '16px' }}>🗺️ Votre parcours</span>
            <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
              De l'alerte à la signature du contrat
            </h2>
            <p className="lead mx-auto" style={{ maxWidth: '560px' }}>
              Voici exactement ce qui se passe quand vous êtes abonné à Wend-Kabré.
            </p>
          </div>

          <div className="flex flex-col">
            {STEPS_PLATFORM.map((step, i) => (
              <div key={i} className="flex" style={{ position: 'relative' }}>
                {/* Colonne pastille + ligne */}
                <div className="flex flex-col items-center" style={{ marginRight: '22px', flexShrink: 0 }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    background: 'var(--grad-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 800, color: '#fff',
                    fontFamily: 'var(--font-display)', flexShrink: 0, zIndex: 1,
                    boxShadow: 'var(--shadow-primary)',
                  }}>
                    {step.num}
                  </div>
                  {i < STEPS_PLATFORM.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: 'linear-gradient(to bottom, var(--primary-lighter), transparent)', minHeight: '36px' }} />
                  )}
                </div>

                <div style={{ paddingBottom: i < STEPS_PLATFORM.length - 1 ? '28px' : '0', flex: 1, minWidth: 0 }}>
                  <div className={`card-glass hover-lift animate-slideInLeft delay-${(i % 5) + 1} flex items-start gap-4`} style={{ padding: '18px 22px' }}>
                    <span className="icon-bounce" style={{ fontSize: '1.7rem', flexShrink: 0 }}>{step.icon}</span>
                    <div>
                      <h4 className="heading-sm" style={{ marginBottom: '6px' }}>{step.title}</h4>
                      <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>{step.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION URGENCE / CTA FINAL
      ════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="card responsive-card-padding text-center" style={{
            border: '1px solid var(--color-border-hover)',
            background: 'linear-gradient(135deg, rgba(5,150,105,0.06) 0%, rgba(6,78,59,0.04) 100%)',
          }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '18px' }}>🇧🇫</div>
            <h2 className="heading-lg mx-auto" style={{ marginBottom: '20px', maxWidth: '720px' }}>
              Pendant que vous cherchez,<br />
              <span className="text-accent">votre concurrent dépose son dossier.</span>
            </h2>
            <p className="lead mx-auto" style={{ maxWidth: '620px', marginBottom: '14px' }}>
              Les marchés publics burkinabè sont attribués aux entreprises les mieux préparées —
              pas aux plus grandes. Une PME avec un dossier complet et déposé à temps bat
              systématiquement une grande structure mal équipée.
            </p>
            <p className="text-muted mx-auto" style={{ maxWidth: '580px', marginBottom: '36px', fontSize: '0.95rem', lineHeight: 1.8 }}>
              Tout ce qu'il faut est sur cette plateforme. La procédure. Les pièces. Les délais.
              Les alertes. L'assistant IA. Il ne manque plus que votre inscription.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/inscription" className="btn btn-primary btn-lg btn-shimmer">
                Rejoindre Wend-Kabré maintenant →
              </Link>
              <Link href="/tarifs" className="btn btn-outline btn-lg">
                Voir les plans d'abonnement
              </Link>
            </div>

            {/* Micro-preuves */}
            <div className="flex flex-wrap justify-center gap-8" style={{ marginTop: '42px' }}>
              {[
                { icon: '⚡', text: 'Alerte en moins de 5 min après publication' },
                { icon: '✅', text: 'Dossier validé avant dépôt physique' },
                { icon: '📍', text: 'Adresse du guichet de dépôt fournie' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span className="text-secondary text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
