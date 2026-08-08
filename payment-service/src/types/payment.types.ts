export type PlanId = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export interface PlanDetails {
  id: PlanId;
  name: string;
  price: number; // in XOF
  durationDays: number;
  features: string[];
}

export const WEND_KABRE_PLANS: Record<PlanId, PlanDetails> = {
  FREE: {
    id: 'FREE',
    name: 'Plan Gratuit',
    price: 0,
    durationDays: 365,
    features: ['Consultation limitée des marchés publics']
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Plan Premium',
    price: 15000, // 15,000 FCFA / mois
    durationDays: 30,
    features: [
      'Accès complet aux marchés publics',
      'Téléchargement des dossiers PDF',
      'Alertes e-mail et SMS en temps réel'
    ]
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Plan Entreprise',
    price: 55000, // 55,000 FCFA / mois
    durationDays: 30,
    features: [
      'Accès multi-utilisateurs (jusqu\'à 10 collaborateurs)',
      'Statistiques et analyses avancées',
      'Support prioritaire 24/7',
      'Alertes et exportations personnalisées'
    ]
  }
};

export interface CreatePaymentInput {
  userId: string;
  email: string;
  phone?: string;
  amount: number;
  planId: PlanId;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl: string;
  transactionId: string;
  reference: string;
  message?: string;
}

export interface MoneyFusionCallbackPayload {
  event?: string;
  token?: string;
  reference: string;
  moneyFusionId?: string;
  transaction_id?: string;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING' | 'PAID' | 'REFUNDED';
  amount: number;
  phone?: string;
  paymentMethod?: string;
  signature?: string;
  [key: string]: any;
}

export interface PaymentStatsResponse {
  totalTransactions: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  conversionRatePercentage: number;
  activeSubscriptions: number;
}
