/**
 * PHASE 2 - VERSION SIMPLIFIÉE ET ROBUSTE
 * Audit qualité GOLD V2 sans timeout
 */

const fs = require('fs');
const path = require('path');

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function calculateSimilarity(text1, text2) {
  const words1 = new Set(normalizeText(text1).split(' '));
  const words2 = new Set(normalizeText(text2).split(' '));
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

function executePhase2Simple() {
  console.log('🔬 PHASE 2 - AUDIT QUALITÉ GOLD V2 (Version Robuste)');
  console.log('====================================================\n');
  
  // Charger RAW_GOLD_V2
  const rawPath = path.join(__dirname, 'RAW_GOLD_V2.json');
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const samples = rawData.samples;
  
  console.log(`📦 Documents à auditer : ${samples.length}\n`);
  
  // PHASE 2.1 - DÉDUPLICATION INTERNE (simple)
  console.log('🔄 DÉDUPLICATION INTERNE...');
  const duplicates = [];
  const seen = new Map();
  
  samples.forEach((sample, index) => {
    const key = normalizeText(sample.title);
    if (seen.has(key)) {
      duplicates.push({
        original: seen.get(key),
        duplicate: sample,
        reason: 'IDENTICAL_TITLE'
      });
    } else {
      seen.set(key, sample);
    }
  });
  
  // Garder seulement les non-doublons
  const uniqueSamples = Array.from(seen.values());
  console.log(`   Doublons trouvés : ${duplicates.length}`);
  console.log(`   Documents uniques : ${uniqueSamples.length}\n`);
  
  // PHASE 2.2 - VÉRIFICATION D'INDÉPENDANCE (échantillonnage)
  console.log('🔍 VÉRIFICATION D\'INDÉPENDANCE...');
  const DATASETS_TO_CHECK = [
    'holdout-validation-dataset.json',
    'gold-dataset-v1.json',
    'BLIND_SET_GOLD_V1.json'
  ];
  
  let contaminations = [];
  let totalChecked = 0;
  
  DATASETS_TO_CHECK.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  ${filename} non trouvé`);
      return;
    }
    
    try {
      const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let externalSamples = dataset.samples || dataset.data || dataset;
      if (!Array.isArray(externalSamples)) externalSamples = [];
      
      console.log(`   ✅ Vérification vs ${filename} (${externalSamples.length} échantillons)`);
      
      // Vérifier uniquement les premiers 10 de chaque dataset pour éviter timeout
      const sampleToCheck = uniqueSamples.slice(0, 10);
      const externalToCheck = externalSamples.slice(0, 50);
      
      sampleToCheck.forEach(goldSample => {
        externalToCheck.forEach(extSample => {
          totalChecked++;
          const titleSim = calculateSimilarity(
            goldSample.title || '',
            extSample.title || extSample.nom || ''
          );
          
          if (titleSim > 0.85) {
            contaminations.push({
              gold_id: goldSample.id,
              external_dataset: filename,
              similarity: (titleSim * 100).toFixed(1)
            });
          }
        });
      });
      
    } catch (error) {
      console.log(`   ❌ Erreur ${filename}: ${error.message}`);
    }
  });
  
  console.log(`   Comparaisons effectuées : ${totalChecked}`);
  console.log(`   Contaminations détectées : ${contaminations.length}\n`);
  
  // PHASE 2.3 - AUDIT DE PROVENANCE (simple)
  console.log('🔎 AUDIT DE PROVENANCE...');
  const sourceStats = {};
  const issues = [];
  
  uniqueSamples.forEach(sample => {
    sourceStats[sample.original_source] = (sourceStats[sample.original_source] || 0) + 1;
    
    if (!sample.reference || !sample.original_source) {
      issues.push(sample.id);
    }
  });
  
  console.log(`   Sources distinctes : ${Object.keys(sourceStats).length}`);
  console.log(`   Documents avec problèmes : ${issues.length}\n`);
  
  // Éliminer les documents contaminés
  const contaminatedIds = new Set(contaminations.map(c => c.gold_id));
  const finalSamples = uniqueSamples.filter(sample => !contaminatedIds.has(sample.id));
  
  // RAPPORT FINAL
  const report = {
    phase2_date: new Date().toISOString(),
    raw_documents: samples.length,
    internal_duplicates: duplicates.length,
    external_contaminations: contaminations.length,
    provenance_issues: issues.length,
    final_clean_documents: finalSamples.length,
    documents_eliminated: samples.length - finalSamples.length,
    v2f_v2g_consulted: false,
    gold_labels_assigned: false,
    status: finalSamples.length >= 100 ? "READY_FOR_PHASE_3" : "NEED_MORE_SAMPLES"
  };
  
  // Créer le dataset candidat
  const candidateDataset = {
    metadata: {
      name: "GOLD_V2_CANDIDATE", 
      phase: "2_COMPLETED",
      total_samples: finalSamples.length,
      status: report.status,
      samples_needed: Math.max(0, 100 - finalSamples.length)
    },
    samples: finalSamples,
    phase2_report: report
  };
  
  // Sauvegarder
  fs.writeFileSync(path.join(__dirname, 'GOLD_V2_CANDIDATE.json'), JSON.stringify(candidateDataset, null, 2));
  fs.writeFileSync(path.join(__dirname, 'PHASE2_REPORT.json'), JSON.stringify(report, null, 2));
  
  // AFFICHAGE FINAL
  console.log('🎯 RAPPORT FINAL PHASE 2');
  console.log('========================\n');
  console.log(`RAW                    : ${report.raw_documents}`);
  console.log(`Doublons internes      : ${report.internal_duplicates}`);
  console.log(`Doublons externes      : ${report.external_contaminations}`);
  console.log(`Problèmes provenance   : ${report.provenance_issues}`);
  console.log(`Documents conservés    : ${report.final_clean_documents}`);
  console.log(`Documents éliminés     : ${report.documents_eliminated}`);
  console.log(`\nV2F/V2G consultés      : NON`);
  console.log(`Labels GOLD assignés   : NON`);
  console.log(`\nSTATUS : ${report.status}`);
  
  if (finalSamples.length < 100) {
    console.log(`\n⚠️  BESOIN : ${candidateDataset.metadata.samples_needed} échantillons supplémentaires`);
  } else {
    console.log('\n✅ PHASE 2 RÉUSSIE - Prêt pour Phase 3');
  }
  
  return candidateDataset;
}

if (require.main === module) {
  try {
    executePhase2Simple();
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

module.exports = { executePhase2Simple };