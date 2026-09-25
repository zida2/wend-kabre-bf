/**
 * Benchmark comparatif AVANT/APRÈS améliorations
 * Mesure l'impact des corrections sur les métriques clés
 */

const { classifyWithDiagnostic } = require('./quick-test.js'); // Version originale
const fs = require('fs').promises;
const path = require('path');

// Import de la version améliorée (simulée pour Node.js)
function classifyWithDiagnosticImproved(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    confidence: 0,
    score: 0,
    signals: { positive: [], negative: [], exclusions: [], contextual: [] },
    reasons: [],
    breakdown: { sourceConfidence: 0, positiveScore: 0, negativeScore: 0, contextualAdjustment: 0, finalScore: 0 },
    metadata: { title: title?.substring(0, 100) + '...', source, version: 'improved-v1' }
  };

  // Exclusions critiques (identiques)
  const criticalExclusions = [
    { pattern: 'soutenance', category: 'académique' },
    { pattern: 'these', category: 'académique' },
    { pattern: 'master', category: 'académique' },
    { pattern: 'nomination', category: 'administratif' },
    { pattern: 'nomme', category: 'administratif' },
    { pattern: 'deces', category: 'personnel' },
    { pattern: 'ceremonie', category: 'événement' }
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

  // AMÉLIORATION: Sources .gov.bf mieux évaluées
  let sourceConfidence = 0.2;
  const governmentSources = [
    'sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 
    'equipement.gov.bf', 'finances.gov.bf'
  ];
  
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (governmentSources.some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7; // AMÉLIORATION: .gov.bf = 0.7 au lieu de 0.2
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }
  
  result.breakdown.sourceConfidence = sourceConfidence;

  // AMÉLIORATION: Indicateurs positifs enrichis
  const positiveIndicators = [
    { pattern: 'appel d\'offres', points: 3, strength: 'fort' },
    { pattern: 'appel d offres', points: 3, strength: 'fort' },
    { pattern: 'demande de cotation', points: 3, strength: 'fort' },
    { pattern: 'dao', points: 3, strength: 'fort' },
    { pattern: 'acquisition de', points: 2, strength: 'moyen' },
    { pattern: 'fourniture de', points: 2, strength: 'moyen' },
    { pattern: 'prestation de', points: 2, strength: 'moyen' },
    { pattern: 'travaux de', points: 2, strength: 'moyen' },
    { pattern: 'construction', points: 2, strength: 'moyen' },
    // NOUVEAUX INDICATEURS
    { pattern: 'acquisition', points: 2, strength: 'moyen' }, // Sans "de"
    { pattern: 'travaux d\'', points: 2, strength: 'moyen' }, // Variante
    { pattern: 'refection', points: 2, strength: 'moyen' }, // BTP
    { pattern: 'vehicules', points: 1, strength: 'faible' },
    { pattern: 'materiel', points: 1, strength: 'faible' },
    { pattern: 'soumission', points: 1, strength: 'faible' },
    { pattern: 'date limite', points: 1, strength: 'faible' }
  ];
  
  let positiveScore = 0;
  for (const indicator of positiveIndicators) {
    if (fullText.includes(indicator.pattern)) {
      positiveScore += indicator.points;
      result.signals.positive.push(indicator);
    }
  }
  result.breakdown.positiveScore = positiveScore;

  // AMÉLIORATION: Indicateurs négatifs renforcés
  const negativeIndicators = [
    // NOUVEAUX: Recrutement comme négatif fort
    { pattern: 'recrutement', points: 3, category: 'emploi' },
    { pattern: 'avis de recrutement', points: 2, category: 'emploi' },
    { pattern: 'poste vacant', points: 3, category: 'emploi' },
    { pattern: 'candidat', points: 2, category: 'emploi' },
    // Existants
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

  // NOUVEAUTÉ: Règles contextuelles
  let contextualAdjustment = 0;
  
  // Règle 1: prestation + recrutement = négatif
  if (fullText.includes('prestation') && fullText.includes('recrutement')) {
    contextualAdjustment -= 2;
    result.signals.contextual.push({ rule: 'prestation_recrutement', adjustment: -2 });
  }
  
  // Règle 2: acquisition + équipement = positif
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'acquisition_equipement', adjustment: 1 });
  }
  
  // Règle 3: travaux + BTP = positif
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'travaux_btp', adjustment: 1 });
  }
  
  result.breakdown.contextualAdjustment = contextualAdjustment;

  // Score final avec ajustements contextuels
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6) + contextualAdjustment;
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100;
  
  // AMÉLIORATION: Seuils ajustés
  const ACCEPT_THRESHOLD = 1.3;   // Baissé de 1.5
  const REJECT_THRESHOLD = -0.3;  // Relevé de -0.5
  
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

