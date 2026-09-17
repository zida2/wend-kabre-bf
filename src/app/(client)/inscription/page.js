'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db, analytics } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { track } from '@/lib/track';
import styles from './inscription.module.css';

export default function InscriptionPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('direct'); // Track where they came from

  const router = useRouter();
  const plan = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('plan') || 'gratuit' : 'gratuit';

  // Get signup source from URL params or session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get('source') || sessionStorage.getItem('signup_source') || 'landing';
    setSource(src);
    
    track('signup_start', { source: src, form_type: 'optimized_3_fields' });
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Password strength indicator
  const handlePasswordChange = (pwd) => {
    setPassword(pwd);
    if (pwd.length < 6) setPasswordStrength('weak');
    else if (pwd.length < 10) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!agreedToTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (analytics) {
        logEvent(analytics, 'sign_up', { 
          method: 'email',
          source: source
        });
      }

      try {
        await sendEmailVerification(user);
      } catch (verifErr) {
        console.error('Envoi email de vérification échoué:', verifErr);
      }

      const userDocRef = doc(db, 'users', user.uid);
      
      // Check if lead exists (from popup/email capture)
      let leadData = {};
      const userRef = await getDoc(userDocRef);
      if (userRef.exists()) {
        leadData = userRef.data();
      }

      await setDoc(userDocRef, {
        name: name || email.split('@')[0],
        email,
        isSubscribed: false,
        plan: plan || 'gratuit',
        hasSeenUpdateModal: true,
        signup_source: source,
        signup_date: new Date().toISOString(),
        email_verified: false,
        onboarding_step: 0,
        lifecycle_stage: 'lead',
        form_fields_count: 3, // Track form optimization
        ...leadData
      }, { merge: true });

      track('signup_complete', { source });
      
      // Redirect to success page instead of dashboard
      router.push(`/inscription/success?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de la création du compte.');
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: '📋',
      title: 'Trouvez des opportunités',
      description: 'Retrouvez 100+ nouveaux marchés chaque mois avec nos alertes intelligentes'
    },
    {
      icon: '⚡',
      title: 'Économisez du temps',
      description: 'Gagnez 10+ heures par semaine avec nos outils d\'automatisation'
    },
    {
      icon: '✅',
      title: 'Augmentez vos chances',
      description: 'Accédez à des ressources et guides pour remporter vos dossiers'
    },
  ];

  const features = [
    {
      icon: '🔔',
      title: 'Alertes intelligentes',
      description: 'Notifications en temps réel pour les marchés adaptés à votre profil'
    },
    {
      icon: '📊',
      title: 'Tableau de bord',
      description: 'Suivi détaillé de vos candidatures et dossiers en un seul endroit'
    },
    {
      icon: '🛠️',
      title: 'Outils intégrés',
      description: 'Templates et documents pour préparer vos soumissions'
    },
    {
      icon: '📞',
      title: 'Support 24/7',
      description: 'Assistance par WhatsApp, Email ou chat pour vous accompagner'
    },
  ];

  return (
    <>
      {/* HERO BANNER */}
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Rejoignez 500+ PME qui gèrent mieux leurs marchés
          </h1>
          <p className={styles.heroSubtitle}>
            Découvrez les meilleures opportunités et remportez vos appels d'offres
          </p>

          <div className={styles.quickBenefits}>
            {benefits.map((benefit, idx) => (
              <div key={idx} className={styles.quickBenefit}>
                <span className={styles.quickIcon}>{benefit.icon}</span>
                <div className={styles.quickText}>
                  <h3 className={styles.quickTitle}>{benefit.title}</h3>
                  <p className={styles.quickDesc}>{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* LEFT COLUMN: BENEFITS */}
          <section className={styles.benefitsSection}>
            <div className={styles.benefitsContent}>
              <h2 className={styles.benefitsTitle}>Pourquoi rejoindre Wend-Kabré ?</h2>
              
              <div className={styles.featuresGrid}>
                {features.map((feature, idx) => (
                  <div key={idx} className={styles.featureCard}>
                    <span className={styles.featureIcon}>{feature.icon}</span>
                    <div className={styles.featureText}>
                      <h3 className={styles.featureTitle}>{feature.title}</h3>
                      <p className={styles.featureDesc}>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.socialProof}>
                <div className={styles.proofItem}>
                  <span className={styles.proofNumber}>500+</span>
                  <span className={styles.proofLabel}>Entreprises actives</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofNumber}>2500+</span>
                  <span className={styles.proofLabel}>Marchés accessibles</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofNumber}>75%</span>
                  <span className={styles.proofLabel}>Taux de succès</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: FORM */}
          <section className={styles.formSection}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Créer mon compte</h2>
                <p className={styles.formSubtitle}>
                  En 2 minutes, sans carte bancaire
                </p>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleRegister} className={styles.form}>
                {/* 3 SIMPLE FIELDS */}
                <div className={styles.mainFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nom de l'Entreprise *</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="Ex: FASO DIGITAL SARL" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="organization"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Adresse Email *</label>
                    <input 
                      type="email" 
                      className={styles.formInput} 
                      placeholder="contact@entreprise.bf" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mot de Passe (min. 6 caractères) *</label>
                    <input 
                      type="password" 
                      className={styles.formInput} 
                      placeholder="••••••••" 
                      required
                      minLength="6"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      autoComplete="new-password"
                    />
                    {passwordStrength && (
                      <div className={`${styles.passwordStrength} ${styles[`strength-${passwordStrength}`]}`}>
                        Force du mot de passe: <strong>{passwordStrength === 'weak' ? 'Faible' : passwordStrength === 'medium' ? 'Moyen' : 'Fort'}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* TERMS CHECKBOX */}
                <div className={styles.termsGroup}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      required
                    />
                    <span>
                      J'accepte les <Link href="/conditions" target="_blank">conditions d'utilisation</Link> *
                    </span>
                  </label>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </form>

              <div className={styles.divider}></div>

              <p className={styles.loginPrompt}>
                Vous avez déjà un compte ?{' '}
                <Link href="/connexion" className={styles.loginLink}>
                  Se connecter
                </Link>
              </p>

              <div className={styles.trustInfo}>
                <p className={styles.trustItem}>✅ 100% gratuit, pas de carte bancaire requise</p>
                <p className={styles.trustItem}>🔒 Données sécurisées (SSL, RGPD compliant)</p>
                <p className={styles.trustItem}>⚡ Accès immédiat après inscription</p>
                <p className={styles.trustItem}>💬 Support 24/7 (WhatsApp, Email, Chat)</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
