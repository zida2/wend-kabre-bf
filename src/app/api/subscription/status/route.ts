import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Le paramètre userId est obligatoire.' },
        { status: 400 }
      );
    }

    const result = await paymentServiceClient.getUserSubscription(userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[subscription/status] Erreur récupération abonnement:', error.message);

    const fallbackSubscription = {
      success: true,
      warning: 'Service de paiement temporairement indisponible. Données par défaut retournées.',
      subscription: {
        userId: (req.nextUrl.searchParams.get('userId') || 'unknown'),
        plan: 'FREE' as const,
        status: 'ACTIVE' as const,
        startDate: null,
        endDate: null,
        features: [
          'Consultation limitée des marchés publics'
        ],
        lastTransaction: null
      }
    };

    return NextResponse.json(fallbackSubscription, { status: 200 });
  }
}
