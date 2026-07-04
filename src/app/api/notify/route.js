// ---------------------------------------------------------------------------
// Route API — Notifications (§8 du cahier des charges)
//
// RÔLE ACTUEL
//   Cette route est LE point d'entrée d'envoi de notifications (SMS / WhatsApp
//   via Twilio, cf. src/lib/notify.js) ainsi qu'un endpoint de TEST : on peut
//   lui POSTer { to, channel, message } pour vérifier la chaîne d'envoi.
//
// CE QUI N'EST PAS (ENCORE) IMPLÉMENTÉ — déclenchement automatique
//   L'objectif fonctionnel « quand un nouveau marché correspond aux mots-clés
//   d'un utilisateur, on le notifie » n'est PAS géré ici. Sa réalisation exige
//   deux briques absentes du contexte actuel :
//
//     1. Le FIREBASE ADMIN SDK (côté serveur, avec un compte de service).
//        Les règles de sécurité Firestore ont été durcies : un client ne peut
//        pas lister l'ensemble des utilisateurs ni lire leurs préférences de
//        notification. Pour croiser « nouveaux marchés » x « mots-clés des
//        users », il faut un accès privilégié serveur → Firebase Admin.
//
//     2. Un WORKER / CRON dédié qui, après chaque scrape, parcourt les marchés
//        fraîchement ajoutés, retrouve les utilisateurs concernés et appelle
//        sendSms / sendWhatsApp. C'est ce worker qui utiliserait cette route
//        (ou directement src/lib/notify.js).
//
//   Tant que ces briques ne sont pas en place, la logique de matching reste à
//   construire ; cette route se limite à l'envoi et au test.
// ---------------------------------------------------------------------------

import { sendSms, sendWhatsApp, notificationsConfigured } from '@/lib/notify';

// Envoi réseau vers Twilio : on laisse un peu de marge de temps d'exécution.
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * Vérifie l'autorisation de l'appel.
 * Logique alignée sur src/app/api/scrape/route.js :
 *   - En-tête « Authorization: Bearer <CRON_SECRET> » (cron Vercel).
 *   - Ou paramètre ?secret=<SCRAPER_SECRET> (appel serveur du propriétaire).
 *   - Ou paramètre ?secret=<NEXT_PUBLIC_SCRAPER_SECRET> (déclencheur manuel).
 * @param {Request} request
 * @returns {boolean}
 */
function isAuthorized(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization') || '';

  const cronSecret = process.env.CRON_SECRET;
  const scraperSecret = process.env.SCRAPER_SECRET;
  const publicTrigger = process.env.NEXT_PUBLIC_SCRAPER_SECRET;

  const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isServerSecret = !!scraperSecret && secret === scraperSecret;
  const isManualTrigger = !!publicTrigger && secret === publicTrigger;

  return isCron || isServerSecret || isManualTrigger;
}

export async function POST(request) {
  // 1. Autorisation (même contrat que la route de scraping).
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Lecture du corps JSON (optionnel).
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    // Corps vide ou invalide : on tolère, il n'est pas obligatoire.
    payload = {};
  }

  const { to, channel, message } = payload || {};

  // 3. Sans destinataire ni message, on renvoie simplement l'état de config.
  //    Utile pour un « ping » de santé de la route.
  if (!to || !message) {
    return Response.json({
      ok: true,
      configured: notificationsConfigured(),
      hint: "POSTez { to, channel: 'sms'|'whatsapp', message } pour un envoi de test.",
    });
  }

  // 4. Envoi de test via la couche notify.js.
  //    channel === 'whatsapp' → WhatsApp ; sinon SMS par défaut.
  const result =
    channel === 'whatsapp'
      ? await sendWhatsApp(to, message)
      : await sendSms(to, message);

  return Response.json({
    ok: !result.error,
    channel: channel === 'whatsapp' ? 'whatsapp' : 'sms',
    configured: notificationsConfigured(),
    result,
  });
}
