'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db, analytics } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { track } from '@/lib/track';
import styles from './inscription.module.css';

export default function InscriptionPage() {
  const [name, setName] = useState('');
  const [rccm, setRccm] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const router = useRouter();

  useEffect(() => {
    track('signup_start', {});
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (analytics) {
        logEvent(analytics, 'sign_up', { method: 'email' });
      }

      try {
        await sendEmailVerification(user);
      } catch (verifErr) {
        console.error('Envoi email de vérification échoué:', verifErr);
      }

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name,
        rccm: rccm || '',
        phone: phone || '',
        email,
        isSubscribed: false,
        plan: 'gratuit',
        hasSeenUpdateModal: true,
        createdAt: new Date().toISOString()
      });

      track('signup_complete', {});
      window.location.href = '/marches';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la création du compte.');
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
                {/* MAIN FIELDS */}
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
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* ADVANCED FIELDS (COLLAPSIBLE) */}
                <div className={styles.advancedSection}>
                  <button
                    type="button"
                    className={styles.advancedToggle}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? '▼' : '▶'} Informations complémentaires
                  </button>

                  {showAdvanced && (
                    <div className={styles.advancedFields}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Téléphone WhatsApp</label>
                        <input 
                          type="tel" 
                          className={styles.formInput} 
                          placeholder="+226 70 00 00 00"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Numéro RCCM</label>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          placeholder="Ex: BF-OUA-2026-B-0000"
                          value={rccm}
                          onChange={(e) => setRccm(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? (
                    <span className="loader"></span>
                  ) : (
                    'Démarrer maintenant'
                  )}
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
