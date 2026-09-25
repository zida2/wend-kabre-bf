/**
 * CONFIGURATION IA GRATUITE
 * =========================
 * 
 * Configuration centralisée pour les providers IA gratuits
 * Remplace l'ancienne configuration IA payante
 */

export const FREE_AI_CONFIG = {
  // Provider principal : OpenRouter (20+ modèles gratuits)
  openrouter: {
    enabled: true,
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    model: "microsoft/diamondchat", // Modèle gratuit performant
    maxTokens: 10,
    temperature: 0.1,
    // NOTE: Remplacez YOUR_FREE_API_KEY par votre clé gratuite
    // Obtenez une clé gratuite sur : https://openrouter.ai/keys
    apiKey: "sk-or-v1-YOUR_FREE_API_KEY"
  },
  
  // Fallback 1 : Hugging Face (gratuit avec token)
  huggingface: {
    enabled: true,
    apiUrl: "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
    // NOTE: Obtenez un token gratuit sur : https://huggingface.co/settings/tokens
    apiKey: "hf_YOUR_FREE_TOKEN"
  },
  
  // Fallback 2 : Classification locale (100% gratuite)
  local: {
    enabled: true,
    confidence: 0.7
  },
  
  // Paramètres généraux
  timeout: 5000, // 5 secondes timeout
  retries: 2,
  fallbackToLocal: true
};

/**
 * Instructions pour obtenir les clés API gratuites
 */
export const SETUP_INSTRUCTIONS = {
  openrouter: {
    url: "https://openrouter.ai/keys",
    steps: [
      "1. Créer un compte gratuit sur OpenRouter",
      "2. Aller dans 'API Keys'", 
      "3. Créer une nouvelle clé gratuite",
      "4. Remplacer 'YOUR_FREE_API_KEY' dans aiConfig.js"
    ]
  },
  
  huggingface: {
    url: "https://huggingface.co/settings/tokens", 
    steps: [
      "1. Créer un compte gratuit sur Hugging Face",
      "2. Aller dans Settings > Access Tokens",
      "3. Créer un token 'Read'", 
      "4. Remplacer 'YOUR_FREE_TOKEN' dans aiConfig.js"
    ]
  }
};

export default FREE_AI_CONFIG;