import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <main className="container section animate-fadeIn">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" className="btn btn-outline btn-sm" style={{ marginBottom: '32px' }}>
          ← Retour
        </Link>

        <h1 className="heading-lg" style={{ marginBottom: '32px' }}>
          Mentions légales
        </h1>

        <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Éditeur du site
          </h2>
          <p>
            <strong>Wend-Kabré</strong><br />
            Plateforme privée indépendante<br />
            Burkina Faso 🇧🇫
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Statut juridique
          </h2>
          <p>
            Wend-Kabré est une plateforme privée indépendante. Elle n'est pas affiliée 
            à une administration publique et ne représente pas l'Autorité de Régulation 
            de la Commande Publique (ARCOP) ou toute autre institution gouvernementale.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Données et sources
          </h2>
          <p>
            Les informations présentées sur Wend-Kabré proviennent de sources publiques 
            identifiables. Lorsque disponible, la source d'origine est indiquée pour 
            permettre sa consultation et sa vérification.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Responsabilité
          </h2>
          <p>
            Wend-Kabré met à disposition des outils d'information et de veille. La plateforme 
            ne garantit pas l'exactitude, la complétude ou l'actualité de toutes les informations 
            présentées. L'utilisateur est responsable de la vérification des informations auprès 
            des sources officielles avant toute démarche.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Propriété intellectuelle
          </h2>
          <p>
            Le contenu, la mise en page et la structure de la plateforme Wend-Kabré sont 
            protégés par le droit d'auteur. Toute reproduction, extraction ou réutilisation 
            sans autorisation est interdite.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Liens externes
          </h2>
          <p>
            Wend-Kabré peut contenir des liens vers des sites externes. La plateforme ne 
            contrôle pas le contenu de ces sites et n'est pas responsable de leur disponibilité 
            ou de leur contenu.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Contactez-nous
          </h2>
          <p>
            Pour toute question ou réclamation : <br />
            <Link href="mailto:support@wend-kabre.bf" className="link">
              support@wend-kabre.bf
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
