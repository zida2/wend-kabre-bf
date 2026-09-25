/**
 * Test simple de la classification des marchés
 */

// Simulation des fonctions (version simplifiée pour test)
function normalizeText(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function isRealTender(title, description, source) {
  const fullText = normalizeText(`${title} ${description}`);
  const src = normalizeText(source || '');
  
  console.log(`\n🔍 Analyse: "${title.substring(0, 60)}..."`);
  console.log(`   Source: ${source}`);
  
  // Exclusions critiques
  const criticalExclusions = [
    'soutenance', 'these', 'master', 'doctorat', 'memoire', 'universite',
    'nomination', 'nomme', 'decret', 'arrete', 'communique de presse',
    'deces', 'condoleance', 'necrologie', 'ceremonie', 'inauguration'
  ];
  
  for (const exclusion of criticalExclusions) {
    if (fullText.includes(exclusion)) {
      console.log(`   ❌ REJETÉ - Exclusion: "${exclusion}"`);
      return false;
    }
  }
  
  // Indicateurs positifs
  const positiveIndicators = [
    'appel d\'offres', 'appel d offres', 'demande de cotation', 'avis de recrutement',
    'acquisition de', 'fourniture de', 'prestation de service', 'prestation de',
    'travaux de construction', 'travaux de', 'marche public', 'dao',
    'manifestation d\'interet', 'consultation', 'soumission'
  ];
  
  let positiveScore = 0;
  positiveIndicators.forEach(indicator => {
    if (fullText.includes(normalizeText(indicator))) {
      positiveScore += 3;
      console.log(`   ✅ +3 points: "${indicator}"`);
    }
  });
  
  // Indicateurs négatifs
  const negativeIndicators = [
    'formation', 'seminaire', 'atelier', 'actualite', 'information'
  ];
  
  let negativeScore = 0;
  negativeIndicators.forEach(indicator => {
    if (fullText.includes(indicator)) {
      negativeScore += 2;
      console.log(`   ⚠️ -2 points: "${indicator}"`);
    }
  });
  
  const finalScore = positiveScore - negativeScore;
  const decision = finalScore >= 3; // Baissé de 6 à 3
  
  console.log(`   📊 Score final: ${finalScore} → ${decision ? 'ACCEPTÉ' : 'REJETÉ'}`);
  
  return decision;
}

// Échantillons de test
const testSamples = [
  {
    title: 'Appel d\'offres pour fourniture de matériel informatique au profit du Ministère de la Santé',
    description: 'Acquisition d\'ordinateurs, imprimantes et équipements réseau. Montant estimé: 25 000 000 FCFA.',
    source: 'dgcmef.gov.bf',
    expected: true,
    category: 'Vrai marché'
  },
  {
    title: 'Travaux de réfection de la Route Nationale 1 - Tronçon Ouagadougou-Koudougou', 
    description: 'Réparation et renforcement de la chaussée sur 85 km. Durée d\'exécution: 6 mois.',
    source: 'infrastructures.gov.bf',
    expected: true,
    category: 'Vrai marché'
  },
  {
    title: 'Soutenance de thèse de Master en Informatique - Université Joseph Ki-Zerbo',
    description: 'Présentation des travaux de recherche sur les algorithmes d\'apprentissage automatique.',
    source: 'univ-ouaga.bf',
    expected: false,
    category: 'Événement académique'
  },
  {
    title: 'Communiqué de presse - Nomination du nouveau Directeur Général des Impôts',
    description: 'Le Gouvernement annonce la nomination de M. Jean Baptiste OUEDRAOGO.',
    source: 'finances.gov.bf',
    expected: false,
    category: 'Communication officielle'
  },
  {
    title: 'Prestation de formation en gestion de projet pour les cadres du Ministère',
    description: 'Formation de 5 jours sur les méthodes PRINCE2 et PMI. Budget alloué: 8 000 000 FCFA.',
    source: 'infrastructures.gov.bf',
    expected: null, // Cas ambigu
    category: 'Cas limite'
  }
];

// Exécution des tests
console.log('🚀 TEST DE CLASSIFICATION DES MARCHÉS PUBLICS');
console.log('='.repeat(60));

let correct = 0;
let total = 0;
let ambiguous = 0;

testSamples.forEach((sample, index) => {
  console.log(`\n📄 Test ${index + 1}/${testSamples.length} - ${sample.category}`);
  
  const result = isRealTender(sample.title, sample.description, sample.source);
  
  if (sample.expected === null) {
    console.log(`   ℹ️ Cas ambigu - Résultat: ${result ? 'ACCEPTÉ' : 'REJETÉ'}`);
    ambiguous++;
  } else {
    const isCorrect = result === sample.expected;
    if (isCorrect) {
      console.log(`   ✅ CORRECT`);
      correct++;
    } else {
      console.log(`   ❌ ERREUR - Attendu: ${sample.expected ? 'ACCEPTÉ' : 'REJETÉ'}, Obtenu: ${result ? 'ACCEPTÉ' : 'REJETÉ'}`);
    }
    total++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSULTATS FINAUX');
console.log('='.repeat(60));
console.log(`✅ Tests corrects: ${correct}/${total} (${Math.round(correct/total*100)}%)`);
console.log(`❓ Cas ambigus: ${ambiguous}`);
console.log(`📈 Précision: ${correct === total ? 'PARFAITE' : correct/total >= 0.8 ? 'BONNE' : 'À AMÉLIORER'}`);

if (correct === total) {
  console.log('\n🎉 Tous les tests sont réussis ! Le classificateur fonctionne correctement.');
} else {
  console.log('\n⚠️ Certains tests ont échoué. Ajustements nécessaires.');
}

console.log('\n💡 RECOMMANDATIONS:');
console.log('- Tester avec plus de données réelles du scraping');
console.log('- Ajuster les seuils selon les résultats observés'); 
console.log('- Implémenter un système de révision manuelle pour les cas ambigus');
console.log('- Monitorer la performance en production avec des métriques continues');