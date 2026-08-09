import Link from 'next/link';

export default function Confidentialite() {
  return (
    <main className="container section animate-fadeIn">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" className="btn btn-outline btn-sm" style={{ marginBottom: '32px' }}>
          ← Retour
        </Link>

        <h1 className="heading-lg" style={{ marginBottom: '32px' }}>
          Politique de confidentialité
        </h1>

        <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Données collectées
          </h2>
          <p>
            Wend-Kabré collecte les données suivantes lors de l'utilisation de la plateforme :
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Nom, adresse e-mail (lors de l'inscription)</li>
            <li>Informations de profil (secteur d'activité, préférences)</li>
            <li>Données d'utilisation (marchés consultés, recherches effectuées)</li>
            <li>Adresse IP, type de navigateur (données analytiques)</li>
          </ul>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Utilisation des données
          </h2>
          <p>
            Les données collectées sont utilisées pour :
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Gérer votre compte et fournir les services disponibles</li>
            <li>Envoyer des alertes personnalisées sur les marchés</li>
            <li>Améliorer la plateforme et l'expérience utilisateur</li>
            <li>Analyser l'utilisation (statistiques anonymes)</li>
          </ul>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Protection des données
          </h2>
          <p>
            Wend-Kabré met en place des mesures de sécurité pour protéger vos données :
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Authentification sécurisée (Firebase Auth)</li>
            <li>Chiffrement des données sensibles</li>
            <li>Accès limité aux données (règles de sécurité Firestore)</li>
            <li>Respect des bonnes pratiques de sécurité informatique</li>
          </ul>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Partage des données
          </h2>
          <p>
            Vos données personnelles ne sont pas partagées avec des tiers sans votre consentement, 
            sauf si légalement requis.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Droits de l'utilisateur
          </h2>
          <p>
            Vous avez le droit de :
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Accéder à vos données personnelles</li>
            <li>Demander la correction ou la suppression de vos données</li>
            <li>Retirer votre consentement pour les notifications</li>
            <li>Supprimer votre compte</li>
          </ul>

          <p style={{ marginTop: '16px' }}>
            Pour exercer ces droits, contactez-nous à :{' '}
            <Link href="mailto:support@wend-kabre.bf" className="link">
              support@wend-kabre.bf
            </Link>
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Cookies
          </h2>
          <p>
            La plateforme utilise des cookies et technologies similaires pour améliorer 
            l'expérience utilisateur. Vous pouvez configurer votre navigateur pour refuser 
            les cookies.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Modifications
          </h2>
          <p>
            Cette politique peut être modifiée à tout moment. Les modifications seront 
            communiquées via la plateforme.
          </p>

          <h2 className="heading-md" style={{ marginTop: '32px', marginBottom: '16px' }}>
            Contactez-nous
          </h2>
          <p>
            Pour toute question concernant cette politique :{' '}
            <Link href="mailto:support@wend-kabre.bf" className="link">
              support@wend-kabre.bf
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
