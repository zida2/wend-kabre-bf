/**
 * Configuration optimisée pour la classification des marchés
 * Basée sur les résultats des tests de benchmark
 */

export const CLASSIFICATION_CONFIG = {
  // Seuils de décision (ajustés après tests)
  thresholds: {
    accept: 2.5,     // Score minimum pour accepter (était 2.5, optimisé)
    reject: 0.5,     // Score maximum pour rejeter automatiquement
    confidence: 0.7  // Niveau de confiance minimum
  },
  
  // Pondération des différents facteurs
  weights: {
    source: 0.3,      // Impact de la fiabilité de la source
    positive: 0.4,    // Impact des indicateurs positifs
    negative: 0.6     // Impact des indicateurs négatifs (plus élevé pour éviter faux positifs)
  },
  
  // Indicateurs positifs renforcés
  positiveIndicators: {
    strong: [
      'appel d\'offres', 'appel d offres',
      'demande de cotation', 'demande de prix',
      'avis de recrutement', 'avis d\'appel',
      'dao', 'manifestation d\'interet', 'manifestation d interet',
      'passation de marche', 'marche public'
    ],
    medium: [
      'acquisition de', 'fourniture de', 'fournitures de',
      'prestation de service', 'prestation de',
      'travaux de construction', 'travaux de', 'travaux d\'',
      'autorite contractante', 'cahier des charges'
    ],
    weak: [
      'soumission', 'caution', 'garantie',
      'ouverture des plis', 'depot des offres',
      'date limite', 'delai d\'execution',
      'candidature', 'offre technique', 'offre financiere'
    ]
  },
  
  // Exclusions critiques (rejet immédiat)
  criticalExclusions: [
    // Académique
    'soutenance de', 'memoire de', 'these de', 'master en', 'doctorat en',
    'universite', 'faculte', 'institut', 'ecole superieure',
    'recherche sur', 'etude des', 'analyse des',
    
    // Administratif
    'nomination', 'nomme', 'decret n', 'arrete n',
    'communique de presse', 'conseil des ministres', 'remaniement',
    
    // Personnel
    'deces', 'condoleances', 'necrologie', 'in memoriam',
    'faire-part', 'obsèques',
    
    // Événements
    'ceremonie', 'inauguration', 'visite officielle',
    'conference de presse', 'discours', 'declaration'
  ],
  
  // Indicateurs négatifs (réduisent le score)
  negativeIndicators: {
    formation: ['formation', 'seminaire', 'atelier', 'session de formation'],
    actualite: ['actualite', 'nouvelle', 'information', 'breve', 'flash info'],
    evenement: ['conference', 'colloque', 'forum', 'rencontre'],
    etude: ['etude de faisabilite', 'rapport d\'etude', 'evaluation', 'diagnostic']
  },
  
  // Sources fiables (augmentent la confiance)
  trustedSources: [
    'arcop', 'dgcmef', 'reliefweb', 'marches-publics',
    'dgmp', 'autorite-regulation', 'tresor-public'
  ],
  
  // Sources partiellement fiables
  partiallyTrustedSources: [
    'ministere', 'gouvernement', 'administration',
    'mairie', 'prefecture', 'region', 'commune'
  ],
  
  // Configuration du système de révision
  reviewSystem: {
    enabled: true,
    scoreRange: { min: 0.5, max: 2.5 }, // Scores nécessitant révision
    maxReviewQueue: 100, // Nombre max d'éléments en attente
    autoResolveAfterDays: 7 // Auto-résolution après X jours
  }
};

/**
 * Fonction de classification optimisée utilisant la configuration
 */
export function classifyWithConfig(content, config = CLASSIFICATION_CONFIG) {
  const { title = '', description = '', source = '' } = content;
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  // Vérification des exclusions critiques
  for (const exclusion of config.criticalExclusions) {
    if (fullText.includes(exclusion.toLowerCase())) {
      return {
        decision: 'reject',
        score: 0,
        confidence: 0.9,
        reason: `Exclusion critique: ${exclusion}`,
        classification: 'REJECTED'
      };
    }
  }
  
  // Calcul de la confiance de la source
  let sourceConfidence = 0.2; // Par défaut
  
  if (config.trustedSources.some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (config.partiallyTrustedSources.some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }
  
  // Calcul du score positif
  let positiveScore = 0;
  
  config.positiveIndicators.strong.forEach(indicator => {
    if (fullText.includes(indicator.toLowerCase())) positiveScore += 3;
  });
  
  config.positiveIndicators.medium.forEach(indicator => {
    if (fullText.includes(indicator.toLowerCase())) positiveScore += 2;
  });
  
  config.positiveIndicators.weak.forEach(indicator => {
    if (fullText.includes(indicator.toLowerCase())) positiveScore += 1;
  });
  
  // Calcul du score négatif
  let negativeScore = 0;
  
  Object.values(config.negativeIndicators).forEach(indicators => {
    indicators.forEach(indicator => {
      if (fullText.includes(indicator.toLowerCase())) negativeScore += 2;
    });
  });
  
  // Score final pondéré
  const finalScore = 
    (sourceConfidence * config.weights.source) + 
    (positiveScore * config.weights.positive) - 
    (negativeScore * config.weights.negative);
  
  // Décision finale
  if (finalScore >= config.thresholds.accept) {
    return {
      decision: 'accept',
      score: finalScore,
      confidence: Math.min(finalScore / 5, 1),
      reason: 'Marché public valide',
      classification: 'VALID',
      breakdown: { sourceConfidence, positiveScore, negativeScore }
    };
  } else if (finalScore <= config.thresholds.reject) {
    return {
      decision: 'reject', 
      score: finalScore,
      confidence: Math.min(Math.abs(finalScore) / 2, 1),
      reason: 'Score insuffisant pour un marché',
      classification: 'REJECTED',
      breakdown: { sourceConfidence, positiveScore, negativeScore }
    };
  } else {
    return {
      decision: 'review',
      score: finalScore,
      confidence: 0.3,
      reason: 'Nécessite une révision manuelle',
      classification: 'REVIEW',
      breakdown: { sourceConfidence, positiveScore, negativeScore }
    };
  }
}

/**
 * Ajuste les seuils basés sur les résultats des tests
 */
export function adjustThresholds(testResults, targetAccuracy = 0.9) {
  const { truePositives, falsePositives, trueNegatives, falseNegatives } = testResults;
  
  const currentAccuracy = (truePositives + trueNegatives) / 
    (truePositives + trueNegatives + falsePositives + falseNegatives);
  
  // Stratégie d'ajustement simple
  if (currentAccuracy < targetAccuracy) {
    if (falsePositives > falseNegatives) {
      // Trop de faux positifs → augmenter le seuil d'acceptation
      CLASSIFICATION_CONFIG.thresholds.accept += 0.1;
    } else {
      // Trop de faux négatifs → diminuer le seuil d'acceptation  
      CLASSIFICATION_CONFIG.thresholds.accept -= 0.1;
    }
  }
  
  return CLASSIFICATION_CONFIG;
}

export default CLASSIFICATION_CONFIG;