/**
 * ANALYSE PERFORMANCE SHADOW V2D
 * ==============================
 * 
 * Comparaison automatique V2D vs validation humaine indépendante
 * Calcul des métriques de performance sur données jamais vues
 */

import fs from 'fs';
import path from 'path';

console.log('📊 ANALYSE PERFORMANCE SHADOW V2D - VALIDATION INDÉPENDANTE');
console.log('================================================================================');
console.log('🔒 V2D FIGÉ - Analyse sur données jamais vues par le classificateur');
console.log('');

// Chargement des résultats V2D
const resultsPath = path.join(process.cwd(), 'data', 'shadow-results-v2d.json');
const v2dResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Chargement de la validation humaine indépendante
const validationPath = path.join(process.cwd(), 'data', 'shadow-validation-humaine.csv');
const validationData = fs.readFileSync(validationPath, 'utf8');

// Parse du CSV de validation humaine
const humanClassifications = {};
const lines = validationData.split('\n');
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
        // Parse CSV avec gestion des guillemets
        const match = line.match(/^"([^"]+)","[^"]*","[^"]*","([^"]+)","[^"]*","([^"]+)"/);
        if (match) {
            const [, id, humanClass, detailedCategory] = match;
            humanClassifications[id] = {
                classification: humanClass.trim(),
                category: detailedCategory.trim()
            };
        }
    }
}

console.log(`✅ Chargement terminé:`);
console.log(`   - Résultats V2D: ${v2dResults.length}`);
console.log(`   - Classifications humaines: ${Object.keys(humanClassifications).length}`);
console.log('');

// === ANALYSE GLOBALE ===
console.log('🎯 ANALYSE GLOBALE - V2D vs HUMAIN');
console.log('================================================================================');

const globalAnalysis = {
    total: 0,
    correct: 0,
    confusion: {
        'VALID': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 },
        'REVIEW': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 },
        'REJECTED': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 }
    },
    categoryAnalysis: {},
    failures: {
        falsePositives: [], // Humain REJECTED, V2D VALID/REVIEW
        falseNegatives: [], // Humain VALID, V2D REJECTED
        ambiguityErrors: [] // Erreurs VALID ↔ REVIEW
    }
};

// Analyse de chaque échantillon
v2dResults.forEach(result => {
    const humanRef = humanClassifications[result.id];
    if (!humanRef) return;
    
    globalAnalysis.total++;
    const humanClass = humanRef.classification;
    const v2dClass = result.decision;
    const category = humanRef.category;
    
    // Matrice de confusion
    globalAnalysis.confusion[humanClass][v2dClass]++;
    
    // Exactitude
    if (humanClass === v2dClass) {
        globalAnalysis.correct++;
    }
    
    // Analyse par catégorie
    if (!globalAnalysis.categoryAnalysis[category]) {
        globalAnalysis.categoryAnalysis[category] = {
            total: 0, correct: 0, human: { VALID: 0, REVIEW: 0, REJECTED: 0 },
            v2d: { VALID: 0, REVIEW: 0, REJECTED: 0 }
        };
    }
    globalAnalysis.categoryAnalysis[category].total++;
    globalAnalysis.categoryAnalysis[category].human[humanClass]++;
    globalAnalysis.categoryAnalysis[category].v2d[v2dClass]++;
    if (humanClass === v2dClass) {
        globalAnalysis.categoryAnalysis[category].correct++;
    }
    
    // Analyse des échecs
    if (humanClass === 'REJECTED' && (v2dClass === 'VALID' || v2dClass === 'REVIEW')) {
        globalAnalysis.failures.falsePositives.push({
            id: result.id,
            title: result.title.substring(0, 60),
            human: humanClass,
            v2d: v2dClass,
            score: result.score,
            category: category,
            intent: result.primaryIntent
        });
    } else if (humanClass === 'VALID' && v2dClass === 'REJECTED') {
        globalAnalysis.failures.falseNegatives.push({
            id: result.id,
            title: result.title.substring(0, 60),
            human: humanClass,
            v2d: v2dClass,
            score: result.score,
            category: category
        });
    } else if ((humanClass === 'VALID' && v2dClass === 'REVIEW') || 
               (humanClass === 'REVIEW' && v2dClass === 'VALID')) {
        globalAnalysis.failures.ambiguityErrors.push({
            id: result.id,
            title: result.title.substring(0, 60),
            human: humanClass,
            v2d: v2dClass,
            score: result.score,
            category: category
        });
    }
});

