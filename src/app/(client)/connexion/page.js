'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import styles from './connexion.module.css';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_EMAIL = 'zidadesire20@gmail.com';
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.email?.toLowerCase() === ADMIN_EMAIL) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password) {
      setError('Veuillez renseigner votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.email?.toLowerCase() === ADMIN_EMAIL) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error(err);
      setError('Identifiants incorrects ou problème de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: '🔍',
      title: 'Trouvez des marchés',
      description: 'Accédez à la plus grande base de marchés publics du Burkina Faso',
    },
    {
      icon: '⏰',
      title: 'Gagnez du temps',
      description: 'Alertes automatiques pour les opportunités pertinentes',
    },
    {
      icon: '📊',
      title: 'Gérez vos candidatures',
      description: 'Suivi complet de vos dossiers en un seul endroit',
    },
    {
      icon: '🎯',
      title: 'Augmentez vos chances',
      description: 'Ressources pour préparer vos soumissions',
    },
  ];

  return (
    <main className={styles.loginContainer}>
      <div className={styles.contentWrapper}>
        {/* LEFT COLUMN: HERO + BENEFITS */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Votre espace entreprise</h1>
            <p className={styles.heroSubtitle}>
              Gérez vos marchés publics avec efficacité
            </p>

            <div className={styles.benefitsGrid}>
              {benefits.map((benefit, idx) => (
                <div key={idx} className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>{benefit.icon}</span>
                  <div className={styles.benefitText}>
                    <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                    <p className={styles.benefitDesc}>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.statsSection}>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>500+</span>
                <span className={styles.statLabel}>PME</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>100+</span>
                <span className={styles.statLabel}>Marchés/mois</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>75%</span>
                <span className={styles.statLabel}>Succès</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <section className={styles.formSection}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.logoBox}>
                <Logo size={40} />
              </div>
              <h2 className={styles.formTitle}>Se connecter</h2>
              <p className={styles.formSubtitle}>
                À votre espace entreprise
              </p>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Adresse Email</label>
                <input 
                  type="email" 
                  className={styles.formInput} 
                  placeholder="contact@entreprise.bf" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.passwordLabelWrapper}>
                  <label className={styles.formLabel}>Mot de Passe</label>
                  <Link href="/password-reset" className={styles.forgotLink}>
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input 
                  type="password" 
                  className={styles.formInput} 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? (
                  <span className="loader"></span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className={styles.divider}></div>

            <div className={styles.signupPrompt}>
              <p className={styles.signupText}>
                Vous n'avez pas de compte ?{' '}
                <Link href="/inscription" className={styles.signupLink}>
                  Créer un compte
                </Link>
              </p>
            </div>

            <div className={styles.trustSection}>
              <p className={styles.trustBadge}>🔒 Connexion sécurisée (SSL 256-bit)</p>
              <p className={styles.trustBadge}>📋 Vos données sont confidentielles</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
