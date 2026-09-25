/**
 * Système de calcul du score de compatibilité marché/utilisateur
 * Explique pourquoi un marché correspond à X% au profil de l'entreprise
 */

/**
 * Calcule le score de match entre un marché et un profil d'entreprise
 * DÉTERMINISTE : Même input = même output, calcul explicite et auditable
 */
export function calculateMatchScore(market, userProfile) {
  if (!market || !userProfile) {
    return { 
      score: 0, 
      details: [], 
      reasons: ['Données insuffisantes'],
      calculation: { total: 0, maxTotal: 100, breakdown: {} }
    };
  }

  // Configuration des poids (DÉTERMINISTE)
  const WEIGHTS = {
    SECTOR: 25,      // Secteur d'activité
    REGION: 20,      // Région géographique  
    BUDGET: 20,      // Montant du marché
    EXPERIENCE: 15,  // Expérience et références
    TIMING: 10,      // Urgence et timing
    COMPLIANCE: 10   // Conformité administrative
  };
  
  const MAX_TOTAL = 100;
  const criteria = [];
  let totalScore = 0;
  const calculation = { breakdown: {}, total: 0, maxTotal: MAX_TOTAL };

  // SECTEUR (25 points max) - CALCUL DÉTERMINISTE
  const marketSector = market.secteur || market.category || '';
  const userSectors = userProfile.secteurs || userProfile.activites || [];
  
  let sectorScore = 0;
  let sectorReason = '';
  
  if (userSectors.length === 0) {
    sectorScore = WEIGHTS.SECTOR * 0.3;
    sectorReason = 'Secteur d\'activité non renseigné dans votre profil';
  } else {
    const normalizedMarketSector = marketSector.toLowerCase();
    const exactMatch = userSectors.find(sector => 
      normalizedMarketSector.includes(sector.toLowerCase()) ||
      sector.toLowerCase().includes(normalizedMarketSector)
    );
    
    if (exactMatch) {
      sectorScore = WEIGHTS.SECTOR; // 25 points
      sectorReason = `Secteur "${marketSector}" correspond parfaitement à "${exactMatch}"`;
    } else if (normalizedMarketSector.includes('informatique') && userSectors.some(s => s.toLowerCase().includes('tech'))) {
      sectorScore = WEIGHTS.SECTOR * 0.8; // 20 points
      sectorReason = `Secteur "${marketSector}" partiellement compatible avec votre profil tech`;
    } else {
      sectorScore = WEIGHTS.SECTOR * 0.1; // 2.5 points
      sectorReason = `Secteur "${marketSector}" ne correspond pas à vos activités principales`;
    }
  }
  
  totalScore += sectorScore;
  calculation.breakdown.sector = { score: sectorScore, maxScore: WEIGHTS.SECTOR, percentage: Math.round((sectorScore / WEIGHTS.SECTOR) * 100) };
  
  criteria.push({
    name: 'Secteur d\'activité',
    weight: WEIGHTS.SECTOR,
    score: sectorScore,
    percentage: Math.round((sectorScore / WEIGHTS.SECTOR) * 100),
    status: sectorScore > WEIGHTS.SECTOR * 0.7 ? 'success' : sectorScore > WEIGHTS.SECTOR * 0.4 ? 'partial' : 'fail',
    reason: sectorReason
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITÈRE 2: RÉGION GÉOGRAPHIQUE (poids: 20%)
  // ═══════════════════════════════════════════════════════════════════════════
  const regionWeight = 20;
  totalWeight += regionWeight;
  
  const marketRegion = market.region || '';
  const userRegion = userProfile.region || userProfile.localisation || '';
  
  let regionMatch = 0;
  let regionReason = '';
  
  if (!userRegion) {
    regionReason = 'Région non renseignée dans votre profil';
  } else if (marketRegion === 'Non spécifié') {
    regionMatch = regionWeight * 0.5; // Score neutre
    regionReason = 'Région du marché non spécifiée';
  } else if (marketRegion.toLowerCase() === userRegion.toLowerCase()) {
    regionMatch = regionWeight;
    regionReason = `Marché dans votre région (${marketRegion})`;
  } else if (marketRegion.toLowerCase().includes('centre') && userRegion.toLowerCase().includes('ouagadougou')) {
    regionMatch = regionWeight;
    regionReason = `Marché à ${marketRegion}, proche de votre localisation`;
  } else {
    regionMatch = regionWeight * 0.3; // Pénalité distance mais pas rédhibitoire
    regionReason = `Marché à ${marketRegion}, éloigné de votre région (${userRegion})`;
  }
  
  achievedScore += regionMatch;
  criteria.push({
    name: 'Localisation géographique',
    weight: regionWeight,
    score: regionMatch,
    status: regionMatch > regionWeight * 0.8 ? 'success' : regionMatch > regionWeight * 0.4 ? 'partial' : 'warning',
    reason: regionReason
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITÈRE 3: MONTANT DU MARCHÉ (poids: 20%)
  // ═══════════════════════════════════════════════════════════════════════════
  const budgetWeight = 20;
  totalWeight += budgetWeight;
  
  const marketAmount = market.montant || extractMontantFromText(market.montantEstime);
  const userTurnover = userProfile.chiffreAffaires || userProfile.budgetAnnuel || 0;
  
  let budgetMatch = 0;
  let budgetReason = '';
  
  if (!marketAmount || marketAmount === 0) {
    budgetMatch = budgetWeight * 0.5;
    budgetReason = 'Montant du marché non communiqué';
  } else if (!userTurnover || userTurnover === 0) {
    budgetMatch = budgetWeight * 0.5;
    budgetReason = 'Chiffre d\'affaires non renseigné dans votre profil';
  } else {
    const ratio = marketAmount / userTurnover;
    
    if (ratio <= 0.3) {
      budgetMatch = budgetWeight;
      budgetReason = `Montant adapté à votre capacité (${formatAmount(marketAmount)} vs CA ${formatAmount(userTurnover)})`;
    } else if (ratio <= 0.6) {
      budgetMatch = budgetWeight * 0.8;
      budgetReason = `Montant gérable mais significatif (${formatAmount(marketAmount)})`;
    } else if (ratio <= 1.0) {
      budgetMatch = budgetWeight * 0.5;
      budgetReason = `Montant important par rapport à votre CA (${formatAmount(marketAmount)})`;
    } else {
      budgetMatch = budgetWeight * 0.2;
      budgetReason = `Montant très élevé (${formatAmount(marketAmount)}) nécessite des partenariats`;
    }
  }
  
  achievedScore += budgetMatch;
  criteria.push({
    name: 'Montant du marché',
    weight: budgetWeight,
    score: budgetMatch,
    status: budgetMatch > budgetWeight * 0.7 ? 'success' : budgetMatch > budgetWeight * 0.4 ? 'partial' : 'warning',
    reason: budgetReason
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITÈRE 4: EXPÉRIENCE ET RÉFÉRENCES (poids: 15%)
  // ═══════════════════════════════════════════════════════════════════════════
  const experienceWeight = 15;
  totalWeight += experienceWeight;
  
  const userExperience = userProfile.experienceAnnees || 0;
  const userReferences = userProfile.references || [];
  
  let experienceMatch = 0;
  let experienceReason = '';
  
  const marketCategory = market.category || '';
  const hasRelevantReference = userReferences.some(ref => 
    ref.secteur && marketCategory && 
    ref.secteur.toLowerCase().includes(marketCategory.toLowerCase())
  );
  
  if (userExperience >= 5 && hasRelevantReference) {
    experienceMatch = experienceWeight;
    experienceReason = `Expérience solide (${userExperience} ans) avec références pertinentes`;
  } else if (userExperience >= 3) {
    experienceMatch = experienceWeight * 0.7;
    experienceReason = `Expérience correcte (${userExperience} ans)`;
  } else if (userExperience >= 1) {
    experienceMatch = experienceWeight * 0.4;
    experienceReason = `Expérience limitée (${userExperience} ans) pour ce type de marché`;
  } else {
    experienceMatch = experienceWeight * 0.2;
    experienceReason = 'Profil junior, marché accessible mais challengeant';
  }
  
  achievedScore += experienceMatch;
  criteria.push({
    name: 'Expérience et références',
    weight: experienceWeight,
    score: experienceMatch,
    status: experienceMatch > experienceWeight * 0.7 ? 'success' : experienceMatch > experienceWeight * 0.4 ? 'partial' : 'warning',
    reason: experienceReason
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITÈRE 5: URGENCE ET TIMING (poids: 10%)
  // ═══════════════════════════════════════════════════════════════════════════
  const timingWeight = 10;
  totalWeight += timingWeight;
  
  const marketUrgency = market.urgence || 'Normal';
  const userCapacity = userProfile.capaciteReaction || 'normale'; // normale, rapide, limitee
  
  let timingMatch = 0;
  let timingReason = '';
  
  if (marketUrgency === 'Urgent' && userCapacity === 'rapide') {
    timingMatch = timingWeight;
    timingReason = 'Marché urgent, vous avez la capacité de réagir rapidement';
  } else if (marketUrgency === 'Urgent' && userCapacity === 'normale') {
    timingMatch = timingWeight * 0.6;
    timingReason = 'Marché urgent, temps de préparation limité';
  } else if (marketUrgency === 'Urgent') {
    timingMatch = timingWeight * 0.3;
    timingReason = 'Marché urgent, délai très serré pour votre organisation';
  } else if (marketUrgency === 'Normal') {
    timingMatch = timingWeight;
    timingReason = 'Délai normal, temps suffisant pour préparer une offre de qualité';
  } else {
    timingMatch = timingWeight * 0.8;
    timingReason = 'Timing du marché à vérifier';
  }
  
  achievedScore += timingMatch;
  criteria.push({
    name: 'Timing et urgence',
    weight: timingWeight,
    score: timingMatch,
    status: timingMatch > timingWeight * 0.7 ? 'success' : timingMatch > timingWeight * 0.4 ? 'partial' : 'warning',
    reason: timingReason
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITÈRE 6: CONFORMITÉ ADMINISTRATIVE (poids: 10%)
  // ═══════════════════════════════════════════════════════════════════════════
  const complianceWeight = 10;
  totalWeight += complianceWeight;
  
  const userDocuments = userProfile.documents || {};
  const hasRCCM = userDocuments.rccm;
  const hasIFU = userDocuments.ifu;
  const hasCNSS = userDocuments.cnss;
  const hasDGI = userDocuments.dgi;
  
  const docCount = [hasRCCM, hasIFU, hasCNSS, hasDGI].filter(Boolean).length;
  const complianceMatch = (docCount / 4) * complianceWeight;
  
  let complianceReason = '';
  if (docCount === 4) {
    complianceReason = 'Documents administratifs complets';
  } else if (docCount >= 2) {
    complianceReason = `Documents partiels (${docCount}/4), compléter pour optimiser vos chances`;
  } else {
    complianceReason = 'Profil administratif incomplet, risque de disqualification';
  }
  
  achievedScore += complianceMatch;
  criteria.push({
    name: 'Conformité administrative',
    weight: complianceWeight,
    score: complianceMatch,
    status: complianceMatch > complianceWeight * 0.8 ? 'success' : complianceMatch > complianceWeight * 0.5 ? 'partial' : 'fail',
    reason: complianceReason
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL DU SCORE FINAL
  // ═══════════════════════════════════════════════════════════════════════════
  const finalScore = Math.round((achievedScore / totalWeight) * 100);
  
  // Raisons principales (top 3)
  const sortedCriteria = criteria.sort((a, b) => b.score - a.score);
  const mainReasons = sortedCriteria.slice(0, 3).map(c => c.reason);
  
  return {
    score: finalScore,
    details: criteria,
    reasons: mainReasons,
    recommendation: getRecommendation(finalScore),
    level: getMatchLevel(finalScore)
  };
}

/**
 * Extrait un montant depuis une chaîne de texte
 */
function extractMontantFromText(text) {
  if (!text) return 0;
  
  // "12 000 000 FCFA" ou "12.000.000"
  const match = text.match(/(\d[\d\s.,]*)/);
  if (match) {
    const cleanNumber = match[1].replace(/[\s.,]/g, '');
    return parseInt(cleanNumber, 10) || 0;
  }
  
  // "X millions"
  const millionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*millions?/i);
  if (millionMatch) {
    return parseFloat(millionMatch[1]) * 1000000;
  }
  
  return 0;
}

/**
 * Formate un montant en FCFA
 */
function formatAmount(amount) {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}Md FCFA`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M FCFA`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  }
  return `${amount} FCFA`;
}

/**
 * Retourne une recommandation basée sur le score
 */
function getRecommendation(score) {
  if (score >= 85) {
    return {
      text: 'Marché hautement recommandé ! Excellent match avec votre profil.',
      action: 'Préparez votre dossier dès maintenant',
      priority: 'high'
    };
  } else if (score >= 70) {
    return {
      text: 'Très bon match, marché à considérer sérieusement.',
      action: 'Analysez le DAO et préparez votre stratégie',
      priority: 'high'
    };
  } else if (score >= 55) {
    return {
      text: 'Match correct, opportunité intéressante avec quelques limitations.',
      action: 'Évaluez la faisabilité et vos chances de succès',
      priority: 'medium'
    };
  } else if (score >= 35) {
    return {
      text: 'Match partiel, marché challengeant mais pas impossible.',
      action: 'Considérez un partenariat ou renforcez votre profil',
      priority: 'low'
    };
  } else {
    return {
      text: 'Faible compatibilité avec ce marché.',
      action: 'Concentrez-vous sur des opportunités plus adaptées',
      priority: 'skip'
    };
  }
}

/**
 * Retourne le niveau de match
 */
function getMatchLevel(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'très-bon';
  if (score >= 55) return 'bon';
  if (score >= 35) return 'moyen';
  return 'faible';
}

/**
 * Version simplifiée pour affichage rapide
 */
export function getQuickMatchScore(market, userProfile) {
  const fullResult = calculateMatchScore(market, userProfile);
  return {
    score: fullResult.score,
    level: fullResult.level,
    mainReason: fullResult.reasons[0] || 'Analyse en cours...'
  };
}

export default {
  calculateMatchScore,
  getQuickMatchScore,
  formatAmount
};