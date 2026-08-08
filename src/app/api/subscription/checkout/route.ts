import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, phone, planId } = body;

    if (!userId || !email || !planId) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants (userId, email, planId).' },
        { status: 400 }
      );
    }

    // Détermination du montant selon le plan
    const planPrices: Record<string, number> = {
      FREE: 0,
      PREMIUM: 15000,
      ENTERPRISE: 55000
    };

    const amount = planPrices[planId];
    if (amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Plan invalide (choisir FREE, PREMIUM ou ENTERPRISE).' },
        { status: 400 }
      );
    }

    if (amount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Le plan gratuit ne nécessite pas de paiement.',
        planId: 'FREE'
      });
    }

    // Appel du microservice payment-service via le client interne
    const result = await paymentServiceClient.createPayment({
      userId,
      email,
      phone,
      amount,
      planId
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Erreur checkout abonnement Wend-Kabré:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Échec de l\'initialisation du paiement.' },
      { status: 500 }
    );
  }
}
