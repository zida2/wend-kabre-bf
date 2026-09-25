/**
 * 🔍 SYSTÈME DE QUALITÉ DES DONNÉES - Wend-Kabré
 * 
 * Gestion des contenus rejetés, logging et amélioration continue du filtre
 * Permet de tracker et analyser les faux positifs/négatifs
 */

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING DES DÉCISIONS DE FILTRAGE
// ═══════════════════════════════════════════════════════════════════════════

let rejectedContentLog = [];
let acceptedContentLog = [];
let reviewNeededLog = [];

/**
 * Log une décision de filtrage pour analyse ultérieure
 */
export function logFilterDecision(decision, content, reason, confidence, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    title: content.title?.substring(0, 100) || 'Sans titre',
    source: content.source || 'Source inconnue',
    decision, // 'accept', 'reject', 'review'
    reason,
    confidence: Math.round(confidence * 100) / 100, // Arrondi à 2 décimales
    metadata: {
      ...metadata,
      textLength: (content.title + ' ' + content.description).length,
      hasUrl: Boolean(content.url),
      category: content.category || 'Non classé'
    }
  };

  switch (decision) {
    case 'reject':
      rejectedContentLog.push(logEntry);
      // Garder seulement les 1000 dernières entrées
      if (rejectedContentLog.length > 1000) {
        rejectedContentLog = rejectedContentLog.slice(-1000);
      }
      break;
    case 'accept':
      acceptedContentLog.push(logEntry);
      if (acceptedContentLog.length > 500) {
        acceptedContentLog = acceptedContentLog.slice(-500);
      }
      break;
    case 'review':
      reviewNeededLog.push(logEntry);
      if (reviewNeededLog.length > 200) {
        reviewNeededLog = reviewNeededLog.slice(-200);
      }
      break;
  }
}

/**
 * Obtient les statistiques de filtrage
 */
export function getFilteringStats(period = '24h') {
  const now = new Date();
  let cutoff;
  
  switch (period) {
    case '1h': cutoff = new Date(now - 60 * 60 * 1000); break;
    case '24h': cutoff = new Date(now - 24 * 60 * 60 * 1000); break;
    case '7d': cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    default: cutoff = new Date(0); // Tout
  }

  const filterLogs = (logs) => logs.filter(log => new Date(log.timestamp) >= cutoff);
  
  const recentRejected = filterLogs(rejectedContentLog);
  const recentAccepted = filterLogs(acceptedContentLog);
  const recentReview = filterLogs(reviewNeededLog);

  // Analyse des raisons de rejet
  const rejectionReasons = {};
  recentRejected.forEach(log => {
    rejectionReasons[log.reason] = (rejectionReasons[log.reason] || 0) + 1;
  });

  return {
    period,
    total: recentRejected.length + recentAccepted.length + recentReview.length,
    accepted: recentAccepted.length,
    rejected: recentRejected.length,
    needsReview: recentReview.length,
    rejectionReasons,
    acceptanceRate: recentAccepted.length / (recentAccepted.length + recentRejected.length + recentReview.length),
    qualityScore: calculateQualityScore(recentAccepted, recentRejected, recentReview)
  };
}

/**
 * Calcule un score de qualité du filtrage
 */
function calculateQualityScore(accepted, rejected, review) {
  const total = accepted.length + rejected.length + review.length;
  if (total === 0) return 0;

  // Score basé sur :
  // - Ratio de contenu accepté (pas trop restrictif)
  // - Confiance moyenne des décisions
  // - Peu de contenu en attente de révision
  
  const acceptanceRate = accepted.length / total;
  const reviewRate = review.length / total;
  
  // Confiance moyenne
  const avgConfidence = [...accepted, ...rejected]
    .reduce((sum, log) => sum + (log.confidence || 0), 0) / (accepted.length + rejected.length);

  // Score optimal : 60-80% d'acceptation, <10% en révision, confiance >80%
  let score = 0;
  
  // Points pour taux d'acceptation (0-40 points)
  if (acceptanceRate >= 0.6 && acceptanceRate <= 0.8) {
    score += 40;
  } else if (acceptanceRate >= 0.4 && acceptanceRate <= 0.9) {
    score += 30;
  } else {
    score += 20;
  }
  
  // Points pour faible taux de révision (0-30 points)
  if (reviewRate <= 0.05) {
    score += 30;
  } else if (reviewRate <= 0.1) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Points pour confiance (0-30 points)
  score += Math.min(30, avgConfidence * 30);

  return Math.round(score);
}

/**
 * Obtient les contenus rejetés pour analyse
 */
