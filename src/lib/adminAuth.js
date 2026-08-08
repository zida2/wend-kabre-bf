/**
 * Frontière de confiance entre le navigateur admin et le microservice de paiement.
 *
 * Le navigateur ne dispose que d'un ID token Firebase (RS256, signé par Google).
 * `payment-service` ne sait vérifier que des JWT HS256 signés avec JWT_SECRET.
 * Les routes /api/admin/* font donc la conversion : elles vérifient l'ID token
 * avec l'Admin SDK, contrôlent que l'appelant est bien administrateur, puis
 * émettent un jeton de service courte durée à destination du microservice.
 *
 * Le navigateur ne voit jamais JWT_SECRET ni le jeton de service.
 *
 * ⚠️ La liste ci-dessous doit rester alignée sur la fonction isAdmin() de
 *    firestore.rules — les règles Firestore sont écrites dans un autre langage
 *    et ne peuvent pas importer cette constante.
 */
import { getAdminAuth } from './firebaseAdmin';
import { mintServiceJwt } from './serviceToken';

export const ADMIN_EMAILS = new Set(['zidadesire20@gmail.com']);

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

/**
 * Vérifie l'en-tête Authorization d'une requête entrante.
 * @returns {Promise<{ok: true, uid: string, email: string} | {ok: false, status: number, error: string}>}
 */
export async function verifyAdminRequest(req) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Authentification administrateur requise.' };
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return { ok: false, status: 401, error: 'Jeton d\'authentification vide.' };
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    // Sans clé de service, impossible de vérifier quoi que ce soit : on refuse
    // plutôt que de laisser passer.
    console.error('[adminAuth] Firebase Admin SDK non configuré — vérification impossible.');
    return { ok: false, status: 503, error: 'Vérification administrateur indisponible (Admin SDK non configuré).' };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (e) {
    return { ok: false, status: 401, error: 'Jeton Firebase invalide ou expiré.' };
  }

  if (!isAdminEmail(decoded.email)) {
    return { ok: false, status: 403, error: 'Accès réservé aux administrateurs.' };
  }

  return { ok: true, uid: decoded.uid, email: decoded.email };
}

/**
 * Raccourci pour les routes proxy admin : vérifie l'appelant et renvoie
 * l'en-tête Authorization à transmettre au microservice.
 */
export async function authorizeAdminProxy(req) {
  const check = await verifyAdminRequest(req);
  if (!check.ok) return check;
  try {
    const token = mintServiceJwt({ uid: check.uid, email: check.email, role: 'ADMIN' });
    return { ok: true, authHeader: `Bearer ${token}`, email: check.email };
  } catch (e) {
    return { ok: false, status: 500, error: e.message };
  }
}
