/**
 * ANALYSE FINALE V2F - HOLDOUT 221 ÉCHANTILLONS
 * =============================================
 * 
 * 🔒 V2F DÉFINITIVEMENT GELÉE - Aucune modification autorisée
 * Analyse finale des performances V2F sur données jamais vues
 * 
 * RÈGLE ABSOLUE: Ne pas modifier V2F selon résultats - même si décevants
 */

import fs from 'fs';
import path from 'path';

console.log('🔒 ANALYSE FINALE V2F - HOLDOUT 221 ÉCHANTILLONS');
console.log('================================================================================');
console.log('V2F GELÉE - Évaluation finale sur données jamais utilisées en développement');
console.log('⚠️ Aucune modification V2F autorisée quels que soient les résultats');
console.log('');

// === ÉTAPE 1: VÉRIFICATION INTÉGRITÉ DES DONNÉES ===
console.log('🔍 VÉRIFICATION INTÉGRITÉ DES DONNÉES');
console.log('================================================================================');

// Chargement des fichiers
let holdoutPredictions, humanReferences, holdoutDataset, manifest;

try {
    holdoutPredictions = JSON.parse(fs.readFileSync('data/holdout_predictions.json', 'utf8'));
    holdoutDataset = JSON.parse(fs.readFileSync('data/holdout-validation-dataset.json', 'utf8'));
    manifest = JSON.parse(fs.readFileSync('data/holdout_manifest.json', 'utf8'));
    
    const humanRefData = fs.readFileSync('data/holdout_human_reference.csv', 'utf8');
    humanReferences = {};
    
    // Parse CSV références humaines
    const lines = humanRefData.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const match = line.match(/^"([^"]+)","([^"]+)","([^"]+)","([^"]*)"/);
            if (match) {
                const [, id, humanClass, detailedCategory, notes] = match;
                humanReferences[id] = {
                    classification: humanClass.trim(),
                    category: detailedCategory.trim(),
                    notes: notes.trim()
                };
            }
        }
    }
} catch (error) {
    console.error('❌ ERREUR CHARGEMENT DONNÉES:', error.message);
    process.exit(1);
}

console.log(`✅ Prédictions V2F: ${holdoutPredictions.length}`);
console.log(`✅ Références humaines: ${Object.keys(humanReferences).length}`);
console.log(`✅ Dataset holdout: ${holdoutDataset.length}`);
console.log(`✅ Manifeste: version ${manifest.dataset_version}`);

// Vérifications d'intégrité
const predictionIds = new Set(holdoutPredictions.map(p => p.id));
const referenceIds = new Set(Object.keys(humanReferences));
const datasetIds = new Set(holdoutDataset.map(d => d.id));

const missingPredictions = [...referenceIds].filter(id => !predictionIds.has(id));
const missingReferences = [...predictionIds].filter(id => !referenceIds.has(id));
const missingDataset = [...predictionIds].filter(id => !datasetIds.has(id));

console.log('');
console.log('🔍 VÉRIFICATIONS INTÉGRITÉ:');
console.log(`   Prédictions manquantes: ${missingPredictions.length}`);
console.log(`   Références manquantes: ${missingReferences.length}`);
console.log(`   Dataset manquant: ${missingDataset.length}`);

if (missingPredictions.length > 0 || missingReferences.length > 0 || missingDataset.length > 0) {
    console.error('❌ PROBLÈME INTÉGRITÉ DÉTECTÉ - ARRÊT ANALYSE');
    if (missingPredictions.length > 0) console.error('Prédictions manquantes:', missingPredictions);
    if (missingReferences.length > 0) console.error('Références manquantes:', missingReferences);
    if (missingDataset.length > 0) console.error('Dataset manquant:', missingDataset);
    process.exit(1);
}

console.log('✅ Intégrité vérifiée - Tous les échantillons ont prédiction + référence');

// === ÉTAPE 2: CALCUL MÉTRIQUES GLOBALES ===
console.log('');
console.log('📊 MÉTRIQUES GLOBALES V2F');
console.log('================================================================================');

const globalMetrics = {
    total: holdoutPredictions.length,
    correct: 0,
    
    // Métriques par classe prédite
    validPredicted: 0,
    reviewPredicted: 0, 
    rejectedPredicted: 0,
    
    // Métriques par classe réelle
    validActual: 0,
    reviewActual: 0,
    rejectedActual: 0,
    
    // Intersections correctes
    validCorrect: 0,
    reviewCorrect: 0,
    rejectedCorrect: 0,
    
    // Erreurs
    falsePositives: [], // REJECTED → VALID/REVIEW
    falseNegatives: [], // VALID → REJECTED
    ambiguityErrors: [] // VALID ↔ REVIEW
};

