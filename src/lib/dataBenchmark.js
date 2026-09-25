/**
 * Système de benchmark et test des données
 * Pour valider l'efficacité du pipeline de classification
 */

import { isRealTender, classifyMarket } from './marketClassifier.js';
import { calculateMatchScore } from './matchScore.js';

export const MANUAL_CLASSIFICATIONS = {
  VALID: 'VALID',
  REJECTED: 'REJECTED', 
  REVIEW: 'REVIEW'
};

/**
 * Structure d'un échantillon de test
 */
export class BenchmarkSample {
  constructor(id, content, manualClassification, notes = '') {
    this.id = id;
    this.content = content; // { title, description, source, category, deadline }
    this.manualClassification = manualClassification;
    this.notes = notes;
    this.automatedResult = null;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Exécuteur de benchmark sur un dataset
 */
export class DataBenchmark {
  constructor() {
    this.samples = [];
    this.results = null;
  }

  addSample(sample) {
    if (!(sample instanceof BenchmarkSample)) {
      throw new Error('Sample must be instance of BenchmarkSample');
    }
    this.samples.push(sample);
  }

  /**
   * Exécute le benchmark complet
   */
  async runBenchmark() {
    const results = {
      timestamp: new Date().toISOString(),
      totalSamples: this.samples.length,
      categories: {
        valid: 0,
        rejected: 0,
        review: 0
      },
      performance: {
        truePositives: 0,   // Correctement identifié comme marché
        trueNegatives: 0,   // Correctement rejeté
        falsePositives: 0,  // Accepté à tort
        falseNegatives: 0,  // Rejeté à tort
        reviewCorrect: 0,   // Cas ambigus correctement identifiés
      },
      errors: [],
      sampleResults: []
    };

    for (const sample of this.samples) {
      try {
        // Test de classification
        const isValid = isRealTender(
          sample.content.title,
          sample.content.description,
          sample.content.source
        );

        // Classification complète
        const classification = classifyMarket(sample.content);

        sample.automatedResult = {
          isValid,
          classification,
          timestamp: new Date().toISOString()
        };

        // Analyse des performances
        this._analyzeSamplePerformance(sample, results);
        results.sampleResults.push({
          id: sample.id,
          manual: sample.manualClassification,
          automated: isValid,
          title: sample.content.title.substring(0, 80) + '...',
          notes: sample.notes
        });

      } catch (error) {
        results.errors.push({
          sampleId: sample.id,
          error: error.message,
          title: sample.content.title
        });
      }
    }

    // Calcul des métriques
    results.metrics = this._calculateMetrics(results.performance);
    this.results = results;
    
    return results;
  }

  /**
   * Analyse la performance d'un échantillon individuel
   */
  _analyzeSamplePerformance(sample, results) {
    const manual = sample.manualClassification;
    const automated = sample.automatedResult.isValid;

    results.categories[manual.toLowerCase()]++;

    if (manual === MANUAL_CLASSIFICATIONS.VALID) {
      if (automated === true) {
        results.performance.truePositives++;
      } else {
        results.performance.falseNegatives++;
      }
    } else if (manual === MANUAL_CLASSIFICATIONS.REJECTED) {
      if (automated === false) {
        results.performance.trueNegatives++;
      } else {
        results.performance.falsePositives++;
      }
    } else if (manual === MANUAL_CLASSIFICATIONS.REVIEW) {
      // Les cas REVIEW sont corrects s'ils ne sont pas catégoriquement faux
      results.performance.reviewCorrect++;
    }
  }

  /**
   * Calcule les métriques de performance standard
   */
  _calculateMetrics(perf) {
    const { truePositives: tp, trueNegatives: tn, falsePositives: fp, falseNegatives: fn } = perf;
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    return {
      precision: Math.round(precision * 100),
      recall: Math.round(recall * 100), 
      accuracy: Math.round(accuracy * 100),
      f1Score: Math.round(f1Score * 100),
      falsePositiveRate: Math.round((fp / (fp + tn)) * 100),
      falseNegativeRate: Math.round((fn / (fn + tp)) * 100)
    };
  }

  /**
   * Génère un rapport détaillé
   */
  generateReport() {
    if (!this.results) {
      throw new Error('Benchmark not yet executed. Call runBenchmark() first.');
    }

    const { results } = this;
    const { metrics, performance, categories } = results;

    return `
# 📊 RAPPORT DE BENCHMARK - CLASSIFICATION DES MARCHÉS

## Vue d'ensemble
- **${results.totalSamples}** contenus analysés
- **${categories.valid}** vrais marchés (référence manuelle)
- **${categories.rejected}** contenus à rejeter
- **${categories.review}** cas ambigus

## 🎯 Performance du classificateur

### Métriques principales
- **Précision** : ${metrics.precision}% (% de marchés identifiés qui sont vraiment des marchés)
- **Rappel** : ${metrics.recall}% (% de vrais marchés correctement identifiés)
- **Exactitude** : ${metrics.accuracy}% (% de classifications correctes)
- **Score F1** : ${metrics.f1Score}% (moyenne harmonique précision/rappel)

### Analyse des erreurs
- **Faux positifs** : ${performance.falsePositives} (${metrics.falsePositiveRate}%)
  → Contenus acceptés à tort comme marchés
- **Faux négatifs** : ${performance.falseNegatives} (${metrics.falseNegativeRate}%)
  → Vrais marchés rejetés par erreur

## 🔍 Détail des résultats

${results.sampleResults.map(r => `
### ${r.manual} → ${r.automated ? 'ACCEPTÉ' : 'REJETÉ'} ${r.manual === 'VALID' && r.automated || r.manual === 'REJECTED' && !r.automated ? '✅' : '❌'}
**${r.title}**
${r.notes ? `Notes: ${r.notes}` : ''}
`).join('\n')}

${results.errors.length > 0 ? `
## ⚠️ Erreurs de traitement
${results.errors.map(e => `- ${e.title}: ${e.error}`).join('\n')}
` : ''}

---
*Rapport généré le ${new Date(results.timestamp).toLocaleString('fr-FR')}*
`;
  }
}

/**
 * Factory pour créer des échantillons de test courants
 */
export class BenchmarkSampleFactory {
  static createMarketSample(id, title, description, source = 'test') {
    return new BenchmarkSample(id, { title, description, source }, MANUAL_CLASSIFICATIONS.VALID);
  }

  static createRejectedSample(id, title, description, reason = '') {
    return new BenchmarkSample(id, { title, description, source: 'test' }, MANUAL_CLASSIFICATIONS.REJECTED, reason);
  }

  static createReviewSample(id, title, description, reason = '') {
    return new BenchmarkSample(id, { title, description, source: 'test' }, MANUAL_CLASSIFICATIONS.REVIEW, reason);
  }
}

/**
 * Benchmark des scores de matching
 */
export class MatchScoreBenchmark {
  constructor() {
    this.profiles = [];
    this.markets = [];
    this.results = [];
  }

  addProfile(id, profile) {
    this.profiles.push({ id, ...profile });
  }

  addMarket(id, market) {
    this.markets.push({ id, ...market });
  }

  /**
   * Test tous les profils contre tous les marchés
   */
  runMatchingBenchmark() {
    const results = [];

    for (const profile of this.profiles) {
      for (const market of this.markets) {
        const score = calculateMatchScore(profile, market);
        results.push({
          profileId: profile.id,
          marketId: market.id,
          score: score.score,
          explanation: score.explanation,
          breakdown: score.breakdown
        });
      }
    }

    this.results = results;
    return results;
  }

  /**
   * Analyse les résultats de matching pour détecter les incohérences
   */
  analyzeMatchingResults() {
    if (!this.results.length) {
      throw new Error('No matching results. Run runMatchingBenchmark() first.');
    }

    const analysis = {
      averageScore: 0,
      scoreDistribution: { low: 0, medium: 0, high: 0 },
      profilePerformance: {},
      marketAppeal: {},
      inconsistencies: []
    };

    // Calcul des moyennes
    const totalScore = this.results.reduce((sum, r) => sum + r.score, 0);
    analysis.averageScore = Math.round(totalScore / this.results.length);

    // Distribution des scores
    this.results.forEach(result => {
      if (result.score < 30) analysis.scoreDistribution.low++;
      else if (result.score < 70) analysis.scoreDistribution.medium++;
      else analysis.scoreDistribution.high++;
    });

    // Performance par profil
    for (const profile of this.profiles) {
      const profileResults = this.results.filter(r => r.profileId === profile.id);
      const avgScore = profileResults.reduce((sum, r) => sum + r.score, 0) / profileResults.length;
      analysis.profilePerformance[profile.id] = Math.round(avgScore);
    }

    // Attrait par marché
    for (const market of this.markets) {
      const marketResults = this.results.filter(r => r.marketId === market.id);
      const avgScore = marketResults.reduce((sum, r) => sum + r.score, 0) / marketResults.length;
      analysis.marketAppeal[market.id] = Math.round(avgScore);
    }

    return analysis;
  }
}