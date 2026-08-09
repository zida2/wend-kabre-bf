import { describe, it, expect } from 'vitest';
import { isSubscriptionActive, getUserStatus, STATUS_META, PLAN_PRICES } from './subscription.js';

const jours = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

describe('isSubscriptionActive', () => {
  it('refuse un utilisateur sans abonnement', () => {
    expect(isSubscriptionActive({ isSubscribed: false })).toBe(false);
    expect(isSubscriptionActive({})).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
    expect(isSubscriptionActive(undefined)).toBe(false);
  });

  it('accepte un abonnement dont l\'échéance est à venir', () => {
    expect(isSubscriptionActive({ isSubscribed: true, subscriptionExpiresAt: jours(10) })).toBe(true);
  });

  // Régression : l'application testait uniquement `isSubscribed === true` et ne
  // regardait jamais l'échéance — un essai de 7 jours donnait un accès premium
  // permanent.
  it('refuse un abonnement dont l\'échéance est passée', () => {
    expect(isSubscriptionActive({ isSubscribed: true, subscriptionExpiresAt: jours(-1) })).toBe(false);
  });

  it('refuse une échéance dépassée d\'une seconde', () => {
    const passe = new Date(Date.now() - 1000).toISOString();
    expect(isSubscriptionActive({ isSubscribed: true, subscriptionExpiresAt: passe })).toBe(false);
  });

  it('n\'exige pas la valeur littérale true ailleurs que sur isSubscribed', () => {
    expect(isSubscriptionActive({ isSubscribed: 'oui', subscriptionExpiresAt: jours(5) })).toBe(false);
  });

  // Choix délibéré : on ne coupe pas l'accès d'un client existant à cause d'une
  // donnée manquante ou corrompue.
  it('reste actif sans échéance enregistrée', () => {
    expect(isSubscriptionActive({ isSubscribed: true })).toBe(true);
    expect(isSubscriptionActive({ isSubscribed: true, subscriptionExpiresAt: null })).toBe(true);
  });

  it('reste actif si l\'échéance est illisible', () => {
    expect(isSubscriptionActive({ isSubscribed: true, subscriptionExpiresAt: 'pas-une-date' })).toBe(true);
  });
});

describe('getUserStatus', () => {
  it('donne la priorité à la suspension', () => {
    expect(getUserStatus({ suspended: true, isSubscribed: true, subscriptionExpiresAt: jours(10) })).toBe('suspendu');
  });

  it('classe un abonné payant en premium', () => {
    expect(getUserStatus({ isSubscribed: true, subscriptionExpiresAt: jours(20) })).toBe('premium');
  });

  // Régression : `isTrial` était lu mais jamais écrit — le statut « Essai »
  // était inatteignable et un essai s'affichait « Premium ».
  it('distingue un essai en cours', () => {
    expect(getUserStatus({ isSubscribed: true, isTrial: true, subscriptionExpiresAt: jours(5) })).toBe('essai');
  });

  it('ne confond pas hasUsedTrial avec un essai en cours', () => {
    expect(getUserStatus({ isSubscribed: true, hasUsedTrial: true, subscriptionExpiresAt: jours(20) })).toBe('premium');
  });

  // Régression : « Expiré » était inatteignable, la désactivation effaçant
  // l'échéance en même temps que le drapeau.
  it('classe un abonnement échu en expiré', () => {
    expect(getUserStatus({ isSubscribed: true, subscriptionExpiresAt: jours(-3) })).toBe('expire');
  });

  it('classe un essai échu en expiré, pas en essai', () => {
    expect(getUserStatus({ isSubscribed: true, isTrial: true, subscriptionExpiresAt: jours(-1) })).toBe('expire');
  });

  it('classe en gratuit un compte sans historique', () => {
    expect(getUserStatus({})).toBe('gratuit');
    expect(getUserStatus({ isSubscribed: false, subscriptionExpiresAt: null })).toBe('gratuit');
  });

  it('ne renvoie que des statuts connus de STATUS_META', () => {
    const cas = [
      { suspended: true },
      { isSubscribed: true, subscriptionExpiresAt: jours(1) },
      { isSubscribed: true, isTrial: true, subscriptionExpiresAt: jours(1) },
      { isSubscribed: true, subscriptionExpiresAt: jours(-1) },
      {},
    ];
    for (const u of cas) {
      expect(STATUS_META[getUserStatus(u)]).toBeDefined();
    }
  });

  it('couvre les cinq statuts — aucun n\'est du code mort', () => {
    const atteints = new Set([
      getUserStatus({ suspended: true }),
      getUserStatus({ isSubscribed: true, subscriptionExpiresAt: jours(1) }),
      getUserStatus({ isSubscribed: true, isTrial: true, subscriptionExpiresAt: jours(1) }),
      getUserStatus({ isSubscribed: true, subscriptionExpiresAt: jours(-1) }),
      getUserStatus({}),
    ]);
    expect(atteints).toEqual(new Set(Object.keys(STATUS_META)));
  });
});

describe('PLAN_PRICES', () => {
  // Ces montants sont la seule source côté Next : le client n'envoie plus de
  // prix. Ils doivent rester alignés sur WEND_KABRE_PLANS du payment-service.
  it('correspond aux plans du microservice', () => {
    expect(PLAN_PRICES).toEqual({ FREE: 0, PREMIUM: 15000, ENTERPRISE: 55000 });
  });
});
