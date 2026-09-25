/**
 * CLASSIFICATEUR D'INTENTION V2H - AVEC IA GRATUITE INTÉGRÉE
 * =========================================================
 * 
 * NOUVEAUTÉ: Remplace l'analyse IA payante par OpenRouter + fallbacks gratuits
 * Maintient toutes les performances V2G + améliore les cas ambigus
 * 
 * AMÉLIORATIONS V2H:
 * - ✅ IA gratuite (OpenRouter, HuggingFace, local)  
 * - ✅ Performance maintenue (V2G baseline)
 * - ✅ Fallback en cascade si IA indisponible
 * - ✅ Classification locale intelligente
 */

/**
 * IA GRATUITE - Configuration depuis le fichier config
 */
import { FREE_AI_CONFIG } from '../config/aiConfig.js';

/**
 * IA GRATUITE - Classification avec OpenRouter (gratuit)
 */
async function classifyWithFreeAI(title, description = '') {
  const text = `${title} ${description}`;
  
  // Vérifier que la clé API est configurée
  const apiKey = FREE_AI_CONFIG.openrouter.apiKey;
  if (!apiKey || apiKey.includes('YOUR_FREE_API_KEY')) {
    console.warn('OpenRouter API key not configured, falling back to local classification');
    return classifyWithLocalRules(text);
  }
  
  // Essai OpenRouter (20+ modèles gratuits)
  try {
    const prompt = `Classifie cet appel d'offres burkinabè dans UNE catégorie:

CATÉGORIES:
- "gouvernement" : Administration, audit ministères, formation fonctionnaires, politiques publiques
- "marche" : Marchés commerciaux, boutiques, infrastructure commerciale, bestiaux  
- "neutre" : Santé, éducation, routes, eau, électricité, agriculture

TEXTE: "${text.substring(0, 400)}"

RÉPONSE (un seul mot):`;

    const response = await fetch(FREE_AI_CONFIG.openrouter.apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": FREE_AI_CONFIG.openrouter.model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": FREE_AI_CONFIG.openrouter.maxTokens,
        "temperature": FREE_AI_CONFIG.openrouter.temperature
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      const classification = result.choices[0]?.message?.content?.trim().toLowerCase();
      
      if (['gouvernement', 'marche', 'neutre'].includes(classification)) {
        return {
          intent: classification,
          confidence: 0.85,
          signal: 'openrouter_free_ai',
          method: 'free_ai_openrouter'
        };
      }
    } else {
      console.warn('OpenRouter API failed with status:', response.status);
    }
  } catch (error) {
    console.warn('OpenRouter failed, using fallback:', error.message);
  }
  
  // Fallback: Classification locale intelligente (100% gratuite)
  return classifyWithLocalRules(text);
}

/**
 * Classification locale avec règles intelligentes
 */
function classifyWithLocalRules(text) {
  const textLower = text.toLowerCase();
  
  // Détection gouvernement (administration, audit, formation agents)
  const govPatterns = [
    /audit.*(?:ministère|direction|administration|financier|performance)/i,
    /formation.*(?:agent|préfet|magistrat|fonctionnaire|personnel)/i,
    /(?:politique|évaluation).*publique/i,
    /modernisation.*(?:consulaire|administrative)/i,
    /gestion.*(?:budgétaire|électronique.*document)/i,
    /collectivité.*locale/i,
    /fonction.*publique/i
  ];
  
  // Détection marché commercial
  const marketPatterns = [
    /(?:marché|market)(?!.*public).*(?:moderne|central|gros|international)/i,
    /(?:construction|aménagement|modernisation).*marché/i,
    /boutique|magasin|aire.*vente/i,
    /stockage.*(?:réfrigéré|frigorifique)/i,
    /(?:voirie|voie).*accès.*marché/i,
    /marché.*bestiaux/i,
    /transaction.*commercial/i
  ];
  
  let govScore = 0;
  let marketScore = 0;
  
  govPatterns.forEach(pattern => {
    if (pattern.test(text)) govScore++;
  });
  
  marketPatterns.forEach(pattern => {
    if (pattern.test(text)) marketScore++;
  });
  
  if (govScore > marketScore && govScore > 0) {
    return {
      intent: 'gouvernement',
      confidence: Math.min(0.9, 0.7 + (govScore * 0.1)),
      signal: 'local_gov_rules',
      method: 'local_classification'
    };
  } else if (marketScore > govScore && marketScore > 0) {
    return {
      intent: 'marche', 
      confidence: Math.min(0.9, 0.7 + (marketScore * 0.1)),
      signal: 'local_market_rules',
      method: 'local_classification'
    };
  } else {
    return {
      intent: 'neutre',
      confidence: 0.6,
      signal: 'local_neutral_default',
      method: 'local_classification'
    };
  }
}

