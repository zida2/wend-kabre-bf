import { PaymentStatus } from '@prisma/client';
import {
  IPaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  VerifyPaymentResult
} from './PaymentProvider.interface.js';
import { PaymentProviderError } from '../../utils/errors.js';

export class MoovMoneyProvider implements IPaymentProvider {
  public readonly name = 'MOOV_MONEY';

  public async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    throw new PaymentProviderError(
      'Le fournisseur de paiement Moov Money n\'est pas encore configuré. Veuillez utiliser Money Fusion.'
    );
  }

  public async verifyPayment(reference: string, payload?: any): Promise<VerifyPaymentResult> {
    return {
      success: false,
      status: PaymentStatus.PENDING,
      reference,
      rawResponse: { message: 'MoovMoney provider verification pending implementation' }
    };
  }
}
