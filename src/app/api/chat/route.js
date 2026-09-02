import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 30;
export const runtime = 'nodejs';

// Moteur conversationnel intelligent basé sur ARCOP
function generateIntelligentResponse(messages, question) {
  const q = question.toLowerCase();
  const previousMessages = messages.slice(0, -1); // Tous les messages sauf le dernier
  const hasContext = previousMessages.length > 0;
  
  // Détection d'intentions
  const intent = detectIntent(q);
  
  switch (intent) {
    case 'GREETING':
      return handleGreeting(q, hasContext);
    
    case 'DOCUMENTS':
      return handleDocuments(q);
    
    case 'SEUILS':
      return handleSeuils(q);
    
    case 'PREFERENCES':
      return handlePreferences(q);
    
    case 'METHODOLOGIE':
      return handleMethodologie(q);
    
    case 'OFFRE_TECHNIQUE':
      return handleOffreTechnique(q);
    
    case 'OFFRE_FINANCIERE':
      return handleOffreFinanciere(q);
    
    case 'DELAIS':
      return handleDelais(q);
    
    case 'ARCOP':
      return handleARCOP(q);
    
    case 'AIDE':
      return handleAide(q);
    
    default:
      return handleGeneral(q, previousMessages);
  }
}

function detectIntent(question) {
  const q = question.toLowerCase();
  
  // Salutations
  if (/^(bonjour|salut|hello|hi|bonsoir|hey|coucou)\b/i.test(q)) {
    return 'GREETING';
  }
  
  // Documents
  if (/(document|pièce|attestation|fournir|fourniture|certificat|dossier)/i.test(q)) {
    return 'DOCUMENTS';
  }
  
  // Seuils
  if (/(seuil|montant|million|prix|coût|valeur|combien)/i.test(q)) {
    return 'SEUILS';
  }
  
  // Préférences
  if (/(préférence|pme|national|burkinabè|avantage|%|pourcent)/i.test(q)) {
    return 'PREFERENCES';
  }
  
  // Méthodologie
  if (/(méthod|structur|organis|planif|approche|comment faire)/i.test(q)) {
    return 'METHODOLOGIE';
  }
  
  // Offre technique
  if (/(offre technique|technique|méthodologie|équipe|moyens|matériel)/i.test(q)) {
    return 'OFFRE_TECHNIQUE';
  }
  
  // Offre financière
  if (/(offre financière|prix|devis|bordereau|quantit)/i.test(q)) {
    return 'OFFRE_FINANCIERE';
  }
  
  // Délais
  if (/(délai|date|quand|durée|temps|calendrier)/i.test(q)) {
    return 'DELAIS';
  }
  
  // ARCOP
  if (/(arcop|loi|décret|réglementation|légal|juridique)/i.test(q)) {
    return 'ARCOP';
  }
  
  // Aide
  if (/(aide|aider|expliqu|comprend|besoin)/i.test(q)) {
    return 'AIDE';
  }
  
  return 'GENERAL';
}

