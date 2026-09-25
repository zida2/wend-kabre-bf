/**
 * ANALYSE DÉTAILLÉE DES ERREURS SHADOW V2D
 * ========================================
 * 
 * Analyse individuelle de chaque erreur pour identifier les causes racines
 * V2D reste complètement figée - analyse pour développement V2E
 */

import fs from 'fs';
import path from 'path';

console.log('🔬 ANALYSE DÉTAILLÉE DES ERREURS SHADOW V2D');
console.log('================================================================================');
console.log('🔒 V2D FIGÉE - Analyse pour développement V2E uniquement');
console.log('');

// Chargement des données
const resultsPath = path.join(process.cwd(), 'data', 'shadow-results-v2d.json');
const v2dResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

const validationPath = path.join(process.cwd(), 'data', 'shadow-validation-humaine.csv');
const validationData = fs.readFileSync(validationPath, 'utf8');

// Parse validation humaine
const humanClassifications = {};
const lines = validationData.split('\n');
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
        const match = line.match(/^"([^"]+)","[^"]*","[^"]*","([^"]+)","[^"]*","([^"]+)"/);
        if (match) {
            const [, id, humanClass, detailedCategory] = match;
            humanClassifications[id] = {
                classification: humanClass.trim(),
                category: detailedCategory.trim()
            };
        }
    }
}

console.log('📊 IDENTIFICATION DES ERREURS INDIVIDUELLES');
console.log('================================================================================');

// Analyse de chaque erreur
const errors = [];
const errorsByType = {
    'FALSE_POSITIVE': [], // Humain REJECTED, V2D VALID/REVIEW
    'FALSE_NEGATIVE': [], // Humain VALID, V2D REJECTED  
    'AMBIGUITY_ERROR': [] // VALID ↔ REVIEW
};

v2dResults.forEach(result => {
    const humanRef = humanClassifications[result.id];
    if (!humanRef) return;
    
    const humanClass = humanRef.classification;
    const v2dClass = result.decision;
    
    if (humanClass !== v2dClass) {
        const errorType = 
            (humanClass === 'REJECTED' && (v2dClass === 'VALID' || v2dClass === 'REVIEW')) ? 'FALSE_POSITIVE' :
            (humanClass === 'VALID' && v2dClass === 'REJECTED') ? 'FALSE_NEGATIVE' :
            'AMBIGUITY_ERROR';
        
        const error = {
            id: result.id,
            title: result.title,
            humanClass,
            v2dClass,
            score: result.score,
            confidence: result.confidence,
            primaryIntent: result.primaryIntent,
            contentType: result.contentType,
            recruitmentType: result.recruitmentType,
            signalsDetected: result.signalsDetected,
            reasons: result.reasonsForDecision,
            category: humanRef.category,
            errorType
        };
        
        errors.push(error);
        errorsByType[errorType].push(error);
    }
});

console.log(`❌ Total erreurs: ${errors.length}/39 (${((errors.length/39)*100).toFixed(1)}%)`);
console.log(`   • Faux positifs: ${errorsByType.FALSE_POSITIVE.length}`);
console.log(`   • Faux négatifs: ${errorsByType.FALSE_NEGATIVE.length}`);
console.log(`   • Erreurs ambiguïté: ${errorsByType.AMBIGUITY_ERROR.length}`);
console.log('');

// === ANALYSE FAUX POSITIFS (Pollution) ===
console.log('🚨 FAUX POSITIFS - ANALYSE DÉTAILLÉE (Pollution)');
console.log('================================================================================');

errorsByType.FALSE_POSITIVE.forEach((error, idx) => {
    console.log(`${idx + 1}. ID: ${error.id}`);
    console.log(`   Titre: ${error.title.substring(0, 80)}...`);
    console.log(`   Humain: ${error.humanClass} | V2D: ${error.v2dClass}`);
    console.log(`   Score: ${error.score} | Intent: ${error.primaryIntent} | Type: ${error.contentType}`);
    console.log(`   Signaux: ${error.signalsDetected || 'aucun'}`);
    console.log(`   Catégorie: ${error.category}`);
    console.log(`   Raisons V2D: ${error.reasons}`);
    
    // Analyse de la cause racine
    let causeRacine = '';
    if (error.score === 0 && error.primaryIntent === 'NEUTRAL') {
        causeRacine = 'SCORE_ZERO_DEFAULT_REVIEW';
    } else if (error.contentType === 'GENERAL' && error.category.includes('communication')) {
        causeRacine = 'COMMUNICATION_NON_DETECTEE';
    } else if (error.contentType === 'GENERAL' && error.category.includes('academique')) {
        causeRacine = 'ACADEMIQUE_PARTIEL';
    } else if (error.contentType === 'GENERAL' && error.category.includes('nomination')) {
        causeRacine = 'NOMINATION_INCOMPLETE';
    } else {
        causeRacine = 'AUTRE';
    }
    
    console.log(`   CAUSE RACINE: ${causeRacine}`);
    console.log('');
});