// === CALCUL DES MÉTRIQUES ===
const metrics = {
    accuracy: (globalAnalysis.correct / globalAnalysis.total * 100).toFixed(1),
    
    // Précision et Rappel pour VALID
    precisionValid: globalAnalysis.confusion.VALID.VALID / 
        (globalAnalysis.confusion.VALID.VALID + globalAnalysis.confusion.REVIEW.VALID + globalAnalysis.confusion.REJECTED.VALID) * 100,
    recallValid: globalAnalysis.confusion.VALID.VALID / 
        (globalAnalysis.confusion.VALID.VALID + globalAnalysis.confusion.VALID.REVIEW + globalAnalysis.confusion.VALID.REJECTED) * 100,
    
    // Pollution (REJECTED classifiés comme VALID/REVIEW)
    pollutionCount: globalAnalysis.failures.falsePositives.length,
    pollutionRate: (globalAnalysis.failures.falsePositives.length / globalAnalysis.total * 100).toFixed(1),
    
    // Taux de REVIEW
    reviewRate: ((globalAnalysis.confusion.VALID.REVIEW + globalAnalysis.confusion.REVIEW.REVIEW + globalAnalysis.confusion.REJECTED.REVIEW) / globalAnalysis.total * 100).toFixed(1),
    
    // F1-Score pour VALID
    f1Valid: 0
};

metrics.f1Valid = (2 * (metrics.precisionValid * metrics.recallValid) / (metrics.precisionValid + metrics.recallValid)).toFixed(1);

console.log('📊 MÉTRIQUES DE PERFORMANCE:');
console.log('--------------------------------------------------');
console.log(`Exactitude (Accuracy):    ${metrics.accuracy}%`);
console.log(`Précision VALID:          ${metrics.precisionValid.toFixed(1)}%`);
console.log(`Rappel VALID:             ${metrics.recallValid.toFixed(1)}%`);
console.log(`F1-Score VALID:           ${metrics.f1Valid}%`);
console.log(`Pollution:                ${metrics.pollutionRate}% (${metrics.pollutionCount} cas)`);
console.log(`Taux de REVIEW:           ${metrics.reviewRate}%`);
console.log(`Faux négatifs:            ${globalAnalysis.failures.falseNegatives.length}`);
console.log(`Erreurs ambiguïté:        ${globalAnalysis.failures.ambiguityErrors.length}`);

// === MATRICE DE CONFUSION ===
console.log('');
console.log('📋 MATRICE DE CONFUSION:');
console.log('--------------------------------------------------');
console.log('            │  V2D →   │  VALID │ REVIEW │REJECTED│');
console.log('   HUMAIN ↓ │          │        │        │        │');
console.log('──────────────────────────────────────────────────');
console.log(`      VALID │          │   ${globalAnalysis.confusion.VALID.VALID.toString().padStart(4)} │   ${globalAnalysis.confusion.VALID.REVIEW.toString().padStart(4)} │   ${globalAnalysis.confusion.VALID.REJECTED.toString().padStart(4)} │`);
console.log(`     REVIEW │          │   ${globalAnalysis.confusion.REVIEW.VALID.toString().padStart(4)} │   ${globalAnalysis.confusion.REVIEW.REVIEW.toString().padStart(4)} │   ${globalAnalysis.confusion.REVIEW.REJECTED.toString().padStart(4)} │`);
console.log(`   REJECTED │          │   ${globalAnalysis.confusion.REJECTED.VALID.toString().padStart(4)} │   ${globalAnalysis.confusion.REJECTED.REVIEW.toString().padStart(4)} │   ${globalAnalysis.confusion.REJECTED.REJECTED.toString().padStart(4)} │`);

// === PERFORMANCE PAR CATÉGORIE ===
console.log('');
console.log('📈 PERFORMANCE PAR CATÉGORIE:');
console.log('================================================================================');

