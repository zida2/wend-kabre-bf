/**
 * CLASSIFICATEUR INTELLIGENT UNIFIÉ - AVEC IA GRATUITE
 * ====================================================
 * 
 * Remplace tous les classificateurs précédents par une version
 * unifiée avec IA gratuite intégrée (OpenRouter + fallbacks)
 */

import { classifyWithIntentAnalysisV2H } from './intentClassifierV2H_freeAI.js';

/**
 * Point d'entrée principal pour la classification
 * Compatible avec toutes les versions précédentes
 */
export async function classifyMarket(title, description = '', source = '') {
  try {
    const result = await classifyWithIntentAnalysisV2H(title, description, source);
    
    // Normalisation des résultats pour compatibilité
    return {
      classification: mapIntentToClassification(result.intent),
      score: result.confidence * 10, // Compatibilité score 0-10
      confidence: result.confidence,
      intent: result.intent,
      signal: result.signal,
      method: result.method,
      details: result.details || `Classification ${result.method}`
    };
  } catch (error) {
    console.error('Classification error:', error);
    return {
      classification: 'REVIEW',
      score: 5,
      confidence: 0.5,
      intent: 'neutre',
      signal: 'error_fallback',
      method: 'error_handling',
      details: 'Erreur de classification, révision manuelle requise'
    };
  }
}

/**
 * Mapping des intents vers classifications compatibles
 */
function mapIntentToClassification(intent) {
  switch (intent) {
    case 'gouvernement':
      return 'VALID'; // Marché public gouvernemental valide
    case 'marche':
      return 'VALID'; // Marché commercial valide
    case 'neutre':
      return 'VALID'; // Autre marché public valide
    case 'AUTRE':
      return 'INVALID'; // Pas un marché
    default:
      return 'REVIEW'; // Révision manuelle
  }
}

/**
 * Version simplifiée pour tests rapides
 */
export async function isValidTender(title, description = '', source = '') {
  const result = await classifyMarket(title, description, source);
  return result.classification === 'VALID';
}

/**
 * Analyse détaillée pour le dashboard admin
 */
export async function analyzeMarketContent(title, description = '', source = '') {
  const result = await classifyMarket(title, description, source);
  
  return {
    isValid: result.classification === 'VALID',
    category: result.intent,
    confidence: result.confidence,
    reasoning: result.details,
    technicalDetails: {
      signal: result.signal,
      method: result.method,
      classifier: 'V2H_FREE_AI'
    }
  };
}

// Export par défaut
export default {
  classify: classifyMarket,
  isValid: isValidTender,
  analyze: analyzeMarketContent,
  version: 'V2H_FREE_AI_UNIFIED'
};