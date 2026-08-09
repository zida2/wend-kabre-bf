import Link from 'next/link';

export default function Conditions() {
  return (
    <main className="container section animate-fadeIn">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" className="btn btn-outline btn-sm" style={{ marginBottom: '32px' }}>
          ← Retour
        </Link>

        <h1 className="heading-lg" style={{ marginBottom: '32px' }}>
          Conditions d'utilisation
        </h1>

        <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Acceptation des conditions
          </h2>
          <p>
            En accédant et en utilisant Wend-Kabré, vous acceptez les présentes conditions 
            d'utilisation. Si vous n'acceptez pas ces conditions, veuillez cesser l'utilisation 
            de la plateforme.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Description du service
          </h2>
          <p>
            Wend-Kabré est une plateforme d'information et de veille destinée à faciliter 
            l'accès et la compréhension des informations relatives aux marchés publics du 
            Burkina Faso. La plateforme ne garantit pas l'obtention d'un marché.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Utilisation responsable
          </h2>
          <p>
            L'utilisateur s'engage à utiliser la plateforme de manière responsable et 
            conforme à la loi. En particulier, l'utilisateur s'engage à :
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Ne pas utiliser la plateforme à des fins illégales</li>
            <li>Ne pas diffuser de contenu offensant, diffamatoire ou frauduleux</li>
            <li>Ne pas tenter d'accéder à des données restreintes</li>
            <li>Ne pas surcharger ou perturber le fonctionnement de la plateforme</li>
          </ul>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Limitation de responsabilité
          </h2>
          <p>
            Wend-Kabré fournit les informations "tel quel" sans garantie d'exactitude, 
            de complétude ou d'actualité. L'utilisateur assume la responsabilité de 
            vérifier les informations auprès des sources officielles avant toute démarche.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Abonnements et paiement
          </h2>
          <p>
            Les abonnements payants sont renouvelés automatiquement selon les conditions 
            choisies. L'utilisateur peut résilier son abonnement à tout moment depuis 
            son compte. Les remboursements ne sont accordés que selon les conditions 
            de la politique de remboursement.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Propriété intellectuelle
          </h2>
          <p>
            Le contenu, les outils et la structure de Wend-Kabré sont protégés par le 
            droit d'auteur. Toute reproduction sans autorisation est interdite.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Modification des conditions
          </h2>
          <p>
            Wend-Kabré se réserve le droit de modifier ces conditions à tout moment. 
            Les modifications seront communiquées via la plateforme.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Résiliation du compte
          </h2>
          <p>
            L'utilisateur peut demander la suppression de son compte à tout moment. 
            Wend-Kabré peut suspendre ou fermer un compte en cas de violation des 
            présentes conditions.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Contactez-nous
          </h2>
          <p>
            Pour toute question : {' '}
            <Link href="mailto:support@wend-kabre.bf" className="link">
              support@wend-kabre.bf
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
