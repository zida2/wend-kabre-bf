import axios from 'axios';
import { env, getEnvironmentUrls } from '../config/environment.js';
import { logger } from '../utils/logger.js';

/**
 * Notifie l'application Next.js qu'un abonnement doit être resynchronisé.
 *
 * Sans ce signal, l'activation ne se produisait qu'au retour du client sur
 * /payment/success : un client qui fermait l'onglet après avoir payé restait
 * bloqué en gratuit jusqu'à sa prochaine visite.
 *
 * Best-effort : un échec ici ne doit jamais faire échouer le webhook Money
 * Fusion (sinon MF rejouerait indéfiniment une notification pourtant traitée).
 * L'utilisateur garde le rattrapage à la lecture via /payment/success.
 */
export async function notifyAppSubscriptionChanged(userId: string): Promise<boolean> {
  const secret = env.APP_SYNC_SECRET;
  if (!secret) {
    logger.warn('[APP_SYNC] APP_SYNC_SECRET non configuré — synchronisation Firestore non déclenchée.');
    return false;
  }
  if (!userId) return false;

  const url = `${getEnvironmentUrls().app}/api/subscription/sync`;

  try {
    await axios.post(
      url,
      { userId },
      {
        headers: { 'Content-Type': 'application/json', 'x-sync-secret': secret },
        timeout: 8000
      }
    );
    logger.info(`[APP_SYNC] Abonnement resynchronisé côté application pour ${userId}`);
    return true;
  } catch (err: any) {
    logger.error(
      `[APP_SYNC] Échec de la notification à l'application (${url}) pour ${userId}: ${err?.message}`
    );
    return false;
  }
}
