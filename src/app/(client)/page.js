import Link from 'next/link';

/**
 * Page d'accueil publique — Wend-Kabré
 * Refonte v2.0 : Transparence, crédibilité, clarté
 * 
 * Objectif : Un visiteur doit comprendre en 10 secondes :
 * 1. Ce qu'est Wend-Kabré
 * 2. À qui ça s'adresse
 * 3. Quel problème ça résout
 * 4. Comment ça fonctionne
 * 5. Pourquoi c'est fiable
 */

export default function Home() {
  return (
    <main className="animate-fadeIn">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Section 1
          Objectif : Clarté immédiate sur ce qu'est la plateforme
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(6,78,59,0.03) 0%, rgba(5,150,105,0.06) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'clamp(80px, 12vw, 120px) 0 clamp(60px, 10vw, 100px)',
      }}>
        <div className="container">
          <div className="text-center" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Badge discret */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '6px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '50px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '32px'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: 'var(--primary)',
                animation: 'pulse 2s infinite'
              }} />
              Plateforme privée indépendante — Burkina Faso
            </div>

            {/* Titre principal */}
            <h1 className="heading-xl" style={{ 
              marginBottom: '28px',
              lineHeight: 1.2,
              fontWeight: 800
            }}>
              Wend-Kabré
            </h1>

            <p className="heading-lg" style={{ 
              marginBottom: '24px',
              color: 'var(--text-primary)',
              fontWeight: 600,
              lineHeight: 1.4
            }}>
              Les marchés publics du Burkina Faso,<br />
              réunis au même endroit.
            </p>

            {/* Texte secondaire */}
            <p className="lead" style={{ 
              maxWidth: '720px', 
              margin: '0 auto 16px',
              lineHeight: 1.8,
              color: 'var(--text-secondary)'
            }}>
              Consultez, recherchez et suivez les opportunités de marchés publics à partir 
              d'une plateforme conçue pour vous aider à mieux comprendre les avis de consultation 
              et à préparer vos démarches.
            </p>

            {/* Phrase de confiance */}
            <p className="text-sm text-muted" style={{ 
              maxWidth: '680px', 
              margin: '0 auto 48px',
              lineHeight: 1.7,
              fontStyle: 'italic'
            }}>
              Des informations structurées à partir de sources publiques, avec des références 
              permettant de vérifier les données.
            </p>

            {/* CTA */}
            <div className="flex justify-center flex-wrap gap-4" style={{ marginBottom: '24px' }}>
              <Link href="/marches" className="btn btn-primary btn-lg">
                Explorer les marchés
              </Link>
              <Link href="#comment-ca-marche" className="btn btn-outline btn-lg">
                Comment ça marche ?
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION PROBLÈME — Section 2
          Objectif : Expliquer les difficultés rencontrées
      ═══════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '64px', maxWidth: '800px', margin: '0 auto 64px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Les marchés publics sont difficiles à suivre.
            </h2>
            <p className="lead" style={{ color: 'var(--text-secondary)' }}>
              Trois difficultés reviennent régulièrement lors de la recherche 
              d'opportunités de marchés publics.
            </p>
          </div>

          <div className="grid grid-3 gap-6">
            {/* Problème 1 */}
            <div className="card" style={{ 
              borderTop: '3px solid var(--primary)',
              height: '100%'
            }}>
              <div style={{ 
                fontSize: '2.5rem', 
                marginBottom: '20px',
                opacity: 0.9
              }}>
                📚
              </div>
              <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                Trop d'informations
              </h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Les avis et documents sont dispersés sur différentes sources. 
                Il faut consulter plusieurs sites, bulletins et publications pour 
                obtenir une vue d'ensemble.
              </p>
            </div>

            {/* Problème 2 */}
            <div className="card" style={{ 
              borderTop: '3px solid var(--accent)',
              height: '100%'
            }}>
              <div style={{ 
                fontSize: '2.5rem', 
                marginBottom: '20px',
                opacity: 0.9
              }}>
                🔍
              </div>
              <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                Informations difficiles à exploiter
              </h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Les utilisateurs doivent parcourir de nombreux documents pour 
                identifier les éléments importants : dates, pièces requises, 
                procédures applicables.
              </p>
            </div>

            {/* Problème 3 */}
            <div className="card" style={{ 
              borderTop: '3px solid var(--danger)',
              height: '100%'
            }}>
              <div style={{ 
                fontSize: '2.5rem', 
                marginBottom: '20px',
                opacity: 0.9
              }}>
                ⏰
              </div>
              <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                Risque de manquer une opportunité
              </h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Une information importante ou une échéance peut facilement passer 
                inaperçue en l'absence d'un système de veille structuré.
              </p>
            </div>
          </div>

          {/* Transition */}
          <div className="text-center" style={{ marginTop: '64px' }}>
            <div style={{ 
              display: 'inline-block',
              padding: '16px 32px',
              background: 'var(--success-muted)',
              border: '1px solid rgba(5,150,105,0.2)',
              borderRadius: 'var(--radius-md)'
            }}>
              <p className="text-sm" style={{ 
                color: 'var(--primary-dark)', 
                fontWeight: 600,
                margin: 0
              }}>
                Wend-Kabré simplifie cette recherche.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION SOLUTION — Section 3
          Objectif : Présenter les fonctionnalités réelles
      ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ 
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '64px', maxWidth: '800px', margin: '0 auto 64px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Une plateforme pensée pour vous faire gagner du temps
            </h2>
            <p className="lead" style={{ color: 'var(--text-secondary)' }}>
              Wend-Kabré regroupe et structure les informations relatives aux marchés publics 
              du Burkina Faso pour faciliter votre recherche et votre veille.
            </p>
          </div>

          <div className="grid grid-2 gap-6">
            {/* Fonctionnalité 1 : Recherche */}
            <div className="card hover-lift" style={{ padding: '32px' }}>
              <div style={{ 
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                marginBottom: '24px'
              }}>
                🔎
              </div>
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>
                Recherche
              </h3>
              <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                Retrouvez plus facilement les marchés correspondant à votre activité 
                grâce à des filtres par secteur, région, procédure et mots-clés.
              </p>
            </div>

            {/* Fonctionnalité 2 : Informations structurées */}
            <div className="card hover-lift" style={{ padding: '32px' }}>
              <div style={{ 
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                marginBottom: '24px'
              }}>
                📋
              </div>
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>
                Informations structurées
              </h3>
              <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                Consultez les informations essentielles d'un marché dans une présentation 
                claire : dates limites, organisme émetteur, catégorie, procédure.
              </p>
            </div>

            {/* Fonctionnalité 3 : Suivi */}
            <div className="card hover-lift" style={{ padding: '32px' }}>
              <div style={{ 
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--success-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                marginBottom: '24px'
              }}>
                📅
              </div>
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>
                Suivi des échéances
              </h3>
              <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                Identifiez les dates importantes et les opportunités à surveiller 
                grâce aux indicateurs de priorité et aux délais de soumission.
              </p>
            </div>

            {/* Fonctionnalité 4 : Référentiel */}
            <div className="card hover-lift" style={{ padding: '32px' }}>
              <div style={{ 
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(100,116,139,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                marginBottom: '24px'
              }}>
                📚
              </div>
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>
                Référentiel
              </h3>
              <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                Accédez à des informations réglementaires et à des ressources utiles 
                pour mieux comprendre les procédures de marchés publics.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION COMMENT ÇA MARCHE — Section 4
          Objectif : Expliquer le parcours utilisateur simplement
      ═══════════════════════════════════════════════════════════ */}
      <section id="comment-ca-marche" className="section">
        <div className="container container-md">
          <div className="text-center" style={{ marginBottom: '64px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Comment ça marche
            </h2>
            <p className="lead" style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              En 3 étapes simples pour commencer à suivre les marchés publics.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Étape 1 */}
            <div className="flex items-start gap-6">
              <div style={{
                minWidth: '80px',
                height: '80px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-primary)'
              }}>
                <span style={{ 
                  fontSize: '2rem', 
                  fontWeight: 800, 
                  color: '#fff',
                  fontFamily: 'var(--font-display)'
                }}>
                  01
                </span>
              </div>
              <div className="card" style={{ flex: 1, padding: '32px' }}>
                <h3 className="heading-md" style={{ marginBottom: '12px' }}>
                  Recherchez
                </h3>
                <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                  Recherchez un marché par secteur, organisme, localisation ou mots-clés. 
                  Utilisez les filtres pour affiner vos résultats selon vos besoins.
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="flex items-start gap-6">
              <div style={{
                minWidth: '80px',
                height: '80px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-primary)'
              }}>
                <span style={{ 
                  fontSize: '2rem', 
                  fontWeight: 800, 
                  color: '#fff',
                  fontFamily: 'var(--font-display)'
                }}>
                  02
                </span>
              </div>
              <div className="card" style={{ flex: 1, padding: '32px' }}>
                <h3 className="heading-md" style={{ marginBottom: '12px' }}>
                  Analysez
                </h3>
                <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                  Consultez les informations essentielles et les documents disponibles 
                  pour chaque marché. Accédez aux références de l'avis d'origine.
                </p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="flex items-start gap-6">
              <div style={{
                minWidth: '80px',
                height: '80px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-primary)'
              }}>
                <span style={{ 
                  fontSize: '2rem', 
                  fontWeight: 800, 
                  color: '#fff',
                  fontFamily: 'var(--font-display)'
                }}>
                  03
                </span>
              </div>
              <div className="card" style={{ flex: 1, padding: '32px' }}>
                <h3 className="heading-md" style={{ marginBottom: '12px' }}>
                  Préparez-vous
                </h3>
                <p className="text-secondary" style={{ lineHeight: 1.7 }}>
                  Utilisez les informations disponibles pour mieux préparer votre démarche. 
                  Consultez le référentiel ARCOP pour comprendre les pièces requises.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center" style={{ marginTop: '48px' }}>
            <Link href="/marches" className="btn btn-primary btn-lg">
              Voir les marchés disponibles
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION TRANSPARENCE — Section 5 (PRIORITAIRE)
          Objectif : Établir la crédibilité et la confiance
      ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ 
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="container container-lg">
          <div className="text-center" style={{ marginBottom: '64px' }}>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: 'var(--success-muted)',
              border: '1px solid rgba(5,150,105,0.2)',
              borderRadius: '50px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              <span className="text-sm" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                Section prioritaire
              </span>
            </div>
            
            <h2 className="heading-lg" style={{ marginBottom: '24px' }}>
              Des informations présentées avec transparence
            </h2>
            
            <p className="lead" style={{ 
              maxWidth: '800px', 
              margin: '0 auto 32px',
              color: 'var(--text-secondary)',
              lineHeight: 1.8
            }}>
              Wend-Kabré est une plateforme privée indépendante destinée à faciliter 
              l'accès et la compréhension des informations relatives aux marchés publics.
            </p>

            {/* Avertissement important */}
            <div style={{ 
              maxWidth: '720px',
              margin: '0 auto',
              padding: '20px 28px',
              background: 'var(--color-surface)',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <p className="text-sm" style={{ 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                lineHeight: 1.7,
                margin: 0
              }}>
                <strong>Important :</strong> Wend-Kabré n'est pas une administration publique 
                et ne remplace pas les plateformes ou publications officielles.
              </p>
            </div>
          </div>

          {/* Nos principes */}
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3 className="heading-md text-center" style={{ marginBottom: '48px' }}>
              Nos principes
            </h3>

            <div className="grid grid-2 gap-6">
              {/* Principe 1 */}
              <div className="card" style={{ padding: '32px', height: '100%' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '20px'
                }}>
                  🔗
                </div>
                <h4 className="heading-sm" style={{ marginBottom: '12px' }}>
                  Sources identifiables
                </h4>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                  Les informations sont associées, lorsque disponible, à leur source d'origine 
                  afin de permettre leur vérification indépendante.
                </p>
              </div>

              {/* Principe 2 */}
              <div className="card" style={{ padding: '32px', height: '100%' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '20px'
                }}>
                  📖
                </div>
                <h4 className="heading-sm" style={{ marginBottom: '12px' }}>
                  Références réglementaires
                </h4>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                  Les contenus réglementaires sont présentés avec leur référence 
                  (décrets, arrêtés) afin de permettre leur vérification auprès des sources officielles.
                </p>
              </div>

              {/* Principe 3 */}
              <div className="card" style={{ padding: '32px', height: '100%' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--success-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '20px'
                }}>
                  💎
                </div>
                <h4 className="heading-sm" style={{ marginBottom: '12px' }}>
                  Transparence
                </h4>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                  Nous distinguons les informations issues des sources officielles 
                  des informations produites ou structurées par la plateforme.
                </p>
              </div>

              {/* Principe 4 */}
              <div className="card" style={{ padding: '32px', height: '100%' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(100,116,139,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '20px'
                }}>
                  🔒
                </div>
                <h4 className="heading-sm" style={{ marginBottom: '12px' }}>
                  Sécurité
                </h4>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                  Les données des utilisateurs et les opérations sensibles sont protégées 
                  par des mécanismes de sécurité adaptés (authentification, chiffrement).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION RÉGLEMENTATION — Section 6
          Objectif : Présenter le cadre réglementaire utilisé
      ═══════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container container-md">
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Comprendre le cadre des marchés publics
            </h2>
            <p className="lead" style={{ 
              color: 'var(--text-secondary)', 
              maxWidth: '680px', 
              margin: '0 auto',
              lineHeight: 1.8
            }}>
              Les règles applicables aux marchés publics évoluent. Wend-Kabré structure 
              les références réglementaires utilisées par la plateforme afin de faciliter 
              leur compréhension.
            </p>
          </div>

          {/* Référence principale */}
          <div className="card" style={{ 
            padding: '32px',
            marginBottom: '32px',
            borderLeft: '4px solid var(--primary)'
          }}>
            <div className="flex items-start gap-4">
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>📜</div>
              <div style={{ flex: 1 }}>
                <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                  Décret n°2024-1748 du 31 décembre 2024
                </h3>
                <p className="text-secondary text-sm" style={{ marginBottom: '16px', lineHeight: 1.7 }}>
                  Portant réglementation générale des marchés publics et des délégations de service public.
                </p>
                <div style={{ 
                  padding: '16px',
                  background: 'var(--color-bg-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)'
                }}>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                    <strong>Référence utilisée pour :</strong> Pièces administratives obligatoires, 
                    procédures de passation, règles d'enveloppes, délais réglementaires.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mention importante */}
          <div style={{ 
            padding: '20px 28px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚖️</span>
              <div>
                <p className="text-sm" style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  Avertissement important
                </p>
                <p className="text-xs text-secondary" style={{ lineHeight: 1.7 }}>
                  Les informations fournies sont destinées à faciliter la compréhension 
                  et ne constituent pas un avis juridique. En cas de doute, consultez 
                  les textes officiels ou un conseil juridique qualifié.
                </p>
              </div>
            </div>
          </div>

          {/* Lien vers guide */}
          <div className="text-center" style={{ marginTop: '40px' }}>
            <Link href="/guide-soumission" className="btn btn-outline">
              Consulter le guide de soumission
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION POUR QUI — Section 7
          Objectif : Identifier clairement les utilisateurs cibles
      ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ 
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '64px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Wend-Kabré s'adresse à
            </h2>
            <p className="lead" style={{ 
              color: 'var(--text-secondary)',
              maxWidth: '660px',
              margin: '0 auto'
            }}>
              La plateforme est conçue pour faciliter la veille et la recherche 
              d'opportunités de marchés publics.
            </p>
          </div>

          <div className="grid grid-3 gap-6">
            {/* Cible 1 */}
            <div className="card text-center" style={{ padding: '40px 28px' }}>
              <div style={{ 
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--primary-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 24px'
              }}>
                🏢
              </div>
              <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                Entreprises
              </h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Identifiez des opportunités correspondant à votre activité 
                et suivez les marchés pertinents pour votre secteur.
              </p>
            </div>

            {/* Cible 2 */}
            <div className="card text-center" style={{ padding: '40px 28px' }}>
              <div style={{ 
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 24px'
              }}>
                👤
              </div>
              <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                Entrepreneurs et PME
              </h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Suivez plus facilement les consultations qui peuvent vous concerner 
                sans avoir à consulter plusieurs sources.
              </p>
            </div>

            {/* Cible 3 */}
            <div className="card text-center" style={{ padding: '40px 28px' }}>
              <div style={{ 
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--success-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 24px'
              }}>
                📊
              </div>
              <h3 className="heading-sm" style={{ marginBottom: '12px' }}>
                Professionnels
              </h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Centralisez votre veille et gagnez du temps dans vos recherches 
                d'informations sur les marchés publics.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION ABONNEMENT — Section 8
          Objectif : Présenter la valeur avant le prix
      ═══════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container container-md">
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Passez à un suivi plus avancé
            </h2>
            <p className="lead" style={{ 
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.8
            }}>
              Des outils supplémentaires pour organiser votre veille et exploiter 
              plus efficacement les informations disponibles.
            </p>
          </div>

          {/* Avantages Premium */}
          <div className="card" style={{ padding: '40px', marginBottom: '32px' }}>
            <h3 className="heading-md text-center" style={{ marginBottom: '32px' }}>
              Fonctionnalités avancées
            </h3>
            
            <div className="grid grid-2 gap-6">
              <div className="flex items-start gap-3">
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>✓</span>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Alertes personnalisées
                  </p>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                    Recevez des notifications pour les marchés correspondant à vos critères
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>✓</span>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Suivi de dossiers
                  </p>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                    Organisez vos candidatures et suivez leur avancement
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>✓</span>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Analyse IA des marchés
                  </p>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                    Extraction automatique des informations clés de chaque marché
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>✓</span>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Studio de candidature
                  </p>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                    Génération assistée de documents de soumission
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mention importante */}
          <div style={{ 
            padding: '20px 28px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '32px'
          }}>
            <p className="text-xs text-center text-muted" style={{ lineHeight: 1.7, margin: 0 }}>
              <strong>Important :</strong> Les outils fournis sont des aides à la préparation. 
              La décision de candidater, la constitution du dossier final et le dépôt 
              restent à la charge de l'utilisateur. Wend-Kabré ne garantit pas l'obtention d'un marché.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/tarifs" className="btn btn-primary btn-lg">
              Découvrir les offres
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION FAQ — Section 9
          Objectif : Répondre aux questions essentielles
      ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ 
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="container container-md">
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h2 className="heading-lg" style={{ marginBottom: '20px' }}>
              Questions fréquentes
            </h2>
            <p className="lead" style={{ color: 'var(--text-secondary)' }}>
              Les réponses aux questions les plus courantes sur Wend-Kabré.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Question 1 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                Wend-Kabré est-il un service public ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Non. Wend-Kabré est une plateforme privée indépendante destinée à faciliter 
                l'accès et la compréhension des informations relatives aux marchés publics. 
                Elle n'est pas affiliée à une administration publique.
              </p>
            </details>

            {/* Question 2 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                D'où viennent les informations sur les marchés ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Les informations sont collectées et structurées à partir de sources publiques 
                identifiables (bulletins officiels, sites d'organismes publics, publications d'avis). 
                Lorsque la source est disponible, elle est indiquée pour permettre sa consultation.
              </p>
            </details>

            {/* Question 3 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                Puis-je vérifier les informations affichées ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Oui. Lorsque la source d'un marché est disponible, elle est indiquée sur la fiche 
                du marché afin de permettre sa consultation et sa vérification indépendante. 
                Nous recommandons de toujours consulter l'avis officiel avant toute démarche.
              </p>
            </details>

            {/* Question 4 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                Wend-Kabré garantit-il l'obtention d'un marché ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Non. La plateforme fournit des outils d'information et de veille pour faciliter 
                la recherche et la préparation. La décision de candidater, la constitution du dossier 
                et sa soumission restent à la charge de l'utilisateur. L'attribution d'un marché 
                dépend des critères de l'organisme émetteur.
              </p>
            </details>

            {/* Question 5 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                Les informations réglementaires remplacent-elles un conseil juridique ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Non. Les informations réglementaires présentées sur la plateforme servent à faciliter 
                la compréhension du cadre applicable. Elles ne constituent pas un avis juridique. 
                En cas de doute, consultez les textes officiels ou un conseil juridique qualifié.
              </p>
            </details>

            {/* Question 6 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                Pourquoi créer un compte ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Le compte permet d'accéder aux fonctionnalités personnalisées disponibles sur la plateforme : 
                alertes sur mesure, suivi de dossiers, sauvegarde de recherches, accès au studio de candidature 
                et autres outils d'aide à la préparation.
              </p>
            </details>

            {/* Question 7 */}
            <details className="card" style={{ padding: '24px', cursor: 'pointer' }}>
              <summary className="heading-sm" style={{ marginBottom: '12px' }}>
                Comment sont protégées mes données personnelles ?
              </summary>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, paddingLeft: '0' }}>
                Vos données sont protégées conformément aux règles de sécurité applicables. 
                Nous utilisons l'authentification Firebase, le chiffrement des données sensibles 
                et des règles d'accès strictes. Consultez notre politique de confidentialité pour plus de détails.
              </p>
            </details>
          </div>

          {/* Lien Contact */}
          <div className="text-center" style={{ marginTop: '48px' }}>
            <p className="text-sm text-muted" style={{ marginBottom: '16px' }}>
              Vous avez une autre question ?
            </p>
            <Link href="/contact" className="btn btn-outline">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION CTA FINAL — Section 10
          Objectif : Inciter à l'action sans pression excessive
      ═══════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="card text-center" style={{ 
            padding: 'clamp(48px, 8vw, 80px) clamp(24px, 6vw, 60px)',
            background: 'linear-gradient(135deg, rgba(6,78,59,0.04) 0%, rgba(5,150,105,0.08) 100%)',
            border: '1px solid var(--primary-lighter)'
          }}>
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
              <h2 className="heading-xl" style={{ marginBottom: '24px' }}>
                Commencez votre veille<br />
                des marchés publics
              </h2>
              
              <p className="lead" style={{ 
                marginBottom: '40px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8
              }}>
                Accédez aux marchés publics du Burkina Faso depuis une seule plateforme. 
                Recherchez, analysez et suivez les opportunités pertinentes pour votre activité.
              </p>

              <div className="flex justify-center flex-wrap gap-4">
                <Link href="/inscription" className="btn btn-primary btn-lg">
                  Créer un compte gratuit
                </Link>
                <Link href="/marches" className="btn btn-outline btn-lg">
                  Explorer les marchés
                </Link>
              </div>

              {/* Mentions légales importantes */}
              <div style={{ marginTop: '56px', paddingTop: '32px', borderTop: '1px solid var(--color-border)' }}>
                <p className="text-xs text-muted" style={{ lineHeight: 1.7 }}>
                  Wend-Kabré est une plateforme privée indépendante.<br />
                  Nous ne sommes pas affiliés à une administration publique et ne nous substituons pas aux sources officielles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
