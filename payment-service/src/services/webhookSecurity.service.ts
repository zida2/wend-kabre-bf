import crypto from 'crypto';
import { moneyFusionConfig } from '../config/moneyFusion.config.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface WebhookValidationResult {
  valid: boolean;
  reference?: string;
  error?: string;
}

export class WebhookSecurityService {
  private static readonly REPLAY_WINDOW_MS = 10 * 60 * 1000;
  private static readonly NONCE_TTL_DAYS = 30;

  private static extractClientIp(req: any): string {
    if (!req) return 'unknown';
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      const firstIp = forwardedFor.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0].trim();
    }
    return req.ip
      || req.socket?.remoteAddress
      || req.connection?.remoteAddress
      || 'unknown';
  }

  public static validateIpWhitelist(req: any): boolean {
    const allowedIps = moneyFusionConfig.allowedIps;
    if (!allowedIps || allowedIps.length === 0) {
      return true;
    }
    const clientIp = this.extractClientIp(req);
    const isAllowed = allowedIps.some((allowedIp) => {
      if (allowedIp.includes('/')) {
        try {
          return clientIp.startsWith(allowedIp.split('/')[0].split('.').slice(0, 2).join('.'));
        } catch {
          return false;
        }
      }
      return clientIp === allowedIp || clientIp.endsWith('.' + allowedIp);
    });
    if (!isAllowed) {
      logger.warn(`[WEBHOOK_SECURITY] IP refusée: ${clientIp} (attendue: ${allowedIps.join(', ')})`);
      throw new ForbiddenError(`Accès refusé pour cette adresse IP: ${clientIp}`);
    }
    logger.debug(`[WEBHOOK_SECURITY] IP autorisée: ${clientIp}`);
    return true;
  }

  public static verifyHMACSignature(
    rawBody: string | Buffer,
    payload: any,
    signatureHeader?: string
  ): boolean {
    const secret = moneyFusionConfig.webhookSecret;
    const isProduction = env.NODE_ENV === 'production';

    if (!secret || secret === 'MF_WEBHOOK_SECRET' || secret === '') {
      if (isProduction) {
        logger.error('[WEBHOOK_SECURITY] ALERTE CRITIQUE: MONEY_FUSION_WEBHOOK_SECRET non configuré en production. Webhook refusé.');
        return false;
      }
      logger.warn('[WEBHOOK_SECURITY] Mode Sandbox: Webhook Secret non défini, signature ignorée.');
      return true;
    }

    const providedSignature = (signatureHeader || payload?.signature || payload?.hmac || '').toString().trim();

    if (!providedSignature) {
      if (isProduction) {
        logger.error('[WEBHOOK_SECURITY] Signature HMAC absente de la requête en production. Rejeté.');
        return false;
      }
      logger.warn('[WEBHOOK_SECURITY] Signature absente, acceptée car hors production.');
      return true;
    }

    const bodyToSign = typeof rawBody === 'string'
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf8')
        : JSON.stringify(payload);

    const algorithms = ['sha256', 'sha512', 'sha1'];
    let match = false;
    for (const algo of algorithms) {
      try {
        const computed = crypto
          .createHmac(algo, secret)
          .update(bodyToSign)
          .digest('hex');

        const computedBase64 = crypto
          .createHmac(algo, secret)
          .update(bodyToSign)
          .digest('base64');

        const candidates = [
          computed,
          computedBase64,
          `${algo}=${computed}`,
          `sha256=${computed}`
        ];

        if (candidates.some((c) => crypto.timingSafeEqual(
          Buffer.from(c.padEnd(128, '0'), 'utf8'),
          Buffer.from(providedSignature.padEnd(128, '0'), 'utf8')
        ))) {
          match = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!match) {
      logger.error(`[WEBHOOK_SECURITY] Échec validation HMAC. Fournie: ${providedSignature.substring(0, 24)}...`);
    } else {
      logger.debug('[WEBHOOK_SECURITY] Signature HMAC validée.');
    }
    return match;
  }

  public static async preventReplayAttack(reference: string, eventTimestamp?: number | string): Promise<boolean> {
    if (!reference) {
      throw new BadRequestError('Référence manquante pour contrôle anti-rejeu.');
    }

    const ts = eventTimestamp ? new Date(eventTimestamp).getTime() : Date.now();
    const now = Date.now();

    if (eventTimestamp && !Number.isNaN(ts)) {
      const ageMs = now - ts;
      if (ageMs > this.REPLAY_WINDOW_MS) {
        logger.warn(`[WEBHOOK_SECURITY] Webhook trop ancien: ${ageMs / 1000}s. Référence: ${reference}`);
        throw new BadRequestError('Notification webhook expirée (anti-rejeu).');
      }
    }

    const nonceKey = `${reference}_${ts}`;

    let existing;
    try {
      existing = await prisma.processedWebhook.findUnique({
        where: { nonceKey },
        select: { id: true }
      });
    } catch (dbErr: any) {
      logger.error(`[WEBHOOK_SECURITY] Erreur BDD vérification anti-rejeu: ${dbErr?.message}`);
      throw dbErr;
    }

    if (existing) {
      logger.warn(`[WEBHOOK_SECURITY] Attaque par rejeu détectée pour référence: ${reference}, nonceKey: ${nonceKey}`);
      throw new BadRequestError('Notification webhook déjà traitée (Replay Attack bloquée).');
    }

    const expiresAt = new Date(now + this.NONCE_TTL_DAYS * 24 * 60 * 60 * 1000);
    try {
      await prisma.processedWebhook.create({
        data: {
          nonceKey,
          reference,
          eventTs: eventTimestamp ? new Date(ts) : null,
          expiresAt
        }
      });
    } catch (dbErr: any) {
      if (dbErr?.code === 'P2002') {
        logger.warn(`[WEBHOOK_SECURITY] Race-condition anti-rejeu sur: ${nonceKey}`);
        throw new BadRequestError('Notification webhook déjà traitée (Replay Attack bloquée).');
      }
      logger.error(`[WEBHOOK_SECURITY] Erreur enregistrement ProcessedWebhook: ${dbErr?.message}`);
      throw dbErr;
    }

    logger.debug(`[WEBHOOK_SECURITY] Nonce enregistré: ${nonceKey}`);
    return true;
  }

  public static validateWebhookPayload(payload: any, expectedAmount?: number, expectedCurrency?: string): void {
    const reference = payload?.reference || payload?.customRef || payload?.order_ref || payload?.ref;
    if (!reference) {
      throw new BadRequestError('Référence de paiement absente du payload Webhook.');
    }

    if (expectedCurrency && payload?.currency) {
      const receivedCurrency = String(payload.currency).toUpperCase();
      const expected = expectedCurrency.toUpperCase();
      if (receivedCurrency !== expected) {
        logger.error(`[WEBHOOK_SECURITY] Discordance de devise sur ${reference}: attendue ${expected}, reçue ${receivedCurrency}`);
        throw new BadRequestError('Discordance de devise entre la transaction et le webhook.');
      }
    }

    if (expectedAmount !== undefined && payload?.amount !== undefined && payload?.amount !== null) {
      const receivedAmount = parseFloat(payload.amount);
      if (!Number.isNaN(receivedAmount) && receivedAmount > 0) {
        const diff = Math.abs(receivedAmount - expectedAmount);
        const toleranceCents = 1;
        if (diff > toleranceCents) {
          logger.error(`[WEBHOOK_SECURITY] Discordance de montant sur ${reference}: attendu ${expectedAmount}, reçu ${receivedAmount} (diff=${diff})`);
          throw new BadRequestError('Discordance entre le montant payé et le montant de la transaction initiale.');
        }
      }
    }
  }

  public static async validateFullPipeline(
    req: any,
    rawBody: string | Buffer,
    payload: any,
    expectedAmount?: number,
    expectedCurrency?: string
  ): Promise<WebhookValidationResult> {
    try {
      const reference = payload?.reference || payload?.customRef || payload?.ref || '';
      const signatureHeader = req?.headers?.['x-moneyfusion-signature']
        || req?.headers?.['x-webhook-signature']
        || req?.headers?.['signature'];

      logger.info(`[WEBHOOK_SECURITY] Début validation pipeline webhook ref=${reference}`);

      let ipValidated = false;
      try {
        ipValidated = this.validateIpWhitelist(req);
      } catch {
        return { valid: false, reference, error: 'IP non autorisée (whitelist).' };
      }

      const signatureOk = this.verifyHMACSignature(rawBody, payload, signatureHeader);
      if (!signatureOk) {
        return { valid: false, reference, error: 'Signature HMAC invalide.' };
      }

      try {
        await this.preventReplayAttack(
          reference,
          payload?.timestamp || payload?.created_at || payload?.eventTime || payload?.time
        );
      } catch (replayErr: any) {
        return { valid: false, reference, error: replayErr?.message || 'Anti-rejeu : webhook déjà traité ou expiré.' };
      }

      this.validateWebhookPayload(payload, expectedAmount, expectedCurrency);

      logger.info(`[WEBHOOK_SECURITY] Pipeline validation OK ref=${reference}`);
      return { valid: true, reference };
    } catch (err: any) {
      return {
        valid: false,
        reference: payload?.reference || payload?.customRef || '',
        error: err.message || 'Erreur inconnue validation webhook.'
      };
    }
  }
}
