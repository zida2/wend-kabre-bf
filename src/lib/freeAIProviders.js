/**
 * PROVIDERS IA GRATUITS pour l'analyse de texte
 * Alternative aux APIs payantes
 */

// 1. OpenRouter (20+ modèles gratuits)
async function classifyWithOpenRouter(text) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer YOUR_API_KEY`, // Gratuit
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "microsoft/diamondchat", // Modèle gratuit
        "messages": [
          {
            "role": "user", 
            "content": `Classifie ce texte d'appel d'offres en une catégorie:
            - "gouvernement": Administration publique, audit, formation agents
            - "marche": Infrastructure commerciale, marchés, boutiques  
            - "neutre": Santé, éducation, infrastructure générale
            
            Texte: "${text}"
            
            Réponds uniquement avec: gouvernement, marche, ou neutre`
          }
        ]
      })
    });
    
    const result = await response.json();
    return result.choices[0].message.content.trim().toLowerCase();
  } catch (error) {
    console.error('OpenRouter error:', error);
    return "neutre";
  }
}

// 2. TextCortex (API gratuite pour classification)
async function classifyWithTextCortex(text) {
  try {
    const response = await fetch("https://api.textcortex.com/v1/texts/classifications", {
      method: "POST",
      headers: {
        "Authorization": `Bearer YOUR_API_KEY`, // Plan gratuit disponible
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        categories: ["gouvernement", "marche", "neutre"],
        model: "gpt-3.5-turbo" // Version gratuite
      })
    });
    
    const result = await response.json();
    return result.category || "neutre";
  } catch (error) {
    console.error('TextCortex error:', error);  
    return "neutre";
  }
}

// 3. NLP Cloud (Classification gratuite limitée)
async function classifyWithNLPCloud(text) {
  try {
    const response = await fetch("https://api.nlpcloud.io/v1/camembert-base/classification", {
      method: "POST",
      headers: {
        "Authorization": `Token YOUR_API_KEY`, // 100 requêtes/mois gratuites
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        labels: ["gouvernement", "marche", "neutre"]
      })
    });
    
    const result = await response.json();
    return result.labels[0] || "neutre";
  } catch (error) {
    console.error('NLP Cloud error:', error);
    return "neutre"; 
  }
}

// 4. Solution locale avec Transformers.js (100% gratuit)
import { pipeline } from '@xenova/transformers';

let classifier = null;

async function initLocalClassifier() {
  if (!classifier) {
    classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  }
  return classifier;
}

async function classifyWithTransformersJS(text) {
  try {
    const cls = await initLocalClassifier();
    
    // Classification avec adaptation pour notre cas
    const result = await cls(`
      Catégorie du marché public: ${text}
      Type: gouvernement, marché commercial, ou service public général
    `);
    
    // Adaptation des résultats
    const score = result[0].score;
    if (text.toLowerCase().includes('marché') || text.toLowerCase().includes('commercial')) {
      return 'marche';
    } else if (text.toLowerCase().includes('administration') || text.toLowerCase().includes('audit')) {
      return 'gouvernement';
    } else {
      return 'neutre';
    }
  } catch (error) {
    console.error('TransformersJS error:', error);
    return 'neutre';
  }
}

module.exports = {
  classifyWithOpenRouter,
  classifyWithTextCortex, 
  classifyWithNLPCloud,
  classifyWithTransformersJS
};