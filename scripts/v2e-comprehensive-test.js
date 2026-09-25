/**
 * TEST COMPLET V2E - TOUTES DONNÉES COMBINÉES
 * ===========================================
 * 
 * Test V2E vs V2D sur:
 * 1. Benchmark historique (50 échantillons)
 * 2. Shadow dataset (39 échantillons) 
 * 3. Tests de régression (17 cas critiques)
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2D } from '../src/lib/intentClassifierV2D.js';
import { classifyWithIntentAnalysisV2E } from '../src/lib/intentClassifierV2E.js';

console.log('🔬 TEST COMPLET V2E vs V2D - TOUTES DONNÉES COMBINÉES');
console.log('================================================================================');
console.log('📊 Comparaison performance sur 3 datasets distincts');
console.log('');

// === TEST 1: BENCHMARK HISTORIQUE ===
console.log('📈 TEST 1: BENCHMARK HISTORIQUE (50 échantillons)');
console.log('================================================================================');

// Chargement benchmark historique
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

let h_v2d_correct = 0, h_v2e_correct = 0, h_total = 0;
let h_v2d_pollution = 0, h_v2e_pollution = 0;
let h_v2d_valid_recall = 0, h_v2e_valid_recall = 0, h_total_valid = 0;

historicalData.forEach(sample => {
    const humanClass = historicalRefs[sample.id];
    if (!humanClass) return;
    
    h_total++;
    if (humanClass === 'VALID') h_total_valid++;
    
    const v2d_result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
    const v2e_result = classifyWithIntentAnalysisV2E(sample.title, sample.description);
    
    if (v2d_result.classification === humanClass) h_v2d_correct++;
    if (v2e_result.classification === humanClass) h_v2e_correct++;
    
    if (humanClass === 'REJECTED' && (v2d_result.classification === 'VALID' || v2d_result.classification === 'REVIEW')) {
        h_v2d_pollution++;
    }
    if (humanClass === 'REJECTED' && (v2e_result.classification === 'VALID' || v2e_result.classification === 'REVIEW')) {
        h_v2e_pollution++;
    }
    
    if (humanClass === 'VALID' && v2d_result.classification === 'VALID') h_v2d_valid_recall++;
    if (humanClass === 'VALID' && v2e_result.classification === 'VALID') h_v2e_valid_recall++;
});

console.log('Résultats Benchmark Historique:');
console.log(`V2D: ${h_v2d_correct}/${h_total} (${(h_v2d_correct/h_total*100).toFixed(1)}%) - Pollution: ${(h_v2d_pollution/h_total*100).toFixed(1)}% - Recall VALID: ${(h_v2d_valid_recall/h_total_valid*100).toFixed(1)}%`);
console.log(`V2E: ${h_v2e_correct}/${h_total} (${(h_v2e_correct/h_total*100).toFixed(1)}%) - Pollution: ${(h_v2e_pollution/h_total*100).toFixed(1)}% - Recall VALID: ${(h_v2e_valid_recall/h_total_valid*100).toFixed(1)}%`);

// === TEST 2: SHADOW DATASET ===
console.log('');
console.log('🔍 TEST 2: SHADOW DATASET (39 échantillons - NOUVEAUX)');
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

let s_v2d_correct = 0, s_v2e_correct = 0, s_total = 0;
let s_v2d_pollution = 0, s_v2e_pollution = 0;
let s_v2d_valid_recall = 0, s_v2e_valid_recall = 0, s_total_valid = 0;

shadowData.forEach(sample => {
    const humanClass = shadowRefs[sample.id];
    if (!humanClass) return;
    
    s_total++;
    if (humanClass === 'VALID') s_total_valid++;
    
    const v2d_result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
    const v2e_result = classifyWithIntentAnalysisV2E(sample.title, sample.description);
    
    if (v2d_result.classification === humanClass) s_v2d_correct++;
    if (v2e_result.classification === humanClass) s_v2e_correct++;
    
    if (humanClass === 'REJECTED' && (v2d_result.classification === 'VALID' || v2d_result.classification === 'REVIEW')) {
        s_v2d_pollution++;
    }
    if (humanClass === 'REJECTED' && (v2e_result.classification === 'VALID' || v2e_result.classification === 'REVIEW')) {
        s_v2e_pollution++;
    }
    
    if (humanClass === 'VALID' && v2d_result.classification === 'VALID') s_v2d_valid_recall++;
    if (humanClass === 'VALID' && v2e_result.classification === 'VALID') s_v2e_valid_recall++;
});

console.log('Résultats Shadow Dataset:');
console.log(`V2D: ${s_v2d_correct}/${s_total} (${(s_v2d_correct/s_total*100).toFixed(1)}%) - Pollution: ${(s_v2d_pollution/s_total*100).toFixed(1)}% - Recall VALID: ${(s_v2d_valid_recall/s_total_valid*100).toFixed(1)}%`);
console.log(`V2E: ${s_v2e_correct}/${s_total} (${(s_v2e_correct/s_total*100).toFixed(1)}%) - Pollution: ${(s_v2e_pollution/s_total*100).toFixed(1)}% - Recall VALID: ${(s_v2e_valid_recall/s_total_valid*100).toFixed(1)}%`);

// === TEST 3: RÉGRESSION (17 cas critiques) ===
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

let r_v2d_correct = 0, r_v2e_correct = 0;

criticalCases.forEach((testCase, idx) => {
    const v2d_result = classifyWithIntentAnalysisV2D(testCase.title);
    const v2e_result = classifyWithIntentAnalysisV2E(testCase.title);
    
    const v2d_correct = v2d_result.classification === testCase.expected;
    const v2e_correct = v2e_result.classification === testCase.expected;
    
    if (v2d_correct) r_v2d_correct++;
    if (v2e_correct) r_v2e_correct++;
    
    console.log(`${(idx + 1).toString().padStart(2)}. ${testCase.title.substring(0, 60)}...`);
    console.log(`    Expected: ${testCase.expected} | V2D: ${v2d_result.classification} ${v2d_correct ? '✅' : '❌'} | V2E: ${v2e_result.classification} ${v2e_correct ? '✅' : '❌'}`);
});

console.log('');
console.log('Résultats Tests de Régression:');
console.log(`V2D: ${r_v2d_correct}/17 (${(r_v2d_correct/17*100).toFixed(1)}%)`);
console.log(`V2E: ${r_v2e_correct}/17 (${(r_v2e_correct/17*100).toFixed(1)}%)`);

// === TABLEAU COMPARATIF FINAL ===
console.log('');
console.log('📊 TABLEAU COMPARATIF FINAL V2D vs V2E');
console.log('================================================================================');

const metrics = [
    ['Dataset', 'Métrique', 'V2D', 'V2E', 'Évolution'],
    ['─'.repeat(20), '─'.repeat(15), '─'.repeat(8), '─'.repeat(8), '─'.repeat(12)],
    ['Benchmark (50)', 'Accuracy', `${(h_v2d_correct/h_total*100).toFixed(1)}%`, `${(h_v2e_correct/h_total*100).toFixed(1)}%`, `${((h_v2e_correct-h_v2d_correct)/h_total*100).toFixed(1)}%`],
    ['', 'Pollution', `${(h_v2d_pollution/h_total*100).toFixed(1)}%`, `${(h_v2e_pollution/h_total*100).toFixed(1)}%`, `${((h_v2e_pollution-h_v2d_pollution)/h_total*100).toFixed(1)}%`],
    ['', 'Recall VALID', `${(h_v2d_valid_recall/h_total_valid*100).toFixed(1)}%`, `${(h_v2e_valid_recall/h_total_valid*100).toFixed(1)}%`, `${((h_v2e_valid_recall-h_v2d_valid_recall)/h_total_valid*100).toFixed(1)}%`],
    ['', '', '', '', ''],
    ['Shadow (39)', 'Accuracy', `${(s_v2d_correct/s_total*100).toFixed(1)}%`, `${(s_v2e_correct/s_total*100).toFixed(1)}%`, `${((s_v2e_correct-s_v2d_correct)/s_total*100).toFixed(1)}%`],
    ['', 'Pollution', `${(s_v2d_pollution/s_total*100).toFixed(1)}%`, `${(s_v2e_pollution/s_total*100).toFixed(1)}%`, `${((s_v2e_pollution-s_v2d_pollution)/s_total*100).toFixed(1)}%`],
    ['', 'Recall VALID', `${(s_v2d_valid_recall/s_total_valid*100).toFixed(1)}%`, `${(s_v2e_valid_recall/s_total_valid*100).toFixed(1)}%`, `${((s_v2e_valid_recall-s_v2d_valid_recall)/s_total_valid*100).toFixed(1)}%`],
    ['', '', '', '', ''],
    ['Régression (17)', 'Accuracy', `${(r_v2d_correct/17*100).toFixed(1)}%`, `${(r_v2e_correct/17*100).toFixed(1)}%`, `${((r_v2e_correct-r_v2d_correct)/17*100).toFixed(1)}%`]
];

metrics.forEach(row => {
    console.log(`${row[0].padEnd(20)} │ ${row[1].padEnd(15)} │ ${row[2].padStart(8)} │ ${row[3].padStart(8)} │ ${row[4].padStart(12)}`);
});

// === VERDICT FINAL ===
console.log('');
console.log('🏁 VERDICT FINAL V2E');
console.log('==============================');

const overallImprovement = (
    ((h_v2e_correct - h_v2d_correct) / h_total) +
    ((s_v2e_correct - s_v2d_correct) / s_total) +
    ((r_v2e_correct - r_v2d_correct) / 17)
) / 3 * 100;

const shadowPerformance = (s_v2e_correct / s_total * 100);
const shadowPollution = (s_v2e_pollution / s_total * 100);

console.log(`Amélioration moyenne: ${overallImprovement.toFixed(1)}%`);
console.log(`Performance Shadow V2E: ${shadowPerformance.toFixed(1)}% (vs 79.5% V2D)`);
console.log(`Pollution Shadow V2E: ${shadowPollution.toFixed(1)}% (vs 12.8% V2D)`);

if (shadowPerformance >= 85 && shadowPollution <= 8 && overallImprovement > 0) {
    console.log('🎉 V2E VALIDE - Amélioration significative sur données nouvelles');
    console.log('📋 Prêt pour dataset de test final totalement inédit');
} else {
    console.log('⚠️ V2E amélioration insuffisante - Ajustements supplémentaires nécessaires');
}

console.log('');
console.log('✨ Test complet V2E terminé');