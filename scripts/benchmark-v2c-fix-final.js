/**
 * Version finale V2C-FIX avec gestion intelligente des recrutements de prestataires
 * Objectif: pollution < 5%, recall 100%, gardiennage → REVIEW
 */

const fs = require('fs').promises;
const path = require('path');

function classifyWithIntentAnalysisV2CFix(title, description, source) {
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
      recruitmentType: 'DIRECT', // NOUVEAU
      isAmbiguous: false
    },
    version: 'v2c-fix'
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

  // Analyse des signaux d'intention
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
    { term: 'lot', weight: 2 }, { term: 'quantite', weight: 2 },
    { term: 'service', weight: 1 }, { term: 'contrat', weight: 1 }
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

  // NOUVEAUTÉ V2C-FIX: Détection du type de recrutement
  if (fullText.includes('prestation') || fullText.includes('service') || 
      fullText.includes('gardiennage') || fullText.includes('securite') ||
      fullText.includes('nettoyage') || fullText.includes('maintenance')) {
    result.intentAnalysis.recruitmentType = 'SERVICE_OUTSOURCING';
  } else if (fullText.includes('agent') || fullText.includes('personnel') || 
             fullText.includes('emploi') || fullText.includes('poste vacant')) {
    result.intentAnalysis.recruitmentType = 'DIRECT';
  } else {
    result.intentAnalysis.recruitmentType = 'UNCLEAR';
  }

  // Logique d'intention V2C-FIX
  const ambiguityThreshold = 3;
  
  if (recruitmentScore >= ambiguityThreshold && marketScore >= ambiguityThreshold) {
    result.intentAnalysis.isAmbiguous = true;
    
    // AMÉLIORATION: Distinction fine selon le type
    if (result.intentAnalysis.recruitmentType === 'SERVICE_OUTSOURCING') {
      result.intentAnalysis.primaryIntent = 'SERVICE_OUTSOURCING';
    } else {
      result.intentAnalysis.primaryIntent = 'AMBIGUOUS';
    }
    
  } else if (marketScore > recruitmentScore) {
    result.intentAnalysis.primaryIntent = 'MARKET';
  } else if (recruitmentScore > marketScore) {
    
    // AMÉLIORATION: Nuancer selon le type de recrutement
    if (result.intentAnalysis.recruitmentType === 'SERVICE_OUTSOURCING') {
      result.intentAnalysis.primaryIntent = 'SERVICE_OUTSOURCING';
    } else {
      result.intentAnalysis.primaryIntent = 'RECRUITMENT';
    }
    
  } else {
    result.intentAnalysis.primaryIntent = 'UNCLEAR';
  }

  // Calcul du score (simplifié mais reprenant V2B)
  let sourceConfidence = 0.2;
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (['sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 'equipement.gov.bf'].some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7;
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }

  // Indicateurs positifs standards
  const positivePatterns = [
    'appel d\'offres', 'appel d offres', 'demande de cotation', 'dao',
    'acquisition de', 'fourniture de', 'prestation de', 'travaux de',
    'construction', 'acquisition', 'travaux d\'', 'refection',
    'vehicules', 'materiel', 'soumission', 'date limite'
  ];
  const positivePoints = [3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1];
  
  let positiveScore = 0;
  positivePatterns.forEach((pattern, index) => {
    if (fullText.includes(pattern)) {
      positiveScore += positivePoints[index];
    }
  });

  // Indicateurs négatifs standards
  const negativePatterns = ['recrutement', 'poste vacant', 'candidat', 'formation', 'seminaire', 'atelier', 'actualite', 'information', 'etude de faisabilite'];
  const negativePoints = [1.5, 3, 2, 2, 2, 2, 2, 1, 1];
  
  let negativeScore = 0;
  negativePatterns.forEach((pattern, index) => {
    if (fullText.includes(pattern)) {
      negativeScore += negativePoints[index];
    }
  });

  // Ajustements contextuels standards (V2B)
  let contextualAdjustment = 0;
  
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
  }
  
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
  }

  // NOUVEAUTÉ V2C-FIX: Ajustements d'intention sophistiqués
  let intentAdjustment = 0;
  
  if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
    // Recrutement de prestataire: évaluation neutre, laisser autres signaux
    intentAdjustment += 0;
    
  } else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && 
             result.intentAnalysis.recruitmentType === 'DIRECT') {
    // Vrai recrutement direct: pénalité forte
    intentAdjustment -= 1.5;
    
  } else if (result.intentAnalysis.isAmbiguous && 
             result.intentAnalysis.recruitmentType !== 'SERVICE_OUTSOURCING') {
    // Ambiguïté générale (non service): légère pénalité pour REVIEW
    intentAdjustment -= 0.3;
    
  } else if (result.intentAnalysis.primaryIntent === 'MARKET' && recruitmentScore <= 2) {
    // Marché clair sans confusion: léger bonus
    intentAdjustment += 0.2;
  }

  // Score final
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6) + contextualAdjustment + intentAdjustment;
  result.score = Math.round(finalScore * 100) / 100;

  // LOGIQUE DE DÉCISION V2C-FIX
  if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
    // CAS SPÉCIAL: Recrutement de prestataire
    if (finalScore >= 2.0) {
      result.classification = 'VALID';   // Score très élevé → vraiment un marché
    } else {
      result.classification = 'REVIEW';  // Cas limite → révision manuelle
    }
    
  } else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && 
             result.intentAnalysis.recruitmentType === 'DIRECT') {
    // Recrutement direct → toujours REJECTED sauf score très élevé
    result.classification = finalScore >= 2.5 ? 'REVIEW' : 'REJECTED';
    
  } else {
    // Logique normale avec seuils V2C
    if (finalScore >= 1.3) {
      result.classification = 'VALID';
    } else if (finalScore <= -0.1) {
      result.classification = 'REJECTED';
    } else {
      result.classification = 'REVIEW';
    }
  }
  
  return result;
}

