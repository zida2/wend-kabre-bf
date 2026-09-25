/**
 * SMOKE TEST FINAL V2F - DATASET VIERGE 10 CAS
 * =============================================
 * 
 * 🔒 V2F GELÉE - Aucune modification autorisée
 * Test indépendant sur dataset final jamais utilisé en développement
 * 
 * RÈGLES STRICTES:
 * - Ne pas modifier V2F selon résultats
 * - Ne pas ajuster règles après analyse  
 * - Ne pas étendre dataset final
 * - Enregistrer prédictions brutes avant analyse
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2F } from '../src/lib/intentClassifierV2F.js';

console.log('🔍 SMOKE TEST FINAL V2F - DATASET VIERGE');
console.log('================================================================================');
console.log('🔒 V2F VERSION GELÉE - Aucune modification autorisée');
console.log('📊 Test sur 10 cas totalement vierges jamais utilisés en développement');
console.log('⚠️ Résultats pour détection régression seulement, pas validation robustesse');
console.log('');

// Chargement du dataset final vierge
const finalDataPath = path.join(process.cwd(), 'data', 'final-test-dataset.json');
const finalData = JSON.parse(fs.readFileSync(finalDataPath, 'utf8'));

console.log(`📁 Dataset final: ${finalData.length} cas vierges`);
console.log('');

// Classifications humaines indépendantes pour le dataset final
const finalHumanRefs = {
    "final-test-001": "VALID",     // Hôpital universitaire - marché construction 
    "final-test-002": "VALID",     // Ordinateurs lycées - marché fourniture
    "final-test-003": "REVIEW",    // Surveillance frontières - prestation ambiguë
    "final-test-004": "REJECTED",  // Communiqué coopération - communication officielle
    "final-test-005": "REJECTED",  // Avis décès général - contenu non-marché
    "final-test-006": "VALID",     // Forages solaires - marché travaux
    "final-test-007": "REJECTED",  // Colloque agriculture - contenu académique
    "final-test-008": "REJECTED",  // Recrutement agents santé - recrutement direct
    "final-test-009": "VALID",     // Blanchisserie hôpitaux - prestation service
    "final-test-010": "REJECTED"   // Inauguration pont - événement officiel
};

console.log('👤 Classifications humaines indépendantes définies');
console.log('🤖 Exécution V2F sur les 10 cas...');
console.log('');

// === EXÉCUTION V2F SUR DATASET FINAL ===
console.log('📋 PRÉDICTIONS BRUTES V2F (avant analyse)');
console.log('================================================================================');

const finalResults = [];
let rawPredictionsString = '';

finalData.forEach((sample, idx) => {
    const humanClass = finalHumanRefs[sample.id];
    const v2f_result = classifyWithIntentAnalysisV2F(sample.title, sample.description);
    
    const result = {
        id: sample.id,
        title: sample.title,
        humanClass: humanClass,
        v2fClass: v2f_result.classification,
        score: v2f_result.score,
        confidence: v2f_result.confidence,
        primaryIntent: v2f_result.intentAnalysis.primaryIntent,
        contentType: v2f_result.intentAnalysis.contentType,
        signalsDetected: `R:${v2f_result.intentAnalysis.recruitmentScore}, M:${v2f_result.intentAnalysis.marketScore}`,
        reasons: v2f_result.reasons.join(' | '),
        correct: humanClass === v2f_result.classification
    };
    
    finalResults.push(result);
    
    // Enregistrement prédiction brute
    rawPredictionsString += `${sample.id}: ${v2f_result.classification}\n`;
    
    console.log(`${(idx + 1).toString().padStart(2)}. ID: ${sample.id}`);
    console.log(`    Titre: ${sample.title.substring(0, 70)}...`);
    console.log(`    Humain: ${humanClass} | V2F: ${v2f_result.classification} ${result.correct ? '✅' : '❌'}`);
    console.log(`    Score: ${v2f_result.score} | Intent: ${v2f_result.intentAnalysis.primaryIntent}`);
    console.log(`    Signaux: ${result.signalsDetected}`);
    console.log(`    Type: ${v2f_result.intentAnalysis.contentType}`);
    console.log('');
});

// Sauvegarde prédictions brutes
fs.writeFileSync('data/v2f-smoke-raw-predictions.txt', rawPredictionsString);

// === CALCUL MÉTRIQUES SMOKE TEST ===
console.log('📊 MÉTRIQUES SMOKE TEST FINAL');
console.log('================================================================================');

const smokeMetrics = {
    total: finalResults.length,
    correct: finalResults.filter(r => r.correct).length,
    accuracy: 0,
    
    // Métriques par classe
    validPredicted: finalResults.filter(r => r.v2fClass === 'VALID').length,
    validCorrect: finalResults.filter(r => r.humanClass === 'VALID' && r.v2fClass === 'VALID').length,
    validTotal: finalResults.filter(r => r.humanClass === 'VALID').length,
    
    reviewPredicted: finalResults.filter(r => r.v2fClass === 'REVIEW').length,
    reviewCorrect: finalResults.filter(r => r.humanClass === 'REVIEW' && r.v2fClass === 'REVIEW').length,
    reviewTotal: finalResults.filter(r => r.humanClass === 'REVIEW').length,
    
    rejectedPredicted: finalResults.filter(r => r.v2fClass === 'REJECTED').length,
    rejectedCorrect: finalResults.filter(r => r.humanClass === 'REJECTED' && r.v2fClass === 'REJECTED').length,
    rejectedTotal: finalResults.filter(r => r.humanClass === 'REJECTED').length,
    
    // Pollution
    pollution: finalResults.filter(r => r.humanClass === 'REJECTED' && (r.v2fClass === 'VALID' || r.v2fClass === 'REVIEW')).length,
    
    // Erreurs spécifiques
    falsePositives: finalResults.filter(r => r.humanClass === 'REJECTED' && r.v2fClass !== 'REJECTED'),
    falseNegatives: finalResults.filter(r => r.humanClass === 'VALID' && r.v2fClass === 'REJECTED')
};

smokeMetrics.accuracy = (smokeMetrics.correct / smokeMetrics.total * 100).toFixed(1);

// Calculs précision/rappel
const precision = smokeMetrics.validTotal > 0 ? (smokeMetrics.validCorrect / smokeMetrics.validPredicted * 100) : 0;
const recall = smokeMetrics.validTotal > 0 ? (smokeMetrics.validCorrect / smokeMetrics.validTotal * 100) : 0;
const f1 = (precision > 0 && recall > 0) ? (2 * precision * recall / (precision + recall)) : 0;

console.log(`Exactitude:           ${smokeMetrics.accuracy}%`);
console.log(`Précision VALID:      ${precision.toFixed(1)}%`);
console.log(`Rappel VALID:         ${recall.toFixed(1)}%`);
console.log(`F1-Score VALID:       ${f1.toFixed(1)}%`);
console.log(`Pollution:            ${(smokeMetrics.pollution / smokeMetrics.total * 100).toFixed(1)}% (${smokeMetrics.pollution} cas)`);
console.log(`Faux positifs:        ${smokeMetrics.falsePositives.length}`);
console.log(`Faux négatifs:        ${smokeMetrics.falseNegatives.length}`);
console.log(`Taux REVIEW:          ${(smokeMetrics.reviewPredicted / smokeMetrics.total * 100).toFixed(1)}%`);

// === ANALYSE PAR CATÉGORIE ===
console.log('');
console.log('🏷️ RÉPARTITION PAR CATÉGORIE');
console.log('================================================================================');

const categoryAnalysis = {};
finalResults.forEach(result => {
    const category = 
        result.humanClass === 'VALID' ? 'MARCHÉS VALIDES' :
        result.humanClass === 'REVIEW' ? 'CAS AMBIGUS' : 'CONTENUS NON-MARCHÉS';
    
    if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = { total: 0, correct: 0, cases: [] };
    }
    categoryAnalysis[category].total++;
    if (result.correct) categoryAnalysis[category].correct++;
    categoryAnalysis[category].cases.push(result);
});

for (const [category, stats] of Object.entries(categoryAnalysis)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${category.padEnd(20)} ${stats.correct}/${stats.total} (${accuracy}%)`);
}

// === ERREURS DÉTAILLÉES ===
if (smokeMetrics.falsePositives.length > 0 || smokeMetrics.falseNegatives.length > 0) {
    console.log('');
    console.log('❌ ERREURS DÉTECTÉES');
    console.log('================================================================================');
    
    if (smokeMetrics.falsePositives.length > 0) {
        console.log('🚨 Faux Positifs (Pollution):');
        smokeMetrics.falsePositives.forEach((error, idx) => {
            console.log(`${idx + 1}. ${error.title.substring(0, 60)}...`);
            console.log(`   Humain: ${error.humanClass} | V2F: ${error.v2fClass}`);
            console.log(`   Score: ${error.score} | Type: ${error.contentType}`);
        });
    }
    
    if (smokeMetrics.falseNegatives.length > 0) {
        console.log('🔴 Faux Négatifs (Vrais marchés rejetés):');
        smokeMetrics.falseNegatives.forEach((error, idx) => {
            console.log(`${idx + 1}. ${error.title.substring(0, 60)}...`);
            console.log(`   Humain: ${error.humanClass} | V2F: ${error.v2fClass}`);
            console.log(`   Score: ${error.score} | Intent: ${error.primaryIntent}`);
        });
    }
}

// === COMPARAISON AVEC DATASETS PRÉCÉDENTS ===
console.log('');
console.log('📈 COMPARAISON MULTI-DATASETS');
console.log('================================================================================');

// Métriques des datasets précédents (depuis validation V2F)
const benchmarkAccuracy = 94.0;
const shadowAccuracy = 92.3;
const regressionAccuracy = 100.0;

const comparisonData = [
    ['Dataset', 'Taille', 'Accuracy', 'Status'],
    ['─'.repeat(15), '─'.repeat(8), '─'.repeat(10), '─'.repeat(20)],
    ['Benchmark', '50', `${benchmarkAccuracy}%`, '✅ Développement V2D'],
    ['Shadow', '39', `${shadowAccuracy}%`, '✅ Corrections V2E'],
    ['Régression', '17', `${regressionAccuracy}%`, '✅ Tests critiques'],
    ['Final (smoke)', '10', `${smokeMetrics.accuracy}%`, '🔍 Test indépendant']
];

comparisonData.forEach(row => {
    console.log(`${row[0].padEnd(15)} │ ${row[1].padStart(8)} │ ${row[2].padStart(10)} │ ${row[3]}`);
});

// === VERDICT SMOKE TEST ===
console.log('');
console.log('🎯 VERDICT SMOKE TEST');
console.log('==============================');

const smokeAccuracy = parseFloat(smokeMetrics.accuracy);
const smokePollution = (smokeMetrics.pollution / smokeMetrics.total * 100);

// Critères smoke test (plus tolérants que production)
const smokePassCriteria = {
    minAccuracy: 70.0,   // Tolérant pour 10 cas
    maxPollution: 20.0,  // Détection régression grossière
    noMajorFailure: smokeMetrics.falseNegatives.length === 0 // Pas de vrais marchés ratés
};

const smokePassed = smokeAccuracy >= smokePassCriteria.minAccuracy && 
                   smokePollution <= smokePassCriteria.maxPollution && 
                   smokePassCriteria.noMajorFailure;

if (smokePassed) {
    console.log('✅ SMOKE TEST RÉUSSI');
    console.log(`   📊 Exactitude: ${smokeMetrics.accuracy}% (≥ ${smokePassCriteria.minAccuracy}%)`);
    console.log(`   🛡️ Pollution: ${smokePollution.toFixed(1)}% (≤ ${smokePassCriteria.maxPollution}%)`);
    console.log(`   🎯 Pas de faux négatifs critiques`);
    console.log('');
    console.log('🔒 V2F DÉFINITIVEMENT GELÉE pour holdout vierge');
    console.log('📋 Prochaine étape: Créer holdout 100-300 contenus inédits');
} else {
    console.log('⚠️ SMOKE TEST RÉVÈLE PROBLÈMES');
    if (smokeAccuracy < smokePassCriteria.minAccuracy) {
        console.log(`   🔴 Exactitude: ${smokeMetrics.accuracy}% (< ${smokePassCriteria.minAccuracy}%)`);
    }
    if (smokePollution > smokePassCriteria.maxPollution) {
        console.log(`   🔴 Pollution: ${smokePollution.toFixed(1)}% (> ${smokePassCriteria.maxPollution}%)`);
    }
    if (!smokePassCriteria.noMajorFailure) {
        console.log(`   🔴 Faux négatifs: ${smokeMetrics.falseNegatives.length} vrais marchés ratés`);
    }
    console.log('');
    console.log('📋 Options:');
    console.log('   1. 🔒 Geler V2F malgré problèmes (smoke = détection régression)');
    console.log('   2. 🔧 Développer V2G pour corriger régressions identifiées');
    console.log('   3. 🧪 Analyser si problèmes sont dus à la petite taille (10 cas)');
}

console.log('');
console.log('⚠️ RAPPEL IMPORTANT');
console.log('==============================');
console.log('Ce smoke test sur 10 cas ne valide PAS la robustesse générale.');
console.log('Il sert uniquement à détecter des régressions grossières.');
console.log('La validation finale nécessite un holdout 100-300 contenus inédits.');

console.log('');
console.log('✨ Smoke test terminé - V2F status défini');

// Sauvegarde résultats complets
const fullResults = {
    smokeTestResults: finalResults,
    metrics: smokeMetrics,
    verdict: smokePassed ? 'PASSED' : 'FAILED',
    timestamp: new Date().toISOString(),
    note: 'Smoke test sur 10 cas - V2F gelée'
};

fs.writeFileSync('data/v2f-smoke-test-results.json', JSON.stringify(fullResults, null, 2));
console.log('📁 Résultats sauvegardés: data/v2f-smoke-test-results.json');