/**
 * Analyse du problème V2C et création de V2C-fix
 * Le cas gardiennage passe en REJECTED au lieu de REVIEW
 */

function analyzeV2CProblem() {
  console.log('🔬 ANALYSE DU PROBLÈME V2C');
  console.log('=' .repeat(60));
  
  const problematicCase = {
    title: 'Avis de recrutement - Prestation de gardiennage pour bâtiments administratifs',
    description: 'Service de sécurité 24h/24 pour 5 bâtiments à Ouagadougou. Durée du contrat: 12 mois renouvelable.',
    source: 'fonction-publique.gov.bf',
    expected: 'REVIEW'
  };
  
  console.log(`📋 Cas problématique:`);
  console.log(`Titre: ${problematicCase.title}`);
  console.log(`Attendu: ${problematicCase.expected}`);
  
  // Simulation du traitement V2C
  const fullText = `${problematicCase.title} ${problematicCase.description}`.toLowerCase();
  
  // Analyse des signaux d'intention
  console.log('\n🧠 ANALYSE D\'INTENTION V2C:');
  
  const recruitmentTerms = [
    { term: 'avis de recrutement', weight: 4, detected: fullText.includes('avis de recrutement') },
    { term: 'recrutement', weight: 3, detected: fullText.includes('recrutement') },
    { term: 'agent', weight: 2, detected: fullText.includes('agent') },
    { term: 'personnel', weight: 2, detected: fullText.includes('personnel') }
  ];
  
  const marketTerms = [
    { term: 'prestation', weight: 2, detected: fullText.includes('prestation') },
    { term: 'service', weight: 1, detected: fullText.includes('service') },
    { term: 'contrat', weight: 1, detected: fullText.includes('contrat') },
    { term: 'duree', weight: 1, detected: fullText.includes('duree') }
  ];
  
  let recruitmentScore = 0;
  let marketScore = 0;
  
  console.log('\n📊 Signaux détectés:');
  console.log('RECRUTEMENT:');
  recruitmentTerms.forEach(term => {
    if (term.detected) {
      recruitmentScore += term.weight;
      console.log(`  ✅ "${term.term}" (+${term.weight})`);
    }
  });
  
  console.log('MARCHÉ:');
  marketTerms.forEach(term => {
    if (term.detected) {
      marketScore += term.weight;
      console.log(`  ✅ "${term.term}" (+${term.weight})`);
    }
  });
  
  console.log(`\nScores: Recrutement=${recruitmentScore}, Marché=${marketScore}`);
  
  // Analyse du problème
  console.log('\n🔍 DIAGNOSTIC:');
  console.log(`1. Signaux recrutement (${recruitmentScore}) > signaux marché (${marketScore})`);
  console.log(`2. Intention primaire = RECRUITMENT`);
  console.log(`3. Règle V2C: "RECRUITMENT + signaux marché" → pénalité -1`);
  console.log(`4. Score final probablement négatif → REJECTED`);
  console.log(`5. MAIS humain dit REVIEW car c'est un cas limite !`);
  
  console.log('\n💡 PROBLÈME IDENTIFIÉ:');
  console.log('V2C est trop agressive sur les cas "recrutement de prestataire"');
  console.log('Elle ne distingue pas:');
  console.log('  - Recrutement direct (agent) → REJECTED ✅');
  console.log('  - Recrutement prestataire (service) → REVIEW ✅');
  
  return {
    recruitmentScore,
    marketScore,
    primaryIntent: recruitmentScore > marketScore ? 'RECRUITMENT' : 'MARKET',
    isAmbiguous: recruitmentScore >= 3 && marketScore >= 3
  };
}

function createV2CFix() {
  console.log('\n🔧 SOLUTION V2C-FIX:');
  console.log('=' .repeat(50));
  
  console.log('1. DISTINCTION FINE DU TYPE DE RECRUTEMENT:');
  console.log('   - Recrutement direct: "agent", "personnel", "emploi" → REJECTED');
  console.log('   - Recrutement prestataire: "prestation", "service" → REVIEW');
  
  console.log('\n2. NOUVELLE LOGIQUE D\'INTENTION:');
  console.log('   - Si RECRUITMENT + "prestation/service" → Intention = SERVICE_OUTSOURCING');  
  console.log('   - SERVICE_OUTSOURCING → toujours REVIEW (jamais REJECTED)');
  
  console.log('\n3. RÈGLES AJUSTÉES:');
  console.log('   - Ambiguïté SERVICE_OUTSOURCING → REVIEW forcé');
  console.log('   - Seuils plus tolérants pour cas limites');
  
  console.log('\n4. OBJECTIF:');
  console.log('   - "Avis recrutement gardiennage" → REVIEW ✅');
  console.log('   - "Poste vacant comptable" → REJECTED ✅');
  console.log('   - Maintenir recall 100% sur vrais marchés');
}

function generateV2CFixCode() {
  return `
// V2C-FIX: Nouvelle logique d'intention avec distinction fine

// Analyse du type de recrutement
let recruitmentType = 'DIRECT';
if (fullText.includes('prestation') || fullText.includes('service') || 
    fullText.includes('gardiennage') || fullText.includes('securite')) {
  recruitmentType = 'SERVICE_OUTSOURCING';
}

// Intention primaire ajustée
if (recruitmentScore >= ambiguityThreshold && marketScore >= ambiguityThreshold) {
  result.intentAnalysis.isAmbiguous = true;
  
  if (recruitmentType === 'SERVICE_OUTSOURCING') {
    result.intentAnalysis.primaryIntent = 'SERVICE_OUTSOURCING';
  } else {
    result.intentAnalysis.primaryIntent = 'AMBIGUOUS';
  }
} 
// ... autres cas

// Ajustements d'intention V2C-FIX
if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
  // Cas spécial: recrutement de prestataire = marché déguisé
  intentAdjustment += 0; // Neutre, laisser autres signaux décider
  result.reasons.push('Recrutement de prestataire détecté → évaluation neutre');
  
} else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && recruitmentType === 'DIRECT') {
  // Vrai recrutement direct
  intentAdjustment -= 1.5;
  result.reasons.push('Recrutement direct → pénalité forte');
}

// Logique finale V2C-FIX
if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
  // Force en REVIEW sauf si score très élevé
  if (finalScore >= 2.5) {
    result.classification = 'VALID';
  } else {
    result.classification = 'REVIEW';
    result.reasons.push('Recrutement de prestataire → révision manuelle');
  }
} else {
  // Logique normale...
}
`;
}

// Exécution
if (require.main === module) {
  const analysis = analyzeV2CProblem();
  createV2CFix();
  
  console.log('\n📋 CODE V2C-FIX:');
  console.log(generateV2CFixCode());
  
  console.log('\n🎯 PROCHAINE ÉTAPE:');
  console.log('Implémenter V2C-FIX et tester sur le même dataset');
  console.log('Objectif: gardiennage → REVIEW, pollution < 5%');
}

module.exports = { analyzeV2CProblem, createV2CFix };