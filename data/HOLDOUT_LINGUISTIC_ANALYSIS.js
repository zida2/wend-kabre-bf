// Analyse linguistique complète des erreurs V2F - Holdout 221
import fs from 'fs';

// Charger les analyses précédentes
const fpAnalysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_POSITIVES_ANALYSIS.json', 'utf8'));
const fnAnalysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_NEGATIVES_ANALYSIS.json', 'utf8'));

// Charger le dataset complet
const holdoutData = JSON.parse(fs.readFileSync('../data/holdout-validation-dataset.json', 'utf8'));
const humanRef = fs.readFileSync('../data/holdout_human_reference.csv', 'utf8')
  .split('\n')
  .slice(1)
  .filter(line => line.trim())
  .map(line => {
    const [id, classification, category, notes] = line.split(',').map(s => s.replace(/"/g, '').trim());
    return { id, classification, category, notes };
  });

console.log('=== ANALYSE LINGUISTIQUE DES ERREURS V2F ===\n');

// 1. VOCABULAIRE DES ERREURS vs SUCCÈS
console.log('=== 1. ANALYSE VOCABULAIRE ERREURS vs SUCCÈS ===');

// Extraire vocabulaire des erreurs
const errorVocabulary = {
  falsePositives: {},
  falseNegatives: {}
};

// Analyser FP
fpAnalysis.falsePositives.forEach(fp => {
  const words = fp.title.toLowerCase()
    .replace(/[^\w\s\-']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3)
    .filter(word => !['pour', 'dans', 'avec', 'sur', 'contre', 'entre', 'vers', 'chez', 'sans', 'sous', 'les', 'des', 'une', 'aux'].includes(word));
  
  words.forEach(word => {
    if (!errorVocabulary.falsePositives[word]) errorVocabulary.falsePositives[word] = 0;
    errorVocabulary.falsePositives[word]++;
  });
});

// Analyser FN (noter que ce sont des incohérences dataset)
fnAnalysis.falseNegatives.forEach(fn => {
  const words = fn.title.toLowerCase()
    .replace(/[^\w\s\-']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3)
    .filter(word => !['pour', 'dans', 'avec', 'sur', 'contre', 'entre', 'vers', 'chez', 'sans', 'sous', 'les', 'des', 'une', 'aux'].includes(word));
  
  words.forEach(word => {
    if (!errorVocabulary.falseNegatives[word]) errorVocabulary.falseNegatives[word] = 0;
    errorVocabulary.falseNegatives[word]++;
  });
});

console.log('Top 15 mots fréquents dans FAUX POSITIFS:');
Object.entries(errorVocabulary.falsePositives)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([word, count]) => {
    console.log(`  ${word}: ${count}`);
  });

console.log('\nTop 10 mots fréquents dans FAUX NÉGATIFS (dataset incohérent):');
Object.entries(errorVocabulary.falseNegatives)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([word, count]) => {
    console.log(`  ${word}: ${count}`);
  });

// 2. PATTERNS GRAMMATICAUX PROBLÉMATIQUES
console.log('\n=== 2. PATTERNS GRAMMATICAUX PROBLÉMATIQUES ===');

const grammaticalPatterns = {
  recruitment: {
    avis_de: 0,
    recrutement_de: 0,
    poste_vacant: 0,
    offre_emploi: 0,
    recherche_de: 0
  },
  market: {
    appel_offres: 0,
    marche_public: 0,
    acquisition_de: 0,
    fourniture_de: 0,
    prestation_de: 0,
    travaux_de: 0,
    services_de: 0
  },
  ambiguous: {
    mission_de: 0,
    etude_de: 0,
    evaluation_de: 0,
    expertise_de: 0,
    conseil_de: 0
  }
};

// Analyser patterns dans FP
fpAnalysis.falsePositives.forEach(fp => {
  const title = fp.title.toLowerCase();
  
  // Patterns recrutement
  if (title.includes('avis de')) grammaticalPatterns.recruitment.avis_de++;
  if (title.includes('recrutement de') || title.includes('recrutement d\'')) grammaticalPatterns.recruitment.recrutement_de++;
  if (title.includes('poste vacant')) grammaticalPatterns.recruitment.poste_vacant++;
  if (title.includes('offre d\'emploi')) grammaticalPatterns.recruitment.offre_emploi++;
  if (title.includes('recherche de')) grammaticalPatterns.recruitment.recherche_de++;
  
  // Patterns marché
  if (title.includes('appel d\'offres')) grammaticalPatterns.market.appel_offres++;
  if (title.includes('marché public')) grammaticalPatterns.market.marche_public++;
  if (title.includes('acquisition de') || title.includes('acquisition d\'')) grammaticalPatterns.market.acquisition_de++;
  if (title.includes('fourniture de') || title.includes('fourniture d\'')) grammaticalPatterns.market.fourniture_de++;
  if (title.includes('prestation de') || title.includes('prestation d\'')) grammaticalPatterns.market.prestation_de++;
  if (title.includes('travaux de') || title.includes('travaux d\'')) grammaticalPatterns.market.travaux_de++;
  if (title.includes('services de') || title.includes('services d\'')) grammaticalPatterns.market.services_de++;
  
  // Patterns ambigus
  if (title.includes('mission de') || title.includes('mission d\'')) grammaticalPatterns.ambiguous.mission_de++;
  if (title.includes('étude de') || title.includes('étude d\'') || title.includes('etude de')) grammaticalPatterns.ambiguous.etude_de++;
  if (title.includes('évaluation de') || title.includes('évaluation d\'') || title.includes('evaluation de')) grammaticalPatterns.ambiguous.evaluation_de++;
  if (title.includes('expertise de') || title.includes('expertise d\'')) grammaticalPatterns.ambiguous.expertise_de++;
  if (title.includes('conseil de') || title.includes('conseil d\'')) grammaticalPatterns.ambiguous.conseil_de++;
});

console.log('PATTERNS RECRUTEMENT dans FP:');
Object.entries(grammaticalPatterns.recruitment).forEach(([pattern, count]) => {
  if (count > 0) console.log(`  ${pattern.replace('_', ' ')}: ${count}`);
});

console.log('\nPATTERNS MARCHÉ dans FP:');
Object.entries(grammaticalPatterns.market).forEach(([pattern, count]) => {
  if (count > 0) console.log(`  ${pattern.replace('_', ' ')}: ${count}`);
});

console.log('\nPATTERNS AMBIGUS dans FP:');
Object.entries(grammaticalPatterns.ambiguous).forEach(([pattern, count]) => {
  if (count > 0) console.log(`  ${pattern.replace('_', ' ')}: ${count}`);
});

// 3. EXPRESSIONS FRÉQUENTES PAR FAMILLE D'ERREURS
console.log('\n=== 3. EXPRESSIONS FRÉQUENTES PAR FAMILLE ===');

// Regrouper FP par catégories principales
const fpByFamily = {
  recruitment: fpAnalysis.falsePositives.filter(fp => fp.isRecuitmentError),
  official_communication: fpAnalysis.falsePositives.filter(fp => fp.category === 'official_communication'),
  death_notice: fpAnalysis.falsePositives.filter(fp => fp.category === 'death_notice'),
  academic: fpAnalysis.falsePositives.filter(fp => fp.category.startsWith('academic_')),
  administrative: fpAnalysis.falsePositives.filter(fp => fp.category === 'administrative_appointment')
};

Object.entries(fpByFamily).forEach(([family, errors]) => {
  if (errors.length > 0) {
    console.log(`\n${family.toUpperCase()} (${errors.length} erreurs):`);
    
    // Extraire expressions communes
    const expressions = {};
    errors.forEach(err => {
      // Chercher expressions 2-3 mots
      const words = err.title.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        if (bigram.length > 6 && !bigram.includes('de') && !bigram.includes('du') && !bigram.includes('des')) {
          if (!expressions[bigram]) expressions[bigram] = 0;
          expressions[bigram]++;
        }
        
        if (i < words.length - 2) {
          const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          if (trigram.length > 10 && !trigram.includes('de') && !trigram.includes('du') && !trigram.includes('des')) {
            if (!expressions[trigram]) expressions[trigram] = 0;
            expressions[trigram]++;
          }
        }
      }
    });
    
    // Afficher top expressions
    Object.entries(expressions)
      .filter(([expr, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([expr, count]) => {
        console.log(`  "${expr}": ${count} fois`);
      });
  }
});

// 4. SYNONYMES ET VARIANTES MANQUÉES
console.log('\n=== 4. SYNONYMES ET VARIANTES IDENTIFIÉS ===');

// Analyser variantes pour concepts clés
const variants = {
  recrutement: new Set(),
  service: new Set(),
  marche: new Set(),
  etude: new Set(),
  formation: new Set()
};

fpAnalysis.falsePositives.forEach(fp => {
  const title = fp.title.toLowerCase();
  
  // Variantes recrutement
  if (title.includes('recru')) variants.recrutement.add('recrutement');
  if (title.includes('embau')) variants.recrutement.add('embauche');
  if (title.includes('emploi')) variants.recrutement.add('emploi');
  if (title.includes('poste')) variants.recrutement.add('poste');
  
  // Variantes service
  if (title.includes('service')) variants.service.add('service');
  if (title.includes('prestation')) variants.service.add('prestation');
  if (title.includes('maintenance')) variants.service.add('maintenance');
  if (title.includes('assistance')) variants.service.add('assistance');
  
  // Variantes marché
  if (title.includes('marché') || title.includes('marche')) variants.marche.add('marché');
  if (title.includes('appel')) variants.marche.add('appel d\'offres');
  if (title.includes('acquisition')) variants.marche.add('acquisition');
  if (title.includes('fourniture')) variants.marche.add('fourniture');
  
  // Variantes étude
  if (title.includes('étude') || title.includes('etude')) variants.etude.add('étude');
  if (title.includes('évaluation') || title.includes('evaluation')) variants.etude.add('évaluation');
  if (title.includes('expertise')) variants.etude.add('expertise');
  if (title.includes('mission')) variants.etude.add('mission');
  
  // Variantes formation
  if (title.includes('formation')) variants.formation.add('formation');
  if (title.includes('enseignement')) variants.formation.add('enseignement');
  if (title.includes('éducation') || title.includes('education')) variants.formation.add('éducation');
});

Object.entries(variants).forEach(([concept, variantSet]) => {
  if (variantSet.size > 0) {
    console.log(`${concept.toUpperCase()}: ${Array.from(variantSet).join(', ')}`);
  }
});

// 5. STRUCTURES GRAMMATICALES NOUVELLES
console.log('\n=== 5. STRUCTURES GRAMMATICALES NON COUVERTES ===');

const uncoveredStructures = [];

// Analyser structures dans les erreurs
fpAnalysis.falsePositives.forEach(fp => {
  const title = fp.title;
  
  // Structures commençant par des mots spécifiques
  if (title.startsWith('Lancement ')) uncoveredStructures.push('Lancement + [nom]');
  if (title.startsWith('Mission ')) uncoveredStructures.push('Mission + [de/d\'] + [nom]');
  if (title.startsWith('Étude ') || title.startsWith('Etude ')) uncoveredStructures.push('Étude + [de/d\'] + [nom]');
  if (title.startsWith('Évaluation ') || title.startsWith('Evaluation ')) uncoveredStructures.push('Évaluation + [de/des] + [nom]');
  if (title.includes('- Services de ')) uncoveredStructures.push('[Titre] - Services de [nom]');
  if (title.includes('- Techniciens ')) uncoveredStructures.push('[Avis] - Techniciens [spécialité]');
});

// Compter fréquences
const structureCount = {};
uncoveredStructures.forEach(structure => {
  if (!structureCount[structure]) structureCount[structure] = 0;
  structureCount[structure]++;
});

console.log('Structures grammaticales fréquentes dans erreurs:');
Object.entries(structureCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([structure, count]) => {
    console.log(`  ${structure}: ${count} occurrences`);
  });

// Sauvegarder l'analyse
const linguisticAnalysis = {
  errorVocabulary,
  grammaticalPatterns,
  variantsByFamily: fpByFamily,
  synonymsAndVariants: Object.fromEntries(
    Object.entries(variants).map(([k, v]) => [k, Array.from(v)])
  ),
  uncoveredStructures: structureCount,
  summary: {
    totalFPAnalyzed: fpAnalysis.falsePositives.length,
    totalFNAnalyzed: fnAnalysis.falseNegatives.length,
    mainVocabGaps: Object.entries(errorVocabulary.falsePositives).sort((a,b) => b[1]-a[1]).slice(0,10),
    mainPatternGaps: Object.entries(structureCount).sort((a,b) => b[1]-a[1]).slice(0,5)
  }
};

fs.writeFileSync('../data/COMPLETE_LINGUISTIC_ANALYSIS.json', JSON.stringify(linguisticAnalysis, null, 2));
console.log('\n\nAnalyse linguistique complète sauvée dans: data/COMPLETE_LINGUISTIC_ANALYSIS.json');