export function getRejectedContent(limit = 50, reason = null) {
  let filtered = rejectedContentLog;
  
  if (reason) {
    filtered = filtered.filter(log => log.reason === reason);
  }
  
  return filtered
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Obtient les contenus nécessitant une révision manuelle
 */
export function getContentNeedingReview(limit = 20) {
  return reviewNeededLog
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Marque un contenu en révision comme validé ou rejeté
 */
export function resolveReviewContent(contentTitle, decision, reviewerNote = '') {
  const index = reviewNeededLog.findIndex(log => log.title === contentTitle);
  if (index === -1) return false;

  const resolvedContent = reviewNeededLog.splice(index, 1)[0];
  resolvedContent.reviewDecision = decision;
  resolvedContent.reviewerNote = reviewerNote;
  resolvedContent.reviewTimestamp = new Date().toISOString();

  // Ajouter aux logs appropriés
  if (decision === 'accept') {
    acceptedContentLog.push(resolvedContent);
  } else {
    rejectedContentLog.push(resolvedContent);
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// AMÉLIORATION CONTINUE ET DÉTECTION DE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyse les patterns dans les contenus rejetés pour améliorer le filtre
 */
export function analyzeRejectionPatterns() {
  const recentRejections = rejectedContentLog.slice(-200);
  
  // Analyse des mots-clés fréquents dans les rejets
  const wordFrequency = {};
  recentRejections.forEach(log => {
    const words = log.title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  // Top 10 des mots dans les rejets
  const topRejectionWords = Object.entries(wordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Sources problématiques
  const sourceFrequency = {};
  recentRejections.forEach(log => {
    sourceFrequency[log.source] = (sourceFrequency[log.source] || 0) + 1;
  });

  const problematicSources = Object.entries(sourceFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return {
    topRejectionWords,
    problematicSources,
    totalAnalyzed: recentRejections.length,
    recommendations: generateFilterRecommendations(topRejectionWords, problematicSources)
  };
}

/**
 * Génère des recommandations d'amélioration du filtre
 */
function generateFilterRecommendations(topWords, problematicSources) {
  const recommendations = [];

  // Recommandations basées sur les mots fréquents
  topWords.forEach(({ word, count }) => {
    if (count > 5) {
      recommendations.push({
        type: 'keyword_filter',
        priority: 'medium',
        suggestion: `Considérer l'ajout de "${word}" aux exclusions (${count} occurrences)`,
        implementation: `EXCLUDE_VOCAB.push("${word}");`
      });
    }
  });

  // Recommandations basées sur les sources
  problematicSources.forEach(({ source, count }) => {
    if (count > 10) {
      recommendations.push({
        type: 'source_filter',
        priority: 'high',
        suggestion: `Source "${source}" génère beaucoup de bruit (${count} rejets)`,
        implementation: `Revoir le scraping de cette source ou ajuster le filtre`
      });
    }
  });

  return recommendations;
}

/**
 * Export des logs pour analyse externe (CSV)
 */
export function exportLogsAsCSV(type = 'rejected', limit = 1000) {
  let logs;
  switch (type) {
    case 'rejected': logs = rejectedContentLog.slice(-limit); break;
    case 'accepted': logs = acceptedContentLog.slice(-limit); break;
    case 'review': logs = reviewNeededLog.slice(-limit); break;
    default: return null;
  }

  const headers = ['Timestamp', 'Title', 'Source', 'Decision', 'Reason', 'Confidence', 'Category'];
  const csvRows = [headers.join(',')];

  logs.forEach(log => {
    const row = [
      log.timestamp,
      `"${log.title.replace(/"/g, '""')}"`, // Échapper les guillemets
      `"${log.source}"`,
      log.decision,
      log.reason,
      log.confidence,
      log.metadata?.category || ''
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// BENCHMARK ET TESTS DE QUALITÉ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dataset de test pour valider le filtre
 */
const TEST_DATASET = [
  { title: "Appel d'offres pour fourniture matériel informatique", expected: true },
  { title: "Demande de cotation travaux construction", expected: true },
  { title: "Avis de recrutement - Ingénieur BTP", expected: true },
  { title: "Soutenance de Master en gestion des ressources humaines", expected: false },
  { title: "Actualité: Nouveau ministre nommé", expected: false },
  { title: "Conférence de presse du gouvernement", expected: false },
  { title: "Avis général de passation de marché", expected: true },
  { title: "Formation sur les marchés publics", expected: false },
  // Ajouter plus de cas de test...
];

/**
 * Teste le filtre contre le dataset de référence
 */
export function runFilterBenchmark(filterFunction) {
  const results = {
    correct: 0,
    falsePositives: [], // Accepté mais devrait être rejeté
    falseNegatives: [], // Rejeté mais devrait être accepté
    total: TEST_DATASET.length
  };

  TEST_DATASET.forEach(testCase => {
    const filterResult = filterFunction(testCase.title, '', 'test-source');
    
    if (filterResult === testCase.expected) {
      results.correct++;
    } else if (filterResult && !testCase.expected) {
      results.falsePositives.push(testCase);
    } else if (!filterResult && testCase.expected) {
      results.falseNegatives.push(testCase);
    }
  });

  results.accuracy = results.correct / results.total;
  results.precision = results.correct / (results.correct + results.falsePositives.length);
  results.recall = results.correct / (results.correct + results.falseNegatives.length);

  return results;
}

export default {
  logFilterDecision,
  getFilteringStats,
  getRejectedContent,
  getContentNeedingReview,
  resolveReviewContent,
  analyzeRejectionPatterns,
  exportLogsAsCSV,
  runFilterBenchmark
};