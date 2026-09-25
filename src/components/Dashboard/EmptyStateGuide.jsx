/**
 * Guide pour nouveaux utilisateurs avec dashboard vide
 * Transforme les 0/0/0 déprimants en actions motivantes
 */

import Link from 'next/link';
import styles from './EmptyStateGuide.module.css';

const steps = [
  {
    id: 'profile',
    icon: '👤',
    title: 'Complétez votre profil',
    description: 'Renseignez votre RCCM, IFU et secteur d\'activité',
    action: 'Compléter le profil',
    href: '/profil-entreprise',
    priority: 'high',
    estimatedTime: '5 min'
  },
  {
    id: 'explore',
    icon: '🔍',
    title: 'Explorez les marchés',
    description: 'Découvrez les 102 opportunités correspondant à votre secteur',
    action: 'Voir les marchés',
    href: '/marches',
    priority: 'high',
    estimatedTime: '10 min'
  },
  {
    id: 'save',
    icon: '🔖',
    title: 'Sauvegardez vos favoris',
    description: 'Marquez les marchés intéressants pour les suivre',
    action: 'Commencer',
    href: '/marches',
    priority: 'medium',
    estimatedTime: '2 min'
  },
  {
    id: 'alerts',
    icon: '🔔',
    title: 'Configurez vos alertes',
    description: 'Recevez les nouveaux marchés par WhatsApp/SMS',
    action: 'Configurer alertes',
    href: '/alertes',
    priority: 'medium',
    estimatedTime: '3 min'
  }
];

