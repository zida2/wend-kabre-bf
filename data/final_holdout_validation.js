#!/usr/bin/env node
/**
 * VALIDATION FINALE HOLDOUT-221 - V2F CORRECTIONS COMPLÈTES
 * =========================================================
 * Test du classifier V2F corrigé sur l'ensemble complet holdout-221
 */

import fs from 'fs';
import { classifyWithIntentAnalysisV2F } from '../src/lib/intentClassifierV2F.js';

function loadHoldoutDataset() {
    try {
        // Chargement du dataset holdout original
        const holdoutData = JSON.parse(fs.readFileSync('holdout_dataset_with_results.json', 'utf8'));
        console.log(`📂 Dataset holdout chargé: ${holdoutData.length} échantillons`);
        return holdoutData;
    } catch (error) {
        console.error('❌ Erreur chargement holdout dataset:', error.message);
        process.exit(1);
    }
}

function simulateSourceInjection(item) {
    // Simulation des sources gouvernementales basée sur les patterns connus
    const sources = {
        'education.gov.bf': ['école', 'scolaire', 'éducation', 'élève', 'formation'],
        'energie.gov.bf': ['électrique', 'énergie', 'solaire', 'électrification', 'panneau'],
        'recherche.gov.bf': ['recherche', 'scientifique', 'étude', 'analyse'],
        'sante.gov.bf': ['santé', 'médical', 'centre de santé', 'ambulance', 'urgence'],
        'infrastructures.gov.bf': ['infrastructure', 'route', 'bitumage', 'construction'],
        'affaires-etrangeres.gov.bf': ['diplomatique', 'international', 'coopération'],
        'environnement.gov.bf': ['environnement', 'environnemental', 'écologique'],
        'finances.gov.bf': ['finance', 'comptable', 'budget'],
        'emploi.gov.bf': ['emploi', 'formation professionnelle', 'métier']
    };
    
    const title = item.title.toLowerCase();
    const description = (item.description || '').toLowerCase();
    const fullText = `${title} ${description}`;
    
    // Détection source gouvernementale probable
    for (const [source, keywords] of Object.entries(sources)) {
        if (keywords.some(keyword => fullText.includes(keyword))) {
            return source;
        }
    }
    
    // Sources non-gouvernementales par défaut
    const nonGovSources = ['info.bf', 'univ-ouaga.bf', 'marchespublics.bf', 'tender.bf', 'gouvernement.gov.bf'];
    return nonGovSources[Math.floor(Math.random() * nonGovSources.length)];
}

