// Analyse de couverture vocabulaire - Holdout vs Datasets développement
import fs from 'fs';

// Charger tous les datasets
const holdoutData = JSON.parse(fs.readFileSync('../data/holdout-validation-dataset.json', 'utf8'));
const benchmarkData = JSON.parse(fs.readFileSync('../data/real-data-samples.json', 'utf8'));
const shadowData = JSON.parse(fs.readFileSync('../data/shadow-dataset-v2d.json', 'utf8'));

// Charger les analyses d'erreurs
const fpAnalysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_POSITIVES_ANALYSIS.json', 'utf8'));
const fnAnalysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_NEGATIVES_ANALYSIS.json', 'utf8'));

console.log('=== ANALYSE COUVERTURE VOCABULAIRE ===\n');

// Fonction pour extraire vocabulaire proprement
function extractVocabulary(dataset, titleField = 'title') {
  const vocabulary = new Set();
  const phrases = new Set();
  const patterns = new Set();
  
  dataset.forEach(item => {
    const title = item[titleField] || '';
    const text = title.toLowerCase()
      .replace(/[^\w\s\-']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Mots individuels (≥3 caractères)
    const words = text.split(' ').filter(word => word.length >= 3);
    words.forEach(word => vocabulary.add(word));
    
    // Phrases 2-3 mots
    for (let i = 0; i < words.length - 1; i++) {
      phrases.add(`${words[i]} ${words[i + 1]}`);
      if (i < words.length - 2) {
        phrases.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }
    
    // Patterns structurels
    if (text.includes('avis de')) patterns.add('avis de');
    if (text.includes('appel d')) patterns.add('appel d\'offres');
    if (text.includes('marché')) patterns.add('marché');
    if (text.includes('recrutement')) patterns.add('recrutement');
    if (text.includes('fourniture')) patterns.add('fourniture');
    if (text.includes('prestation')) patterns.add('prestation');
    if (text.includes('travaux')) patterns.add('travaux');
    if (text.includes('services')) patterns.add('services');
    if (text.includes('mission')) patterns.add('mission');
    if (text.includes('étude') || text.includes('etude')) patterns.add('étude');
    if (text.includes('évaluation') || text.includes('evaluation')) patterns.add('évaluation');
    if (text.includes('expertise')) patterns.add('expertise');
    if (text.includes('déclaration')) patterns.add('déclaration');
    if (text.includes('communiqué')) patterns.add('communiqué');
    if (text.includes('lancement')) patterns.add('lancement');
    if (text.includes('nomination')) patterns.add('nomination');
    if (text.includes('inauguration')) patterns.add('inauguration');
    if (text.includes('formation')) patterns.add('formation');
    if (text.includes('maintenance')) patterns.add('maintenance');
  });
  
  return { vocabulary, phrases, patterns };
}

// 1. EXTRAIRE VOCABULAIRES
console.log('=== 1. EXTRACTION VOCABULAIRES ===');

const vocabs = {
  benchmark: extractVocabulary(benchmarkData),
  shadow: extractVocabulary(shadowData),
  holdout: extractVocabulary(holdoutData),
  development: { vocabulary: new Set(), phrases: new Set(), patterns: new Set() }
};

// Combiner benchmark + shadow = development
vocabs.benchmark.vocabulary.forEach(w => vocabs.development.vocabulary.add(w));
vocabs.shadow.vocabulary.forEach(w => vocabs.development.vocabulary.add(w));
vocabs.benchmark.phrases.forEach(p => vocabs.development.phrases.add(p));
vocabs.shadow.phrases.forEach(p => vocabs.development.phrases.add(p));
vocabs.benchmark.patterns.forEach(p => vocabs.development.patterns.add(p));
vocabs.shadow.patterns.forEach(p => vocabs.development.patterns.add(p));

console.log('Tailles vocabulaires:');
console.log(`  Benchmark: ${vocabs.benchmark.vocabulary.size} mots, ${vocabs.benchmark.phrases.size} phrases, ${vocabs.benchmark.patterns.size} patterns`);
console.log(`  Shadow: ${vocabs.shadow.vocabulary.size} mots, ${vocabs.shadow.phrases.size} phrases, ${vocabs.shadow.patterns.size} patterns`);
console.log(`  Développement combiné: ${vocabs.development.vocabulary.size} mots, ${vocabs.development.phrases.size} phrases, ${vocabs.development.patterns.size} patterns`);
console.log(`  Holdout: ${vocabs.holdout.vocabulary.size} mots, ${vocabs.holdout.phrases.size} phrases, ${vocabs.holdout.patterns.size} patterns`);

// 2. ANALYSER COUVERTURE
console.log('\n=== 2. ANALYSE COUVERTURE ===');

// Mots dans holdout mais pas dans development
const missingWords = Array.from(vocabs.holdout.vocabulary)
  .filter(word => !vocabs.development.vocabulary.has(word))
  .sort();

// Phrases dans holdout mais pas dans development  
const missingPhrases = Array.from(vocabs.holdout.phrases)
  .filter(phrase => !vocabs.development.phrases.has(phrase))
  .sort();

// Patterns dans holdout mais pas dans development
const missingPatterns = Array.from(vocabs.holdout.patterns)
  .filter(pattern => !vocabs.development.patterns.has(pattern))
  .sort();

console.log(`Mots nouveaux dans holdout: ${missingWords.length}/${vocabs.holdout.vocabulary.size} (${((missingWords.length/vocabs.holdout.vocabulary.size)*100).toFixed(1)}%)`);
console.log(`Phrases nouvelles dans holdout: ${missingPhrases.length}/${vocabs.holdout.phrases.size} (${((missingPhrases.length/vocabs.holdout.phrases.size)*100).toFixed(1)}%)`);
console.log(`Patterns nouveaux dans holdout: ${missingPatterns.length}/${vocabs.holdout.patterns.size} (${((missingPatterns.length/vocabs.holdout.patterns.size)*100).toFixed(1)}%)`);

// 3. VOCABULAIRE SPÉCIFIQUE DES ERREURS
console.log('\n=== 3. VOCABULAIRE SPÉCIFIQUE DES ERREURS ===');

// Extraire vocabulaire des erreurs
const errorVocabs = {
  fp: new Set(),
  fn: new Set()
};

fpAnalysis.falsePositives.forEach(fp => {
  const words = fp.title.toLowerCase()
    .replace(/[^\w\s\-']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3);
  words.forEach(word => errorVocabs.fp.add(word));
});

fnAnalysis.falseNegatives.forEach(fn => {
  const words = fn.title.toLowerCase()
    .replace(/[^\w\s\-']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3);
  words.forEach(word => errorVocabs.fn.add(word));
});

// Mots d'erreur non couverts
const uncoveredFpWords = Array.from(errorVocabs.fp)
  .filter(word => !vocabs.development.vocabulary.has(word))
  .sort();

const uncoveredFnWords = Array.from(errorVocabs.fn)
  .filter(word => !vocabs.development.vocabulary.has(word))
  .sort();

console.log(`Mots FP non couverts: ${uncoveredFpWords.length}/${errorVocabs.fp.size}`);
console.log('Top mots FP manquants:');
uncoveredFpWords.slice(0, 15).forEach(word => console.log(`  ${word}`));

console.log(`\nMots FN non couverts: ${uncoveredFnWords.length}/${errorVocabs.fn.size}`);
console.log('Top mots FN manquants:');
uncoveredFnWords.slice(0, 10).forEach(word => console.log(`  ${word}`));

// 4. ANALYSE PAR CATÉGORIES
console.log('\n=== 4. COUVERTURE PAR CATÉGORIES ===');

// Regrouper holdout par catégories
const holdoutByCategory = {};
holdoutData.forEach(item => {
  const cat = item.subcategory || item.category || 'unknown';
  if (!holdoutByCategory[cat]) holdoutByCategory[cat] = [];
  holdoutByCategory[cat].push(item);
});

// Analyser couverture par catégorie
const categoryAnalysis = {};
Object.entries(holdoutByCategory).forEach(([category, items]) => {
  const categoryVocab = extractVocabulary(items);
  const uncovered = Array.from(categoryVocab.vocabulary)
    .filter(word => !vocabs.development.vocabulary.has(word));
  
  categoryAnalysis[category] = {
    totalItems: items.length,
    totalWords: categoryVocab.vocabulary.size,
    uncoveredWords: uncovered.length,
    coverageRate: ((categoryVocab.vocabulary.size - uncovered.length) / categoryVocab.vocabulary.size * 100).toFixed(1),
    topUncovered: uncovered.slice(0, 5)
  };
});

// Afficher par taux de couverture croissant
console.log('Couverture par catégorie (moins bon → meilleur):');
Object.entries(categoryAnalysis)
  .sort((a, b) => parseFloat(a[1].coverageRate) - parseFloat(b[1].coverageRate))
  .forEach(([category, analysis]) => {
    if (analysis.totalItems >= 3) { // Seulement catégories significatives
      console.log(`  ${category}: ${analysis.coverageRate}% couvert (${analysis.totalItems} items)`);
      if (analysis.topUncovered.length > 0) {
        console.log(`    Mots manquants: ${analysis.topUncovered.join(', ')}`);
      }
    }
  });

// 5. PATTERNS CONTRADICTOIRES
console.log('\n=== 5. PATTERNS CONTRADICTOIRES ===');

// Analyser patterns utilisés différemment
const patternUsage = {
  development: {},
  holdout: {}
};

// Compter usage dans development
[...benchmarkData, ...shadowData].forEach(item => {
  const title = item.title.toLowerCase();
  vocabs.development.patterns.forEach(pattern => {
    if (title.includes(pattern)) {
      if (!patternUsage.development[pattern]) patternUsage.development[pattern] = { total: 0, contexts: new Set() };
      patternUsage.development[pattern].total++;
      // Contexte simple
      if (title.includes('avis') && title.includes('recrutement')) {
        patternUsage.development[pattern].contexts.add('recrutement');
      } else if (title.includes('marché') || title.includes('appel')) {
        patternUsage.development[pattern].contexts.add('marché');
      } else {
        patternUsage.development[pattern].contexts.add('autre');
      }
    }
  });
});

// Compter usage dans holdout
holdoutData.forEach(item => {
  const title = item.title.toLowerCase();
  vocabs.holdout.patterns.forEach(pattern => {
    if (title.includes(pattern)) {
      if (!patternUsage.holdout[pattern]) patternUsage.holdout[pattern] = { total: 0, contexts: new Set() };
      patternUsage.holdout[pattern].total++;
      // Contexte simple
      if (title.includes('avis') && title.includes('recrutement')) {
        patternUsage.holdout[pattern].contexts.add('recrutement');
      } else if (title.includes('marché') || title.includes('appel')) {
        patternUsage.holdout[pattern].contexts.add('marché');
      } else if (title.includes('déclaration') || title.includes('communiqué')) {
        patternUsage.holdout[pattern].contexts.add('communication');
      } else {
        patternUsage.holdout[pattern].contexts.add('autre');
      }
    }
  });
});

console.log('Patterns avec usages divergents:');
Object.keys(patternUsage.development).forEach(pattern => {
  const devContexts = Array.from(patternUsage.development[pattern]?.contexts || []);
  const holdoutContexts = Array.from(patternUsage.holdout[pattern]?.contexts || []);
  
  if (holdoutContexts.length > 0) {
    const devCount = patternUsage.development[pattern]?.total || 0;
    const holdoutCount = patternUsage.holdout[pattern]?.total || 0;
    
    console.log(`  "${pattern}": dev=${devCount} (${devContexts.join(', ')}) vs holdout=${holdoutCount} (${holdoutContexts.join(', ')})`);
  }
});

// Sauvegarder l'analyse
const coverageAnalysis = {
  vocabularySizes: {
    development: vocabs.development.vocabulary.size,
    holdout: vocabs.holdout.vocabulary.size,
    benchmark: vocabs.benchmark.vocabulary.size,
    shadow: vocabs.shadow.vocabulary.size
  },
  coverage: {
    newWordsInHoldout: missingWords.length,
    newPhrasesInHoldout: missingPhrases.length,
    newPatternsInHoldout: missingPatterns.length,
    wordsCoverageRate: ((vocabs.holdout.vocabulary.size - missingWords.length) / vocabs.holdout.vocabulary.size * 100).toFixed(1)
  },
  missingElements: {
    words: missingWords,
    phrases: missingPhrases,
    patterns: missingPatterns
  },
  errorVocabulary: {
    fpUncovered: uncoveredFpWords,
    fnUncovered: uncoveredFnWords
  },
  categoryAnalysis,
  patternUsage,
  insights: {
    majorGaps: missingWords.length > vocabs.holdout.vocabulary.size * 0.3,
    patternDivergence: Object.keys(patternUsage.holdout).length > Object.keys(patternUsage.development).length,
    errorVocabUncovered: uncoveredFpWords.length > errorVocabs.fp.size * 0.5
  }
};

fs.writeFileSync('../data/COMPLETE_VOCABULARY_COVERAGE.json', JSON.stringify(coverageAnalysis, null, 2));
console.log('\n\nAnalyse de couverture sauvée dans: data/COMPLETE_VOCABULARY_COVERAGE.json');