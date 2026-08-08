import { prisma } from '../config/database.js';
import { AuditAction, UserRole } from '@prisma/client';
import { logger } from '../utils/logger.js';

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: UserRole | null;
  action: AuditAction;
  message: string;
  metadata?: Record<string, any> | null;
  targetUserId?: string | null;
}

export class AuditLogService {
  public static async log(input: AuditLogInput) {
    try {
      const entry = await prisma.auditLog.create({
        data: {
          actorId: input.actorId || null,
          actorEmail: input.actorEmail || null,
          actorRole: input.actorRole || null,
          action: input.action,
          message: input.message,
          metadata: input.metadata ? (input.metadata as any) : null,
          targetUserId: input.targetUserId || null
        }
      });
      logger.info(`[AUDIT_LOG] action=${input.action} actor=${input.actorEmail || input.actorId || 'system'} -> ${input.message}`);
      return entry;
    } catch (err: any) {
      logger.error(`[AUDIT_LOG] Échec écriture action=${input.action}: ${err?.message}`);
      return null;
    }
  }

  public static async logPaymentValidation(
    paymentTransactionId: string | null | undefined,
    reference: string,
    amount: number,
    rawPayload: any
  ) {
    return this.log({
      actorId: null,
      actorEmail: 'money-fusion-webhook',
      actorRole: null,
      action: AuditAction.PAYMENT_VALIDATION,
      message: `Paiement validé via webhook MoneyFusion — ref=${reference} — montant=${amount} XOF`,
      metadata: {
        reference,
        amount,
        paymentTransactionId: paymentTransactionId || null,
        rawPayload: rawPayload || null
      },
      targetUserId: null
    });
  }

  public static async logRoleChange(
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    targetEmail?: string
  ) {
    return this.log({
      actorId,
      actorEmail,
      actorRole,
      action: AuditAction.ROLE_CHANGE,
      message: `Changement de rôle ${targetEmail || targetUserId}: ${oldRole} → ${newRole}`,
      metadata: { oldRole, newRole, targetUserId, targetEmail: targetEmail || null },
      targetUserId
    });
  }

  public static async logSubscriptionUpdate(
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    targetUserId: string,
    days: number,
    targetEmail?: string
  ) {
    return this.log({
      actorId,
      actorEmail,
      actorRole,
      action: AuditAction.SUBSCRIPTION_UPDATE,
      message: days === 0
        ? `Désactivation abonnement — ${targetEmail || targetUserId}`
        : `Abonnement étendu de +${days}j — ${targetEmail || targetUserId}`,
      metadata: { days, targetUserId },
      targetUserId
    });
  }

  public static async logUserDelete(
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    targetUserId: string,
    targetEmail?: string
  ) {
    return this.log({
      actorId,
      actorEmail,
      actorRole,
      action: AuditAction.USER_DELETE,
      message: `Suppression utilisateur — ${targetEmail || targetUserId}`,
      metadata: { targetUserId, targetEmail: targetEmail || null },
      targetUserId
    });
  }

  public static async logUserSuspend(
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    targetUserId: string,
    suspended: boolean,
    targetEmail?: string
  ) {
    return this.log({
      actorId,
      actorEmail,
      actorRole,
      action: suspended ? AuditAction.USER_SUSPEND : AuditAction.USER_REACTIVATE,
      message: `${suspended ? 'Suspension' : 'Réactivation'} compte — ${targetEmail || targetUserId}`,
      metadata: { suspended, targetUserId },
      targetUserId
    });
  }

  public static async logAdminLogin(actorId: string, actorEmail: string, actorRole: UserRole) {
    return this.log({
      actorId,
      actorEmail,
      actorRole,
      action: AuditAction.ADMIN_LOGIN,
      message: `Connexion admin: ${actorEmail} (${actorRole})`,
      metadata: null,
      targetUserId: actorId
    });
  }
}
