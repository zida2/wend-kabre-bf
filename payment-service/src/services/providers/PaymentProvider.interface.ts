import { PaymentStatus } from '@prisma/client';

export interface CreatePaymentParams {
  userId: string;
  email: string;
  phone?: string;
  amount: number;
  reference: string;
  planId: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentUrl: string;
  providerTransactionId?: string;
  message?: string;
  rawResponse?: any;
}

export interface VerifyPaymentResult {
  success: boolean;
  status: PaymentStatus;
  reference: string;
  providerTransactionId?: string;
  amount?: number;
  rawResponse?: any;
}

export interface IPaymentProvider {
  readonly name: string;

  /**
   * Initialise un paiement auprès du fournisseur externe
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * Vérifie le statut d'un paiement après notification callback ou vérification manuelle
   */
  verifyPayment(reference: string, payload?: any): Promise<VerifyPaymentResult>;
}
