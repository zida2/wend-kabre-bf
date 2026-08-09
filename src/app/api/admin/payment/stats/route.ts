import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';
import { authorizeAdminProxy } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const EMPTY_STATS = {
  totalTransactions: 0,
  totalRevenue: 0,
  successfulPayments: 0,
  failedPayments: 0,
  pendingPayments: 0,
  conversionRatePercentage: 0,
  activeSubscriptions: 0,
};

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminProxy(req);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error, stats: EMPTY_STATS },
      { status: auth.status }
    );
  }

  try {
    const statsResult = await paymentServiceClient.getPaymentStats(auth.authHeader);
    return NextResponse.json(statsResult, { status: 200 });
  } catch (error: any) {
    console.error('Erreur récupération statistiques administrateur:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Échec récupération des statistiques.',
        stats: EMPTY_STATS,
      },
      { status: 502 }
    );
  }
}