export default function EmptyStateGuide({ userProfile, onStepComplete }) {
  const completedSteps = getCompletedSteps(userProfile);
  const nextStep = steps.find(step => !completedSteps.includes(step.id));
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          🚀 Démarrez votre parcours Wend-Kabré
        </h3>
        <p className={styles.subtitle}>
          En 4 étapes simples, transformez votre approche des marchés publics
        </p>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {completedSteps.length} / {steps.length} étapes complétées
        </span>
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = nextStep?.id === step.id;
          const isDisabled = index > 0 && !completedSteps.includes(steps[index - 1].id);
          
          return (
            <div
              key={step.id}
              className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${isDisabled ? styles.disabled : ''}`}
            >
              <div className={styles.stepIcon}>
                {isCompleted ? '✅' : step.icon}
              </div>
              
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                <p className={styles.stepDescription}>{step.description}</p>
                
                {!isCompleted && !isDisabled && (
                  <div className={styles.stepAction}>
                    <Link 
                      href={step.href}
                      className={`${styles.actionButton} ${step.priority === 'high' ? styles.primary : styles.secondary}`}
                    >
                      {step.action}
                    </Link>
                    <span className={styles.estimatedTime}>⏱️ {step.estimatedTime}</span>
                  </div>
                )}
                
                {isCompleted && (
                  <div className={styles.completedBadge}>
                    ✅ Terminé
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completedSteps.length === steps.length && (
        <div className={styles.celebration}>
          <div className={styles.celebrationIcon}>🎉</div>
          <h4 className={styles.celebrationTitle}>Félicitations !</h4>
          <p className={styles.celebrationText}>
            Votre compte est configuré. Vous êtes prêt à remporter vos premiers marchés !
          </p>
          <Link href="/marches" className={styles.celebrationButton}>
            Découvrir mes recommandations
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Détermine quelles étapes ont été complétées
 */
function getCompletedSteps(userProfile) {
  const completed = [];
  
  if (!userProfile) return completed;
  
  // Étape profil : RCCM + IFU renseignés
  if (userProfile.rccm && userProfile.ifu) {
    completed.push('profile');
  }
  
  // Étape exploration : a visité au moins un marché (on peut tracker ça)
  if (userProfile.lastMarketView || userProfile.marketsViewed > 0) {
    completed.push('explore');
  }
  
  // Étape sauvegarde : a au moins un marché en favoris
  if (userProfile.crm && Object.keys(userProfile.crm).length > 0) {
    completed.push('save');
  }
  
  // Étape alertes : a configuré au moins une alerte
  if (userProfile.alertes && userProfile.alertes.length > 0) {
    completed.push('alerts');
  }
  
  return completed;
}

/**
 * Statistiques motivantes pour remplacer les 0/0/0
 * ROBUSTE : Gestion explicite des structures de données
 */
export function MotivatingStats({ userProfile, totalMarkets, savedMarkets, applications }) {
  const completedSteps = getCompletedSteps(userProfile);
  const progressPercent = (completedSteps.length / steps.length) * 100;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL ROBUSTE DES COMPTEURS (éviter les erreurs de structure)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // 1. Marchés sauvegardés - Structure explicite
  let savedMarketsCount = 0;
  if (userProfile?.savedMarkets && Array.isArray(userProfile.savedMarkets)) {
    savedMarketsCount = userProfile.savedMarkets.length;
  } else if (userProfile?.crm && typeof userProfile.crm === 'object') {
    // Si utilisation du CRM legacy, filtrer uniquement les marchés
    savedMarketsCount = Object.entries(userProfile.crm)
      .filter(([key, value]) => value?.type === 'marche' || value?.status === 'favoris')
      .length;
  } else {
    savedMarketsCount = savedMarkets || 0; // Fallback sur le paramètre
  }
  
  // 2. Dossiers en préparation - Structure explicite
  let applicationsCount = 0;
  if (userProfile?.applications && Array.isArray(userProfile.applications)) {
    applicationsCount = userProfile.applications.filter(app => 
      app.status === 'en_preparation' || app.status === 'brouillon'
    ).length;
  } else {
    applicationsCount = applications || 0; // Fallback sur le paramètre
  }
  
  // 3. Total des opportunités - Clarification
  let totalOpportunities = totalMarkets || 0;
  const lastUpdate = userProfile?.lastMarketsUpdate 
    ? new Date(userProfile.lastMarketsUpdate).toLocaleString('fr-FR')
    : null;
  
  return (
    <div className={styles.statsContainer}>
      <div className={styles.stat}>
        <div className={styles.statIcon}>🎯</div>
        <div className={styles.statContent}>
          <div className={styles.statNumber}>{totalOpportunities}</div>
          <div className={styles.statLabel}>
            Opportunités ouvertes correspondant à votre profil
          </div>
          {totalOpportunities === 0 ? (
            <div className={styles.statHint}>Actualisées quotidiennement</div>
          ) : (
            <div className={styles.statHint}>
              {lastUpdate ? `Mise à jour: ${lastUpdate}` : 'Mise à jour quotidienne'}
            </div>
          )}
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>🔖</div>
        <div className={styles.statContent}>
          <div className={styles.statNumber}>{savedMarketsCount}</div>
          <div className={styles.statLabel}>Marchés sauvegardés en favoris</div>
          {savedMarketsCount === 0 ? (
            <div className={styles.statHint}>
              <Link href="/marches" className={styles.statAction}>Sauvegarder le premier</Link>
            </div>
          ) : (
            <div className={styles.statHint}>
              <Link href="/dashboard?tab=favoris" className={styles.statAction}>Voir mes favoris</Link>
            </div>
          )}
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>📁</div>
        <div className={styles.statContent}>
          <div className={styles.statNumber}>{applicationsCount}</div>
          <div className={styles.statLabel}>Dossiers de candidature en préparation</div>
          {applicationsCount === 0 ? (
            <div className={styles.statHint}>
              <Link href="/studio" className={styles.statAction}>Créer le premier dossier</Link>
            </div>
          ) : (
            <div className={styles.statHint}>
              <Link href="/dashboard?tab=dossiers" className={styles.statAction}>Continuer la préparation</Link>
            </div>
          )}
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statIcon}>⚡</div>
        <div className={styles.statContent}>
          <div className={styles.statNumber}>{Math.round(progressPercent)}%</div>
          <div className={styles.statLabel}>Configuration du profil terminée</div>
          {progressPercent < 100 ? (
            <div className={styles.statHint}>
              <Link href="/profil-entreprise" className={styles.statAction}>
                Terminer la configuration
              </Link>
            </div>
          ) : (
            <div className={styles.statHint}>
              Profil optimisé pour les recommandations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}