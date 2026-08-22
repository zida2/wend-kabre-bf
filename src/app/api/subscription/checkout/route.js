// POST /api/subscription/checkout
// Initiate Money Fusion payment for subscription upgrade

import { getAdminDb } from '@/lib/firebaseAdmin';
import axios from 'axios';

const MONEY_FUSION_API_URL = process.env.NEXT_PUBLIC_MONEY_FUSION_API_URL;
const PLANS = {
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 5000,
    currency: 'XOF',
    duration: 'monthly',
    features: ['Alertes illimitées', 'Analyse de documents', 'Support prioritaire'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    currency: 'XOF',
    duration: 'monthly',
    features: ['Tous Premium +', 'Génération de documents', 'Analyse de marché', 'Support 24/7'],
  },
};

export async function POST(request) {
  try {
    const { userId, planId, phoneNumber, email, returnUrl, cancelUrl } = await request.json();

    // Validation
    if (!userId || !planId || !phoneNumber || !email) {
      return Response.json(
        { error: 'Missing required fields: userId, planId, phoneNumber, email' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    if (!plan) {
      return Response.json(
        { error: `Invalid plan: ${planId}. Available: ${Object.keys(PLANS).join(', ')}` },
        { status: 400 }
      );
    }

    // Create pending transaction in Firestore
    const adminDb = await getAdminDb();
    if (!adminDb) {
      return Response.json({ error: 'Database not available' }, { status: 500 });
    }

    const transactionRef = adminDb.collection('transactions').doc();
    const transactionId = transactionRef.id;

    const transactionData = {
      userId,
      planId,
      plan: plan.name,
      amount: plan.price,
      currency: plan.currency,
      phoneNumber,
      email,
      status: 'pending',
      paymentMethod: null,
      tokenPay: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
    };

    await transactionRef.set(transactionData);

    // Prepare Money Fusion payload
    const moneyFusionPayload = {
      totalPrice: plan.price,
      article: [
        {
          [plan.id]: plan.price,
        },
      ],
      personal_info: [
        {
          userId,
          planId,
          transactionId,
        },
      ],
      numeroSend: phoneNumber,
      nomclient: email,
      return_url:
        returnUrl ||
        `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/payment/success?transaction=${transactionId}`,
      webhook_url:
        `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/subscription/webhook`,
    };

    // Call Money Fusion API
    const response = await axios.post(MONEY_FUSION_API_URL, moneyFusionPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Validate Money Fusion response
    if (!response.data || !response.data.token) {
      throw new Error('Invalid Money Fusion response');
    }

    // Update transaction with Money Fusion token
    await transactionRef.update({
      tokenPay: response.data.token,
    });

    console.log(`[Payment] Checkout initiated: ${transactionId} for ${email}`);

    return Response.json(
      {
        success: true,
        transactionId,
        token: response.data.token,
        redirectUrl: response.data.url,
        paymentUrl: response.data.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Payment] Checkout error:', error);
    return Response.json(
      {
        error: error.message || 'Payment initialization failed',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      message: 'Money Fusion Checkout Endpoint',
      method: 'POST',
      requiredFields: ['userId', 'planId', 'phoneNumber', 'email'],
      availablePlans: PLANS,
    },
    { status: 200 }
  );
}