// === ANALYSE FAUX NÉGATIFS ===
console.log('🔴 FAUX NÉGATIFS - ANALYSE DÉTAILLÉE (Vrais marchés rejetés)');
console.log('================================================================================');

errorsByType.FALSE_NEGATIVE.forEach((error, idx) => {
    console.log(`${idx + 1}. ID: ${error.id}`);
    console.log(`   Titre: ${error.title.substring(0, 80)}...`);
    console.log(`   Humain: ${error.humanClass} | V2D: ${error.v2dClass}`);
    console.log(`   Score: ${error.score} | Intent: ${error.primaryIntent}`);
    console.log(`   Signaux: ${error.signalsDetected || 'aucun'}`);
    console.log(`   Catégorie: ${error.category}`);
    console.log(`   Raisons V2D: ${error.reasons}`);
    console.log('');
});

// === ANALYSE ERREURS D'AMBIGUÏTÉ ===
console.log('⚠️ ERREURS AMBIGUÏTÉ - ANALYSE DÉTAILLÉE (VALID ↔ REVIEW)');
console.log('================================================================================');

errorsByType.AMBIGUITY_ERROR.forEach((error, idx) => {
    console.log(`${idx + 1}. ID: ${error.id}`);
    console.log(`   Titre: ${error.title.substring(0, 80)}...`);
    console.log(`   Humain: ${error.humanClass} | V2D: ${error.v2dClass}`);
    console.log(`   Score: ${error.score} | Intent: ${error.primaryIntent}`);
    console.log(`   Signaux: ${error.signalsDetected || 'aucun'}`);
    console.log(`   Catégorie: ${error.category}`);
    
    // Analyse spécifique
    let causeAmbiguïté = '';
    if (error.humanClass === 'VALID' && error.v2dClass === 'REVIEW' && error.score < 2.0) {
        causeAmbiguïté = 'SEUIL_VALID_TROP_STRICT';
    } else {
        causeAmbiguïté = 'AUTRE_AMBIGUÏTE';
    }
    
    console.log(`   CAUSE AMBIGUÏTÉ: ${causeAmbiguïté}`);
    console.log('');
});

// === MATRICE DES ERREURS PAR CATÉGORIE ===
console.log('📊 MATRICE DES ERREURS PAR CATÉGORIE');
console.log('================================================================================');

const categoryErrorMatrix = {};
errors.forEach(error => {
    const cat = error.category;
    if (!categoryErrorMatrix[cat]) {
        categoryErrorMatrix[cat] = {
            total: 0,
            falsePositives: 0,
            falseNegatives: 0,
            ambiguityErrors: 0
        };
    }
    categoryErrorMatrix[cat].total++;
    if (error.errorType === 'FALSE_POSITIVE') categoryErrorMatrix[cat].falsePositives++;
    if (error.errorType === 'FALSE_NEGATIVE') categoryErrorMatrix[cat].falseNegatives++;
    if (error.errorType === 'AMBIGUITY_ERROR') categoryErrorMatrix[cat].ambiguityErrors++;
});

console.log('Catégorie                 │ Total │  FP  │  FN  │ Amb  │ Type Dominant');
console.log('─────────────────────────────────────────────────────────────────────────');

for (const [category, stats] of Object.entries(categoryErrorMatrix)) {
    const dominant = 
        stats.falsePositives > stats.falseNegatives && stats.falsePositives > stats.ambiguityErrors ? 'FP' :
        stats.falseNegatives > stats.ambiguityErrors ? 'FN' : 'Amb';
    
    console.log(`${category.padEnd(25)} │ ${stats.total.toString().padStart(5)} │ ${stats.falsePositives.toString().padStart(4)} │ ${stats.falseNegatives.toString().padStart(4)} │ ${stats.ambiguityErrors.toString().padStart(4)} │ ${dominant}`);
}

