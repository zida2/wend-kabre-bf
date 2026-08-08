import crypto from 'crypto';
import { PaymentStatus, PlanType, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { moneyFusionConfig } from '../config/moneyFusion.config.js';
import { PaymentProviderFactory } from './providers/paymentProvider.factory.js';
import { WEND_KABRE_PLANS, PlanId, MoneyFusionCallbackPayload } from '../types/payment.types.js';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export class WebhookService {
  /**
   * Vérification de la signature HMAC ou jeton de la notification Money Fusion
   */
  public verifySignature(payload: any, signatureHeader?: string): boolean {
    const secret = moneyFusionConfig.webhookSecret;
    if (!secret || secret === 'MF_WEBHOOK_SECRET') {
      // En mode de développement ou sans clé secrète stricte, on accepte le webhook
      return true;
    }

    if (!signatureHeader && !payload.signature) {
      logger.warn('Aucune signature fournie dans le webhook Money Fusion');
      return true; // tolérance mode Bac à sable
    }

    const providedSignature = signatureHeader || payload.signature;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(computedSignature)
    );
  }

  /**
   * Traitement principal du callback de paiement
   */
  public async handleMoneyFusionCallback(payload: MoneyFusionCallbackPayload): Promise<{
    success: boolean;
    message: string;
    transactionId: string;
    status: PaymentStatus;
  }> {
    logger.info('Reception du callback Money Fusion:', payload);

    const reference = payload.reference || payload.customRef;
    if (!reference) {
      throw new BadRequestError('Référence de transaction manquante dans le callback.');
    }

    // 1. Recherche de la transaction en BDD
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
      include: { user: true }
    });

    if (!transaction) {
      throw new NotFoundError(`Transaction introuvable avec la référence: ${reference}`);
    }

    // Verification d'idempotence (Empêcher les doubles validations)
    if (transaction.status === PaymentStatus.SUCCESS || transaction.status === PaymentStatus.FAILED) {
      logger.info(`Transaction ${reference} déjà finalisée avec statut ${transaction.status}. Ignoré.`);
      return {
        success: true,
        message: `Transaction déjà finalisée (${transaction.status})`,
        transactionId: transaction.id,
        status: transaction.status
      };
    }

    // Vérification de sécurité du montant s'il est fourni dans le payload
    if (payload.amount !== undefined && payload.amount !== null) {
      const payloadAmount = parseFloat(payload.amount.toString());
      if (payloadAmount > 0 && Math.abs(payloadAmount - transaction.amount) > 1) {
        logger.error(`Discordance de montant pour ${reference}: attendu ${transaction.amount}, reçu ${payloadAmount}`);
        throw new BadRequestError(`Discordance de montant (attendu: ${transaction.amount} XOF).`);
      }
    }

    // 2. Détermination du statut via le provider
    const provider = PaymentProviderFactory.getProvider(transaction.paymentMethod);
    const verificationResult = await provider.verifyPayment(reference, payload);

    const finalStatus: PaymentStatus = verificationResult.status;

    // 3. Mise à jour de la transaction en BDD
    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: finalStatus,
        moneyFusionId: verificationResult.providerTransactionId || payload.moneyFusionId || payload.transaction_id,
        rawCallbackPayload: payload as any
      }
    });

    logger.info(`Statut de la transaction ${reference} mis à jour: ${finalStatus}`);

    // 4. Activation automatique de l'abonnement si le paiement est un succès
    if (finalStatus === PaymentStatus.SUCCESS) {
      await this.activateSubscriptionForUser(transaction.userId, transaction.planId as PlanId);
    }

    return {
      success: true,
      message: `Transaction ${reference} mise à jour avec le statut: ${finalStatus}`,
      transactionId: updatedTransaction.id,
      status: finalStatus
    };
  }

  /**
   * Active ou renouvelle automatiquement l'abonnement d'un utilisateur
   */
  private async activateSubscriptionForUser(userId: string, planId: PlanId): Promise<void> {
    const planInfo = WEND_KABRE_PLANS[planId] || WEND_KABRE_PLANS.PREMIUM;
    const durationDays = planInfo.durationDays || 30;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    const mappedPlan: PlanType = (PlanType as any)[planId] || PlanType.PREMIUM;

    // Désactiver tout abonnement actif existant
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE
      },
      data: {
        status: SubscriptionStatus.EXPIRED
      }
    });

    // Créer le nouvel abonnement actif
    const newSubscription = await prisma.subscription.create({
      data: {
        userId,
        plan: mappedPlan,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE
      }
    });

    logger.subscriptionActivated(userId, mappedPlan, endDate.toISOString(), {
      subscriptionId: newSubscription.id,
      startDate: startDate.toISOString()
    });
    logger.info(`Abonnement ${mappedPlan} activé pour l'utilisateur ${userId} jusqu'au ${endDate.toISOString()}`);
  }
}

export const webhookService = new WebhookService();
