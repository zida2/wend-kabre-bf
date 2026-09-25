/**
 * Version V2B finale avec ajustements fins basés sur l'analyse complète
 * Objectif: pollution < 5% ET recall VALID > 85%
 */

const fs = require('fs').promises;
const path = require('path');

function classifyWithDiagnosticV2B(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const normalizedSource = (source || '').toLowerCase();
  
  const result = {
    classification: null,
    score: 0,
    confidence: 0,
    signals: { positive: [], negative: [], exclusions: [], contextual: [] },
    breakdown: { sourceConfidence: 0, positiveScore: 0, negativeScore: 0, contextualAdjustment: 0, finalScore: 0 },
    version: 'v2b-final'
  };

  // Exclusions critiques (v2 renforcée)
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

  // Sources (v1 optimisée)
  let sourceConfidence = 0.2;
  if (['arcop', 'dgcmef', 'reliefweb'].some(ts => normalizedSource.includes(ts))) {
    sourceConfidence = 0.8;
  } else if (['sante.gov.bf', 'infrastructures.gov.bf', 'agriculture.gov.bf', 'equipement.gov.bf'].some(gs => normalizedSource.includes(gs))) {
    sourceConfidence = 0.7;
  } else if (['ministere', 'gouvernement'].some(pts => normalizedSource.includes(pts))) {
    sourceConfidence = 0.5;
  }
  result.breakdown.sourceConfidence = sourceConfidence;

  // Indicateurs positifs (v1 enrichie)
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

  // V2B: Indicateurs négatifs équilibrés
  const negativeIndicators = [
    { pattern: 'recrutement', points: 1.5, category: 'emploi' }, // RÉDUIT encore
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

  // V2B: Règles contextuelles sophistiquées
  let contextualAdjustment = 0;
  
  // Règle spéciale: "Avis de recrutement" pour services = marché de prestation
  if (fullText.includes('avis de recrutement') && 
      (fullText.includes('gardiennage') || fullText.includes('securite') || 
       fullText.includes('nettoyage') || fullText.includes('maintenance'))) {
    
    // C'est un marché de service déguisé en recrutement
    contextualAdjustment += 2; // BOOST fort
    result.signals.contextual.push({ 
      rule: 'recrutement_service_prestation', 
      adjustment: 2,
      reason: 'Recrutement de prestataire = marché de service'
    });
  }
  // Sinon, règle normale prestation + recrutement
  else if (fullText.includes('prestation') && fullText.includes('recrutement')) {
    contextualAdjustment -= 1;
    result.signals.contextual.push({ rule: 'prestation_recrutement_general', adjustment: -1 });
  }
  
  // Règle acquisition + équipement (identique)
  if (fullText.includes('acquisition') && (fullText.includes('vehicules') || fullText.includes('materiel') || fullText.includes('equipement'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'acquisition_equipement', adjustment: 1 });
  }
  
  // Règle travaux + BTP (identique)
  if (fullText.includes('travaux') && (fullText.includes('route') || fullText.includes('construction') || fullText.includes('refection'))) {
    contextualAdjustment += 1;
    result.signals.contextual.push({ rule: 'travaux_btp', adjustment: 1 });
  }
  
  result.breakdown.contextualAdjustment = contextualAdjustment;

  // Score final
  const finalScore = (sourceConfidence * 0.3) + (positiveScore * 0.4) - (negativeScore * 0.6) + contextualAdjustment;
  result.breakdown.finalScore = finalScore;
  result.score = Math.round(finalScore * 100) / 100;
  
  // V2B: Seuils optimaux basés sur l'analyse
  const ACCEPT_THRESHOLD = 1.2;   // Plus permissif pour capturer marchés
  const REJECT_THRESHOLD = -0.1;  // Plus tolérant
  
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

async function runFinalBenchmark() {
  console.log('🎯 BENCHMARK FINAL V2B - OPTIMISATION POLLUTION/RECALL');
  console.log('=' .repeat(80));
  
  try {
    // Charger données et références
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
    
    // Test V2B
    const results = [];
    let correct = 0;
    
    const distribution = {
      human: { VALID: 0, REVIEW: 0, REJECTED: 0 },
      machine: { VALID: 0, REVIEW: 0, REJECTED: 0 }
    };
    
    const confusionMatrix = {};
    ['VALID', 'REVIEW', 'REJECTED'].forEach(h => {
      ['VALID', 'REVIEW', 'REJECTED'].forEach(m => {
        confusionMatrix[`${h}→${m}`] = 0;
      });
    });
    
    let pollutionCount = 0;
    let totalDisplayed = 0;
    
    for (const sample of samples) {
      const humanRef = references.get(sample.id);
      if (!humanRef) continue;
      
      const result = classifyWithDiagnosticV2B(sample.title, sample.description, sample.source);
      
      results.push({
        id: sample.id,
        title: sample.title.substring(0, 60) + '...',
        human: humanRef,
        machine: result.classification,
        score: result.score,
        contextual: result.signals.contextual
      });
      
      distribution.human[humanRef]++;
      distribution.machine[result.classification]++;
      
      if (humanRef === result.classification) correct++;
      confusionMatrix[`${humanRef}→${result.classification}`]++;
      
      // Pollution: contenus affichés qui ne devraient pas l'être
      if (result.classification === 'VALID' || result.classification === 'REVIEW') {
        totalDisplayed++;
        if (humanRef === 'REJECTED') {
          pollutionCount++;
        }
      }
    }
    
    // Calcul métriques
    const accuracy = (correct / results.length) * 100;
    const pollutionRate = totalDisplayed > 0 ? (pollutionCount / totalDisplayed) * 100 : 0;
    
    // Précision/Rappel VALID
    const tp_valid = confusionMatrix['VALID→VALID'] || 0;
    const predicted_valid = Object.keys(confusionMatrix)
      .filter(key => key.endsWith('→VALID'))
      .reduce((sum, key) => sum + confusionMatrix[key], 0);
    const actual_valid = Object.keys(confusionMatrix)
      .filter(key => key.startsWith('VALID→'))
      .reduce((sum, key) => sum + confusionMatrix[key], 0);
    
    const precision_valid = predicted_valid > 0 ? (tp_valid / predicted_valid) * 100 : 0;
    const recall_valid = actual_valid > 0 ? (tp_valid / actual_valid) * 100 : 0;
    
    // Affichage des résultats
    console.log('\n📊 RÉSULTATS FINAUX V2B');
    console.log('-'.repeat(50));
    console.log(`Exactitude globale:     ${accuracy.toFixed(1)}%`);
    console.log(`Précision VALID:        ${precision_valid.toFixed(1)}%`);
    console.log(`Rappel VALID:           ${recall_valid.toFixed(1)}%`);
    console.log(`Taux de pollution:      ${pollutionRate.toFixed(1)}%`);
    
    // Objectifs atteints ?
    console.log('\n🎯 OBJECTIFS');
    console.log('-'.repeat(30));
    console.log(`Pollution < 5%:         ${pollutionRate <= 5 ? '✅' : '❌'} (${pollutionRate.toFixed(1)}%)`);
    console.log(`Recall VALID > 85%:     ${recall_valid >= 85 ? '✅' : '❌'} (${recall_valid.toFixed(1)}%)`);
    console.log(`Exactitude > 80%:       ${accuracy >= 80 ? '✅' : '❌'} (${accuracy.toFixed(1)}%)`);
    
    // Cas spécifiques améliorés
    console.log('\n🔍 CAS SPÉCIFIQUES TESTÉS');
    console.log('-'.repeat(40));
    
    const specificCases = results.filter(r => 
      r.title.includes('gardiennage') || 
      r.title.includes('acquisition') || 
      r.title.includes('travaux')
    );
    
    specificCases.forEach(cas => {
      const isCorrect = cas.human === cas.machine;
      console.log(`${isCorrect ? '✅' : '❌'} ${cas.title}`);
      console.log(`   ${cas.human} → ${cas.machine} (score: ${cas.score})`);
      if (cas.contextual && cas.contextual.length > 0) {
        console.log(`   Contexte: ${cas.contextual.map(c => c.rule).join(', ')}`);
      }
    });
    
    // Évaluation finale
    console.log('\n🏁 ÉVALUATION FINALE');
    console.log('=' .repeat(50));
    
    const objectivesReached = pollutionRate <= 5 && recall_valid >= 85 && accuracy >= 80;
    
    if (objectivesReached) {
      console.log('🎉 TOUS LES OBJECTIFS ATTEINTS !');
      console.log('   Le classificateur est prêt pour la production');
      console.log('   ✅ Pollution faible');
      console.log('   ✅ Bonne détection des marchés'); 
      console.log('   ✅ Exactitude satisfaisante');
    } else {
      console.log('⚠️ Objectifs partiellement atteints');
      if (pollutionRate > 5) console.log(`   🔴 Pollution encore élevée: ${pollutionRate.toFixed(1)}%`);
      if (recall_valid < 85) console.log(`   🔴 Rappel insuffisant: ${recall_valid.toFixed(1)}%`);
      if (accuracy < 80) console.log(`   🔴 Exactitude insuffisante: ${accuracy.toFixed(1)}%`);
    }
    
    // Recommandations finales
    console.log('\n💡 PROCHAINES ÉTAPES');
    console.log('-'.repeat(30));
    
    if (objectivesReached) {
      console.log('1. ✅ Déployer la version V2B en production');
      console.log('2. 🔄 Monitorer les performances avec de vraies données');
      console.log('3. 📈 Passer au SEO et acquisition une fois stable');
      console.log('4. 🎯 Tester sur un échantillon plus large (200+ contenus)');
    } else {
      console.log('1. 🔧 Ajuster encore les seuils ou règles contextuelles');
      console.log('2. 📊 Analyser les cas d\'erreur restants');
      console.log('3. 🔄 Relancer le benchmark après corrections');
    }
    
    return {
      accuracy,
      precision_valid,
      recall_valid,
      pollutionRate,
      objectivesReached,
      results
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du benchmark final:', error);
    throw error;
  }
}

// Exécution
if (require.main === module) {
  runFinalBenchmark().catch(console.error);
}

module.exports = { runFinalBenchmark, classifyWithDiagnosticV2B };