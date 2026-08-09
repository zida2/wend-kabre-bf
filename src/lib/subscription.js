/**
 * Source unique de vérité pour « cet utilisateur a-t-il un accès premium ? ».
 *
 * Avant ce module, chaque page testait `userData.isSubscribed === true` et
 * personne ne regardait `subscriptionExpiresAt` : un essai de 7 jours donnait
 * donc un accès premium permanent. L'échéance est désormais évaluée à la
 * lecture, ce qui rend l'expiration effective sans dépendre d'un cron.
 */

/**
 * @param {object|null|undefined} userData - document Firestore `users/{uid}`
 * @returns {boolean} true si l'accès premium doit être accordé maintenant
 */
export function isSubscriptionActive(userData) {
  if (!userData || userData.isSubscribed !== true) return false;

  const expiresAt = userData.subscriptionExpiresAt;
  // Abonnement historique sans échéance enregistrée : on ne coupe pas l'accès
  // d'un client existant sur la base d'une donnée manquante.
  if (!expiresAt) return true;

  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return true;

  return expiry > Date.now();
}

/**
 * Classe un utilisateur dans une catégorie de statut unique, pour l'affichage
 * admin. Priorité : Suspendu > Essai > Premium > Expiré > Gratuit.
 *
 * `isTrial` est écrit par `applySubscription` (console admin) au moment où un
 * essai est accordé ; il ne doit pas être confondu avec `hasUsedTrial`, qui
 * mémorise qu'un essai a déjà été consommé par le passé.
 */
export function getUserStatus(u) {
  if (u?.suspended === true) return 'suspendu';

  const active = isSubscriptionActive(u);
  if (active && u?.isTrial === true) return 'essai';
  if (active) return 'premium';

  // Non actif mais une échéance existe → l'abonnement a expiré.
  if (u?.subscriptionExpiresAt) return 'expire';

  return 'gratuit';
}

export const STATUS_META = {
  suspendu: { label: 'Suspendu', badge: 'badge-gray' },
  premium: { label: 'Premium', badge: 'badge-green' },
  essai: { label: 'Essai', badge: 'badge-blue' },
  expire: { label: 'Expiré', badge: 'badge-gray' },
  gratuit: { label: 'Gratuit', badge: 'badge-gray' },
};

/** Prix de référence par plan, en FCFA. Doit rester aligné sur
 *  `WEND_KABRE_PLANS` (payment-service/src/types/payment.types.ts). */
export const PLAN_PRICES = {
  FREE: 0,
  PREMIUM: 15000,
  ENTERPRISE: 55000,
};
