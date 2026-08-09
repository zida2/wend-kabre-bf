import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkIntegrations } from './integrations.js';

const CLES = [
  'GMAIL_EMAIL', 'GMAIL_APP_PASSWORD',
  'GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN',
  'FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN_PRIVATE_KEY',
  'PAYMENT_SERVICE_URL', 'NEXT_PUBLIC_PAYMENT_SERVICE_URL',
  'JWT_SECRET',
];

let sauvegarde;

beforeEach(() => {
  sauvegarde = {};
  for (const k of CLES) {
    sauvegarde[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of CLES) {
    if (sauvegarde[k] === undefined) delete process.env[k];
    else process.env[k] = sauvegarde[k];
  }
});

const trouver = (nom) => checkIntegrations().find((i) => i.name.includes(nom));

describe('checkIntegrations', () => {
  it('signale l\'e-mail comme indisponible quand rien n\'est fourni', () => {
    const mail = trouver('E-mail');
    expect(mail.ok).toBe(false);
    expect(mail.missing).toContain('GMAIL_EMAIL');
  });

  // Le déploiement fournissait EMAIL_USER/EMAIL_APP_PASSWORD tandis que
  // src/lib/mail.js lit GMAIL_* : l'envoi échouait sans le moindre signal.
  it('ne considère pas EMAIL_USER comme suffisant', () => {
    process.env.EMAIL_USER = 'a@b.c';
    process.env.EMAIL_APP_PASSWORD = 'xxx';
    expect(trouver('E-mail').ok).toBe(false);
  });

  it('valide l\'e-mail avec les deux bonnes variables', () => {
    process.env.GMAIL_EMAIL = 'a@b.c';
    process.env.GMAIL_APP_PASSWORD = 'xxx';
    expect(trouver('E-mail').ok).toBe(true);
  });

  it('exige les deux variables e-mail, pas une seule', () => {
    process.env.GMAIL_EMAIL = 'a@b.c';
    const mail = trouver('E-mail');
    expect(mail.ok).toBe(false);
    expect(mail.missing).toEqual(['GMAIL_APP_PASSWORD']);
  });

  it('accepte l\'une OU l\'autre clé pour Gemini', () => {
    process.env.GEMINI_API_KEY = 'k';
    expect(trouver('Gemini').ok).toBe(true);
    delete process.env.GEMINI_API_KEY;
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'k';
    expect(trouver('Gemini').ok).toBe(true);
  });

  it('ignore une valeur vide ou faite d\'espaces', () => {
    process.env.JWT_SECRET = '   ';
    expect(trouver('Jeton de service').ok).toBe(false);
  });

  it('marque comme critiques les briques dont dépend l\'encaissement', () => {
    const critiques = checkIntegrations().filter((i) => i.critical).map((i) => i.name);
    expect(critiques).toContain('Firebase Admin SDK');
    expect(critiques).toContain('Microservice de paiement');
    expect(critiques).toContain('Jeton de service admin');
  });

  it('nomme la fonctionnalité perdue pour chaque intégration', () => {
    for (const i of checkIntegrations()) {
      expect(i.feature).toBeTruthy();
    }
  });
});
