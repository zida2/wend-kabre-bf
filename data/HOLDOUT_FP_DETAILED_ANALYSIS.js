// Analyse détaillée des patterns de faux positifs V2F
import fs from 'fs';

const analysis = JSON.parse(fs.readFileSync('../data/COMPLETE_FALSE_POSITIVES_ANALYSIS.json', 'utf8'));
const humanRef = fs.readFileSync('../data/holdout_human_reference.csv', 'utf8')
  .split('\n')
  .slice(1)
  .filter(line => line.trim())
  .map(line => {
    const [id, classification, category, notes] = line.split(',').map(s => s.replace(/"/g, '').trim());
    return { id, classification, category, notes };
  });

console.log('=== ANALYSE DÉTAILLÉE DES 61 FAUX POSITIFS V2F ===\\n');

// 1. ERREURS RECRUITMENT (37 cas)
const recruitmentErrors = analysis.falsePositives.filter(fp => fp.isRecuitmentError);
console.log('=== 1. ERREURS RECRUTEMENT (37/61 = 60.7%) ===');
console.log(`Total: ${recruitmentErrors.length}`);

// Par type de recrutement détecté
const recruitmentByType = {};
recruitmentErrors.forEach(err => {
  const type = err.recruitmentType;
  if (!recruitmentByType[type]) recruitmentByType[type] = [];
  recruitmentByType[type].push(err);
});

Object.entries(recruitmentByType).forEach(([type, errors]) => {
  console.log(`\\n${type}: ${errors.length} cas`);
  errors.slice(0, 3).forEach(err => {
    console.log(`  - ${err.id}: "${err.title}" (${err.v2f}, score: ${err.score})`);
  });
});

// 2. ERREURS NON-RECRUTEMENT (24 cas)
const nonRecruitmentErrors = analysis.falsePositives.filter(fp => !fp.isRecuitmentError);
console.log('\\n\\n=== 2. ERREURS NON-RECRUTEMENT (24/61 = 39.3%) ===');

// Par catégorie
const nonRecruitmentByCategory = {};
nonRecruitmentErrors.forEach(err => {
  const cat = err.category;
  if (!nonRecruitmentByCategory[cat]) nonRecruitmentByCategory[cat] = [];
  nonRecruitmentByCategory[cat].push(err);
});

Object.entries(nonRecruitmentByCategory).forEach(([cat, errors]) => {
  console.log(`\\n${cat}: ${errors.length} cas`);
  errors.forEach(err => {
    console.log(`  - ${err.id}: "${err.title}" (${err.v2f}, score: ${err.score}, intent: ${err.intent})`);
  });
});

// 3. ANALYSE PAR SCORE
console.log('\\n\\n=== 3. ANALYSE PAR SCORE ===');
const scoreDistribution = {};
analysis.falsePositives.forEach(fp => {
  const score = fp.score;
  if (!scoreDistribution[score]) scoreDistribution[score] = [];
  scoreDistribution[score].push(fp);
});

Object.entries(scoreDistribution)
  .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
  .forEach(([score, errors]) => {
    console.log(`Score ${score}: ${errors.length} cas`);
    if (errors.length <= 3) {
      errors.forEach(err => {
        console.log(`  - ${err.title} (${err.intent})`);
      });
    }
  });

// 4. ANALYSE DES MOTS-CLÉS DÉCLENCHEURS
console.log('\\n\\n=== 4. MOTS-CLÉS DÉCLENCHEURS FRÉQUENTS ===');
const keywordCount = {
  prestation: 0,
  service: 0,
  services: 0,
  avis: 0,
  recrutement: 0,
  travaux: 0,
  fourniture: 0,
  mission: 0,
  étude: 0,
  évaluation: 0
};

analysis.falsePositives.forEach(fp => {
  const title = fp.title.toLowerCase();
  Object.keys(keywordCount).forEach(keyword => {
    if (title.includes(keyword)) {
      keywordCount[keyword]++;
    }
  });
});

Object.entries(keywordCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([keyword, count]) => {
    if (count > 0) {
      console.log(`${keyword}: ${count} occurences`);
    }
  });

// 5. PATTERNS PROBLÉMATIQUES IDENTIFIÉS
console.log('\\n\\n=== 5. PATTERNS PROBLÉMATIQUES IDENTIFIÉS ===');

// Score élevé mais incorrect
const highScoreErrors = analysis.falsePositives.filter(fp => fp.score >= 2.0);
console.log(`\\nScore ≥ 2.0 incorrects (${highScoreErrors.length} cas):`);
highScoreErrors.forEach(err => {
  console.log(`  - ${err.title} (score: ${err.score}, raisons: ${err.reasons.join(', ')})`);
});

// Score=0 avec révision par défaut
const score0Errors = analysis.falsePositives.filter(fp => fp.score === 0);
console.log(`\\nScore = 0 incorrects (${score0Errors.length} cas):`);
score0Errors.forEach(err => {
  console.log(`  - ${err.title} (intent: ${err.intent}, category: ${err.category})`);
});

// Intent MARKET incorrect
const marketIntentErrors = analysis.falsePositives.filter(fp => fp.intent === 'MARKET');
console.log(`\\nIntent MARKET incorrect (${marketIntentErrors.length} cas):`);
marketIntentErrors.forEach(err => {
  console.log(`  - ${err.title} (category: ${err.category})`);
});

console.log('\\n=== FIN ANALYSE DÉTAILLÉE ===');