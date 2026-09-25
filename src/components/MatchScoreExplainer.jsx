/**
 * Composant d'explication du score de compatibilité
 * Transforme "75% de match" en explication claire et actionnable
 */

import { useState } from 'react';
import { calculateMatchScore } from '@/lib/matchScore';
import styles from './MatchScoreExplainer.module.css';

export default function MatchScoreExplainer({ market, userProfile, score, compact = false }) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className={styles.scoreButton}
        >
          <span className={styles.scoreValue}>{score}%</span>
          <span className={styles.scoreLabel}>compatible</span>
          <span className={styles.expandIcon}>{showDetails ? '▲' : '▼'}</span>
        </button>
        
        {showDetails && (
          <div className={styles.detailsPopup}>
            <DetailedBreakdown market={market} userProfile={userProfile} />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.scoreDisplay}>
          <span className={styles.mainScore}>{score}%</span>
          <span className={styles.scoreText}>compatible avec votre profil</span>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className={styles.toggleButton}
        >
          {showDetails ? 'Masquer les détails' : 'Voir pourquoi'}
        </button>
      </div>
      
      {showDetails && (
        <div className={styles.detailsContainer}>
          <DetailedBreakdown market={market} userProfile={userProfile} />
        </div>
      )}
    </div>
  );
}

function DetailedBreakdown({ market, userProfile }) {
  const analysis = calculateMatchScore(market, userProfile);
  
  return (
    <div className={styles.breakdown}>
      <h4 className={styles.breakdownTitle}>Analyse de compatibilité</h4>
      
      <div className={styles.criteria}>
        {analysis.details.map((criterion) => (
          <div key={criterion.name} className={`${styles.criterion} ${styles[criterion.status]}`}>
            <div className={styles.criterionHeader}>
              <span className={styles.criterionName}>{criterion.name}</span>
              <div className={styles.criterionScore}>
                <span className={styles.scorePoints}>
                  {Math.round(criterion.score)}/{criterion.weight}
                </span>
                <div className={styles.scoreBar}>
                  <div 
                    className={styles.scoreProgress}
                    style={{ width: `${(criterion.score / criterion.weight) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <p className={styles.criterionReason}>{criterion.reason}</p>
          </div>
        ))}
      </div>
      
      <div className={styles.recommendation}>
        <div className={`${styles.recommendationHeader} ${styles[analysis.recommendation.priority]}`}>
          <span className={styles.recommendationIcon}>
            {getRecommendationIcon(analysis.recommendation.priority)}
          </span>
          <h5 className={styles.recommendationTitle}>
            {analysis.recommendation.text}
          </h5>
        </div>
        <p className={styles.recommendationAction}>
          <strong>Action suggérée :</strong> {analysis.recommendation.action}
        </p>
      </div>
      
      <div className={styles.topReasons}>
        <h5 className={styles.reasonsTitle}>Points forts de ce marché :</h5>
        <ul className={styles.reasonsList}>
          {analysis.reasons.slice(0, 3).map((reason, index) => (
            <li key={index} className={styles.reasonItem}>
              ✓ {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getRecommendationIcon(priority) {
  switch (priority) {
    case 'high': return '🎯';
    case 'medium': return '⚡';
    case 'low': return '⚠️';
    case 'skip': return '❌';
    default: return '📊';
  }
}

/**
 * Version simple pour affichage en ligne
 */
export function QuickMatchScore({ score, level, mainReason, onClick }) {
  const levelConfig = {
    'excellent': { color: '#059669', emoji: '🎯', text: 'Excellent match' },
    'très-bon': { color: '#059669', emoji: '⭐', text: 'Très bon match' },
    'bon': { color: '#F59E0B', emoji: '👍', text: 'Bon match' },
    'moyen': { color: '#F59E0B', emoji: '⚡', text: 'Match moyen' },
    'faible': { color: '#DC2626', emoji: '⚠️', text: 'Match faible' }
  };
  
  const config = levelConfig[level] || levelConfig['moyen'];
  
  return (
    <div 
      className={styles.quickScore}
      style={{ borderLeft: `3px solid ${config.color}` }}
      onClick={onClick}
    >
      <div className={styles.quickHeader}>
        <span className={styles.quickEmoji}>{config.emoji}</span>
        <span className={styles.quickPercent}>{score}%</span>
        <span className={styles.quickText}>{config.text}</span>
      </div>
      {mainReason && (
        <p className={styles.quickReason}>{mainReason}</p>
      )}
    </div>
  );
}