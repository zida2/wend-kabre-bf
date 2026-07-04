import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(request) {
  // Vérification secrète pour éviter que n'importe qui déclenche les alertes
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // ⚠️ NOTE SÉCURITÉ : cette route utilise le SDK client SANS authentification.
  // Depuis le durcissement des règles Firestore, la lecture de `users` exige
  // maintenant un contexte admin/propriétaire → cette route ne pourra plus lister
  // les utilisateurs et renverra donc 0 alerte tant qu'elle n'est pas migrée vers
  // le Firebase Admin SDK (compte de service). Fonctionnalité simulée pour l'instant.

  try {
    // 1. Récupérer tous les utilisateurs Premium
    // NOTE : lister toute la collection `users` nécessitera le Firebase Admin SDK
    // (compte de service côté serveur). Les règles Firestore durcies interdisent la
    // lecture non authentifiée / non-propriétaire de cette collection depuis le SDK
    // client utilisé ici → tant que la migration Admin SDK n'est pas faite, getDocs
    // renverra 0 document et donc 0 alerte.
    const usersSnap = await getDocs(collection(db, 'users'));
    const premiumUsers = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      // Source de vérité canonique : alertPrefs.keywords (tableau). Fallback ancien champ data.keywords.
      const rawKeywords = data.alertPrefs?.keywords ?? data.keywords;
      const keywords = (Array.isArray(rawKeywords)
        ? rawKeywords
        : (typeof rawKeywords === 'string' ? rawKeywords.split(',') : [])
      ).map(k => String(k).trim().toLowerCase()).filter(Boolean);

      if (data.isSubscribed && keywords.length > 0) {
        premiumUsers.push({ id: doc.id, email: data.email, keywords });
      }
    });

    if (premiumUsers.length === 0) {
      return Response.json({ success: true, message: 'Aucun utilisateur premium à alerter.' });
    }

    // 2. Récupérer les marchés récents (dans la vraie vie on prendrait ceux des 24 dernières heures)
    // Pour la démo, on prend tout (idéalement avec une limite ou un tri)
    const marchesSnap = await getDocs(collection(db, 'marches'));
    const marches = [];
    marchesSnap.forEach(doc => {
      marches.push({ id: doc.id, ...doc.data() });
    });

    let alertCount = 0;
    const logs = [];

    // 3. Moteur de matching
    premiumUsers.forEach(user => {
      const matchedMarches = marches.filter(marche => {
        const text = `${marche.title} ${marche.description}`.toLowerCase();
        // Vérifie si au moins un mot-clé de l'utilisateur se trouve dans le texte du marché
        return user.keywords.some(kw => text.includes(kw));
      });

      if (matchedMarches.length > 0) {
        // SIMULATION ENVOI WHATSAPP / EMAIL
        console.log(`[ALERTE] Envoi d'une notification à ${user.email} pour ${matchedMarches.length} marché(s).`);
        logs.push({
          user: user.email,
          matches: matchedMarches.length,
          titles: matchedMarches.map(m => m.title).slice(0, 3) // Affiche les 3 premiers pour le log
        });
        alertCount++;
      }
    });

    return Response.json({
      success: true,
      alertsSent: alertCount,
      details: logs
    });

  } catch (error) {
    console.error('Erreur moteur d\'alertes:', error);
    return Response.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
