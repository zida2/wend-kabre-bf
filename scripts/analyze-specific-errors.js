/**
 * Analyse détaillée des cas d'erreur spécifiques du benchmark
 */

const { classifyWithDiagnostic } = require('./quick-test.js');

// Cas problématiques identifiés
const problemCases = [
  {
    id: 'false-positive-1',
    title: 'Avis de recrutement - Prestation de gardiennage pour bâtiments administratifs',
    description: 'Service de sécurité 24h/24 pour 5 bâtiments à Ouagadougou. Durée du contrat: 12 mois renouvelable.',
    source: 'fonction-publique.gov.bf',
    humanClassification: 'REVIEW',
    currentMachineResult: 'VALID',
    problemType: 'FALSE_POSITIVE'
  },
  {
    id: 'false-negative-1', 
    title: 'Acquisition de véhicules tout-terrain pour la Direction Régionale de l\'Agriculture',
    description: 'Achat de 10 véhicules 4x4 pour les missions de terrain des agents agricoles. Budget alloué: 280 000 000 FCFA.',
    source: 'agriculture.gov.bf',
    humanClassification: 'VALID',
    currentMachineResult: 'REVIEW',
    problemType: 'FALSE_NEGATIVE'
  },
  {
    id: 'false-negative-2',
    title: 'Travaux de réfection de la route nationale RN1 - Tronçon Ouagadougou-Kaya',
    description: 'Réparation et renforcement de la chaussée sur 85 km. Durée d\'exécution: 6 mois. Financement Banque Mondiale.',
    source: 'infrastructures.gov.bf', 
    humanClassification: 'VALID',
    currentMachineResult: 'REVIEW',
    problemType: 'FALSE_NEGATIVE'
  }
];

function analyzeSpecificErrors() {
  console.log('🔬 ANALYSE DÉTAILLÉE DES CAS PROBLÉMATIQUES');
  console.log('=' .repeat(80));
  
  problemCases.forEach((testCase, index) => {
    console.log(`\n📋 Cas ${index + 1}: ${testCase.problemType}`);
    console.log(`ID: ${testCase.id}`);
    console.log(`Titre: ${testCase.title}`);
    console.log(`Source: ${testCase.source}`);
    console.log(`Humain: ${testCase.humanClassification} → Machine: ${testCase.currentMachineResult}`);
    
    // Analyse avec le classificateur actuel
    const result = classifyWithDiagnostic(testCase.title, testCase.description, testCase.source);
    
    console.log(`\n🔍 DIAGNOSTIC DÉTAILLÉ:`);
    console.log(`Score final: ${result.score} (seuils: VALID≥1.5, REVIEW>-0.5, REJECT≤-0.5)`);
    console.log(`Confiance: ${Math.round(result.confidence * 100)}%`);
    
    // Breakdown détaillé
    console.log(`\n📊 COMPOSITION DU SCORE:`);
    console.log(`   Source: ${result.breakdown.sourceConfidence} × 0.3 = ${(result.breakdown.sourceConfidence * 0.3).toFixed(2)}`);
    console.log(`   Positifs: ${result.breakdown.positiveScore} × 0.4 = ${(result.breakdown.positiveScore * 0.4).toFixed(2)}`);
    console.log(`   Négatifs: ${result.breakdown.negativeScore} × 0.6 = -${(result.breakdown.negativeScore * 0.6).toFixed(2)}`);
    console.log(`   Total: ${result.breakdown.finalScore.toFixed(2)}`);
    
    // Signaux détectés
    if (result.signals.exclusions.length > 0) {
      console.log(`\n🚫 EXCLUSIONS CRITIQUES:`);
      result.signals.exclusions.forEach(exc => {
        console.log(`   - "${exc.pattern}" (${exc.category})`);
      });
    }
    
    if (result.signals.positive.length > 0) {
      console.log(`\n✅ INDICATEURS POSITIFS:`);
      result.signals.positive.forEach(pos => {
        console.log(`   - "${pos.pattern}" (+${pos.points} pts, ${pos.strength}, ${pos.category})`);
      });
    } else {
      console.log(`\n⚠️ AUCUN INDICATEUR POSITIF DÉTECTÉ`);
    }
    
    if (result.signals.negative.length > 0) {
      console.log(`\n❌ INDICATEURS NÉGATIFS:`);
      result.signals.negative.forEach(neg => {
        console.log(`   - "${neg.pattern}" (-${neg.points} pts, ${neg.category})`);
      });
    }
    
    // Analyse du problème
    console.log(`\n💡 ANALYSE DU PROBLÈME:`);
    if (testCase.problemType === 'FALSE_POSITIVE') {
      analyzeFalsePositive(testCase, result);
    } else if (testCase.problemType === 'FALSE_NEGATIVE') {
      analyzeFalseNegative(testCase, result);
    }
    
    console.log('\n' + '-'.repeat(80));
  });
  
  // Recommandations générales
  console.log('\n🎯 RECOMMANDATIONS DE CORRECTIONS');
  console.log('=' .repeat(80));
  
  generateCorrectiveRecommendations();
}

