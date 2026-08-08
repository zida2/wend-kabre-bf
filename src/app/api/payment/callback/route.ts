/**
 * Route API Callback Money Fusion
 * 
 * Cette route reçoit les callbacks de redirection de Money Fusion après un paiement
 * et forward les informations vers le backend payment-service pour traitement.
 * 
 * Money Fusion redirige l'utilisateur ici avec des query params contenant:
 * - ref ou reference: ID de la transaction
 * - status ou state: Statut du paiement (SUCCESS, FAILED, CANCELLED, etc.)
 * 
 * Cette route sert de pont entre Money Fusion et notre backend Render.
 */

import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_SERVICE_URL = 
  process.env.PAYMENT_SERVICE_URL || 
  'https://payment-service-1-sex9.onrender.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Récupérer tous les query params de Money Fusion
  const ref = searchParams.get('ref') || searchParams.get('reference') || '';
  const rawStatus = String(searchParams.get('status') || searchParams.get('state') || 'UNKNOWN').toUpperCase();
  
  // Log pour debugging (à retirer en production)
  console.log('[Payment Callback] Received from Money Fusion:', {
    ref,
    status: rawStatus,
    allParams: Object.fromEntries(searchParams.entries())
  });

  // Déterminer le statut du paiement
  const isSuccess = ['SUCCESS', 'PAID', 'COMPLETED', 'OK', 'APPROVED', 'VALIDATED'].includes(rawStatus);
  const isCancelled = ['CANCELLED', 'CANCELED', 'CANCEL', 'ABORTED', 'REJECTED', 'FAILED', 'ERROR'].includes(rawStatus);
  
  // Forward vers le backend payment-service pour mise à jour de la BDD
  try {
    const backendUrl = `${PAYMENT_SERVICE_URL}/api/payment/return?${searchParams.toString()}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'User-Agent': request.headers.get('user-agent') || 'Next.js-Callback-Proxy'
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000)
    });

    // Log de la réponse backend (optionnel)
    if (!backendResponse.ok) {
      console.warn('[Payment Callback] Backend returned error:', backendResponse.status);
    }
  } catch (error) {
    // Ne pas bloquer la redirection si le backend est temporairement indisponible
    console.error('[Payment Callback] Error forwarding to backend:', error);
  }

  // Rediriger l'utilisateur vers la page appropriée du frontend
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  
  if (isSuccess) {
    // Paiement réussi → Page de succès
    const successUrl = new URL('/payment/success', baseUrl);
    successUrl.searchParams.set('ref', ref);
    successUrl.searchParams.set('status', rawStatus);
    
    return NextResponse.redirect(successUrl, { status: 302 });
  } else if (isCancelled) {
    // Paiement annulé/échoué → Page d'annulation
    const cancelUrl = new URL('/payment/cancel', baseUrl);
    cancelUrl.searchParams.set('ref', ref);
    cancelUrl.searchParams.set('status', rawStatus);
    
    return NextResponse.redirect(cancelUrl, { status: 302 });
  } else {
    // Statut inconnu → Page de succès par défaut (peut être PENDING)
    const pendingUrl = new URL('/payment/success', baseUrl);
    pendingUrl.searchParams.set('ref', ref);
    pendingUrl.searchParams.set('status', 'PENDING');
    
    return NextResponse.redirect(pendingUrl, { status: 302 });
  }
}

// Support pour les requêtes HEAD (health checks)
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
