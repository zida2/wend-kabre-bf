import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';
import { webhookService } from '../services/webhook.service.js';
import { WebhookSecurityService } from '../services/webhookSecurity.service.js';
import { AuditLogService } from '../services/auditLog.service.js';
import { notifyAppSubscriptionChanged } from '../services/appSync.service.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import { AuditAction, WebhookEventType } from '@prisma/client';

import { extractClientIp } from '../utils/network.js';

function inferWebhookEventType(payload: any, finalStatus?: string): WebhookEventType {
  const status = (finalStatus || payload?.status || '').toString().toUpperCase();
  if (status === 'SUCCESS' || status === 'SUCCEEDED' || status === 'PAID') return WebhookEventType.PAYMENT_SUCCESS;
  if (status === 'FAILED' || status === 'FAILURE' || status === 'ERROR') return WebhookEventType.PAYMENT_FAILED;
  if (status === 'CANCELLED' || status === 'CANCELED') return WebhookEventType.PAYMENT_CANCELLED;
  return WebhookEventType.UNKNOWN;
}

export class PaymentController {
  public async createPayment(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const { email, phone, amount, planId } = req.body;

      // L'identité vient du jeton vérifié, jamais du corps de la requête :
      // cette route était ouverte, n'importe qui pouvait créer une transaction
      // — et donc une ligne `users` — au nom de n'importe quel identifiant.
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentification requise.' });
      }
      if (req.body.userId && req.body.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Le userId fourni ne correspond pas au compte authentifié.'
        });
      }

      logger.paymentCreated(userId, planId as string, Number(amount), 'init');

      const result = await paymentService.createPayment({
        userId,
        email,
        phone,
        amount: Number(amount),
        planId
      });

      logger.paymentCreated(userId, planId as string, Number(amount), result.reference);
      logger.apiSuccess('POST /api/payment/create', Date.now() - startTime, {
        userId,
        planId,
        amount,
        reference: result.reference
      });

      return res.status(201).json(result);
    } catch (error: any) {
      logger.apiError('POST /api/payment/create', error, Date.now() - startTime, {
        userId: req.body?.userId,
        planId: req.body?.planId,
        amount: req.body?.amount
      });
      next(error);
    }
  }

  public async handleCallback(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const payload = req.body;
    const rawBody = (req as any).rawBody || JSON.stringify(payload);
    const reference = payload?.reference || payload?.customRef || payload?.ref || '';
    const signatureHeader = req.headers['x-moneyfusion-signature']
      || req.headers['x-webhook-signature']
      || req.headers['signature']
      || payload?.signature
      || payload?.hmac
      || '';
    const sourceIp = extractClientIp(req);

    let webhookEventId: string | null = null;

    try {
      // ⚠️ 1) ENREGISTRER LE WEBHOOK EVENT AVANT TOUTE VALIDATION
      const existingTx = reference
        ? await prisma.paymentTransaction.findUnique({ where: { reference }, select: { id: true } }).catch(() => null)
        : null;

      const rawEvent = await prisma.webhookEvent.create({
        data: {
          eventType: WebhookEventType.UNKNOWN,
          reference: reference || null,
          paymentTransactionId: existingTx?.id || null,
          rawPayload: payload as any,
          signature: signatureHeader ? signatureHeader.toString() : null,
          sourceIp,
          hmacValidated: false,
          ipValidated: false,
          replayChecked: false,
          success: false,
          errorMessage: null,
          processedAt: null
        }
      });
      webhookEventId = rawEvent.id;

      logger.webhookReceived(reference, {
        status: payload?.status,
        amount: payload?.amount,
        moneyFusionId: payload?.moneyFusionId || payload?.transaction_id,
        webhookEventId
      });

      // 2) Récupérer les données attendues de la transaction
      const expectedTx = reference
        ? await prisma.paymentTransaction.findUnique({ where: { reference } }).catch(() => null)
        : null;
      const expectedAmount = expectedTx?.amount ? Number(expectedTx.amount) : undefined;
      const expectedCurrency = expectedTx?.currency;

      // 3) Validation complète du pipeline (async - anti-replay en BDD)
      const securityCheck = await WebhookSecurityService.validateFullPipeline(
        req,
        rawBody,
        payload,
        expectedAmount,
        expectedCurrency
      );

      // 4) Mettre à jour les flags de sécurité sur WebhookEvent
      let ipValidatedFlag = false;
      let hmacValidatedFlag = false;
      let replayCheckedFlag = false;

      if (securityCheck.valid) {
        ipValidatedFlag = true;
        hmacValidatedFlag = WebhookSecurityService.verifyHMACSignature(rawBody, payload, signatureHeader);
        replayCheckedFlag = true;
      }

      const errorMsg = securityCheck.valid ? null : (securityCheck.error || null);
      const eventTypePre = securityCheck.valid
        ? inferWebhookEventType(payload)
        : WebhookEventType.UNKNOWN;

      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          ipValidated: ipValidatedFlag,
          hmacValidated: hmacValidatedFlag,
          replayChecked: replayCheckedFlag,
          errorMessage: errorMsg,
          eventType: eventTypePre
        }
      }).catch(() => null);

      if (!securityCheck.valid) {
        logger.webhookRejected(reference, securityCheck.error || 'Validation échouée', {
          status: payload?.status,
          moneyFusionId: payload?.moneyFusionId || payload?.transaction_id,
          webhookEventId
        });
        return res.status(401).json({
          success: false,
          error: securityCheck.error || 'Webhook non valide.'
        });
      }

      // 5) Traitement métier du callback
      const result = await webhookService.handleMoneyFusionCallback(payload);

      const finalEventType = inferWebhookEventType(payload, result.status);

      // 6) Mettre à jour WebhookEvent avec statut final de succès
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          success: result.status === 'SUCCESS',
          eventType: finalEventType,
          processedAt: new Date(),
          errorMessage: result.status !== 'SUCCESS' ? `Statut final: ${result.status}` : null
        }
      }).catch(() => null);

      // 7) Audit log pour paiement validé
      if (result.status === 'SUCCESS') {
        logger.paymentValidated(reference, expectedAmount || 0, result.transactionId);
        try {
          await AuditLogService.logPaymentValidation(
            existingTx?.id || expectedTx?.id || null,
            reference,
            expectedAmount || 0,
            payload
          );
        } catch (_auditErr) { /* audit log ne doit jamais casser la réponse */ }

        // 7bis) Propager l'activation à l'application (Firestore), sans quoi
        // l'accès premium n'est accordé qu'au retour du client sur le site.
        if (expectedTx?.userId) {
          await notifyAppSubscriptionChanged(expectedTx.userId);
        }
      } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
        logger.paymentRefused(reference, expectedAmount || 0, result.status);
      }

      logger.apiSuccess('POST /api/payment/callback', Date.now() - startTime, {
        reference,
        finalStatus: result.status,
        webhookEventId
      });

      return res.status(200).json(result);
    } catch (error: any) {
      // En cas d'exception, on essaie quand même de persister l'échec dans WebhookEvent
      if (webhookEventId) {
        try {
          await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
              success: false,
              errorMessage: error?.message || 'Exception callback',
              processedAt: new Date()
            }
          }).catch(() => null);
        } catch (_) { /* ignore */ }
      }
      logger.apiError('POST /api/payment/callback', error, Date.now() - startTime, {
        reference: req.body?.reference || req.body?.customRef,
        webhookEventId
      });
      next(error);
    }
  }

  public async getStatus(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const { reference } = req.params;
      const transaction = await paymentService.getTransactionByReference(reference);

      logger.apiSuccess('GET /api/payment/status/:reference', Date.now() - startTime, {
        reference,
        status: transaction.status
      });

      return res.status(200).json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          amount: transaction.amount,
          status: transaction.status,
          planId: transaction.planId,
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      });
    } catch (error: any) {
      logger.apiError('GET /api/payment/status/:reference', error, Date.now() - startTime, {
        reference: req.params?.reference
      });
      next(error);
    }
  }

  public async getStats(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const stats = await paymentService.getPaymentStats();
      logger.apiSuccess('GET /api/payment/stats', Date.now() - startTime, {});
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error: any) {
      logger.apiError('GET /api/payment/stats', error, Date.now() - startTime, {});
      next(error);
    }
  }

  public async getSubscription(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId requis.' });
      }
      const subscription = await paymentService.getUserSubscription(userId);
      logger.apiSuccess('GET /api/payment/subscription/:userId', Date.now() - startTime, {
        userId,
        plan: subscription.plan,
        status: subscription.status
      });
      return res.status(200).json({
        success: true,
        subscription
      });
    } catch (error: any) {
      logger.apiError('GET /api/payment/subscription/:userId', error, Date.now() - startTime, {
        userId: req.params?.userId
      });
      next(error);
    }
  }

  // ─── Routes Administrateurs Protégées ─────────────────────────────────

  public async listTransactions(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);
      const offset = parseInt(req.query.offset as string || '0', 10);
      const status = req.query.status as string | undefined;

      const where: any = {};
      if (status && ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
      }

      const [total, transactions] = await Promise.all([
        prisma.paymentTransaction.count({ where }),
        prisma.paymentTransaction.findMany({
          where,
          include: {
            user: { select: { id: true, email: true, name: true, role: true } }
          },
          orderBy: [{ createdAt: 'desc' }],
          take: limit,
          skip: offset
        })
      ]);

      logger.apiSuccess('GET /api/admin/payment/transactions', Date.now() - startTime, { total, limit });
      return res.status(200).json({ success: true, total, limit, offset, transactions });
    } catch (error: any) {
      logger.apiError('GET /api/admin/payment/transactions', error, Date.now() - startTime, {});
      next(error);
    }
  }

  public async listWebhookEvents(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);
      const offset = parseInt(req.query.offset as string || '0', 10);
      const onlyFailures = (req.query.failures as string) === 'true';

      const where: any = {};
      if (onlyFailures) where.success = false;

      const [total, events] = await Promise.all([
        prisma.webhookEvent.count({ where }),
        prisma.webhookEvent.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          take: limit,
          skip: offset
        })
      ]);

      logger.apiSuccess('GET /api/admin/payment/webhooks', Date.now() - startTime, { total, limit });
      return res.status(200).json({ success: true, total, limit, offset, events });
    } catch (error: any) {
      logger.apiError('GET /api/admin/payment/webhooks', error, Date.now() - startTime, {});
      next(error);
    }
  }

  public async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    try {
      const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);
      const offset = parseInt(req.query.offset as string || '0', 10);
      const action = req.query.action as string | undefined;

      const where: any = {};
      if (action) where.action = action;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: {
            targetUser: { select: { id: true, email: true, name: true } }
          },
          orderBy: [{ createdAt: 'desc' }],
          take: limit,
          skip: offset
        })
      ]);

      logger.apiSuccess('GET /api/admin/audit-logs', Date.now() - startTime, { total, limit });
      return res.status(200).json({ success: true, total, limit, offset, logs });
    } catch (error: any) {
      logger.apiError('GET /api/admin/audit-logs', error, Date.now() - startTime, {});
      next(error);
    }
  }

  public async updateUserRole(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const authUser = (req as any).user;
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!userId || !role) {
        return res.status(400).json({ success: false, error: 'userId et role requis.' });
      }
      if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, error: 'role invalide (USER | ADMIN | SUPER_ADMIN).' });
      }

      const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
      if (!target) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });

      const oldRole = target.role;
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: role as any }
      });

      try {
        await AuditLogService.logRoleChange(
          authUser?.id || 'system',
          authUser?.email || 'admin-api',
          authUser?.role || 'ADMIN',
          userId,
          oldRole,
          role,
          target.email || undefined
        );
      } catch (_) { /* ignore audit log failure */ }

      logger.apiSuccess('PATCH /api/admin/users/:userId/role', Date.now() - startTime, { userId, role });
      return res.status(200).json({ success: true, user: { id: updated.id, email: updated.email, role: updated.role } });
    } catch (error: any) {
      logger.apiError('PATCH /api/admin/users/:userId/role', error, Date.now() - startTime, { userId: req.params?.userId, role: req.body?.role });
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
