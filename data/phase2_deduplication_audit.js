/**
 * PHASE 2 - DÉDUPLICATION ET AUDIT D'INDÉPENDANCE GOLD V2
 * 
 * MISSION : Contrôle qualité rigoureux SANS forcer le résultat à 100
 * RÈGLES : Aucune prédiction V2F/V2G, aucun label GOLD assigné
 */

const fs = require('fs');
const path = require('path');

// Fonction de normalisation pour comparaisons
function normalizeText(text) {
  return text.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e') 
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction de calcul de similarité textuelle (Jaccard)
function calculateSimilarity(text1, text2) {
  const words1 = new Set(normalizeText(text1).split(' '));
  const words2 = new Set(normalizeText(text2).split(' '));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// PHASE 2.1 - DÉDUPLICATION INTERNE
function performInternalDeduplication(samples) {
  console.log('🔄 PHASE 2.1 - DÉDUPLICATION INTERNE');
  console.log('====================================\n');
  
  const duplicates = [];
  const processed = new Set();
  
  for (let i = 0; i < samples.length; i++) {
    if (processed.has(i)) continue;
    
    const sample1 = samples[i];
    
    for (let j = i + 1; j < samples.length; j++) {
      if (processed.has(j)) continue;
      
      const sample2 = samples[j];
      
      // Vérifications de duplication
      const checks = {
        exactTitle: sample1.title === sample2.title,
        exactReference: sample1.reference === sample2.reference,
        titleSimilarity: calculateSimilarity(sample1.title, sample2.title),
        descSimilarity: calculateSimilarity(sample1.description || '', sample2.description || ''),
        sameSource: sample1.original_source === sample2.original_source
      };
      
      // Critères de duplication
      const isDuplicate = (
        checks.exactTitle ||
        checks.exactReference ||
        (checks.titleSimilarity > 0.9 && checks.sameSource) ||
        (checks.titleSimilarity > 0.8 && checks.descSimilarity > 0.8)
      );
      
      if (isDuplicate) {
        duplicates.push({
          type: checks.exactTitle ? 'EXACT_TITLE' : 
                checks.exactReference ? 'SAME_REFERENCE' :
                checks.titleSimilarity > 0.9 ? 'QUASI_DUPLICATE' : 'SIMILAR_CONTENT',
          sample1: { id: sample1.id, title: sample1.title, reference: sample1.reference },
          sample2: { id: sample2.id, title: sample2.title, reference: sample2.reference },
          similarity_metrics: {
            title: (checks.titleSimilarity * 100).toFixed(1),
            description: (checks.descSimilarity * 100).toFixed(1)
          }
        });
        
        // Marquer le second comme traité (on garde le premier)
        processed.add(j);
      }
    }
  }
  
  // Retourner les échantillons sans doublons
  const cleanSamples = samples.filter((_, index) => !processed.has(index));
  
  console.log(`📊 RÉSULTATS DÉDUPLICATION INTERNE :`);
  console.log(`   Documents originaux : ${samples.length}`);
  console.log(`   Doublons détectés : ${duplicates.length}`);
  console.log(`   Documents conservés : ${cleanSamples.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n🚨 DOUBLONS TROUVÉS :');
    duplicates.forEach((dup, idx) => {
      console.log(`   ${idx + 1}. ${dup.type}`);
      console.log(`      ${dup.sample1.id}: "${dup.sample1.title.substring(0, 60)}..."`);
      console.log(`      ${dup.sample2.id}: "${dup.sample2.title.substring(0, 60)}..."`);
      console.log(`      Similarité: ${dup.similarity_metrics.title}% titre, ${dup.similarity_metrics.description}% desc`);
    });
  }
  
  return { cleanSamples, duplicates };
}

// PHASE 2.2 - VÉRIFICATION D'INDÉPENDANCE EXTERNE
function performIndependenceCheck(samples) {
  console.log('\n🔍 PHASE 2.2 - VÉRIFICATION D\'INDÉPENDANCE EXTERNE');
  console.log('=================================================\n');
  
  // Datasets existants à vérifier
  const EXTERNAL_DATASETS = [
    'holdout-validation-dataset.json',
    'gold-dataset-v1.json',
    'real-data-samples.json',
    'final-test-dataset.json',
    'shadow-dataset-v2d.json',
    'BLIND_SET_GOLD_V1.json' // V1 défaillant mais à vérifier quand même
  ];
  
  const contaminations = [];
  let totalComparisons = 0;
  let datasetsChecked = 0;
  
  // Charger et vérifier chaque dataset externe
  EXTERNAL_DATASETS.forEach(datasetFile => {
    const datasetPath = path.join(__dirname, datasetFile);
    
    if (!fs.existsSync(datasetPath)) {
      console.log(`⚠️  Dataset non trouvé : ${datasetFile}`);
      return;
    }
    
    try {
      const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
      let externalSamples = [];
      
      // Extraire les échantillons selon la structure
      if (Array.isArray(dataset)) {
        externalSamples = dataset;
      } else if (dataset.samples) {
        externalSamples = dataset.samples;
      } else if (dataset.data) {
        externalSamples = dataset.data;
      }
      
      console.log(`✅ Vérification vs ${datasetFile} (${externalSamples.length} échantillons)`);
      datasetsChecked++;
      
      // Comparer chaque échantillon GOLD V2 avec ce dataset
      samples.forEach(goldSample => {
        externalSamples.forEach(extSample => {
          totalComparisons++;
          
          const titleSim = calculateSimilarity(
            goldSample.title || '',
            extSample.title || extSample.nom || ''
          );
          
          const descSim = calculateSimilarity(
            goldSample.description || '',
            extSample.description || extSample.description_complete || extSample.details || ''
          );
          
          // Seuil de contamination strict
          const CONTAMINATION_THRESHOLD = 0.85;
          
          if (titleSim > CONTAMINATION_THRESHOLD || descSim > CONTAMINATION_THRESHOLD) {
            contaminations.push({
              gold_id: goldSample.id,
              gold_title: goldSample.title,
              gold_reference: goldSample.reference,
              contaminated_dataset: datasetFile,
              external_id: extSample.id || extSample.reference || 'unknown',
              external_title: extSample.title || extSample.nom || 'unknown',
              similarity: {
                title: (titleSim * 100).toFixed(1),
                description: (descSim * 100).toFixed(1)
              },
              contamination_type: titleSim > CONTAMINATION_THRESHOLD ? 'TITLE_MATCH' : 'DESC_MATCH'
            });
          }
        });
      });
      
    } catch (error) {
      console.log(`❌ Erreur lecture ${datasetFile}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 RÉSULTATS VÉRIFICATION D'INDÉPENDANCE :`);
  console.log(`   Datasets vérifiés : ${datasetsChecked}`);
  console.log(`   Comparaisons totales : ${totalComparisons.toLocaleString()}`);
  console.log(`   Contaminations détectées : ${contaminations.length}`);
  
  return { contaminations, totalComparisons, datasetsChecked };
}

// PHASE 2.3 - AUDIT DE PROVENANCE  
function performProvenanceAudit(samples) {
  console.log('\n🔎 PHASE 2.3 - AUDIT DE PROVENANCE');
  console.log('===================================\n');
  
  const provenanceIssues = [];
  const sourceStats = {};
  const referencePatterns = {};
  
  samples.forEach(sample => {
    // Statistiques des sources
    sourceStats[sample.original_source] = (sourceStats[sample.original_source] || 0) + 1;
    
    // Analyse des références
    if (sample.reference) {
      const refPattern = sample.reference.split('-')[0]; // Ex: "AO", "CONST", "FORM"
      referencePatterns[refPattern] = (referencePatterns[refPattern] || 0) + 1;
    }
    
    // Vérifications de provenance
    const issues = [];
    
    if (!sample.original_source || sample.original_source.trim() === '') {
      issues.push('SOURCE_MISSING');
    }
    
    if (!sample.reference || sample.reference.trim() === '') {
      issues.push('REFERENCE_MISSING');
    }
    
    if (!sample.collection_method) {
      issues.push('COLLECTION_METHOD_MISSING');  
    }
    
    // Vérifier authenticité des références (format attendu BF)
    if (sample.reference && !/^[A-Z]+-202[4-6]-[A-Z]+-\d+$/.test(sample.reference)) {
      issues.push('REFERENCE_FORMAT_INVALID');
    }
    
    if (issues.length > 0) {
      provenanceIssues.push({
        id: sample.id,
        title: sample.title.substring(0, 60) + '...',
        issues: issues
      });
    }
  });
  
  console.log(`📊 AUDIT DE PROVENANCE :`);
  console.log(`   Documents avec problèmes : ${provenanceIssues.length}`);
  console.log(`   Sources distinctes : ${Object.keys(sourceStats).length}`);
  console.log(`   Types de références : ${Object.keys(referencePatterns).length}`);
  
  console.log('\n📈 RÉPARTITION PAR SOURCE :');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} documents`);
  });
  
  if (provenanceIssues.length > 0) {
    console.log('\n🚨 PROBLÈMES DE PROVENANCE :');
    provenanceIssues.slice(0, 5).forEach(issue => {
      console.log(`   ${issue.id}: ${issue.issues.join(', ')}`);
    });
    if (provenanceIssues.length > 5) {
      console.log(`   ... et ${provenanceIssues.length - 5} autres`);
    }
  }
  
  return { provenanceIssues, sourceStats, referencePatterns };
}

// FONCTION PRINCIPALE PHASE 2
function executePhase2() {
  const rawPath = path.join(__dirname, 'RAW_GOLD_V2.json');
  
  if (!fs.existsSync(rawPath)) {
    throw new Error("RAW_GOLD_V2.json n'existe pas. Exécutez d'abord la Phase 1.");
  }
  
  console.log('🔬 PHASE 2 - AUDIT QUALITÉ GOLD V2');
  console.log('===================================');
  console.log('⚠️  RÈGLES STRICTES :');
  console.log('   - Aucune prédiction V2F/V2G');  
  console.log('   - Aucun label GOLD assigné');
  console.log('   - Résultat final = conséquence du contrôle qualité');
  console.log('   - Ne pas forcer à conserver 100 documents\n');
  
  // Charger le dataset RAW
  const rawDataset = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`📦 Dataset RAW chargé : ${rawDataset.samples.length} documents\n`);
  
  // PHASE 2.1 - Déduplication interne
  const { cleanSamples, duplicates } = performInternalDeduplication(rawDataset.samples);
  
  // PHASE 2.2 - Vérification d'indépendance externe  
  const { contaminations, totalComparisons, datasetsChecked } = performIndependenceCheck(cleanSamples);
  
  // PHASE 2.3 - Audit de provenance
  const { provenanceIssues, sourceStats, referencePatterns } = performProvenanceAudit(cleanSamples);
  
  // Éliminer les documents contaminés
  const contaminatedIds = new Set(contaminations.map(c => c.gold_id));
  const finalSamples = cleanSamples.filter(sample => !contaminatedIds.has(sample.id));
  
  // RAPPORT FINAL PHASE 2
  const phase2Report = {
    phase: "2_DEDUPLICATION_INDEPENDENCE",
    execution_date: new Date().toISOString(),
    raw_input: rawDataset.samples.length,
    internal_duplicates: duplicates.length,
    external_contaminations: contaminations.length,
    provenance_issues: provenanceIssues.length,
    final_clean_samples: finalSamples.length,
    documents_eliminated: rawDataset.samples.length - finalSamples.length,
    independence_verification: {
      datasets_checked: datasetsChecked,
      total_comparisons: totalComparisons,
      contamination_threshold: "85%"
    },
    quality_metrics: {
      source_diversity: Object.keys(sourceStats).length,
      reference_patterns: Object.keys(referencePatterns).length,
      avg_documents_per_source: (finalSamples.length / Object.keys(sourceStats).length).toFixed(1)
    },
    phase2_violations: {
      v2f_predictions_consulted: false,
      v2g_predictions_consulted: false,
      gold_labels_assigned: false
    }
  };
  
  // Créer le dataset candidat
  const candidateDataset = {
    metadata: {
      name: "GOLD_V2_CANDIDATE",
      phase: "2_COMPLETED",
      creation_date: new Date().toISOString(),
      total_samples: finalSamples.length,
      status: finalSamples.length >= 100 ? "READY_FOR_PHASE_3" : "NEED_MORE_SAMPLES",
      samples_needed: Math.max(0, 100 - finalSamples.length),
      quality_controlled: true,
      independence_verified: true,
      next_phase: "3_HUMAN_LABELING"
    },
    samples: finalSamples,
    phase2_report: phase2Report
  };
  
  // Sauvegarder les résultats
  const candidatePath = path.join(__dirname, 'GOLD_V2_CANDIDATE.json');
  const reportPath = path.join(__dirname, 'PHASE2_AUDIT_REPORT.json');
  
  fs.writeFileSync(candidatePath, JSON.stringify(candidateDataset, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify({
    ...phase2Report,
    duplicates_details: duplicates,
    contaminations_details: contaminations,
    provenance_issues_details: provenanceIssues
  }, null, 2));
  
  // RAPPORT FINAL CONSOLE
  console.log('\n🎯 RAPPORT FINAL PHASE 2');
  console.log('========================\n');
  console.log(`RAW                    : ${phase2Report.raw_input}`);
  console.log(`Doublons internes      : ${phase2Report.internal_duplicates}`);
  console.log(`Doublons externes      : ${phase2Report.external_contaminations}`);
  console.log(`Problèmes provenance   : ${phase2Report.provenance_issues}`);
  console.log(`Documents conservés    : ${phase2Report.final_clean_samples}`);
  console.log(`Documents à remplacer  : ${phase2Report.documents_eliminated}`);
  console.log(`\nV2F/V2G consultés      : NON`);
  console.log(`Labels GOLD modifiés   : NON`);
  console.log(`\nSTATUS : ${candidateDataset.metadata.status}`);
  
  if (finalSamples.length < 100) {
    console.log(`\n⚠️  ACTION REQUISE : Collecter ${candidateDataset.metadata.samples_needed} échantillons supplémentaires`);
    console.log('   pour atteindre le minimum de 100 documents validés');
  } else {
    console.log('\n✅ PHASE 2 RÉUSSIE - Prêt pour Phase 3 (Labellisation humaine)');
  }
  
  return candidateDataset;
}

// Exécution si appelé directement
if (require.main === module) {
  try {
    executePhase2();
  } catch (error) {
    console.error('❌ Erreur Phase 2 :', error.message);
    process.exit(1);
  }
}

module.exports = { executePhase2 };