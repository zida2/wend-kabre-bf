// Vérification des labels humains - Identification cas ambigus
import fs from 'fs';

// Charger les données
const holdoutData = JSON.parse(fs.readFileSync('../data/holdout-validation-dataset.json', 'utf8'));
const humanRef = fs.readFileSync('../data/holdout_human_reference.csv', 'utf8')
  .split('\n')
  .slice(1)
  .filter(line => line.trim())
  .map(line => {
    const [id, classification, category, notes] = line.split(',').map(s => s.replace(/"/g, '').trim());
    return { id, classification, category, notes };
  });

// Charger analyses d'erreurs
const fpAnalysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_POSITIVES_ANALYSIS.json', 'utf8'));
const fnAnalysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_NEGATIVES_ANALYSIS.json', 'utf8'));

console.log('=== VÉRIFICATION LABELS HUMAINS ===\n');

// 1. INCOHÉRENCES TITRE ↔ CLASSIFICATION
console.log('=== 1. INCOHÉRENCES TITRE ↔ CLASSIFICATION ===');

const inconsistencies = [];

humanRef.forEach(ref => {
  const sample = holdoutData.find(h => h.id === ref.id);
  if (!sample) return;

  const title = sample.title.toLowerCase();
  const classification = ref.classification;
  const category = ref.category;
  const notes = ref.notes.toLowerCase();

  // Détecter incohérences évidentes
  let isInconsistent = false;
  let reason = '';

  // Cas 1: Titre = communication officielle mais classé VALID
  if ((title.includes('déclaration') || title.includes('communiqué') || title.includes('message')) && classification === 'VALID') {
    isInconsistent = true;
    reason = 'Communication officielle classée VALID';
  }

  // Cas 2: Titre = avis de décès mais classé VALID/REVIEW
  if (title.includes('décès') && classification !== 'REJECTED') {
    isInconsistent = true;
    reason = 'Avis de décès non rejeté';
  }

  // Cas 3: Titre = recrutement direct mais classé VALID
  if (title.includes('recrutement') && !title.includes('prestation') && !title.includes('services') && classification === 'VALID') {
    isInconsistent = true;
    reason = 'Recrutement direct classé VALID';
  }

  // Cas 4: Titre académique/cérémonie mais classé VALID
  if ((title.includes('soutenance') || title.includes('conférence') || title.includes('séminaire') || title.includes('inauguration')) && classification === 'VALID') {
    isInconsistent = true;
    reason = 'Contenu académique/cérémonie classé VALID';
  }

  // Cas 5: Notes décrivent marché mais titre non-marché
  if (classification === 'VALID' && (notes.includes('marché') || notes.includes('fourniture') || notes.includes('construction')) && 
      !title.includes('marché') && !title.includes('appel') && !title.includes('fourniture') && !title.includes('construction') && !title.includes('travaux')) {
    isInconsistent = true;
    reason = 'Notes décrivent marché mais titre non-marché';
  }

  if (isInconsistent) {
    inconsistencies.push({
      id: ref.id,
      title: sample.title,
      classification: ref.classification,
      category: ref.category,
      notes: ref.notes,
      reason,
      severity: reason.includes('Notes décrivent marché') ? 'CRITICAL' : 'HIGH'
    });
  }
});

console.log(`Total incohérences détectées: ${inconsistencies.length}`);

// Grouper par raison
const byReason = {};
inconsistencies.forEach(inc => {
  if (!byReason[inc.reason]) byReason[inc.reason] = [];
  byReason[inc.reason].push(inc);
});

Object.entries(byReason).forEach(([reason, cases]) => {
  console.log(`\n${reason} (${cases.length} cas):`);
  cases.slice(0, 5).forEach(c => {
    console.log(`  ${c.id}: "${c.title}" → ${c.classification}`);
    console.log(`    Notes: ${c.notes}`);
  });
  if (cases.length > 5) {
    console.log(`    ... et ${cases.length - 5} autres cas`);
  }
});

// 2. CLASSIFICATIONS BORDERLINE AMBIGUËS
console.log('\n=== 2. CLASSIFICATIONS BORDERLINE AMBIGUËS ===');

const borderlineCases = [];

humanRef.forEach(ref => {
  const sample = holdoutData.find(h => h.id === ref.id);
  if (!sample) return;

  const title = sample.title.toLowerCase();
  let isAmbiguous = false;
  let ambiguityReason = '';

  // Services qui pourraient être marchés ou recrutement
  if (title.includes('services') && (title.includes('maintenance') || title.includes('nettoyage') || title.includes('gardiennage'))) {
    isAmbiguous = true;
    ambiguityReason = 'Service externalisé vs recrutement prestataire';
  }

  // Prestation qui pourrait être marché
  if (title.includes('prestation') && !title.includes('recrutement') && !title.includes('avis')) {
    isAmbiguous = true;
    ambiguityReason = 'Prestation potentiellement marché';
  }

  // Formation qui peut être service ou académique
  if (title.includes('formation') && (title.includes('prestation') || title.includes('services'))) {
    isAmbiguous = true;
    ambiguityReason = 'Formation prestation vs académique';
  }

  // Études qui peuvent être marchés d'expertise
  if ((title.includes('étude') || title.includes('évaluation') || title.includes('expertise')) && !title.includes('soutenance')) {
    isAmbiguous = true;
    ambiguityReason = 'Étude/expertise potentiellement marché';
  }

  // Mission de conseil
  if (title.includes('mission') && (title.includes('conseil') || title.includes('expertise') || title.includes('assistance'))) {
    isAmbiguous = true;
    ambiguityReason = 'Mission conseil potentiellement marché';
  }

  if (isAmbiguous) {
    borderlineCases.push({
      id: ref.id,
      title: sample.title,
      classification: ref.classification,
      category: ref.category,
      notes: ref.notes,
      ambiguityReason
    });
  }
});

console.log(`Cas borderline identifiés: ${borderlineCases.length}`);

// Grouper par raison d'ambiguïté
const byAmbiguity = {};
borderlineCases.forEach(bc => {
  if (!byAmbiguity[bc.ambiguityReason]) byAmbiguity[bc.ambiguityReason] = [];
  byAmbiguity[bc.ambiguityReason].push(bc);
});

Object.entries(byAmbiguity).forEach(([reason, cases]) => {
  console.log(`\n${reason} (${cases.length} cas):`);
  
  // Analyser distribution des classifications
  const classDistribution = {};
  cases.forEach(c => {
    if (!classDistribution[c.classification]) classDistribution[c.classification] = 0;
    classDistribution[c.classification]++;
  });
  
  console.log(`  Distribution: ${Object.entries(classDistribution).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  
  cases.slice(0, 3).forEach(c => {
    console.log(`  ${c.id}: "${c.title}" → ${c.classification}`);
  });
});

// 3. COHÉRENCE INTERNE DES CATÉGORIES
console.log('\n=== 3. COHÉRENCE INTERNE DES CATÉGORIES ===');

// Regrouper par catégorie
const byCategory = {};
humanRef.forEach(ref => {
  if (!byCategory[ref.category]) byCategory[ref.category] = [];
  byCategory[ref.category].push(ref);
});

const inconsistentCategories = [];

Object.entries(byCategory).forEach(([category, items]) => {
  if (items.length < 3) return; // Ignorer catégories trop petites

  // Analyser distribution des classifications dans la catégorie
  const classDistribution = {};
  items.forEach(item => {
    if (!classDistribution[item.classification]) classDistribution[item.classification] = 0;
    classDistribution[item.classification]++;
  });

  // Détecter incohérences si mix de VALID/REJECTED dans même catégorie
  const hasValid = classDistribution['VALID'] > 0;
  const hasRejected = classDistribution['REJECTED'] > 0;
  
  if (hasValid && hasRejected) {
    inconsistentCategories.push({
      category,
      totalItems: items.length,
      distribution: classDistribution,
      examples: items.slice(0, 3).map(item => ({
        id: item.id,
        classification: item.classification,
        notes: item.notes
      }))
    });
  }
});

console.log(`Catégories avec classifications mixtes: ${inconsistentCategories.length}`);
inconsistentCategories.forEach(cat => {
  console.log(`\n${cat.category} (${cat.totalItems} items):`);
  console.log(`  Distribution: ${Object.entries(cat.distribution).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  console.log(`  Exemples:`);
  cat.examples.forEach(ex => {
    console.log(`    ${ex.id}: ${ex.classification} - ${ex.notes}`);
  });
});

// 4. ANALYSE ERREURS V2F vs LABELS POTENTIELLEMENT INCORRECTS
console.log('\n=== 4. ERREURS V2F vs LABELS SUSPECTS ===');

// Croiser erreurs V2F avec incohérences détectées
const fpWithInconsistencies = fpAnalysis.falsePositives.filter(fp => 
  inconsistencies.some(inc => inc.id === fp.id)
);

const fnWithInconsistencies = fnAnalysis.falseNegatives.filter(fn => 
  inconsistencies.some(inc => inc.id === fn.id)
);

console.log(`FP avec incohérences labels: ${fpWithInconsistencies.length}/${fpAnalysis.falsePositives.length}`);
console.log(`FN avec incohérences labels: ${fnWithInconsistencies.length}/${fnAnalysis.falseNegatives.length}`);

// Cas où V2F pourrait avoir raison contre le label humain
const v2fPotentiallyCorrect = [];

fpAnalysis.falsePositives.forEach(fp => {
  const inconsistency = inconsistencies.find(inc => inc.id === fp.id);
  if (inconsistency) {
    v2fPotentiallyCorrect.push({
      id: fp.id,
      title: fp.title,
      v2fClassification: fp.v2f,
      humanClassification: fp.human,
      inconsistencyReason: inconsistency.reason,
      v2fReasons: fp.reasons
    });
  }
});

console.log(`\nCas où V2F pourrait être correct (${v2fPotentiallyCorrect.length}):`);
v2fPotentiallyCorrect.forEach(case_ => {
  console.log(`  ${case_.id}: V2F=${case_.v2fClassification} vs Humain=${case_.humanClassification}`);
  console.log(`    Incohérence: ${case_.inconsistencyReason}`);
  console.log(`    V2F: ${case_.v2fReasons.join(', ')}`);
});

// Sauvegarder l'analyse
const labelVerification = {
  inconsistencies: {
    total: inconsistencies.length,
    byReason: Object.fromEntries(
      Object.entries(byReason).map(([reason, cases]) => [reason, cases.length])
    ),
    details: inconsistencies
  },
  borderlineCases: {
    total: borderlineCases.length,
    byAmbiguity: Object.fromEntries(
      Object.entries(byAmbiguity).map(([reason, cases]) => [reason, cases.length])
    ),
    details: borderlineCases
  },
  categoryConsistency: {
    inconsistentCategories: inconsistentCategories.length,
    details: inconsistentCategories
  },
  v2fVsHuman: {
    fpWithInconsistencies: fpWithInconsistencies.length,
    fnWithInconsistencies: fnWithInconsistencies.length,
    v2fPotentiallyCorrect: v2fPotentiallyCorrect.length,
    details: v2fPotentiallyCorrect
  },
  summary: {
    totalSamplesAnalyzed: humanRef.length,
    criticalInconsistencies: inconsistencies.filter(i => i.severity === 'CRITICAL').length,
    highInconsistencies: inconsistencies.filter(i => i.severity === 'HIGH').length,
    borderlineAmbiguous: borderlineCases.length,
    dataQualityScore: ((humanRef.length - inconsistencies.length - borderlineCases.length) / humanRef.length * 100).toFixed(1)
  }
};

fs.writeFileSync('../data/COMPLETE_HUMAN_LABELS_VERIFICATION.json', JSON.stringify(labelVerification, null, 2));
console.log('\n\nVérification labels humains sauvée dans: data/COMPLETE_HUMAN_LABELS_VERIFICATION.json');