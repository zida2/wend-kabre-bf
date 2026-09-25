#!/usr/bin/env node

/**
 * Script de test de la qualité des données
 * Exécute un benchmark complet sur des données réelles
 */

const { DataBenchmark, BenchmarkSample, MANUAL_CLASSIFICATIONS, MatchScoreBenchmark } = require('../src/lib/dataBenchmark.js');
const { calculateMatchScore } = require('../src/lib/matchScore.js');
const fs = require('fs').promises;

// Échantillons de test réalistes basés sur le contexte burkinabé
const TEST_SAMPLES = [
  // === VRAIS MARCHÉS PUBLICS ===
  {
    id: 'market-001',
    content: {
      title: 'Appel d\'offres ouvert pour fourniture de matériel informatique au profit du Ministère de la Santé',
      description: 'Acquisition d\'ordinateurs, imprimantes et équipements réseau. Montant estimé: 25 000 000 FCFA. Date limite de soumission: 15 jours.',
      source: 'dgcmef.gov.bf',
      category: 'fourniture'
    },
    manual: MANUAL_CLASSIFICATIONS.VALID,
    notes: 'Marché officiel classique'
  },
  
  {
    id: 'market-002', 
    content: {
      title: 'Demande de cotation pour travaux de réfection de la Route Nationale 1 - Tronçon Ouagadougou-Koudougou',
      description: 'Réparation et renforcement de la chaussée sur 85 km. Durée d\'exécution: 6 mois.',
      source: 'infrastructures.gov.bf',
      category: 'travaux'
    },
    manual: MANUAL_CLASSIFICATIONS.VALID,
    notes: 'Marché BTP infrastructure'
  },
  
  {
    id: 'market-003',
    content: {
      title: 'Avis de recrutement - Prestation de service de gardiennage pour les bâtiments administratifs',
      description: 'Service de sécurité 24h/24 pour 5 bâtiments à Ouagadougou. Durée du contrat: 12 mois renouvelable.',
      source: 'fonction-publique.gov.bf',
      category: 'prestation'
    },
    manual: MANUAL_CLASSIFICATIONS.VALID,
    notes: 'Marché de service'
  },

  // === CONTENUS À REJETER ===
  {
    id: 'reject-001',
    content: {
      title: 'Soutenance de thèse de Master en Informatique - Université Joseph Ki-Zerbo',
      description: 'Présentation des travaux de recherche sur "Les algorithmes d\'apprentissage automatique pour la détection de fraudes". Date: 20 décembre 2024.',
      source: 'univ-ouaga.bf',
      category: 'academique'
    },
    manual: MANUAL_CLASSIFICATIONS.REJECTED,
    notes: 'Événement académique'
  },
  
  {
    id: 'reject-002',
    content: {
      title: 'Communiqué de presse - Nomination du nouveau Directeur Général des Impôts',
      description: 'Le Gouvernement annonce la nomination de M. Jean Baptiste OUEDRAOGO au poste de Directeur Général des Impôts.',
      source: 'finances.gov.bf', 
      category: 'nomination'
    },
    manual: MANUAL_CLASSIFICATIONS.REJECTED,
    notes: 'Communiqué administratif'
  },
  
  {
    id: 'reject-003',
    content: {
      title: 'Avis de décès - Rappel à Dieu de l\'ancien Ministre de l\'Agriculture',
      description: 'La famille KABORE informe du décès de leur père, survenu le 15 décembre 2024 à Ouagadougou.',
      source: 'info.bf',
      category: 'necrologie'
    },
    manual: MANUAL_CLASSIFICATIONS.REJECTED,
    notes: 'Faire-part de décès'
  },

  // === CAS AMBIGUS (À RÉVISER) ===
  {
    id: 'review-001',
    content: {
      title: 'Prestation de formation en gestion de projet pour les cadres du Ministère des Infrastructures',
      description: 'Formation de 5 jours sur les méthodes PRINCE2 et PMI. Public cible: 30 cadres supérieurs. Budget alloué: 8 000 000 FCFA.',
      source: 'infrastructures.gov.bf',
      category: 'formation'
    },
    manual: MANUAL_CLASSIFICATIONS.REVIEW,
    notes: 'Formation = service public, mais mot-clé négatif'
  },
  
  {
    id: 'review-002',
    content: {
      title: 'Étude de faisabilité pour la construction du pont de Kongoussi',
      description: 'Mission d\'étude technique et environnementale préalable à la construction. Durée: 3 mois.',
      source: 'equipement.gov.bf',
      category: 'etude'
    },
    manual: MANUAL_CLASSIFICATIONS.REVIEW,
    notes: 'Étude vs travaux - limite floue'
  },
  
  {
    id: 'review-003',
    content: {
      title: 'Acquisition de fournitures scolaires - Direction Provinciale de l\'Éducation du Kadiogo',
      description: 'Achat de cahiers, stylos et matériel pédagogique pour les écoles primaires. Montant: 15 000 000 FCFA.',
      source: 'education-kadiogo.bf',
      category: 'fourniture'
    },
    manual: MANUAL_CLASSIFICATIONS.REVIEW,
    notes: 'Marché local vs national - niveau administratif'
  },

  // === VRAIS MARCHÉS SUPPLÉMENTAIRES ===
  {
    id: 'market-004',
    content: {
      title: 'Manifestation d\'intérêt pour la construction de forages d\'eau potable dans la région du Sahel',
      description: 'Construction de 50 forages équipés de pompes manuelles. Zones rurales prioritaires. Financement Banque Mondiale.',
      source: 'eau-assainissement.gov.bf',
      category: 'travaux'
    },
    manual: MANUAL_CLASSIFICATIONS.VALID,
    notes: 'Projet hydraulique rural'
  },
  
  {
    id: 'market-005',
    content: {
      title: 'Appel d\'offres restreint - Fourniture et installation de panneaux solaires pour l\'électrification rurale',
      description: 'Équipement de 25 villages en énergie solaire. Puissance totale: 500 kWc. Maintenance 5 ans incluse.',
      source: 'energie.gov.bf',
      category: 'fourniture'
    },
    manual: MANUAL_CLASSIFICATIONS.VALID,
    notes: 'Marché énergie renouvelable'
  }
];

