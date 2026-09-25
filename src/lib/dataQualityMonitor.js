/**
 * Système de monitoring continu de la qualité des données
 * Surveille et alerte sur les problèmes de qualité en temps réel
 */

import { classifyMarket } from './marketClassifier.js';

export class DataQualityMonitor {
  constructor() {
    this.metrics = {
      processedToday: 0,
      validMarketsToday: 0,
      rejectedToday: 0,
      reviewNeededToday: 0,
      duplicatesDetected: 0,
      errorRate: 0,
      averageScore: 0,
      lastReset: new Date().toDateString()
    };
    
    this.alerts = [];
    this.thresholds = {
      maxErrorRate: 5,        // % d'erreurs maximum
      minValidationRate: 60,  // % minimum de contenus valides
      maxDuplicateRate: 10,   // % maximum de doublons
      minAverageScore: 50     // Score moyen minimum
    };
    
    this.qualityLog = [];
  }

  /**
   * Traite un nouveau contenu et met à jour les métriques
   */
  processContent(content) {
    try {
      // Réinitialisation quotidienne des métriques
      this._checkDailyReset();
      
      const classification = classifyMarket(content);
      this.metrics.processedToday++;
      
      // Classification
      if (classification.isValid === true) {
        this.metrics.validMarketsToday++;
      } else if (classification.isValid === false) {
        this.metrics.rejectedToday++;
      } else {
        this.metrics.reviewNeededToday++;
      }
      
      // Mise à jour score moyen
      this._updateAverageScore(classification.score || 0);
      
      // Détection de doublons (simplifiée)
      const isDuplicate = this._checkForDuplicate(content);
      if (isDuplicate) {
        this.metrics.duplicatesDetected++;
      }
      
      // Log de qualité
      this._logQualityEvent({
        timestamp: new Date().toISOString(),
        contentId: content.id,
        classification: classification.classification,
        score: classification.score,
        isDuplicate,
        title: content.title?.substring(0, 100)
      });
      
      // Vérification des seuils et alertes
      this._checkAlerts();
      
      return {
        classification,
        metrics: this.getCurrentMetrics(),
        alerts: this.getActiveAlerts()
      };
      
    } catch (error) {
      this._recordError(error, content);
      throw error;
    }
  }
  
  /**
   * Obtient les métriques actuelles
   */
  getCurrentMetrics() {
    const totalProcessed = this.metrics.processedToday;
    
    return {
      ...this.metrics,
      validationRate: totalProcessed > 0 ? Math.round((this.metrics.validMarketsToday / totalProcessed) * 100) : 0,
      rejectionRate: totalProcessed > 0 ? Math.round((this.metrics.rejectedToday / totalProcessed) * 100) : 0,
      reviewRate: totalProcessed > 0 ? Math.round((this.metrics.reviewNeededToday / totalProcessed) * 100) : 0,
      duplicateRate: totalProcessed > 0 ? Math.round((this.metrics.duplicatesDetected / totalProcessed) * 100) : 0
    };
  }
  