const confusionMatrix = {
    'VALID': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 },
    'REVIEW': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 },
    'REJECTED': { 'VALID': 0, 'REVIEW': 0, 'REJECTED': 0 }
};

// Analyse de chaque prédiction
holdoutPredictions.forEach(pred => {
    const humanRef = humanReferences[pred.id];
    const humanClass = humanRef.classification;
    const v2fClass = pred.prediction;
    
    // Comptage par classe
    if (v2fClass === 'VALID') globalMetrics.validPredicted++;
    if (v2fClass === 'REVIEW') globalMetrics.reviewPredicted++;
    if (v2fClass === 'REJECTED') globalMetrics.rejectedPredicted++;
    
    if (humanClass === 'VALID') globalMetrics.validActual++;
    if (humanClass === 'REVIEW') globalMetrics.reviewActual++;
    if (humanClass === 'REJECTED') globalMetrics.rejectedActual++;
    
    // Matrice de confusion
    confusionMatrix[humanClass][v2fClass]++;
    
    // Exactitude
    if (humanClass === v2fClass) {
        globalMetrics.correct++;
        if (humanClass === 'VALID') globalMetrics.validCorrect++;
        if (humanClass === 'REVIEW') globalMetrics.reviewCorrect++;
        if (humanClass === 'REJECTED') globalMetrics.rejectedCorrect++;
    }
    
    // Classification des erreurs
    if (humanClass === 'REJECTED' && (v2fClass === 'VALID' || v2fClass === 'REVIEW')) {
        globalMetrics.falsePositives.push({
            id: pred.id,
            title: pred.title.substring(0, 60),
            human: humanClass,
            v2f: v2fClass,
            score: pred.score,
            intent: pred.primary_intent,
            category: humanRef.category
        });
    } else if (humanClass === 'VALID' && v2fClass === 'REJECTED') {
        globalMetrics.falseNegatives.push({
            id: pred.id,
            title: pred.title.substring(0, 60),
            human: humanClass,
            v2f: v2fClass,
            score: pred.score,
            intent: pred.primary_intent,
            category: humanRef.category
        });
    } else if ((humanClass === 'VALID' && v2fClass === 'REVIEW') || 
               (humanClass === 'REVIEW' && v2fClass === 'VALID')) {
        globalMetrics.ambiguityErrors.push({
            id: pred.id,
            title: pred.title.substring(0, 60),
            human: humanClass,
            v2f: v2fClass,
            score: pred.score,
            intent: pred.primary_intent,
            category: humanRef.category
        });
    }
});

// Calcul des métriques finales
const accuracy = (globalMetrics.correct / globalMetrics.total * 100).toFixed(1);
const precision = globalMetrics.validPredicted > 0 ? 
    (globalMetrics.validCorrect / globalMetrics.validPredicted * 100).toFixed(1) : 'N/A';
const recall = globalMetrics.validActual > 0 ?
    (globalMetrics.validCorrect / globalMetrics.validActual * 100).toFixed(1) : 'N/A';
const f1 = (precision !== 'N/A' && recall !== 'N/A') ?
    (2 * parseFloat(precision) * parseFloat(recall) / (parseFloat(precision) + parseFloat(recall))).toFixed(1) : 'N/A';
const pollutionRate = (globalMetrics.falsePositives.length / globalMetrics.total * 100).toFixed(1);
const reviewRate = (globalMetrics.reviewPredicted / globalMetrics.total * 100).toFixed(1);

console.log(`Accuracy:             ${accuracy}%`);
console.log(`Precision VALID:      ${precision}%`);
console.log(`Recall VALID:         ${recall}%`);
console.log(`F1-Score:             ${f1}%`);
console.log(`Pollution:            ${pollutionRate}% (${globalMetrics.falsePositives.length} cas)`);
console.log(`Taux REVIEW:          ${reviewRate}%`);
console.log(`Faux positifs:        ${globalMetrics.falsePositives.length}`);
console.log(`Faux négatifs:        ${globalMetrics.falseNegatives.length}`);
console.log(`Erreurs ambiguïté:    ${globalMetrics.ambiguityErrors.length}`);

