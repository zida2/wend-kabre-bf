/**
 * Classificateur enrichi avec diagnostic complet
 * Retourne toutes les informations pour comprendre les décisions
 */

export function classifyWithDiagnostic(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    confidence: 0,
    score: 0,
    signals: {
      positive: [],
      negative: [],
      exclusions: []
    },
    reasons: [],
    breakdown: {
      sourceConfidence: 0,
      positiveScore: 0,
      negativeScore: 0,
      finalScore: 0
    },
    metadata: {
      title: title?.substring(0, 100) + '...',
      source,
      textLength: fullText.length,
      timestamp: new Date().toISOString()
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
      result.signals.exclusions.push({
        pattern: exclusion.pattern,
        category: exclusion.category,
        severity: exclusion.severity
      });
      
      result.classification = 'REJECTED';
      result.confidence = 0.95;
      result.score = 0;
      result.reasons.push(`Exclusion critique détectée: "${exclusion.pattern}" (${exclusion.category})`);
      
      return result;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 2: ÉVALUATION DE LA SOURCE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const trustedSources = [
    { pattern: 'arcop', confidence: 0.9, name: 'ARCOP (Autorité de Régulation)' },
    { pattern: 'dgcmef', confidence: 0.9, name: 'DGCMEF (Direction Générale)' },
    { pattern: 'reliefweb', confidence: 0.8, name: 'ReliefWeb' },
    { pattern: 'marches-publics', confidence: 0.85, name: 'Site officiel marchés publics' }
  ];
  
  const partiallyTrustedSources = [
    { pattern: 'ministere', confidence: 0.6, name: 'Site ministériel' },
    { pattern: 'gouvernement', confidence: 0.6, name: 'Site gouvernemental' },
    { pattern: 'administration', confidence: 0.5, name: 'Site administratif' }
  ];
  
  let sourceConfidence = 0.2; // Source inconnue
  let sourceInfo = 'Source inconnue';
  
  for (const trusted of trustedSources) {
    if (normalizedSource.includes(trusted.pattern)) {
      sourceConfidence = trusted.confidence;
      sourceInfo = trusted.name;
      result.reasons.push(`Source fiable détectée: ${trusted.name}`);
      break;
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
  // NIVEAU 3: INDICATEURS POSITIFS (PREUVES DE MARCHÉ)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const positiveIndicators = [
    // Forts (+3 points)
    { pattern: 'appel d\'offres', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'appel d offres', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'demande de cotation', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'avis de recrutement', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'dao', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'manifestation d\'interet', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'manifestation d interet', points: 3, category: 'procédure', strength: 'fort' },
    
    // Moyens (+2 points)
    { pattern: 'acquisition de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'fourniture de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'prestation de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'travaux de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'construction', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'autorite contractante', points: 2, category: 'procédure', strength: 'moyen' },
    
    // Faibles (+1 point)
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
      result.signals.positive.push({
        pattern: indicator.pattern,
        points: indicator.points,
        category: indicator.category,
        strength: indicator.strength
      });
      
      result.reasons.push(`Indicateur ${indicator.strength} détecté: "${indicator.pattern}" (+${indicator.points} pts)`);
    }
  }
  
  result.breakdown.positiveScore = positiveScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 4: INDICATEURS NÉGATIFS (RÉDUISENT LE SCORE)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const negativeIndicators = [
    // Formation/éducation
    { pattern: 'formation', points: 2, category: 'formation', impact: 'moyen' },
    { pattern: 'seminaire', points: 2, category: 'formation', impact: 'moyen' },
    { pattern: 'atelier', points: 2, category: 'formation', impact: 'moyen' },
    
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
      result.signals.negative.push({
        pattern: indicator.pattern,
        points: indicator.points,
        category: indicator.category,
        impact: indicator.impact
      });
      
      result.reasons.push(`Indicateur négatif détecté: "${indicator.pattern}" (-${indicator.points} pts)`);
    }
  }
  
  result.breakdown.negativeScore = negativeScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL FINAL ET DÉCISION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Score pondéré
  const finalScore = 
    (sourceConfidence * 0.3) +     // 30% pour la source
    (positiveScore * 0.4) -        // 40% pour les indicateurs positifs
    (negativeScore * 0.6);         // 60% pour les indicateurs négatifs (plus de poids)
  
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100; // Arrondir à 2 décimales
  
  // Seuils de décision
  const ACCEPT_THRESHOLD = 1.5;
  const REJECT_THRESHOLD = -0.5;
  
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
    result.confidence = 0.3; // Faible confiance pour les cas ambigus
    result.reasons.push(`Score dans la zone d'incertitude (${REJECT_THRESHOLD} < ${finalScore.toFixed(2)} < ${ACCEPT_THRESHOLD}) - révision nécessaire`);
  }
  
  return result;
}

/**
 * Version simplifiée pour compatibilité avec l'ancien code
 */
export function isRealTender(title, description, source) {
  const result = classifyWithDiagnostic(title, description, source);
  return result.classification === 'VALID';
}

/**
 * Génère un rapport détaillé de classification
 */
export function generateClassificationReport(result) {
  const { signals, breakdown, reasons, metadata } = result;
  
  return `
# 📊 RAPPORT DE CLASSIFICATION

## Contenu analysé
**Titre:** ${metadata.title}
**Source:** ${metadata.source || 'Non spécifiée'}
**Longueur:** ${metadata.textLength} caractères

## Décision finale
**Classification:** ${result.classification}
**Confiance:** ${Math.round(result.confidence * 100)}%
**Score final:** ${result.score}

## Détail du scoring
- **Source:** ${breakdown.sourceConfidence} (×0.3 = ${(breakdown.sourceConfidence * 0.3).toFixed(2)})
- **Positifs:** ${breakdown.positiveScore} (×0.4 = ${(breakdown.positiveScore * 0.4).toFixed(2)})
- **Négatifs:** ${breakdown.negativeScore} (×0.6 = -${(breakdown.negativeScore * 0.6).toFixed(2)})
- **Total:** ${breakdown.finalScore.toFixed(2)}

## Signaux détectés

### ✅ Indicateurs positifs (${signals.positive.length})
${signals.positive.map(s => `- "${s.pattern}" (+${s.points} pts, ${s.category}, ${s.strength})`).join('\n') || 'Aucun'}

### ⚠️ Indicateurs négatifs (${signals.negative.length})
${signals.negative.map(s => `- "${s.pattern}" (-${s.points} pts, ${s.category})`).join('\n') || 'Aucun'}

### 🚫 Exclusions critiques (${signals.exclusions.length})
${signals.exclusions.map(s => `- "${s.pattern}" (${s.category}, ${s.severity})`).join('\n') || 'Aucune'}

## Raisonnement
${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
*Rapport généré le ${new Date(metadata.timestamp).toLocaleString('fr-FR')}*
`;
}