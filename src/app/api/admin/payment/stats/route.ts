import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';

const ADMIN_ALLOWED_EMAILS = new Set(['zidadesire20@gmail.com']);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || undefined;

    // ⚠️ Protection supplémentaire: Si l'appel passe par le dashboard admin côté client,
    // le JWT est fourni par le payment-service. Pour les appels directs sans JWT valide,
    // on refuse. Le payment-service validera le JWT via son middleware authenticateJWT.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Accès réservé aux administrateurs authentifiés.' },
        { status: 401 }
      );
    }

    const statsResult = await paymentServiceClient.getPaymentStats(authHeader);
    return NextResponse.json(statsResult, { status: 200 });
  } catch (error: any) {
    console.error('Erreur récupération statistiques administrateur:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Échec récupération des statistiques.',
      stats: {
        totalTransactions: 0,
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        conversionRatePercentage: 0,
        activeSubscriptions: 0
      }
    }, { status: 500 });
  }
}
