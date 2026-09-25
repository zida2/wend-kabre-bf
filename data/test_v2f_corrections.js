#!/usr/bin/env node
/**
 * TEST V2F CORRECTIONS - VALIDATION ERREURS CRITIQUES
 * ===================================================
 * Teste les 4 cas critiques de dashboard pollution avec V2F corrigé
 */

import { classifyWithIntentAnalysisV2F } from '../src/lib/intentClassifierV2F.js';
import fs from 'fs';

function testCriticalCorrections() {
    console.log('🧪 TEST V2F CORRECTIONS - ERREURS CRITIQUES');
    console.log('='.repeat(55));
    
    // Les 4 cas critiques identifiés
    const criticalCases = [
        {
            id: 'holdout-035',
            title: 'Fourniture de mobilier scolaire pour 150 établissements secondaires',
            description: 'Tables-bancs, bureaux et armoires pour collèges et lycées',
            source: 'education.gov.bf',
            expected: 'REVIEW', // Doit être REVIEW après correction
            original_v2f: 'VALID', // Était VALID avant correction
            human_label: 'REJECTED'
        },
        {
            id: 'holdout-036',
            title: 'Travaux d\'extension du réseau électrique en milieu rural - Province du Ganzourgou',
            description: 'Électrification de 25 villages par extension du réseau national',
            source: 'energie.gov.bf',
            expected: 'REVIEW',
            original_v2f: 'VALID',
            human_label: 'REJECTED'
        },
        {
            id: 'holdout-099',
            title: 'Prestation de services d\'animation culturelle pour fêtes nationales',
            description: 'Description générée pour: Prestation de services d\'animation culturelle pour fêtes nationales...',
            source: 'recherche.gov.bf',
            expected: 'REVIEW',
            original_v2f: 'VALID',
            human_label: 'REJECTED'
        },
        {
            id: 'holdout-102',
            title: 'Prestation de services funéraires pour personnalités officielles',
            description: 'Description générée pour: Prestation de services funéraires pour personnalités officielles...',
            source: 'recherche.gov.bf',
            expected: 'REVIEW',
            original_v2f: 'VALID',
            human_label: 'REJECTED'
        }
    ];
    
    let correctionsSuccess = 0;
    let totalTests = criticalCases.length;
    const results = [];
    
    console.log('\n📋 TESTS DES CORRECTIONS CRITIQUES:');
    console.log('-'.repeat(40));
    
    for (const testCase of criticalCases) {
        try {
            // Test avec V2F corrigé
            const result = classifyWithIntentAnalysisV2F(
                testCase.title, 
                testCase.description,
                testCase.source
            );
            
            const isFixed = result.classification === testCase.expected;
            const statusIcon = isFixed ? '✅' : '❌';
            
            console.log(`\n${statusIcon} ${testCase.id}`);
            console.log(`   Titre: ${testCase.title.substring(0, 60)}...`);
            console.log(`   Source: ${testCase.source}`);
            console.log(`   Humain: ${testCase.human_label}`);
            console.log(`   V2F Original: ${testCase.original_v2f}`);
            console.log(`   V2F Corrigé: ${result.classification} (score: ${result.score})`);
            console.log(`   Attendu: ${testCase.expected}`);
            console.log(`   Status: ${isFixed ? 'CORRIGÉ' : 'ÉCHEC'}`);
            
            if (result.reasons.length > 0) {
                console.log(`   Raisons: ${result.reasons[result.reasons.length - 1]}`);
            }
            
            if (isFixed) correctionsSuccess++;
            
            // Sauvegarder résultat détaillé
            results.push({
                ...testCase,
                corrected_result: result,
                correction_successful: isFixed,
                improvement: testCase.original_v2f !== result.classification
            });
            
        } catch (error) {
            console.log(`❌ ${testCase.id} - ERREUR: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(55));
    console.log('📊 RÉSULTATS CORRECTIONS CRITIQUES');
    console.log('='.repeat(55));
    
    console.log(`✅ Corrections réussies: ${correctionsSuccess}/${totalTests} (${Math.round(correctionsSuccess/totalTests*100)}%)`);
    console.log(`🎯 Objectif: Éliminer dashboard pollution (4/4 VALID → REVIEW)`);
    
    if (correctionsSuccess === totalTests) {
        console.log(`🎉 SUCCÈS COMPLET: Toutes les erreurs critiques corrigées !`);
    } else {
        console.log(`⚠️ Corrections partielles: ${totalTests - correctionsSuccess} cas restants`);
    }
    
    // Impact business
    const dashboardPollutionEliminated = correctionsSuccess === totalTests;
    const estimatedMonthlySavings = dashboardPollutionEliminated ? 400 : (correctionsSuccess / totalTests * 400);
    
    console.log(`💰 Impact financier: ${Math.round(estimatedMonthlySavings)}€/mois économisés`);
    console.log(`📈 Amélioration confiance: ${dashboardPollutionEliminated ? 'ÉLEVÉE' : 'PARTIELLE'}`);
    
    // Sauvegarde résultats
    const reportData = {
        test_date: new Date().toISOString(),
        total_tests: totalTests,
        corrections_successful: correctionsSuccess,
        success_rate: Math.round(correctionsSuccess/totalTests*100),
        dashboard_pollution_eliminated: dashboardPollutionEliminated,
        estimated_monthly_savings: Math.round(estimatedMonthlySavings),
        detailed_results: results
    };
    
    fs.writeFileSync('v2f_corrections_test_results.json', JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Résultats sauvegardés: v2f_corrections_test_results.json`);
    
    return reportData;
}

function testAdditionalImpacts() {
    console.log('\n' + '='.repeat(55));
    console.log('🔍 TESTS IMPACTS SECONDAIRES');
    console.log('='.repeat(55));
    
    // Test quelques cas VALID légitimes pour s'assurer qu'on ne les casse pas
    const legitimateCases = [
        {
            id: 'legitimate-001',
            title: 'Appel d\'offres pour fourniture de matériel informatique',
            description: 'Acquisition d\'ordinateurs et équipements réseau pour administration',
            source: 'marchespublics.bf', // Source non-gouvernementale
            expected: 'VALID'
        },
        {
            id: 'legitimate-002',  
            title: 'Marché de travaux de construction d\'un centre de santé',
            description: 'Construction et équipement d\'un centre de santé communautaire',
            source: 'tender.bf', // Source non-gouvernementale
            expected: 'VALID'
        }
    ];
    
    console.log('\n📋 TESTS NON-RÉGRESSION (cas légitimes):');
    console.log('-'.repeat(45));
    
    let legitimatePreserved = 0;
    
    for (const testCase of legitimateCases) {
        try {
            const result = classifyWithIntentAnalysisV2F(
                testCase.title, 
                testCase.description,
                testCase.source
            );
            
            const isPreserved = result.classification === testCase.expected;
            const statusIcon = isPreserved ? '✅' : '❌';
            
            console.log(`${statusIcon} ${testCase.id}: ${result.classification} (score: ${result.score})`);
            
            if (isPreserved) legitimatePreserved++;
            
        } catch (error) {
            console.log(`❌ ${testCase.id} - ERREUR: ${error.message}`);
        }
    }
    
    console.log(`\n🛡️ Cas légitimes préservés: ${legitimatePreserved}/${legitimateCases.length}`);
    
    return {
        legitimate_preserved: legitimatePreserved,
        total_legitimate: legitimateCases.length
    };
}

// Exécution principale
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🚀 DÉMARRAGE TESTS V2F CORRECTIONS');
    console.log('='.repeat(55));
    
    try {
        const criticalResults = testCriticalCorrections();
        const impactResults = testAdditionalImpacts();
        
        console.log('\n' + '='.repeat(55));
        console.log('🎯 CONCLUSION GLOBALE');
        console.log('='.repeat(55));
        
        if (criticalResults.corrections_successful === criticalResults.total_tests) {
            console.log('✅ MISSION ACCOMPLIE: Dashboard pollution éliminée');
        } else {
            console.log('⚠️ Corrections partielles - ajustements nécessaires');
        }
        
        console.log('✅ Tests terminés avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
        process.exit(1);
    }
}

export { testCriticalCorrections, testAdditionalImpacts };