// Profils de test pour le matching
const TEST_PROFILES = [
  {
    id: 'profile-a',
    companyName: 'InnovaTech SARL',
    sector: 'Informatique',
    region: 'Centre',
    commune: 'Ouagadougou', 
    budgetMin: 5000000,
    budgetMax: 50000000,
    keywords: ['informatique', 'logiciel', 'réseau', 'maintenance']
  },
  
  {
    id: 'profile-b', 
    companyName: 'BTP Sahel SA',
    sector: 'Construction',
    region: 'Sahel',
    commune: 'Dori',
    budgetMin: 50000000,
    budgetMax: 500000000,
    keywords: ['construction', 'bâtiment', 'route', 'infrastructure']
  },
  
  {
    id: 'profile-c',
    companyName: 'Services Plus',
    sector: 'Services',
    region: 'Centre',
    commune: 'Ouagadougou',
    budgetMin: 1000000, 
    budgetMax: 25000000,
    keywords: ['gardiennage', 'nettoyage', 'sécurité', 'maintenance']
  }
];

async function runFullBenchmark() {
  console.log('🚀 Démarrage du benchmark complet de qualité des données\n');
  
  // === TEST 1: CLASSIFICATION DES MARCHÉS ===
  console.log('📊 Test 1: Classification des contenus');
  console.log('=' .repeat(50));
  
  const benchmark = new DataBenchmark();
  
  // Ajout des échantillons
  for (const sample of TEST_SAMPLES) {
    const benchmarkSample = new BenchmarkSample(
      sample.id,
      sample.content,
      sample.manual,
      sample.notes
    );
    benchmark.addSample(benchmarkSample);
  }
  
  // Exécution du benchmark
  const results = await benchmark.runBenchmark();
  const report = benchmark.generateReport();
  
  console.log(report);
  
  // Sauvegarde des résultats
  await fs.writeFile(
    'benchmark-classification-results.md',
    report,
    'utf8'
  );
  
  // === TEST 2: SCORES DE MATCHING ===
  console.log('\n🎯 Test 2: Scores de matching');
  console.log('=' .repeat(50));
  
  const matchBenchmark = new MatchScoreBenchmark();
  
  // Ajout des profils et marchés de test
  TEST_PROFILES.forEach(profile => matchBenchmark.addProfile(profile.id, profile));
  
  // Convertir les échantillons valides en marchés pour le matching
  const validMarkets = TEST_SAMPLES
    .filter(s => s.manual === MANUAL_CLASSIFICATIONS.VALID)
    .map(s => ({
      id: s.id,
      title: s.content.title,
      description: s.content.description,
      region: s.content.region || 'Centre',
      commune: s.content.commune || 'Ouagadougou',
      category: s.content.category,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // Dans 15 jours
    }));
  
  validMarkets.forEach(market => matchBenchmark.addMarket(market.id, market));
  
  // Exécution du benchmark de matching
  const matchResults = matchBenchmark.runMatchingBenchmark();
  const matchAnalysis = matchBenchmark.analyzeMatchingResults();
  
  // Affichage des résultats de matching
  console.log('\n📈 Résultats du matching:');
  console.log(`Score moyen: ${matchAnalysis.averageScore}%`);
  console.log('\nDistribution des scores:');
  console.log(`  Scores élevés (70-100): ${matchAnalysis.scoreDistribution.high}`);
  console.log(`  Scores moyens (30-69):  ${matchAnalysis.scoreDistribution.medium}`);
  console.log(`  Scores faibles (0-29):  ${matchAnalysis.scoreDistribution.low}`);
  
  console.log('\n🏢 Performance par profil:');
  Object.entries(matchAnalysis.profilePerformance).forEach(([profileId, avgScore]) => {
    const profile = TEST_PROFILES.find(p => p.id === profileId);
    console.log(`  ${profile.companyName} (${profile.sector}): ${avgScore}%`);
  });
  
  console.log('\n📋 Attrait par marché:');
  Object.entries(matchAnalysis.marketAppeal).forEach(([marketId, avgScore]) => {
    const market = validMarkets.find(m => m.id === marketId);
    console.log(`  ${market.title.substring(0, 60)}...: ${avgScore}%`);
  });
  
  // Détail de quelques matches intéressants
  console.log('\n🔍 Détail de matches sélectionnés:');
  const interestingMatches = matchResults
    .filter(r => r.score >= 70 || r.score <= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  interestingMatches.forEach(match => {
    const profile = TEST_PROFILES.find(p => p.id === match.profileId);
    const market = validMarkets.find(m => m.id === match.marketId);
    console.log(`\n  ${profile.companyName} ← ${market.title.substring(0, 50)}...`);
    console.log(`  Score: ${match.score}% | ${match.explanation}`);
  });
  
  // === RÉSUMÉ EXÉCUTIF ===
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ EXÉCUTIF');
  console.log('='.repeat(60));
  
  const { metrics } = results;
  console.log(`\n✅ Classification: ${metrics.accuracy}% de précision globale`);
  console.log(`   - Faux positifs: ${results.performance.falsePositives}/${results.totalSamples}`);
  console.log(`   - Faux négatifs: ${results.performance.falseNegatives}/${results.totalSamples}`);
  
  console.log(`\n🎯 Matching: ${matchAnalysis.averageScore}% de score moyen`);
  console.log(`   - Matches pertinents: ${matchAnalysis.scoreDistribution.high}/${matchResults.length}`);
  
  // Recommandations
  console.log('\n🔧 RECOMMANDATIONS:');
  
  if (metrics.accuracy < 90) {
    console.log('   ⚠️  Précision classification à améliorer (< 90%)');
  }
  
  if (results.performance.falsePositives > 0) {
    console.log(`   ⚠️  ${results.performance.falsePositives} faux positifs détectés - renforcer les exclusions`);
  }
  
  if (matchAnalysis.averageScore < 50) {
    console.log('   ⚠️  Score matching faible - revoir les algorithmes de correspondance');
  }
  
  if (matchAnalysis.scoreDistribution.low > matchAnalysis.scoreDistribution.high) {
    console.log('   ⚠️  Trop de matches faibles - affiner les critères de pertinence');
  }
  
  console.log(`\n📄 Rapport détaillé sauvegardé: benchmark-classification-results.md`);
  console.log('🎉 Benchmark terminé avec succès!');
}

// Exécution si appelé directement
if (require.main === module) {
  runFullBenchmark().catch(console.error);
}

module.exports = { runFullBenchmark };