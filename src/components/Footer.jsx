import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandBlock}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandIcon}>⚡</span>
              <span>Wend-<span className={styles.brandAccent}>Kabré</span></span>
            </Link>
            <p className={styles.tagline}>
              La plateforme qui centralise les marchés publics burkinabè et guide les PME
              de l'alerte à la signature — procédures, pièces requises, délais et assistant IA.
            </p>
          </div>

          <div className={styles.col}>
            <p className={styles.colTitle}>Plateforme</p>
            <ul>
              <li><Link href="/marches" className={styles.link}>Marchés Publics</Link></li>
              <li><Link href="/recrutements" className={styles.link}>Recrutements</Link></li>
              <li><Link href="/assistant" className={styles.link}>Assistant IA</Link></li>
              <li><Link href="/tarifs" className={styles.link}>Tarifs</Link></li>
            </ul>
          </div>

          <div className={styles.col}>
            <p className={styles.colTitle}>Compte</p>
            <ul>
              <li><Link href="/inscription" className={styles.link}>Créer un compte</Link></li>
              <li><Link href="/connexion" className={styles.link}>Connexion</Link></li>
              <li><Link href="/dashboard" className={styles.link}>Dashboard</Link></li>
              <li><Link href="/alertes" className={styles.link}>Mes Alertes</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© 2026 Wend-Kabré. Conçu pour la transparence des marchés publics au Burkina Faso. 🇧🇫</p>
          <p>Fait avec ❤️ pour les PME burkinabè</p>
        </div>
      </div>
    </footer>
  );
}
