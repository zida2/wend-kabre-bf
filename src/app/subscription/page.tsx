'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SubscriptionData {
  id?: string;
  userId: string;
  plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate?: string | null;
  endDate?: string | null;
  features: string[];
  lastTransaction?: {
    id: string;
    reference: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    planId: string;
    updatedAt: string;
  } | null;
}

const WEND_KABRE_PLANS: Record<string, { name: string; price: number; description: string; features: string[] }> = {
  FREE: {
    name: 'Découverte',
    price: 0,
    description: 'Accès limité pour découvrir la plateforme',
    features: ['Consultation limitée des marchés publics']
  },
  PREMIUM: {
    name: 'Plan Premium',
    price: 15000,
    description: 'Pour les entreprises et entrepreneurs individuels',
    features: [
      'Accès complet à tous les appels d\'offres',
      'Téléchargement direct des dossiers PDF',
      'Alertes personnalisées en temps réel'
    ]
  },
  ENTERPRISE: {
    name: 'Plan Entreprise',
    price: 55000,
    description: 'Pour les grands comptes et équipes de réponse',
    features: [
      'Jusqu\'à 10 collaborateurs inclus',
      'Statistiques et analyses avancées',
      'Support prioritaire 24h/24 & 7j/7'
    ]
  }
};

