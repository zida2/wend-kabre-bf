'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { track } from '@/lib/track';

const PLANS = [
  {
    id: 'starter',
    name: 'Pass Essai (7 Jours)',
    price: '2 500',
    currency: 'FCFA',
    period: ' / unique',
    icon: '🌱',
    color: 'var(--text-secondary)',
    borderColor: 'var(--color-border-strong)',
    badge: 'Découverte',
    badgeColor: 'badge-gray',
    features: [
      { text: 'Voir tous les marchés en cours', ok: true },
      { text: 'Générateur de Devis Pro', ok: true },
      { text: 'Filtres par catégorie & recherche', ok: true },
      { text: 'Détails & source officielle', ok: true },
      { text: 'Alertes WhatsApp & SMS en temps réel', ok: false },
      { text: 'Assistant IA d\'analyse de dossiers', ok: false },
      { text: 'Tableau de bord de suivi CRM', ok: false },
    ],
    cta: 'Commencer l\'Essai',
    ctaLink: '/inscription?plan=starter',
    ctaStyle: { background: 'var(--color-bg-2)', color: 'var(--text-primary)', border: '1px solid var(--color-border)' },
  },
  {
    id: 'pro',
    name: 'PME Pro',
    price: '12 500',
    currency: 'FCFA',
    period: '/ mois',
    icon: '⚡',
    color: 'var(--primary)',
    borderColor: 'var(--primary)',
    badge: 'Le plus populaire',
    badgeColor: 'badge-green',
    features: [
      { text: 'Voir tous les marchés en cours', ok: true },
      { text: 'Générateur de Devis Pro', ok: true },
      { text: 'Filtres par catégorie & recherche', ok: true },
      { text: 'Détails & source officielle', ok: true },
      { text: 'Alertes WhatsApp & SMS en temps réel', ok: true },
      { text: 'Assistant IA d\'analyse de dossiers', ok: true },
      { text: 'Tableau de bord de suivi CRM', ok: true },
    ],
    cta: 'Passer en Pro 🚀',
    ctaLink: '/inscription?plan=pro',
    ctaStyle: { background: 'var(--grad-primary)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: 'var(--shadow-primary)' },
    popular: true,
  }
];

import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function TarifsPage() {
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(false);
  const router = useRouter();
  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      };
    };
  });
  
  // Modal de paiement
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paying, setPaying] = useState(false);

  // Code promo / coupon
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0); // pourcentage de réduction appliqué
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { id, code, uses }
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Custom Alert Modal State
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', onClose: null });

  const showAlert = (message, title = 'Notification', onClose = null) => {
    setAlertModal({ show: true, message, title, onClose });
  };

  const closeAlert = () => {
    const onClose = alertModal.onClose;
    setAlertModal({ show: false, title: '', message: '', onClose: null });
    if (onClose) onClose();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const q = query(
            collection(db, 'payment_requests'), 
            where('userId', '==', currentUser.uid),
            where('status', '==', 'pending')
          );
          const pSnap = await getDocs(q);
          setPendingPayment(!pSnap.empty);

          const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', currentUser.email)));
          if (!userDoc.empty) {
            setUserData(userDoc.docs[0].data());
          }
        } catch (err) {
          console.error("Erreur check pending payment:", err);
        }
      } else {
        setPendingPayment(false);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const getPrice = (plan) => {
    if (plan.price === '0') return '0';
    if (plan.id === 'starter') return plan.price;
    const base = parseInt(plan.price.replace(' ', ''), 10);
    if (billingAnnual) {
      return Math.round(base * 12 * 0.80).toLocaleString('fr-FR');
    }
    return plan.price;
  };

  // Nombre de jours d'abonnement selon le plan et le cycle de facturation.
  const subscriptionDays = (plan) => {
    if (plan.id === 'starter') return 7;      // essai 1 semaine
    return billingAnnual ? 365 : 30;          // annuel ou mensuel
  };

  // --- Prix & code promo -------------------------------------------------
  // Prix numérique (sans espaces ni devise) du plan pour le cycle courant.
  const getNumericPrice = (plan) => parseInt(String(getPrice(plan)).replace(/\D/g, ''), 10) || 0;
  // Prix final après application éventuelle du coupon.
  const getFinalPrice = (plan) => {
    const base = getNumericPrice(plan);
    if (!discount) return base;
    return Math.max(0, Math.round(base * (1 - discount / 100)));
  };
  const formatPrice = (n) => n.toLocaleString('fr-FR');

  const resetPromo = () => {
    setPromoCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    setPromoError('');
    setPromoLoading(false);
  };

  const applyPromo = async () => {
    const cleanCode = promoCode.trim().toUpperCase();
    setPromoError('');
    if (!cleanCode) {
      setPromoError('Veuillez saisir un code.');
      return;
    }
    setPromoLoading(true);
    try {
      const qCoupon = query(collection(db, 'coupons'), where('code', '==', cleanCode));
      const snap = await getDocs(qCoupon);
      if (snap.empty) {
        setDiscount(0);
        setAppliedCoupon(null);
        setPromoError('Code promo introuvable.');
        return;
      }
      const d = snap.docs[0];
      const data = d.data();
      if (data.active !== true) {
        setDiscount(0);
        setAppliedCoupon(null);
        setPromoError("Ce code promo n'est plus actif.");
        return;
      }
      if (typeof data.maxUses === 'number' && (data.uses ?? 0) >= data.maxUses) {
        setDiscount(0);
        setAppliedCoupon(null);
        setPromoError("Ce code promo a atteint sa limite d'utilisation.");
        return;
      }
      const percent = Number(data.discountPercent) || 0;
      setDiscount(percent);
      setAppliedCoupon({ id: d.id, code: data.code, uses: data.uses ?? 0 });
    } catch (err) {
      console.error('Erreur application coupon:', err);
      setPromoError("Impossible de vérifier le code pour l'instant. Réessayez.");
    } finally {
      setPromoLoading(false);
    }
  };

  // Auto-activation Premium (simulée) : le propriétaire authentifié écrit son
  // propre document users/{uid} — autorisé par les règles Firestore.
  // NB : cette activation reste contournable (choix produit assumé), une vraie
  //      passerelle de paiement + validation serveur serait nécessaire en prod.
  const activateOwnSubscription = async (uid, days) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isSubscribed: true,
      lastPaymentDate: new Date().toISOString(),
      subscriptionExpiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const handleCTA = (plan) => {
    if (!user) {
      router.push(`/inscription?plan=${plan.id}`);
      return;
    }
    // Ouvre la modale de paiement pour tous les plans (Starter, Pro, Elite)
    setSelectedPlan(plan);
    resetPromo();
    track('payment_start', { planId: plan?.id });
    setShowPayModal(true);
  };

  return (
    <main className="animate-fadeIn relative">
      {/* Hero */}
      <section className="section" style={{ background: 'var(--grad-hero)', textAlign: 'center' }}>
        <div className="container">
          <span className="badge badge-gold animate-pulse-green" style={{ marginBottom: '20px' }}>
            💎 Accès Premium
          </span>
          <h1 className="heading-xl" style={{ marginBottom: '20px' }}>
            Choisissez votre niveau<br />
            <span className="text-green">d'accès aux marchés</span>
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
          <div className="grid grid-3 gap-6" style={{ alignItems: 'start' }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className="card flex flex-col"
                style={{
                  border: `2px solid ${plan.borderColor}`,
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  ...(plan.popular ? { transform: 'scale(1.03)', boxShadow: '0 20px 50px rgba(5,150,105,0.18)' } : {}),
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
                      {plan.currency}{plan.price !== '0' ? (billingAnnual && plan.id !== 'starter' ? ' / an' : ' ' + plan.period) : ''}
                    </span>
                  </div>
                  {billingAnnual && plan.id !== 'starter' && (
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
                  onClick={() => {
                    const isTrialUsed = plan.id === 'starter' && userData?.hasUsedTrial;
                    if (!pendingPayment && !isTrialUsed) handleCTA(plan);
                  }} 
                  className="btn" 
                  disabled={pendingPayment || (plan.id === 'starter' && userData?.hasUsedTrial)}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    textAlign: 'center', 
                    transition: 'all 0.3s ease',
                    ...(pendingPayment || (plan.id === 'starter' && userData?.hasUsedTrial) ? { background: 'var(--color-surface-3)', color: 'var(--text-muted)', border: '1px solid var(--color-border-strong)', cursor: 'not-allowed', boxShadow: 'none' } : plan.ctaStyle)
                  }}
                >
                  {pendingPayment ? '⏳ Approbation en attente' : (plan.id === 'starter' && userData?.hasUsedTrial ? 'Essai déjà utilisé' : plan.cta)}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ rapide */}
          <div style={{ marginTop: '80px' }}>
            <h2 className="heading-lg text-center" style={{ marginBottom: '40px' }}>Questions fréquentes</h2>
            <div className="grid grid-2 gap-6">
              {[
                {
                  q: 'Comment les marchés sont-ils collectés ?',
                  a: 'Notre système surveille automatiquement les portails officiels burkinabè 24h/24. Dès qu\'un nouveau marché est publié, il apparaît instantanément sur la plateforme.',
                },
                {
                  q: 'Puis-je annuler mon abonnement à tout moment ?',
                  a: 'Oui, sans engagement. Vous pouvez résilier à tout moment depuis votre tableau de bord. L\'accès reste actif jusqu\'à la fin de la période payée.',
                },
                {
                  q: 'Les alertes WhatsApp fonctionnent-elles sur tout le territoire ?',
                  a: 'Oui. Les alertes sont envoyées sur tout numéro burkinabè dès qu\'un appel d\'offres correspondant à votre secteur est détecté.',
                },
                {
                  q: 'Qu\'est-ce que l\'assistant IA Wend-Kabré ?',
                  a: 'C\'est notre assistant intelligent qui analyse les exigences d\'un appel d\'offres et vérifie instantanément si votre dossier administratif est conforme aux critères requis.',
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
                Démarrer avec Pro ⚡
              </button>
              <Link href="/marches" className="btn btn-outline btn-lg">
                Voir les marchés d'abord
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL DE PAIEMENT OCR */}
      {showPayModal && selectedPlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="card animate-fadeIn" style={{ 
            width: '100%', maxWidth: '450px',
            border: `1px solid ${selectedPlan.borderColor}`, 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h2 className="heading-md" style={{ color: selectedPlan.color }}>Paiement Sécurisé</h2>
              <button onClick={() => { track('payment_abandon', { planId: selectedPlan?.id }); setShowPayModal(false); }} aria-label="Fermer" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', textAlign: 'center' }}>
              <p className="text-xs text-muted" style={{ marginBottom: '4px' }}>Vous souscrivez au forfait</p>
              <h3 className="heading-md" style={{ color: selectedPlan.color }}>{selectedPlan.name}</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '8px' }}>
                {discount > 0 && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 500, marginRight: '8px', fontSize: '1rem' }}>
                    {getPrice(selectedPlan)}
                  </span>
                )}
                {discount > 0 ? formatPrice(getFinalPrice(selectedPlan)) : getPrice(selectedPlan)} FCFA {billingAnnual ? '/ an' : '/ mois'}
              </p>
              {discount > 0 && (
                <p className="text-xs" style={{ color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
                  Code {appliedCoupon?.code} appliqué : -{discount}%
                </p>
              )}
            </div>

            {/* Code promo */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">🎟️ Code promo (optionnel)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Entrez votre code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (discount === 0) applyPromo(); } }}
                  style={{ textTransform: 'uppercase', flex: 1 }}
                  disabled={discount > 0 || paying}
                />
                {discount > 0 ? (
                  <button type="button" onClick={resetPromo} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }} disabled={paying}>
                    Retirer
                  </button>
                ) : (
                  <button type="button" onClick={applyPromo} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={promoLoading || paying}>
                    {promoLoading ? '…' : 'Appliquer'}
                  </button>
                )}
              </div>
              {promoError && (
                <p className="text-xs" style={{ color: 'var(--danger)', marginTop: '6px' }}>{promoError}</p>
              )}
              {discount > 0 && (
                <p className="text-xs" style={{ color: 'var(--primary)', marginTop: '6px', fontWeight: 600 }}>
                  ✓ Réduction de {discount}% appliquée.
                </p>
              )}
            </div>

            <div className="badge w-full" style={{ marginBottom: '24px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface-3)', border: '1px solid var(--color-border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>Transaction Sécurisée Mobile Money</strong>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Pour activer automatiquement votre accès, veuillez transférer <strong>{discount > 0 ? formatPrice(getFinalPrice(selectedPlan)) : getPrice(selectedPlan)} FCFA</strong> sur l'un de nos comptes marchands officiels :
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #FF7900' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF7900' }}></div>
                    <span style={{ fontWeight: 600 }}>Orange Money</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000' }}>06 13 90 16</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #005A9E' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#005A9E' }}></div>
                    <span style={{ fontWeight: 600 }}>Moov Money</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000' }}>62 20 28 77</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Confirmation de la transaction</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Validation Automatique ⚡</span>
              </label>
              
              <div style={{
                position: 'relative',
                border: '2px dashed var(--primary-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '32px 20px',
                textAlign: 'center',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '8px'
              }} className="hover-lift">
                
                <input 
                  type="file" 
                  accept="image/*"
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer', zIndex: 10
                  }}
                  disabled={paying}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    setPaying(true);
                    try {
                      const base64Image = await compressImage(file);
                      const Tesseract = (await import('tesseract.js')).default;
                      const result = await Tesseract.recognize(file, 'fra');
                      const text = result.data.text.toLowerCase();
                      
                      const finalPrice = discount > 0 ? getFinalPrice(selectedPlan) : getNumericPrice(selectedPlan);
                      const finalPriceStr = formatPrice(finalPrice);
                      const amountStr = String(finalPrice);
                      
                      const amountMatch = text.includes(amountStr) || text.replace(/\s|\./g, '').includes(amountStr);
                      const status = amountMatch ? 'approved' : 'pending';

                      await addDoc(collection(db, 'payment_requests'), {
                        userId: user.uid,
                        userEmail: user.email,
                        userName: user.displayName || user.email.split('@')[0],
                        planId: selectedPlan.id,
                        planName: selectedPlan.name,
                        amount: finalPriceStr,
                        couponCode: appliedCoupon?.code || null,
                        discountPercent: discount || 0,
                        screenshot: base64Image,
                        ocrText: text,
                        status: status,
                        createdAt: new Date().toISOString()
                      });

                      if (amountMatch) {
                        await activateOwnSubscription(user.uid, subscriptionDays(selectedPlan));
                        if (appliedCoupon && discount > 0) {
                          try {
                            await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
                              uses: (appliedCoupon.uses || 0) + 1,
                            });
                          } catch (e) {
                            console.error('Incrément uses coupon échoué:', e);
                          }
                        }
                        track('subscribe', { planId: selectedPlan?.id });
                        showAlert("✅ Transaction validée ! Votre accès premium est désormais actif.", "Paiement Confirmé", () => {
                          setShowPayModal(false);
                          router.push('/dashboard');
                        });
                      } else {
                        showAlert("⏳ Nous vérifions manuellement votre transaction. Votre compte sera activé d'ici quelques minutes.", "Validation en cours", () => {
                          setShowPayModal(false);
                          router.push('/dashboard');
                        });
                      }
                    } catch (err) {
                      console.error(err);
                      showAlert("Impossible de lire l'image. Un agent va valider manuellement.", "Vérification manuelle");
                    } finally {
                      setPaying(false);
                    }
                  }}
                />
                
                <div style={{ pointerEvents: 'none' }}>
                  {paying ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <span className="loader"></span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Vérification sécurisée en cours...</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
                        Sélectionnez le reçu SMS (Capture d'écran)
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Notre système identifiera la transaction et activera votre compte en 10s.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {paying && (
              <div className="text-center" style={{ padding: '20px 0' }}>
                <span className="loader" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }}></span>
                <p className="text-sm text-gold">L'Intelligence Artificielle analyse votre reçu, veuillez patienter...</p>
              </div>
            )}
            
            <p className="text-xs text-muted text-center" style={{ marginTop: '16px' }}>
              En cas de difficulté, contactez-nous au 06 13 90 16
            </p>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card animate-popIn" style={{ 
            width: '100%', maxWidth: '400px',
            border: '1px solid var(--color-border)', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center', padding: '30px 20px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>
              {alertModal.title.includes('Erreur') ? '⚠️' : alertModal.title.includes('Succès') ? '🎉' : 'ℹ️'}
            </div>
            <h3 className="heading-md" style={{ marginBottom: '12px' }}>{alertModal.title}</h3>
            <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
              {alertModal.message}
            </p>
            <button 
              onClick={closeAlert} 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Compris, merci
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
