/**
 * TEST DE RÉGRESSION FINAL V2D
 * =============================
 * 
 * Validation sur dataset élargi pour confirmer la robustesse
 * de notre solution de classification avant mise en production
 */

import fs from 'fs';
import path from 'path';
import { classifyWithIntentAnalysisV2D } from '../src/lib/intentClassifierV2D.js';

console.log('🔍 TEST DE RÉGRESSION FINAL V2D');
console.log('================================================================================');

// Test des cas critiques identifiés
const criticalCases = [
    // Avis de décès - doit être REJECTED
    {
        title: "Avis de décès - Rappel à Dieu de l'ancien Ministre de l'Agriculture",
        expected: "REJECTED",
        category: "DEATH_NOTICE"
    },
    {
        title: "Rappel à Dieu du Docteur Jean-Baptiste OUEDRAOGO",
        expected: "REJECTED", 
        category: "DEATH_NOTICE"
    },
    
    // Gardiennage - doit être REVIEW
    {
        title: "Avis de recrutement - Prestation de gardiennage pour bâtiments administratifs",
        expected: "REVIEW",
        category: "SERVICE_OUTSOURCING"
    },
    {
        title: "Recrutement prestataire sécurité pour installations gouvernementales",
        expected: "REVIEW",
        category: "SERVICE_OUTSOURCING"
    },
    
    // Vrais marchés - doit être VALID
    {
        title: "Appel d'offres pour fourniture de matériel informatique",
        expected: "VALID",
        category: "MARKET"
    },
    {
        title: "Acquisition de véhicules tout-terrain pour la Direction Régionale",
        expected: "VALID", 
        category: "MARKET"
    },
    {
        title: "Travaux de réfection de la route nationale RN1",
        expected: "VALID",
        category: "MARKET"
    },
    
    // Contenus académiques - doit être REJECTED
    {
        title: "Soutenance de thèse de Master en Informatique - Université Joseph Ki-Zerbo",
        expected: "REJECTED",
        category: "NON_MARKET"
    },
    {
        title: "Thèse de doctorat en Sciences Économiques - Soutenance publique",
        expected: "REJECTED",
        category: "NON_MARKET"
    },
    
    // Événements officiels - doit être REJECTED
    {
        title: "Cérémonie d'inauguration du nouveau complexe sportif de Bobo-Dioulasso",
        expected: "REJECTED",
        category: "NON_MARKET"
    },
    {
        title: "Inauguration officielle du centre de santé de Kaya",
        expected: "REJECTED",
        category: "NON_MARKET"
    },
    
    // Nominations - doit être REJECTED
    {
        title: "Décret N°2024-001 portant nomination au sein du Ministère des Finances",
        expected: "REJECTED",
        category: "NON_MARKET"
    },
    {
        title: "Nomination du nouveau Directeur Général des Impôts",
        expected: "REJECTED",
        category: "NON_MARKET"
    },
    
    // Recrutement direct - doit être REJECTED
    {
        title: "Poste vacant - Recrutement d'un comptable principal",
        expected: "REJECTED",
        category: "RECRUITMENT"
    },
    {
        title: "Offre d'emploi - Agent de bureau au Ministère de l'Éducation",
        expected: "REJECTED", 
        category: "RECRUITMENT"
    },
    
    // Cas limites à tester
    {
        title: "Prestation de services de nettoyage des bureaux ministériels",
        expected: "VALID",
        category: "MARKET"
    },
    {
        title: "Contrat de maintenance des équipements informatiques",
        expected: "VALID",
        category: "MARKET" 
    }
];

console.log(`🎯 Testing ${criticalCases.length} cas critiques...\n`);

let totalTests = 0;
let passedTests = 0;
const failedTests = [];
const categoryStats = {};

// Test chaque cas critique
for (const testCase of criticalCases) {
    totalTests++;
    
    const result = classifyWithIntentAnalysisV2D(testCase.title);
    const passed = result.classification === testCase.expected;
    
    if (passed) {
        passedTests++;
        console.log(`✅ ${testCase.title.substring(0, 60)}...`);
        console.log(`   Expected: ${testCase.expected}, Got: ${result.classification}, Score: ${result.score}`);
    } else {
        console.log(`❌ ${testCase.title.substring(0, 60)}...`);
        console.log(`   Expected: ${testCase.expected}, Got: ${result.classification}, Score: ${result.score}`);
        console.log(`   Intent: ${result.intentAnalysis.primaryIntent}, Type: ${result.intentAnalysis.contentType}`);
        
        failedTests.push({
            title: testCase.title,
            expected: testCase.expected,
            actual: result.classification,
            category: testCase.category,
            score: result.score,
            intent: result.intentAnalysis.primaryIntent
        });
    }
    
    // Stats par catégorie
    if (!categoryStats[testCase.category]) {
        categoryStats[testCase.category] = { total: 0, passed: 0 };
    }
    categoryStats[testCase.category].total++;
    if (passed) {
        categoryStats[testCase.category].passed++;
    }
    
    console.log('');
}

// Résumé final
console.log('📊 RÉSULTATS DU TEST DE RÉGRESSION');
console.log('================================================================================');
console.log(`Tests réussis:     ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`Tests échoués:     ${failedTests.length}`);
console.log('');

// Stats par catégorie
console.log('📈 PERFORMANCE PAR CATÉGORIE:');
console.log('--------------------------------------------------');
for (const [category, stats] of Object.entries(categoryStats)) {
    const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category.padEnd(20)} ${stats.passed}/${stats.total} (${percentage}%)`);
}
console.log('');

// Analyse des échecs
if (failedTests.length > 0) {
    console.log('🔍 ANALYSE DES ÉCHECS:');
    console.log('--------------------------------------------------');
    failedTests.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.title.substring(0, 50)}...`);
        console.log(`   Expected: ${failure.expected} | Got: ${failure.actual}`);
        console.log(`   Category: ${failure.category} | Score: ${failure.score}`);
        console.log('');
    });
}

// Verdict final
console.log('🏁 VERDICT FINAL');
console.log('==============================');

const passRate = (passedTests / totalTests) * 100;
const productionReady = passRate >= 95.0; // 95% minimum pour production

if (productionReady) {
    console.log('🎉 SYSTÈME PRÊT POUR PRODUCTION');
    console.log(`   ✅ Taux de réussite: ${passRate.toFixed(1)}% (≥ 95%)`);
    console.log(`   ✅ Cas critiques validés: ${passedTests}/${totalTests}`);
    console.log('');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('   1. Intégration dans l\'API de production');
    console.log('   2. Déploiement graduel avec monitoring');
    console.log('   3. Mise à jour de la documentation');
    console.log('   4. Formation des équipes opérationnelles');
} else {
    console.log('⚠️ SYSTÈME NON PRÊT POUR PRODUCTION');
    console.log(`   🔴 Taux de réussite: ${passRate.toFixed(1)}% (objectif ≥ 95%)`);
    console.log(`   🔧 Corrections nécessaires sur ${failedTests.length} cas`);
}

console.log('');
console.log('✨ Test de régression terminé');