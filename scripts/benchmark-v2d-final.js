/**
 * BENCHMARK FINAL V2D - VERSION PRODUCTION
 * ========================================
 * 
 * Test de la version finale V2D avec détection des avis de décès
 * Objectif: pollution ≤ 5%, recall ≥ 95%
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2D } from '../src/lib/intentClassifierV2D.js';

// Chargement des données de test
const dataPath = path.join(process.cwd(), 'data', 'real-data-samples.json');
const samples = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Chargement des références humaines
const referencePath = path.join(process.cwd(), 'data', 'real-data-samples.csv');
const referenceData = fs.readFileSync(referencePath, 'utf8');

// Parse du CSV de référence
const references = {};
const lines = referenceData.split('\n');
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
        // Parse CSV manually to handle quotes
        const match = line.match(/^"([^"]+)","[^"]*","[^"]*","([^"]+)"/);
        if (match) {
            const [, id, humanClass] = match;
            if (id && humanClass) {
                references[id] = humanClass.trim();
            }
        }
    }
}

console.log('🎯 BENCHMARK FINAL V2D - DÉTECTION AVIS DE DÉCÈS');
console.log('================================================================================');

// Variables de tracking
let totalSamples = 0;
let correctPredictions = 0;
let validSamples = 0;
let validCorrect = 0;
let pollution = 0;
let rejectedAsValid = 0;

const confusionMatrix = {
    'VALID': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 },
    'REVIEW': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 },
    'REJECTED': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 }
};

const failureAnalysis = {
    falsePositives: [], // Prédits VALID/REVIEW mais devrait être REJECTED
    falseNegatives: [], // Prédits REJECTED mais devrait être VALID
    ambiguousCases: []  // Erreurs VALID ↔ REVIEW
};

// Test sur chaque échantillon
for (let i = 0; i < samples.length && i < 50; i++) {
    const sample = samples[i];
    const humanClass = references[sample.id];
    
    if (!humanClass) continue;
    
    totalSamples++;
    const result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
    const machineClass = result.classification;
    
    // Mise à jour de la matrice de confusion
    confusionMatrix[humanClass][machineClass]++;
    
    // Vérification de la justesse
    if (humanClass === machineClass) {
        correctPredictions++;
    }
    
    // Tracking des VALID
    if (humanClass === 'VALID') {
        validSamples++;
        if (machineClass === 'VALID') {
            validCorrect++;
        }
    }
    
    // Tracking de la pollution (REJECTED prédits comme VALID/REVIEW)
    if (humanClass === 'REJECTED' && (machineClass === 'VALID' || machineClass === 'REVIEW')) {
        pollution++;
        rejectedAsValid += (machineClass === 'VALID') ? 1 : 0;
        
        failureAnalysis.falsePositives.push({
            index: i,
            title: sample.title.substring(0, 80) + '...',
            human: humanClass,
            machine: machineClass,
            score: result.score,
            confidence: result.confidence,
            intent: result.intentAnalysis.primaryIntent,
            contentType: result.intentAnalysis.contentType
        });
    }
    
    // Tracking des faux négatifs
    if (humanClass === 'VALID' && machineClass === 'REJECTED') {
        failureAnalysis.falseNegatives.push({
            index: i,
            title: sample.title.substring(0, 80) + '...',
            human: humanClass,
            machine: machineClass,
            score: result.score,
            intent: result.intentAnalysis.primaryIntent
        });
    }
    
    // Ambiguïtés VALID ↔ REVIEW
    if ((humanClass === 'VALID' && machineClass === 'REVIEW') || 
        (humanClass === 'REVIEW' && machineClass === 'VALID')) {
        failureAnalysis.ambiguousCases.push({
            index: i,
            title: sample.title.substring(0, 80) + '...',
            human: humanClass,
            machine: machineClass,
            score: result.score
        });
    }
}

// Calcul des métriques
const accuracy = (correctPredictions / totalSamples) * 100;
const precision = confusionMatrix.VALID.VALID / 
    (confusionMatrix.VALID.VALID + confusionMatrix.REVIEW.VALID + confusionMatrix.REJECTED.VALID) * 100;
const recall = validSamples > 0 ? (validCorrect / validSamples) * 100 : 0;
const pollutionRate = (pollution / totalSamples) * 100;

console.log(`✅ ${totalSamples} échantillons, ${Object.keys(references).length} références`);
console.log('');

console.log('📊 RÉSULTATS V2D');
console.log('==================================================');
console.log(`Exactitude:           ${accuracy.toFixed(1)}%`);
console.log(`Précision VALID:      ${precision.toFixed(1)}%`);
console.log(`Rappel VALID:         ${recall.toFixed(1)}%`);
console.log(`Pollution:            ${pollutionRate.toFixed(1)}%`);
console.log(`Faux positifs:        ${pollution}`);
console.log('');

// Vérification spéciale des cas d'avis de décès
console.log('🚫 VÉRIFICATION AVIS DE DÉCÈS');
console.log('--------------------------------------------------');
const deathNotices = [];
for (let i = 0; i < samples.length && i < 50; i++) {
    const sample = samples[i];
    const humanClass = references[sample.id];
    
    if (!humanClass) continue;
    
    const title = sample.title.toLowerCase();
    if (title.includes('avis de décès') || title.includes('rappel à dieu') || 
        title.includes('décès') || title.includes('ministre')) {
        
        const result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
        const status = (humanClass === result.classification) ? '✅' : '❌';
        
        deathNotices.push({
            status,
            title: sample.title.substring(0, 70) + '...',
            human: humanClass,
            machine: result.classification,
            contentType: result.intentAnalysis.contentType
        });
        
        console.log(`${deathNotices.length}. ${status} ${sample.title.substring(0, 60)}...`);
        console.log(`   Humain: ${humanClass} → Machine: ${result.classification}`);
        console.log(`   Type: ${result.intentAnalysis.contentType}, Score: ${result.score}`);
    }
}

// Vérification des cas gardiennage (maintien V2C-Fix)
console.log('');
console.log('🛡️ VÉRIFICATION CAS GARDIENNAGE (MAINTIEN)');
console.log('--------------------------------------------------');
for (let i = 0; i < samples.length && i < 50; i++) {
    const sample = samples[i];
    const humanClass = references[sample.id];
    
    if (!humanClass) continue;
    
    const title = sample.title.toLowerCase();
    if (title.includes('gardiennage')) {
        const result = classifyWithIntentAnalysisV2D(sample.title, sample.description);
        const status = (humanClass === result.classification) ? '✅' : '❌';
        
        console.log(`${status} ${sample.title.substring(0, 60)}...`);
        console.log(`   Humain: ${humanClass} → Machine: ${result.classification}`);
        console.log(`   Intent: ${result.intentAnalysis.primaryIntent}, Type: ${result.intentAnalysis.recruitmentType}, Score: ${result.score}`);
    }
}

console.log('');
console.log('🎯 ÉVALUATION FINALE');
console.log('========================================');

// Vérification des objectifs
const pollutionOK = pollutionRate <= 5.0;
const recallOK = recall >= 95.0;
const accuracyOK = accuracy >= 75.0;
const deathNoticesOK = deathNotices.every(notice => notice.status === '✅');

console.log(`Pollution ≤ 5%:        ${pollutionOK ? '✅' : '❌'} ${pollutionRate.toFixed(1)}%`);
console.log(`Recall VALID ≥ 95%:     ${recallOK ? '✅' : '❌'} ${recall.toFixed(1)}%`);
console.log(`Exactitude ≥ 75%:       ${accuracyOK ? '✅' : '❌'} ${accuracy.toFixed(1)}%`);
console.log(`Avis décès → REJECTED:  ${deathNoticesOK ? '✅' : '❌'} ${deathNotices.filter(n => n.status === '✅').length}/${deathNotices.length}`);

console.log('');
console.log('🏁 VERDICT FINAL');
console.log('==============================');

if (pollutionOK && recallOK && accuracyOK) {
    console.log('🎉 OBJECTIFS ATTEINTS - PRÊT POUR PRODUCTION');
    console.log(`   ✅ Pollution: ${pollutionRate.toFixed(1)}% (≤ 5%)`);
    console.log(`   ✅ Recall: ${recall.toFixed(1)}% (≥ 95%)`);
    console.log(`   ✅ Exactitude: ${accuracy.toFixed(1)}% (≥ 75%)`);
} else {
    console.log('⚠️ Objectifs non atteints');
    if (!pollutionOK) console.log(`   🔴 Pollution: ${pollutionRate.toFixed(1)}% (objectif ≤ 5%)`);
    if (!recallOK) console.log(`   🔴 Recall: ${recall.toFixed(1)}% (objectif ≥ 95%)`);
    if (!accuracyOK) console.log(`   🔴 Exactitude: ${accuracy.toFixed(1)}% (objectif ≥ 75%)`);
    
    console.log('');
    console.log('🔍 TOP 5 SOURCES DE POLLUTION:');
    failureAnalysis.falsePositives
        .slice(0, 5)
        .forEach((item, idx) => {
            console.log(`${idx + 1}. "${item.title}" (${item.machine})`);
        });
    
    console.log('');
    console.log('🔧 RECOMMANDATION: Ajustements supplémentaires nécessaires');
}