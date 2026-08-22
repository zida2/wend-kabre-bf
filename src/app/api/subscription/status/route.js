// GET /api/subscription/status?token=xxxxx
// Check payment status from Money Fusion

import axios from 'axios';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const transactionId = searchParams.get('transactionId');

    if (!token && !transactionId) {
      return Response.json(
        { error: 'Missing required parameter: token or transactionId' },
        { status: 400 }
      );
    }

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return Response.json({ error: 'Database not available' }, { status: 500 });
    }

    // If transactionId provided, check local DB
    if (transactionId) {
      const transactionDoc = await adminDb.collection('transactions').doc(transactionId).get();

      if (!transactionDoc.exists) {
        return Response.json({ error: 'Transaction not found' }, { status: 404 });
      }

      const data = transactionDoc.data();
      return Response.json(
        {
          success: true,
          transactionId,
          status: data.status,
          plan: data.plan,
          amount: data.amount,
          userId: data.userId,
          createdAt: data.createdAt,
          completedAt: data.completedAt,
          paymentMethod: data.paymentMethod,
        },
        { status: 200 }
      );
    }

    // If token provided, check with Money Fusion
    if (token) {
      try {
        const moneyFusionCheckUrl = `https://www.pay.moneyfusion.net/paiementNotif/${token}`;

        const response = await axios.get(moneyFusionCheckUrl, {
          timeout: 10000,
        });

        if (response.data && response.data.data) {
          const paymentData = response.data.data;

          // Also check our local DB
          const snapshot = await adminDb
            .collection('transactions')
            .where('tokenPay', '==', token)
            .get();

          const transaction = snapshot.empty ? null : snapshot.docs[0].data();

          return Response.json(
            {
              success: true,
              token,
              status: paymentData.statut,
              amount: paymentData.Montant,
              fees: paymentData.frais,
              paymentMethod: paymentData.moyen,
              transactionNumber: paymentData.numeroTransaction,
              createdAt: paymentData.createdAt,
              localStatus: transaction?.status || 'unknown',
              message: response.data.message,
            },
            { status: 200 }
          );
        }

        return Response.json({ error: 'Invalid Money Fusion response' }, { status: 500 });
      } catch (error) {
        console.error('[Status] Money Fusion check error:', error.message);
        return Response.json(
          {
            error: 'Failed to check payment status with Money Fusion',
            details: error.message,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('[Status] Status check error:', error);
    return Response.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
