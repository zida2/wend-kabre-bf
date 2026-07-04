// ---------------------------------------------------------------------------
// Couche de notifications — SMS + WhatsApp via l'API REST Twilio (§8 du cahier
// des charges).
//
// Principe « zéro configuration bloquante » :
//   - Tant que les clés Twilio ne sont PAS présentes dans l'environnement, le
//     module fonctionne en mode SIMULATION : il journalise le message dans les
//     logs et ne throw jamais. Le reste de l'application peut donc appeler
//     sendSms / sendWhatsApp sans crash, même en développement.
//   - Dès que les variables d'env sont renseignées dans Vercel, l'envoi réel
//     s'active AUTOMATIQUEMENT, sans aucune modification de code.
//
// On utilise volontairement le `fetch` natif (Node 18+/Edge) et NON le package
// `twilio`, pour éviter d'ajouter une dépendance au projet.
//
// Variables d'environnement attendues :
//   TWILIO_ACCOUNT_SID      Identifiant de compte Twilio (commence par « AC… »)
//   TWILIO_AUTH_TOKEN       Jeton d'authentification secret
//   TWILIO_SMS_FROM         Numéro émetteur SMS      (ex. « +226… » ou un Messaging Service SID)
//   TWILIO_WHATSAPP_FROM    Numéro émetteur WhatsApp (ex. « +14155238886 » du sandbox)
// ---------------------------------------------------------------------------

// Lecture paresseuse des variables d'env (pas de cache : Vercel peut les
// injecter au démarrage de la fonction serverless).
function getConfig() {
  return {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    smsFrom: process.env.TWILIO_SMS_FROM,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  };
}

/**
 * Indique si les notifications réelles sont configurées.
 * On ne teste que le couple SID + TOKEN : ce sont les seules clés strictement
 * nécessaires pour authentifier un appel à l'API Twilio.
 * @returns {boolean} true si l'envoi réel est possible, false = mode simulation.
 */
export function notificationsConfigured() {
  const { sid, token } = getConfig();
  return Boolean(sid && token);
}

/**
 * Appel bas niveau à l'API REST Twilio « Messages ».
 * Ne throw jamais : renvoie soit { sid }, soit { error }.
 *
 * @param {string} from  Numéro/identité émettrice (déjà préfixée « whatsapp: » si besoin).
 * @param {string} to    Destinataire (déjà préfixé « whatsapp: » si besoin).
 * @param {string} body  Contenu du message.
 * @returns {Promise<{sid?: string, error?: string}>}
 */
async function sendViaTwilio(from, to, body) {
  const { sid, token } = getConfig();

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

    // Twilio attend un corps application/x-www-form-urlencoded.
    const form = new URLSearchParams();
    form.set('From', from);
    form.set('To', to);
    form.set('Body', body);

    // Authentification HTTP Basic : base64("SID:TOKEN").
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Twilio renvoie un message d'erreur lisible dans data.message.
      const message = data?.message || `HTTP ${res.status}`;
      console.error('[notify] Échec Twilio:', message);
      return { error: message };
    }

    return { sid: data.sid };
  } catch (e) {
    // Erreur réseau ou autre : on reste silencieux côté appelant.
    console.error('[notify] Exception Twilio:', e.message);
    return { error: e.message };
  }
}

/**
 * Envoie un SMS.
 * @param {string} to    Numéro destinataire au format international (ex. « +226… »).
 * @param {string} body  Contenu du message.
 * @returns {Promise<{simulated?: true, to?: string, sid?: string, error?: string}>}
 */
export async function sendSms(to, body) {
  if (!notificationsConfigured()) {
    // Mode simulation : on journalise et on rend un résultat neutre.
    console.log('[notify][SIMULATION] SMS ->', to, body);
    return { simulated: true, to };
  }

  const { smsFrom } = getConfig();
  return sendViaTwilio(smsFrom, to, body);
}

/**
 * Envoie un message WhatsApp.
 * Twilio exige le préfixe « whatsapp: » devant l'émetteur ET le destinataire.
 * @param {string} to    Numéro destinataire au format international (ex. « +226… »).
 * @param {string} body  Contenu du message.
 * @returns {Promise<{simulated?: true, to?: string, sid?: string, error?: string}>}
 */
export async function sendWhatsApp(to, body) {
  if (!notificationsConfigured()) {
    // Mode simulation : on journalise et on rend un résultat neutre.
    console.log('[notify][SIMULATION] WhatsApp ->', to, body);
    return { simulated: true, to };
  }

  const { whatsappFrom } = getConfig();
  return sendViaTwilio(`whatsapp:${whatsappFrom}`, `whatsapp:${to}`, body);
}
