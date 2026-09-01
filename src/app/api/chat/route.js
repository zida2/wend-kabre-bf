import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 30;
export const runtime = 'nodejs';

// Liste de modèles Hugging Face gratuits à essayer (du meilleur au fallback)
const HF_MODELS = [
  'mistralai/Mistral-7B-Instruct-v0.2',
  'microsoft/DialoGPT-medium',
  'facebook/blenderbot-400M-distill',
];

// Utilisation de l'API Hugging Face (gratuite, open source)
async function callHuggingFaceAPI(messages, systemPrompt) {
  // Préparer le prompt simplifié pour éviter les problèmes
  const lastMessage = messages[messages.length - 1];
  const userQuestion = lastMessage?.content || '';
  
  const fullPrompt = `${systemPrompt}\n\nQuestion: ${userQuestion}\n\nRéponse:`;
  
  let lastError = null;
  
  // Essayer chaque modèle jusqu'à ce qu'un fonctionne
  for (const modelName of HF_MODELS) {
    try {
      console.log(`[HF API] Trying model: ${modelName}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
      
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 300,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false,
            },
            options: {
              wait_for_model: true,
              use_cache: false,
            },
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[HF API] ${modelName} error:`, errorText);
        
        if (response.status === 503) {
          lastError = new Error('LOADING');
          continue; // Essayer le prochain modèle
        }
        
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      // Vérifier si le modèle est en cours de chargement
      if (data.error) {
        console.error(`[HF API] ${modelName} data error:`, data.error);
        if (data.error.includes('loading') || data.error.includes('currently loading')) {
          lastError = new Error('LOADING');
          continue;
        }
        lastError = new Error(data.error);
        continue;
      }
      
      // Extraire la réponse
      const generatedText = data[0]?.generated_text || data.generated_text;
      
      if (generatedText && generatedText.trim()) {
        console.log(`[HF API] Success with ${modelName}`);
        return generatedText.trim();
      }
      
      console.warn(`[HF API] ${modelName} returned empty response`);
      lastError = new Error('Empty response');
      continue;
      
    } catch (err) {
      console.error(`[HF API] ${modelName} failed:`, err.message);
      lastError = err;
      
      // Si c'est un timeout ou abort, essayer le prochain
      if (err.name === 'AbortError') {
        continue;
      }
      
      // Si c'est une erreur réseau, essayer le prochain
      continue;
    }
  }
  
  // Si tous les modèles ont échoué, retourner un message approprié
  if (lastError?.message === 'LOADING') {
    return "🤖 Les modèles IA sont en cours de chargement (environ 20 secondes). Veuillez réessayer dans un instant.";
  }
  
  // Fallback : réponse générique basée sur le contexte
  return generateFallbackResponse(userQuestion);
}

// Génère une réponse de base si toutes les APIs échouent
function generateFallbackResponse(question) {
  const q = question.toLowerCase();
  
  if (q.includes('document') || q.includes('pièce') || q.includes('fournir')) {
    return `📋 **Pièces obligatoires** (validité < 3 mois) :

1. Attestation fiscale (DGI)
2. Attestation CNSS
3. Attestation AJE (Agrément Judiciaire des Entreprises)
4. Attestation DRTSS
5. Attestation RCCM
6. Certificat de non-faillite

Pour plus de détails, consultez le [Guide de Soumission](/guide-soumission).

⚠️ Note : L'IA est temporairement indisponible. Cette réponse est basée sur les règles ARCOP 2024-2025.`;
  }
  
  if (q.includes('seuil') || q.includes('montant') || q.includes('million')) {
    return `💰 **Seuils des marchés publics** (Art. 6 ARCOP) :

• **< 1 million FCFA** : Cotation non formelle
• **1M - 20M FCFA** : Cotation formelle  
• **20M - 150M FCFA** (travaux) : Demande de prix
• **≥ 150M FCFA** (travaux) : Appel d'offres

Pour fournitures et services, les seuils diffèrent légèrement.

Pour plus de détails, consultez le [Guide de Soumission](/guide-soumission).

⚠️ Note : L'IA est temporairement indisponible. Cette réponse est basée sur les règles ARCOP 2024-2025.`;
  }
  
  if (q.includes('préférence') || q.includes('pme') || q.includes('%')) {
    return `🇧🇫 **Préférences nationales** :

• PME burkinabè : **+5%**
• Entreprise communautaire : **+10%**
• Produits UEMOA : **+15%**
• **Maximum cumulé : 20%**

Ces préférences s'appliquent lors de la comparaison des offres.

Pour plus de détails, consultez le [Guide de Soumission](/guide-soumission).

⚠️ Note : L'IA est temporairement indisponible. Cette réponse est basée sur les règles ARCOP 2024-2025.`;
  }
  
  // Réponse générique
  return `🤖 **Service temporairement indisponible**

Les modèles d'IA sont actuellement inaccessibles. En attendant, je vous recommande de :

1. 📖 Consulter le [Guide de Soumission complet](/guide-soumission)
2. 📋 Parcourir les [marchés disponibles](/marches)
3. 💎 Découvrir les [offres Premium](/tarifs)

**Informations clés ARCOP 2024-2025** :
• Cadre légal : Loi n°005-2024/ALT (20 avril 2024)
• 6 pièces obligatoires (< 3 mois de validité)
• Seuils : 1M, 20M, 150M FCFA
• Préférences PME : jusqu'à 20%

Veuillez réessayer dans quelques instants, le service devrait être rétabli.`;
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
