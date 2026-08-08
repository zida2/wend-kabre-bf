import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { syncSubscriptionToFirestore } from '@/lib/subscriptionSync';
import { isAdminEmail } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * Aligne le document Firestore de l'appelant sur son abonnement réel côté
 * payment-service. Appelée au retour de Money Fusion et à l'ouverture de la
 * page d'abonnement.
 *
 * L'utilisateur ne peut synchroniser que son propre compte ; un administrateur
 * peut viser n'importe quel `userId` (réparation manuelle depuis la console).
 */
/** Comparaison à durée constante, pour ne pas divulguer le secret octet par octet. */
function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  // ── Voie 1 : appel serveur-à-serveur depuis payment-service ──────────────
  // Déclenché par le webhook Money Fusion dès que le paiement est validé, pour
  // que l'accès soit accordé même si le client ne revient jamais sur le site.
  const syncSecret = process.env.APP_SYNC_SECRET;
  if (secretMatches(req.headers.get('x-sync-secret'), syncSecret)) {
    let userId: string | undefined;
    try {
      userId = (await req.json())?.userId;
    } catch {
      // corps illisible
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requis pour une synchronisation serveur.' },
        { status: 400 }
      );
    }
    try {
      const result = await syncSubscriptionToFirestore(userId);
      return NextResponse.json({ success: true, ...result }, { status: 200 });
    } catch (error: any) {
      console.error('[subscription/sync] Échec synchronisation serveur:', error?.message);
      return NextResponse.json({ success: false, error: error?.message }, { status: 502 });
    }
  }

  // ── Voie 2 : appel navigateur, authentifié par ID token Firebase ─────────
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authentification requise.' },
      { status: 401 }
    );
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { success: false, error: 'Service de synchronisation indisponible (Admin SDK non configuré).' },
      { status: 503 }
    );
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice('Bearer '.length).trim());
  } catch {
    return NextResponse.json(
      { success: false, error: 'Jeton Firebase invalide ou expiré.' },
      { status: 401 }
    );
  }

  let requestedUserId: string | undefined;
  try {
    const body = await req.json();
    requestedUserId = body?.userId;
  } catch {
    // Corps vide : on synchronise l'appelant.
  }

  const targetUserId = requestedUserId || decoded.uid;
  if (targetUserId !== decoded.uid && !isAdminEmail(decoded.email)) {
    return NextResponse.json(
      { success: false, error: 'Vous ne pouvez synchroniser que votre propre abonnement.' },
      { status: 403 }
    );
  }

  try {
    const result = await syncSubscriptionToFirestore(targetUserId);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    console.error('[subscription/sync] Échec synchronisation:', error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || 'Échec de la synchronisation de l\'abonnement.' },
      { status: 502 }
    );
  }
}
