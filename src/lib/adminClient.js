'use client';

import { auth } from './firebase';

/**
 * Appelle une route /api/admin/* en joignant l'ID token Firebase de l'admin
 * connecté.
 *
 * Auparavant chaque section lisait `localStorage.getItem('admin_token')`, une
 * clé qui n'était écrite nulle part : l'en-tête partait vide, les routes
 * répondaient 401 et les tableaux restaient silencieusement vides. Le jeton
 * légitime est celui que Firebase Auth détient déjà côté navigateur ; la route
 * serveur le vérifie puis le convertit en jeton de service (cf. lib/adminAuth).
 *
 * @returns {Promise<{ok: boolean, data: any, error: string|null}>}
 */
export async function adminFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, data: null, error: 'Session administrateur expirée. Reconnectez-vous.' };
  }

  let token;
  try {
    token = await user.getIdToken();
  } catch {
    return { ok: false, data: null, error: 'Impossible d\'obtenir un jeton d\'authentification.' };
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    return { ok: false, data: null, error: 'Service injoignable : ' + (e?.message || 'erreur réseau') };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    return { ok: false, data: null, error: `Réponse illisible du serveur (HTTP ${res.status}).` };
  }

  if (!res.ok || data?.success === false) {
    return { ok: false, data, error: data?.error || `HTTP ${res.status}` };
  }

  return { ok: true, data, error: null };
}
