'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { track } from '@/lib/track';
import { paymentServiceClient } from '@/lib/paymentServiceClient';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'FREE',
    name: 'Pass Découverte',
    price: '0',
    currency: 'FCFA',
    period: ' / gratuit',
    icon: '🌱',
    color: 'var(--text-secondary)',
    borderColor: 'var(--color-border-strong)',
    badge: 'Gratuit',
    badgeColor: 'badge-gray',
    features: [
      { text: 'Consultation limitée des marchés', ok: true },
      { text: 'Recherche par catégorie', ok: true },
      { text: 'Alertes WhatsApp & SMS', ok: false },
      { text: 'Téléchargement PDF', ok: false },
      { text: 'Assistant IA d\'analyse', ok: false },
      { text: 'Support prioritaire', ok: false },
    ],
    cta: 'Commencer Gratuitement',
    ctaLink: '/inscription?plan=free',
    ctaStyle: { background: 'var(--color-bg-2)', color: 'var(--text-primary)', border: '1px solid var(--color-border)' },
  },
  {
    id: 'PREMIUM',
    name: 'Plan Premium',
    price: '15000',
    currency: 'FCFA',
    period: '/ mois',
    icon: '⚡',
    color: 'var(--primary)',
    borderColor: 'var(--primary)',
    badge: 'Le plus populaire',
    badgeColor: 'badge-green',
    features: [
      { text: 'Accès complet à tous les marchés', ok: true },
      { text: 'Téléchargement direct des PDF', ok: true },
      { text: 'Alertes personnalisées temps réel', ok: true },
      { text: 'Générateur de Devis Pro', ok: true },
      { text: 'Assistant IA d\'analyse de dossiers', ok: true },
      { text: 'Tableau de bord de suivi CRM', ok: true },
    ],
    cta: 'Souscrire au Premium 🚀',
    ctaStyle: { background: 'var(--grad-primary)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: 'var(--shadow-primary)' },
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Plan Entreprise',
    price: '55000',
    currency: 'FCFA',
    period: '/ mois',
    icon: '🏢',
    color: '#F59E0B',
    borderColor: '#F59E0B',
    badge: 'Équipes',
    badgeColor: 'badge-gold',
    features: [
      { text: 'Tout du plan Premium inclus', ok: true },
      { text: 'Jusqu\'à 10 collaborateurs', ok: true },
      { text: 'Statistiques et analyses avancées', ok: true },
      { text: 'Support prioritaire 24h/24', ok: true },
      { text: 'API personnalisée', ok: true },
      { text: 'Formation de l\'équipe offerte', ok: true },
    ],
    cta: 'Contacter les ventes',
    ctaStyle: { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: '0 4px 20px rgba(245,158,11,0.3)' },
  }
];

