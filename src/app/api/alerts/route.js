import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
  // Vérification secrète pour éviter que n'importe qui lise les données
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Cette route est désormais un outil de diagnostic. 
  // L'envoi réel des alertes est automatisé dans /api/scrape/route.js
  
  const adminDb = await getAdminDb();
  if (!adminDb) {
    return Response.json({
      success: false, 
      message: 'Firebase Admin non configuré. Impossible de lister les utilisateurs.'
    });
  }

  try {
    const usersSnap = await adminDb.collection('users')
      .where('isPremium', '==', true)
      .where('alertPrefs.active', '==', true)
      .get();

    const activeUsers = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      activeUsers.push({
        email: data.email,
        phone: data.alertPrefs?.phone,
        channel: data.alertPrefs?.channel,
        category: data.alertPrefs?.category,
        keywords: data.alertPrefs?.keywords
      });
    });

    return Response.json({
      success: true,
      message: 'Les alertes sont gérées automatiquement par le scraper à chaque nouveau marché détecté. Ceci est un rapport de diagnostic des abonnés.',
      activeSubscribersCount: activeUsers.length,
      activeSubscribers: activeUsers
    });

  } catch (error) {
    console.error('Erreur diagnostic alertes:', error);
    return Response.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
