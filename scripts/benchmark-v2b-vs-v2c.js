/**
 * Benchmark comparatif V2B vs V2C avec analyse détaillée des changements
 * Objectif: pollution < 5% en conservant recall proche de 100%
 */

const fs = require('fs').promises;
const path = require('path');

// Import V2B (version existante)
function classifyWithDiagnosticV2B(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    score: 0,
    confidence: 0,
    version: 'v2b-final'
  };

  // Exclusions critiques
  const criticalExclusions = ['soutenance', 'these', 'master', 'nomination', 'nomme', 'deces', 'ceremonie', 'inauguration'];
  for (const exclusion of criticalExclusions) {
    if (fullText.includes(exclusion)) {
      result.classification = 'REJECTED';
      result.score = 0;
      return result;
    }
  }

  // Sources
  let sourceConfidence = 0.2;
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (['sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 'equipement.gov.bf'].some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7;
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }

  // Indicateurs positifs
  const positiveIndicators = [
    { pattern: 'appel d\'offres', points: 3 }, { pattern: 'appel d offres', points: 3 },
    { pattern: 'demande de cotation', points: 3 }, { pattern: 'dao', points: 3 },
    { pattern: 'acquisition de', points: 2 }, { pattern: 'fourniture de', points: 2 },
    { pattern: 'prestation de', points: 2 }, { pattern: 'travaux de', points: 2 },
    { pattern: 'construction', points: 2 }, { pattern: 'acquisition', points: 2 },
    { pattern: 'travaux d\'', points: 2 }, { pattern: 'refection', points: 2 },
    { pattern: 'vehicules', points: 1 }, { pattern: 'materiel', points: 1 },
    { pattern: 'soumission', points: 1 }, { pattern: 'date limite', points: 1 }
  ];
  
  let positiveScore = 0;
  for (const indicator of positiveIndicators) {
    if (fullText.includes(indicator.pattern)) {
      positiveScore += indicator.points;
    }
  }

  // Indicateurs négatifs
  const negativeIndicators = [
    { pattern: 'recrutement', points: 1.5 }, { pattern: 'poste vacant', points: 3 },
    { pattern: 'candidat', points: 2 }, { pattern: 'formation', points: 2 },
    { pattern: 'seminaire', points: 2 }, { pattern: 'atelier', points: 2 },
    { pattern: 'actualite', points: 2 }, { pattern: 'information', points: 1 },
    { pattern: 'etude de faisabilite', points: 1 }
  ];
  
  let negativeScore = 0;
  for (const indicator of negativeIndicators) {
    if (fullText.includes(indicator.pattern)) {
      negativeScore += indicator.points;
    }
  }

  // Règles contextuelles V2B
  let contextualAdjustment = 0;
  
  if (fullText.includes('avis de recrutement') && 
      (fullText.includes('gardiennage') || fullText.includes('securite') || fullText.includes('nettoyage'))) {
    contextualAdjustment += 2;
  }
  
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
  }
  
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
  }

  // Score final V2B
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6) + contextualAdjustment;
  result.score = Math.round(finalScore * 100) / 100;
  
  // Seuils V2B
  if (finalScore >= 1.2) {
    result.classification = 'VALID';
  } else if (finalScore <= -0.1) {
    result.classification = 'REJECTED';
  } else {
    result.classification = 'REVIEW';
  }
  
  return result;
}

