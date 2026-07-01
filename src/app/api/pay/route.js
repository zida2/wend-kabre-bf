import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { uid, amount, phone, days } = await request.json();

    if (!uid || !amount || !phone) {
      return Response.json({ success: false, error: 'Données manquantes' }, { status: 400 });
    }

    // SIMULATION DE PAIEMENT
    // Dans la réalité, on appellerait l'API CinetPay ou FedaPay ici et on attendrait un webhook.
    // Pour ce MVP, on simule une réponse de succès après 2 secondes.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Déterminer la durée en jours
    let subDays = days;
    if (!subDays) {
      const cleanAmount = amount.toString().replace(/\s|\./g, '');
      if (cleanAmount === '1500') {
        subDays = 7; // Essai 1 semaine
      } else if (cleanAmount.includes('134') || cleanAmount.includes('269')) {
        subDays = 365; // Annuel
      } else {
        subDays = 30; // Mensuel standard
      }
    }

    // Si le paiement est "réussi", on met à jour le statut Premium de l'utilisateur
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isSubscribed: true,
      lastPaymentDate: new Date().toISOString(),
      subscriptionExpiresAt: new Date(Date.now() + subDays * 24 * 60 * 60 * 1000).toISOString()
    });

    return Response.json({ success: true, message: 'Paiement simulé avec succès' });

  } catch (error) {
    console.error('Erreur de paiement:', error);
    return Response.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
