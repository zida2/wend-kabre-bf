// Analyse complète des faux négatifs V2F - Holdout 221
import { classifyWithIntentAnalysisV2F } from '../src/lib/intentClassifierV2F.js';
import fs from 'fs';

// Charger les données
const holdoutData = JSON.parse(fs.readFileSync('../data/holdout-validation-dataset.json', 'utf8'));
const humanRef = fs.readFileSync('../data/holdout_human_reference.csv', 'utf8')
  .split('\n')
  .slice(1) // Enlever header
  .filter(line => line.trim())
  .map(line => {
    const [id, classification, category, notes] = line.split(',').map(s => s.replace(/"/g, '').trim());
    return { id, classification, category, notes };
  });

// Analyser tous les faux négatifs
const allFalseNegatives = [];

// Traiter chaque échantillon VALID
humanRef
  .filter(ref => ref.classification === 'VALID')
  .forEach(ref => {
    const sample = holdoutData.find(h => h.id === ref.id);
    if (!sample) {
      console.log(`Missing sample: ${ref.id}`);
      return;
    }

    // Classer avec V2F
    const prediction = classifyWithIntentAnalysisV2F(sample.title, sample.description);
    
    // Si prédit REJECTED → faux négatif
    if (prediction.classification === 'REJECTED') {
      const error = {
        id: ref.id,
        title: sample.title,
        description: sample.description,
        human: ref.classification,
        v2f: prediction.classification,
        score: prediction.score,
        intent: prediction.intentAnalysis.primaryIntent,
        contentType: prediction.intentAnalysis.contentType,
        recruitmentType: prediction.intentAnalysis.recruitmentType,
        reasons: prediction.reasons,
        category: ref.category,
        notes: ref.notes
      };

      allFalseNegatives.push(error);
    }
  });

console.log('=== ANALYSE DÉTAILLÉE DES 10 FAUX NÉGATIFS V2F ===');
console.log(`Total faux négatifs trouvés: ${allFalseNegatives.length}`);

if (allFalseNegatives.length !== 10) {
  console.log(`⚠️ ALERTE: Attendu 10 FN, trouvé ${allFalseNegatives.length}`);
}

console.log('\n=== DÉTAIL DES FAUX NÉGATIFS ===');
allFalseNegatives.forEach((fn, index) => {
  console.log(`\n${index + 1}. ${fn.id} - ${fn.category}`);
  console.log(`   Titre: "${fn.title}"`);
  console.log(`   Score V2F: ${fn.score}`);
  console.log(`   Intent détecté: ${fn.intent}`);
  console.log(`   Content type: ${fn.contentType}`);
  console.log(`   Raisons: ${fn.reasons.join(', ')}`);
  console.log(`   Notes humaines: ${fn.notes}`);
});

// Analyse par patterns
console.log('\n\n=== ANALYSE PAR PATTERNS ===');

// Par catégorie
const byCategory = {};
allFalseNegatives.forEach(fn => {
  const cat = fn.category;
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(fn);
});

console.log('\nPar catégorie:');
Object.entries(byCategory).forEach(([cat, fns]) => {
  console.log(`  ${cat}: ${fns.length} cas`);
});

// Par intent détecté
const byIntent = {};
allFalseNegatives.forEach(fn => {
  const intent = fn.intent;
  if (!byIntent[intent]) byIntent[intent] = [];
  byIntent[intent].push(fn);
});

console.log('\nPar intent détecté:');
Object.entries(byIntent).forEach(([intent, fns]) => {
  console.log(`  ${intent}: ${fns.length} cas`);
});

// Par content type
const byContentType = {};
allFalseNegatives.forEach(fn => {
  const ct = fn.contentType;
  if (!byContentType[ct]) byContentType[ct] = [];
  byContentType[ct].push(fn);
});

console.log('\nPar content type:');
Object.entries(byContentType).forEach(([ct, fns]) => {
  console.log(`  ${ct}: ${fns.length} cas`);
});

// Par score
const byScore = {};
allFalseNegatives.forEach(fn => {
  const score = fn.score;
  if (!byScore[score]) byScore[score] = [];
  byScore[score].push(fn);
});

console.log('\nPar score:');
Object.entries(byScore)
  .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  .forEach(([score, fns]) => {
    console.log(`  Score ${score}: ${fns.length} cas`);
  });

// Analyse linguistique
console.log('\n\n=== ANALYSE LINGUISTIQUE ===');

const commonWords = {};
allFalseNegatives.forEach(fn => {
  const words = fn.title.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['pour', 'dans', 'avec', 'sur', 'contre', 'entre', 'vers', 'chez', 'sans'].includes(word));
  
  words.forEach(word => {
    if (!commonWords[word]) commonWords[word] = 0;
    commonWords[word]++;
  });
});

console.log('\nMots fréquents dans les FN (>1 occurrence):');
Object.entries(commonWords)
  .filter(([word, count]) => count > 1)
  .sort((a, b) => b[1] - a[1])
  .forEach(([word, count]) => {
    console.log(`  ${word}: ${count}`);
  });

// Détection de patterns spécifiques
console.log('\n\n=== PATTERNS SPÉCIFIQUES IDENTIFIÉS ===');

// Patterns de communications/politique
const policyPatterns = allFalseNegatives.filter(fn => 
  fn.title.toLowerCase().includes('déclaration') || 
  fn.title.toLowerCase().includes('communiqué') ||
  fn.title.toLowerCase().includes('politique') ||
  fn.title.toLowerCase().includes('stratégie')
);

console.log(`\nCommunications/Politiques (${policyPatterns.length} cas):`);
policyPatterns.forEach(fn => {
  console.log(`  - ${fn.title}`);
});

// Patterns de marchés explicites
const explicitMarketPatterns = allFalseNegatives.filter(fn =>
  fn.title.toLowerCase().includes('marché') ||
  fn.title.toLowerCase().includes('appel') ||
  fn.title.toLowerCase().includes('acquisition') ||
  fn.title.toLowerCase().includes('fourniture')
);

console.log(`\nMarchés explicites manqués (${explicitMarketPatterns.length} cas):`);
explicitMarketPatterns.forEach(fn => {
  console.log(`  - ${fn.title} (Score: ${fn.score})`);
});

// Sauvegarder les résultats
const results = {
  totalFalseNegatives: allFalseNegatives.length,
  falseNegatives: allFalseNegatives,
  analysis: {
    byCategory,
    byIntent, 
    byContentType,
    byScore
  },
  linguisticAnalysis: {
    commonWords,
    policyPatterns: policyPatterns.length,
    explicitMarketPatterns: explicitMarketPatterns.length
  }
};

fs.writeFileSync('../data/COMPLETE_FALSE_NEGATIVES_ANALYSIS.json', JSON.stringify(results, null, 2));
console.log('\n\nAnalyse complète sauvée dans: data/COMPLETE_FALSE_NEGATIVES_ANALYSIS.json');