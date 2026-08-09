import Link from 'next/link';
import Logo from './Logo';
import styles from './Footer.module.css';

/**
 * Footer Professionnel v2.1 — Wend-Kabré
 * Redesign pour meilleure crédibilité et lisibilité
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        {/* TOP SECTION: 4 Colonnes */}
        <div className={styles.columns}>
          {/* Column 1: Brand + Tagline */}
          <div className={styles.columnBrand}>
            <Link href="/" className={styles.brand}>
              <Logo size={32} className={styles.brandIcon} />
              <span className={styles.brandText}>Wend-<span className={styles.brandAccent}>Kabré</span></span>
            </Link>
            <p className={styles.tagline}>
              Simplifier l'accès et la compréhension des opportunités de marchés publics au Burkina Faso.
            </p>
            {/* Social Links */}
            <div className={styles.socialLinks}>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">
                in
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter" aria-label="Twitter">
                𝕏
              </a>
              <a href="mailto:contact@wend-kabre.bf" title="Email">
                ✉️
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Produit</h4>
            <ul className={styles.columnList}>
              <li><Link href="/marches" className={styles.link}>Tous les marchés</Link></li>
              <li><Link href="/tarifs" className={styles.link}>Offres d'abonnement</Link></li>
              <li><Link href="#comment-ca-marche" className={styles.link}>Comment ça marche</Link></li>
              <li><Link href="/guide-soumission" className={styles.link}>Guide complet</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Entreprise</h4>
            <ul className={styles.columnList}>
              <li><Link href="/contact" className={styles.link}>Nous contacter</Link></li>
              <li><Link href="/modeles-arcop" className={styles.link}>Ressources ARCOP</Link></li>
              <li><a href="mailto:support@wend-kabre.bf" className={styles.link}>Support</a></li>
              <li><a href="https://wend-kabre.bf/sitemap.xml" className={styles.link}>Plan du site</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Légal</h4>
            <ul className={styles.columnList}>
              <li><Link href="/mentions-legales" className={styles.link}>Mentions légales</Link></li>
              <li><Link href="/confidentialite" className={styles.link}>Politique de confidentialité</Link></li>
              <li><Link href="/conditions" className={styles.link}>Conditions d'utilisation</Link></li>
              <li><a href="mailto:support@wend-kabre.bf" className={styles.link}>Signaler un problème</a></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: Minimal */}
        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <p className={styles.copyright}>
              © 2026 Wend-Kabré — Plateforme privée indépendante.
            </p>
            <p className={styles.disclaimer}>
              Wend-Kabré n'est pas affilié à une administration publique et ne remplace pas les sources officielles.
            </p>
          </div>
          
          <div className={styles.bottomRight}>
            <p className={styles.status}>
              <span className={styles.statusBadge}>🟢 Opérationnel</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
