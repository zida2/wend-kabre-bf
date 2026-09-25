/**
 * VÉRIFICATION D'INDÉPENDANCE - BLIND SET GOLD V1
 * 
 * MISSION : S'assurer qu'aucun échantillon ne provient des datasets précédents
 * CRITÈRE : Indépendance totale pour validation non biaisée
 */

const fs = require('fs');
const path = require('path');

// Datasets à vérifier pour contamination
const DATASETS_TO_CHECK = [
  'holdout-validation-dataset.json',
  'gold-dataset-v1.json', 
  'real-data-samples.json',
  'final-test-dataset.json',
  'shadow-dataset-v2d.json'
];

// Fonction de normalisation pour comparaison
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

// Fonction de calcul de similarité (Jaccard)
function calculateSimilarity(text1, text2) {
  const words1 = new Set(normalizeText(text1).split(' '));
  const words2 = new Set(normalizeText(text2).split(' '));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Vérification d'indépendance
function verifyIndependence() {
  const blindSetPath = path.join(__dirname, 'BLIND_SET_GOLD_V1.json');
  
  if (!fs.existsSync(blindSetPath)) {
    throw new Error("BLIND_SET_GOLD_V1.json n'existe pas");
  }
  
  const blindSet = JSON.parse(fs.readFileSync(blindSetPath, 'utf8'));
  
  console.log('🔍 VÉRIFICATION D\'INDÉPENDANCE - BLIND SET GOLD V1');
  console.log('================================================\n');
  
  const contaminations = [];
  let totalChecked = 0;
  
  // Charger tous les datasets existants
  const existingDatasets = {};
  DATASETS_TO_CHECK.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    if (fs.existsSync(filepath)) {
      try {
        const dataset = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        existingDatasets[filename] = dataset;
        console.log(`✅ Dataset chargé : ${filename}`);
      } catch (error) {
        console.log(`⚠️  Erreur lecture ${filename}: ${error.message}`);
      }
    } else {
      console.log(`ℹ️  Dataset non trouvé : ${filename}`);
    }
  });
  
  console.log(`\n🔍 Vérification de ${blindSet.samples.length} échantillons du Blind Set...\n`);
  
  // Vérifier chaque échantillon du Blind Set
  blindSet.samples.forEach(blindSample => {
    Object.entries(existingDatasets).forEach(([datasetName, dataset]) => {
      let samplesToCheck = [];
      
      // Extraire les échantillons selon la structure du dataset
      if (Array.isArray(dataset)) {
        samplesToCheck = dataset;
      } else if (dataset.samples) {
        samplesToCheck = dataset.samples;
      } else if (dataset.data) {
        samplesToCheck = dataset.data;
      }
      
      samplesToCheck.forEach(existingSample => {
        totalChecked++;
        
        // Comparaison titre
        const titleSimilarity = calculateSimilarity(
          blindSample.title || '', 
          existingSample.title || existingSample.nom || ''
        );
        
        // Comparaison description
        const descSimilarity = calculateSimilarity(
          blindSample.description || '', 
          existingSample.description || existingSample.description_complete || existingSample.details || ''
        );
        
        // Seuil de contamination (similarité > 80%)
        const CONTAMINATION_THRESHOLD = 0.8;
        
        if (titleSimilarity > CONTAMINATION_THRESHOLD || descSimilarity > CONTAMINATION_THRESHOLD) {
          contaminations.push({
            blind_id: blindSample.id,
            blind_title: blindSample.title,
            contaminated_dataset: datasetName,
            existing_id: existingSample.id || existingSample.reference || 'unknown',
            existing_title: existingSample.title || existingSample.nom || 'unknown',
            title_similarity: (titleSimilarity * 100).toFixed(1),
            desc_similarity: (descSimilarity * 100).toFixed(1)
          });
        }
      });
    });
  });
  
  // Rapport final
  const independenceReport = {
    verification_date: new Date().toISOString(),
    blind_set_samples: blindSet.samples.length,
    datasets_checked: Object.keys(existingDatasets).length,
    total_comparisons: totalChecked,
    contaminations_found: contaminations.length,
    independence_status: contaminations.length === 0 ? "VERIFIED - INDEPENDENT" : "CONTAMINATED",
    contamination_details: contaminations
  };
  
  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, 'BLIND_SET_GOLD_V1_INDEPENDENCE_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(independenceReport, null, 2));
  
  // Mettre à jour les métadonnées du Blind Set
  blindSet.metadata.independence_verification = {
    status: independenceReport.independence_status,
    verification_date: independenceReport.verification_date,
    contaminations_count: contaminations.length
  };
  fs.writeFileSync(blindSetPath, JSON.stringify(blindSet, null, 2));
  
  return independenceReport;
}

// Fonction pour procéder au FREEZE si indépendance vérifiée
function freezeIfIndependent() {
  const blindSetPath = path.join(__dirname, 'BLIND_SET_GOLD_V1.json');
  const blindSet = JSON.parse(fs.readFileSync(blindSetPath, 'utf8'));
  
  const canFreeze = (
    blindSet.metadata.labeling_status.includes("COMPLETED") &&
    blindSet.metadata.independence_verification?.status === "VERIFIED - INDEPENDENT"
  );
  
  if (canFreeze) {
    blindSet.metadata.frozen = true;
    blindSet.metadata.freeze_date = new Date().toISOString();
    blindSet.metadata.validation_ready = true;
    
    // Verrouiller tous les échantillons
    blindSet.samples.forEach(sample => {
      sample.frozen = true;
    });
    
    fs.writeFileSync(blindSetPath, JSON.stringify(blindSet, null, 2));
    
    console.log('🔒 BLIND SET GOLD V1 FROZEN !');
    console.log('   ✅ Labels assignés');
    console.log('   ✅ Indépendance vérifiée'); 
    console.log('   ✅ Dataset verrouillé');
    console.log('   🚀 PRÊT POUR VALIDATION V2F vs V2G');
    
    return true;
  } else {
    console.log('❌ FREEZE IMPOSSIBLE :');
    if (!blindSet.metadata.labeling_status.includes("COMPLETED")) {
      console.log('   - Labels non complétés');
    }
    if (!blindSet.metadata.independence_verification?.status.includes("VERIFIED")) {
      console.log('   - Indépendance non vérifiée ou contamination détectée');
    }
    return false;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  try {
    const report = verifyIndependence();
    
    if (report.contaminations_found === 0) {
      console.log('✅ INDÉPENDANCE VÉRIFIÉE !');
      console.log(`   🔍 ${report.total_comparisons} comparaisons effectuées`);
      console.log(`   📊 ${report.datasets_checked} datasets vérifiés`);
      console.log('   🆔 Aucune contamination détectée\n');
      
      // Procéder au freeze automatiquement
      freezeIfIndependent();
      
    } else {
      console.log('❌ CONTAMINATION DÉTECTÉE !');
      console.log(`   🚨 ${report.contaminations_found} contaminations trouvées`);
      console.log('   📋 Détails dans BLIND_SET_GOLD_V1_INDEPENDENCE_REPORT.json\n');
      
      console.log('🔍 CONTAMINATIONS DÉTECTÉES :');
      report.contamination_details.forEach(cont => {
        console.log(`   - ${cont.blind_id}: Similaire à ${cont.contaminated_dataset}`);
        console.log(`     Titre: ${cont.title_similarity}% | Desc: ${cont.desc_similarity}%`);
      });
      
      console.log('\n⚠️  ACTION REQUISE : Remplacer les échantillons contaminés');
    }
    
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
  }
}

module.exports = { verifyIndependence, freezeIfIndependent };