import { describe, it, expect, beforeEach, vi } from 'vitest';

const getUserSubscription = vi.fn();
const setDoc = vi.fn();
let adminDbAvailable = true;

vi.mock('./paymentServiceClient', () => ({
  paymentServiceClient: { getUserSubscription },
}));

vi.mock('./firebaseAdmin', () => ({
  getAdminDb: async () =>
    adminDbAvailable ? { collection: () => ({ doc: () => ({ set: setDoc }) }) } : null,
}));

const { syncSubscriptionToFirestore } = await import('./subscriptionSync.js');

const jours = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  adminDbAvailable = true;
  setDoc.mockResolvedValue(undefined);
});

describe('syncSubscriptionToFirestore', () => {
  it('accorde l\'accès pour un abonnement PREMIUM actif', async () => {
    getUserSubscription.mockResolvedValue({
      subscription: { plan: 'PREMIUM', status: 'ACTIVE', endDate: jours(30) },
    });

    const r = await syncSubscriptionToFirestore('uid-1');

    expect(r).toMatchObject({ synced: true, isSubscribed: true, plan: 'PREMIUM' });
    const written = setDoc.mock.calls[0][0];
    expect(written.isSubscribed).toBe(true);
    expect(written.isTrial).toBe(false);
    expect(setDoc.mock.calls[0][1]).toEqual({ merge: true });
  });

  it('refuse l\'accès pour un abonnement expiré même marqué ACTIVE', async () => {
    getUserSubscription.mockResolvedValue({
      subscription: { plan: 'PREMIUM', status: 'ACTIVE', endDate: jours(-1) },
    });

    const r = await syncSubscriptionToFirestore('uid-1');

    expect(r.isSubscribed).toBe(false);
    expect(setDoc.mock.calls[0][0].subscriptionExpiresAt).toBeNull();
  });

  it('refuse l\'accès quand le statut est EXPIRED', async () => {
    getUserSubscription.mockResolvedValue({
      subscription: { plan: 'PREMIUM', status: 'EXPIRED', endDate: jours(10) },
    });
    expect((await syncSubscriptionToFirestore('uid-1')).isSubscribed).toBe(false);
  });

  it('n\'accorde jamais l\'accès pour le plan FREE', async () => {
    getUserSubscription.mockResolvedValue({
      subscription: { plan: 'FREE', status: 'ACTIVE', endDate: jours(365) },
    });
    expect((await syncSubscriptionToFirestore('uid-1')).isSubscribed).toBe(false);
  });

  it('refuse l\'accès sans date de fin', async () => {
    getUserSubscription.mockResolvedValue({
      subscription: { plan: 'PREMIUM', status: 'ACTIVE', endDate: null },
    });
    expect((await syncSubscriptionToFirestore('uid-1')).isSubscribed).toBe(false);
  });

  it('gère une réponse sans abonnement', async () => {
    getUserSubscription.mockResolvedValue({ subscription: null });
    const r = await syncSubscriptionToFirestore('uid-1');
    expect(r.isSubscribed).toBe(false);
    expect(r.plan).toBe('FREE');
  });

  it('n\'écrit rien et le signale si l\'Admin SDK manque', async () => {
    adminDbAvailable = false;
    const r = await syncSubscriptionToFirestore('uid-1');
    expect(r.synced).toBe(false);
    expect(r.reason).toMatch(/Admin SDK/);
    expect(setDoc).not.toHaveBeenCalled();
    expect(getUserSubscription).not.toHaveBeenCalled();
  });

  it('exige un userId', async () => {
    await expect(syncSubscriptionToFirestore('')).rejects.toThrow(/userId/);
  });
});