function getCurrentFirebaseUser(): Promise<{ uid: string; email: string | null; displayName: string | null; phoneNumber: string | null } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const w: any = window;
    const auth = w.firebase_auth_module?.auth || w.firebase_app_module?.auth;
    if (auth) {
      const current = auth.currentUser;
      if (current) {
        resolve({ uid: current.uid, email: current.email, displayName: current.displayName, phoneNumber: current.phoneNumber });
        return;
      }
      const unsub = auth.onAuthStateChanged((u: any) => {
        unsub && unsub();
        if (u) resolve({ uid: u.uid, email: u.email, displayName: u.displayName, phoneNumber: u.phoneNumber });
        else resolve(null);
      });
      return;
    }
    resolve(null);
  });
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pollingActive, setPollingActive] = useState<boolean>(false);

  const fetchSubscription = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(uid)}`);
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (err: any) {
      console.error('Erreur chargement abonnement:', err);
      setErrorMessage('Impossible de charger votre abonnement pour le moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const user = await getCurrentFirebaseUser();
      const effectiveUserId = user?.uid || 'usr_demo_123';
      setCurrentUser(user);
      await fetchSubscription(effectiveUserId);

      if (refParam) {
        setPollingActive(true);
      }
    }
    init();
  }, [fetchSubscription, refParam]);

  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(async () => {
      const uid = currentUser?.uid || 'usr_demo_123';
      try {
        const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(uid)}`);
        const data = await res.json();
        if (data.success) {
          setSubscription(data.subscription);
          if (data.subscription.status === 'ACTIVE' && data.subscription.plan !== 'FREE') {
            setPollingActive(false);
          }
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingActive, currentUser]);

  const handleCheckout = async (planId: 'PREMIUM' | 'ENTERPRISE') => {
    setCheckoutLoading(planId);
    setErrorMessage(null);

    try {
      const uid = currentUser?.uid || 'usr_demo_123';
      const email = currentUser?.email || 'entreprise@burkina.bf';
      const phone = currentUser?.phoneNumber || '+22670000000';

      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, email, phone, planId })
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setErrorMessage(data.error || 'Impossible d\'initialiser le paiement.');
      }
    } catch (err: any) {
      setErrorMessage('Une erreur est survenue lors de la communication avec le serveur.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getStatusBadge = (s?: string) => {
    if (s === 'ACTIVE') return { text: '● Actif', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' };
    if (s === 'EXPIRED') return { text: '● Expiré', cls: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' };
    if (s === 'CANCELLED') return { text: '● Annulé', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' };
    return { text: '● Inconnu', cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' };
  };

  const activePlanInfo = subscription?.plan ? WEND_KABRE_PLANS[subscription.plan] : WEND_KABRE_PLANS.FREE;
  const statusBadge = getStatusBadge(subscription?.status);

  const isRenewable = subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELLED' || (subscription?.plan === 'FREE');
  const isActivePaid = subscription?.status === 'ACTIVE' && subscription?.plan !== 'FREE';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
            Gestion de votre Abonnement
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Centralisez et gérez vos accès aux marchés publics du Burkina Faso avec la plateforme SaaS Wend-Kabré.
          </p>
        </div>

        {refParam && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-4 rounded-xl text-center">
            🔔 Paiement en cours de finalisation — référence <code className="font-mono">{refParam}</code>.
            Mise à jour automatique de votre abonnement d'ici quelques secondes...
          </div>
        )}

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <svg className="w-32 h-32 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                Plan Actuel
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">
                {loading ? 'Chargement...' : activePlanInfo.name}
              </h2>
              {currentUser && (
                <p className="text-xs text-slate-500 mt-1">{currentUser.email}</p>
              )}
            </div>
            {subscription && (
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge.cls}`}>
                {statusBadge.text}
              </span>
            )}
          </div>

          {subscription?.endDate && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
              <span>Date d'expiration :</span>
              <span className="font-semibold text-amber-300">
                {new Date(subscription.endDate).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
          )}

          {subscription?.lastTransaction && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 mb-6 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Dernière transaction</span>
                <span className="font-mono text-slate-200">{subscription.lastTransaction.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant</span>
                <span className="font-semibold text-slate-200">{subscription.lastTransaction.amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut</span>
                <span className={subscription.lastTransaction.status === 'SUCCESS' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {subscription.lastTransaction.status}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avantages Inclus :</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {(subscription?.features || activePlanInfo.features).map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {isActivePaid && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleCheckout(subscription!.plan as any)}
                disabled={!!checkoutLoading}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
              >
                {checkoutLoading === subscription?.plan ? 'Initialisation...' : '🔄 Renouveler mon abonnement'}
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-4 rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Changer ou souscrire à un plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Plan Premium</h3>
                <p className="text-slate-400 text-xs mb-4">{WEND_KABRE_PLANS.PREMIUM.description}</p>
                <div className="text-3xl font-extrabold text-amber-400 mb-4">
                  {WEND_KABRE_PLANS.PREMIUM.price.toLocaleString('fr-FR')} FCFA <span className="text-xs text-slate-400 font-normal">/ mois</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {WEND_KABRE_PLANS.PREMIUM.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">✓ {f}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('PREMIUM')}
                disabled={checkoutLoading === 'PREMIUM'}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
              >
                {isRenewable ? 'Souscrire au Premium' : checkoutLoading === 'PREMIUM' ? 'Initialisation...' : 'Passer au Plan Premium'}
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Plan Entreprise</h3>
                <p className="text-slate-400 text-xs mb-4">{WEND_KABRE_PLANS.ENTERPRISE.description}</p>
                <div className="text-3xl font-extrabold text-cyan-400 mb-4">
                  {WEND_KABRE_PLANS.ENTERPRISE.price.toLocaleString('fr-FR')} FCFA <span className="text-xs text-slate-400 font-normal">/ mois</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {WEND_KABRE_PLANS.ENTERPRISE.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">✓ {f}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('ENTERPRISE')}
                disabled={checkoutLoading === 'ENTERPRISE'}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50"
              >
                {isRenewable ? 'Souscrire Entreprise' : checkoutLoading === 'ENTERPRISE' ? 'Initialisation...' : 'Passer au Plan Entreprise'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <Link href="/tarifs" className="hover:text-slate-300 transition-colors">← Voir toutes les offres</Link>
          <span>•</span>
          <Link href="/marches" className="hover:text-slate-300 transition-colors">Accéder aux marchés →</Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="loader" style={{ width: '42px', height: '42px' }}></div>
          <p className="text-slate-400 mt-4 text-sm">Chargement de votre abonnement…</p>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}
