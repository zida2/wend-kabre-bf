import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────
// Données : Étapes de procédure réelles pour chaque type de marché
// ─────────────────────────────────────────────────────────────────────
const PROCEDURES = [
  {
    cat: 'Appel d\'offres ouvert',
    icon: '📋',
    color: '#34d372',
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
    color: '#f5c842',
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
    color: '#60a5fa',
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
    color: '#a78bfa',
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
    solution: 'Nos alertes WhatsApp et SMS vous notifient dès la publication — jamais trop tard.',
  },
];

const STATS = [
  { value: '2 800+', label: 'Appels d\'offres publiés / an', color: '#34d372' },
  { value: '60%', label: 'Des dossiers rejetés pour non-conformité', color: '#ef4444' },
  { value: '21 jours', label: 'Délai moyen de soumission', color: '#f5c842' },
  { value: '0 FCFA', label: 'Pour voir les marchés en cours', color: '#34d372' },
];

const STEPS_PLATFORM = [
  { num: '01', title: 'Je m\'inscris', desc: 'Créez votre compte PME en 2 minutes. Indiquez votre secteur d\'activité.', icon: '✍️' },
  { num: '02', title: 'Je reçois les alertes', desc: 'Dès qu\'un marché dans votre domaine est publié, vous êtes notifié sur WhatsApp et SMS.', icon: '📱' },
  { num: '03', title: 'Je consulte la procédure', desc: 'La fiche complète : procédure, pièces requises, délai, contact de l\'émetteur.', icon: '📋' },
  { num: '04', title: 'Je prépare mon dossier avec l\'IA', desc: 'L\'assistant IA vérifie la conformité de vos documents avant que vous déposiez.', icon: '🤖' },
  { num: '05', title: 'Je dépose et je gagne', desc: 'Vous vous présentez au guichet avec un dossier complet et conforme. Votre concurrence, non.', icon: '🏆' },
];

