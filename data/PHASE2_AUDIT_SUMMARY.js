/**
 * RÉSUMÉ D'AUDIT PHASE 2 - Pour vérification manuelle
 * Génère un échantillon représentatif pour audit humain
 */

const fs = require('fs');
const path = require('path');

function generateAuditSummary() {
  const candidatePath = path.join(__dirname, 'GOLD_V2_CANDIDATE.json');
  const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
  
  console.log('📋 RÉSUMÉ D\'AUDIT PHASE 2 - GOLD V2 CANDIDATE');
  console.log('==============================================\n');
  
  // Vérifications de base
  console.log('🔍 VÉRIFICATIONS STRUCTURELLES:');
  console.log(`   Nombre total d'échantillons: ${candidate.samples.length}`);
  console.log(`   Phase déclarée: ${candidate.metadata.phase}`);
  console.log(`   Status: ${candidate.metadata.status}\n`);
  
  // Analyse des sources
  const sourceStats = {};
  const referencePatterns = {};
  
  candidate.samples.forEach(sample => {
    sourceStats[sample.original_source] = (sourceStats[sample.original_source] || 0) + 1;
    
    if (sample.reference) {
      const pattern = sample.reference.split('-')[0];
      referencePatterns[pattern] = (referencePatterns[pattern] || 0) + 1;
    }
  });
  
  console.log('📊 ANALYSE DES SOURCES:');
  console.log(`   Sources distinctes: ${Object.keys(sourceStats).length}`);
  console.log('   Top 5 sources:');
  Object.entries(sourceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([source, count]) => {
      console.log(`     ${source}: ${count} documents`);
    });
  
  console.log('\n📋 TYPES DE RÉFÉRENCES:');
  Object.entries(referencePatterns).forEach(([pattern, count]) => {
    console.log(`   ${pattern}: ${count} documents`);
  });
  
  // ÉCHANTILLON REPRÉSENTATIF pour audit manuel
  console.log('\n🔍 ÉCHANTILLON REPRÉSENTATIF (10 documents pour audit):');
  console.log('======================================================\n');
  
  // Sélectionner 10 échantillons variés
  const sampleForAudit = [
    candidate.samples[0], // Premier
    candidate.samples[9], // 10e
    candidate.samples[19], // 20e
    candidate.samples[29], // 30e  
    candidate.samples[39], // 40e
    candidate.samples[49], // 50e
    candidate.samples[59], // 60e
    candidate.samples[69], // 70e
    candidate.samples[79], // 80e
    candidate.samples[99]  // Dernier
  ];
  
  sampleForAudit.forEach((sample, idx) => {
    console.log(`${idx + 1}. ID: ${sample.id}`);
    console.log(`   Titre: ${sample.title}`);
    console.log(`   Source: ${sample.original_source}`);
    console.log(`   Référence: ${sample.reference}`);
    console.log(`   Description: ${sample.description.substring(0, 100)}...`);
    console.log('');
  });
  
  // Vérifications de conformité
  console.log('✅ CONFORMITÉ PROTOCOLE PHASE 2:');
  let conformityIssues = 0;
  
  candidate.samples.forEach(sample => {
    if (sample.gold_label || sample.human_label || sample.predicted_label) {
      conformityIssues++;
    }
  });
  
  console.log(`   Échantillons avec labels prématurés: ${conformityIssues}`);
  console.log(`   raw_category défini: ${candidate.samples.filter(s => s.raw_category !== null).length}`);
  console.log(`   human_verified à true: ${candidate.samples.filter(s => s.human_verified === true).length}`);
  
  // Détection de patterns suspects
  console.log('\n🚨 DÉTECTION DE PATTERNS SUSPECTS:');
  const titleWords = {};
  const suspiciousPatterns = [];
  
  candidate.samples.forEach(sample => {
    const words = sample.title.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 3) {
        titleWords[word] = (titleWords[word] || 0) + 1;
      }
    });
    
    // Vérifier si le texte semble généré automatiquement
    if (sample.description.includes('dans le cadre du renforcement') && 
        sample.description.includes('pour accompagner')) {
      suspiciousPatterns.push(`${sample.id}: Possiblement généré (template détecté)`);
    }
  });
  
  // Top mots fréquents (peut révéler des templates)
  const topWords = Object.entries(titleWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('   Mots les plus fréquents dans les titres:');
  topWords.forEach(([word, count]) => {
    console.log(`     "${word}": ${count} occurrences`);
  });
  
  if (suspiciousPatterns.length > 0) {
    console.log(`   ⚠️  Templates suspects détectés: ${suspiciousPatterns.length}`);
    suspiciousPatterns.slice(0, 3).forEach(pattern => console.log(`     ${pattern}`));
  } else {
    console.log('   ✅ Aucun template suspect détecté');
  }
  
  // VERDICT D'AUDIT
  console.log('\n🎯 VERDICT PRÉLIMINAIRE:');
  if (conformityIssues === 0 && suspiciousPatterns.length === 0) {
    console.log('   ✅ PHASE 2 SEMBLE CONFORME');
    console.log('   ✅ Aucun label prématuré détecté');
    console.log('   ✅ Aucun template évident');
    console.log('   ➡️  PEUT PROCÉDER À LA PHASE 3');
  } else {
    console.log('   ⚠️  PROBLÈMES DÉTECTÉS');
    console.log(`   ❌ Labels prématurés: ${conformityIssues}`);
    console.log(`   ❌ Templates suspects: ${suspiciousPatterns.length}`);
    console.log('   ⛔ NE PAS PROCÉDER À LA PHASE 3');
  }
  
  console.log('\n📝 POUR VALIDATION COMPLÈTE:');
  console.log('   1. Vérifier manuellement les 10 échantillons ci-dessus');
  console.log('   2. Confirmer que les sources sont réelles et variées');
  console.log('   3. Vérifier qu\'aucun V2F/V2G n\'a été consulté');
  console.log('   4. Confirmer l\'absence de labels GOLD prématurés');
  
  return {
    total_samples: candidate.samples.length,
    source_count: Object.keys(sourceStats).length,
    conformity_issues: conformityIssues,
    suspicious_patterns: suspiciousPatterns.length,
    ready_for_phase3: conformityIssues === 0 && suspiciousPatterns.length === 0
  };
}

if (require.main === module) {
  generateAuditSummary();
}

module.exports = { generateAuditSummary };