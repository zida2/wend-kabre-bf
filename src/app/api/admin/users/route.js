import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { userId, days } = await request.json();

    if (!userId || days === undefined) {
      return NextResponse.json({ success: false, error: 'Paramètres manquants' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (days === 0) {
      // Désactiver l'abonnement
      await updateDoc(userRef, {
        isSubscribed: false,
        subscriptionExpiresAt: null
      });
      return NextResponse.json({ success: true, message: 'Abonnement désactivé' });
    }

    // Activer ou prolonger l'abonnement
    let expirationDate = new Date();
    const userData = userSnap.data();

    // S'il a déjà un abonnement actif, on ajoute les jours à partir de son expiration
    if (userData.isSubscribed && userData.subscriptionExpiresAt) {
      const currentExp = new Date(userData.subscriptionExpiresAt);
      if (currentExp > new Date()) {
        expirationDate = currentExp;
      }
    }

    expirationDate.setDate(expirationDate.getDate() + days);

    await updateDoc(userRef, {
      isSubscribed: true,
      subscriptionExpiresAt: expirationDate.toISOString(),
      isTrial: days <= 7
    });

    // Envoi de l'email automatique si on active un abonnement (notamment les 2 jours d'essai)
    if (userData.email) {
      const isTrial = days <= 7;
      const subject = isTrial 
        ? "🎁 Votre essai gratuit sur Wend-Kabré est activé !" 
        : "✅ Votre abonnement Wend-Kabré est activé !";
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #064E3B;">Bienvenue sur Wend-Kabré, ${userData.name || ''} !</h2>
          <p>Nous avons le plaisir de vous informer que votre accès Premium a été activé avec succès.</p>
          ${isTrial 
            ? `<p><strong>Vous bénéficiez d'un essai gratuit de ${days} jours</strong> pour découvrir notre plateforme et recevoir vos premières alertes d'appels d'offres.</p>` 
            : `<p>Votre abonnement a été prolongé de ${days} jours.</p>`
          }
          <p><strong>Expiration prévue le :</strong> ${expirationDate.toLocaleDateString('fr-FR')}</p>
          <div style="background-color: #F0FDF4; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #064E3B;">Vos prochaines étapes :</h3>
            <ol style="margin-bottom: 0;">
              <li>Connectez-vous à votre tableau de bord.</li>
              <li>Configurez vos <strong>mots-clés</strong> (ex: Informatique, Bâtiment).</li>
              <li>Consultez les marchés correspondants et suivez vos candidatures.</li>
            </ol>
          </div>
          <p>
            <a href="https://wend-kabre-bf.vercel.app/dashboard" style="background-color: #10B981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder à mon Espace PME</a>
          </p>
          <p style="font-size: 0.9em; color: #666; margin-top: 30px;">Si vous avez des questions, répondez simplement à cet email.</p>
        </div>
      `;

      // On lance l'envoi en arrière-plan pour ne pas ralentir la réponse de l'API
      sendEmail({
        to: userData.email,
        subject,
        html: htmlBody
      }).catch(console.error);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Abonnement activé pour ${days} jours`,
      expiresAt: expirationDate.toISOString()
    });

  } catch (error) {
    console.error('Erreur API Admin Users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