// === IDENTIFICATION DES CAUSES RACINES GÉNÉRALISABLES ===
console.log('');
console.log('🧠 CAUSES RACINES GÉNÉRALISABLES POUR V2E');
console.log('================================================================================');

const rootCauses = {
    'SCORE_ZERO_DEFAULT_REVIEW': {
        count: 0,
        description: 'Score=0 envoyé automatiquement en REVIEW au lieu de REJECTED',
        solution: 'Logique Score=0 : si aucun signal positif → REJECTED, si ambiguïté réelle → REVIEW'
    },
    'COMMUNICATION_NON_DETECTEE': {
        count: 0, 
        description: 'Communications officielles non détectées par les patterns',
        solution: 'Étendre patterns : déclaration ministre, communiqué sécurité'
    },
    'ACADEMIQUE_PARTIEL': {
        count: 0,
        description: 'Contenus académiques partiellement détectés',
        solution: 'Étendre patterns : conférence scientifique'
    },
    'NOMINATION_INCOMPLETE': {
        count: 0,
        description: 'Nominations complexes non détectées', 
        solution: 'Patterns : conseil ministres, nominations gouvernement'
    },
    'SEUIL_VALID_TROP_STRICT': {
        count: 0,
        description: 'Prestations légitimes sous le seuil VALID (2.0)',
        solution: 'Abaisser seuil VALID à 1.5 pour prestations service'
    }
};

// Comptage des causes racines
errorsByType.FALSE_POSITIVE.forEach(error => {
    if (error.score === 0 && error.primaryIntent === 'NEUTRAL') {
        rootCauses.SCORE_ZERO_DEFAULT_REVIEW.count++;
    }
    if (error.category.includes('communication')) {
        rootCauses.COMMUNICATION_NON_DETECTEE.count++;
    }
    if (error.category.includes('academique')) {
        rootCauses.ACADEMIQUE_PARTIEL.count++;
    }
    if (error.category.includes('nomination')) {
        rootCauses.NOMINATION_INCOMPLETE.count++;
    }
});

errorsByType.AMBIGUITY_ERROR.forEach(error => {
    if (error.humanClass === 'VALID' && error.v2dClass === 'REVIEW' && error.score < 2.0) {
        rootCauses.SEUIL_VALID_TROP_STRICT.count++;
    }
});

console.log('CAUSE RACINE                  │ Count │ Description');
console.log('────────────────────────────────────────────────────────────────────');

for (const [cause, info] of Object.entries(rootCauses)) {
    if (info.count > 0) {
        console.log(`${cause.padEnd(29)} │ ${info.count.toString().padStart(5)} │ ${info.description}`);
    }
}

console.log('');
console.log('🎯 PRIORITÉS DÉVELOPPEMENT V2E');
console.log('================================================================================');

const prioritizedFixes = Object.entries(rootCauses)
    .filter(([, info]) => info.count > 0)
    .sort(([, a], [, b]) => b.count - a.count);

prioritizedFixes.forEach(([cause, info], idx) => {
    console.log(`${idx + 1}. ${cause} (${info.count} cas)`);
    console.log(`   Solution: ${info.solution}`);
    console.log('');
});

// Sauvegarde de l'analyse
const analysisResult = {
    totalErrors: errors.length,
    errorsByType,
    categoryErrorMatrix,
    rootCauses: Object.fromEntries(
        Object.entries(rootCauses).filter(([, info]) => info.count > 0)
    ),
    prioritizedFixes: prioritizedFixes.map(([cause, info]) => ({
        cause,
        count: info.count,
        description: info.description,
        solution: info.solution
    }))
};

const analysisPath = path.join(process.cwd(), 'data', 'shadow-error-analysis.json');
fs.writeFileSync(analysisPath, JSON.stringify(analysisResult, null, 2));

console.log('✅ ANALYSE TERMINÉE');
console.log(`📁 Résultats sauvegardés: ${analysisPath}`);
console.log('🔧 Prêt pour développement V2E avec corrections ciblées');