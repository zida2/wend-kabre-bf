/**
 * Comparaison des différents classificateurs
 */

// Configuration de test simplifiée
const CLASSIFICATION_CONFIG = {
  thresholds: { accept: 1.5, reject: -0.5 }, // Seuils plus permissifs
  weights: { source: 0.3, positive: 0.4, negative: 0.6 },
  
  positiveIndicators: {
    strong: ['appel d\'offres', 'demande de cotation', 'avis de recrutement', 'dao', 'manifestation d\'interet'],
    medium: ['acquisition de', 'fourniture de', 'prestation de', 'travaux de', 'construction', 'autorite contractante'],
    weak: ['soumission', 'caution', 'date limite', 'candidature', 'offre technique']
  },
  
  criticalExclusions: [
    'soutenance', 'these', 'master', 'doctorat', 'universite',
    'nomination', 'nomme', 'decret', 'arrete', 'communique de presse',
    'deces', 'condoleances', 'ceremonie', 'inauguration'
  ],
  
  negativeIndicators: {
    formation: ['formation', 'seminaire', 'atelier'],
    actualite: ['actualite', 'information', 'breve'],
    evenement: ['conference', 'colloque', 'forum']
  },
  
  trustedSources: ['arcop', 'dgcmef', 'reliefweb'],
  partiallyTrustedSources: ['ministere', 'gouvernement', 'administration']
};

// Classificateur simple (version initiale)
function simpleClassifier(title, description, source) {
  const text = `${title} ${description}`.toLowerCase();
  
  // Exclusions
  const exclusions = ['soutenance', 'nomination', 'deces', 'ceremonie'];
  for (const exc of exclusions) {
    if (text.includes(exc)) return { decision: 'reject', score: 0, method: 'simple' };
  }
  
  // Score positif
  let score = 0;
  if (text.includes('appel d\'offres') || text.includes('appel d offres')) score += 3;
  if (text.includes('fourniture') || text.includes('travaux') || text.includes('construction')) score += 2;
  if (text.includes('acquisition') || text.includes('prestation')) score += 2;
  if (text.includes('centre') && (text.includes('sante') || text.includes('medical'))) score += 1; // Bonus santé
  
  return {
    decision: score >= 3 ? 'accept' : 'reject',
    score,
    method: 'simple'
  };
}