function runV2FCorrectedValidation(holdoutData) {
    console.log('\n🧪 VALIDATION V2F CORRECTIONS SUR HOLDOUT-221');
    console.log('=' .repeat(55));
    
    const results = [];
    const confusionMatrix = {
        'REJECTED': {'REJECTED': 0, 'REVIEW': 0, 'VALID': 0},
        'REVIEW': {'REJECTED': 0, 'REVIEW': 0, 'VALID': 0},
        'VALID': {'REJECTED': 0, 'REVIEW': 0, 'VALID': 0}
    };
    
    let errorAnalysis = {
        critical_errors: [],      // REJECTED→VALID (dashboard pollution)
        major_errors: [],         // VALID→REJECTED (opportunities lost)
        moderate_errors: [],      // REVIEW→VALID (moderate pollution)
        corrected_errors: []      // Erreurs corrigées par V2F
    };
    
    console.log('\n📊 Traitement des échantillons...');
    
    for (let i = 0; i < holdoutData.length; i++) {
        const item = holdoutData[i];
        const source = simulateSourceInjection(item);
        
        try {
            // Classification avec V2F corrigé
            const result = classifyWithIntentAnalysisV2F(
                item.title,
                item.description || '',
                source
            );
            
            const humanLabel = item.human_label;
            const v2fPrediction = result.classification;
            
            // Mise à jour matrice de confusion
            confusionMatrix[humanLabel][v2fPrediction]++;
            
            // Analyse des erreurs par type
            if (humanLabel !== v2fPrediction) {
                const errorType = `${humanLabel} → ${v2fPrediction}`;
                
                if (errorType === 'REJECTED → VALID') {
                    errorAnalysis.critical_errors.push({
                        id: `holdout-${String(i+1).padStart(3, '0')}`,
                        ...item,
                        v2f_result: result,
                        source: source,
                        error_type: 'CRITICAL'
                    });
                } else if (errorType === 'VALID → REJECTED') {
                    errorAnalysis.major_errors.push({
                        id: `holdout-${String(i+1).padStart(3, '0')}`,
                        ...item,
                        v2f_result: result,
                        source: source,
                        error_type: 'MAJOR'
                    });
                } else if (errorType === 'REVIEW → VALID') {
                    errorAnalysis.moderate_errors.push({
                        id: `holdout-${String(i+1).padStart(3, '0')}`,
                        ...item,
                        v2f_result: result,
                        source: source,
                        error_type: 'MODERATE'
                    });
                }
            } else {
                // Classification correcte - possiblement corrigée
                if (result.reasons.some(reason => 
                    reason.includes('CORRECTION') || 
                    reason.includes('recalibrage') || 
                    reason.includes('amélioration')
                )) {
                    errorAnalysis.corrected_errors.push({
                        id: `holdout-${String(i+1).padStart(3, '0')}`,
                        ...item,
                        v2f_result: result,
                        source: source,
                        correction_type: 'SUCCESS'
                    });
                }
            }
            
            results.push({
                id: `holdout-${String(i+1).padStart(3, '0')}`,
                human_label: humanLabel,
                v2f_prediction: v2fPrediction,
                v2f_score: result.score,
                v2f_confidence: result.confidence,
                v2f_reasons: result.reasons,
                source: source,
                correct: humanLabel === v2fPrediction
            });
            
        } catch (error) {
            console.error(`❌ Erreur échantillon ${i+1}:`, error.message);
        }
        
        // Progress indicator
        if ((i + 1) % 50 === 0 || i === holdoutData.length - 1) {
            console.log(`   Traité: ${i + 1}/${holdoutData.length} échantillons`);
        }
    }
    
    return { results, confusionMatrix, errorAnalysis };
}

function calculateMetrics(confusionMatrix) {
    console.log('\n📈 MÉTRIQUES V2F CORRIGÉ:');
    console.log('=' .repeat(30));
    
    // Matrice de confusion
    console.log('\n🎯 MATRICE DE CONFUSION:');
    console.log('                HUMAN LABELS');
    console.log('V2F PRED    REJECTED  REVIEW  VALID   Total');
    
    const classes = ['REJECTED', 'REVIEW', 'VALID'];
    const totals = { row: {}, col: {} };
    let grandTotal = 0;
    
    // Calcul totaux
    for (const pred of classes) {
        totals.row[pred] = 0;
        for (const actual of classes) {
            totals.row[pred] += confusionMatrix[actual][pred];
            grandTotal += confusionMatrix[actual][pred];
        }
    }
    
    for (const actual of classes) {
        totals.col[actual] = 0;
        for (const pred of classes) {
            totals.col[actual] += confusionMatrix[actual][pred];
        }
    }
    
    // Affichage matrice
    for (const pred of classes) {
        const row = classes.map(actual => 
            String(confusionMatrix[actual][pred]).padStart(8)
        ).join(' ');
        console.log(`${pred.padEnd(8)} ${row}   ${totals.row[pred]}`);
    }
    
    const colTotalsStr = classes.map(actual => 
        String(totals.col[actual]).padStart(8)
    ).join(' ');
    console.log(`Total    ${colTotalsStr}   ${grandTotal}`);
    
    // Métriques globales
    const accuracy = classes.reduce((acc, cls) => 
        acc + confusionMatrix[cls][cls], 0) / grandTotal;
    
    console.log(`\n📊 MÉTRIQUES GLOBALES:`);
    console.log(`   • Précision globale: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   • Total échantillons: ${grandTotal}`);
    
    // Métriques par classe
    console.log(`\n📋 MÉTRIQUES PAR CLASSE:`);
    const classMetrics = {};
    
    for (const cls of classes) {
        const tp = confusionMatrix[cls][cls];
        const fp = totals.row[cls] - tp;
        const fn = totals.col[cls] - tp;
        
        const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
        const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
        const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
        
        classMetrics[cls] = { precision, recall, f1, support: totals.col[cls] };
        
        console.log(`   ${cls}:`);
        console.log(`      Précision: ${(precision * 100).toFixed(1)}%`);
        console.log(`      Recall: ${(recall * 100).toFixed(1)}%`);
        console.log(`      F1-Score: ${(f1 * 100).toFixed(1)}%`);
        console.log(`      Support: ${totals.col[cls]}`);
    }
    
    return { accuracy, classMetrics, grandTotal };
}

