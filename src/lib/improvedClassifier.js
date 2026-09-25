/**
 * Classificateur amélioré basé sur l'analyse des erreurs du benchmark
 * Corrections spécifiques pour réduire la pollution et améliorer le recall
 */

export function classifyWithDiagnosticImproved(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    confidence: 0,
    score: 0,
    signals: {
      positive: [],
      negative: [],
      exclusions: [],
      contextual: []
    },
    reasons: [],
    breakdown: {
      sourceConfidence: 0,
      positiveScore: 0,
      negativeScore: 0,
      contextualAdjustment: 0,
      finalScore: 0
    },
    metadata: {
      title: title?.substring(0, 100) + '...',
      source,
      textLength: fullText.length,
      timestamp: new Date().toISOString(),
      version: 'improved-v1'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 1: EXCLUSIONS CRITIQUES (REJET IMMÉDIAT)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const criticalExclusions = [
    // Académique
    { pattern: 'soutenance', category: 'académique', severity: 'critical' },
    { pattern: 'these', category: 'académique', severity: 'critical' },
    { pattern: 'master', category: 'académique', severity: 'critical' },
    { pattern: 'doctorat', category: 'académique', severity: 'critical' },
    { pattern: 'universite', category: 'académique', severity: 'critical' },
    
    // Administratif
    { pattern: 'nomination', category: 'administratif', severity: 'critical' },
    { pattern: 'nomme', category: 'administratif', severity: 'critical' },
    { pattern: 'decret n', category: 'administratif', severity: 'critical' },
    { pattern: 'arrete n', category: 'administratif', severity: 'critical' },
    { pattern: 'communique de presse', category: 'administratif', severity: 'critical' },
    
    // Personnel
    { pattern: 'deces', category: 'personnel', severity: 'critical' },
    { pattern: 'condoleances', category: 'personnel', severity: 'critical' },
    { pattern: 'necrologie', category: 'personnel', severity: 'critical' },
    
    // Événements
    { pattern: 'ceremonie', category: 'événement', severity: 'critical' },
    { pattern: 'inauguration', category: 'événement', severity: 'critical' }
  ];
  
  for (const exclusion of criticalExclusions) {
    if (fullText.includes(exclusion.pattern)) {
      result.signals.exclusions.push(exclusion);
      result.classification = 'REJECTED';
      result.confidence = 0.95;
      result.score = 0;
      result.reasons.push(`Exclusion critique: "${exclusion.pattern}" (${exclusion.category})`);
      return result;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 2: ÉVALUATION AMÉLIORÉE DE LA SOURCE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const trustedSources = [
    { pattern: 'arcop', confidence: 0.9, name: 'ARCOP (Autorité de Régulation)' },
    { pattern: 'dgcmef', confidence: 0.9, name: 'DGCMEF (Direction Générale)' },
    { pattern: 'reliefweb', confidence: 0.8, name: 'ReliefWeb' },
    { pattern: 'marches-publics', confidence: 0.85, name: 'Site officiel marchés publics' }
  ];
  
  // AMÉLIORATION: Sources .gov.bf mieux évaluées
  const governmentSources = [
    { pattern: 'sante.gov.bf', confidence: 0.7, name: 'Ministère de la Santé' },
    { pattern: 'infrastructures.gov.bf', confidence: 0.75, name: 'Ministère des Infrastructures' },
    { pattern: 'agriculture.gov.bf', confidence: 0.7, name: 'Ministère de l\'Agriculture' },
    { pattern: 'equipement.gov.bf', confidence: 0.7, name: 'Ministère de l\'Équipement' },
    { pattern: 'finances.gov.bf', confidence: 0.6, name: 'Ministère des Finances' },
    { pattern: '.gov.bf', confidence: 0.6, name: 'Site gouvernemental burkinabé' } // Fallback
  ];
  
  const partiallyTrustedSources = [
    { pattern: 'ministere', confidence: 0.5, name: 'Site ministériel' },
    { pattern: 'gouvernement', confidence: 0.5, name: 'Site gouvernemental' },
    { pattern: 'administration', confidence: 0.4, name: 'Site administratif' }
  ];
  
  let sourceConfidence = 0.2; // Source inconnue
  let sourceInfo = 'Source inconnue';
  
  // Vérifier sources de confiance décroissante
  for (const trusted of trustedSources) {
    if (normalizedSource.includes(trusted.pattern)) {
      sourceConfidence = trusted.confidence;
      sourceInfo = trusted.name;
      result.reasons.push(`Source très fiable: ${trusted.name}`);
      break;
    }
  }
  
  if (sourceConfidence === 0.2) {
    for (const govt of governmentSources) {
      if (normalizedSource.includes(govt.pattern)) {
        sourceConfidence = govt.confidence;
        sourceInfo = govt.name;
        result.reasons.push(`Source gouvernementale: ${govt.name}`);
        break;
      }
    }
  }
  
  if (sourceConfidence === 0.2) {
    for (const partial of partiallyTrustedSources) {
      if (normalizedSource.includes(partial.pattern)) {
        sourceConfidence = partial.confidence;
        sourceInfo = partial.name;
        result.reasons.push(`Source partiellement fiable: ${partial.name}`);
        break;
      }
    }
  }
  
  result.breakdown.sourceConfidence = sourceConfidence;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 3: INDICATEURS POSITIFS ENRICHIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const positiveIndicators = [
    // Forts (+3 points) - Procédures officielles
    { pattern: 'appel d\'offres', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'appel d offres', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'demande de cotation', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'avis de recrutement', points: 3, category: 'procédure', strength: 'fort' }, // Paradoxal mais c'est une procédure
    { pattern: 'dao', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'manifestation d\'interet', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'manifestation d interet', points: 3, category: 'procédure', strength: 'fort' },
    
    // Moyens (+2 points) - Objets de marché
    { pattern: 'acquisition de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'fourniture de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'prestation de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'travaux de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'construction', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'autorite contractante', points: 2, category: 'procédure', strength: 'moyen' },
    
    // AMÉLIORATION: Indicateurs enrichis basés sur l'analyse des erreurs
    { pattern: 'acquisition', points: 2, category: 'objet', strength: 'moyen' }, // Sans "de"
    { pattern: 'travaux d\'', points: 2, category: 'objet', strength: 'moyen' }, // Variante
    { pattern: 'refection', points: 2, category: 'travaux', strength: 'moyen' }, // BTP
    { pattern: 'vehicules', points: 1, category: 'equipement', strength: 'faible' },
    { pattern: 'materiel', points: 1, category: 'equipement', strength: 'faible' },
    { pattern: 'equipement', points: 1, category: 'equipement', strength: 'faible' },
    
    // Faibles (+1 point) - Indices procéduraux
    { pattern: 'soumission', points: 1, category: 'procédure', strength: 'faible' },
    { pattern: 'caution', points: 1, category: 'financier', strength: 'faible' },
    { pattern: 'date limite', points: 1, category: 'temporel', strength: 'faible' },
    { pattern: 'candidature', points: 1, category: 'procédure', strength: 'faible' },
    { pattern: 'offre technique', points: 1, category: 'procédure', strength: 'faible' },
    { pattern: 'cahier des charges', points: 1, category: 'technique', strength: 'faible' }
  ];
  
  let positiveScore = 0;
  for (const indicator of positiveIndicators) {
    if (fullText.includes(indicator.pattern)) {
      positiveScore += indicator.points;
      result.signals.positive.push(indicator);
      result.reasons.push(`Indicateur ${indicator.strength}: "${indicator.pattern}" (+${indicator.points})`);
    }
  }
  result.breakdown.positiveScore = positiveScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 4: INDICATEURS NÉGATIFS RENFORCÉS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const negativeIndicators = [
    // AMÉLIORATION: Recrutement comme indicateur négatif fort
    { pattern: 'recrutement', points: 3, category: 'emploi', impact: 'fort' },
    { pattern: 'avis de recrutement', points: 2, category: 'emploi', impact: 'moyen' }, // Double pénalité
    { pattern: 'poste vacant', points: 3, category: 'emploi', impact: 'fort' },
    { pattern: 'candidat', points: 2, category: 'emploi', impact: 'moyen' },
    
    // Formation/éducation
    { pattern: 'formation', points: 2, category: 'formation', impact: 'moyen' },
    { pattern: 'seminaire', points: 2, category: 'formation', impact: 'moyen' },
    { pattern: 'atelier', points: 2, category: 'formation', impact: 'moyen' },
    { pattern: 'session de formation', points: 3, category: 'formation', impact: 'fort' },
    
    // Actualités
    { pattern: 'actualite', points: 2, category: 'actualité', impact: 'moyen' },
    { pattern: 'information', points: 1, category: 'actualité', impact: 'faible' },
    { pattern: 'breve', points: 1, category: 'actualité', impact: 'faible' },
    
    // Études (cas ambigus)
    { pattern: 'etude de faisabilite', points: 1, category: 'étude', impact: 'faible' },
    { pattern: 'rapport d\'etude', points: 1, category: 'étude', impact: 'faible' }
  ];
  
  let negativeScore = 0;
  for (const indicator of negativeIndicators) {
    if (fullText.includes(indicator.pattern)) {
      negativeScore += indicator.points;
      result.signals.negative.push(indicator);
      result.reasons.push(`Indicateur négatif ${indicator.impact}: "${indicator.pattern}" (-${indicator.points})`);
    }
  }
  result.breakdown.negativeScore = negativeScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 5: RÈGLES CONTEXTUELLES (NOUVEAUTÉ)
  // ═══════════════════════════════════════════════════════════════════════════
  
  let contextualAdjustment = 0;
  
  // Règle 1: "prestation" + "recrutement" = contexte emploi négatif
  if (fullText.includes('prestation') && fullText.includes('recrutement')) {
    contextualAdjustment -= 2;
    result.signals.contextual.push({
      rule: 'prestation_recrutement',
      adjustment: -2,
      reason: 'Prestation dans contexte recrutement = service RH, pas marché'
    });
    result.reasons.push('Règle contextuelle: prestation + recrutement → service RH (-2 pts)');
  }
  
  // Règle 2: "acquisition" + "vehicules/materiel" = marché équipement positif
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({
      rule: 'acquisition_equipement',
      adjustment: 1,
      reason: 'Acquisition d\'équipement = marché matériel clair'
    });
    result.reasons.push('Règle contextuelle: acquisition + équipement → marché clair (+1 pt)');
  }
  
  // Règle 3: "travaux" + "route/construction/refection" = marché BTP positif
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({
      rule: 'travaux_btp',
      adjustment: 1,
      reason: 'Travaux BTP = marché infrastructure clair'
    });
    result.reasons.push('Règle contextuelle: travaux + BTP → marché infrastructure (+1 pt)');
  }
  
  result.breakdown.contextualAdjustment = contextualAdjustment;

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL FINAL ET DÉCISION (SEUILS AJUSTÉS)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Score pondéré avec ajustements contextuels
  const finalScore = 
    (sourceConfidence * 0.3) +     // 30% pour la source
    (positiveScore * 0.4) -        // 40% pour les indicateurs positifs
    (negativeScore * 0.6) +        // 60% pour les indicateurs négatifs (plus de poids)
    contextualAdjustment;          // Ajustements contextuels
  
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100;
  
  // AMÉLIORATION: Seuils légèrement ajustés basés sur l'analyse
  const ACCEPT_THRESHOLD = 1.3;   // Légèrement baissé de 1.5 pour capturer plus de marchés
  const REJECT_THRESHOLD = -0.3;  // Légèrement relevé de -0.5 pour être plus strict
  
  if (finalScore >= ACCEPT_THRESHOLD) {
    result.classification = 'VALID';
    result.confidence = Math.min(finalScore / 3, 1);
    result.reasons.push(`Score suffisant pour validation automatique (${finalScore.toFixed(2)} ≥ ${ACCEPT_THRESHOLD})`);
    
  } else if (finalScore <= REJECT_THRESHOLD) {
    result.classification = 'REJECTED';
    result.confidence = Math.min(Math.abs(finalScore - REJECT_THRESHOLD) / 2, 1);
    result.reasons.push(`Score insuffisant pour un marché (${finalScore.toFixed(2)} ≤ ${REJECT_THRESHOLD})`);
    
  } else {
    result.classification = 'REVIEW';
    result.confidence = 0.3;
    result.reasons.push(`Score dans la zone d'incertitude (${REJECT_THRESHOLD} < ${finalScore.toFixed(2)} < ${ACCEPT_THRESHOLD}) - révision nécessaire`);
  }
  
  return result;
}

// Version simplifiée pour compatibilité
export function isRealTenderImproved(title, description, source) {
  const result = classifyWithDiagnosticImproved(title, description, source);
  return result.classification === 'VALID';
}