// Classificateur avancé (nouvelle version)
function advancedClassifier(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  // Exclusions critiques
  for (const exclusion of CLASSIFICATION_CONFIG.criticalExclusions) {
    if (fullText.includes(exclusion)) {
      return { decision: 'reject', score: 0, confidence: 0.9, method: 'advanced' };
    }
  }
  
  // Confiance source
  let sourceConfidence = 0.2;
  if (CLASSIFICATION_CONFIG.trustedSources.some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (CLASSIFICATION_CONFIG.partiallyTrustedSources.some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }
  
  // Scores
  let positiveScore = 0;
  let negativeScore = 0;
  
  CLASSIFICATION_CONFIG.positiveIndicators.strong.forEach(indicator => {
    if (fullText.includes(indicator)) positiveScore += 3;
  });
  
  CLASSIFICATION_CONFIG.positiveIndicators.medium.forEach(indicator => {
    if (fullText.includes(indicator)) positiveScore += 2;
  });
  
  CLASSIFICATION_CONFIG.positiveIndicators.weak.forEach(indicator => {
    if (fullText.includes(indicator)) positiveScore += 1;
  });
  
  Object.values(CLASSIFICATION_CONFIG.negativeIndicators).forEach(indicators => {
    indicators.forEach(indicator => {
      if (fullText.includes(indicator)) negativeScore += 2;
    });
  });
  
  const finalScore = 
    (sourceConfidence * CLASSIFICATION_CONFIG.weights.source) + 
    (positiveScore * CLASSIFICATION_CONFIG.weights.positive) - 
    (negativeScore * CLASSIFICATION_CONFIG.weights.negative);
  
  let decision = 'review';
  if (finalScore >= CLASSIFICATION_CONFIG.thresholds.accept) {
    decision = 'accept';
  } else if (finalScore <= CLASSIFICATION_CONFIG.thresholds.reject) {
    decision = 'reject';
  }
  
  return {
    decision,
    score: finalScore,
    confidence: finalScore > 0 ? Math.min(finalScore / 3, 1) : 0.1,
    method: 'advanced',
    breakdown: { sourceConfidence, positiveScore, negativeScore }
  };
}

// Échantillons de test
const testCases = [
  {
    id: 'market-1',
    title: 'Appel d\'offres pour fourniture de matériel informatique',
    description: 'Acquisition d\'ordinateurs et équipements réseau. Montant: 25M FCFA.',
    source: 'dgcmef.gov.bf',
    expected: 'accept'
  },
  {
    id: 'market-2', 
    title: 'Travaux de construction d\'un centre de santé',
    description: 'Construction d\'un CSPS à Koudougou. Durée: 8 mois.',
    source: 'sante.gov.bf',
    expected: 'accept'
  },
  {
    id: 'reject-1',
    title: 'Soutenance de thèse de doctorat en médecine',
    description: 'Présentation des travaux sur les maladies tropicales.',
    source: 'univ-ouaga.bf',
    expected: 'reject'
  },
  {
    id: 'reject-2',
    title: 'Nomination du nouveau directeur',
    description: 'Le ministre nomme le nouveau DG des impôts.',
    source: 'finances.gov.bf',
    expected: 'reject'
  },
  {
    id: 'ambiguous-1',
    title: 'Formation en gestion de projet',
    description: 'Prestation de formation pour 30 cadres. Budget: 5M FCFA.',
    source: 'fonction-publique.gov.bf',
    expected: 'review'
  },
  {
    id: 'ambiguous-2',
    title: 'Étude de faisabilité routière',
    description: 'Mission d\'étude pour la route Ouaga-Bobo.',
    source: 'infrastructures.gov.bf',
    expected: 'review'
  }
];

// Exécution des tests comparatifs
console.log('🔬 COMPARAISON DES CLASSIFICATEURS');
console.log('='.repeat(80));

let simpleResults = { correct: 0, total: 0 };
let advancedResults = { correct: 0, total: 0 };

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.id}`);
  console.log(`Titre: ${testCase.title}`);
  console.log(`Attendu: ${testCase.expected.toUpperCase()}`);
  
  // Test classificateur simple
  const simpleResult = simpleClassifier(testCase.title, testCase.description, testCase.source);
  const simpleCorrect = simpleResult.decision === testCase.expected;
  console.log(`Simple: ${simpleResult.decision.toUpperCase()} (score: ${simpleResult.score}) ${simpleCorrect ? '✅' : '❌'}`);
  
  // Test classificateur avancé  
  const advancedResult = advancedClassifier(testCase.title, testCase.description, testCase.source);
  const advancedCorrect = advancedResult.decision === testCase.expected;
  console.log(`Avancé: ${advancedResult.decision.toUpperCase()} (score: ${advancedResult.score.toFixed(2)}) ${advancedCorrect ? '✅' : '❌'}`);
  
  if (advancedResult.breakdown) {
    console.log(`  └─ Détail: source=${advancedResult.breakdown.sourceConfidence}, +${advancedResult.breakdown.positiveScore}, -${advancedResult.breakdown.negativeScore}`);
  }
  
  // Comptage des résultats
  simpleResults.total++;
  advancedResults.total++;
  if (simpleCorrect) simpleResults.correct++;
  if (advancedCorrect) advancedResults.correct++;
});

// Résultats finaux
console.log('\n' + '='.repeat(80));
console.log('📊 RÉSULTATS COMPARATIFS');
console.log('='.repeat(80));

const simplePrecision = (simpleResults.correct / simpleResults.total * 100).toFixed(1);
const advancedPrecision = (advancedResults.correct / advancedResults.total * 100).toFixed(1);

console.log(`Classificateur simple:  ${simpleResults.correct}/${simpleResults.total} (${simplePrecision}%)`);
console.log(`Classificateur avancé:  ${advancedResults.correct}/${advancedResults.total} (${advancedPrecision}%)`);

const improvement = advancedPrecision - simplePrecision;
console.log(`\n📈 Amélioration: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} points`);

// Recommandations
console.log('\n💡 ANALYSE:');
if (improvement > 0) {
  console.log('✅ Le classificateur avancé montre une amélioration significative');
  console.log('   - Prise en compte des sources fiables');
  console.log('   - Système de révision pour les cas ambigus');
  console.log('   - Scoring plus nuancé avec pondération');
} else if (improvement === 0) {
  console.log('⚖️ Performance équivalente - le simple pourrait suffire');
} else {
  console.log('⚠️ Le classificateur simple performe mieux sur ces échantillons');
  console.log('   - Revoir les seuils du classificateur avancé');
  console.log('   - Simplifier les règles ou ajuster la pondération');
}

console.log('\n🎯 PROCHAINES ÉTAPES:');
console.log('1. Tester sur un plus grand échantillon (100+ cas)');
console.log('2. Ajuster les seuils selon les résultats');
console.log('3. Implémenter le système de révision manuelle');
console.log('4. Monitorer les performances en production');