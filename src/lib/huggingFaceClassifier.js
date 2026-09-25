/**
 * HUGGING FACE CLASSIFIER - GRATUIT
 * Remplace l'analyse IA payante par des modèles gratuits
 */

// Solution 1: API Hugging Face Inference (gratuite)
async function classifyWithHuggingFace(text) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/camembert-base",
      {
        headers: { 
          "Authorization": "Bearer hf_xxxxxxxxxx", // Token gratuit
        },
        method: "POST",
        body: JSON.stringify({ inputs: text }),
      }
    );
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur HuggingFace:', error);
    return null;
  }
}

// Solution 2: Classification française avec CamemBERT
async function classifyTextFrench(text, categories = ["gouvernement", "marche", "neutre"]) {
  const classificationPrompt = `
  Classifie ce texte dans une de ces catégories: ${categories.join(', ')}
  
  Texte: "${text}"
  
  Catégorie:`;

  try {
    // Utilise l'API Hugging Face pour la classification
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        headers: {
          "Authorization": "Bearer hf_xxxxxxxxxx" // Remplacez par votre token gratuit
        },
        method: "POST",
        body: JSON.stringify({
          inputs: classificationPrompt,
          parameters: {
            max_new_tokens: 10,
            temperature: 0.1
          }
        })
      }
    );
    
    const result = await response.json();
    
    // Parse le résultat
    const classification = result[0]?.generated_text?.toLowerCase().trim();
    
    if (categories.some(cat => classification.includes(cat.toLowerCase()))) {
      return categories.find(cat => classification.includes(cat.toLowerCase()));
    }
    
    return "neutre"; // Fallback
  } catch (error) {
    console.error('Classification error:', error);
    return "neutre";
  }
}

module.exports = { classifyWithHuggingFace, classifyTextFrench };