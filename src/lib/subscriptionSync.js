/**
 * Réconciliation PostgreSQL (payment-service) → Firestore.
 *
 * Le webhook Money Fusion active l'abonnement dans PostgreSQL, mais tout
 * l'accès premium de l'application est gardé par le document Firestore
 * `users/{uid}`. Sans ce pont, un client qui paie ne reçoit rien.
 *
 * L'écriture passe obligatoirement par l'Admin SDK : firestore.rules interdit
 * au client de modifier lui-même `isSubscribed` / `subscriptionExpiresAt`
 * (champs restreints), ce qui est exactement le comportement voulu — seul le
 * serveur, après vérification auprès du microservice, peut accorder l'accès.
 */
import { paymentServiceClient } from './paymentServiceClient';
import { getAdminDb } from './firebaseAdmin';

/**
 * Aligne le document Firestore d'un utilisateur sur son abonnement réel.
 *
 * @param {string} userId - UID Firebase (identique à l'id utilisateur PostgreSQL)
 * @returns {Promise<{synced: boolean, isSubscribed: boolean, plan: string, expiresAt: string|null, reason?: string}>}
 */
export async function syncSubscriptionToFirestore(userId) {
  if (!userId) throw new Error('userId requis pour la synchronisation.');

  const db = await getAdminDb();
  if (!db) {
    return {
      synced: false,
      isSubscribed: false,
      plan: 'FREE',
      expiresAt: null,
      reason: 'Firebase Admin SDK non configuré — écriture Firestore impossible.',
    };
  }

  const { subscription } = await paymentServiceClient.getUserSubscription(userId);

  const plan = subscription?.plan || 'FREE';
  const status = subscription?.status || null;
  const endDate = subscription?.endDate || null;

  // payment-service recalcule lui-même l'expiration et renvoie EXPIRED le cas
  // échéant ; on revérifie la date pour ne pas dépendre d'un seul signal.
  const notExpired = endDate ? new Date(endDate).getTime() > Date.now() : false;
  const isSubscribed = status === 'ACTIVE' && plan !== 'FREE' && notExpired;

  const payload = {
    isSubscribed,
    plan,
    subscriptionExpiresAt: isSubscribed ? endDate : null,
    // Un abonnement payé n'est jamais un essai : le drapeau est remis à plat
    // pour que la console admin n'affiche pas « Essai » après un vrai paiement.
    isTrial: false,
    subscriptionSyncedAt: new Date().toISOString(),
  };

  if (isSubscribed) {
    payload.lastPaymentDate =
      subscription?.lastTransaction?.updatedAt || new Date().toISOString();
  }

  await db.collection('users').doc(userId).set(payload, { merge: true });

  return { synced: true, isSubscribed, plan, expiresAt: payload.subscriptionExpiresAt };
}
