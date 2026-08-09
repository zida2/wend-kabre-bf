import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const verifyIdToken = vi.fn();
let adminAuthAvailable = true;

vi.mock('./firebaseAdmin', () => ({
  getAdminAuth: async () => (adminAuthAvailable ? { verifyIdToken } : null),
}));

const { verifyAdminRequest, authorizeAdminProxy, isAdminEmail, ADMIN_EMAILS } =
  await import('./adminAuth.js');

const SECRET = 'secret_de_test_1234';

/** Requête minimale à la façon de NextRequest (headers.get). */
function req(headers = {}) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { headers: { get: (name) => lower[name.toLowerCase()] ?? null } };
}

beforeEach(() => {
  vi.clearAllMocks();
  adminAuthAvailable = true;
  process.env.JWT_SECRET = SECRET;
});

describe('isAdminEmail', () => {
  const admin = [...ADMIN_EMAILS][0];

  it('reconnaît l\'administrateur quelle que soit la casse', () => {
    expect(isAdminEmail(admin)).toBe(true);
    expect(isAdminEmail(admin.toUpperCase())).toBe(true);
  });

  it('refuse toute autre adresse', () => {
    expect(isAdminEmail('quelquun@ailleurs.com')).toBe(false);
    expect(isAdminEmail('')).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});

describe('verifyAdminRequest', () => {
  it('refuse une requête sans en-tête Authorization', async () => {
    const r = await verifyAdminRequest(req());
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });

  it('refuse un schéma autre que Bearer', async () => {
    const r = await verifyAdminRequest(req({ authorization: 'Basic abc' }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });

  it('refuse un jeton Firebase invalide', async () => {
    verifyIdToken.mockRejectedValue(new Error('expiré'));
    const r = await verifyAdminRequest(req({ authorization: 'Bearer mauvais' }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });

  it('refuse un utilisateur authentifié mais non administrateur', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'client@pme.bf' });
    const r = await verifyAdminRequest(req({ authorization: 'Bearer valide' }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
  });

  it('accepte l\'administrateur', async () => {
    const admin = [...ADMIN_EMAILS][0];
    verifyIdToken.mockResolvedValue({ uid: 'u-admin', email: admin });
    const r = await verifyAdminRequest(req({ authorization: 'Bearer valide' }));
    expect(r.ok).toBe(true);
    expect(r.uid).toBe('u-admin');
  });

  // Fail-closed : sans Admin SDK on ne peut rien vérifier, donc on refuse.
  it('refuse quand l\'Admin SDK n\'est pas configuré', async () => {
    adminAuthAvailable = false;
    const r = await verifyAdminRequest(req({ authorization: 'Bearer valide' }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(503);
  });
});

describe('authorizeAdminProxy', () => {
  it('convertit un ID token Firebase en jeton de service HS256 role=ADMIN', async () => {
    const admin = [...ADMIN_EMAILS][0];
    verifyIdToken.mockResolvedValue({ uid: 'u-admin', email: admin });

    const r = await authorizeAdminProxy(req({ authorization: 'Bearer valide' }));
    expect(r.ok).toBe(true);

    const token = r.authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, SECRET);
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.id).toBe('u-admin');
    expect(decoded.email).toBe(admin);
  });

  it('émet un jeton de courte durée', async () => {
    const admin = [...ADMIN_EMAILS][0];
    verifyIdToken.mockResolvedValue({ uid: 'u-admin', email: admin });

    const r = await authorizeAdminProxy(req({ authorization: 'Bearer valide' }));
    const decoded = jwt.verify(r.authHeader.replace('Bearer ', ''), SECRET);
    expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(5 * 60);
  });

  it('ne signe pas avec un secret différent', async () => {
    const admin = [...ADMIN_EMAILS][0];
    verifyIdToken.mockResolvedValue({ uid: 'u-admin', email: admin });

    const r = await authorizeAdminProxy(req({ authorization: 'Bearer valide' }));
    expect(() => jwt.verify(r.authHeader.replace('Bearer ', ''), 'autre_secret')).toThrow();
  });

  it('remonte l\'échec sans jeton quand JWT_SECRET manque', async () => {
    const admin = [...ADMIN_EMAILS][0];
    verifyIdToken.mockResolvedValue({ uid: 'u-admin', email: admin });
    delete process.env.JWT_SECRET;

    const r = await authorizeAdminProxy(req({ authorization: 'Bearer valide' }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(500);
  });

  it('ne délivre aucun jeton à un non-administrateur', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'client@pme.bf' });
    const r = await authorizeAdminProxy(req({ authorization: 'Bearer valide' }));
    expect(r.ok).toBe(false);
    expect(r.authHeader).toBeUndefined();
  });
});