function analyzeFalsePositive(testCase, result) {
  console.log(`❌ PROBLÈME: Classé VALID au lieu de ${testCase.humanClassification}`);
  
  // Analyser pourquoi c'est classé VALID
  if (result.score >= 1.5) {
    console.log(`   Cause: Score trop élevé (${result.score} ≥ 1.5)`);
    
    if (result.breakdown.positiveScore > 0) {
      console.log(`   Détail: Les indicateurs positifs (+${result.breakdown.positiveScore}) dominent`);
      
      // Identifier les indicateurs problématiques
      result.signals.positive.forEach(pos => {
        if (pos.pattern === 'prestation de' && testCase.title.toLowerCase().includes('recrutement')) {
          console.log(`   ⚠️ CONFLIT: "prestation de" détecté mais contexte = recrutement`);
          console.log(`   💡 Solution: Ajouter "recrutement" comme exclusion contextuelle`);
        }
      });
    }
  }
  
  console.log(`   🔧 Actions proposées:`);
  console.log(`      1. Ajouter "recrutement" aux indicateurs négatifs forts`);
  console.log(`      2. Créer règle contextuelle: "prestation" + "recrutement" = négatif`);
  console.log(`      3. Renforcer la pondération des contextes d'emploi`);
}

function analyzeFalseNegative(testCase, result) {
  console.log(`📉 PROBLÈME: Classé ${result.classification} au lieu de VALID`);
  
  // Analyser pourquoi le score est trop faible
  if (result.score < 1.5) {
    console.log(`   Cause: Score insuffisant (${result.score} < 1.5)`);
    
    if (result.breakdown.positiveScore === 0) {
      console.log(`   Détail: Aucun indicateur positif détecté`);
      console.log(`   ⚠️ PROBLÈME: Mots-clés de marché non reconnus`);
      
      // Analyser les mots-clés manqués
      const title = testCase.title.toLowerCase();
      if (title.includes('acquisition') && !result.signals.positive.some(p => p.pattern.includes('acquisition'))) {
        console.log(`   💡 "acquisition" non détecté - indicateur manquant`);
      }
      if (title.includes('travaux') && !result.signals.positive.some(p => p.pattern.includes('travaux'))) {
        console.log(`   💡 "travaux" non détecté - indicateur trop strict`);
      }
    }
    
    if (result.breakdown.sourceConfidence < 0.5) {
      console.log(`   Détail: Source peu fiable (${result.breakdown.sourceConfidence})`);
      console.log(`   ⚠️ PROBLÈME: Sources gouvernementales sous-évaluées`);
    }
  }
  
  console.log(`   🔧 Actions proposées:`);
  console.log(`      1. Ajouter "acquisition" seul comme indicateur positif`);
  console.log(`      2. Élargir les variantes de "travaux de"`);  
  console.log(`      3. Améliorer la confiance des sources .gov.bf`);
  console.log(`      4. Considérer baisser légèrement le seuil VALID`);
}

function generateCorrectiveRecommendations() {
  console.log('🔧 PLAN DE CORRECTIONS PRIORITAIRES:');
  console.log('\n1. RÉDUIRE LES FAUX POSITIFS (recrutement)');
  console.log('   - Ajouter "recrutement" aux indicateurs négatifs forts (-3 pts)');
  console.log('   - Créer règle: "prestation" + "recrutement" = contexte emploi');
  console.log('   - Objectif: "Avis de recrutement" → REVIEW ou REJECTED');
  
  console.log('\n2. RÉCUPÉRER LES FAUX NÉGATIFS (acquisition/travaux)');
  console.log('   - Ajouter "acquisition" seul (+2 pts)');
  console.log('   - Élargir "travaux" : "travaux de", "travaux d\'", "refection"'); 
  console.log('   - Objectif: Marchés BTP/équipement bien détectés');
  
  console.log('\n3. AMÉLIORER L\'ÉVALUATION DES SOURCES');
  console.log('   - Ajouter domaines .gov.bf aux sources fiables');
  console.log('   - Distinguer ministères techniques vs communication');
  console.log('   - Objectif: Sources gouvernementales mieux évaluées');
  
  console.log('\n4. CALIBRER LES SEUILS (après corrections 1-3)');
  console.log('   - Tester différents seuils sur dataset de référence');
  console.log('   - Objectif: pollution < 5% ET recall > 85%');
  
  console.log('\n5. AJOUTER DES RÈGLES CONTEXTUELLES');
  console.log('   - "prestation de gardiennage" = service, pas marché construction');
  console.log('   - "acquisition de véhicules" = marché équipement clair');
  console.log('   - Objectif: Nuancer selon le type d\'objet');
}

// Exécution
if (require.main === module) {
  analyzeSpecificErrors();
}

module.exports = { analyzeSpecificErrors, problemCases };