function analyzeErrorImpact(errorAnalysis) {
    console.log('\n🔍 ANALYSE IMPACT ERREURS:');
    console.log('=' .repeat(30));
    
    const critical = errorAnalysis.critical_errors.length;
    const major = errorAnalysis.major_errors.length; 
    const moderate = errorAnalysis.moderate_errors.length;
    const corrected = errorAnalysis.corrected_errors.length;
    
    console.log(`🔴 ERREURS CRITIQUES (Dashboard pollution): ${critical}`);
    console.log(`🟠 ERREURS MAJEURES (Opportunités perdues): ${major}`);
    console.log(`🟡 ERREURS MODÉRÉES (Pollution frontière): ${moderate}`);
    console.log(`✅ CORRECTIONS DÉTECTÉES: ${corrected}`);
    
    // Impact business
    const businessImpact = {
        criticalCost: critical * 100,      // 100€ par pollution dashboard
        majorCost: major * 100,            // 100€ par opportunité perdue
        moderateCost: moderate * 30,       // 30€ par pollution modérée
        correctionValue: corrected * 50    // 50€ par correction réussie
    };
    
    const netImpact = businessImpact.correctionValue - 
                     (businessImpact.criticalCost + businessImpact.majorCost + businessImpact.moderateCost);
    
    console.log(`\n💰 IMPACT BUSINESS:`);
    console.log(`   • Coût erreurs critiques: -${businessImpact.criticalCost}€/mois`);
    console.log(`   • Coût erreurs majeures: -${businessImpact.majorCost}€/mois`);
    console.log(`   • Coût erreurs modérées: -${businessImpact.moderateCost}€/mois`);
    console.log(`   • Valeur corrections: +${businessImpact.correctionValue}€/mois`);
    console.log(`   • IMPACT NET: ${netImpact >= 0 ? '+' : ''}${netImpact}€/mois`);
    
    return { errorCounts: { critical, major, moderate, corrected }, businessImpact, netImpact };
}

