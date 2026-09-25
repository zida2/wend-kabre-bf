/**
 * Système de benchmark avec données réelles
 * Compare la classification automatique avec la référence humaine
 */

import { classifyWithDiagnostic } from './richClassifier.js';

export class RealDataBenchmark {
  constructor() {
    this.samples = [];
    this.humanReferences = new Map(); // ID → classification humaine
    this.results = null;
    this.errors = [];
  }

  /**
   * Ajoute un échantillon de données réelles
   */
  addSample(id, content) {
    this.samples.push({
      id,
      title: content.title || '',
      description: content.description || '',
      source: content.source || '',
      url: content.url || '',
      date: content.date || null,
      rawContent: content
    });
  }

  /**
   * Définit la classification humaine de référence pour un échantillon
   */
  setHumanReference(sampleId, humanClassification, notes = '') {
    if (!['VALID', 'REVIEW', 'REJECTED'].includes(humanClassification)) {
      throw new Error(`Classification invalide: ${humanClassification}. Doit être VALID, REVIEW ou REJECTED.`);
    }
    
    this.humanReferences.set(sampleId, {
      classification: humanClassification,
      notes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Import en lot des références humaines depuis un tableau
   */
  importHumanReferences(references) {
    references.forEach(ref => {
      this.setHumanReference(ref.id, ref.classification, ref.notes || '');
    });
  }

  /**
   * Exécute le benchmark complet
   */
  async runRealDataBenchmark() {
    if (this.samples.length === 0) {
      throw new Error('Aucun échantillon à tester');
    }

    console.log(`🚀 Début du benchmark sur ${this.samples.length} échantillons réels`);
    
    const results = {
      timestamp: new Date().toISOString(),
      totalSamples: this.samples.length,
      samplesWithReference: this.humanReferences.size,
      
      // Métriques globales
      accuracy: 0,
      precision: { VALID: 0, REVIEW: 0, REJECTED: 0 },
      recall: { VALID: 0, REVIEW: 0, REJECTED: 0 },
      f1Score: { VALID: 0, REVIEW: 0, REJECTED: 0 },
      
      // Matrice de confusion
      confusionMatrix: {
        'VALID→VALID': 0, 'VALID→REVIEW': 0, 'VALID→REJECTED': 0,
        'REVIEW→VALID': 0, 'REVIEW→REVIEW': 0, 'REVIEW→REJECTED': 0,
        'REJECTED→VALID': 0, 'REJECTED→REVIEW': 0, 'REJECTED→REJECTED': 0
      },
      
      // Distribution
      distribution: {
        human: { VALID: 0, REVIEW: 0, REJECTED: 0 },
        machine: { VALID: 0, REVIEW: 0, REJECTED: 0 }
      },
      
      // Erreurs détaillées
      errors: {
        falsePositives: [], // Classés VALID à tort
        falseNegatives: [], // Vrais marchés ratés
        misclassifiedReview: [], // Cas REVIEW mal classés
        unexpected: [] // Autres erreurs
      },
      
      // Résultats détaillés
      detailedResults: [],
      
      // Métriques de pollution
      pollutionMetrics: {
        displayedNonMarkets: 0, // Contenus non-marchés qui seraient affichés
        pollutionRate: 0, // % de pollution du dashboard
        criticalErrors: 0 // Erreurs graves (soutenances, etc.)
      }
    };

    // Traitement de chaque échantillon
    for (const sample of this.samples) {
      try {
        // Classification automatique
        const automaticResult = classifyWithDiagnostic(
          sample.title,
          sample.description,
          sample.source
        );

        // Référence humaine (si disponible)
        const humanRef = this.humanReferences.get(sample.id);
        
        const detailedResult = {
          id: sample.id,
          title: sample.title.substring(0, 80) + '...',
          source: sample.source,
          automatic: {
            classification: automaticResult.classification,
            confidence: automaticResult.confidence,
            score: automaticResult.score
          },
          human: humanRef ? humanRef.classification : null,
          match: humanRef ? (automaticResult.classification === humanRef.classification) : null,
          diagnostics: {
            positiveSignals: automaticResult.signals.positive.length,
            negativeSignals: automaticResult.signals.negative.length,
            exclusions: automaticResult.signals.exclusions.length,
            sourceConfidence: automaticResult.breakdown.sourceConfidence
          }
        };

        results.detailedResults.push(detailedResult);

        // Statistiques de distribution machine
        results.distribution.machine[automaticResult.classification]++;

        // Analyse si on a une référence humaine
        if (humanRef) {
          const human = humanRef.classification;
          const machine = automaticResult.classification;
          
          // Distribution humaine
          results.distribution.human[human]++;
          
          // Matrice de confusion
          results.confusionMatrix[`${human}→${machine}`]++;
          
          // Classification des erreurs
          if (human !== machine) {
            const errorDetail = {
              ...detailedResult,
              humanNotes: humanRef.notes,
              reasons: automaticResult.reasons
            };

            if (human === 'VALID' && machine !== 'VALID') {
              results.errors.falseNegatives.push(errorDetail);
            } else if (human !== 'VALID' && machine === 'VALID') {
              results.errors.falsePositives.push(errorDetail);
              
              // Métriques de pollution - ce contenu serait affiché à tort
              results.pollutionMetrics.displayedNonMarkets++;
              
              // Erreur critique si c'est du contenu académique/personnel
              if (automaticResult.signals.exclusions.length > 0) {
                results.pollutionMetrics.criticalErrors++;
              }
            } else if (human === 'REVIEW' || machine === 'REVIEW') {
              results.errors.misclassifiedReview.push(errorDetail);
            } else {
              results.errors.unexpected.push(errorDetail);
            }
          }
        }

      } catch (error) {
        console.error(`Erreur lors du traitement de l'échantillon ${sample.id}:`, error);
        this.errors.push({
          sampleId: sample.id,
          error: error.message
        });
      }
    }

    // Calcul des métriques finales
    if (results.samplesWithReference > 0) {
      results.accuracy = this._calculateAccuracy(results);
      results.precision = this._calculatePrecision(results);
      results.recall = this._calculateRecall(results);
      results.f1Score = this._calculateF1Score(results.precision, results.recall);
      
      // Métriques de pollution
      const totalDisplayed = results.distribution.machine.VALID + results.distribution.machine.REVIEW;
      results.pollutionMetrics.pollutionRate = totalDisplayed > 0 ? 
        (results.pollutionMetrics.displayedNonMarkets / totalDisplayed) * 100 : 0;
    }

    this.results = results;
    return results;
  }

  /**
   * Génère un rapport détaillé des résultats
   */
  generateBenchmarkReport() {
    if (!this.results) {
      throw new Error('Aucun résultat de benchmark disponible. Exécutez runRealDataBenchmark() d\'abord.');
    }

    const { results } = this;
    
    return `
# 📊 BENCHMARK DONNÉES RÉELLES - WEND-KABRÉ

## Vue d'ensemble
- **${results.totalSamples}** échantillons traités
- **${results.samplesWithReference}** avec référence humaine
- **${this.errors.length}** erreurs de traitement

## 🎯 Performance globale
- **Exactitude (Accuracy)**: ${results.accuracy.toFixed(1)}%
- **Taux de pollution dashboard**: ${results.pollutionMetrics.pollutionRate.toFixed(1)}%
- **Erreurs critiques**: ${results.pollutionMetrics.criticalErrors}

## 📈 Métriques par classe

### VALID (Vrais marchés)
- **Précision**: ${results.precision.VALID.toFixed(1)}% (des contenus classés VALID, % qui sont vraiment des marchés)
- **Rappel**: ${results.recall.VALID.toFixed(1)}% (des vrais marchés, % correctement identifiés)
- **F1-Score**: ${results.f1Score.VALID.toFixed(1)}%

### REVIEW (Cas ambigus)
- **Précision**: ${results.precision.REVIEW.toFixed(1)}%
- **Rappel**: ${results.recall.REVIEW.toFixed(1)}%
- **F1-Score**: ${results.f1Score.REVIEW.toFixed(1)}%

### REJECTED (À rejeter)
- **Précision**: ${results.precision.REJECTED.toFixed(1)}%
- **Rappel**: ${results.recall.REJECTED.toFixed(1)}%
- **F1-Score**: ${results.f1Score.REJECTED.toFixed(1)}%

## 📊 Distribution

### Référence humaine
- **VALID**: ${results.distribution.human.VALID} (${((results.distribution.human.VALID / results.samplesWithReference) * 100).toFixed(1)}%)
- **REVIEW**: ${results.distribution.human.REVIEW} (${((results.distribution.human.REVIEW / results.samplesWithReference) * 100).toFixed(1)}%)
- **REJECTED**: ${results.distribution.human.REJECTED} (${((results.distribution.human.REJECTED / results.samplesWithReference) * 100).toFixed(1)}%)

### Classification machine
- **VALID**: ${results.distribution.machine.VALID} (${((results.distribution.machine.VALID / results.totalSamples) * 100).toFixed(1)}%)
- **REVIEW**: ${results.distribution.machine.REVIEW} (${((results.distribution.machine.REVIEW / results.totalSamples) * 100).toFixed(1)}%)
- **REJECTED**: ${results.distribution.machine.REJECTED} (${((results.distribution.machine.REJECTED / results.totalSamples) * 100).toFixed(1)}%)

## ⚠️ ANALYSE DES ERREURS

### Faux positives (${results.errors.falsePositives.length}) - CRITIQUE pour UX
${this._formatErrors(results.errors.falsePositives, 'Contenus classés VALID à tort')}

### Faux négatifs (${results.errors.falseNegatives.length}) - Opportunités ratées
${this._formatErrors(results.errors.falseNegatives, 'Vrais marchés ratés')}

### Cas REVIEW mal classés (${results.errors.misclassifiedReview.length})
${this._formatErrors(results.errors.misclassifiedReview, 'Erreurs sur les cas ambigus')}

## 🔥 IMPACT UTILISATEUR

Si ce classificateur était déployé maintenant :

- **${results.pollutionMetrics.displayedNonMarkets}** contenus non-marchés apparaîtraient dans le dashboard
- **${results.pollutionMetrics.pollutionRate.toFixed(1)}%** de pollution (objectif < 5%)
- **${results.pollutionMetrics.criticalErrors}** erreurs graves (soutenances, décès, etc.)

## 💡 RECOMMANDATIONS

${this._generateRecommendations(results)}

---
*Rapport généré le ${new Date(results.timestamp).toLocaleString('fr-FR')}*
`;
  }

  // Méthodes utilitaires pour le calcul des métriques
  _calculateAccuracy(results) {
    const total = results.samplesWithReference;
    if (total === 0) return 0;
    
    const correct = Object.values(results.confusionMatrix)
      .filter((_, index) => [0, 4, 8].includes(index)) // Diagonale principale
      .reduce((sum, val) => sum + val, 0);
    
    return (correct / total) * 100;
  }

  _calculatePrecision(results) {
    const precision = {};
    
    ['VALID', 'REVIEW', 'REJECTED'].forEach(cls => {
      const truePositive = results.confusionMatrix[`${cls}→${cls}`];
      const predicted = Object.keys(results.confusionMatrix)
        .filter(key => key.endsWith(`→${cls}`))
        .reduce((sum, key) => sum + results.confusionMatrix[key], 0);
      
      precision[cls] = predicted > 0 ? (truePositive / predicted) * 100 : 0;
    });
    
    return precision;
  }

  _calculateRecall(results) {
    const recall = {};
    
    ['VALID', 'REVIEW', 'REJECTED'].forEach(cls => {
      const truePositive = results.confusionMatrix[`${cls}→${cls}`];
      const actual = Object.keys(results.confusionMatrix)
        .filter(key => key.startsWith(`${cls}→`))
        .reduce((sum, key) => sum + results.confusionMatrix[key], 0);
      
      recall[cls] = actual > 0 ? (truePositive / actual) * 100 : 0;
    });
    
    return recall;
  }

  _calculateF1Score(precision, recall) {
    const f1 = {};
    
    ['VALID', 'REVIEW', 'REJECTED'].forEach(cls => {
      const p = precision[cls];
      const r = recall[cls];
      f1[cls] = (p + r) > 0 ? (2 * p * r) / (p + r) : 0;
    });
    
    return f1;
  }

  _formatErrors(errors, title) {
    if (errors.length === 0) return 'Aucune erreur de ce type.';
    
    return errors.slice(0, 5).map((error, index) => 
      `\n${index + 1}. **${error.title}**
   - Humain: ${error.human} → Machine: ${error.automatic.classification}
   - Confiance: ${Math.round(error.automatic.confidence * 100)}%
   - Source: ${error.source}
   ${error.humanNotes ? `- Notes: ${error.humanNotes}` : ''}`
    ).join('\n') + (errors.length > 5 ? `\n... et ${errors.length - 5} autres` : '');
  }

  _generateRecommendations(results) {
    const recommendations = [];
    
    // Pollution trop élevée
    if (results.pollutionMetrics.pollutionRate > 5) {
      recommendations.push('🚨 PRIORITÉ HAUTE: Réduire le taux de pollution (actuellement ' + results.pollutionMetrics.pollutionRate.toFixed(1) + '%, objectif < 5%)');
    }
    
    // Erreurs critiques
    if (results.pollutionMetrics.criticalErrors > 0) {
      recommendations.push('🚨 CRITIQUE: Renforcer les exclusions pour éviter soutenances/décès dans les résultats');
    }
    
    // Rappel faible sur VALID
    if (results.recall.VALID < 80) {
      recommendations.push('📈 Améliorer la détection des vrais marchés (rappel VALID = ' + results.recall.VALID.toFixed(1) + '%)');
    }
    
    // Précision faible sur VALID  
    if (results.precision.VALID < 85) {
      recommendations.push('🎯 Réduire les faux positifs (précision VALID = ' + results.precision.VALID.toFixed(1) + '%)');
    }
    
    // Trop de cas en révision
    const reviewRate = (results.distribution.machine.REVIEW / results.totalSamples) * 100;
    if (reviewRate > 20) {
      recommendations.push('⚡ Réduire le taux de révision manuelle (actuellement ' + reviewRate.toFixed(1) + '%)');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance satisfaisante - prêt pour la mise en production');
    }
    
    return recommendations.join('\n');
  }
}

/**
 * Factory pour créer rapidement un benchmark
 */
export class BenchmarkFactory {
  static createFromFirebaseData(firebaseData) {
    const benchmark = new RealDataBenchmark();
    
    firebaseData.forEach((item, index) => {
      benchmark.addSample(`item-${index}`, {
        title: item.title,
        description: item.description || item.content,
        source: item.source || item.website,
        url: item.url || item.link,
        date: item.date || item.publishedAt
      });
    });
    
    return benchmark;
  }

  static createFromCSV(csvData) {
    const benchmark = new RealDataBenchmark();
    
    csvData.forEach((row, index) => {
      benchmark.addSample(`csv-${index}`, {
        title: row.title || row.titre,
        description: row.description || row.desc || row.contenu,
        source: row.source || row.site,
        url: row.url || row.lien,
        date: row.date
      });
    });
    
    return benchmark;
  }
}