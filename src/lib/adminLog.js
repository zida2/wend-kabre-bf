import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Journalise une action d'administration dans la collection `admin_logs`.
 * Best-effort : une erreur d'écriture ne doit jamais bloquer l'action métier.
 *
 * @param {string} action  - libellé court (ex: 'subscription_update')
 * @param {object} details - contexte { message, target, ... }
 */
export async function logAdminAction(action, details = {}) {
  try {
    await addDoc(collection(db, 'admin_logs'), {
      action,
      ...details,
      actorEmail: auth.currentUser?.email || 'inconnu',
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[adminLog] écriture échouée:', e?.message || e);
  }
}
