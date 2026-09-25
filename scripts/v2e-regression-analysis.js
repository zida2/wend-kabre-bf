/**
 * ANALYSE RÉGRESSION V2E SUR BENCHMARK HISTORIQUE
 * ===============================================
 * 
 * Identification des 9 nouveaux échecs V2E pour créer V2F équilibrée
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2D } from '../src/lib/intentClassifierV2D.js';
import { classifyWithIntentAnalysisV2E } from '../src/lib/intentClassifierV2E.js';

console.log('🔬 ANALYSE RÉGRESSION V2E - NOUVEAUX ÉCHECS');
console.log('================================================================================');
console.log('🎯 Identification des cas où V2D réussit mais V2E échoue');
console.log('');

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

console.log('📊 COMPARAISON V2D vs V2E - ÉCHEC PAR ÉCHEC');
console.log('================================================================================');

const regressions = []; // V2D ✅ mais V2E ❌
const improvements = []; // V2D ❌ mais V2E ✅
const bothWrong = [];    // V2D ❌ et V2E ❌
const bothRight = [];   // V2D ✅ et V2E ✅

historicalData.forEach(sample => {
    const humanClass = historicalRefs[sample.id];
    if (!humanClass) return;
    
    const v2d_result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
    const v2e_result = classifyWithIntentAnalysisV2E(sample.title, sample.description);
    
    const v2d_correct = v2d_result.classification === humanClass;
    const v2e_correct = v2e_result.classification === humanClass;
    
    const analysis = {
        id: sample.id,
        title: sample.title,
        humanClass,
        v2d_result: v2d_result.classification,
        v2e_result: v2e_result.classification,
        v2d_score: v2d_result.score,
        v2e_score: v2e_result.score,
        v2d_intent: v2d_result.intentAnalysis.primaryIntent,
        v2e_intent: v2e_result.intentAnalysis.primaryIntent,
        v2d_reasons: v2d_result.reasons.join(' | '),
        v2e_reasons: v2e_result.reasons.join(' | ')
    };
    
    if (v2d_correct && !v2e_correct) {
        regressions.push(analysis);
    } else if (!v2d_correct && v2e_correct) {
        improvements.push(analysis);
    } else if (!v2d_correct && !v2e_correct) {
        bothWrong.push(analysis);
    } else {
        bothRight.push(analysis);
    }
});

console.log(`✅ V2D et V2E corrects: ${bothRight.length}`);
console.log(`📈 V2E améliore V2D: ${improvements.length}`);
console.log(`📉 V2E régresse vs V2D: ${regressions.length}`); 
console.log(`❌ V2D et V2E échouent: ${bothWrong.length}`);
console.log('');

// === ANALYSE DES RÉGRESSIONS V2E ===
console.log('📉 RÉGRESSIONS V2E (V2D ✅ → V2E ❌)');
console.log('================================================================================');

regressions.forEach((reg, idx) => {
    console.log(`${idx + 1}. ID: ${reg.id}`);
    console.log(`   Titre: ${reg.title.substring(0, 80)}...`);
    console.log(`   Humain: ${reg.humanClass}`);
    console.log(`   V2D: ${reg.v2d_result} (${reg.v2d_score}) ✅`);
    console.log(`   V2E: ${reg.v2e_result} (${reg.v2e_score}) ❌`);
    console.log(`   V2D Intent: ${reg.v2d_intent} | V2E Intent: ${reg.v2e_intent}`);
    console.log(`   V2D Raisons: ${reg.v2d_reasons}`);
    console.log(`   V2E Raisons: ${reg.v2e_reasons}`);
    
    // Analyse de la cause de régression
    let causeRegression = '';
    if (reg.humanClass === 'VALID' && reg.v2e_result === 'REJECTED' && reg.v2e_score === 0) {
        causeRegression = 'V2E_SCORE_ZERO_TROP_AGRESSIF';
    } else if (reg.humanClass === 'VALID' && reg.v2e_result === 'REVIEW' && reg.v2e_score < 1.5) {
        causeRegression = 'V2E_SEUIL_VALID_TROP_BAS'; 
    } else if (reg.humanClass === 'REVIEW' && reg.v2e_result === 'REJECTED') {
        causeRegression = 'V2E_PATTERNS_TROP_LARGES';
    } else {
        causeRegression = 'AUTRE_REGRESSION';
    }
    
    console.log(`   CAUSE RÉGRESSION: ${causeRegression}`);
    console.log('');
});

// === ANALYSE DES AMÉLIORATIONS V2E ===  
console.log('📈 AMÉLIORATIONS V2E (V2D ❌ → V2E ✅)');
console.log('================================================================================');

improvements.forEach((imp, idx) => {
    console.log(`${idx + 1}. ID: ${imp.id}`);
    console.log(`   Titre: ${imp.title.substring(0, 80)}...`);
    console.log(`   Humain: ${imp.humanClass}`);
    console.log(`   V2D: ${imp.v2d_result} (${imp.v2d_score}) ❌`);
    console.log(`   V2E: ${imp.v2e_result} (${imp.v2e_score}) ✅`);
    console.log(`   Amélioration confirmée par corrections V2E`);
    console.log('');
});

// === MATRICE DES CAUSES DE RÉGRESSION ===
console.log('📊 CAUSES DE RÉGRESSION V2E');
console.log('================================================================================');

const regressionCauses = {};
regressions.forEach(reg => {
    let cause = '';
    if (reg.humanClass === 'VALID' && reg.v2e_result === 'REJECTED' && reg.v2e_score === 0) {
        cause = 'SCORE_ZERO_TROP_AGRESSIF';
    } else if (reg.humanClass === 'VALID' && reg.v2e_result === 'REVIEW' && reg.v2e_score < 1.5) {
        cause = 'SEUIL_VALID_TROP_BAS';
    } else if (reg.humanClass === 'REVIEW' && reg.v2e_result === 'REJECTED') {
        cause = 'PATTERNS_TROP_LARGES';
    } else {
        cause = 'AUTRE';
    }
    
    if (!regressionCauses[cause]) regressionCauses[cause] = [];
    regressionCauses[cause].push(reg);
});

for (const [cause, cases] of Object.entries(regressionCauses)) {
    console.log(`${cause}: ${cases.length} cas`);
    cases.forEach(c => console.log(`   - ${c.id}: ${c.title.substring(0, 50)}...`));
}

console.log('');
console.log('🎯 RECOMMANDATIONS POUR V2F');
console.log('================================================================================');
console.log('V2F doit équilibrer:');
console.log('  ✅ Maintenir les améliorations V2E sur shadow dataset');
console.log('  🔧 Corriger les régressions V2E sur benchmark historique');
console.log('');
console.log('Corrections suggérées:');
console.log('  1. Score=0 : logique moins agressive, plus conservatrice');
console.log('  2. Seuils : ajustement fin entre 1.5 et 2.0');
console.log('  3. Patterns : plus spécifiques pour éviter faux positifs');
console.log('');
console.log('✨ Analyse terminée - Prêt pour développement V2F équilibrée');