function generateFinalValidationReport(metrics, errorImpact, results) {
    console.log('\n' + '=' .repeat(55));
    console.log('📋 RAPPORT FINAL VALIDATION V2F HOLDOUT-221');
    console.log('=' .repeat(55));
    
    const { accuracy, classMetrics } = metrics;
    const { errorCounts, netImpact } = errorImpact;
    
    console.log(`\n🎯 PERFORMANCE V2F CORRIGÉ:`);
    console.log(`   • Précision globale: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   • Recall VALID: ${(classMetrics.VALID.recall * 100).toFixed(1)}%`);
    console.log(`   • F1 VALID: ${(classMetrics.VALID.f1 * 100).toFixed(1)}%`);
    console.log(`   • Total échantillons: ${results.length}`);
    
    console.log(`\n🚨 ÉTAT ERREURS CRITIQUES:`);
    console.log(`   • Dashboard pollution: ${errorCounts.critical} cas`);
    console.log(`   • Opportunités perdues: ${errorCounts.major} cas`);
    console.log(`   • Pollution modérée: ${errorCounts.moderate} cas`);
    
    console.log(`\n✅ CORRECTIONS APPLIQUÉES:`);
    console.log(`   • Corrections détectées: ${errorCounts.corrected} cas`);
    console.log(`   • Impact business net: ${netImpact >= 0 ? '+' : ''}${netImpact}€/mois`);
    
    // Comparaison avec baseline (estimation)
    const estimatedBaseline = {
        accuracy: 0.538,  // 53.8% accuracy V2F original sur holdout
        validRecall: 0.54  // Recall VALID problématique original
    };
    
    const improvement = {
        accuracy: (accuracy - estimatedBaseline.accuracy) * 100,
        validRecall: (classMetrics.VALID.recall - estimatedBaseline.validRecall) * 100
    };
    
    console.log(`\n📈 AMÉLIORATION vs BASELINE:`);
    console.log(`   • Précision: ${improvement.accuracy >= 0 ? '+' : ''}${improvement.accuracy.toFixed(1)}%`);
    console.log(`   • Recall VALID: ${improvement.validRecall >= 0 ? '+' : ''}${improvement.validRecall.toFixed(1)}%`);
    
    // Statut final
    console.log(`\n🏆 STATUT FINAL:`);
    if (accuracy >= 0.70 && classMetrics.VALID.recall >= 0.65 && errorCounts.critical <= 5) {
        console.log('✅ VALIDATION RÉUSSIE: V2F prêt pour production');
        console.log('   • Performance satisfaisante');
        console.log('   • Erreurs critiques contrôlées'); 
        console.log('   • Impact business positif');
    } else if (accuracy >= 0.60 && improvement.accuracy > 5) {
        console.log('✅ AMÉLIORATION SIGNIFICATIVE: V2F nettement amélioré');
        console.log('   • Progrès substantiels validés');
        console.log('   • Déploiement recommandé avec monitoring');
    } else {
        console.log('⚠️ AMÉLIORATION LIMITÉE: Révision nécessaire');
        console.log('   • Performance insuffisante');
        console.log('   • Corrections supplémentaires requises');
    }
    
    // Sauvegarde rapport complet
    const fullReport = {
        validation_date: new Date().toISOString(),
        dataset_size: results.length,
        performance: {
            accuracy: accuracy,
            class_metrics: classMetrics
        },
        errors: errorCounts,
        business_impact: netImpact,
        improvements: improvement,
        detailed_results: results
    };
    
    fs.writeFileSync('v2f_final_holdout_validation_report.json', 
        JSON.stringify(fullReport, null, 2));
    
    console.log(`\n💾 Rapport complet sauvegardé: v2f_final_holdout_validation_report.json`);
    
    return fullReport;
}

// Exécution principale
async function main() {
    console.log('🚀 DÉMARRAGE VALIDATION FINALE V2F SUR HOLDOUT-221');
    console.log('=' .repeat(55));
    
    try {
        // Chargement dataset
        const holdoutData = loadHoldoutDataset();
        
        // Validation V2F corrigé
        const { results, confusionMatrix, errorAnalysis } = runV2FCorrectedValidation(holdoutData);
        
        // Calcul métriques
        const metrics = calculateMetrics(confusionMatrix);
        
        // Analyse erreurs
        const errorImpact = analyzeErrorImpact(errorAnalysis);
        
        // Rapport final
        const finalReport = generateFinalValidationReport(metrics, errorImpact, results);
        
        console.log('\n✅ VALIDATION FINALE TERMINÉE AVEC SUCCÈS');
        
    } catch (error) {
        console.error('❌ Erreur validation finale:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Point d'entrée
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main as runFinalValidation };