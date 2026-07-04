// Garde d'authentification pour les routes API (côté serveur).
//
// Le projet n'utilise PAS le Firebase Admin SDK : on ne peut donc pas
// vérifier la signature du token hors-ligne. On effectue à la place une
// vérification « légère » en appelant l'API REST Identity Toolkit de Google,
// qui valide le idToken auprès des serveurs Firebase et retourne les infos
// du compte associé.
//
// ⚠️ Vérification « légère » : elle nécessite un aller-retour réseau et ne
// remplace pas une vérification cryptographique locale (comme le ferait
// l'Admin SDK). Elle reste néanmoins suffisante pour GATER l'accès aux
// routes coûteuses (IA) : seul un utilisateur réellement connecté possède
// un idToken accepté par Identity Toolkit.

/**
 * Vérifie le token Firebase présent dans l'en-tête Authorization d'une requête.
 *
 * @param {Request} request - La requête entrante.
 * @returns {Promise<{ok: boolean, uid?: string, email?: string}>}
 */
export async function verifyFirebaseToken(request) {
  try {
    // 1. Lecture de l'en-tête « Authorization: Bearer <idToken> ».
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { ok: false };
    }
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) {
      return { ok: false };
    }

    // 2. Vérification du token auprès d'Identity Toolkit.
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      // Sans clé, impossible de vérifier : on refuse par sécurité.
      return { ok: false };
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return { ok: false };
    }

    const data = await res.json();
    const user = data?.users?.[0];
    if (!user) {
      return { ok: false };
    }

    // 3. Token valide : on renvoie l'identité de l'utilisateur.
    return { ok: true, uid: user.localId, email: user.email };
  } catch {
    // Toute erreur (réseau, JSON, etc.) est traitée comme un refus propre.
    return { ok: false };
  }
}