export default function TarifsPage() {
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [user, setUser] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const getPrice = (plan) => {
    if (plan.price === '0') return '0';
    const base = parseInt(plan.price.replace(/\s/g, ''), 10);
    if (billingAnnual && plan.id !== 'FREE') {
      return Math.round(base * 12 * 0.80).toLocaleString('fr-FR');
    }
    return plan.price;
  };

  const formatPrice = (n) => n.toLocaleString('fr-FR');

  const handleCTA = (plan) => {
    // Plan gratuit ou Enterprise → Redirection classique
    if (plan.id === 'FREE') {
      router.push(plan.ctaLink);
      return;
    }
    
    if (plan.id === 'ENTERPRISE') {
      router.push('/contact?plan=enterprise');
      return;
    }

    // Plan payant (PREMIUM) → Vérifier connexion
    if (!user) {
      router.push(`/inscription?plan=${plan.id.toLowerCase()}`);
      return;
    }

    // Ouvrir modal de paiement Money Fusion
    setSelectedPlan(plan);
    setErrorMessage('');
    track('payment_start', { planId: plan.id });
    setShowPayModal(true);
  };

  const handleManualTransferRedirect = () => {
    if (!selectedPlan) return;
    track('payment_manual_chosen', { planId: selectedPlan.id });
    setShowPayModal(false);
    const billingParam = billingAnnual ? 'annual' : 'monthly';
    router.push(`/paiement-ocr?plan=${selectedPlan.id.toLowerCase()}&billing=${billingParam}`);
  };

  return (
    <>
      <main className="animate-fadeIn relative">
        {/* Hero */}
        <section className="section" style={{ background: 'var(--grad-hero)', textAlign: 'center' }}>
          <div className="container">
            <span className="badge badge-gold animate-pulse-green" style={{ marginBottom: '20px' }}>
              💎 Accès Premium Wend-Kabré
            </span>
            <h1 className="heading-xl" style={{ marginBottom: '20px' }}>
              Choisissez votre niveau<br />
              <span className="text-green">d'accès aux marchés publics</span>
            </h1>
            <p className="text-secondary" style={{ maxWidth: '580px', margin: '0 auto 40px', fontSize: '1.1rem' }}>
              Tous les appels d'offres de l'État burkinabè en temps réel. Soyez le premier à postuler.
            </p>

            {/* Toggle Mensuel / Annuel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '60px' }}>
              <span className="text-secondary text-sm" style={{ opacity: billingAnnual ? 0.5 : 1 }}>Mensuel</span>
              <button
                onClick={() => setBillingAnnual(!billingAnnual)}
                aria-label="Basculer facturation mensuelle / annuelle"
                style={{
                  width: '52px', height: '28px',
                  background: billingAnnual ? 'var(--grad-primary)' : 'var(--color-border-strong)',
                  borderRadius: '50px', border: 'none', cursor: 'pointer',
                  position: 'relative', transition: 'background 0.3s',
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: '3px',
                  left: billingAnnual ? '27px' : '3px', transition: 'left 0.3s',
                  boxShadow: '0 2px 5px rgba(6,78,59,0.25)',
                }} />
              </button>
              <span className="text-secondary text-sm" style={{ opacity: billingAnnual ? 1 : 0.5 }}>
                Annuel&nbsp;
                <span style={{
                  background: 'var(--grad-accent)',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                  padding: '2px 8px', borderRadius: '50px',
                }}>-20%</span>
              </span>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="section" style={{ marginTop: '-40px' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px', alignItems: 'stretch', maxWidth: '1200px', margin: '0 auto' }}>
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className="card flex flex-col"
                  style={{
                    flex: '1 1 320px',
                    maxWidth: '380px',
                    border: `2px solid ${plan.borderColor}`,
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    ...(plan.popular ? { transform: 'scale(1.05)', boxShadow: '0 20px 50px rgba(5,150,105,0.18)' } : {}),
                  }}
                >
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${plan.badgeColor}`}>{plan.badge}</span>
                    </div>
                  )}

                  {/* En-tête du plan */}
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{plan.icon}</div>
                    <h3 className="heading-md" style={{ color: plan.color, marginBottom: '4px' }}>{plan.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {getPrice(plan)}
                      </span>
                      <span className="text-secondary text-sm">
                        {plan.currency}{plan.price !== '0' ? (billingAnnual && plan.id !== 'FREE' ? ' / an' : plan.period) : ''}
                      </span>
                    </div>
                    {billingAnnual && plan.id !== 'FREE' && plan.id !== 'ENTERPRISE' && (
                      <p className="text-muted text-xs" style={{ marginTop: '6px' }}>
                        Facturé annuellement (économisez 20%)
                      </p>
                    )}
                  </div>

                  {/* Liste des fonctionnalités */}
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '28px' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: f.ok ? 'var(--success-muted)' : 'var(--color-surface-3)',
                          color: f.ok ? 'var(--primary)' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {f.ok ? '✓' : '✕'}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: f.ok ? 'var(--text-secondary)' : 'var(--text-muted)', textDecoration: f.ok ? 'none' : 'line-through' }}
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleCTA(plan)} 
                    className="btn" 
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      textAlign: 'center', 
                      transition: 'all 0.3s ease',
                      ...plan.ctaStyle
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ marginTop: '80px' }}>
              <h2 className="heading-lg text-center" style={{ marginBottom: '40px' }}>Questions fréquentes</h2>
              <div className="grid grid-2 gap-6">
                {[
                  {
                    q: 'Comment fonctionne le paiement par transfert ?',
                    a: 'Vous effectuez le transfert vers nos numéros officiels Orange Money ou Moov Money, puis vous soumettez le reçu dans votre espace. Validation et activation sous 24h ouvrées.',
                  },
                  {
                    q: 'Puis-je annuler mon abonnement ?',
                    a: 'Oui, sans engagement. Résiliez à tout moment depuis votre tableau de bord. L\'accès reste actif jusqu\'à la fin de la période payée.',
                  },
                  {
                    q: 'Comment sont collectés les marchés ?',
                    a: 'Surveillance automatique 24h/24 des portails officiels burkinabè. Publication instantanée sur la plateforme.',
                  },
                  {
                    q: 'Qu\'est-ce que l\'assistant IA ?',
                    a: 'Assistant intelligent qui analyse les exigences des appels d\'offres et vérifie la conformité de votre dossier administratif.',
                  },
                ].map((faq, i) => (
                  <div key={i} className="card-glass" style={{ padding: '24px' }}>
                    <h4 className="text-primary" style={{ fontWeight: 600, marginBottom: '10px', fontSize: '0.95rem' }}>{faq.q}</h4>
                    <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA final */}
            <div className="responsive-card-padding" style={{
              marginTop: '80px', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(5,150,105,0.07), rgba(6,78,59,0.04))',
              border: '1px solid var(--color-border-hover)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🇧🇫</div>
              <h3 className="heading-lg" style={{ marginBottom: '16px' }}>Prêt à saisir votre prochain marché ?</h3>
              <p className="text-secondary" style={{ maxWidth: '480px', margin: '0 auto 28px' }}>
                Rejoignez les PME burkinabè qui ne manquent plus jamais un appel d'offres.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => handleCTA(PLANS[1])} className="btn btn-gold btn-lg">
                  Démarrer avec Premium ⚡
                </button>
                <Link href="/marches" className="btn btn-outline btn-lg">
                  Voir les marchés d'abord
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL CHOIX DU MODE DE PAIEMENT */}
      {showPayModal && selectedPlan && (
        <div 
          style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.75)', 
            zIndex: 9999,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px',
            overflowY: 'auto',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => {
            track('payment_abandon', { planId: selectedPlan.id });
            setShowPayModal(false);
          }}
        >
          <div 
            className="card animate-fadeIn" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: '580px',
              background: 'var(--color-bg-1)',
              border: `3px solid ${selectedPlan.borderColor}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${selectedPlan.borderColor}20`,
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              padding: '32px'
            }}
          >
            {/* Header avec close button */}
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${selectedPlan.borderColor}20, ${selectedPlan.borderColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  border: `2px solid ${selectedPlan.borderColor}40`
                }}>
                  💳
                </div>
                <div>
                  <h2 className="heading-md" style={{ color: selectedPlan.color, marginBottom: '2px' }}>
                    Choix du Mode de Paiement
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Souscription au {selectedPlan.name} ({formatPrice(parseInt(getPrice(selectedPlan).replace(/\s/g, ''), 10))} FCFA)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { 
                  track('payment_abandon', { planId: selectedPlan.id }); 
                  setShowPayModal(false); 
                }} 
                aria-label="Fermer" 
                style={{ 
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--text-secondary)', 
                  fontSize: '18px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Grille des 2 options de paiement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              
              {/* OPTION 1 : TRANSFERT MANUEL (DISPONIBLE MAINTENANT) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.03))',
                border: '2px solid var(--primary)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0, fontSize: '1.05rem' }}>
                        Transfert Manuel
                      </h4>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                        🟢 Disponible maintenant
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-secondary" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
                  Effectuez le transfert vers notre numéro Orange Money ou Moov Money, puis transmettez votre reçu. Activation validée sous 24h ouvrées.
                </p>

                <button
                  onClick={handleManualTransferRedirect}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontWeight: 700,
                    padding: '12px 20px',
                    fontSize: '0.95rem'
                  }}
                >
                  Continuer avec le transfert manuel →
                </button>
              </div>

              {/* OPTION 2 : PAIEMENT AUTOMATIQUE MOBILE MONEY (BIENTÔT DISPONIBLE) */}
              <div style={{
                background: 'var(--color-surface-2)',
                border: '2px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                opacity: 0.85
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>⚡</span>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '1.05rem' }}>
                        Paiement Mobile Money automatique
                      </h4>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                        🟡 Bientôt disponible
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Orange Money</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Moov Money</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Carte bancaire</span>
                </div>

                <p className="text-sm text-secondary" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
                  Le paiement automatique sera bientôt disponible. Vous pourrez payer directement depuis votre téléphone avec activation instantanée.
                </p>

                <button
                  disabled
                  className="btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: 'var(--color-surface-3)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--color-border)',
                    cursor: 'not-allowed',
                    fontWeight: 600,
                    padding: '12px 20px',
                    fontSize: '0.95rem'
                  }}
                >
                  🔒 Bientôt disponible
                </button>
              </div>

            </div>

            {/* Footer modal */}
            <div style={{
              padding: '12px 16px',
              background: 'var(--color-surface-2)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}>
              <p className="text-xs text-muted" style={{ margin: 0 }}>
                🔒 Vos informations sont traitées en toute confidentialité. Pour toute question, contactez notre support.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
