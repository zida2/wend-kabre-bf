// POST /api/subscription/webhook
// Money Fusion webhook callback - receives payment notifications

import { getAdminDb } from '@/lib/firebaseAdmin';

const PLANS = {
  premium: { id: 'premium', duration: 30 },
  pro: { id: 'pro', duration: 30 },
};

export async function POST(request) {
  try {
    const payload = await request.json();

    console.log('[Webhook] Money Fusion notification received:', {
      event: payload.event,
      tokenPay: payload.tokenPay,
      status: payload.statut,
      amount: payload.Montant,
    });

    // Validate webhook structure
    if (!payload || !payload.tokenPay) {
      console.error('[Webhook] Invalid payload - missing tokenPay');
      return Response.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return Response.json({ ok: false, error: 'Database not available' }, { status: 500 });
    }

    // Find transaction by token
    const transactionsRef = adminDb.collection('transactions');
    const snapshot = await transactionsRef.where('tokenPay', '==', payload.tokenPay).get();

    if (snapshot.empty) {
      console.warn('[Webhook] Transaction not found for token:', payload.tokenPay);
      return Response.json({ ok: false, error: 'Transaction not found' }, { status: 404 });
    }

    const transactionDoc = snapshot.docs[0];
    const transactionData = transactionDoc.data();
    const transactionId = transactionDoc.id;
    const { userId, planId } = transactionData;

    // Handle different event types
    if (payload.event === 'payin.session.completed') {
      console.log('[Webhook] Payment completed:', transactionId);

      // Update transaction
      await transactionDoc.ref.update({
        status: 'completed',
        completedAt: new Date().toISOString(),
        paymentMethod: payload.moyen || 'unknown',
        numeroTransaction: payload.numeroTransaction,
      });

      // Update user subscription
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error('[Webhook] User not found:', userId);
        return Response.json({ ok: false, error: 'User not found' }, { status: 404 });
      }

      const planInfo = PLANS[planId];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + planInfo.duration * 24 * 60 * 60 * 1000);

      // Create or update subscription
      const subscriptionRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('subscriptions')
        .doc('current');

      await subscriptionRef.set(
        {
          plan: planId,
          planName: transactionData.plan,
          status: 'active',
          startDate: now.toISOString(),
          endDate: expiresAt.toISOString(),
          renewalDate: expiresAt.toISOString(),
          transactionId,
          lastPayment: now.toISOString(),
          autoRenew: true,
        },
        { merge: true }
      );

      // Update user's main plan field
      await userRef.update({
        plan: planId,
        planName: transactionData.plan,
        isSubscribed: true,
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: expiresAt.toISOString(),
        lastPaymentDate: now.toISOString(),
      });

      // Send confirmation email (optional - can be implemented later)
      console.log('[Webhook] Subscription activated:', {
        userId,
        plan: planId,
        expiresAt: expiresAt.toISOString(),
      });

      return Response.json({ ok: true, message: 'Payment completed' }, { status: 200 });
    }

    if (payload.event === 'payin.session.pending') {
      console.log('[Webhook] Payment pending:', transactionId);
      // Update transaction status to pending
      await transactionDoc.ref.update({
        status: 'pending',
      });

      return Response.json({ ok: true, message: 'Payment pending' }, { status: 200 });
    }

    if (payload.event === 'payin.session.cancelled') {
      console.log('[Webhook] Payment cancelled:', transactionId);
      // Update transaction status to failed
      await transactionDoc.ref.update({
        status: 'failed',
        completedAt: new Date().toISOString(),
      });

      return Response.json({ ok: true, message: 'Payment cancelled' }, { status: 200 });
    }

    // Unknown event type
    console.warn('[Webhook] Unknown event type:', payload.event);
    return Response.json({ ok: true, message: 'Event received' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return Response.json(
      { ok: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      message: 'Money Fusion Webhook Endpoint',
      method: 'POST',
      expectedPayload: {
        event: 'payin.session.completed | payin.session.pending | payin.session.cancelled',
        tokenPay: 'Money Fusion payment token',
        Montant: 'Transaction amount',
        moyen: 'Payment method',
      },
    },
    { status: 200 }
  );
}