// === ÉTAPE 3: MATRICE DE CONFUSION ===
console.log('');
console.log('📋 MATRICE DE CONFUSION');
console.log('================================================================================');
console.log('                  │  V2F →   │  VALID │ REVIEW │REJECTED│');
console.log('     HUMAIN ↓     │          │        │        │        │');
console.log('──────────────────────────────────────────────────────────');
console.log(`      VALID       │          │   ${confusionMatrix.VALID.VALID.toString().padStart(4)} │   ${confusionMatrix.VALID.REVIEW.toString().padStart(4)} │   ${confusionMatrix.VALID.REJECTED.toString().padStart(4)} │`);
console.log(`     REVIEW       │          │   ${confusionMatrix.REVIEW.VALID.toString().padStart(4)} │   ${confusionMatrix.REVIEW.REVIEW.toString().padStart(4)} │   ${confusionMatrix.REVIEW.REJECTED.toString().padStart(4)} │`);
console.log(`   REJECTED       │          │   ${confusionMatrix.REJECTED.VALID.toString().padStart(4)} │   ${confusionMatrix.REJECTED.REVIEW.toString().padStart(4)} │   ${confusionMatrix.REJECTED.REJECTED.toString().padStart(4)} │`);

// === ÉTAPE 4: ANALYSE PAR CATÉGORIE ===
console.log('');
console.log('📈 ANALYSE PAR CATÉGORIE DÉTAILLÉE');
console.log('================================================================================');

const categoryAnalysis = {};

holdoutPredictions.forEach(pred => {
    const humanRef = humanReferences[pred.id];
    const humanClass = humanRef.classification;
    const v2fClass = pred.prediction;
    const category = humanRef.category;
    
    if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
            total: 0,
            correct: 0,
            validActual: 0,
            validPredicted: 0,
            validCorrect: 0,
            pollution: 0,
            cases: []
        };
    }
    
    const catStats = categoryAnalysis[category];
    catStats.total++;
    catStats.cases.push({ pred, humanRef, correct: humanClass === v2fClass });
    
    if (humanClass === v2fClass) catStats.correct++;
    if (humanClass === 'VALID') catStats.validActual++;
    if (v2fClass === 'VALID') catStats.validPredicted++;
    if (humanClass === 'VALID' && v2fClass === 'VALID') catStats.validCorrect++;
    if (humanClass === 'REJECTED' && (v2fClass === 'VALID' || v2fClass === 'REVIEW')) catStats.pollution++;
});

console.log('Catégorie                 │ Total │Correct│  Acc  │Recall │Precis │Pollut │');
console.log('──────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤');

for (const [category, stats] of Object.entries(categoryAnalysis)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    const recall = stats.validActual > 0 ? ((stats.validCorrect / stats.validActual) * 100).toFixed(1) : 'N/A';
    const precision = stats.validPredicted > 0 ? ((stats.validCorrect / stats.validPredicted) * 100).toFixed(1) : 'N/A';
    const pollution = stats.total > 0 ? ((stats.pollution / stats.total) * 100).toFixed(1) : '0.0';
    
    console.log(`${category.padEnd(25)} │ ${stats.total.toString().padStart(5)} │ ${stats.correct.toString().padStart(5)} │ ${accuracy.padStart(5)}% │ ${recall.toString().padStart(5)}% │ ${precision.toString().padStart(5)}% │ ${pollution.padStart(5)}% │`);
}

// === ÉTAPE 5: ANALYSE DES ERREURS ===
console.log('');
console.log('❌ TOP 10 FAUX POSITIFS (Pollution)');
console.log('================================================================================');

globalMetrics.falsePositives
    .slice(0, 10)
    .forEach((error, idx) => {
        console.log(`${idx + 1}. ${error.title}...`);
        console.log(`   ID: ${error.id} | Humain: ${error.human} → V2F: ${error.v2f}`);
        console.log(`   Score: ${error.score} | Intent: ${error.intent} | Cat: ${error.category}`);
    });

if (globalMetrics.falseNegatives.length > 0) {
    console.log('');
    console.log('🔴 TOP 10 FAUX NÉGATIFS (Vrais marchés rejetés)');
    console.log('================================================================================');
    
    globalMetrics.falseNegatives
        .slice(0, 10)
        .forEach((error, idx) => {
            console.log(`${idx + 1}. ${error.title}...`);
            console.log(`   ID: ${error.id} | Humain: ${error.human} → V2F: ${error.v2f}`);
            console.log(`   Score: ${error.score} | Intent: ${error.intent} | Cat: ${error.category}`);
        });
}

// === ÉTAPE 6: COMPARAISON MULTI-DATASETS ===
console.log('');
console.log('📊 COMPARAISON PERFORMANCES MULTI-DATASETS');
console.log('================================================================================');

