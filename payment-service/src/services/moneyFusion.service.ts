import { MoneyFusionProvider } from './providers/MoneyFusionProvider.js';
import { CreatePaymentParams, CreatePaymentResult, VerifyPaymentResult } from './providers/PaymentProvider.interface.js';

export class MoneyFusionService {
  private provider: MoneyFusionProvider;

  constructor() {
    this.provider = new MoneyFusionProvider();
  }

  public async initiatePayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    return this.provider.createPayment(params);
  }

  public async verifyPaymentStatus(reference: string, payload?: any): Promise<VerifyPaymentResult> {
    return this.provider.verifyPayment(reference, payload);
  }
}

export const moneyFusionService = new MoneyFusionService();
