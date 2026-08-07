import axios from 'axios';
import { PaymentStatus } from '@prisma/client';
import { moneyFusionConfig } from '../../config/moneyFusion.config.js';
import {
  IPaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  VerifyPaymentResult
} from './PaymentProvider.interface.js';
import { logger } from '../../utils/logger.js';
import { PaymentProviderError } from '../../utils/errors.js';

export class MoneyFusionProvider implements IPaymentProvider {
  public readonly name = 'MONEY_FUSION';

  public async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      logger.info(`Initialisation du paiement Money Fusion pour la référence: ${params.reference}`);

      const payload = {
        totalPrice: params.amount,
        articleName: `Abonnement Wend-Kabré - Plan ${params.planId}`,
        clientEmail: params.email,
        clientPhoneNumber: params.phone || '',
        customRef: params.reference,
        returnUrl: params.returnUrl || moneyFusionConfig.returnUrl,
        callbackUrl: params.callbackUrl || moneyFusionConfig.callbackUrl,
        currency: moneyFusionConfig.defaultCurrency
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${moneyFusionConfig.token}`,
        'x-api-key': moneyFusionConfig.apiKey
      };

      logger.debug('Payload transmis à l\'API Money Fusion:', payload);

      let response;
      const t0 = Date.now();
      const isProd = process.env.NODE_ENV === 'production';
      try {
        response = await axios.post(`${moneyFusionConfig.apiUrl}/payUrl`, payload, {
          headers,
          timeout: 10000
        });
        logger.moneyFusionApiCall('/payUrl', Date.now() - t0, true, { reference: params.reference });
      } catch (apiErr: any) {
        logger.moneyFusionApiCall('/payUrl', Date.now() - t0, false, {
          reference: params.reference,
          error: apiErr?.message
        });

        if (isProd) {
          logger.error(`[PRODUCTION] Échec appel Money Fusion /payUrl (ref=${params.reference}). Fallback sandbox INTERDIT en production.`);
          throw new PaymentProviderError(
            `Impossible d'initialiser le paiement Money Fusion (erreur API: ${apiErr?.message || 'inconnue'}). Veuillez réessayer ultérieurement ou contacter le support.`
          );
        }

        logger.warn('Appel API Money Fusion en mode de repli (sandbox/mock fallback - UNIQUEMENT dev/test):', apiErr.message);
        
        const mockPaymentUrl = `https://pay.moneyfusion.net/checkout?ref=${params.reference}&token=${moneyFusionConfig.token}`;
        return {
          success: true,
          paymentUrl: mockPaymentUrl,
          providerTransactionId: `MF-MOCK-${Date.now()}`,
          message: 'Paiement initialisé (Mode bac à sable Money Fusion - NE PAS UTILISER EN PRODUCTION)',
          rawResponse: { mode: 'sandbox_fallback_dev_only', reference: params.reference }
        };
      }

      const data = response.data;
      logger.info('Réponse Money Fusion reçue:', data);

      const paymentUrl = data.url || data.paymentUrl || data.urlPay || data.link;

      if (!paymentUrl) {
        throw new PaymentProviderError('L\'API Money Fusion n\'a pas retourné de lien de paiement valide.');
      }

      return {
        success: true,
        paymentUrl,
        providerTransactionId: data.transaction_id || data.token || data.id,
        rawResponse: data
      };
    } catch (error: any) {
      logger.error('Erreur lors de la création du paiement Money Fusion:', error);
      if (error instanceof PaymentProviderError) throw error;
      throw new PaymentProviderError(`Échec de la communication avec Money Fusion: ${error.message}`);
    }
  }

  public async verifyPayment(reference: string, payload?: any): Promise<VerifyPaymentResult> {
    try {
      logger.info(`Vérification de la transaction Money Fusion (${reference})`);

      if (payload) {
        const rawStatus = (payload.status || payload.event || '').toString().toUpperCase();
        let status: PaymentStatus = PaymentStatus.PENDING;

        if (['SUCCESS', 'PAID', 'COMPLETED', 'SUCCESSFUL'].includes(rawStatus)) {
          status = PaymentStatus.SUCCESS;
        } else if (['FAILED', 'FAILURE', 'ERROR'].includes(rawStatus)) {
          status = PaymentStatus.FAILED;
        } else if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(rawStatus)) {
          status = PaymentStatus.CANCELLED;
        }

        return {
          success: true,
          status,
          reference,
          providerTransactionId: payload.moneyFusionId || payload.transaction_id || payload.token,
          amount: payload.amount ? parseFloat(payload.amount) : undefined,
          rawResponse: payload
        };
      }

      // Interrogation directe de l'API de vérification Money Fusion par référence
      const headers = {
        'Authorization': `Bearer ${moneyFusionConfig.token}`,
        'x-api-key': moneyFusionConfig.apiKey
      };

      try {
        const t1 = Date.now();
        const response = await axios.get(`${moneyFusionConfig.apiUrl}/transaction/status/${reference}`, {
          headers,
          timeout: 10000
        });
        logger.moneyFusionApiCall(`/transaction/status/${reference}`, Date.now() - t1, true);

        const data = response.data;
        const rawStatus = (data.status || '').toString().toUpperCase();
        let status: PaymentStatus = PaymentStatus.PENDING;

        if (['SUCCESS', 'PAID', 'COMPLETED'].includes(rawStatus)) {
          status = PaymentStatus.SUCCESS;
        } else if (['FAILED', 'FAILURE'].includes(rawStatus)) {
          status = PaymentStatus.FAILED;
        } else if (['CANCELLED'].includes(rawStatus)) {
          status = PaymentStatus.CANCELLED;
        }

        return {
          success: true,
          status,
          reference,
          providerTransactionId: data.transaction_id || data.id,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          rawResponse: data
        };
      } catch (err: any) {
        logger.warn(`Vérification distante échouée pour ${reference}, conservation du statut courant:`, err.message);
        return {
          success: false,
          status: PaymentStatus.PENDING,
          reference,
          rawResponse: { error: err.message }
        };
      }
    } catch (error: any) {
      logger.error('Erreur lors de la vérification Money Fusion:', error);
      throw new PaymentProviderError(`Erreur vérification Money Fusion: ${error.message}`);
    }
  }
}
