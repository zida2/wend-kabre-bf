import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 30;
export const runtime = 'nodejs';

// Utilisation de l'API Hugging Face (gratuite, open source)
// Pas besoin de clé API pour le mode inference gratuit
async function callHuggingFaceAPI(messages, systemPrompt) {
  // Préparer le prompt complet
  const conversation = messages.map(m => {
    return `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`;
  }).join('\n\n');
  
  const fullPrompt = `${systemPrompt}\n\n${conversation}\n\nAssistant:`;
  
  // Appel à l'API Hugging Face en mode inference gratuit (sans clé API requise)
  // Utilise un modèle plus petit et rapide pour éviter les timeouts
  const response = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_length: 500,
          temperature: 0.8,
          top_p: 0.9,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[HF API] Error:', error);
    
    // Si le modèle est en cours de chargement, retourner un message informatif
    if (response.status === 503) {
      return "Je suis en train de me réveiller... Cela prend environ 20 secondes. Veuillez réessayer dans un instant. 🤖";
    }
    
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Vérifier si le modèle est en cours de chargement
  if (data.error && data.error.includes('loading')) {
    return "Modèle en cours de chargement... Cela prend environ 20 secondes. Veuillez patienter et réessayer. ⏳";
  }
  
  return data[0]?.generated_text || data.generated_text || 'Erreur lors de la génération de la réponse.';
}

export async function POST(req) {
  console.log('[Chat API] Request reçue');
  
  try {
    // Accès réservé aux utilisateurs connectés
    const authResult = await verifyFirebaseToken(req);
    if (!authResult.ok) {
      console.log('[Chat API] Auth failed');
      return new Response(JSON.stringify({ error: 'Connexion requise' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('[Chat API] Auth OK:', authResult.uid);

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
          console.log('[Chat API] isSubscribed:', isSubscribed);
          
          if (!isSubscribed) {
            console.log('[Chat API] Premium check FAILED');
            return new Response(JSON.stringify({ 
              error: 'L\'Assistant IA est réservé aux abonnés Premium. Consultez /tarifs.' 
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (premiumError) {
      console.error('[Chat API] Premium check error:', premiumError);
    }

    const body = await req.json();
    const { messages } = body;
    
    console.log('[Chat API] Messages count:', messages?.length);

    const systemPrompt = `Tu es un expert en marchés publics au Burkina Faso. Tu aides les entreprises à préparer leurs offres conformes aux normes ARCOP 2024-2025.

CADRE RÉGLEMENTAIRE :
- Loi n°005-2024/ALT (20 avril 2024)
- Décret n°2024-1748 (31 décembre 2024)
- Arrêté n°2025-0323 (9 juillet 2025)

PIÈCES OBLIGATOIRES (< 3 mois) :
1. Attestation fiscale (DGI)
2. Attestation CNSS
3. Attestation AJE
4. Attestation DRTSS
5. Attestation RCCM
6. Certificat non-faillite

SEUILS (Art. 6) :
< 1M : Cotation non formelle
1M-20M : Cotation formelle
20M-150M travaux : Demande de prix
≥150M travaux : Appel d'offres

PRÉFÉRENCES :
PME burkinabè : +5%
Communautaire : +10%
Produits UEMOA : +15%
Max cumulé : 20%

TON RÔLE :
- Citer les articles de loi
- Renvoyer au /guide-soumission
- Être précis et professionnel
- Répondre en français

Réponds de manière concise et professionnelle.`;

    console.log('[Chat API] Calling Hugging Face API...');
    
    const aiResponse = await callHuggingFaceAPI(messages, systemPrompt);
    
    console.log('[Chat API] Response OK');

    // Retourner la réponse au format attendu par le client
    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: aiResponse,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('[Chat API] Fatal error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur: ${error?.message || 'Une erreur est survenue'}`,
        details: error?.name || 'Unknown'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
