'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './checkout.module.css';

const PLANS = {
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 5000,
    currency: 'XOF',
    duration: 'par mois',
    description: 'Pour professionnels sérieux',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    currency: 'XOF',
    duration: 'par mois',
    description: 'Pour agences & PME',
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'premium';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+226');
  const [selectedPlan, setSelectedPlan] = useState(planId);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Get user info
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/connexion');
        return;
      }
      setUser(currentUser);
      setEmail(currentUser.email || '');
    });
    return () => unsub();
  }, [router]);

  // Validate inputs
  const validateForm = () => {
    if (!email || !email.includes('@')) {
      setError('Email invalide');
      return false;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Numéro de téléphone invalide');
      return false;
    }
    if (!acceptTerms) {
      setError('Veuillez accepter les conditions');
      return false;
    }
    return true;
  };

  // Handle payment
  const handlePayment = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);

    try {
      // Call checkout API
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          planId: selectedPlan,
          email,
          phoneNumber,
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement');
      }

      // Store transaction ID in session for success page
      sessionStorage.setItem('transactionId', data.transactionId);

      // Redirect to Money Fusion payment page
      if (data.redirectUrl || data.paymentUrl) {
        window.location.href = data.redirectUrl || data.paymentUrl;
      } else {
        throw new Error('URL de paiement non disponible');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const plan = PLANS[selectedPlan];

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        {/* Left Section - Summary */}
        <section className={styles.summary}>
          <h1 className={styles.summaryTitle}>Résumé de la Commande</h1>

          <div className={styles.planCard}>
            <h2 className={styles.planName}>{plan.name}</h2>
            <p className={styles.planDescription}>{plan.description}</p>

            <div className={styles.priceBreakdown}>
              <div className={styles.breakdownRow}>
                <span>Montant du plan:</span>
                <span className={styles.amount}>
                  {plan.price.toLocaleString('fr-FR')} {plan.currency}
                </span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Durée:</span>
                <span>{plan.duration}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Statut:</span>
                <span className={styles.active}>Actif immédiatement</span>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total à payer</span>
              <span className={styles.totalAmount}>
                {plan.price.toLocaleString('fr-FR')} {plan.currency}
              </span>
            </div>

            <div className={styles.paymentMethods}>
              <p className={styles.methodsTitle}>💳 Moyens de paiement acceptés:</p>
              <div className={styles.methodsList}>
                <span className={styles.method}>🟠 Orange Money</span>
                <span className={styles.method}>🔴 MTN Money</span>
                <span className={styles.method}>💜 Wave</span>
              </div>
            </div>

            {/* Features included */}
            <div className={styles.featuresIncluded}>
              <p className={styles.featureTitle}>✅ Inclus avec ce plan:</p>
              {selectedPlan === 'premium' && (
                <ul className={styles.featureList}>
                  <li>Alertes illimitées</li>
                  <li>Analyse de documents PDF</li>
                  <li>Comparaison de marchés</li>
                  <li>Support prioritaire 24h</li>
                </ul>
              )}
              {selectedPlan === 'pro' && (
                <ul className={styles.featureList}>
                  <li>Tous les services Premium</li>
                  <li>Génération de documents</li>
                  <li>Modèles personnalisés</li>
                  <li>Analyse prédictive IA</li>
                  <li>Support VIP 24/7</li>
                  <li>Rapports mensuels</li>
                </ul>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className={styles.helpSection}>
            <p className={styles.helpTitle}>❓ Questions?</p>
            <p className={styles.helpText}>
              Contactez-nous à{' '}
              <a href="mailto:support@wend-kabre.bf" className={styles.helpLink}>
                support@wend-kabre.bf
              </a>
            </p>
          </div>
        </section>

        {/* Right Section - Form */}
        <section className={styles.formSection}>
          <h2 className={styles.formTitle}>Informations de Paiement</h2>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <form onSubmit={handlePayment} className={styles.form}>
            {/* Plan Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className={styles.select}
              >
                {Object.entries(PLANS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name} - {p.price.toLocaleString('fr-FR')} {p.currency}/{p.duration}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={styles.input}
                required
              />
              <small className={styles.hint}>
                Vous recevrez votre facture à cet email
              </small>
            </div>

            {/* Phone Number */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Numéro de Téléphone *</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+226 xx xx xx xx"
                className={styles.input}
                required
              />
              <small className={styles.hint}>
                Utilisé pour la transaction Money Fusion
              </small>
            </div>

            {/* Terms & Conditions */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className={styles.checkbox}
                  required
                />
                <span>
                  J'accepte les{' '}
                  <a href="/conditions" target="_blank" className={styles.link}>
                    conditions d'utilisation
                  </a>
                  {' '}et la{' '}
                  <a href="/politique-confidentialite" target="_blank" className={styles.link}>
                    politique de confidentialité
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Traitement en cours...
                </>
              ) : (
                `Passer à Money Fusion (${plan.price.toLocaleString('fr-FR')} ${plan.currency})`
              )}
            </button>

            {/* Cancel Link */}
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
            >
              Annuler
            </button>
          </form>

          {/* Security Notice */}
          <div className={styles.securityNotice}>
            <p className={styles.noticeTitle}>🔒 Paiement Sécurisé</p>
            <p className={styles.noticeText}>
              Vos données sont chiffrées et traitées par Money Fusion, notre prestataire 
              de paiement sécurisé.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p>Chargement...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
