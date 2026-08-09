import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

const WEBHOOK_SECRET = 'whsec_test_value';

// Prisma et la configuration sont remplacés : ces tests portent sur la logique
// de sécurité, pas sur l'accès base ni sur l'environnement de déploiement.
const processedWebhook = {
  findUnique: vi.fn(),
  create: vi.fn(),
};

vi.mock('../config/database.js', () => ({
  prisma: { processedWebhook },
}));

vi.mock('../config/moneyFusion.config.js', () => ({
  moneyFusionConfig: {
    get webhookSecret() { return currentSecret; },
    get allowedIps() { return currentAllowedIps; },
  },
}));

vi.mock('../config/environment.js', () => ({
  env: { get NODE_ENV() { return currentNodeEnv; } },
}));

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

let currentSecret = WEBHOOK_SECRET;
let currentAllowedIps: string[] = [];
let currentNodeEnv = 'production';

const { WebhookSecurityService } = await import('./webhookSecurity.service.js');

function sign(body: string, secret = WEBHOOK_SECRET) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

beforeEach(() => {
  vi.clearAllMocks();
  currentSecret = WEBHOOK_SECRET;
  currentAllowedIps = [];
  currentNodeEnv = 'production';
  processedWebhook.findUnique.mockResolvedValue(null);
  processedWebhook.create.mockResolvedValue({ id: 'nonce-1' });
});

describe('verifyHMACSignature', () => {
  it('accepte une signature sha256 hexadécimale valide', () => {
    const body = '{"reference":"WK-1","status":"SUCCESS"}';
    expect(WebhookSecurityService.verifyHMACSignature(body, {}, sign(body))).toBe(true);
  });

  it('refuse une signature calculée avec un autre secret', () => {
    const body = '{"reference":"WK-1","status":"SUCCESS"}';
    expect(WebhookSecurityService.verifyHMACSignature(body, {}, sign(body, 'mauvais'))).toBe(false);
  });

  it('refuse une signature portant sur un corps différent', () => {
    const signed = sign('{"reference":"WK-1","status":"PENDING"}');
    const tampered = '{"reference":"WK-1","status":"SUCCESS"}';
    expect(WebhookSecurityService.verifyHMACSignature(tampered, {}, signed)).toBe(false);
  });

  it('refuse une signature absente en production', () => {
    expect(WebhookSecurityService.verifyHMACSignature('{}', {}, undefined)).toBe(false);
  });

  // Fail-closed : sans secret configuré, la production doit refuser plutôt que
  // d'accepter tout webhook — c'est ce qui empêche de s'offrir un abonnement.
  it('refuse tout webhook si le secret vaut la valeur par défaut en production', () => {
    currentSecret = 'MF_WEBHOOK_SECRET';
    const body = '{"reference":"WK-1"}';
    expect(WebhookSecurityService.verifyHMACSignature(body, {}, sign(body))).toBe(false);
  });

  it('refuse tout webhook si le secret est vide en production', () => {
    currentSecret = '';
    expect(WebhookSecurityService.verifyHMACSignature('{}', {}, 'peu-importe')).toBe(false);
  });

  it('tolère l\'absence de signature hors production (bac à sable)', () => {
    currentNodeEnv = 'development';
    currentSecret = 'MF_WEBHOOK_SECRET';
    expect(WebhookSecurityService.verifyHMACSignature('{}', {}, undefined)).toBe(true);
  });
});

describe('preventReplayAttack', () => {
  it('enregistre un nonce dérivé de l\'empreinte du payload', async () => {
    await WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'abc123');
    expect(processedWebhook.create).toHaveBeenCalledOnce();
    expect(processedWebhook.create.mock.calls[0][0].data.nonceKey).toBe('WK-1_abc123');
  });

  it('bloque un payload déjà vu', async () => {
    processedWebhook.findUnique.mockResolvedValue({ id: 'deja-la' });
    await expect(
      WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'abc123')
    ).rejects.toThrow(/déjà traitée/);
  });

  // Régression : la clé était `${reference}_${Date.now()}` quand le payload
  // n'avait pas d'horodatage — donc unique à chaque appel, et l'anti-rejeu
  // ne bloquait jamais rien.
  it('produit la même clé pour deux appels identiques sans horodatage', async () => {
    await WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'empreinte');
    await WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'empreinte');
    const [first, second] = processedWebhook.create.mock.calls;
    expect(first[0].data.nonceKey).toBe(second[0].data.nonceKey);
  });

  it('distingue deux événements légitimes sur la même référence', async () => {
    await WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'pending');
    await WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'success');
    const [first, second] = processedWebhook.create.mock.calls;
    expect(first[0].data.nonceKey).not.toBe(second[0].data.nonceKey);
  });

  it('rejette une notification plus ancienne que la fenêtre anti-rejeu', async () => {
    const vieux = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    await expect(
      WebhookSecurityService.preventReplayAttack('WK-1', vieux, 'x')
    ).rejects.toThrow(/expirée/);
  });

  it('traite une collision d\'unicité comme un rejeu', async () => {
    processedWebhook.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      WebhookSecurityService.preventReplayAttack('WK-1', undefined, 'x')
    ).rejects.toThrow(/déjà traitée/);
  });

  it('exige une référence', async () => {
    await expect(WebhookSecurityService.preventReplayAttack('', undefined, 'x')).rejects.toThrow(/Référence/);
  });
});