async function loadSamplesAndReferences() {
  const samplesPath = path.join(process.cwd(), 'data', 'real-data-samples.json');
  const csvPath = path.join(process.cwd(), 'data', 'real-data-samples.csv');
  
  // Charger échantillons
  const samplesContent = await fs.readFile(samplesPath, 'utf8');
  const samples = JSON.parse(samplesContent);
  
  // Charger références humaines
  const csvContent = await fs.readFile(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  const references = new Map();
  for (const line of lines) {
    if (!line.trim()) continue;
    const matches = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
    if (matches && ['VALID', 'REVIEW', 'REJECTED'].includes(matches[4].toUpperCase())) {
      references.set(matches[1], matches[4].toUpperCase());
    }
  }
  
  return { samples, references };
}

function calculateMetrics(results) {
  const metrics = {
    total: results.length,
    correct: 0,
    accuracy: 0,
    precision: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    recall: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    f1Score: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    confusionMatrix: {},
    pollution: {
      displayedNonMarkets: 0,
      totalDisplayed: 0,
      pollutionRate: 0,
      criticalErrors: 0
    },
    distribution: {
      human: { VALID: 0, REVIEW: 0, REJECTED: 0 },
      machine: { VALID: 0, REVIEW: 0, REJECTED: 0 }
    }
  };
  
  // Initialiser la matrice de confusion
  ['VALID', 'REVIEW', 'REJECTED'].forEach(h => {
    ['VALID', 'REVIEW', 'REJECTED'].forEach(m => {
      metrics.confusionMatrix[`${h}→${m}`] = 0;
    });
  });
  
  // Calculer les métriques
  results.forEach(result => {
    const human = result.human;
    const machine = result.machine;
    
    if (human && machine) {
      metrics.distribution.human[human]++;
      metrics.distribution.machine[machine]++;
      
      if (human === machine) metrics.correct++;
      
      metrics.confusionMatrix[`${human}→${machine}`]++;
      
      // Métrique de pollution
      if (machine === 'VALID' || machine === 'REVIEW') {
        metrics.pollution.totalDisplayed++;
        if (human === 'REJECTED') {
          metrics.pollution.displayedNonMarkets++;
        }
      }
    }
  });
  
  metrics.accuracy = metrics.total > 0 ? (metrics.correct / metrics.total) * 100 : 0;
  
  // Calcul précision/rappel par classe
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

async function runComparativeBenchmark() {
  console.log('🔬 BENCHMARK COMPARATIF AVANT/APRÈS AMÉLIORATIONS');
  console.log('=' .repeat(80));
  
  try {
    // Charger les données
    const { samples, references } = await loadSamplesAndReferences();
    console.log(`✅ ${samples.length} échantillons, ${references.size} références chargées`);
    
    const resultsOriginal = [];
    const resultsImproved = [];
    
    // Tester les deux versions
    console.log('\n🔄 Exécution des tests...');
    
    for (const sample of samples) {
      const humanRef = references.get(sample.id);
      if (!humanRef) continue;
      
      // Version originale
      const originalResult = classifyWithDiagnostic(sample.title, sample.description, sample.source);
      resultsOriginal.push({
        id: sample.id,
        title: sample.title,
        human: humanRef,
        machine: originalResult.classification,
        score: originalResult.score,
        confidence: originalResult.confidence
      });
      
      // Version améliorée
      const improvedResult = classifyWithDiagnosticImproved(sample.title, sample.description, sample.source);
      resultsImproved.push({
        id: sample.id,
        title: sample.title,
        human: humanRef,
        machine: improvedResult.classification,
        score: improvedResult.score,
        confidence: improvedResult.confidence,
        contextual: improvedResult.signals.contextual
      });
    }
    
    // Calculer les métriques
    const metricsOriginal = calculateMetrics(resultsOriginal);
    const metricsImproved = calculateMetrics(resultsImproved);
    
    // Afficher le rapport comparatif
    console.log('\n📊 RÉSULTATS COMPARATIFS');
    console.log('=' .repeat(80));
    
    console.log(`${'Métrique'.padEnd(25)} ${'AVANT'.padEnd(12)} ${'APRÈS'.padEnd(12)} ${'ÉVOLUTION'.padEnd(12)}`);
    console.log('-'.repeat(65));
    
    const comparisons = [
      ['Exactitude (Accuracy)', metricsOriginal.accuracy, metricsImproved.accuracy],
      ['Précision VALID', metricsOriginal.precision.VALID, metricsImproved.precision.VALID],
      ['Rappel VALID', metricsOriginal.recall.VALID, metricsImproved.recall.VALID],
      ['F1-Score VALID', metricsOriginal.f1Score.VALID, metricsImproved.f1Score.VALID],
      ['Pollution (%)', metricsOriginal.pollution.pollutionRate, metricsImproved.pollution.pollutionRate],
      ['Précision REJECTED', metricsOriginal.precision.REJECTED, metricsImproved.precision.REJECTED]
    ];
    
    comparisons.forEach(([metric, before, after]) => {
      const evolution = after - before;
      const evolutionStr = evolution > 0 ? `+${evolution.toFixed(1)}` : evolution.toFixed(1);
      const evolutionColor = evolution > 0 ? '📈' : evolution < 0 ? '📉' : '➡️';
      
      console.log(`${metric.padEnd(25)} ${before.toFixed(1).padEnd(10)}% ${after.toFixed(1).padEnd(10)}% ${evolutionColor} ${evolutionStr.padEnd(8)} pts`);
    });
    
    // Analyse des améliorations spécifiques
    console.log('\n🎯 ANALYSE DES AMÉLIORATIONS SPÉCIFIQUES');
    console.log('=' .repeat(80));
    
    // Cas corrigés
    const fixedCases = [];
    const newErrors = [];
    
    for (let i = 0; i < resultsOriginal.length; i++) {
      const orig = resultsOriginal[i];
      const impr = resultsImproved[i];
      
      if (orig.human !== orig.machine && impr.human === impr.machine) {
        fixedCases.push({ ...impr, originalMachine: orig.machine });
      } else if (orig.human === orig.machine && impr.human !== impr.machine) {
        newErrors.push({ ...impr, originalMachine: orig.machine });
      }
    }
    
    if (fixedCases.length > 0) {
      console.log(`\n✅ CAS CORRIGÉS (${fixedCases.length}):`);
      fixedCases.slice(0, 5).forEach((cas, index) => {
        console.log(`${index + 1}. "${cas.title.substring(0, 60)}..."`);
        console.log(`   ${cas.originalMachine} → ${cas.machine} (attendu: ${cas.human}) ✅`);
        if (cas.contextual && cas.contextual.length > 0) {
          console.log(`   Règles contextuelles: ${cas.contextual.map(c => c.rule).join(', ')}`);
        }
      });
    }
    
    if (newErrors.length > 0) {
      console.log(`\n❌ NOUVEAUX PROBLÈMES (${newErrors.length}):`);
      newErrors.slice(0, 3).forEach((cas, index) => {
        console.log(`${index + 1}. "${cas.title.substring(0, 60)}..."`);
        console.log(`   ${cas.originalMachine} → ${cas.machine} (attendu: ${cas.human}) ❌`);
      });
    }
    
    // Évaluation finale
    console.log('\n🏁 ÉVALUATION FINALE');
    console.log('=' .repeat(80));
    
    const pollutionImproved = metricsImproved.pollution.pollutionRate < metricsOriginal.pollution.pollutionRate;
    const accuracyImproved = metricsImproved.accuracy > metricsOriginal.accuracy;
    const recallImproved = metricsImproved.recall.VALID > metricsOriginal.recall.VALID;
    
    console.log(`Pollution réduite: ${pollutionImproved ? '✅' : '❌'} (${metricsImproved.pollution.pollutionRate.toFixed(1)}% vs ${metricsOriginal.pollution.pollutionRate.toFixed(1)}%)`);
    console.log(`Exactitude améliorée: ${accuracyImproved ? '✅' : '❌'} (${metricsImproved.accuracy.toFixed(1)}% vs ${metricsOriginal.accuracy.toFixed(1)}%)`);
    console.log(`Rappel VALID amélioré: ${recallImproved ? '✅' : '❌'} (${metricsImproved.recall.VALID.toFixed(1)}% vs ${metricsOriginal.recall.VALID.toFixed(1)}%)`);
    
    const overallSuccess = pollutionImproved && accuracyImproved && recallImproved;
    
    if (overallSuccess) {
      console.log('\n🎉 AMÉLIORATIONS RÉUSSIES !');
      console.log('   Les corrections ont un impact positif mesurable.');
      
      if (metricsImproved.pollution.pollutionRate <= 5.0) {
        console.log('   🎯 OBJECTIF ATTEINT: Pollution ≤ 5%');
      } else {
        console.log(`   ⚠️ Pollution encore élevée: ${metricsImproved.pollution.pollutionRate.toFixed(1)}% (objectif ≤ 5%)`);
      }
    } else {
      console.log('\n⚠️ AMÉLIORATIONS PARTIELLES');
      console.log('   Certaines métriques se sont dégradées. Ajustements nécessaires.');
    }
    
    // Sauvegarde des résultats
    const comparisonResults = {
      timestamp: new Date().toISOString(),
      original: metricsOriginal,
      improved: metricsImproved,
      fixedCases,
      newErrors,
      overallSuccess
    };
    
    const outputPath = path.join(process.cwd(), 'data', 'benchmark-comparison.json');
    await fs.writeFile(outputPath, JSON.stringify(comparisonResults, null, 2));
    console.log(`\n💾 Résultats sauvegardés: ${outputPath}`);
    
    return comparisonResults;
    
  } catch (error) {
    console.error('❌ Erreur lors du benchmark comparatif:', error);
    throw error;
  }
}

// Exécution
if (require.main === module) {
  runComparativeBenchmark().catch(console.error);
}

module.exports = { runComparativeBenchmark };