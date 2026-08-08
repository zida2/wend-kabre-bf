'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');
  const statusParam = searchParams.get('status');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
          <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Paiement Annulé
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Votre transaction de souscription a été annulée ou interrompue. <strong>Aucun montant n&apos;a été prélevé</strong> sur votre compte Mobile Money.
        </p>

        {(refParam || statusParam) && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-8 text-left text-xs space-y-2">
            {refParam && (
              <div className="flex justify-between">
                <span className="text-slate-500">Référence</span>
                <span className="font-mono text-amber-300">{refParam}</span>
              </div>
            )}
            {statusParam && (
              <div className="flex justify-between">
                <span className="text-slate-500">Motif / Statut</span>
                <span className="text-slate-200">{statusParam}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-8 text-left text-xs text-slate-400 leading-relaxed">
          Si vous avez rencontré un problème technique lors du règlement via Orange Money, Moov Money ou Money Fusion, notre équipe est disponible pour vous assister. Un paiement interrompu peut toujours être relancé depuis la page des tarifs.
        </div>

        <div className="space-y-3">
          <Link
            href="/tarifs"
            className="block w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
          >
            Réessayer le paiement
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/subscription"
              className="block py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors text-center"
            >
              Mon abonnement
            </Link>
            <Link
              href="/marches"
              className="block py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors text-center"
            >
              Voir les marchés
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-[10px] text-slate-600 leading-relaxed">
          Une question ? Contactez le support Wend-Kabré au <strong className="text-slate-500">(+226) 06 13 90 16</strong> ou par email à <strong className="text-slate-500">contact@wend-kabre.com</strong>.
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="loader" style={{ width: '42px', height: '42px' }}></div>
          <p className="text-slate-400 mt-4 text-sm">Chargement…</p>
        </div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