describe('validateWebhookPayload', () => {
  it('exige une référence dans le payload', () => {
    expect(() => WebhookSecurityService.validateWebhookPayload({})).toThrow(/Référence/);
  });

  it('refuse un montant différent de celui de la transaction', () => {
    expect(() =>
      WebhookSecurityService.validateWebhookPayload({ reference: 'WK-1', amount: 500 }, 15000)
    ).toThrow(/montant/i);
  });

  it('accepte un écart d\'arrondi d\'une unité', () => {
    expect(() =>
      WebhookSecurityService.validateWebhookPayload({ reference: 'WK-1', amount: 15001 }, 15000)
    ).not.toThrow();
  });

  it('refuse une devise différente', () => {
    expect(() =>
      WebhookSecurityService.validateWebhookPayload({ reference: 'WK-1', currency: 'EUR' }, 15000, 'XOF')
    ).toThrow(/devise/i);
  });

  it('accepte la devise attendue quelle que soit la casse', () => {
    expect(() =>
      WebhookSecurityService.validateWebhookPayload({ reference: 'WK-1', currency: 'xof' }, 15000, 'XOF')
    ).not.toThrow();
  });
});

describe('validateIpWhitelist', () => {
  it('laisse passer quand aucune whitelist n\'est configurée', () => {
    expect(WebhookSecurityService.validateIpWhitelist({ headers: {}, ip: '8.8.8.8' })).toBe(true);
  });

  it('accepte une IP du bloc autorisé', () => {
    currentAllowedIps = ['196.200.15.0/24'];
    expect(WebhookSecurityService.validateIpWhitelist({ headers: {}, ip: '196.200.15.7' })).toBe(true);
  });

  it('refuse une IP hors whitelist', () => {
    currentAllowedIps = ['196.200.15.0/24'];
    expect(() =>
      WebhookSecurityService.validateIpWhitelist({ headers: {}, ip: '8.8.8.8' })
    ).toThrow(/IP/);
  });

  it('refuse une IP usurpée via X-Forwarded-For', () => {
    currentAllowedIps = ['196.200.15.0/24'];
    const req = { headers: { 'x-forwarded-for': '196.200.15.7' }, ip: '8.8.8.8' };
    expect(() => WebhookSecurityService.validateIpWhitelist(req)).toThrow(/IP/);
  });
});

describe('validateFullPipeline', () => {
  it('valide un webhook correctement signé', async () => {
    const payload = { reference: 'WK-1', status: 'SUCCESS', amount: 15000 };
    const raw = JSON.stringify(payload);
    const req = { headers: { 'x-moneyfusion-signature': sign(raw) }, ip: '8.8.8.8' };

    const result = await WebhookSecurityService.validateFullPipeline(req, raw, payload, 15000, 'XOF');
    expect(result.valid).toBe(true);
    expect(result.reference).toBe('WK-1');
  });

  it('rejette une signature invalide sans enregistrer de nonce', async () => {
    const payload = { reference: 'WK-1', status: 'SUCCESS' };
    const raw = JSON.stringify(payload);
    const req = { headers: { 'x-moneyfusion-signature': 'invalide' }, ip: '8.8.8.8' };

    const result = await WebhookSecurityService.validateFullPipeline(req, raw, payload);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/HMAC/);
    expect(processedWebhook.create).not.toHaveBeenCalled();
  });

  it('rejette une discordance de montant même signée', async () => {
    const payload = { reference: 'WK-1', status: 'SUCCESS', amount: 100 };
    const raw = JSON.stringify(payload);
    const req = { headers: { 'x-moneyfusion-signature': sign(raw) }, ip: '8.8.8.8' };

    const result = await WebhookSecurityService.validateFullPipeline(req, raw, payload, 15000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/montant/i);
  });
});