const datasetComparison = [
    ['Dataset', 'N', 'Accuracy', 'Precision', 'Recall', 'F1', 'Pollution'],
    ['─'.repeat(12), '─'.repeat(3), '─'.repeat(8), '─'.repeat(9), '─'.repeat(6), '─'.repeat(6), '─'.repeat(9)],
    ['Benchmark', '50', '94.0%', '100.0%', '100.0%', '100.0%', '0.0%'],
    ['Shadow', '39', '92.3%', '100.0%', '78.6%', '88.0%', '0.0%'],
    ['Smoke', '10', '100.0%', '100.0%', '100.0%', '100.0%', '0.0%'],
    ['HOLDOUT', '221', `${accuracy}%`, `${precision}%`, `${recall}%`, `${f1}%`, `${pollutionRate}%`]
];

datasetComparison.forEach(row => {
    console.log(`${row[0].padEnd(12)} │ ${row[1].padStart(3)} │ ${row[2].padStart(8)} │ ${row[3].padStart(9)} │ ${row[4].padStart(6)} │ ${row[5].padStart(6)} │ ${row[6].padStart(9)}`);
});

// === ÉTAPE 7: GÉNÉRATION RAPPORT FINAL ===
console.log('');
console.log('📄 GÉNÉRATION RAPPORT FINAL');
console.log('================================================================================');

const finalResults = {
    dataset_info: {
        total_samples: globalMetrics.total,
        created_at: manifest.created_at,
        classifier_version: "V2F_FROZEN",
        analysis_date: new Date().toISOString()
    },
    global_metrics: {
        accuracy: parseFloat(accuracy),
        precision: precision !== 'N/A' ? parseFloat(precision) : null,
        recall: recall !== 'N/A' ? parseFloat(recall) : null,
        f1_score: f1 !== 'N/A' ? parseFloat(f1) : null,
        pollution_rate: parseFloat(pollutionRate),
        review_rate: parseFloat(reviewRate),
        false_positives: globalMetrics.falsePositives.length,
        false_negatives: globalMetrics.falseNegatives.length,
        ambiguity_errors: globalMetrics.ambiguityErrors.length
    },
    confusion_matrix: confusionMatrix,
    category_analysis: Object.fromEntries(
        Object.entries(categoryAnalysis).map(([cat, stats]) => [
            cat,
            {
                total: stats.total,
                correct: stats.correct,
                accuracy: parseFloat(((stats.correct / stats.total) * 100).toFixed(1)),
                valid_recall: stats.validActual > 0 ? parseFloat(((stats.validCorrect / stats.validActual) * 100).toFixed(1)) : null,
                valid_precision: stats.validPredicted > 0 ? parseFloat(((stats.validCorrect / stats.validPredicted) * 100).toFixed(1)) : null,
                pollution_rate: parseFloat(((stats.pollution / stats.total) * 100).toFixed(1))
            }
        ])
    ),
    error_analysis: {
        false_positives: globalMetrics.falsePositives.slice(0, 20),
        false_negatives: globalMetrics.falseNegatives.slice(0, 20),
        ambiguity_errors: globalMetrics.ambiguityErrors.slice(0, 20)
    },
    dataset_comparison: {
        benchmark: { n: 50, accuracy: 94.0, precision: 100.0, recall: 100.0, pollution: 0.0 },
        shadow: { n: 39, accuracy: 92.3, precision: 100.0, recall: 78.6, pollution: 0.0 },
        smoke: { n: 10, accuracy: 100.0, precision: 100.0, recall: 100.0, pollution: 0.0 },
        holdout: { n: 221, accuracy: parseFloat(accuracy), precision: precision !== 'N/A' ? parseFloat(precision) : null, recall: recall !== 'N/A' ? parseFloat(recall) : null, pollution: parseFloat(pollutionRate) }
    }
};

// Sauvegarde JSON
fs.writeFileSync('data/FINAL_V2F_HOLDOUT_RESULTS.json', JSON.stringify(finalResults, null, 2));

