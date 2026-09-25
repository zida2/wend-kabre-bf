/**
 * VALIDATION COMPLÈTE V2F - COMPARAISON V2D vs V2E vs V2F
 * ========================================================
 * 
 * Test sur 3 datasets : Benchmark (50) + Shadow (39) + Régression (17)
 * RÈGLE ABSOLUE: Dataset final 10 cas NON utilisé
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2D } from '../src/lib/intentClassifierV2D.js';
import { classifyWithIntentAnalysisV2E } from '../src/lib/intentClassifierV2E.js';
import { classifyWithIntentAnalysisV2F } from '../src/lib/intentClassifierV2F.js';

console.log('🔬 VALIDATION COMPLÈTE V2F - COMPARAISON TRIPLE');
console.log('================================================================================');
console.log('📊 V2D vs V2E vs V2F sur datasets benchmark + shadow + régression');
console.log('🔒 Dataset final 10 cas PRÉSERVÉ pour validation finale');
console.log('');

// === FONCTIONS UTILITAIRES ===
function calculateMetrics(results, references) {
    const metrics = {
        total: 0,
        correct: { v2d: 0, v2e: 0, v2f: 0 },
        pollution: { v2d: 0, v2e: 0, v2f: 0 },
        validRecall: { v2d: 0, v2e: 0, v2f: 0 },
        totalValid: 0,
        reviewRate: { v2d: 0, v2e: 0, v2f: 0 }
    };
    
    results.forEach(result => {
        const humanClass = references[result.id];
        if (!humanClass) return;
        
        metrics.total++;
        if (humanClass === 'VALID') metrics.totalValid++;
        
        // Exactitude
        if (result.v2d === humanClass) metrics.correct.v2d++;
        if (result.v2e === humanClass) metrics.correct.v2e++;
        if (result.v2f === humanClass) metrics.correct.v2f++;
        
        // Pollution
        if (humanClass === 'REJECTED') {
            if (result.v2d === 'VALID' || result.v2d === 'REVIEW') metrics.pollution.v2d++;
            if (result.v2e === 'VALID' || result.v2e === 'REVIEW') metrics.pollution.v2e++;
            if (result.v2f === 'VALID' || result.v2f === 'REVIEW') metrics.pollution.v2f++;
        }
        
        // Recall VALID
        if (humanClass === 'VALID') {
            if (result.v2d === 'VALID') metrics.validRecall.v2d++;
            if (result.v2e === 'VALID') metrics.validRecall.v2e++;
            if (result.v2f === 'VALID') metrics.validRecall.v2f++;
        }
        
        // Taux REVIEW
        if (result.v2d === 'REVIEW') metrics.reviewRate.v2d++;
        if (result.v2e === 'REVIEW') metrics.reviewRate.v2e++;
        if (result.v2f === 'REVIEW') metrics.reviewRate.v2f++;
    });
    
    return metrics;
}

// === TEST 1: BENCHMARK HISTORIQUE ===
console.log('📈 TEST 1: BENCHMARK HISTORIQUE (50 échantillons)');
console.log('================================================================================');

const historicalData = JSON.parse(fs.readFileSync('data/real-data-samples.json', 'utf8'));
const historicalRefs = {};
const historicalCsv = fs.readFileSync('data/real-data-samples.csv', 'utf8');

historicalCsv.split('\n').forEach((line, idx) => {
    if (idx === 0) return;
    const match = line.match(/^"([^"]+)","[^"]*","[^"]*","([^"]+)"/);
    if (match) {
        const [, id, humanClass] = match;
        historicalRefs[id] = humanClass.trim();
    }
});

const benchmarkResults = [];
historicalData.forEach(sample => {
    const humanClass = historicalRefs[sample.id];
    if (!humanClass) return;
    
    const v2d_result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
    const v2e_result = classifyWithIntentAnalysisV2E(sample.title, sample.description);
    const v2f_result = classifyWithIntentAnalysisV2F(sample.title, sample.description);
    
    benchmarkResults.push({
        id: sample.id,
        title: sample.title,
        human: humanClass,
        v2d: v2d_result.classification,
        v2e: v2e_result.classification,
        v2f: v2f_result.classification,
        v2d_score: v2d_result.score,
        v2e_score: v2e_result.score,
        v2f_score: v2f_result.score
    });
});

const benchmarkMetrics = calculateMetrics(benchmarkResults, historicalRefs);

console.log('Résultats Benchmark:');
console.log(`V2D: ${benchmarkMetrics.correct.v2d}/${benchmarkMetrics.total} (${(benchmarkMetrics.correct.v2d/benchmarkMetrics.total*100).toFixed(1)}%) - Pollution: ${(benchmarkMetrics.pollution.v2d/benchmarkMetrics.total*100).toFixed(1)}% - Recall: ${(benchmarkMetrics.validRecall.v2d/benchmarkMetrics.totalValid*100).toFixed(1)}%`);
console.log(`V2E: ${benchmarkMetrics.correct.v2e}/${benchmarkMetrics.total} (${(benchmarkMetrics.correct.v2e/benchmarkMetrics.total*100).toFixed(1)}%) - Pollution: ${(benchmarkMetrics.pollution.v2e/benchmarkMetrics.total*100).toFixed(1)}% - Recall: ${(benchmarkMetrics.validRecall.v2e/benchmarkMetrics.totalValid*100).toFixed(1)}%`);
console.log(`V2F: ${benchmarkMetrics.correct.v2f}/${benchmarkMetrics.total} (${(benchmarkMetrics.correct.v2f/benchmarkMetrics.total*100).toFixed(1)}%) - Pollution: ${(benchmarkMetrics.pollution.v2f/benchmarkMetrics.total*100).toFixed(1)}% - Recall: ${(benchmarkMetrics.validRecall.v2f/benchmarkMetrics.totalValid*100).toFixed(1)}%`);

// === TEST 2: SHADOW DATASET ===
console.log('');
console.log('🔍 TEST 2: SHADOW DATASET (39 échantillons)');
console.log('================================================================================');

const shadowData = JSON.parse(fs.readFileSync('data/shadow-dataset-v2d.json', 'utf8'));
const shadowRefs = {};
const shadowCsv = fs.readFileSync('data/shadow-validation-humaine.csv', 'utf8');

shadowCsv.split('\n').forEach((line, idx) => {
    if (idx === 0) return;
    const match = line.match(/^"([^"]+)","[^"]*","[^"]*","([^"]+)"/);
    if (match) {
        const [, id, humanClass] = match;
        shadowRefs[id] = humanClass.trim();
    }
});

const shadowResults = [];
shadowData.forEach(sample => {
    const humanClass = shadowRefs[sample.id];
    if (!humanClass) return;
    
    const v2d_result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
    const v2e_result = classifyWithIntentAnalysisV2E(sample.title, sample.description);
    const v2f_result = classifyWithIntentAnalysisV2F(sample.title, sample.description);
    
    shadowResults.push({
        id: sample.id,
        title: sample.title,
        human: humanClass,
        v2d: v2d_result.classification,
        v2e: v2e_result.classification,
        v2f: v2f_result.classification,
        v2d_score: v2d_result.score,
        v2e_score: v2e_result.score,
        v2f_score: v2f_result.score
    });
});

const shadowMetrics = calculateMetrics(shadowResults, shadowRefs);

console.log('Résultats Shadow:');
console.log(`V2D: ${shadowMetrics.correct.v2d}/${shadowMetrics.total} (${(shadowMetrics.correct.v2d/shadowMetrics.total*100).toFixed(1)}%) - Pollution: ${(shadowMetrics.pollution.v2d/shadowMetrics.total*100).toFixed(1)}% - Recall: ${(shadowMetrics.validRecall.v2d/shadowMetrics.totalValid*100).toFixed(1)}%`);
console.log(`V2E: ${shadowMetrics.correct.v2e}/${shadowMetrics.total} (${(shadowMetrics.correct.v2e/shadowMetrics.total*100).toFixed(1)}%) - Pollution: ${(shadowMetrics.pollution.v2e/shadowMetrics.total*100).toFixed(1)}% - Recall: ${(shadowMetrics.validRecall.v2e/shadowMetrics.totalValid*100).toFixed(1)}%`);
console.log(`V2F: ${shadowMetrics.correct.v2f}/${shadowMetrics.total} (${(shadowMetrics.correct.v2f/shadowMetrics.total*100).toFixed(1)}%) - Pollution: ${(shadowMetrics.pollution.v2f/shadowMetrics.total*100).toFixed(1)}% - Recall: ${(shadowMetrics.validRecall.v2f/shadowMetrics.totalValid*100).toFixed(1)}%`);

// === TEST 3: RÉGRESSION ===
console.log('');
console.log('🎯 TEST 3: RÉGRESSION (17 cas critiques)');
console.log('================================================================================');

const criticalCases = [
    { title: "Avis de décès - Rappel à Dieu de l'ancien Ministre de l'Agriculture", expected: "REJECTED" },
    { title: "Rappel à Dieu du Docteur Jean-Baptiste OUEDRAOGO", expected: "REJECTED" },
    { title: "Avis de recrutement - Prestation de gardiennage pour bâtiments administratifs", expected: "REVIEW" },
    { title: "Recrutement prestataire sécurité pour installations gouvernementales", expected: "REVIEW" },
    { title: "Appel d'offres pour fourniture de matériel informatique", expected: "VALID" },
    { title: "Acquisition de véhicules tout-terrain pour la Direction Régionale", expected: "VALID" },
    { title: "Travaux de réfection de la route nationale RN1", expected: "VALID" },
    { title: "Soutenance de thèse de Master en Informatique - Université Joseph Ki-Zerbo", expected: "REJECTED" },
    { title: "Thèse de doctorat en Sciences Économiques - Soutenance publique", expected: "REJECTED" },
    { title: "Cérémonie d'inauguration du nouveau complexe sportif de Bobo-Dioulasso", expected: "REJECTED" },
    { title: "Inauguration officielle du centre de santé de Kaya", expected: "REJECTED" },
    { title: "Décret N°2024-001 portant nomination au sein du Ministère des Finances", expected: "REJECTED" },
    { title: "Nomination du nouveau Directeur Général des Impôts", expected: "REJECTED" },
    { title: "Poste vacant - Recrutement d'un comptable principal", expected: "REJECTED" },
    { title: "Offre d'emploi - Agent de bureau au Ministère de l'Éducation", expected: "REJECTED" },
    { title: "Prestation de services de nettoyage des bureaux ministériels", expected: "VALID" },
    { title: "Contrat de maintenance des équipements informatiques", expected: "VALID" }
];

let r_v2d_correct = 0, r_v2e_correct = 0, r_v2f_correct = 0;

criticalCases.forEach((testCase, idx) => {
    const v2d_result = classifyWithIntentAnalysisV2D(testCase.title);
    const v2e_result = classifyWithIntentAnalysisV2E(testCase.title);
    const v2f_result = classifyWithIntentAnalysisV2F(testCase.title);
    
    const v2d_correct = v2d_result.classification === testCase.expected;
    const v2e_correct = v2e_result.classification === testCase.expected;
    const v2f_correct = v2f_result.classification === testCase.expected;
    
    if (v2d_correct) r_v2d_correct++;
    if (v2e_correct) r_v2e_correct++;
    if (v2f_correct) r_v2f_correct++;
    
    console.log(`${(idx + 1).toString().padStart(2)}. ${testCase.title.substring(0, 50)}...`);
    console.log(`    Expected: ${testCase.expected}`);
    console.log(`    V2D: ${v2d_result.classification} ${v2d_correct ? '✅' : '❌'} | V2E: ${v2e_result.classification} ${v2e_correct ? '✅' : '❌'} | V2F: ${v2f_result.classification} ${v2f_correct ? '✅' : '❌'}`);
});

console.log('');
console.log('Résultats Tests de Régression:');
console.log(`V2D: ${r_v2d_correct}/17 (${(r_v2d_correct/17*100).toFixed(1)}%)`);
console.log(`V2E: ${r_v2e_correct}/17 (${(r_v2e_correct/17*100).toFixed(1)}%)`);
console.log(`V2F: ${r_v2f_correct}/17 (${(r_v2f_correct/17*100).toFixed(1)}%)`);

// === TABLEAU COMPARATIF FINAL ===
console.log('');
console.log('📊 TABLEAU COMPARATIF FINAL V2D vs V2E vs V2F');
console.log('================================================================================');

const metrics = [
    ['Dataset', 'Métrique', 'V2D', 'V2E', 'V2F', 'V2E→V2F'],
    ['─'.repeat(15), '─'.repeat(12), '─'.repeat(8), '─'.repeat(8), '─'.repeat(8), '─'.repeat(10)],
    ['Benchmark (50)', 'Accuracy', `${(benchmarkMetrics.correct.v2d/benchmarkMetrics.total*100).toFixed(1)}%`, `${(benchmarkMetrics.correct.v2e/benchmarkMetrics.total*100).toFixed(1)}%`, `${(benchmarkMetrics.correct.v2f/benchmarkMetrics.total*100).toFixed(1)}%`, `${((benchmarkMetrics.correct.v2f-benchmarkMetrics.correct.v2e)/benchmarkMetrics.total*100).toFixed(1)}%`],
    ['', 'Pollution', `${(benchmarkMetrics.pollution.v2d/benchmarkMetrics.total*100).toFixed(1)}%`, `${(benchmarkMetrics.pollution.v2e/benchmarkMetrics.total*100).toFixed(1)}%`, `${(benchmarkMetrics.pollution.v2f/benchmarkMetrics.total*100).toFixed(1)}%`, `${((benchmarkMetrics.pollution.v2f-benchmarkMetrics.pollution.v2e)/benchmarkMetrics.total*100).toFixed(1)}%`],
    ['', 'Recall VALID', `${(benchmarkMetrics.validRecall.v2d/benchmarkMetrics.totalValid*100).toFixed(1)}%`, `${(benchmarkMetrics.validRecall.v2e/benchmarkMetrics.totalValid*100).toFixed(1)}%`, `${(benchmarkMetrics.validRecall.v2f/benchmarkMetrics.totalValid*100).toFixed(1)}%`, `${((benchmarkMetrics.validRecall.v2f-benchmarkMetrics.validRecall.v2e)/benchmarkMetrics.totalValid*100).toFixed(1)}%`],
    ['', '', '', '', '', ''],
    ['Shadow (39)', 'Accuracy', `${(shadowMetrics.correct.v2d/shadowMetrics.total*100).toFixed(1)}%`, `${(shadowMetrics.correct.v2e/shadowMetrics.total*100).toFixed(1)}%`, `${(shadowMetrics.correct.v2f/shadowMetrics.total*100).toFixed(1)}%`, `${((shadowMetrics.correct.v2f-shadowMetrics.correct.v2e)/shadowMetrics.total*100).toFixed(1)}%`],
    ['', 'Pollution', `${(shadowMetrics.pollution.v2d/shadowMetrics.total*100).toFixed(1)}%`, `${(shadowMetrics.pollution.v2e/shadowMetrics.total*100).toFixed(1)}%`, `${(shadowMetrics.pollution.v2f/shadowMetrics.total*100).toFixed(1)}%`, `${((shadowMetrics.pollution.v2f-shadowMetrics.pollution.v2e)/shadowMetrics.total*100).toFixed(1)}%`],
    ['', 'Recall VALID', `${(shadowMetrics.validRecall.v2d/shadowMetrics.totalValid*100).toFixed(1)}%`, `${(shadowMetrics.validRecall.v2e/shadowMetrics.totalValid*100).toFixed(1)}%`, `${(shadowMetrics.validRecall.v2f/shadowMetrics.totalValid*100).toFixed(1)}%`, `${((shadowMetrics.validRecall.v2f-shadowMetrics.validRecall.v2e)/shadowMetrics.totalValid*100).toFixed(1)}%`],
    ['', '', '', '', '', ''],
    ['Régression (17)', 'Accuracy', `${(r_v2d_correct/17*100).toFixed(1)}%`, `${(r_v2e_correct/17*100).toFixed(1)}%`, `${(r_v2f_correct/17*100).toFixed(1)}%`, `${((r_v2f_correct-r_v2e_correct)/17*100).toFixed(1)}%`]
];

metrics.forEach(row => {
    console.log(`${row[0].padEnd(15)} │ ${row[1].padEnd(12)} │ ${row[2].padStart(8)} │ ${row[3].padStart(8)} │ ${row[4].padStart(8)} │ ${row[5].padStart(10)}`);
});

// === ANALYSE CHANGEMENTS V2E → V2F ===
console.log('');
console.log('🔄 CHANGEMENTS V2E → V2F (Benchmark)');
console.log('================================================================================');

const changes = benchmarkResults.filter(r => r.v2e !== r.v2f);
console.log(`Modifications: ${changes.length}/${benchmarkResults.length}`);

changes.forEach((change, idx) => {
    const improvement = (change.human === change.v2f && change.human !== change.v2e) ? '📈' : 
                       (change.human === change.v2e && change.human !== change.v2f) ? '📉' : '🔄';
    
    console.log(`${idx + 1}. ${improvement} ${change.title.substring(0, 60)}...`);
    console.log(`   Humain: ${change.human} | V2E: ${change.v2e} → V2F: ${change.v2f}`);
});

// === VERDICT FINAL V2F ===
console.log('');
console.log('🏁 VERDICT FINAL V2F');
console.log('==============================');

const benchmarkImprovement = benchmarkMetrics.correct.v2f - benchmarkMetrics.correct.v2e;
const shadowMaintained = Math.abs(shadowMetrics.correct.v2f - shadowMetrics.correct.v2e) <= 1;
const pollutionControlled = shadowMetrics.pollution.v2f <= 2;

console.log(`Benchmark: ${benchmarkImprovement > 0 ? '📈' : benchmarkImprovement < 0 ? '📉' : '➡️'} ${benchmarkImprovement >= 0 ? '+' : ''}${benchmarkImprovement} cas (${((benchmarkImprovement/benchmarkMetrics.total)*100).toFixed(1)}%)`);
console.log(`Shadow: ${shadowMaintained ? '✅' : '⚠️'} Performance ${shadowMaintained ? 'maintenue' : 'dégradée'}`);
console.log(`Pollution: ${pollutionControlled ? '✅' : '❌'} ${shadowMetrics.pollution.v2f} cas shadow`);

if (benchmarkImprovement >= 4 && shadowMaintained && pollutionControlled) {
    console.log('🎉 V2F VALIDÉ - Équilibre réussi entre benchmark et shadow');
    console.log('📋 Prêt pour GEL V2F et test final sur dataset vierge');
} else if (benchmarkImprovement >= 0 && shadowMaintained && pollutionControlled) {
    console.log('✅ V2F acceptable - Compromis équilibré atteint');
    console.log('📊 Considérer pour test final selon objectifs');
} else {
    console.log('⚠️ V2F compromis insuffisant - Analyser déséquilibres');
}

console.log('');
console.log('✨ Validation V2F terminée - Analyse complète sur 3 datasets');