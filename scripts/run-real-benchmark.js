/**
 * Script d'exécution du benchmark avec données réelles
 * Compare classification automatique vs référence humaine
 */

const { RealDataBenchmark } = require('../src/lib/realDataBenchmark.js');
const { classifyWithDiagnostic } = require('../src/lib/richClassifier.js');
const fs = require('fs').promises;
const path = require('path');

/**
 * Charge les échantillons de données depuis le fichier JSON
 */
async function loadSamples(filename = 'real-data-samples.json') {
  try {
    const samplesPath = path.join(process.cwd(), 'data', filename);
    const content = await fs.readFile(samplesPath, 'utf8');
    const samples = JSON.parse(content);
    
    console.log(`✅ ${samples.length} échantillons chargés depuis ${filename}`);
    return samples;
    
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Charge les classifications humaines depuis le CSV
 */
async function loadHumanReferences(filename = 'real-data-samples.csv') {
  try {
    const csvPath = path.join(process.cwd(), 'data', filename);
    const content = await fs.readFile(csvPath, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header
    
    const references = [];
    let processedCount = 0;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parse CSV simple (attention aux guillemets dans le titre)
      const matches = line.match(/^"([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)","([^"]*?)"$/);
      if (!matches) {
        console.warn(`⚠️ Ligne CSV mal formatée ignorée: ${line.substring(0, 50)}...`);
        continue;
      }
      
      const [, id, title, source, classification, notes] = matches;
      
      if (classification && ['VALID', 'REVIEW', 'REJECTED'].includes(classification.toUpperCase())) {
        references.push({
          id,
          classification: classification.toUpperCase(),
          notes: notes || ''
        });
        processedCount++;
      }
    }
    
    console.log(`✅ ${processedCount} références humaines chargées depuis ${filename}`);
    return references;
    
  } catch (error) {
    console.error(`❌ Erreur lors du chargement des références: ${error.message}`);
    return [];
  }
}

/**
 * Génère des références humaines de test si le CSV n'est pas rempli
 */
function generateTestReferences(samples) {
  console.log('🎭 Génération de références humaines de test...');
  
  const references = samples.map(sample => {
    let classification;
    const title = sample.title.toLowerCase();
    
    // Logique simple basée sur des mots-clés
    if (title.includes('soutenance') || title.includes('these') || 
        title.includes('nomination') || title.includes('deces') || 
        title.includes('ceremonie') || title.includes('decret')) {
      classification = 'REJECTED';
    } else if (title.includes('appel d\'offres') || title.includes('demande de cotation') || 
               title.includes('acquisition') || title.includes('travaux de construction')) {
      classification = 'VALID';
    } else {
      classification = 'REVIEW';
    }
    
    return {
      id: sample.id,
      classification,
      notes: `Classification automatique de test basée sur "${title.substring(0, 30)}..."`
    };
  });
  
  console.log(`✅ ${references.length} références de test générées`);
  return references;
}

/**
 * Affiche un résumé détaillé des erreurs les plus importantes
 */
function displayErrorAnalysis(results) {
  console.log('\n🔍 ANALYSE DÉTAILLÉE DES ERREURS');
  console.log('=' .repeat(80));
  
  // Faux positifs - CRITIQUE pour l'UX
  if (results.errors.falsePositives.length > 0) {
    console.log('\n🚨 FAUX POSITIFS (contenus classés VALID à tort):');
    results.errors.falsePositives.slice(0, 3).forEach((error, index) => {
      console.log(`\n${index + 1}. "${error.title}"`);
      console.log(`   Humain: ${error.human} → Machine: ${error.automatic.classification}`);
      console.log(`   Confiance: ${Math.round(error.automatic.confidence * 100)}%`);
      console.log(`   Source: ${error.source}`);
      if (error.humanNotes) console.log(`   Notes: ${error.humanNotes}`);
      
      // Diagnostic automatique
      if (error.diagnostics.exclusions > 0) {
        console.log(`   ⚠️ ALERTE: ${error.diagnostics.exclusions} exclusions critiques détectées!`);
      }
      console.log(`   Signaux: +${error.diagnostics.positiveSignals}, -${error.diagnostics.negativeSignals}`);
    });
  }
  
  // Faux négatifs - Opportunités ratées
  if (results.errors.falseNegatives.length > 0) {
    console.log('\n📉 FAUX NÉGATIFS (vrais marchés ratés):');
    results.errors.falseNegatives.slice(0, 3).forEach((error, index) => {
      console.log(`\n${index + 1}. "${error.title}"`);
      console.log(`   Humain: ${error.human} → Machine: ${error.automatic.classification}`);
      console.log(`   Score: ${error.automatic.score}`);
      console.log(`   Confiance source: ${error.diagnostics.sourceConfidence}`);
      
      if (error.diagnostics.positiveSignals === 0) {
        console.log(`   💡 Aucun signal positif détecté - enrichir les indicateurs?`);
      }
    });
  }
}

/**
 * Génère des recommandations spécifiques basées sur les erreurs
 */
function generateActionPlan(results) {
  console.log('\n🎯 PLAN D\'ACTION PRIORITAIRE');
  console.log('=' .repeat(80));
  
  const actionItems = [];
  
  // Analyse de la pollution
  if (results.pollutionMetrics.pollutionRate > 5) {
    actionItems.push({
      priority: 'CRITIQUE',
      action: 'Réduire la pollution du dashboard',
      detail: `${results.pollutionMetrics.pollutionRate.toFixed(1)}% de contenus non-marchés seraient affichés (objectif < 5%)`,
      solution: 'Renforcer les exclusions critiques et ajuster les seuils'
    });
  }
  
  // Erreurs critiques (soutenances, décès, etc.)
  if (results.pollutionMetrics.criticalErrors > 0) {
    actionItems.push({
      priority: 'CRITIQUE',
      action: 'Éliminer les erreurs graves',
      detail: `${results.pollutionMetrics.criticalErrors} contenus académiques/personnels classés comme marchés`,
      solution: 'Vérifier et renforcer les exclusions critiques'
    });
  }
  
  // Précision faible sur VALID
  if (results.precision.VALID < 85) {
    actionItems.push({
      priority: 'HAUTE',
      action: 'Améliorer la précision VALID', 
      detail: `${results.precision.VALID.toFixed(1)}% de précision (objectif > 85%)`,
      solution: 'Analyser les faux positifs et ajuster les seuils'
    });
  }
  
  // Rappel faible sur VALID
  if (results.recall.VALID < 80) {
    actionItems.push({
      priority: 'HAUTE',
      action: 'Améliorer la détection des marchés',
      detail: `${results.recall.VALID.toFixed(1)}% de rappel (objectif > 80%)`,
      solution: 'Enrichir les indicateurs positifs et baisser les seuils'
    });
  }
  
  // Trop de révisions manuelles
  const reviewRate = (results.distribution.machine.REVIEW / results.totalSamples) * 100;
  if (reviewRate > 20) {
    actionItems.push({
      priority: 'MOYENNE',
      action: 'Réduire les cas de révision manuelle',
      detail: `${reviewRate.toFixed(1)}% de contenus nécessitent une révision`,
      solution: 'Affiner les seuils pour automatiser davantage'
    });
  }
  
  // Affichage du plan d'action
  if (actionItems.length === 0) {
    console.log('✅ Aucune action critique nécessaire - performance acceptable!');
    return;
  }
  
  actionItems.forEach((item, index) => {
    console.log(`\n${index + 1}. [${item.priority}] ${item.action}`);
    console.log(`   Problème: ${item.detail}`);
    console.log(`   Solution: ${item.solution}`);
  });
  
  // Recommandations de seuils
  console.log('\n⚙️ AJUSTEMENTS DE SEUILS RECOMMANDÉS:');
  
  if (results.pollutionMetrics.pollutionRate > 5) {
    console.log('   - Augmenter le seuil ACCEPT de 1.5 à 2.0 (réduire faux positifs)');
  }
  
  if (results.recall.VALID < 80) {
    console.log('   - Diminuer le seuil ACCEPT de 1.5 à 1.2 (capturer plus de marchés)');
  }
  
  if (reviewRate > 25) {
    console.log('   - Ajuster les seuils REVIEW pour réduire la zone grise');
  }
}

/**
 * Sauvegarde les résultats détaillés pour analyse
 */
async function saveDetailedResults(results, filename = 'benchmark-results.json') {
  try {
    const outputPath = path.join(process.cwd(), 'data', filename);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 Résultats détaillés sauvegardés: ${outputPath}`);
    
    // Sauvegarde aussi un CSV des erreurs pour analyse
    const errorsPath = outputPath.replace('.json', '-errors.csv');
    const allErrors = [
      ...results.errors.falsePositives.map(e => ({...e, errorType: 'FALSE_POSITIVE'})),
      ...results.errors.falseNegatives.map(e => ({...e, errorType: 'FALSE_NEGATIVE'}))
    ];
    
    if (allErrors.length > 0) {
      const csvContent = [
        'errorType,title,human,machine,confidence,source,positiveSignals,negativeSignals',
        ...allErrors.map(e => 
          `${e.errorType},"${e.title.replace(/"/g, '""')}",${e.human},${e.automatic.classification},${e.automatic.confidence},${e.source},${e.diagnostics.positiveSignals},${e.diagnostics.negativeSignals}`
        )
      ].join('\n');
      
      await fs.writeFile(errorsPath, csvContent, 'utf8');
      console.log(`📊 CSV des erreurs sauvegardé: ${errorsPath}`);
    }
    
  } catch (error) {
    console.warn('⚠️ Erreur lors de la sauvegarde:', error.message);
  }
}