// Import V2C (version avec analyse d'intention)
function classifyWithIntentAnalysisV2C(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    score: 0,
    confidence: 0,
    intentAnalysis: {
      primaryIntent: null,
      recruitmentSignals: 0,
      marketSignals: 0,
      isAmbiguous: false
    },
    version: 'v2c-intent'
  };

  // Exclusions critiques (identique)
  const criticalExclusions = ['soutenance', 'these', 'master', 'nomination', 'nomme', 'deces', 'ceremonie', 'inauguration'];
  for (const exclusion of criticalExclusions) {
    if (fullText.includes(exclusion)) {
      result.classification = 'REJECTED';
      result.score = 0;
      return result;
    }
  }

  // NOUVEAUTÉ V2C: Analyse d'intention
  const recruitmentTerms = [
    { term: 'avis de recrutement', weight: 4 }, { term: 'recrutement', weight: 3 },
    { term: 'candidature', weight: 3 }, { term: 'poste vacant', weight: 4 },
    { term: 'emploi', weight: 3 }, { term: 'agent', weight: 2 },
    { term: 'candidat', weight: 2 }, { term: 'personnel', weight: 2 },
    { term: 'poste', weight: 2 }, { term: 'cv', weight: 1 }
  ];
  
  const marketTerms = [
    { term: 'appel d\'offres', weight: 4 }, { term: 'appel d offres', weight: 4 },
    { term: 'demande de cotation', weight: 4 }, { term: 'dao', weight: 3 },
    { term: 'soumission', weight: 3 }, { term: 'marche public', weight: 4 },
    { term: 'fourniture', weight: 2 }, { term: 'acquisition', weight: 2 },
    { term: 'travaux', weight: 2 }, { term: 'prestation', weight: 2 },
    { term: 'lot', weight: 2 }, { term: 'quantite', weight: 2 }
  ];
  
  let recruitmentScore = 0;
  let marketScore = 0;
  
  recruitmentTerms.forEach(item => {
    if (fullText.includes(item.term)) {
      recruitmentScore += item.weight;
    }
  });
  
  marketTerms.forEach(item => {
    if (fullText.includes(item.term)) {
      marketScore += item.weight;
    }
  });
  
  result.intentAnalysis.recruitmentSignals = recruitmentScore;
  result.intentAnalysis.marketSignals = marketScore;
  
  // Détection d'ambiguïté
  const ambiguityThreshold = 3;
  if (recruitmentScore >= ambiguityThreshold && marketScore >= ambiguityThreshold) {
    result.intentAnalysis.isAmbiguous = true;
    result.intentAnalysis.primaryIntent = 'AMBIGUOUS';
  } else if (marketScore > recruitmentScore) {
    result.intentAnalysis.primaryIntent = 'MARKET';
  } else if (recruitmentScore > marketScore) {
    result.intentAnalysis.primaryIntent = 'RECRUITMENT';
  } else {
    result.intentAnalysis.primaryIntent = 'UNCLEAR';
  }

  // Sources (identique V2B)
  let sourceConfidence = 0.2;
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (['sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 'equipement.gov.bf'].some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7;
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }

  // Indicateurs positifs (identique V2B)
  const positiveIndicators = [
    { pattern: 'appel d\'offres', points: 3 }, { pattern: 'appel d offres', points: 3 },
    { pattern: 'demande de cotation', points: 3 }, { pattern: 'dao', points: 3 },
    { pattern: 'acquisition de', points: 2 }, { pattern: 'fourniture de', points: 2 },
    { pattern: 'prestation de', points: 2 }, { pattern: 'travaux de', points: 2 },
    { pattern: 'construction', points: 2 }, { pattern: 'acquisition', points: 2 },
    { pattern: 'travaux d\'', points: 2 }, { pattern: 'refection', points: 2 },
    { pattern: 'vehicules', points: 1 }, { pattern: 'materiel', points: 1 },
    { pattern: 'soumission', points: 1 }, { pattern: 'date limite', points: 1 }
  ];
  
  let positiveScore = 0;
  for (const indicator of positiveIndicators) {
    if (fullText.includes(indicator.pattern)) {
      positiveScore += indicator.points;
    }
  }

  // Indicateurs négatifs (identique V2B)
  const negativeIndicators = [
    { pattern: 'recrutement', points: 1.5 }, { pattern: 'poste vacant', points: 3 },
    { pattern: 'candidat', points: 2 }, { pattern: 'formation', points: 2 },
    { pattern: 'seminaire', points: 2 }, { pattern: 'atelier', points: 2 },
    { pattern: 'actualite', points: 2 }, { pattern: 'information', points: 1 },
    { pattern: 'etude de faisabilite', points: 1 }
  ];
  
  let negativeScore = 0;
  for (const indicator of negativeIndicators) {
    if (fullText.includes(indicator.pattern)) {
      negativeScore += indicator.points;
    }
  }

  // Règles contextuelles V2B
  let contextualAdjustment = 0;
  
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
  }
  
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
  }

  // NOUVEAUTÉ V2C: Ajustements d'intention
  let intentAdjustment = 0;
  
  if (result.intentAnalysis.isAmbiguous) {
    if (marketScore >= 8) {
      intentAdjustment += 0.5;
    } else {
      intentAdjustment -= 0.3;
    }
  } else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && marketScore > 0) {
    intentAdjustment -= 1;
  } else if (result.intentAnalysis.primaryIntent === 'MARKET' && recruitmentScore <= 2) {
    intentAdjustment += 0.2;
  }

  // Score final V2C
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6) + contextualAdjustment + intentAdjustment;
  result.score = Math.round(finalScore * 100) / 100;
  
  // Logique de décision V2C avec gestion d'ambiguïté
  if (result.intentAnalysis.isAmbiguous && finalScore < 2.0) {
    result.classification = 'REVIEW';
  } else if (finalScore >= 1.3) {  // Seuil légèrement plus strict
    result.classification = 'VALID';
  } else if (finalScore <= -0.1) {
    result.classification = 'REJECTED';
  } else {
    result.classification = 'REVIEW';
  }
  
  return result;
}

function calculateMetrics(results, version) {
  const metrics = {
    version,
    total: results.length,
    correct: 0,
    accuracy: 0,
    precision: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    recall: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    f1Score: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    pollution: {
      displayedNonMarkets: 0,
      totalDisplayed: 0,
      pollutionRate: 0
    },
    distribution: {
      human: { VALID: 0, REVIEW: 0, REJECTED: 0 },
      machine: { VALID: 0, REVIEW: 0, REJECTED: 0 }
    },
    confusionMatrix: {}
  };
  
  // Initialiser la matrice de confusion
  ['VALID', 'REVIEW', 'REJECTED'].forEach(h => {
    ['VALID', 'REVIEW', 'REJECTED'].forEach(m => {
      metrics.confusionMatrix[`${h}→${m}`] = 0;
    });
  });
  
  results.forEach(result => {
    const human = result.human;
    const machine = result.machine;
    
    if (human && machine) {
      metrics.distribution.human[human]++;
      metrics.distribution.machine[machine]++;
      
      if (human === machine) metrics.correct++;
      
      metrics.confusionMatrix[`${human}→${machine}`]++;
      
      // Pollution: contenus affichés qui ne devraient pas l'être
      if (machine === 'VALID' || machine === 'REVIEW') {
        metrics.pollution.totalDisplayed++;
        if (human === 'REJECTED') {
          metrics.pollution.displayedNonMarkets++;
        }
      }
    }
  });
  
  metrics.accuracy = metrics.total > 0 ? (metrics.correct / metrics.total) * 100 : 0;
  
  // Précision/Rappel par classe
  ['VALID', 'REVIEW', 'REJECTED'].forEach(cls => {
    const tp = metrics.confusionMatrix[`${cls}→${cls}`] || 0;
    const predicted = Object.keys(metrics.confusionMatrix)
      .filter(key => key.endsWith(`→${cls}`))
      .reduce((sum, key) => sum + metrics.confusionMatrix[key], 0);
    const actual = Object.keys(metrics.confusionMatrix)
      .filter(key => key.startsWith(`${cls}→`))
      .reduce((sum, key) => sum + metrics.confusionMatrix[key], 0);
    
    metrics.precision[cls] = predicted > 0 ? (tp / predicted) * 100 : 0;
    metrics.recall[cls] = actual > 0 ? (tp / actual) * 100 : 0;
    
    const p = metrics.precision[cls];
    const r = metrics.recall[cls];
    metrics.f1Score[cls] = (p + r) > 0 ? (2 * p * r) / (p + r) : 0;
  });
  
  metrics.pollution.pollutionRate = metrics.pollution.totalDisplayed > 0 ? 
    (metrics.pollution.displayedNonMarkets / metrics.pollution.totalDisplayed) * 100 : 0;
  
  return metrics;
}

