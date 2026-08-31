import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { PLAN_PRICES } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise.' },
        { status: 401 }
      );
    }

    const adminAuth = await getAdminAuth();
    const adminDb = await getAdminDb();

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Service d\'activation indisponible (Admin SDK non configuré).' },
        { status: 503 }
      );
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const email = decoded.email || '';

    const body = await req.json();
    const rawPlan = (body.plan || 'PREMIUM').toUpperCase();
    const planId = ['FREE', 'PREMIUM', 'ENTERPRISE'].includes(rawPlan) ? rawPlan : 'PREMIUM';
    const billingPeriod = body.billingPeriod === 'annual' ? 'annual' : 'monthly';
    const reference = body.reference || body.screenshotName || '';

    // Calcul sécurisé du montant serveur
    const basePrice = PLAN_PRICES[planId as keyof typeof PLAN_PRICES] || 15000;
    const officialAmount = billingPeriod === 'annual' && planId !== 'FREE'
      ? Math.round(basePrice * 12 * 0.8)
      : basePrice;

    // Calcul de l'échéance : 30 jours (mensuel) ou 365 jours (annuel)
    const days = billingPeriod === 'annual' ? 365 : 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    // 1. Créer le document d'enregistrement payment_requests
    const requestData = {
      userId,
      userEmail: email,
      plan: planId,
      billingPeriod,
      amount: officialAmount,
      reference,
      paymentMethod: 'TRANSFERT_MANUEL',
      status: 'approved',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      notes: `Transfert manuel activé automatiquement pour le plan ${planId}`
    };

    const docRef = await adminDb.collection('payment_requests').add(requestData);

    // 2. 🔥 ACTIVATION AUTOMATIQUE DE L'ABONNEMENT DANS FIRESTORE USERS/{UID}
    const userUpdate = {
      isSubscribed: true,
      plan: planId,
      subscriptionExpiresAt: expiryDate.toISOString(),
      lastPaymentDate: new Date().toISOString(),
      isTrial: false,
      subscriptionSyncedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userId).set(userUpdate, { merge: true });

    return NextResponse.json({
      success: true,
      requestId: docRef.id,
      isSubscribed: true,
      plan: planId,
      expiresAt: expiryDate.toISOString(),
      message: 'Abonnement Premium activé avec succès !'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[submit-transfer] Erreur activation automatique:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Échec de l\'activation de l\'abonnement.' },
      { status: 500 }
    );
  }
}
