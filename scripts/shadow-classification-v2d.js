/**
 * CLASSIFICATION SHADOW V2D - MODE PRODUCTION
 * ===========================================
 * 
 * Classification du nouveau dataset shadow avec V2D FIGÉ
 * Aucune modification du classificateur autorisée
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2D } from '../src/lib/intentClassifierV2D.js';

console.log('🔍 CLASSIFICATION SHADOW V2D - MODE PRODUCTION');
console.log('================================================================================');
console.log('⚠️  CLASSIFICATEUR V2D FIGÉ - AUCUNE MODIFICATION AUTORISÉE');
console.log('');

// Chargement du dataset shadow
const dataPath = path.join(process.cwd(), 'data', 'shadow-dataset-v2d.json');
const shadowData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`📊 Dataset chargé: ${shadowData.length} échantillons nouveaux`);
console.log('');

// Résultats de classification
const shadowResults = [];
const detectedSignals = {};
const duplicateCheck = new Set();

console.log('🤖 CLASSIFICATION V2D EN COURS...');
console.log('--------------------------------------------------');

// Classification de chaque échantillon
shadowData.forEach((item, index) => {
    const result = classifyWithIntentAnalysisV2D(item.title, item.description);
    
    // Détection de doublons (titre similaire)
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 50);
    const isDuplicate = duplicateCheck.has(titleKey);
    duplicateCheck.add(titleKey);
    
    // Extraction des signaux détectés
    const signals = [];
    if (result.intentAnalysis.recruitmentScore > 0) {
        signals.push(`recruitment(${result.intentAnalysis.recruitmentScore})`);
    }
    if (result.intentAnalysis.marketScore > 0) {
        signals.push(`market(${result.intentAnalysis.marketScore})`);
    }
    if (result.intentAnalysis.contentType !== 'GENERAL') {
        signals.push(`type(${result.intentAnalysis.contentType})`);
    }
    
    // Compilation du résultat complet
    const shadowResult = {
        id: item.id,
        title: item.title,
        source: item.source,
        // Classification V2D
        decision: result.classification,
        score: result.score,
        confidence: result.confidence,
        // Analyse détaillée
        primaryIntent: result.intentAnalysis.primaryIntent,
        contentType: result.intentAnalysis.contentType,
        recruitmentType: result.intentAnalysis.recruitmentType,
        signalsDetected: signals.join(', '),
        reasonsForDecision: result.reasons.join(' | '),
        // Méta-données
        isDuplicate: isDuplicate,
        expectedCategory: item.category,
        expectedSubcategory: item.subcategory,
        // Timestamps
        classifiedAt: new Date().toISOString()
    };
    
    shadowResults.push(shadowResult);
    
    // Affichage en temps réel
    const status = item.category.includes('market') ? '🟢' : 
                  item.category.includes('review') ? '🟡' : '🔴';
    
    console.log(`${(index + 1).toString().padStart(3)}. ${status} ${item.title.substring(0, 60)}...`);
    console.log(`     Expected: ${item.category} | V2D: ${result.classification} | Score: ${result.score}`);
});

console.log('');
console.log('📊 CLASSIFICATION TERMINÉE');
console.log('================================================================================');

// Sauvegarde des résultats shadow
const resultsPath = path.join(process.cwd(), 'data', 'shadow-results-v2d.json');
fs.writeFileSync(resultsPath, JSON.stringify(shadowResults, null, 2));

// Statistiques immédiates
const statsImmediate = {
    total: shadowResults.length,
    decisions: {
        VALID: shadowResults.filter(r => r.decision === 'VALID').length,
        REVIEW: shadowResults.filter(r => r.decision === 'REVIEW').length,
        REJECTED: shadowResults.filter(r => r.decision === 'REJECTED').length
    },
    duplicates: shadowResults.filter(r => r.isDuplicate).length,
    averageScore: (shadowResults.reduce((sum, r) => sum + r.score, 0) / shadowResults.length).toFixed(2)
};

console.log('📈 STATISTIQUES IMMÉDIATES V2D:');
console.log('--------------------------------------------------');
console.log(`Total échantillons:   ${statsImmediate.total}`);
console.log(`VALID:                ${statsImmediate.decisions.VALID} (${((statsImmediate.decisions.VALID/statsImmediate.total)*100).toFixed(1)}%)`);
console.log(`REVIEW:               ${statsImmediate.decisions.REVIEW} (${((statsImmediate.decisions.REVIEW/statsImmediate.total)*100).toFixed(1)}%)`);
console.log(`REJECTED:             ${statsImmediate.decisions.REJECTED} (${((statsImmediate.decisions.REJECTED/statsImmediate.total)*100).toFixed(1)}%)`);
console.log(`Doublons détectés:    ${statsImmediate.duplicates}`);
console.log(`Score moyen:          ${statsImmediate.averageScore}`);

console.log('');
console.log('✅ RÉSULTATS SHADOW SAUVEGARDÉS');
console.log(`📁 Fichier: ${resultsPath}`);
console.log('');
console.log('📋 PROCHAINE ÉTAPE: Validation humaine indépendante');
console.log('   1. Créer fichier de validation humaine');
console.log('   2. Classification manuelle du dataset');  
console.log('   3. Comparaison automatique V2D vs Humain');
console.log('   4. Rapport de performance final');