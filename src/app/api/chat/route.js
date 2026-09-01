import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 30;
export const runtime = 'nodejs';

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
              error: 'Premium requis' 
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (premiumError) {
      console.error('[Chat API] Premium check error:', premiumError);
      // Continue anyway
    }

    const body = await req.json();
    const { messages } = body;
    
    console.log('[Chat API] Messages count:', messages?.length);

    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error('[Chat API] GEMINI_API_KEY missing');
      return new Response(JSON.stringify({ error: 'API key missing' }), { status: 503 });
    }

    console.log('[Chat API] Creating Google AI client...');
    const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });

    const systemPrompt = 'Tu es un expert en marchés publics au Burkina Faso. Aide à rédiger des offres conformes aux normes ARCOP 2024-2025. Cite toujours les articles de loi pertinents. Renvoie au /guide-soumission pour plus de détails. Sois professionnel, précis et en français.';

    console.log('[Chat API] Calling streamText...');
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: messages || [],
    });

    console.log('[Chat API] Stream OK, converting to UI response...');
    return result.toUIMessageStreamResponse({
      getErrorMessage: (error) => {
        console.error('[Chat API] Stream error:', error);
        return String(error?.message || 'Une erreur est survenue');
      }
    });
    
  } catch (error) {
    console.error('[Chat API] Fatal error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur: ${error?.message || 'Unknown error'}`,
        details: error?.name || 'Unknown'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
