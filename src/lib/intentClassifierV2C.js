/**
 * Classificateur V2C avec analyse d'intention générique
 * Traite les ambiguïtés recrutement/marché de manière systématique
 */

export function classifyWithIntentAnalysisV2C(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    score: 0,
    confidence: 0,
    signals: { 
      positive: [], 
      negative: [], 
      exclusions: [], 
      contextual: [],
      recruitment: [],
      market: []
    },
    intentAnalysis: {
      primaryIntent: null,
      recruitmentSignals: 0,
      marketSignals: 0,
      ambiguityScore: 0,
      isAmbiguous: false
    },
    breakdown: { 
      sourceConfidence: 0, 
      positiveScore: 0, 
      negativeScore: 0, 
      contextualAdjustment: 0,
      intentAdjustment: 0,
      finalScore: 0 
    },
    version: 'v2c-intent-based'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 0: ANALYSE D'INTENTION (NOUVEAUTÉ V2C)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const recruitmentTerms = [
    // Forts (3 points chacun)
    { term: 'recrutement', weight: 3, category: 'action' },
    { term: 'avis de recrutement', weight: 4, category: 'procedure' }, // Encore plus fort
    { term: 'candidature', weight: 3, category: 'action' },
    { term: 'poste vacant', weight: 4, category: 'statut' },
    { term: 'emploi', weight: 3, category: 'objet' },
    
    // Moyens (2 points chacun)  
    { term: 'agent', weight: 2, category: 'personne' },
    { term: 'candidat', weight: 2, category: 'personne' },
    { term: 'personnel', weight: 2, category: 'collectif' },
    { term: 'poste', weight: 2, category: 'statut' },
    
    // Faibles (1 point chacun)
    { term: 'cv', weight: 1, category: 'document' },
    { term: 'profil', weight: 1, category: 'qualification' },
    { term: 'experience', weight: 1, category: 'qualification' }
  ];
  
  const marketTerms = [
    // Forts (3 points chacun)
    { term: 'appel d\'offres', weight: 4, category: 'procedure' },
    { term: 'appel d offres', weight: 4, category: 'procedure' },
    { term: 'demande de cotation', weight: 4, category: 'procedure' },
    { term: 'dao', weight: 3, category: 'procedure' },
    { term: 'soumission', weight: 3, category: 'procedure' },
    { term: 'marche public', weight: 4, category: 'nature' },
    
    // Moyens (2 points chacun)
    { term: 'fourniture', weight: 2, category: 'objet' },
    { term: 'acquisition', weight: 2, category: 'objet' },
    { term: 'travaux', weight: 2, category: 'objet' },
    { term: 'prestation', weight: 2, category: 'objet' },
    { term: 'lot', weight: 2, category: 'structure' },
    { term: 'quantite', weight: 2, category: 'mesure' },
    
    // Faibles (1 point chacun)
    { term: 'cahier des charges', weight: 1, category: 'document' },
    { term: 'specification', weight: 1, category: 'technique' },
    { term: 'livraison', weight: 1, category: 'execution' },
    { term: 'garantie', weight: 1, category: 'contractuel' }
  ];
  
  // Calcul des signaux d'intention
  let recruitmentScore = 0;
  let marketScore = 0;
  
  recruitmentTerms.forEach(item => {
    if (fullText.includes(item.term)) {
      recruitmentScore += item.weight;
      result.signals.recruitment.push(item);
    }
  });
  
  marketTerms.forEach(item => {
    if (fullText.includes(item.term)) {
      marketScore += item.weight;
      result.signals.market.push(item);
    }
  });
  
  result.intentAnalysis.recruitmentSignals = recruitmentScore;
  result.intentAnalysis.marketSignals = marketScore;
  
  // Détermination de l'intention primaire
  const totalSignals = recruitmentScore + marketScore;
  const ambiguityThreshold = 3; // Si les deux scores sont > 3, c'est ambigu
  
  if (recruitmentScore >= ambiguityThreshold && marketScore >= ambiguityThreshold) {
    // CAS AMBIGU: Les deux intentions sont fortes
    result.intentAnalysis.isAmbiguous = true;
    result.intentAnalysis.ambiguityScore = Math.min(recruitmentScore, marketScore);
    result.intentAnalysis.primaryIntent = 'AMBIGUOUS';
    
    result.reasons.push(`Intention ambiguë: recrutement(${recruitmentScore}) + marché(${marketScore})`);
    
  } else if (marketScore > recruitmentScore) {
    result.intentAnalysis.primaryIntent = 'MARKET';
    result.reasons.push(`Intention principale: marché (${marketScore} vs ${recruitmentScore})`);
    
  } else if (recruitmentScore > marketScore) {
    result.intentAnalysis.primaryIntent = 'RECRUITMENT';
    result.reasons.push(`Intention principale: recrutement (${recruitmentScore} vs ${marketScore})`);
    
  } else {
    result.intentAnalysis.primaryIntent = 'UNCLEAR';
    result.reasons.push('Intention peu claire (signaux faibles)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 1: EXCLUSIONS CRITIQUES (identique V2B)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const criticalExclusions = [
    { pattern: 'soutenance', category: 'académique' },
    { pattern: 'these', category: 'académique' },
    { pattern: 'master', category: 'académique' },
    { pattern: 'nomination', category: 'administratif' },
    { pattern: 'nomme', category: 'administratif' },
    { pattern: 'deces', category: 'personnel' },
    { pattern: 'ceremonie', category: 'événement' },
    { pattern: 'inauguration', category: 'événement' }
  ];
  
  for (const exclusion of criticalExclusions) {
    if (fullText.includes(exclusion.pattern)) {
      result.signals.exclusions.push(exclusion);
      result.classification = 'REJECTED';
      result.confidence = 0.95;
      result.score = 0;
      return result;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 2: ÉVALUATION SOURCE (identique V2B)
  // ═══════════════════════════════════════════════════════════════════════════
  
  let sourceConfidence = 0.2;
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (['sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 'equipement.gov.bf'].some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7;
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }
  result.breakdown.sourceConfidence = sourceConfidence;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 3: INDICATEURS POSITIFS (identique V2B)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const positiveIndicators = [
    { pattern: 'appel d\'offres', points: 3 },
    { pattern: 'appel d offres', points: 3 },
    { pattern: 'demande de cotation', points: 3 },
    { pattern: 'dao', points: 3 },
    { pattern: 'acquisition de', points: 2 },
    { pattern: 'fourniture de', points: 2 },
    { pattern: 'prestation de', points: 2 },
    { pattern: 'travaux de', points: 2 },
    { pattern: 'construction', points: 2 },
    { pattern: 'acquisition', points: 2 },
    { pattern: 'travaux d\'', points: 2 },
    { pattern: 'refection', points: 2 },
    { pattern: 'vehicules', points: 1 },
    { pattern: 'materiel', points: 1 },
    { pattern: 'soumission', points: 1 },
    { pattern: 'date limite', points: 1 }
  ];
  
  let positiveScore = 0;
  for (const indicator of positiveIndicators) {
    if (fullText.includes(indicator.pattern)) {
      positiveScore += indicator.points;
      result.signals.positive.push(indicator);
    }
  }
  result.breakdown.positiveScore = positiveScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 4: INDICATEURS NÉGATIFS (identique V2B)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const negativeIndicators = [
    { pattern: 'recrutement', points: 1.5, category: 'emploi' },
    { pattern: 'poste vacant', points: 3, category: 'emploi' },
    { pattern: 'candidat', points: 2, category: 'emploi' },
    { pattern: 'formation', points: 2, category: 'formation' },
    { pattern: 'seminaire', points: 2, category: 'formation' },
    { pattern: 'atelier', points: 2, category: 'formation' },
    { pattern: 'actualite', points: 2, category: 'actualité' },
    { pattern: 'information', points: 1, category: 'actualité' },
    { pattern: 'etude de faisabilite', points: 1, category: 'étude' }
  ];
  
  let negativeScore = 0;
  for (const indicator of negativeIndicators) {
    if (fullText.includes(indicator.pattern)) {
      negativeScore += indicator.points;
      result.signals.negative.push(indicator);
    }
  }
  result.breakdown.negativeScore = negativeScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 5: AJUSTEMENTS CONTEXTUELS (V2B existants)
  // ═══════════════════════════════════════════════════════════════════════════
  
  let contextualAdjustment = 0;
  
  // Règle acquisition + équipement
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'acquisition_equipement', adjustment: 1 });
  }
  
  // Règle travaux + BTP
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'travaux_btp', adjustment: 1 });
  }
  
  result.breakdown.contextualAdjustment = contextualAdjustment;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 6: AJUSTEMENT D'INTENTION (NOUVEAUTÉ V2C)
  // ═══════════════════════════════════════════════════════════════════════════
  
  let intentAdjustment = 0;
  
  if (result.intentAnalysis.isAmbiguous) {
    // CAS AMBIGU: Force vers REVIEW sauf si signaux marché très forts
    if (marketScore >= 8) {
      // Marché très évident malgré l'ambiguïté
      intentAdjustment += 0.5;
      result.signals.contextual.push({ 
        rule: 'ambiguous_but_strong_market', 
        adjustment: 0.5,
        reason: `Signaux marché très forts (${marketScore}) dominent recrutement (${recruitmentScore})`
      });
    } else {
      // Ambiguïté réelle → pénalise légèrement pour favoriser REVIEW
      intentAdjustment -= 0.3;
      result.signals.contextual.push({ 
        rule: 'ambiguous_intent_penalty', 
        adjustment: -0.3,
        reason: `Intention ambiguë (R:${recruitmentScore}, M:${marketScore}) → révision recommandée`
      });
    }
    
  } else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && marketScore > 0) {
    // Principalement recrutement mais avec signaux marché
    intentAdjustment -= 1;
    result.signals.contextual.push({ 
      rule: 'recruitment_with_market_signals', 
      adjustment: -1,
      reason: 'Document de recrutement avec éléments marché → suspect'
    });
    
  } else if (result.intentAnalysis.primaryIntent === 'MARKET' && recruitmentScore <= 2) {
    // Clairement marché sans confusion recrutement
    intentAdjustment += 0.2;
    result.signals.contextual.push({ 
      rule: 'clear_market_intent', 
      adjustment: 0.2,
      reason: 'Intention marché claire sans confusion RH'
    });
  }
  
  result.breakdown.intentAdjustment = intentAdjustment;

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL FINAL AVEC NOUVEAUX SEUILS V2C
  // ═══════════════════════════════════════════════════════════════════════════
  
  const finalScore = 
    (sourceConfidence * 0.3) + 
    (positiveScore * 0.4) - 
    (negativeScore * 0.6) + 
    contextualAdjustment +
    intentAdjustment;  // NOUVEAU: prise en compte de l'intention
  
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100;
  
  // V2C: Seuils ajustés pour favoriser REVIEW sur les cas ambigus
  const ACCEPT_THRESHOLD = 1.3;   // Légèrement plus strict que V2B (1.2)
  const REJECT_THRESHOLD = -0.1;  // Identique V2B
  
  // Logique de décision finale avec prise en compte de l'intention
  if (result.intentAnalysis.isAmbiguous && finalScore < 2.0) {
    // CAS SPÉCIAL: Intention ambiguë → Force REVIEW sauf score très élevé
    result.classification = 'REVIEW';
    result.confidence = 0.4;
    result.reasons.push('Intention ambiguë → révision manuelle requise');
    
  } else if (finalScore >= ACCEPT_THRESHOLD) {
    result.classification = 'VALID';
    result.confidence = Math.min(finalScore / 3, 1);
    
  } else if (finalScore <= REJECT_THRESHOLD) {
    result.classification = 'REJECTED';
    result.confidence = Math.min(Math.abs(finalScore - REJECT_THRESHOLD) / 2, 1);
    
  } else {
    result.classification = 'REVIEW';
    result.confidence = 0.3;
  }
  
  return result;
}

// Version simplifiée pour compatibilité
export function isRealTenderV2C(title, description, source) {
  const result = classifyWithIntentAnalysisV2C(title, description, source);
  return result.classification === 'VALID';
}