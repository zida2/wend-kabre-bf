/**
 * Test rapide du système de classification avec diagnostic complet
 */

// Import du classificateur enrichi (version adaptée pour Node.js)
function normalizeText(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function classifyWithDiagnostic(title, description, source) {
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

  // Exclusions critiques
  const criticalExclusions = [
    { pattern: 'soutenance', category: 'académique' },
    { pattern: 'these', category: 'académique' },
    { pattern: 'master', category: 'académique' },
    { pattern: 'doctorat', category: 'académique' },
    { pattern: 'universite', category: 'académique' },
    { pattern: 'nomination', category: 'administratif' },
    { pattern: 'nomme', category: 'administratif' },
    { pattern: 'decret n', category: 'administratif' },
    { pattern: 'communique de presse', category: 'administratif' },
    { pattern: 'deces', category: 'personnel' },
    { pattern: 'condoleances', category: 'personnel' },
    { pattern: 'ceremonie', category: 'événement' },
    { pattern: 'inauguration', category: 'événement' }
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

  // Évaluation de la source
  const trustedSources = ['arcop', 'dgcmef', 'reliefweb', 'marches-publics'];
  const partiallyTrustedSources = ['ministere', 'gouvernement', 'administration'];
  
  let sourceConfidence = 0.2;
  if (trustedSources.some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
    result.reasons.push('Source très fiable détectée');
  } else if (partiallyTrustedSources.some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
    result.reasons.push('Source partiellement fiable détectée');
  }
  
  result.breakdown.sourceConfidence = sourceConfidence;

  // Indicateurs positifs
  const positiveIndicators = [
    { pattern: 'appel d\'offres', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'appel d offres', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'demande de cotation', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'dao', points: 3, category: 'procédure', strength: 'fort' },
    { pattern: 'acquisition de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'fourniture de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'prestation de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'travaux de', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'construction', points: 2, category: 'objet', strength: 'moyen' },
    { pattern: 'soumission', points: 1, category: 'procédure', strength: 'faible' },
    { pattern: 'date limite', points: 1, category: 'temporel', strength: 'faible' }
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

  // Indicateurs négatifs
  const negativeIndicators = [
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
      result.reasons.push(`Indicateur négatif: "${indicator.pattern}" (-${indicator.points})`);
    }
  }
  result.breakdown.negativeScore = negativeScore;

  // Score final
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6);
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100;
  
  // Classification finale
  if (finalScore >= 1.5) {
    result.classification = 'VALID';
    result.confidence = Math.min(finalScore / 3, 1);
    result.reasons.push(`Score suffisant (${finalScore.toFixed(2)} ≥ 1.5)`);
  } else if (finalScore <= -0.5) {
    result.classification = 'REJECTED';
    result.confidence = Math.min(Math.abs(finalScore + 0.5) / 2, 1);
    result.reasons.push(`Score insuffisant (${finalScore.toFixed(2)} ≤ -0.5)`);
  } else {
    result.classification = 'REVIEW';
    result.confidence = 0.3;
    result.reasons.push(`Score dans zone grise (-0.5 < ${finalScore.toFixed(2)} < 1.5)`);
  }
  
  return result;
}

// Échantillons de test réalistes
const testSamples = [
  {
    id: 'real-market-1',
    title: 'Appel d\'offres ouvert pour fourniture de matériel informatique au profit du Ministère de la Santé',
    description: 'Acquisition d\'ordinateurs portables, imprimantes et équipements réseau pour équiper 15 centres de santé. Montant estimé: 45 000 000 FCFA. Date limite de soumission: 30 janvier 2025.',
    source: 'dgcmef.gov.bf',
    expectedClassification: 'VALID'
  },
  
  {
    id: 'real-market-2',
    title: 'Demande de cotation pour travaux de construction d\'un centre de santé à Koudougou',
    description: 'Construction d\'un CSPS avec maternité, équipement médical de base et forage d\'eau potable. Surface bâtie: 200 m². Durée d\'exécution: 8 mois.',
    source: 'sante.gov.bf',
    expectedClassification: 'VALID'
  },
  
  {
    id: 'academic-rejection',
    title: 'Soutenance de thèse de Master en Informatique - Université Joseph Ki-Zerbo',
    description: 'Présentation des travaux de recherche sur "Optimisation des algorithmes de machine learning pour la détection de fraudes bancaires". Jury présidé par Pr. OUEDRAOGO.',
    source: 'ujkz.bf',
    expectedClassification: 'REJECTED'
  },
  
  {
    id: 'admin-rejection',
    title: 'Nomination du nouveau Directeur Général de la Caisse Nationale de Sécurité Sociale',
    description: 'Par décret N°2024-1205, le Président du Faso a nommé M. Paul SANKARA au poste de Directeur Général de la CNSS, en remplacement de M. Jean KABORE.',
    source: 'presidencedufaso.bf',
    expectedClassification: 'REJECTED'
  },
  
  {
    id: 'ambiguous-formation',
    title: 'Prestation de formation en gestion des marchés publics pour les agents comptables',
    description: 'Formation de 5 jours sur les procédures de passation des marchés publics, destinée à 25 agents comptables des ministères. Budget alloué: 12 000 000 FCFA.',
    source: 'fonction-publique.gov.bf',
    expectedClassification: 'REVIEW'
  },
  
  {
    id: 'ambiguous-etude',
    title: 'Étude de faisabilité pour l\'aménagement de la route Ouagadougou-Fada N\'Gourma',
    description: 'Mission d\'étude technique, environnementale et sociale pour l\'aménagement de 219 km de route. Durée de l\'étude: 4 mois.',
    source: 'infrastructures.gov.bf',
    expectedClassification: 'REVIEW'
  }
];

// Fonction de test principal
function runQuickTest() {
  console.log('🚀 TEST RAPIDE DU CLASSIFICATEUR ENRICHI');
  console.log('=' .repeat(80));
  
  let correct = 0;
  let total = 0;
  const results = [];
  
  testSamples.forEach((sample, index) => {
    console.log(`\n📋 Test ${index + 1}/${testSamples.length}: ${sample.id}`);
    console.log(`Titre: ${sample.title.substring(0, 70)}...`);
    console.log(`Source: ${sample.source}`);
    console.log(`Attendu: ${sample.expectedClassification}`);
    
    const result = classifyWithDiagnostic(sample.title, sample.description, sample.source);
    
    const isCorrect = result.classification === sample.expectedClassification;
    console.log(`Résultat: ${result.classification} (score: ${result.score}, confiance: ${Math.round(result.confidence * 100)}%) ${isCorrect ? '✅' : '❌'}`);
    
    // Diagnostic détaillé
    if (result.signals.exclusions.length > 0) {
      console.log(`  🚫 Exclusions: ${result.signals.exclusions.map(e => e.pattern).join(', ')}`);
    }
    
    if (result.signals.positive.length > 0) {
      console.log(`  ✅ Positifs: ${result.signals.positive.map(p => `${p.pattern}(+${p.points})`).join(', ')}`);
    }
    
    if (result.signals.negative.length > 0) {
      console.log(`  ⚠️ Négatifs: ${result.signals.negative.map(n => `${n.pattern}(-${n.points})`).join(', ')}`);
    }
    
    console.log(`  📊 Détail: source=${result.breakdown.sourceConfidence}, +${result.breakdown.positiveScore}, -${result.breakdown.negativeScore} → ${result.breakdown.finalScore.toFixed(2)}`);
    
    if (!isCorrect) {
      console.log(`  ❌ ERREUR: ${result.reasons.join('; ')}`);
    }
    
    results.push({ sample, result, isCorrect });
    if (isCorrect) correct++;
    total++;
  });
  
  // Résultats finaux
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS FINAUX');
  console.log('='.repeat(80));
  
  const accuracy = (correct / total * 100);
  console.log(`✅ Tests corrects: ${correct}/${total} (${accuracy.toFixed(1)}%)`);
  
  // Analyse par type
  const byExpected = {
    VALID: { correct: 0, total: 0 },
    REVIEW: { correct: 0, total: 0 },
    REJECTED: { correct: 0, total: 0 }
  };
  
  results.forEach(({ sample, isCorrect }) => {
    byExpected[sample.expectedClassification].total++;
    if (isCorrect) byExpected[sample.expectedClassification].correct++;
  });
  
  console.log('\n📈 Performance par type:');
  Object.entries(byExpected).forEach(([type, stats]) => {
    if (stats.total > 0) {
      const rate = (stats.correct / stats.total * 100).toFixed(1);
      console.log(`  ${type}: ${stats.correct}/${stats.total} (${rate}%)`);
    }
  });
  
  // Recommandations
  console.log('\n💡 ÉVALUATION:');
  if (accuracy === 100) {
    console.log('🎉 Parfait ! Le classificateur fonctionne parfaitement sur ces échantillons.');
    console.log('⚠️ Mais attention: ceci ne garantit PAS la performance sur de vraies données !');
  } else if (accuracy >= 80) {
    console.log('✅ Bon résultat, mais des améliorations sont possibles.');
  } else {
    console.log('⚠️ Performance insuffisante - ajustements nécessaires.');
  }
  
  console.log('\n🎯 PROCHAINES ÉTAPES RECOMMANDÉES:');
  console.log('1. Extraire 200+ contenus réels: node scripts/extract-real-data.js');
  console.log('2. Classifier manuellement dans le CSV généré');  
  console.log('3. Lancer le vrai benchmark: node scripts/run-real-benchmark.js');
  console.log('4. Analyser les erreurs et ajuster les seuils');
  console.log('5. Répéter jusqu\'à obtenir < 5% de pollution');
  
  return { accuracy, results, correct, total };
}

// Exécution
if (require.main === module) {
  runQuickTest();
}

module.exports = { runQuickTest, classifyWithDiagnostic };