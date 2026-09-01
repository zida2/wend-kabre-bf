import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    // Accès réservé aux utilisateurs connectés
    const authResult = await verifyFirebaseToken(req);
    if (!authResult.ok) {
      return new Response(JSON.stringify({ error: 'Connexion requise' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Vérification Premium
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      
      if (projectId && apiKey) {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${authResult.uid}?key=${apiKey}`;
        const userResponse = await fetch(firestoreUrl);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const isSubscribed = userData?.fields?.isSubscribed?.booleanValue;
          
          if (!isSubscribed) {
            return new Response(JSON.stringify({ 
              error: 'Premium requis. Consultez /tarifs.' 
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (premiumError) {
      console.error('Premium check error:', premiumError);
    }

    const { messages } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API indisponible' }), { status: 503 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const systemPrompt = `Tu es l'Assistant IA officiel de Wend-Kabré pour les marchés publics au Burkina Faso.

RÈGLE ABSOLUE : Toutes tes réponses doivent s'appuyer sur le Guide de Soumission officiel. Cite toujours les articles de loi.

CADRE RÉGLEMENTAIRE :
- Loi n°005-2024/ALT (20 avril 2024)
- Décret n°2024-1748 (31 décembre 2024)
- Arrêté n°2025-0323 (9 juillet 2025)
- Arrêté n°2025/349 (28 juillet 2025)

PIÈCES OBLIGATOIRES (< 3 mois) :
1. Attestation fiscale (DGI)
2. Attestation CNSS
3. Attestation AJE
4. Attestation DRTSS
5. Attestation RCCM
6. Certificat non-faillite

SEUILS (Art. 6) :
État/EPE/Sociétés d'État ont seuils différents
< 1M : Cotation non formelle
1M-20M : Cotation formelle
20M-150M travaux / 100M fournitures : Demande prix
≥150M travaux / 100M fournitures : Appel d'offres

OFFRE TECHNIQUE (12 sections) :
1. Garde + Matières
2. Lettre (datée, signée)
3. Présentation
4. Compréhension besoin
5. Méthodologie ⭐ CRUCIAL
6. Moyens humains
7. Moyens matériels
8. Qualité & Risques
9. Planning (Gantt)
10. Références
11. Annexes
12. Engagements

TAILLE : Petit 20-30p / Moyen 35-60p / Grand 60-120p

DÉLAIS :
Offres : 30j national / 45j communautaire
Éclaircissements : Demande 14j avant, réponse 7j
Paiements : Avance 45j / Acompte 60j / Solde 90j
Pénalités : 5% max montant HT

GARANTIES :
Soumission : 1-3% montant
Bonne exécution : Normal + majoré 30-40% si offre basse

PRÉFÉRENCES CUMULABLES :
PME burkinabè : +5%
Communautaire : +10%
Produits UEMOA : +15%
Ancrage local : +5%
Sous-traitance 30% : +5%
Max : 20%

ENVELOPPES (2024) :
Travaux/Fournitures/Services : UNIQUE
Prestations intellect : DOUBLE

TON RÔLE :
- Citations articles obligatoires
- Renvoyer /guide-soumission
- Montants/délais/pièces précis
- Expert, pédagogue, poli
- Français obligatoire

Réponds en mettant le contexte du Guide de Soumission. Ne donne jamais de conseils génériques.`;

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse({
      getErrorMessage: (error) => String(error?.message || error),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erreur serveur' }), 
      { status: 500 }
    );
  }
}
