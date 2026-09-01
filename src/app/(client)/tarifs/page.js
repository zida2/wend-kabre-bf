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
    savings: 'Économisez 63% vs 10×Premium',
    pricePerUser: '5 500 FCFA/utilisateur',
    icon: '🏢',
    color: '#F59E0B',
    borderColor: '#F59E0B',
    badge: 'Pour les équipes · Meilleure valeur',
    badgeColor: 'badge-gold',
    features: [
      { text: 'Toutes les fonctionnalités Premium', ok: true, highlight: true },
      { text: 'Jusqu\'à 10 collaborateurs inclus', ok: true, highlight: true },
      { text: 'Tableau de bord équipe centralisé', ok: true },
      { text: 'Statistiques et analyses avancées', ok: true },
      { text: 'Support prioritaire 24h/24', ok: true },
      { text: 'API d\'intégration personnalisée', ok: true },
      { text: 'Formation complète de l\'équipe', ok: true },
      { text: 'Gestionnaire de compte dédié', ok: true },
    ],
    cta: 'Demander une démo',
    ctaStyle: { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: '0 4px 20px rgba(245,158,11,0.3)' },
    enterprise: true,
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
                    {plan.enterprise && (
                      <>
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '8px 12px', 
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
                          borderRadius: '8px',
                          border: '1px solid rgba(245,158,11,0.2)'
                        }}>
                          <p className="text-xs" style={{ 
                            color: '#B45309', 
                            fontWeight: 700,
                            margin: 0,
                            lineHeight: 1.4
                          }}>
                            💰 {plan.pricePerUser}/mois
                          </p>
                          <p className="text-xs text-muted" style={{ margin: '4px 0 0 0' }}>
                            {plan.savings}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Liste des fonctionnalités */}
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '28px' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: f.ok ? (f.highlight ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'var(--success-muted)') : 'var(--color-surface-3)',
                          color: f.ok ? (f.highlight ? '#fff' : 'var(--primary)') : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {f.ok ? '✓' : '✕'}
                        </span>
                        <span
                          className="text-sm"
                          style={{ 
                            color: f.ok ? 'var(--text-secondary)' : 'var(--text-muted)', 
                            textDecoration: f.ok ? 'none' : 'line-through',
                            fontWeight: f.highlight ? 700 : 400
                          }}
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

            {/* Comparaison Entreprise vs Premium (Nouvelle section) */}
            <div style={{ 
              marginTop: '80px',
              padding: '48px 32px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(217,119,6,0.02))',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(245,158,11,0.2)'
            }}>
              <div className="text-center" style={{ marginBottom: '40px' }}>
                <span className="badge badge-gold" style={{ marginBottom: '16px', fontSize: '0.8rem' }}>
                  💡 Comparaison Intelligente
                </span>
                <h2 className="heading-lg" style={{ marginBottom: '16px' }}>
                  Plan Entreprise : L'investissement qui compte
                </h2>
                <p className="text-secondary" style={{ maxWidth: '680px', margin: '0 auto' }}>
                  Découvrez pourquoi les entreprises avec équipes choisissent le Plan Entreprise
                </p>
              </div>

              <div className="grid grid-2 gap-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Colonne Premium */}
                <div className="card" style={{ 
                  padding: '32px',
                  background: 'var(--color-bg-1)',
                  border: '2px solid var(--color-border)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
                    <h3 className="heading-sm" style={{ marginBottom: '8px' }}>10 Comptes Premium</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      150 000
                    </div>
                    <p className="text-sm text-secondary">FCFA / mois</p>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li className="flex items-center gap-2 text-sm text-secondary">
                      <span>❌</span> Pas de gestion d'équipe
                    </li>
                    <li className="flex items-center gap-2 text-sm text-secondary">
                      <span>❌</span> Pas d'analytics centralisées
                    </li>
                    <li className="flex items-center gap-2 text-sm text-secondary">
                      <span>❌</span> Pas d'API d'intégration
                    </li>
                    <li className="flex items-center gap-2 text-sm text-secondary">
                      <span>❌</span> Pas de support prioritaire
                    </li>
                    <li className="flex items-center gap-2 text-sm text-secondary">
                      <span>❌</span> Pas de formation équipe
                    </li>
                  </ul>
                </div>

                {/* Colonne Entreprise */}
                <div className="card" style={{ 
                  padding: '32px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))',
                  border: '2px solid #F59E0B',
                  position: 'relative'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: '-14px', 
                    right: '20px',
                    background: '#10B981',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '50px',
                    fontSize: '0.7rem',
                    fontWeight: 800
                  }}>
                    ÉCONOMIE : 95 000 FCFA/mois
                  </div>
                  
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏢</div>
                    <h3 className="heading-sm" style={{ marginBottom: '8px', color: '#F59E0B' }}>
                      1 Compte Entreprise
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>
                      55 000
                    </div>
                    <p className="text-sm" style={{ color: '#B45309' }}>FCFA / mois</p>
                    <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
                      soit 5 500 FCFA/utilisateur
                    </p>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li className="flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
                      <span>✅</span> 10 collaborateurs inclus
                    </li>
                    <li className="flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
                      <span>✅</span> Dashboard équipe centralisé
                    </li>
                    <li className="flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
                      <span>✅</span> API d'intégration
                    </li>
                    <li className="flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
                      <span>✅</span> Support prioritaire 24/7
                    </li>
                    <li className="flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
                      <span>✅</span> Formation complète
                    </li>
                  </ul>

                  <div style={{ 
                    marginTop: '20px', 
                    padding: '12px', 
                    background: 'rgba(16,185,129,0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16,185,129,0.3)'
                  }}>
                    <p className="text-xs text-center" style={{ 
                      color: '#047857', 
                      fontWeight: 700,
                      margin: 0
                    }}>
                      💰 Vous économisez 63% avec le Plan Entreprise
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ marginTop: '80px' }}>
              <h2 className="heading-lg text-center" style={{ marginBottom: '40px' }}>Questions fréquentes</h2>
              <div className="grid grid-2 gap-6">
                {[
                  {
                    q: 'Combien d\'utilisateurs sont inclus dans le Plan Entreprise ?',
                    a: 'Le Plan Entreprise inclut jusqu\'à 10 collaborateurs. Chaque membre de l\'équipe dispose de son propre compte avec accès complet aux fonctionnalités Premium, plus les outils de collaboration d\'équipe.',
                  },
                  {
                    q: 'Quelle est la différence entre Premium et Entreprise ?',
                    a: 'Le Plan Entreprise inclut tout le Premium, plus : 10 comptes utilisateurs, dashboard équipe centralisé, API d\'intégration, support prioritaire 24/7, formation complète et gestionnaire de compte dédié. C\'est 63% moins cher que 10 comptes Premium séparés.',
                  },
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
                <button onClick={() => handleCTA(PLANS[2])} className="btn" style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff',
                  border: 'none'
                }}>
                  Plan Entreprise 🏢
                </button>
                <Link href="/marches" className="btn btn-outline btn-lg">
                  Voir les marchés d'abord
                </Link>
              </div>
              
              {/* Nouveau : Témoignage ou stat */}
              <div style={{ 
                marginTop: '32px', 
                paddingTop: '24px', 
                borderTop: '1px solid var(--color-border)' 
              }}>
                <p className="text-sm text-secondary" style={{ fontStyle: 'italic' }}>
                  "Avec le Plan Entreprise, notre équipe de 8 personnes collabore efficacement.<br />
                  Nous économisons 95 000 FCFA/mois vs des comptes séparés."
                </p>
                <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                  — Cabinet d'études SARL, Ouagadougou
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL CHOIX DU MODE DE PAIEMENT — COMPACT & 100% RESPONSIVE */}
      {showPayModal && selectedPlan && (
        <div 
          style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', 
            zIndex: 9999,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px',
            backdropFilter: 'blur(10px)'
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
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--color-bg-1)',
              border: `2px solid var(--primary)`,
              boxShadow: `0 25px 70px rgba(0,0,0,0.6), 0 0 25px rgba(5,150,105,0.25)`,
              borderRadius: '20px',
              position: 'relative',
              padding: '24px 20px'
            }}
          >
            {/* Header modal */}
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(5,150,105,0.35)'
                }}>
                  ⚡
                </div>
                <div>
                  <h2 className="heading-sm" style={{ color: 'var(--text-primary)', marginBottom: '2px', fontSize: '1.1rem', fontWeight: 800 }}>
                    Mode de Paiement & Activation
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                    Plan <strong style={{ color: 'var(--primary)' }}>{selectedPlan.name}</strong> ({formatPrice(parseInt(getPrice(selectedPlan).replace(/\s/g, ''), 10))} FCFA)
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
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--text-primary)', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                ✕
              </button>
            </div>

            {/* Grille des 2 options de paiement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              
              {/* OPTION 1 : PAIEMENT PAR TRANSFERT MANUEL (ACTIF & ACTIVATION INSTANTANÉE) */}
              <div style={{
                background: 'linear-gradient(135deg, #022C22 0%, #064E3B 50%, #047857 100%)',
                border: '2px solid #10B981',
                borderRadius: '16px',
                padding: '18px 16px',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(4,120,87,0.3)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      📱
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 800, color: '#FFFFFF', margin: 0, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                        Transfert Mobile Money
                      </h4>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#10B981',
                          color: '#022C22',
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          padding: '2px 8px',
                          borderRadius: '50px',
                          textTransform: 'uppercase'
                        }}>
                          🟢 Disponible
                        </span>
                        <span style={{
                          background: '#F59E0B',
                          color: '#78350F',
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          padding: '2px 8px',
                          borderRadius: '50px',
                          textTransform: 'uppercase'
                        }}>
                          ⚡ Activation Automatique
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ color: '#D1FAE5', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5, fontWeight: 400 }}>
                  Faites le transfert Orange/Moov Money et validez. <strong>Votre compte Premium est activé automatiquement</strong>.
                </p>

                <button
                  onClick={handleManualTransferRedirect}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    padding: '12px 18px',
                    fontSize: '0.92rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Payer par transfert (Activation instantanée)</span>
                  <span style={{ fontSize: '16px' }}>→</span>
                </button>
              </div>

              {/* OPTION 2 : PAIEMENT AUTOMATIQUE PAR GUICHET API */}
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '16px',
                opacity: 0.9
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--color-surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0
                    }}>
                      💳
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                        Guichet Direct API
                      </h4>
                      <span className="badge badge-gold" style={{ fontSize: '0.65rem', marginTop: '2px', fontWeight: 700 }}>
                        🟡 Prochainement
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Orange Money API</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Moov Money API</span>
                </div>

                <p className="text-xs text-secondary" style={{ marginBottom: '12px', lineHeight: 1.4 }}>
                  Prélèvement direct sans quitter le site en cours d'intégration.
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
                    fontWeight: 700,
                    padding: '10px 16px',
                    fontSize: '0.85rem'
                  }}
                >
                  🔒 Bientôt disponible
                </button>
              </div>

            </div>

            {/* Footer modal */}
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-surface-2)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}>
              <p className="text-xs text-secondary" style={{ margin: 0, fontWeight: 500, fontSize: '0.75rem' }}>
                🔒 Support rapide : <strong>+226 62 20 28 77</strong>
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
