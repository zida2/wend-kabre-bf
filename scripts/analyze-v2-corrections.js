/**
 * Analyse des résultats v1 pour créer les corrections v2
 */

const { classifyWithDiagnostic } = require('./quick-test.js');

// Problèmes identifiés dans v1
const v1Problems = [
  {
    title: 'Avis de recrutement - Prestation de gardiennage pour bâtiments administratifs',
    description: 'Service de sécurité 24h/24 pour 5 bâtiments à Ouagadougou.',
    source: 'fonction-publique.gov.bf',
    expected: 'REVIEW',
    v1Result: 'REJECTED', // Trop strict maintenant
    problem: 'Règle contextuelle "prestation + recrutement" trop agressive'
  },
  {
    title: 'Cérémonie d\'inauguration du nouveau complexe sportif de Bobo-Dioulasso',
    description: 'Événement officiel présidé par le Ministre des Sports.',
    source: 'gouvernement.gov.bf',
    expected: 'REJECTED',
    v1Result: 'REVIEW', // Pas assez strict
    problem: 'Mot "cérémonie" doit être exclusion critique'
  }
];

function classifyWithDiagnosticV2(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    score: 0,
    confidence: 0,
    signals: { positive: [], negative: [], exclusions: [], contextual: [] },
    breakdown: { sourceConfidence: 0, positiveScore: 0, negativeScore: 0, contextualAdjustment: 0, finalScore: 0 },
    version: 'v2-optimized'
  };

  // AMÉLIORATION V2: Exclusions critiques renforcées
  const criticalExclusions = [
    { pattern: 'soutenance', category: 'académique' },
    { pattern: 'these', category: 'académique' },
    { pattern: 'master', category: 'académique' },
    { pattern: 'nomination', category: 'administratif' },
    { pattern: 'nomme', category: 'administratif' },
    { pattern: 'deces', category: 'personnel' },
    { pattern: 'ceremonie', category: 'événement' }, // RENFORCE: plus de tolérance
    { pattern: 'inauguration', category: 'événement' } // AJOUT: exclusion critique
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

  // Sources (identique V1 améliorée)
  let sourceConfidence = 0.2;
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (['sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 'equipement.gov.bf'].some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7;
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }
  result.breakdown.sourceConfidence = sourceConfidence;

  // Indicateurs positifs (identiques V1)
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

  // AMÉLIORATION V2: Indicateurs négatifs plus nuancés
  const negativeIndicators = [
    { pattern: 'recrutement', points: 2, category: 'emploi' }, // RÉDUIT de 3 à 2
    { pattern: 'poste vacant', points: 3, category: 'emploi' }, // Reste fort
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

  // AMÉLIORATION V2: Règles contextuelles plus nuancées
  let contextualAdjustment = 0;
  
  // Règle 1: prestation + recrutement = négatif mais plus modéré
  if (fullText.includes('prestation') && fullText.includes('recrutement')) {
    // AJUSTEMENT: Distinguer selon le contexte
    if (fullText.includes('gardiennage') || fullText.includes('securite') || fullText.includes('nettoyage')) {
      contextualAdjustment -= 1; // RÉDUIT de -2 à -1 pour services
      result.signals.contextual.push({ rule: 'prestation_service_recrutement', adjustment: -1 });
    } else {
      contextualAdjustment -= 2; // Reste -2 pour autres recrutements
      result.signals.contextual.push({ rule: 'prestation_recrutement', adjustment: -2 });
    }
  }
  
  // Règle 2: acquisition + équipement = positif (identique)
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'acquisition_equipement', adjustment: 1 });
  }
  
  // Règle 3: travaux + BTP = positif (identique)
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'travaux_btp', adjustment: 1 });
  }
  
  // NOUVELLE RÈGLE V2: Avis de recrutement pour services = cas spécial
  if (fullText.includes('avis de recrutement') && (fullText.includes('gardiennage') || fullText.includes('securite') || fullText.includes('nettoyage'))) {
    contextualAdjustment += 0.5; // Petit bonus car c'est un marché de service
    result.signals.contextual.push({ rule: 'recrutement_service_marche', adjustment: 0.5 });
  }
  
  result.breakdown.contextualAdjustment = contextualAdjustment;

  // Score final
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6) + contextualAdjustment;
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100;
  
  // AMÉLIORATION V2: Seuils re-calibrés
  const ACCEPT_THRESHOLD = 1.4;   // Légèrement remonté pour réduire pollution
  const REJECT_THRESHOLD = -0.2;  // Légèrement baissé pour plus de tolérance
  
  if (finalScore >= ACCEPT_THRESHOLD) {
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

function testV2Corrections() {
  console.log('🔬 TEST DES CORRECTIONS V2');
  console.log('=' .repeat(60));
  
  v1Problems.forEach((problem, index) => {
    console.log(`\n📋 Test ${index + 1}: ${problem.problem}`);
    console.log(`Titre: ${problem.title.substring(0, 70)}...`);
    console.log(`Attendu: ${problem.expected}, V1 donnait: ${problem.v1Result}`);
    
    // Test V2
    const v2Result = classifyWithDiagnosticV2(problem.title, problem.description, problem.source);
    
    const isFixed = v2Result.classification === problem.expected;
    console.log(`V2 donne: ${v2Result.classification} (score: ${v2Result.score}) ${isFixed ? '✅' : '❌'}`);
    
    if (v2Result.signals.contextual.length > 0) {
      console.log(`Règles contextuelles: ${v2Result.signals.contextual.map(c => `${c.rule}(${c.adjustment > 0 ? '+' : ''}${c.adjustment})`).join(', ')}`);
    }
    
    if (!isFixed) {
      console.log(`⚠️ Problème persistant - nécessite ajustement supplémentaire`);
    }
  });
  
  console.log('\n💡 STRATÉGIE V2:');
  console.log('1. Exclusions critiques renforcées (cérémonie, inauguration)');
  console.log('2. Indicateur "recrutement" moins pénalisant (2 pts au lieu de 3)');
  console.log('3. Règle contextuelle nuancée pour services (gardiennage)');
  console.log('4. Nouvelle règle pour "avis de recrutement" + services');
  console.log('5. Seuils recalibrés (VALID: 1.4, REJECT: -0.2)');
  
  return v1Problems.map(p => ({
    ...p,
    v2Result: classifyWithDiagnosticV2(p.title, p.description, p.source).classification
  }));
}

// Exécution
if (require.main === module) {
  testV2Corrections();
}

module.exports = { testV2Corrections, classifyWithDiagnosticV2 };