function handleGreeting(q, hasContext) {
  const responses = [
    "Bonjour ! 👋 Je suis ravi de vous aider avec vos questions sur les marchés publics au Burkina Faso. Que souhaitez-vous savoir ?",
    "Salut ! 🤖 Je suis votre assistant expert ARCOP. Posez-moi vos questions sur les documents, les seuils, la rédaction d'offres... Je suis là pour vous aider !",
    "Bonjour ! Bienvenue sur votre assistant marchés publics. Je connais toute la réglementation ARCOP 2024-2025. Comment puis-je vous accompagner aujourd'hui ?",
  ];
  
  if (hasContext) {
    return "Bonjour ! 😊 Content de vous revoir. Comment puis-je vous aider davantage ?";
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function handleDocuments(q) {
  // Extraction du montant si mentionné
  const montantMatch = q.match(/(\d+)\s*(million|m|fcfa)?/i);
  const montant = montantMatch ? parseInt(montantMatch[1]) : null;
  
  let response = `📋 **Pièces obligatoires pour tout marché** (validité < 3 mois) :\n\n`;
  response += `1️⃣ **Attestation fiscale** (DGI)\n`;
  response += `2️⃣ **Attestation CNSS** (Caisse Nationale de Sécurité Sociale)\n`;
  response += `3️⃣ **Attestation AJE** (Agrément Judiciaire des Entreprises)\n`;
  response += `4️⃣ **Attestation DRTSS** (Direction Régionale du Travail)\n`;
  response += `5️⃣ **Attestation RCCM** (Registre du Commerce)\n`;
  response += `6️⃣ **Certificat de non-faillite**\n\n`;
  
  if (montant) {
    if (montant >= 150) {
      response += `💡 **Pour un marché de ${montant}M FCFA** (appel d'offres), vous devez aussi fournir :\n`;
      response += `• Caution de soumission (1-3% du montant)\n`;
      response += `• Références de projets similaires\n`;
      response += `• Moyens humains et matériels\n\n`;
    } else if (montant >= 20) {
      response += `💡 **Pour un marché de ${montant}M FCFA** (demande de prix), ajoutez :\n`;
      response += `• Références d'expérience\n`;
      response += `• Capacités techniques\n\n`;
    }
  }
  
  response += `⚠️ **Important** : Toutes ces attestations doivent avoir **moins de 3 mois** à la date de soumission !\n\n`;
  response += `📖 Pour plus de détails, consultez le [Guide de Soumission complet](/guide-soumission).`;
  
  return response;
}

function handleSeuils(q) {
  let response = `💰 **Seuils des marchés publics** selon l'Art. 6 du Code ARCOP :\n\n`;
  response += `**TRAVAUX** 🏗️\n`;
  response += `• **< 1 million** : Cotation non formelle\n`;
  response += `• **1M à 20M** : Cotation formelle\n`;
  response += `• **20M à 150M** : Demande de prix\n`;
  response += `• **≥ 150M** : Appel d'offres\n\n`;
  
  response += `**FOURNITURES & SERVICES** 📦\n`;
  response += `• **< 500 000** : Cotation non formelle\n`;
  response += `• **500K à 15M** : Cotation formelle\n`;
  response += `• **15M à 100M** : Demande de prix\n`;
  response += `• **≥ 100M** : Appel d'offres\n\n`;
  
  response += `💡 **Conseil** : Plus le montant est élevé, plus le dossier doit être complet et détaillé !\n\n`;
  response += `Besoin d'aide pour préparer un dossier ? Je peux vous guider sur les documents nécessaires. 📋`;
  
  return response;
}

function handlePreferences(q) {
  let response = `🇧🇫 **Préférences nationales et avantages** :\n\n`;
  response += `**MARGE DE PRÉFÉRENCE**\n`;
  response += `• PME burkinabè : **+5%** 🏢\n`;
  response += `• Entreprise communautaire (UEMOA) : **+10%** 🌍\n`;
  response += `• Produits/services UEMOA : **+15%** 📦\n`;
  response += `• **Maximum cumulé : 20%**\n\n`;
  
  response += `**COMMENT ÇA MARCHE ?** 🤔\n`;
  response += `Si votre offre est 15% plus chère qu'un concurrent étranger, vous pouvez quand même gagner grâce aux préférences !\n\n`;
  
  response += `**EXEMPLE CONCRET** 💡\n`;
  response += `• Concurrent étranger : 100M FCFA\n`;
  response += `• Votre offre PME burkinabè : 104M FCFA\n`;
  response += `• Avec préférence +5% : 100M × 1.05 = 105M\n`;
  response += `• **Résultat : Vous gagnez !** 🎉\n\n`;
  response += `Ces avantages favorisent l'économie locale. En avez-vous d'autres questions sur ce sujet ?`;
  
  return response;
}

function handleMethodologie(q) {
  let response = `📝 **Comment structurer votre offre technique** :\n\n`;
  response += `**1. COMPRÉHENSION DU PROJET** 🎯\n`;
  response += `• Reformulez les besoins du client\n`;
  response += `• Identifiez les enjeux et contraintes\n`;
  response += `• Montrez que vous avez bien compris\n\n`;
  
  response += `**2. MÉTHODOLOGIE** 🔧\n`;
  response += `• Décrivez votre approche étape par étape\n`;
  response += `• Expliquez COMMENT vous allez faire\n`;
  response += `• Justifiez vos choix techniques\n\n`;
  
  response += `**3. PLANNING & ORGANISATION** 📅\n`;
  response += `• Calendrier détaillé (diagramme de Gantt)\n`;
  response += `• Répartition des tâches\n`;
  response += `• Points de contrôle qualité\n\n`;
  
  response += `**4. MOYENS** 👥\n`;
  response += `• Équipe : CV + organigramme\n`;
  response += `• Matériel : liste détaillée\n`;
  response += `• Sous-traitants éventuels\n\n`;
  
  response += `💡 **Astuce** : Soyez concret ! Évitez les généralités, donnez des détails spécifiques à ce projet.\n\n`;
  response += `Besoin d'aide sur une partie spécifique ? Demandez-moi !`;
  
  return response;
}

function handleOffreTechnique(q) {
  return handleMethodologie(q);
}

function handleOffreFinanciere(q) {
  let response = `💵 **Comment préparer votre offre financière** :\n\n`;
  response += `**ÉLÉMENTS À INCLURE** 📊\n`;
  response += `• Bordereau des prix unitaires\n`;
  response += `• Devis quantitatif et estimatif\n`;
  response += `• Détail des coûts (main d'œuvre, matériaux, etc.)\n`;
  response += `• Taxes (TVA, etc.)\n`;
  response += `• Total TTC en chiffres ET en lettres\n\n`;
  
  response += `**CONSEILS IMPORTANTS** ⚠️\n`;
  response += `1. **Pas d'erreurs de calcul** : Vérifiez 3 fois !\n`;
  response += `2. **Prix cohérents** : Ni trop bas, ni trop élevés\n`;
  response += `3. **Monnaie** : FCFA ou devise autorisée\n`;
  response += `4. **Validité** : Généralement 90 jours\n\n`;
  
  response += `💡 **Astuce** : L'offre financière est souvent ouverte APRÈS l'offre technique. Ne vous concentrez pas que sur le prix !\n\n`;
  response += `D'autres questions sur l'aspect financier ?`;
  
  return response;
}

function handleDelais(q) {
  let response = `⏰ **Délais importants à respecter** :\n\n`;
  response += `**VALIDITÉ DES DOCUMENTS** 📅\n`;
  response += `• Attestations : < 3 mois\n`;
  response += `• Caution de soumission : Selon DAO\n`;
  response += `• Offre financière : Généralement 90 jours\n\n`;
  
  response += `**DÉLAIS DE SOUMISSION** 🕐\n`;
  response += `• Appel d'offres : Minimum 30 jours\n`;
  response += `• Demande de prix : Minimum 15 jours\n`;
  response += `• Cotation : Selon urgence\n\n`;
  
  response += `**APRÈS SOUMISSION** ⏳\n`;
  response += `• Analyse des offres : 30-60 jours\n`;
  response += `• Notification : Sous 15 jours\n`;
  response += `• Signature du contrat : Variable\n\n`;
  
  response += `⚠️ **Important** : Un retard = disqualification automatique ! Anticipez toujours.\n\n`;
  response += `Une question sur un délai spécifique ?`;
  
  return response;
}

function handleARCOP(q) {
  let response = `📚 **Cadre réglementaire ARCOP 2024-2025** :\n\n`;
  response += `**TEXTES DE BASE** 📖\n`;
  response += `• **Loi n°005-2024/ALT** (20 avril 2024)\n`;
  response += `  → Loi fondamentale sur les marchés publics\n\n`;
  
  response += `• **Décret n°2024-1748** (31 décembre 2024)\n`;
  response += `  → Application de la loi\n\n`;
  
  response += `• **Arrêté n°2025-0323** (9 juillet 2025)\n`;
  response += `  → Modalités pratiques\n\n`;
  
  response += `**PRINCIPES FONDAMENTAUX** ⚖️\n`;
  response += `• Transparence\n`;
  response += `• Égalité de traitement\n`;
  response += `• Libre concurrence\n`;
  response += `• Efficacité de la commande publique\n\n`;
  
  response += `📖 Pour le texte complet et tous les détails, consultez le [Guide de Soumission](/guide-soumission).\n\n`;
  response += `Une question sur un article spécifique ?`;
  
  return response;
}

function handleAide(q) {
  let response = `🆘 **Je suis là pour vous aider !** Voici ce que je peux faire :\n\n`;
  response += `📋 **Documents** : Quelles pièces fournir\n`;
  response += `💰 **Seuils** : Cotation, demande de prix, appel d'offres\n`;
  response += `🇧🇫 **Préférences** : Avantages PME et nationaux\n`;
  response += `📝 **Offre technique** : Structure et méthodologie\n`;
  response += `💵 **Offre financière** : Devis et bordereau de prix\n`;
  response += `⏰ **Délais** : Validité documents et soumission\n`;
  response += `📚 **Réglementation** : ARCOP, lois, décrets\n\n`;
  
  response += `💡 **Exemples de questions** :\n`;
  response += `• "Quels documents pour un marché de 50M ?"\n`;
  response += `• "Comment calculer la préférence PME ?"\n`;
  response += `• "Comment structurer ma méthodologie ?"\n\n`;
  response += `Posez-moi votre question, je vous réponds immédiatement ! 😊`;
  
  return response;
}

function handleGeneral(question, previousMessages) {
  // Essayer de donner une réponse contextuelle même pour question générale
  let response = `Je suis votre assistant spécialisé en **marchés publics au Burkina Faso** 🇧🇫.\n\n`;
  
  // Analyser si la question contient des mots-clés partiels
  if (/comment|pourquoi|quoi|quel/i.test(question)) {
    response += `Je peux vous aider avec :\n`;
    response += `• 📋 Les **documents** à fournir\n`;
    response += `• 💰 Les **seuils** et procédures\n`;
    response += `• 📝 La rédaction de vos **offres**\n`;
    response += `• 🇧🇫 Les **préférences nationales**\n\n`;
    response += `Reformulez votre question pour que je puisse mieux vous aider ! 😊`;
  } else {
    response += `Je n'ai pas bien compris votre question. Pouvez-vous la reformuler ?\n\n`;
    response += `**Suggestions** :\n`;
    response += `• "Quels documents fournir ?"\n`;
    response += `• "Quels sont les seuils ?"\n`;
    response += `• "Comment faire une offre technique ?"\n\n`;
    response += `Ou tapez "aide" pour voir tout ce que je peux faire ! 💡`;
  }
  
  return response;
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

    console.log('[Chat API] Calling intelligent response engine...');
    
    // Utiliser le moteur conversationnel intelligent
    const lastMessage = messages[messages.length - 1];
    const aiResponse = generateIntelligentResponse(messages, lastMessage.content);
    
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