// Fonction de calcul de métriques (réutilisée)
function calculateMetrics(results, version) {
  const metrics = {
    version,
    total: results.length,
    correct: 0,
    accuracy: 0,
    precision: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    recall: { VALID: 0, REVIEW: 0, REJECTED: 0 },
    pollution: { displayedNonMarkets: 0, totalDisplayed: 0, pollutionRate: 0 },
    distribution: { human: { VALID: 0, REVIEW: 0, REJECTED: 0 }, machine: { VALID: 0, REVIEW: 0, REJECTED: 0 } },
    confusionMatrix: {}
  };
  
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
      
      if (machine === 'VALID' || machine === 'REVIEW') {
        metrics.pollution.totalDisplayed++;
        if (human === 'REJECTED') {
          metrics.pollution.displayedNonMarkets++;
        }
      }
    }
  });
  
  metrics.accuracy = metrics.total > 0 ? (metrics.correct / metrics.total) * 100 : 0;
  
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
  });
  
  metrics.pollution.pollutionRate = metrics.pollution.totalDisplayed > 0 ? 
    (metrics.pollution.displayedNonMarkets / metrics.pollution.totalDisplayed) * 100 : 0;
  
  return metrics;
}

async function runV2CFixFinalBenchmark() {
  console.log('🎯 BENCHMARK FINAL V2C-FIX - TRAITEMENT INTELLIGENT DES SERVICES');
  console.log('=' .repeat(80));
  
  try {
    // Charger les données
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
    
    console.log(`✅ ${samples.length} échantillons, ${references.size} références`);
    
    // Test V2C-Fix
    const results = [];
    const gardiannageResults = [];
    
    for (const sample of samples) {
      const humanRef = references.get(sample.id);
      if (!humanRef) continue;
      
      const result = classifyWithIntentAnalysisV2CFix(sample.title, sample.description, sample.source);
      
      results.push({
        id: sample.id,
        title: sample.title,
        human: humanRef,
        machine: result.classification,
        score: result.score,
        intentAnalysis: result.intentAnalysis
      });
      
      // Capturer les cas gardiennage spécifiquement
      if (sample.title.toLowerCase().includes('gardiennage')) {
        gardiannageResults.push({
          title: sample.title.substring(0, 60) + '...',
          human: humanRef,
          machine: result.classification,
          intent: result.intentAnalysis.primaryIntent,
          recruitmentType: result.intentAnalysis.recruitmentType,
          score: result.score
        });
      }
    }
    
    // Calculer métriques
    const metrics = calculateMetrics(results, 'V2C-Fix');
    
    console.log('\n📊 RÉSULTATS V2C-FIX');
    console.log('=' .repeat(50));
    console.log(`Exactitude:           ${metrics.accuracy.toFixed(1)}%`);
    console.log(`Précision VALID:      ${metrics.precision.VALID.toFixed(1)}%`);
    console.log(`Rappel VALID:         ${metrics.recall.VALID.toFixed(1)}%`);
    console.log(`Pollution:            ${metrics.pollution.pollutionRate.toFixed(1)}%`);
    console.log(`Faux positifs:        ${metrics.pollution.displayedNonMarkets}`);
    
    // Test spécifique du cas gardiennage
    console.log('\n🛡️ VÉRIFICATION CAS GARDIENNAGE');
    console.log('-'.repeat(50));
    if (gardiannageResults.length > 0) {
      gardiannageResults.forEach((cas, index) => {
        const isCorrect = cas.human === cas.machine;
        console.log(`${index + 1}. ${isCorrect ? '✅' : '❌'} ${cas.title}`);
        console.log(`   Humain: ${cas.human} → Machine: ${cas.machine}`);
        console.log(`   Intent: ${cas.intent}, Type: ${cas.recruitmentType}, Score: ${cas.score}`);
      });
    } else {
      console.log('Aucun cas gardiennage trouvé');
    }
    
    // Évaluation des objectifs finaux
    console.log('\n🎯 ÉVALUATION FINALE');
    console.log('=' .repeat(40));
    
    const pollutionOK = metrics.pollution.pollutionRate <= 5.0;
    const recallOK = metrics.recall.VALID >= 95.0;
    const accuracyOK = metrics.accuracy >= 75.0;
    const gardiannageOK = gardiannageResults.length > 0 && gardiannageResults.every(cas => cas.machine === 'REVIEW');
    
    console.log(`Pollution ≤ 5%:        ${pollutionOK ? '✅' : '❌'} ${metrics.pollution.pollutionRate.toFixed(1)}%`);
    console.log(`Recall VALID ≥ 95%:     ${recallOK ? '✅' : '❌'} ${metrics.recall.VALID.toFixed(1)}%`);
    console.log(`Exactitude ≥ 75%:       ${accuracyOK ? '✅' : '❌'} ${metrics.accuracy.toFixed(1)}%`);
    console.log(`Gardiennage → REVIEW:   ${gardiannageOK ? '✅' : '❌'} ${gardiannageResults.length > 0 ? gardiannageResults[0].machine : 'N/A'}`);
    
    const finalSuccess = pollutionOK && recallOK && accuracyOK && gardiannageOK;
    
    console.log('\n🏁 VERDICT FINAL');
    console.log('=' .repeat(30));
    
    if (finalSuccess) {
      console.log('🎉 TOUS LES OBJECTIFS ATTEINTS !');
      console.log('   V2C-Fix résout les problèmes identifiés');
      console.log('   ✅ Pollution < 5%');
      console.log('   ✅ Recall élevé maintenu');
      console.log('   ✅ Cas gardiennage → REVIEW');
      console.log('   ✅ Exactitude satisfaisante');
      console.log('\n🚀 RECOMMANDATION: V2C-Fix prêt pour production');
      console.log('   Lancer test de régression sur dataset élargi');
      
    } else {
      console.log('⚠️ Objectifs non atteints');
      
      if (!pollutionOK) {
        console.log(`   🔴 Pollution: ${metrics.pollution.pollutionRate.toFixed(1)}% (objectif ≤ 5%)`);
        
        // Identifier les 5 principales sources de pollution
        console.log('\n🔍 TOP 5 SOURCES DE POLLUTION:');
        const pollutionSources = results
          .filter(r => (r.machine === 'VALID' || r.machine === 'REVIEW') && r.human === 'REJECTED')
          .slice(0, 5);
        
        pollutionSources.forEach((source, index) => {
          console.log(`${index + 1}. "${source.title.substring(0, 50)}..." (${source.machine})`);
        });
      }
      
      if (!gardiannageOK) {
        console.log(`   🔴 Gardiennage mal classé`);
      }
      
      console.log('\n🔧 RECOMMANDATION: Ajustements supplémentaires nécessaires');
    }
    
    return {
      metrics,
      finalSuccess,
      gardiannageResults,
      objectives: { pollutionOK, recallOK, accuracyOK, gardiannageOK }
    };
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

if (require.main === module) {
  runV2CFixFinalBenchmark().catch(console.error);
}

module.exports = { runV2CFixFinalBenchmark };