export default function Home() {
  return (
    <main className="animate-fadeIn">

      {/* ════════════════════════════════════════════
          HERO — Accroche directe et percutante
      ════════════════════════════════════════════ */}
      <section style={{
        background: 'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(52,211,114,0.18) 0%, transparent 65%)',
        minHeight: '90vh', display: 'flex', alignItems: 'center',
        padding: '100px 0 60px',
      }}>
        <div className="container text-center">
          <div className="badge badge-green animate-pulse-green" style={{ marginBottom: '28px', fontSize: '0.85rem' }}>
            <span className="dot dot-green"></span> Plateforme Officielle des Marchés PME — Burkina Faso 🇧🇫
          </div>

          <h1 className="heading-xl animate-fadeInUp delay-1" style={{ marginBottom: '28px', maxWidth: '900px', margin: '0 auto 28px' }}>
            Arrêtez de chercher.<br />
            <span className="text-green">Tout ce qu'il vous faut est ici.</span>
          </h1>

          <p className="text-secondary animate-fadeInUp delay-2" style={{
            maxWidth: '700px', margin: '0 auto 20px',
            fontSize: '1.2rem', lineHeight: 1.8,
          }}>
            Les marchés publics burkinabè ne s'obtiennent pas en cherchant sur Google.
            Ils ont leurs propres procédures, leurs propres délais et leurs propres guichets.
            <strong style={{ color: 'var(--text-primary)' }}> Wend-Kabré vous guide de A à Z.</strong>
          </p>

          <p className="text-secondary animate-fadeInUp delay-2" style={{
            maxWidth: '600px', margin: '0 auto 44px',
            fontSize: '1rem', lineHeight: 1.7,
            color: 'var(--text-muted)',
          }}>
            Alertes en temps réel · Procédures détaillées · Pièces requises · Assistant IA de conformité
          </p>

          <div className="flex justify-center gap-4 animate-fadeInUp delay-3" style={{ flexWrap: 'wrap', marginBottom: '80px' }}>
            <Link href="/inscription" className="btn btn-primary btn-lg btn-shimmer">
              Commencer gratuitement 🚀
            </Link>
            <Link href="/marches" className="btn btn-outline btn-lg hover-lift">
              Voir les marchés en cours →
            </Link>
          </div>

          {/* Statistiques choc */}
          <div className="grid grid-4 gap-6 animate-fadeInUp delay-4">
            {STATS.map((s, i) => (
              <div key={i} className={`card-glass hover-lift animate-popIn delay-${(i % 5) + 1}`} style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: s.color, marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
                  {s.value}
                </p>
                <p className="text-muted text-xs" style={{ lineHeight: 1.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION RÉALITÉ — Pourquoi chercher seul ne marche pas
      ════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--color-bg-2)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '60px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '16px' }}>⚠️ La réalité du terrain</span>
            <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
              Pourquoi chercher seul vous coûte des marchés
            </h2>
            <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.8 }}>
              Ces erreurs coûtent des millions à des centaines de PME burkinabè chaque année.
              Voici ce qui se passe en réalité — et comment nous y remédions.
            </p>
          </div>

          <div className="grid grid-2 gap-6">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className={`card hover-lift animate-fadeInUp delay-${(i % 5) + 1}`} style={{ borderLeft: '3px solid rgba(239,68,68,0.4)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="icon-bounce" style={{ fontSize: '2rem', flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {p.title}
                    </h3>
                    <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(52,211,114,0.06)',
                  border: '1px solid rgba(52,211,114,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <span style={{ color: 'var(--green-primary)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <p className="text-sm" style={{ color: 'var(--green-primary)', lineHeight: 1.6 }}>
                    <strong>Notre réponse :</strong> {p.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION PROCÉDURES — Éducation sur le vrai processus
      ════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '60px' }}>
            <span className="badge badge-green" style={{ marginBottom: '16px' }}>📖 Guide Procédures</span>
            <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
              Chaque marché a sa propre procédure.<br />
              <span className="text-green">Nous vous guidons pour chacune.</span>
            </h2>
            <p className="text-secondary" style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.8 }}>
              Contrairement à ce que beaucoup pensent, les marchés publics au Burkina Faso
              <strong style={{ color: 'var(--text-primary)' }}> ne se font pas entièrement en ligne.</strong> Chaque type de marché
              exige une procédure distincte, souvent avec un dépôt physique obligatoire.
              Ignorer cela vous disqualifie automatiquement.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {PROCEDURES.map((proc, i) => (
              <div key={i} className={`card hover-lift animate-slideInRight delay-${(i % 5) + 1}`} style={{ borderLeft: `3px solid ${proc.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <span className="icon-bounce" style={{ fontSize: '1.75rem' }}>{proc.icon}</span>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem', fontWeight: 700, color: proc.color }}>
                    {proc.cat}
                  </h3>
                </div>

                <div className="grid grid-2 gap-6" style={{ alignItems: 'start' }}>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '8px' }}>
                    {proc.steps.map((step, j) => (
                      <li key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{
                          minWidth: '24px', height: '24px', borderRadius: '50%',
                          background: `${proc.color}22`, color: proc.color,
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

                  <div>
                    <div style={{
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                    }}>
                      <p style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, marginBottom: '6px' }}>
                        ⚠️ À SAVOIR IMPÉRATIVEMENT
                      </p>
                      <p className="text-sm text-secondary" style={{ lineHeight: 1.7 }}>
                        {proc.warning}
                      </p>
                    </div>

                    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(52,211,114,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,211,114,0.12)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--green-primary)', fontWeight: 700, marginBottom: '6px' }}>
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
          SECTION ÉTAPES — Comment ça marche concrètement
      ════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--color-bg-2)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '60px' }}>
            <span className="badge badge-green" style={{ marginBottom: '16px' }}>🗺️ Votre parcours</span>
            <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
              De l'alerte à la signature du contrat
            </h2>
            <p className="text-secondary" style={{ maxWidth: '550px', margin: '0 auto' }}>
              Voici exactement ce qui se passe quand vous êtes abonné à Wend-Kabré.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {STEPS_PLATFORM.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0', position: 'relative' }}>
                {/* Ligne verticale de connexion */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '24px', flexShrink: 0 }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--grad-green))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, color: '#000',
                    fontFamily: 'Outfit, sans-serif', flexShrink: 0, zIndex: 1,
                    boxShadow: '0 0 20px rgba(52,211,114,0.3)',
                  }}>
                    {step.num}
                  </div>
                  {i < STEPS_PLATFORM.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: 'linear-gradient(to bottom, rgba(52,211,114,0.4), rgba(52,211,114,0.05))', minHeight: '40px' }} />
                  )}
                </div>

                <div style={{ paddingBottom: i < STEPS_PLATFORM.length - 1 ? '32px' : '0', flex: 1 }}>
                  <div className={`card-glass hover-lift animate-slideInLeft delay-${(i % 5) + 1}`} style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <span className="icon-bounce" style={{ fontSize: '1.75rem', flexShrink: 0 }}>{step.icon}</span>
                    <div>
                      <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {step.title}
                      </h4>
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
          SECTION URGENCE — Discours de conviction finale
      ════════════════════════════════════════════ */}
      <section className="section" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(245,200,66,0.08) 0%, transparent 70%)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div className="container">
          <div className="card responsive-card-padding" style={{
            border: '1px solid rgba(245,200,66,0.3)',
            background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(52,211,114,0.03) 100%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🇧🇫</div>
            <h2 className="heading-lg" style={{ marginBottom: '20px', maxWidth: '700px', margin: '0 auto 20px' }}>
              Pendant que vous cherchez,<br />
              <span className="text-gold">votre concurrent dépose son dossier.</span>
            </h2>
            <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto 16px', fontSize: '1.05rem', lineHeight: 1.9 }}>
              Les marchés publics burkinabè sont attribués aux entreprises les mieux préparées —
              pas aux plus grandes. Une PME avec un dossier complet et déposé à temps bat
              systématiquement une grande structure qui arrive en retard ou mal équipée.
            </p>
            <p className="text-secondary" style={{ maxWidth: '580px', margin: '0 auto 40px', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-muted)' }}>
              Tout ce qu'il faut est sur cette plateforme. La procédure. Les pièces. Les délais.
              Les alertes. L'assistant IA. Il ne manque plus que votre inscription.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/inscription" className="btn btn-gold btn-lg btn-shimmer">
                Rejoindre Wend-Kabré maintenant →
              </Link>
              <Link href="/tarifs" className="btn btn-outline btn-lg">
                Voir les plans d'abonnement
              </Link>
            </div>

            {/* Micro-preuves sociales */}
            <div style={{
              marginTop: '48px',
              display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap',
            }}>
              {[
                { icon: '⚡', text: 'Alerte en moins de 5 min après publication' },
                { icon: '✅', text: 'Dossier validé avant dépôt physique' },
                { icon: '📍', text: 'Adresse du guichet de dépôt fournie' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
