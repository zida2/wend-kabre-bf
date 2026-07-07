import { getAdminDb } from './firebaseAdmin';
import { sendWhatsApp, sendSms } from './notify';

/**
 * Traite une liste de nouveaux marchés et envoie des notifications (WhatsApp/SMS)
 * aux utilisateurs Premium dont les critères correspondent.
 *
 * @param {Array} newTenders - Liste des nouveaux marchés fraîchement ajoutés (objets complets).
 * @returns {Promise<{success: boolean, alertsSent: number, details: Array}>}
 */
export async function processAlertsForTenders(newTenders) {
  if (!newTenders || newTenders.length === 0) {
    return { success: true, alertsSent: 0, details: [] };
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn("[AlertEngine] Impossible d'initialiser Firebase Admin. Les alertes sont annulées.");
    return { success: false, error: "Firebase Admin non configuré." };
  }

  try {
    // 1. Récupérer tous les utilisateurs Premium avec des alertes actives
    // On doit utiliser getAdminDb() pour contourner les règles Firestore.
    const usersSnap = await adminDb.collection('users')
      .where('isPremium', '==', true)
      .where('alertPrefs.active', '==', true)
      .get();

    const usersToAlert = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (!data.alertPrefs || !data.alertPrefs.phone) return;
      
      usersToAlert.push({
        id: doc.id,
        email: data.email,
        phone: data.alertPrefs.phone,
        channel: data.alertPrefs.channel || 'whatsapp',
        category: data.alertPrefs.category,
        keywords: Array.isArray(data.alertPrefs.keywords) 
          ? data.alertPrefs.keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean)
          : []
      });
    });

    if (usersToAlert.length === 0) {
      console.log("[AlertEngine] Aucun utilisateur Premium avec des alertes actives.");
      return { success: true, alertsSent: 0, details: [] };
    }

    let alertCount = 0;
    const logs = [];

    // 2. Moteur de matching pour chaque utilisateur
    for (const user of usersToAlert) {
      const matchedMarches = newTenders.filter(marche => {
        // Condition 1 : Catégorie correspondante
        const categoryMatch = user.category && marche.category === user.category;
        
        // Condition 2 : Mots-clés correspondants
        const textToSearch = `${marche.title} ${marche.description || ''}`.toLowerCase();
        const keywordMatch = user.keywords.length > 0 && user.keywords.some(kw => textToSearch.includes(kw));

        // L'utilisateur est alerté si le marché est dans sa catégorie OU s'il contient l'un de ses mots-clés.
        return categoryMatch || keywordMatch;
      });

      if (matchedMarches.length > 0) {
        // Construction du message
        const isPlural = matchedMarches.length > 1;
        let messageBody = `🚀 Wend-Kabre : ${matchedMarches.length} nouveau${isPlural ? 'x' : ''} marché${isPlural ? 's' : ''} correspondant à vos critères !\n\n`;

        // On ne met que les 3 premiers pour éviter un message trop long
        matchedMarches.slice(0, 3).forEach((m, idx) => {
          messageBody += `${idx + 1}. ${m.title}\n`;
          if (m.link) messageBody += `🔗 Lien : ${m.link}\n`;
          messageBody += `\n`;
        });

        if (matchedMarches.length > 3) {
          messageBody += `... et ${matchedMarches.length - 3} autre(s) marché(s).\n\n`;
        }

        messageBody += `Connectez-vous sur votre espace client pour consulter les détails : https://wend-kabre.vercel.app/marches\n\nPour gérer vos alertes, rendez-vous dans la section "Mes Alertes".`;

        // Envoi via Twilio
        let sendResult;
        if (user.channel === 'whatsapp') {
          sendResult = await sendWhatsApp(user.phone, messageBody);
        } else {
          sendResult = await sendSms(user.phone, messageBody);
        }

        logs.push({
          user: user.email,
          channel: user.channel,
          phone: user.phone,
          matches: matchedMarches.length,
          success: !sendResult.error,
          error: sendResult.error
        });

        if (!sendResult.error) {
          alertCount++;
        }
      }
    }

    console.log(`[AlertEngine] Traitement terminé. ${alertCount} alerte(s) envoyée(s).`);
    return {
      success: true,
      alertsSent: alertCount,
      details: logs
    };

  } catch (error) {
    console.error("[AlertEngine] Erreur moteur d'alertes:", error);
    return { success: false, error: error.message };
  }
}
