import Link from 'next/link';
import Logo from './Logo';
import styles from './Footer.module.css';

/**
 * Footer professionnel — Wend-Kabré v2.0
 * Objectif : Transparence, crédibilité, légalité
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          {/* Bloc marque */}
          <div className={styles.brandBlock}>
            <Link href="/" className={styles.brand}>
              <Logo size={28} className={styles.brandIcon} />
              <span>Wend-<span className={styles.brandAccent}>Kabré</span></span>
            </Link>
            <p className={styles.tagline}>
              Simplifier l'accès et la compréhension des opportunités 
              de marchés publics au Burkina Faso.
            </p>
          </div>

          {/* Colonne Plateforme */}
          <div className={styles.col}>
            <p className={styles.colTitle}>Plateforme</p>
            <ul>
              <li><Link href="/marches" className={styles.link}>Marchés</Link></li>
              <li><Link href="/tarifs" className={styles.link}>Abonnement</Link></li>
              <li><Link href="#comment-ca-marche" className={styles.link}>Comment ça marche</Link></li>
              <li><Link href="/guide-soumission" className={styles.link}>Guide</Link></li>
            </ul>
          </div>

          {/* Colonne Ressources */}
          <div className={styles.col}>
            <p className={styles.colTitle}>Ressources</p>
            <ul>
              <li><Link href="/guide-soumission" className={styles.link}>Guide</Link></li>
              <li><Link href="/modeles-arcop" className={styles.link}>Référentiel</Link></li>
              <li><Link href="#" className={styles.link}>FAQ</Link></li>
              <li><Link href="/contact" className={styles.link}>Contact</Link></li>
            </ul>
          </div>

          {/* Colonne Légal */}
          <div className={styles.col}>
            <p className={styles.colTitle}>Légal</p>
            <ul>
              <li><Link href="/mentions-legales" className={styles.link}>Mentions légales</Link></li>
              <li><Link href="/confidentialite" className={styles.link}>Confidentialité</Link></li>
              <li><Link href="/conditions" className={styles.link}>Conditions d'utilisation</Link></li>
            </ul>
          </div>
        </div>

        {/* Pied de page avec mentions importantes */}
        <div className={styles.bottom}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              © 2026 Wend-Kabré — Plateforme privée indépendante.
            </p>
            <p style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              fontStyle: 'italic'
            }}>
              Wend-Kabré n'est pas affilié à une administration publique et ne se substitue 
              pas aux sources officielles. Les informations présentées proviennent de sources 
              publiques et sont fournies à titre informatif.
            </p>
          </div>
          
          {/* Contact support */}
          <div style={{ 
            paddingTop: '16px', 
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.85rem'
          }}>
            <p style={{ color: 'var(--text-muted)' }}>
              Support : <a href="mailto:support@wend-kabre.bf" className={styles.link}>support@wend-kabre.bf</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