async function runV2BvsV2CBenchmark() {
  console.log('🎯 BENCHMARK COMPARATIF V2B vs V2C - ANALYSE D\'INTENTION');
  console.log('=' .repeat(80));
  
  try {
    // Charger données
    const samplesPath = path.join(process.cwd(), 'data', 'real-data-samples.json');
    const csvPath = path.join(process.cwd(), 'data', 'real-data-samples.csv');
    
    const samplesContent = await fs.readFile(samplesPath, 'utf8');
    const samples = JSON.parse(samplesContent);
    
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.split('\n').slice(1);
    
    const references = new Map();
    for (const line of lines) {
      if (!line.trim()) continue;
      const matches = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
      if (matches && ['VALID', 'REVIEW', 'REJECTED'].includes(matches[4].toUpperCase())) {
        references.set(matches[1], matches[4].toUpperCase());
      }
    }
    
    console.log(`✅ ${samples.length} échantillons, ${references.size} références chargées`);
    
    // Test V2B et V2C
    const resultsV2B = [];
    const resultsV2C = [];
    const changedDecisions = [];
    
    console.log('\n🔄 Exécution des benchmarks...');
    
    for (const sample of samples) {
      const humanRef = references.get(sample.id);
      if (!humanRef) continue;
      
      // Test V2B
      const v2bResult = classifyWithDiagnosticV2B(sample.title, sample.description, sample.source);
      resultsV2B.push({
        id: sample.id,
        title: sample.title,
        human: humanRef,
        machine: v2bResult.classification,
        score: v2bResult.score
      });
      
      // Test V2C
      const v2cResult = classifyWithIntentAnalysisV2C(sample.title, sample.description, sample.source);
      resultsV2C.push({
        id: sample.id,
        title: sample.title,
        human: humanRef,
        machine: v2cResult.classification,
        score: v2cResult.score,
        intentAnalysis: v2cResult.intentAnalysis
      });
      
      // Détecter les changements
      if (v2bResult.classification !== v2cResult.classification) {
        changedDecisions.push({
          id: sample.id,
          title: sample.title.substring(0, 70) + '...',
          human: humanRef,
          v2b: v2bResult.classification,
          v2c: v2cResult.classification,
          v2bScore: v2bResult.score,
          v2cScore: v2cResult.score,
          intentAnalysis: v2cResult.intentAnalysis
        });
      }
    }
    
    // Calcul des métriques
    const metricsV2B = calculateMetrics(resultsV2B, 'V2B');
    const metricsV2C = calculateMetrics(resultsV2C, 'V2C');
    
    // Affichage comparatif
    console.log('\n📊 COMPARAISON V2B vs V2C');
    console.log('=' .repeat(80));
    
    console.log(`${'Métrique'.padEnd(25)} ${'V2B'.padEnd(12)} ${'V2C'.padEnd(12)} ${'ÉVOLUTION'.padEnd(15)}`);
    console.log('-'.repeat(70));
    
    const comparisons = [
      ['Exactitude (%)', metricsV2B.accuracy, metricsV2C.accuracy],
      ['Précision VALID (%)', metricsV2B.precision.VALID, metricsV2C.precision.VALID],
      ['Rappel VALID (%)', metricsV2B.recall.VALID, metricsV2C.recall.VALID],
      ['F1-Score VALID (%)', metricsV2B.f1Score.VALID, metricsV2C.f1Score.VALID],
      ['Pollution (%)', metricsV2B.pollution.pollutionRate, metricsV2C.pollution.pollutionRate],
      ['Faux positifs', metricsV2B.pollution.displayedNonMarkets, metricsV2C.pollution.displayedNonMarkets]
    ];
    
    comparisons.forEach(([metric, v2b, v2c]) => {
      const evolution = v2c - v2b;
      const evolutionStr = evolution > 0 ? `+${evolution.toFixed(1)}` : evolution.toFixed(1);
      const evolutionIcon = evolution > 0 ? (metric.includes('Pollution') || metric.includes('Faux') ? '📈❌' : '📈✅') : 
                           evolution < 0 ? (metric.includes('Pollution') || metric.includes('Faux') ? '📉✅' : '📉❌') : '➡️';
      
      console.log(`${metric.padEnd(25)} ${v2b.toFixed(1).padEnd(10)} ${v2c.toFixed(1).padEnd(10)} ${evolutionIcon} ${evolutionStr.padEnd(8)}`);
    });
    
    // Analyse des changements de décision
    console.log(`\n🔄 CHANGEMENTS DE DÉCISION (${changedDecisions.length})`);
    console.log('=' .repeat(80));
    
    if (changedDecisions.length > 0) {
      // Grouper par type de changement
      const changeGroups = {
        validToReview: [],
        reviewToValid: [],
        validToRejected: [],
        rejectedToValid: [],
        other: []
      };
      
      changedDecisions.forEach(change => {
        if (change.v2b === 'VALID' && change.v2c === 'REVIEW') {
          changeGroups.validToReview.push(change);
        } else if (change.v2b === 'REVIEW' && change.v2c === 'VALID') {
          changeGroups.reviewToValid.push(change);
        } else if (change.v2b === 'VALID' && change.v2c === 'REJECTED') {
          changeGroups.validToRejected.push(change);
        } else if (change.v2b === 'REJECTED' && change.v2c === 'VALID') {
          changeGroups.rejectedToValid.push(change);
        } else {
          changeGroups.other.push(change);
        }
      });
      
      // Afficher VALID → REVIEW (réduction pollution)
      if (changeGroups.validToReview.length > 0) {
        console.log(`\n✅ VALID → REVIEW (${changeGroups.validToReview.length}) - Réduction pollution:`);
        changeGroups.validToReview.slice(0, 5).forEach(change => {
          const isCorrect = change.human === 'REVIEW';
          console.log(`${isCorrect ? '✅' : '❌'} ${change.title}`);
          console.log(`   Humain: ${change.human}, V2B: ${change.v2b} → V2C: ${change.v2c}`);
          console.log(`   Intent: ${change.intentAnalysis.primaryIntent} (R:${change.intentAnalysis.recruitmentSignals}, M:${change.intentAnalysis.marketSignals})`);
          if (change.intentAnalysis.isAmbiguous) {
            console.log(`   🎯 Ambiguïté détectée → REVIEW forcé`);
          }
        });
      }
      
      // Afficher REVIEW → VALID (potentielle dégradation)
      if (changeGroups.reviewToValid.length > 0) {
        console.log(`\n⚠️ REVIEW → VALID (${changeGroups.reviewToValid.length}) - Attention à la pollution:`);
        changeGroups.reviewToValid.slice(0, 3).forEach(change => {
          const isCorrect = change.human === 'VALID';
          console.log(`${isCorrect ? '✅' : '❌'} ${change.title}`);
          console.log(`   Humain: ${change.human}, V2B: ${change.v2b} → V2C: ${change.v2c}`);
        });
      }
      
      // Vérifier si des vrais marchés passent en REJECTED (critique)
      if (changeGroups.validToRejected.length > 0) {
        console.log(`\n🚨 VALID → REJECTED (${changeGroups.validToRejected.length}) - CRITIQUE:`);
        changeGroups.validToRejected.forEach(change => {
          console.log(`❌ ${change.title}`);
          console.log(`   Humain: ${change.human} - PERTE DE MARCHÉ !`);
        });
      }
      
    } else {
      console.log('Aucun changement de décision détecté.');
    }
    
    // Évaluation des objectifs
    console.log('\n🎯 ÉVALUATION DES OBJECTIFS');
    console.log('=' .repeat(50));
    
    const pollutionObjective = metricsV2C.pollution.pollutionRate <= 5.0;
    const recallObjective = metricsV2C.recall.VALID >= 95.0;
    const accuracyObjective = metricsV2C.accuracy >= 75.0;
    
    console.log(`Pollution < 5%:        ${pollutionObjective ? '✅' : '❌'} ${metricsV2C.pollution.pollutionRate.toFixed(1)}%`);
    console.log(`Recall VALID ≥ 95%:    ${recallObjective ? '✅' : '❌'} ${metricsV2C.recall.VALID.toFixed(1)}%`);
    console.log(`Exactitude ≥ 75%:      ${accuracyObjective ? '✅' : '❌'} ${metricsV2C.accuracy.toFixed(1)}%`);
    
    const overallSuccess = pollutionObjective && recallObjective && accuracyObjective;
    
    console.log('\n🏁 CONCLUSION');
    console.log('-'.repeat(30));
    
    if (overallSuccess) {
      console.log('🎉 OBJECTIFS ATTEINTS !');
      console.log('   V2C améliore significativement V2B');
      console.log('   ✅ Pollution réduite sous 5%');
      console.log('   ✅ Recall élevé maintenu');
      console.log('   ✅ Exactitude satisfaisante');
      console.log('\n🚀 RECOMMANDATION: Déployer V2C en production');
    } else {
      console.log('⚠️ Objectifs partiellement atteints');
      
      if (!pollutionObjective) {
        console.log(`   🔴 Pollution encore trop élevée: ${metricsV2C.pollution.pollutionRate.toFixed(1)}%`);
        console.log('   💡 Analyser les 5 principales sources de pollution');
      }
      
      if (!recallObjective) {
        console.log(`   🔴 Rappel VALID dégradé: ${metricsV2C.recall.VALID.toFixed(1)}%`);
        console.log('   💡 Revoir les seuils ou règles d\'intention');
      }
      
      if (!accuracyObjective) {
        console.log(`   🔴 Exactitude insuffisante: ${metricsV2C.accuracy.toFixed(1)}%`);
        console.log('   💡 Équilibrer les corrections');
      }
      
      console.log('\n🔧 RECOMMANDATION: Ajuster V2C avant déploiement');
    }
    
    // Sauvegarde des résultats
    const comparisonResults = {
      timestamp: new Date().toISOString(),
      metricsV2B,
      metricsV2C,
      changedDecisions,
      overallSuccess,
      objectives: { pollutionObjective, recallObjective, accuracyObjective }
    };
    
    const outputPath = path.join(process.cwd(), 'data', 'v2b-vs-v2c-comparison.json');
    await fs.writeFile(outputPath, JSON.stringify(comparisonResults, null, 2));
    console.log(`\n💾 Résultats détaillés: ${outputPath}`);
    
    return comparisonResults;
    
  } catch (error) {
    console.error('❌ Erreur lors du benchmark:', error);
    throw error;
  }
}

// Exécution
if (require.main === module) {
  runV2BvsV2CBenchmark().catch(console.error);
}

module.exports = { runV2BvsV2CBenchmark };