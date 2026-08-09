/**
 * Inventaire des intégrations optionnelles et de leurs variables d'environnement.
 *
 * Chacune de ces briques échouait jusqu'ici *silencieusement* à la première
 * utilisation quand sa configuration manquait — l'envoi d'e-mails est resté
 * cassé sans que personne le remarque, parce que le code lisait GMAIL_EMAIL
 * alors que le déploiement fournissait EMAIL_USER. Le bilan est désormais
 * journalisé une fois au démarrage du serveur (cf. instrumentation.js).
 */

const INTEGRATIONS = [
  {
    name: 'E-mail (Gmail / nodemailer)',
    feature: 'alertes et notifications par e-mail',
    required: ['GMAIL_EMAIL', 'GMAIL_APP_PASSWORD'],
  },
  {
    name: 'Assistant IA (Google Gemini)',
    feature: 'assistant conversationnel /assistant',
    // Le code accepte l'une ou l'autre : une seule suffit.
    anyOf: ['GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
  },
  {
    name: 'Twilio',
    feature: 'alertes SMS et WhatsApp',
    required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
  },
  {
    name: 'Firebase Admin SDK',
    feature: 'activation des abonnements, console admin, écritures serveur',
    anyOf: ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN_PRIVATE_KEY'],
    critical: true,
  },
  {
    name: 'Microservice de paiement',
    feature: 'encaissement Money Fusion et statut d\'abonnement',
    anyOf: ['PAYMENT_SERVICE_URL', 'NEXT_PUBLIC_PAYMENT_SERVICE_URL'],
    critical: true,
  },
  {
    name: 'Jeton de service admin',
    feature: 'sections Transactions / Webhooks / Audit de la console',
    required: ['JWT_SECRET'],
    critical: true,
  },
];

function has(key) {
  const v = process.env[key];
  return typeof v === 'string' && v.trim() !== '';
}

/**
 * @returns {{name: string, feature: string, ok: boolean, missing: string[], critical: boolean}[]}
 */
export function checkIntegrations() {
  return INTEGRATIONS.map((i) => {
    const required = i.required || [];
    const anyOf = i.anyOf || [];

    const missingRequired = required.filter((k) => !has(k));
    const anyOfSatisfied = anyOf.length === 0 || anyOf.some(has);

    const missing = [...missingRequired];
    if (!anyOfSatisfied) missing.push(anyOf.join(' ou '));

    return {
      name: i.name,
      feature: i.feature,
      ok: missing.length === 0,
      missing,
      critical: !!i.critical,
    };
  });
}

/** Journalise le bilan. Ne lève jamais : un défaut de configuration ne doit pas
 *  empêcher le serveur de démarrer, seulement être visible. */
export function reportIntegrations(log = console) {
  const results = checkIntegrations();
  const down = results.filter((r) => !r.ok);

  if (down.length === 0) {
    log.info('[integrations] Toutes les intégrations sont configurées.');
    return results;
  }

  log.warn(`[integrations] ${down.length} intégration(s) désactivée(s) :`);
  for (const r of down) {
    const prefix = r.critical ? '  ⛔' : '  ⚠️ ';
    log.warn(`${prefix} ${r.name} — ${r.feature} indisponible (manque : ${r.missing.join(', ')})`);
  }
  return results;
}