/**
 * CLASSIFICATEUR PRINCIPAL V2H avec IA gratuite
 */
export async function classifyWithIntentAnalysisV2H(title, description = '', source = '') {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedDescription = description.toLowerCase().trim();
  
  // ===== ÉTAPE 1: FILTRES DE SÉCURITÉ (V2G) =====
  
  // 🚫 Avis de décès
  if (/avis.*décès|rappel.*dieu|décès.*ministre/i.test(fullText)) {
    return {
      intent: 'AUTRE',
      confidence: 1.0,
      signal: 'death_notice_detected',
      method: 'safety_filter'
    };
  }
  
  // 🚫 Contenu manifestement non-marché
  if (/(?:communiqué|communique).*(?:presse|conseil)/i.test(fullText)) {
    return {
      intent: 'AUTRE', 
      confidence: 0.95,
      signal: 'press_release_detected',
      method: 'safety_filter'
    };
  }
  
  // ===== ÉTAPE 2: DÉTECTION MARCHÉ (Prioritaire) =====
  
  let marketScore = 0;
  const marketSignals = [];
  
  // Marchés commerciaux explicites  
  if (/(?:construction|aménagement|modernisation|extension|rénovation).*marché/i.test(fullText)) {
    marketScore += 3;
    marketSignals.push('market_construction');
  }
  
  if (/marché.*(?:moderne|central|gros|international|frontalier)/i.test(fullText)) {
    marketScore += 2;
    marketSignals.push('market_type');
  }
  
  if (/boutique|magasin|aire.*vente|espace.*commercial/i.test(fullText)) {
    marketScore += 2;
    marketSignals.push('commercial_space');
  }
  
  if (/voirie.*accès.*marché|voie.*marché/i.test(fullText)) {
    marketScore += 2;
    marketSignals.push('market_access');
  }
  
  if (marketScore >= 2) {
    return {
      intent: 'marche',
      confidence: Math.min(0.95, 0.7 + (marketScore * 0.1)),
      signal: marketSignals.join('_'),
      method: 'market_detection'
    };
  }
  
  // ===== ÉTAPE 3: DÉTECTION GOUVERNEMENT =====
  
  let govScore = 0;
  const govSignals = [];
  
  if (/audit.*(?:ministère|direction|performance|financier)/i.test(fullText)) {
    govScore += 3;
    govSignals.push('government_audit');
  }
  
  if (/formation.*(?:agent|préfet|magistrat|fonctionnaire)/i.test(fullText)) {
    govScore += 2;
    govSignals.push('civil_servant_training');
  }
  
  if (/(?:politique|évaluation).*publique/i.test(fullText)) {
    govScore += 2;
    govSignals.push('public_policy');
  }
  
  if (/modernisation.*(?:consulaire|administrative)/i.test(fullText)) {
    govScore += 2;
    govSignals.push('admin_modernization');
  }
  
  if (govScore >= 2) {
    return {
      intent: 'gouvernement',
      confidence: Math.min(0.95, 0.7 + (govScore * 0.1)),
      signal: govSignals.join('_'),
      method: 'government_detection'
    };
  }
  
  // ===== ÉTAPE 4: FALLBACK AVEC IA GRATUITE =====
  
  try {
    const aiResult = await classifyWithFreeAI(title, description);
    if (aiResult && aiResult.confidence > 0.6) {
      return {
        intent: aiResult.intent,
        confidence: aiResult.confidence,
        signal: aiResult.signal,
        method: aiResult.method,
        details: 'Classification IA gratuite (OpenRouter/Local)'
      };
    }
  } catch (error) {
    console.warn('Free AI classification failed:', error);
  }
  
  // ===== ÉTAPE 5: CLASSIFICATION PAR DÉFAUT =====
  
  return {
    intent: 'neutre',
    confidence: 0.5,
    signal: 'default_neutral',
    method: 'fallback_default',
    details: 'Classification par défaut (aucun pattern détecté)'
  };
}

/**
 * Interface compatible avec V2G
 */
export function classifyWithIntentAnalysis(title, description = '', source = '') {
  return classifyWithIntentAnalysisV2H(title, description, source);
}

export default {
  classifyWithIntentAnalysis: classifyWithIntentAnalysisV2H,
  version: 'V2H_FREE_AI'
};