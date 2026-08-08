import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { PaymentProviderFactory } from './providers/paymentProvider.factory.js';
import {
  CreatePaymentInput,
  CreatePaymentResponse,
  PaymentStatsResponse,
  WEND_KABRE_PLANS,
  PlanId
} from '../types/payment.types.js';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export class PaymentService {
  /**
   * Génère une référence de paiement unique pour Wend-Kabré
   */
  private generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `WK-PAY-${timestamp}-${randomHex}`;
  }

  /**
   * Assure qu'un utilisateur existe en base de données avant la création du paiement
   */
  private async ensureUserExists(userId: string, email: string, phone?: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          phone
        }
      });
      logger.info(`Nouvel utilisateur ${email} (${userId}) créé en base de données.`);
    } else if (phone && existingUser.phone !== phone) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone }
      });
    }
  }

  /**
   * 1. Création d'un paiement et enregistrement de la transaction
   */
  public async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResponse> {
    const { userId, email, phone, amount, planId } = input;

    // Validation du plan
    if (!WEND_KABRE_PLANS[planId]) {
      throw new BadRequestError(`Le plan '${planId}' n'est pas un plan valide (FREE, PREMIUM, ENTERPRISE).`);
    }

    const expectedPrice = WEND_KABRE_PLANS[planId].price;
    if (amount <= 0 || (expectedPrice > 0 && amount < expectedPrice)) {
      throw new BadRequestError(
        `Le montant de ${amount} XOF ne correspond pas au montant du plan ${planId} (${expectedPrice} XOF).`
      );
    }

    // 1. Garantir l'existence de l'utilisateur
    await this.ensureUserExists(userId, email, phone);

    // 2. Générer la référence unique
    const reference = this.generateReference();

    // 3. Enregistrer la transaction initiale en statut PENDING
    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId,
        reference,
        amount,
        planId,
        status: PaymentStatus.PENDING,
        paymentMethod: 'MONEY_FUSION'
      }
    });

    logger.info(`Transaction ${reference} enregistrée en BDD avec statut PENDING pour l'utilisateur ${userId}`);

    // 4. Appeler le fournisseur Money Fusion
    const provider = PaymentProviderFactory.getProvider('MONEY_FUSION');
    const providerResult = await provider.createPayment({
      userId,
      email,
      phone,
      amount,
      reference,
      planId
    });

    // 5. Mettre à jour la transaction avec l'ID fournisseur si disponible
    if (providerResult.providerTransactionId) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { moneyFusionId: providerResult.providerTransactionId }
      });
    }

    return {
      success: true,
      paymentUrl: providerResult.paymentUrl,
      transactionId: transaction.id,
      reference,
      message: providerResult.message || 'Lien de paiement généré avec succès'
    };
  }

  /**
   * Récupérer les détails d'une transaction par sa référence
   */
  public async getTransactionByReference(reference: string) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
      include: { user: true }
    });

    if (!transaction) {
      throw new NotFoundError(`Aucune transaction trouvée pour la référence: ${reference}`);
    }

    return transaction;
  }

  /**
   * 9. Calcul des statistiques pour le Dashboard Administrateur
   */
  public async getPaymentStats(): Promise<PaymentStatsResponse> {
    const totalTransactions = await prisma.paymentTransaction.count();

    const successfulPayments = await prisma.paymentTransaction.count({
      where: { status: PaymentStatus.SUCCESS }
    });

    const failedPayments = await prisma.paymentTransaction.count({
      where: { status: PaymentStatus.FAILED }
    });

    const pendingPayments = await prisma.paymentTransaction.count({
      where: { status: PaymentStatus.PENDING }
    });

    // Somme des revenus générés par les paiements réussis
    const revenueAggregate = await prisma.paymentTransaction.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true }
    });

    const totalRevenue = revenueAggregate._sum.amount || 0;

    const conversionRatePercentage = totalTransactions > 0
      ? Number(((successfulPayments / totalTransactions) * 100).toFixed(2))
      : 0;

    const activeSubscriptions = await prisma.subscription.count({
      where: { status: SubscriptionStatus.ACTIVE }
    });

    return {
      totalTransactions,
      totalRevenue,
      successfulPayments,
      failedPayments,
      pendingPayments,
      conversionRatePercentage,
      activeSubscriptions
    };
  }

  public async getUserSubscription(userId: string) {
    const active = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'EXPIRED', 'CANCELLED'] }
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    const now = new Date();
    let computedStatus = active?.status || null;
    if (active && active.status === 'ACTIVE' && active.endDate < now) {
      computedStatus = 'EXPIRED' as any;
      try {
        await prisma.subscription.update({
          where: { id: active.id },
          data: { status: 'EXPIRED' as any }
        });
        logger.subscriptionExpired(userId, active.id);
      } catch (e) { /* silent */ }
    }

    const lastTransaction = await prisma.paymentTransaction.findFirst({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }]
    });

    const planFeaturesByPlan: Record<string, string[]> = {
      FREE: [
        'Consultation limitée des marchés publics'
      ],
      PREMIUM: [
        'Accès complet aux marchés publics du Burkina Faso',
        'Téléchargement illimité des DCE / PDF',
        'Alertes e-mail et WhatsApp instantanées'
      ],
      ENTERPRISE: [
        'Toutes les fonctionnalités Premium',
        'Jusqu\'à 10 collaborateurs inclus',
        'Statistiques et analyses avancées',
        'Support prioritaire 24/7'
      ]
    };

    if (!active) {
      return {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: null,
        endDate: null,
        features: planFeaturesByPlan.FREE,
        lastTransaction: lastTransaction ? {
          id: lastTransaction.id,
          reference: lastTransaction.reference,
          amount: lastTransaction.amount,
          status: lastTransaction.status,
          planId: lastTransaction.planId,
          updatedAt: lastTransaction.updatedAt
        } : null
      };
    }

    return {
      id: active.id,
      userId: active.userId,
      plan: active.plan,
      status: computedStatus,
      startDate: active.startDate.toISOString(),
      endDate: active.endDate.toISOString(),
      features: planFeaturesByPlan[active.plan] || planFeaturesByPlan.PREMIUM,
      lastTransaction: lastTransaction ? {
        id: lastTransaction.id,
        reference: lastTransaction.reference,
        amount: lastTransaction.amount,
        status: lastTransaction.status,
        planId: lastTransaction.planId,
        updatedAt: lastTransaction.updatedAt
      } : null
    };
  }
}

export const paymentService = new PaymentService();