  /**
   * Obtient les alertes actives
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => 
      !alert.resolved && 
      new Date(alert.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
    );
  }
  
  /**
   * Résout une alerte
   */
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    }
  }
  
  /**
   * Génère un rapport de qualité
   */
  generateQualityReport(periodDays = 7) {
    const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const recentLogs = this.qualityLog.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );
    
    const metrics = this.getCurrentMetrics();
    const recentAlerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > cutoffDate
    );
    
    return {
      period: `${periodDays} derniers jours`,
      summary: {
        totalProcessed: recentLogs.length,
        validMarkets: recentLogs.filter(log => log.classification === 'VALID').length,
        rejected: recentLogs.filter(log => log.classification === 'REJECTED').length,
        needsReview: recentLogs.filter(log => log.classification === 'REVIEW').length,
        duplicates: recentLogs.filter(log => log.isDuplicate).length,
        averageScore: recentLogs.length > 0 ? 
          Math.round(recentLogs.reduce((sum, log) => sum + (log.score || 0), 0) / recentLogs.length) : 0
      },
      alerts: recentAlerts,
      trends: this._calculateTrends(recentLogs),
      recommendations: this._generateRecommendations(metrics, recentAlerts)
    };
  }
  
  /**
   * Vérifie si c'est un nouveau jour et réinitialise les métriques
   */
  _checkDailyReset() {
    const today = new Date().toDateString();
    if (this.metrics.lastReset !== today) {
      this.metrics = {
        ...this.metrics,
        processedToday: 0,
        validMarketsToday: 0,
        rejectedToday: 0,
        reviewNeededToday: 0,
        duplicatesDetected: 0,
        errorRate: 0,
        averageScore: 0,
        lastReset: today
      };
    }
  }
  
  /**
   * Met à jour le score moyen de façon incrémentale
   */
  _updateAverageScore(newScore) {
    if (this.metrics.processedToday === 1) {
      this.metrics.averageScore = newScore;
    } else {
      this.metrics.averageScore = Math.round(
        (this.metrics.averageScore * (this.metrics.processedToday - 1) + newScore) / this.metrics.processedToday
      );
    }
  }
  
  /**
   * Détection simplifiée de doublons basée sur le titre normalisé
   */
  _checkForDuplicate(content) {
    if (!content.title) return false;
    
    const normalizedTitle = content.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Vérifier dans les logs récents (dernière heure)
    const recentLogs = this.qualityLog.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    return recentLogs.some(log => {
      if (!log.title) return false;
      const logTitle = log.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Similarité simple basée sur les mots communs
      const words1 = normalizedTitle.split(' ');
      const words2 = logTitle.split(' ');
      const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
      
      return commonWords.length >= Math.min(words1.length, words2.length) * 0.7;
    });
  }
  
  /**
   * Enregistre un événement de qualité
   */
  _logQualityEvent(event) {
    this.qualityLog.push(event);
    
    // Limite la taille du log (garder seulement les 1000 derniers)
    if (this.qualityLog.length > 1000) {
      this.qualityLog = this.qualityLog.slice(-1000);
    }
  }
  
  /**
   * Enregistre une erreur
   */
  _recordError(error, content) {
    console.error('Erreur de traitement de qualité:', error);
    this.metrics.errorRate = Math.min(this.metrics.errorRate + 1, 100);
  }
  
  /**
   * Vérifie les seuils et génère des alertes
   */
  _checkAlerts() {
    const metrics = this.getCurrentMetrics();
    
    // Alerte: Taux de validation trop faible
    if (metrics.validationRate < this.thresholds.minValidationRate && metrics.processedToday >= 10) {
      this._createAlert('LOW_VALIDATION_RATE', 
        `Taux de validation faible: ${metrics.validationRate}% (seuil: ${this.thresholds.minValidationRate}%)`,
        'warning'
      );
    }
    
    // Alerte: Trop de doublons
    if (metrics.duplicateRate > this.thresholds.maxDuplicateRate && metrics.processedToday >= 10) {
      this._createAlert('HIGH_DUPLICATE_RATE',
        `Taux de doublons élevé: ${metrics.duplicateRate}% (seuil: ${this.thresholds.maxDuplicateRate}%)`,
        'warning'
      );
    }
    
    // Alerte: Score moyen trop faible
    if (metrics.averageScore < this.thresholds.minAverageScore && metrics.processedToday >= 5) {
      this._createAlert('LOW_AVERAGE_SCORE',
        `Score moyen faible: ${metrics.averageScore} (seuil: ${this.thresholds.minAverageScore})`,
        'info'
      );
    }
    
    // Alerte: Taux d'erreur trop élevé
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      this._createAlert('HIGH_ERROR_RATE',
        `Taux d'erreur élevé: ${metrics.errorRate}% (seuil: ${this.thresholds.maxErrorRate}%)`,
        'error'
      );
    }
  }
  
  /**
   * Crée une nouvelle alerte (si pas déjà existante)
   */
  _createAlert(type, message, severity) {
    // Éviter les alertes en double
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && 
      !alert.resolved && 
      new Date(alert.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
    );
    
    if (!existingAlert) {
      this.alerts.push({
        id: `${type}_${Date.now()}`,
        type,
        message,
        severity,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }
  }
  
  /**
   * Calcule les tendances sur la période
   */
  _calculateTrends(logs) {
    if (logs.length < 2) return {};
    
    const midpoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midpoint);
    const secondHalf = logs.slice(midpoint);
    
    const firstHalfValid = firstHalf.filter(log => log.classification === 'VALID').length;
    const secondHalfValid = secondHalf.filter(log => log.classification === 'VALID').length;
    
    const firstHalfRate = (firstHalfValid / firstHalf.length) * 100;
    const secondHalfRate = (secondHalfValid / secondHalf.length) * 100;
    
    return {
      validationRate: {
        change: secondHalfRate - firstHalfRate,
        trend: secondHalfRate > firstHalfRate ? 'up' : secondHalfRate < firstHalfRate ? 'down' : 'stable'
      }
    };
  }
  
  /**
   * Génère des recommandations basées sur les métriques et alertes
   */
  _generateRecommendations(metrics, alerts) {
    const recommendations = [];
    
    if (metrics.validationRate < 70) {
      recommendations.push({
        priority: 'high',
        category: 'classification',
        text: 'Ajuster les seuils de classification ou enrichir les règles d\'exclusion'
      });
    }
    
    if (metrics.duplicateRate > 5) {
      recommendations.push({
        priority: 'medium', 
        category: 'deduplication',
        text: 'Améliorer l\'algorithme de détection de doublons'
      });
    }
    
    if (alerts.filter(a => a.severity === 'error').length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'stability',
        text: 'Investiguer et corriger les erreurs de traitement'
      });
    }
    
    if (metrics.reviewRate > 20) {
      recommendations.push({
        priority: 'medium',
        category: 'automation',
        text: 'Réduire les cas nécessitant une révision manuelle'
      });
    }
    
    return recommendations;
  }
}