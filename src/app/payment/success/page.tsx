'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refParam = searchParams.get('ref');
  const statusParam = searchParams.get('status');

  const [confirming, setConfirming] = useState<boolean>(true);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(8);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setConfirming(false);
      setConfirmed(true);
    }, 1800);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    if (countdown <= 0) {
      const target = refParam ? `/subscription?ref=${encodeURIComponent(refParam)}` : '/subscription';
      router.replace(target);
      return;
    }
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [confirmed, countdown, refParam, router]);

  const subscriptionHref = refParam
    ? `/subscription?ref=${encodeURIComponent(refParam)}`
    : '/subscription';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl animate-fade-in relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10 relative">
          {confirming ? (
            <svg className="w-10 h-10 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-emerald-400 animate-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {confirming ? 'Activation en cours...' : 'Abonnement Activé !'}
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {confirming
            ? 'Nous finalisons votre abonnement. Merci de patienter quelques secondes.'
            : 'Votre paiement Money Fusion a été validé avec succès. Votre accès Premium Wend-Kabré est maintenant actif.'}
        </p>

        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-8 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Statut</span>
            <span className="font-semibold text-emerald-400">
              {confirmed ? '✓ Actif (30 Jours)' : 'En attente de validation'}
            </span>
          </div>
          {refParam && (
            <div className="flex justify-between">
              <span className="text-slate-500">Référence</span>
              <span className="font-mono text-amber-300">{refParam}</span>
            </div>
          )}
          {statusParam && (
            <div className="flex justify-between">
              <span className="text-slate-500">Retour Money Fusion</span>
              <span className="font-semibold text-slate-200">{statusParam}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Avantages</span>
            <span className="text-slate-200">Accès complet + Téléchargement PDF</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/marches"
            className="block w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
          >
            Consulter les Marchés Publics
          </Link>
          <Link
            href={subscriptionHref}
            className="block w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            {confirmed
              ? `Voir les détails de mon abonnement (redirection automatique dans ${countdown}s)`
              : 'Voir les détails de mon abonnement'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="loader" style={{ width: '42px', height: '42px' }}></div>
          <p className="text-slate-400 mt-4 text-sm">Chargement…</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
