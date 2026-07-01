import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(request) {
  // Vérification secrète pour éviter que n'importe qui déclenche les alertes
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // 1. Récupérer tous les utilisateurs Premium
    const usersSnap = await getDocs(collection(db, 'users'));
    const premiumUsers = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.isSubscribed && data.keywords && data.keywords.length > 0) {
        premiumUsers.push({ id: doc.id, email: data.email, keywords: data.keywords.map(k => k.toLowerCase()) });
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
