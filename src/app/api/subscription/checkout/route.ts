import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { mintServiceJwt } from '@/lib/serviceToken';
import { PLAN_PRICES } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // L'identité vient du jeton Firebase vérifié, plus du corps de la requête :
  // n'importe qui pouvait auparavant lancer un paiement au nom d'un autre
  // compte en changeant `userId`.
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Connectez-vous pour souscrire un abonnement.' },
      { status: 401 }
    );
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { success: false, error: 'Service indisponible (Admin SDK non configuré).' },
      { status: 503 }
    );
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice('Bearer '.length).trim());
  } catch {
    return NextResponse.json(
      { success: false, error: 'Session expirée, reconnectez-vous.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { phone, planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Champ requis manquant (planId).' },
        { status: 400 }
      );
    }

    // Le montant est toujours dérivé du plan côté serveur, jamais reçu du client.
    const amount = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
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
        planId: 'FREE',
      });
    }

    const email = decoded.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Aucune adresse e-mail associée à ce compte.' },
        { status: 400 }
      );
    }

    const serviceToken = mintServiceJwt({ uid: decoded.uid, email, role: 'USER' });

    const result = await paymentServiceClient.createPayment(
      { userId: decoded.uid, email, phone, amount, planId },
      `Bearer ${serviceToken}`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Erreur checkout abonnement Wend-Kabré:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Échec de l\'initialisation du paiement.' },
      { status: 502 }
    );
  }
}