// Génération rapport Markdown
const markdownReport = `# RAPPORT FINAL V2F - VALIDATION HOLDOUT

## 🔒 Statut V2F
**Version définitivement gelée** - Aucune modification effectuée

## 📊 Résultats Globaux (221 échantillons)

- **Accuracy:** ${accuracy}%
- **Precision VALID:** ${precision}%
- **Recall VALID:** ${recall}%
- **F1-Score:** ${f1}%
- **Pollution:** ${pollutionRate}% (${globalMetrics.falsePositives.length} cas)
- **Taux REVIEW:** ${reviewRate}%

## 📋 Matrice de Confusion

|           | VALID | REVIEW | REJECTED |
|-----------|--------|--------|----------|
| **VALID**    | ${confusionMatrix.VALID.VALID}    | ${confusionMatrix.VALID.REVIEW}     | ${confusionMatrix.VALID.REJECTED}        |
| **REVIEW**   | ${confusionMatrix.REVIEW.VALID}    | ${confusionMatrix.REVIEW.REVIEW}     | ${confusionMatrix.REVIEW.REJECTED}        |
| **REJECTED** | ${confusionMatrix.REJECTED.VALID}    | ${confusionMatrix.REJECTED.REVIEW}     | ${confusionMatrix.REJECTED.REJECTED}        |

## 📈 Comparaison Multi-Datasets

| Dataset | N | Accuracy | Recall | Pollution |
|---------|---|----------|--------|-----------|
| Benchmark | 50 | 94.0% | 100.0% | 0.0% |
| Shadow | 39 | 92.3% | 78.6% | 0.0% |
| Smoke | 10 | 100.0% | 100.0% | 0.0% |
| **HOLDOUT** | **221** | **${accuracy}%** | **${recall}%** | **${pollutionRate}%** |

## ⚖️ Évaluation

### Points Forts
- Test sur dataset totalement inédit (221 échantillons)
- Architecture de validation robuste
- Méthodologie rigoureuse (V2F gelée)

### Limitations
- Taille holdout modérée pour généralisation définitive
- Classifications humaines de référence (subjectivité)
- Contexte spécifique Burkina Faso

### Recommandations
${parseFloat(accuracy) >= 85 && parseFloat(pollutionRate) <= 10 ? 
'✅ **Performances acceptables pour déploiement pilote**' : 
'⚠️ **Ajustements recommandés avant déploiement**'}

---
*Rapport généré le ${new Date().toISOString()}*
*Classificateur: V2F (version gelée)*
`;

fs.writeFileSync('data/FINAL_V2F_HOLDOUT_REPORT.md', markdownReport);

console.log('✅ Rapport final généré');
console.log(`📁 FINAL_V2F_HOLDOUT_RESULTS.json`);
console.log(`📁 FINAL_V2F_HOLDOUT_REPORT.md`);

// === VERDICT FINAL ===
console.log('');
console.log('🏁 VERDICT FINAL V2F - HOLDOUT 221 ÉCHANTILLONS');
console.log('==============================');

const holdoutAccuracy = parseFloat(accuracy);
const holdoutPollution = parseFloat(pollutionRate);
const holdoutRecall = recall !== 'N/A' ? parseFloat(recall) : 0;

// Critères de validation production
const productionCriteria = {
    minAccuracy: 80.0,
    maxPollution: 15.0,
    minRecall: 85.0
};

const meetsAccuracy = holdoutAccuracy >= productionCriteria.minAccuracy;
const meetsPollution = holdoutPollution <= productionCriteria.maxPollution;
const meetsRecall = holdoutRecall >= productionCriteria.minRecall;

console.log(`Accuracy holdout:     ${accuracy}% (seuil ≥ ${productionCriteria.minAccuracy}%) ${meetsAccuracy ? '✅' : '❌'}`);
console.log(`Pollution holdout:    ${pollutionRate}% (seuil ≤ ${productionCriteria.maxPollution}%) ${meetsPollution ? '✅' : '❌'}`);
console.log(`Recall holdout:       ${recall}% (seuil ≥ ${productionCriteria.minRecall}%) ${meetsRecall ? '✅' : '❌'}`);

if (meetsAccuracy && meetsPollution && meetsRecall) {
    console.log('');
    console.log('🎉 V2F VALIDÉ POUR DÉPLOIEMENT PILOTE');
    console.log('   ✅ Performance holdout acceptable sur données inédites');
    console.log('   ✅ Robustesse démontrée sur 221 échantillons');
    console.log('   📋 Recommandation: Déploiement graduel avec monitoring');
} else {
    console.log('');
    console.log('⚠️ V2F PERFORMANCE INSUFFISANTE POUR PRODUCTION');
    console.log('   📊 Résultats holdout en dessous des seuils requis');
    console.log('   🔧 Options:');
    console.log('       1. Développer V2G avec correctifs ciblés');
    console.log('       2. Étendre holdout pour validation plus large');
    console.log('       3. Ajuster seuils selon contexte métier');
}

console.log('');
console.log('✨ Analyse finale V2F terminée - Rapport complet généré');