for (const [category, stats] of Object.entries(globalAnalysis.categoryAnalysis)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${category.padEnd(25)} ${stats.correct}/${stats.total} (${accuracy}%)`);
}

// === ANALYSE DES ÉCHECS CRITIQUES ===
if (globalAnalysis.failures.falsePositives.length > 0) {
    console.log('');
    console.log('🚨 FAUX POSITIFS (Pollution):');
    console.log('--------------------------------------------------');
    globalAnalysis.failures.falsePositives.forEach((failure, idx) => {
        console.log(`${idx + 1}. ${failure.title}...`);
        console.log(`   Humain: ${failure.human} | V2D: ${failure.v2d} | Score: ${failure.score}`);
        console.log(`   Catégorie: ${failure.category} | Intent: ${failure.intent}`);
    });
}

if (globalAnalysis.failures.falseNegatives.length > 0) {
    console.log('');
    console.log('🔴 FAUX NÉGATIFS (Vrais marchés rejetés):');
    console.log('--------------------------------------------------');
    globalAnalysis.failures.falseNegatives.forEach((failure, idx) => {
        console.log(`${idx + 1}. ${failure.title}...`);
        console.log(`   Humain: ${failure.human} | V2D: ${failure.v2d} | Score: ${failure.score}`);
        console.log(`   Catégorie: ${failure.category}`);
    });
}

// === COMPARAISON AVEC BENCHMARK HISTORIQUE ===
console.log('');
console.log('📊 COMPARAISON AVEC BENCHMARK HISTORIQUE');
console.log('================================================================================');
console.log('Benchmark Historique (50 échantillons):');
console.log('  ✅ Exactitude: 94.0%');
console.log('  ✅ Pollution: 0.0%');
console.log('  ✅ Recall VALID: 100.0%');
console.log('');
console.log('Dataset Shadow (39 échantillons - NOUVEAUX):');
console.log(`  ${metrics.accuracy >= 90 ? '✅' : metrics.accuracy >= 80 ? '⚠️' : '❌'} Exactitude: ${metrics.accuracy}%`);
console.log(`  ${metrics.pollutionRate <= 5 ? '✅' : metrics.pollutionRate <= 10 ? '⚠️' : '❌'} Pollution: ${metrics.pollutionRate}%`);
console.log(`  ${metrics.recallValid >= 95 ? '✅' : metrics.recallValid >= 90 ? '⚠️' : '❌'} Recall VALID: ${metrics.recallValid.toFixed(1)}%`);

// === VERDICT FINAL ===
console.log('');
console.log('🏁 VERDICT FINAL - ROBUSTESSE V2D');
console.log('==============================');

const robustnessScore = (parseFloat(metrics.accuracy) + (100 - parseFloat(metrics.pollutionRate)) + parseFloat(metrics.recallValid)) / 3;
const isRobust = parseFloat(metrics.accuracy) >= 85 && parseFloat(metrics.pollutionRate) <= 10 && parseFloat(metrics.recallValid) >= 90;

if (isRobust) {
    console.log('🎉 V2D VALIDÉ - ROBUSTE SUR DONNÉES NOUVELLES');
    console.log(`   ✅ Score de robustesse: ${robustnessScore.toFixed(1)}/100`);
    console.log('   ✅ Performance maintenue sur dataset shadow');
    console.log('   ✅ Prêt pour déploiement production');
} else {
    console.log('⚠️ V2D PARTIELLEMENT VALIDÉ');
    console.log(`   📊 Score de robustesse: ${robustnessScore.toFixed(1)}/100`);
    if (parseFloat(metrics.accuracy) < 85) console.log('   🔴 Exactitude insuffisante sur nouvelles données');
    if (parseFloat(metrics.pollutionRate) > 10) console.log('   🔴 Pollution trop élevée sur nouvelles données');
    if (parseFloat(metrics.recallValid) < 90) console.log('   🔴 Rappel VALID insuffisant');
    console.log('   🔧 Ajustements V2E nécessaires');
}

console.log('');
console.log('✨ Analyse shadow terminée - V2D évalué sur données inconnues');