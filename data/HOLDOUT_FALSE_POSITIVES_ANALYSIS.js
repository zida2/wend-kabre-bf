// Analyse complète des faux positifs V2F - Holdout 221
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

// Analyser tous les faux positifs
const allFalsePositives = [];
const detailedAnalysis = {
  byIntentDetected: {},
  byScore: {},
  byCategory: {},
  byTriggeringPattern: {},
  recruitmentErrors: {
    prestation: 0,
    service: 0,
    avis: 0,
    recherche: 0,
    recrutement: 0,
    agents: 0,
    candidates: 0,
    autres: 0
  }
};

// Traiter chaque échantillon REJECTED
humanRef
  .filter(ref => ref.classification === 'REJECTED')
  .forEach(ref => {
    const sample = holdoutData.find(h => h.id === ref.id);
    if (!sample) {
      console.log(`Missing sample: ${ref.id}`);
      return;
    }

    // Classer avec V2F
    const prediction = classifyWithIntentAnalysisV2F(sample.title, sample.description);
    
    // Si prédit VALID ou REVIEW → faux positif
    if (prediction.classification === 'VALID' || prediction.classification === 'REVIEW') {
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
        isRecuitmentError: ref.category.startsWith('recruitment_')
      };

      allFalsePositives.push(error);

      // Analyser les patterns
      if (!detailedAnalysis.byIntentDetected[prediction.intentAnalysis.primaryIntent]) {
        detailedAnalysis.byIntentDetected[prediction.intentAnalysis.primaryIntent] = 0;
      }
      detailedAnalysis.byIntentDetected[prediction.intentAnalysis.primaryIntent]++;

      if (!detailedAnalysis.byScore[prediction.score]) {
        detailedAnalysis.byScore[prediction.score] = 0;
      }
      detailedAnalysis.byScore[prediction.score]++;

      if (!detailedAnalysis.byCategory[ref.category]) {
        detailedAnalysis.byCategory[ref.category] = 0;
      }
      detailedAnalysis.byCategory[ref.category]++;

      // Analyser les erreurs de recrutement spécifiquement
      if (ref.category.startsWith('recruitment_')) {
        const title = sample.title.toLowerCase();
        if (title.includes('prestation')) {
          detailedAnalysis.recruitmentErrors.prestation++;
        } else if (title.includes('service')) {
          detailedAnalysis.recruitmentErrors.service++;
        } else if (title.includes('avis')) {
          detailedAnalysis.recruitmentErrors.avis++;
        } else if (title.includes('recherche')) {
          detailedAnalysis.recruitmentErrors.recherche++;
        } else if (title.includes('recrutement')) {
          detailedAnalysis.recruitmentErrors.recrutement++;
        } else if (title.includes('agent')) {
          detailedAnalysis.recruitmentErrors.agents++;
        } else if (title.includes('candidat')) {
          detailedAnalysis.recruitmentErrors.candidates++;
        } else {
          detailedAnalysis.recruitmentErrors.autres++;
        }
      }
    }
  });

// Résultats
const results = {
  totalFalsePositives: allFalsePositives.length,
  falsePositives: allFalsePositives,
  analysis: detailedAnalysis,
  summary: {
    validErrors: allFalsePositives.filter(fp => fp.v2f === 'VALID').length,
    reviewErrors: allFalsePositives.filter(fp => fp.v2f === 'REVIEW').length,
    recruitmentErrors: allFalsePositives.filter(fp => fp.isRecuitmentError).length,
    nonRecruitmentErrors: allFalsePositives.filter(fp => !fp.isRecuitmentError).length
  }
};

// Sauvegarder les résultats
fs.writeFileSync('../data/COMPLETE_FALSE_POSITIVES_ANALYSIS.json', JSON.stringify(results, null, 2));

console.log('=== ANALYSE FAUX POSITIFS V2F ===');
console.log(`Total faux positifs: ${results.totalFalsePositives}`);
console.log(`VALID erronés: ${results.summary.validErrors}`);
console.log(`REVIEW erronés: ${results.summary.reviewErrors}`);
console.log(`Erreurs recrutement: ${results.summary.recruitmentErrors}`);
console.log(`Autres erreurs: ${results.summary.nonRecruitmentErrors}`);

console.log('\n=== PAR INTENTION DÉTECTÉE ===');
Object.entries(detailedAnalysis.byIntentDetected).forEach(([intent, count]) => {
  console.log(`${intent}: ${count}`);
});

console.log('\n=== ERREURS RECRUTEMENT PAR PATTERN ===');
Object.entries(detailedAnalysis.recruitmentErrors).forEach(([pattern, count]) => {
  console.log(`${pattern}: ${count}`);
});

console.log('\nAnalyse complète sauvée dans: data/COMPLETE_FALSE_POSITIVES_ANALYSIS.json');