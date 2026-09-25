/**
 * CLASSIFICATION V2F HOLDOUT - VERSION GELÉE
 * ===========================================
 * 
 * 🔒 V2F DÉFINITIVEMENT GELÉE - Aucune modification autorisée
 * Classification du holdout 221 échantillons avec V2F exactement telle qu'elle est
 * 
 * RÈGLES ABSOLUES:
 * - Ne modifier aucun paramètre de V2F
 * - Ne ajuster aucun seuil selon résultats
 * - Sauvegarder prédictions brutes avant toute analyse
 * - V2F reste identique même si résultats mauvais
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2F } from '../src/lib/intentClassifierV2F.js';

console.log('🔒 CLASSIFICATION V2F HOLDOUT - VERSION GELÉE');
console.log('================================================================================');
console.log('V2F FIGÉE - Classification sur 221 échantillons inédits');
console.log('⚠️ Aucune modification de V2F autorisée quels que soient les résultats');
console.log('');

// Chargement du holdout dataset
const holdoutPath = path.join(process.cwd(), 'data', 'holdout-validation-dataset.json');
const holdoutData = JSON.parse(fs.readFileSync(holdoutPath, 'utf8'));

console.log(`📊 Holdout dataset: ${holdoutData.length} échantillons`);
console.log('');

// === EXÉCUTION V2F SUR HOLDOUT (GELÉE) ===
console.log('🤖 CLASSIFICATION V2F EN COURS...');
console.log('================================================================================');

const holdoutPredictions = [];
const rawPredictionsLog = [];

console.log('Progression:');

holdoutData.forEach((sample, idx) => {
    // Exécution V2F exactement telle qu'elle est gelée
    const v2f_result = classifyWithIntentAnalysisV2F(sample.title, sample.description);
    
    // Sauvegarde prédiction complète
    const prediction = {
        id: sample.id,
        title: sample.title,
        source: sample.source,
        expected_category: sample.category,
        
        // Résultat V2F complet
        prediction: v2f_result.classification,
        score: v2f_result.score,
        confidence: v2f_result.confidence,
        
        // Analyse détaillée V2F
        primary_intent: v2f_result.intentAnalysis.primaryIntent,
        content_type: v2f_result.intentAnalysis.contentType,
        recruitment_type: v2f_result.intentAnalysis.recruitmentType,
        recruitment_score: v2f_result.intentAnalysis.recruitmentScore,
        market_score: v2f_result.intentAnalysis.marketScore,
        
        // Signaux et raisons
        signals_detected: `R:${v2f_result.intentAnalysis.recruitmentScore}, M:${v2f_result.intentAnalysis.marketScore}`,
        reasons: v2f_result.reasons.join(' | '),
        
        // Méta-données
        classified_at: new Date().toISOString(),
        classifier_version: "V2F_FROZEN"
    };
    
    holdoutPredictions.push(prediction);
    
    // Log progression (sans afficher détails pour éviter bias)
    if ((idx + 1) % 50 === 0) {
        console.log(`   ${(idx + 1).toString().padStart(3)}/${holdoutData.length} échantillons traités`);
    }
    
    // Log prédiction brute (avant toute analyse)
    rawPredictionsLog.push(`${sample.id}: ${v2f_result.classification}`);
});

console.log(`   ${holdoutData.length}/${holdoutData.length} échantillons traités - TERMINÉ`);
console.log('');

// === SAUVEGARDE PRÉDICTIONS BRUTES ===
console.log('💾 SAUVEGARDE PRÉDICTIONS BRUTES');
console.log('================================================================================');

// Sauvegarde prédictions complètes
const predictionsPath = path.join(process.cwd(), 'data', 'holdout_predictions.json');
fs.writeFileSync(predictionsPath, JSON.stringify(holdoutPredictions, null, 2));

// Sauvegarde log prédictions brutes (simple)
const rawPredictionsPath = path.join(process.cwd(), 'data', 'holdout_raw_predictions.txt');
fs.writeFileSync(rawPredictionsPath, rawPredictionsLog.join('\\n'));

console.log(`✅ holdout_predictions.json (${holdoutPredictions.length} prédictions complètes)`);
console.log(`✅ holdout_raw_predictions.txt (prédictions brutes simples)`);
console.log('');

// === STATISTIQUES IMMÉDIATES (SANS RÉFÉRENCE HUMAINE) ===
console.log('📊 STATISTIQUES PRÉDICTIONS V2F');
console.log('================================================================================');

const predictionStats = {
    total: holdoutPredictions.length,
    valid: holdoutPredictions.filter(p => p.prediction === 'VALID').length,
    review: holdoutPredictions.filter(p => p.prediction === 'REVIEW').length,
    rejected: holdoutPredictions.filter(p => p.prediction === 'REJECTED').length
};

console.log(`Total prédictions:      ${predictionStats.total}`);
console.log(`VALID:                  ${predictionStats.valid} (${(predictionStats.valid/predictionStats.total*100).toFixed(1)}%)`);
console.log(`REVIEW:                 ${predictionStats.review} (${(predictionStats.review/predictionStats.total*100).toFixed(1)}%)`);
console.log(`REJECTED:               ${predictionStats.rejected} (${(predictionStats.rejected/predictionStats.total*100).toFixed(1)}%)`);

// Distribution par intention primaire
const intentStats = {};
holdoutPredictions.forEach(p => {
    intentStats[p.primary_intent] = (intentStats[p.primary_intent] || 0) + 1;
});

console.log('');
console.log('Distribution par intention primaire:');
Object.entries(intentStats).forEach(([intent, count]) => {
    console.log(`  ${intent.padEnd(20)} ${count.toString().padStart(3)} (${(count/predictionStats.total*100).toFixed(1)}%)`);
});

// Distribution par type de contenu
const contentTypeStats = {};
holdoutPredictions.forEach(p => {
    contentTypeStats[p.content_type] = (contentTypeStats[p.content_type] || 0) + 1;
});

console.log('');
console.log('Distribution par type de contenu:');
Object.entries(contentTypeStats).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(20)} ${count.toString().padStart(3)} (${(count/predictionStats.total*100).toFixed(1)}%)`);
});

// === CRÉATION FICHIER CLASSIFICATION HUMAINE ===
console.log('');
console.log('📋 CRÉATION FICHIER CLASSIFICATION HUMAINE');
console.log('================================================================================');

// Création CSV pour classification humaine (sans voir les prédictions V2F)
const humanLabelingRows = ['id,title,source,classification_humaine,category_detailed,notes'];

holdoutPredictions.forEach(pred => {
    // Le classificateur humain ne doit PAS voir la prédiction V2F
    const csvRow = `"${pred.id}","${pred.title}","${pred.source}","","",""`;
    humanLabelingRows.push(csvRow);
});

const humanLabelingPath = path.join(process.cwd(), 'data', 'holdout_human_labels.csv');
fs.writeFileSync(humanLabelingPath, humanLabelingRows.join('\\n'));

console.log(`✅ holdout_human_labels.csv créé (${humanLabelingRows.length - 1} lignes à classifier)`);
console.log('⚠️ Le classificateur humain ne doit PAS voir les prédictions V2F');
console.log('');

// === RÉSUMÉ FINAL ===
console.log('🎯 ÉTAPE SUIVANTE: CLASSIFICATION HUMAINE INDÉPENDANTE');
console.log('================================================================================');
console.log('1. ✅ V2F exécutée sur 221 échantillons holdout');
console.log('2. ✅ Prédictions brutes sauvegardées');
console.log('3. ✅ Fichier classification humaine créé');
console.log('4. 🔄 Classification humaine en cours (externe)');
console.log('5. ⏳ Comparaison V2F vs Humain après labeling');
console.log('6. ⏳ Génération rapport final validation');
console.log('');

console.log('📋 FICHIERS CRÉÉS:');
console.log(`   📁 ${predictionsPath}`);
console.log(`   📁 ${rawPredictionsPath}`);
console.log(`   📁 ${humanLabelingPath}`);

console.log('');
console.log('🔒 RAPPEL IMPORTANT');
console.log('==============================');
console.log('V2F reste DÉFINITIVEMENT GELÉE');
console.log('Aucune modification autorisée même si résultats décevants');
console.log('Classification humaine doit être totalement indépendante');

console.log('');
console.log('✨ Classification V2F holdout terminée - En attente labeling humain');