/**
 * Fonction principale d'exécution du benchmark
 */
async function main() {
  console.log('🚀 BENCHMARK DONNÉES RÉELLES - WEND-KABRÉ');
  console.log('=' .repeat(60));
  
  try {
    // 1. Charger les échantillons
    console.log('\n📂 Chargement des données...');
    const samples = await loadSamples();
    
    if (samples.length === 0) {
      console.error('❌ Aucun échantillon trouvé');
      process.exit(1);
    }
    
    // 2. Charger les références humaines
    console.log('\n👤 Chargement des références humaines...');
    let references = await loadHumanReferences();
    
    // Si pas de références, en générer pour le test
    if (references.length === 0) {
      console.log('⚠️ Aucune référence humaine trouvée, génération de références de test');
      references = generateTestReferences(samples);
    }
    
    // 3. Créer et configurer le benchmark
    console.log('\n⚙️ Configuration du benchmark...');
    const benchmark = new RealDataBenchmark();
    
    // Ajouter les échantillons
    samples.forEach(sample => {
      benchmark.addSample(sample.id, sample);
    });
    
    // Ajouter les références humaines
    benchmark.importHumanReferences(references);
    
    console.log(`✅ Benchmark configuré: ${samples.length} échantillons, ${references.length} références`);
    
    // 4. Exécuter le benchmark
    console.log('\n🔬 Exécution du benchmark...');
    console.log('(Cela peut prendre quelques secondes...)');
    
    const results = await benchmark.runRealDataBenchmark();
    
    // 5. Afficher les résultats principaux
    console.log('\n📊 RÉSULTATS PRINCIPAUX');
    console.log('-'.repeat(40));
    console.log(`Exactitude globale: ${results.accuracy.toFixed(1)}%`);
    console.log(`Précision VALID: ${results.precision.VALID.toFixed(1)}%`);
    console.log(`Rappel VALID: ${results.recall.VALID.toFixed(1)}%`);
    console.log(`Taux de pollution: ${results.pollutionMetrics.pollutionRate.toFixed(1)}%`);
    console.log(`Erreurs critiques: ${results.pollutionMetrics.criticalErrors}`);
    
    // 6. Générer le rapport complet
    const report = benchmark.generateBenchmarkReport();
    console.log('\n' + report);
    
    // 7. Analyse détaillée des erreurs
    displayErrorAnalysis(results);
    
    // 8. Plan d'action
    generateActionPlan(results);
    
    // 9. Sauvegarde des résultats
    await saveDetailedResults(results);
    
    console.log('\n✅ Benchmark terminé avec succès!');
    
    // Status final
    if (results.accuracy >= 90 && results.pollutionMetrics.pollutionRate <= 5) {
      console.log('\n🎉 PERFORMANCE EXCELLENTE - Prêt pour la production!');
    } else if (results.accuracy >= 80 && results.pollutionMetrics.pollutionRate <= 10) {
      console.log('\n✅ PERFORMANCE ACCEPTABLE - Quelques ajustements recommandés');
    } else {
      console.log('\n⚠️ PERFORMANCE INSUFFISANTE - Améliorations nécessaires avant production');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du benchmark:', error);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };