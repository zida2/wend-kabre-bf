const PAYMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 
  process.env.PAYMENT_SERVICE_URL || 
  'https://payment-service-1-sex9.onrender.com';

export interface CreatePaymentParams {
  userId: string;
  email: string;
  phone?: string;
  amount: number;
  planId: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
}

export interface CreatePaymentResult {
  success: boolean;
  paymentUrl: string;
  transactionId: string;
  reference: string;
  message?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  transaction: {
    id: string;
    reference: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    planId: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SubscriptionResult {
  success: boolean;
  subscription: {
    id?: string;
    userId: string;
    plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    startDate: string | null;
    endDate: string | null;
    features: string[];
    lastTransaction?: {
      id: string;
      reference: string;
      amount: number;
      status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      planId: string;
      updatedAt: string;
    } | null;
  };
}

export interface PaymentStatsResult {
  success: boolean;
  stats: {
    totalTransactions: number;
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    conversionRatePercentage: number;
    activeSubscriptions: number;
  };
}

async function safeFetchJSON(input: RequestInfo | URL, init?: RequestInit & { timeout?: number }) {
  const controller = (init?.timeout !== undefined) ? new AbortController() : undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (controller && init?.timeout !== undefined) {
    timeoutId = setTimeout(() => controller.abort(), init.timeout);
  }
  try {
    const res = await fetch(input, {
      ...init,
      signal: controller?.signal,
    });
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const err = new Error(msg) as Error & { response?: { data: any; status: number } };
      err.response = { data, status: res.status };
      throw err;
    }
    return data;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Délai dépassé (timeout) en appelant le service de paiement.');
    }
    throw e;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export class PaymentServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PAYMENT_SERVICE_URL.replace(/\/$/, '');
  }

  /**
   * Initialise un paiement via le microservice payment-service
   */
  public async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      const data = await safeFetchJSON(`${this.baseUrl}/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        timeout: 15000,
      });
      return data as CreatePaymentResult;
    } catch (error: any) {
      console.error('[PaymentServiceClient] Erreur lors de createPayment:', error?.response?.data || error.message);
      throw new Error(
        error?.response?.data?.error || 'Échec de la communication avec le service de paiement.'
      );
    }
  }

  /**
   * Récupère le statut d'une transaction par référence
   */
  public async getPaymentStatus(reference: string): Promise<PaymentStatusResult> {
    try {
      const data = await safeFetchJSON(
        `${this.baseUrl}/api/payment/status/${encodeURIComponent(reference)}`,
        { timeout: 10000 }
      );
      return data as PaymentStatusResult;
    } catch (error: any) {
      console.error('[PaymentServiceClient] Erreur lors de getPaymentStatus:', error?.response?.data || error.message);
      throw new Error(
        error?.response?.data?.error || 'Impossible de récupérer le statut du paiement.'
      );
    }
  }

  /**
   * Récupère les statistiques de paiement pour le dashboard administrateur
   */
  public async getPaymentStats(authToken?: string): Promise<PaymentStatsResult> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      }

      const data = await safeFetchJSON(`${this.baseUrl}/api/payment/stats`, {
        headers,
        timeout: 10000,
      });
      return data as PaymentStatsResult;
    } catch (error: any) {
      console.error('[PaymentServiceClient] Erreur lors de getPaymentStats:', error?.response?.data || error.message);
      throw new Error(
        error?.response?.data?.error || 'Impossible de charger les statistiques de paiement.'
      );
    }
  }

  public async getUserSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      const data = await safeFetchJSON(
        `${this.baseUrl}/api/payment/subscription/${encodeURIComponent(userId)}`,
        { timeout: 10000 }
      );
      return data as SubscriptionResult;
    } catch (error: any) {
      console.error('[PaymentServiceClient] Erreur lors de getUserSubscription:', error?.response?.data || error.message);
      throw new Error(
        error?.response?.data?.error || 'Impossible de charger l\'abonnement utilisateur.'
      );
    }
  }

  /**
   * Proxy GET vers le microservice payment-service (routes /api/admin/*)
   * Utilisé par le Next.js Dashboard Admin pour relayer les appels.
   */
  async proxyGET(path: string, authHeader?: string): Promise<any> {
    const base = (process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const res = await fetch(base + path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      cache: 'no-store'
    });
    let json: any;
    try {
      json = await res.json();
    } catch {
      json = { success: false, error: 'Réponse non-JSON du service paiement.' };
    }
    if (!res.ok && !json) {
      throw new Error(`HTTP ${res.status}: échec proxy paiement`);
    }
    return json;
  }
}

export const paymentServiceClient = new PaymentServiceClient();
