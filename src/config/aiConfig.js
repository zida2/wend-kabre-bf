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
    // API Key depuis les variables d'environnement ou fallback
    apiKey: process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "sk-or-v1-YOUR_FREE_API_KEY"
  },
  
  // Fallback 1 : Hugging Face (gratuit avec token)
  huggingface: {
    enabled: true,
    apiUrl: "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
    // API Key depuis les variables d'environnement ou fallback
    apiKey: process.env.HUGGINGFACE_API_KEY || process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || "hf_YOUR_FREE_TOKEN"
  },
  
  // Fallback 2 : Classification locale (100% gratuite, toujours disponible)
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
      "4. Ajouter OPENROUTER_API_KEY=sk-or-v1-... dans votre .env.local"
    ]
  },
  
  huggingface: {
    url: "https://huggingface.co/settings/tokens", 
    steps: [
      "1. Créer un compte gratuit sur Hugging Face",
      "2. Aller dans Settings > Access Tokens",
      "3. Créer un token 'Read'", 
      "4. Ajouter HUGGINGFACE_API_KEY=hf_... dans votre .env.local"
    ]
  }
};

export default FREE_AI_CONFIG;