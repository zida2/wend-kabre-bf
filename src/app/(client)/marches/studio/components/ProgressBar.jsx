'use client';

export default function ProgressBar({ currentStep, progress, onStepClick }) {
  const steps = [
    { num: 1, label: 'Dossier Administratif', icon: '📋' },
    { num: 2, label: 'Offre Technique (IA)', icon: '🪄' },
    { num: 3, label: 'Vérification & Dépôt', icon: '✅' },
  ];

  return (
    <div className="card" style={{ marginBottom: '32px' }}>
      {/* Barre de progression % */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="text-xs text-muted" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
            PROGRESSION GLOBALE
          </span>
          <span className="text-sm" style={{ fontWeight: 800, color: progress === 100 ? 'var(--green)' : 'var(--primary)' }}>
            {progress}%
          </span>
        </div>
        
        <div style={{ 
          height: '10px', 
          background: 'var(--color-surface-2)', 
          borderRadius: '50px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress === 100 ? 'var(--green)' : 'var(--grad-primary)',
            transition: 'width 0.4s ease',
            borderRadius: '50px'
          }} />
        </div>
        
        {progress === 100 && (
          <p className="text-xs" style={{ marginTop: '8px', color: 'var(--green)', fontWeight: 600 }}>
            🎉 Studio complété ! Vous pouvez télécharger votre dossier.
          </p>
        )}
      </div>

      {/* Stepper cliquable */}
      <div className="grid grid-3 gap-4">
        {steps.map((step) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          
          return (
            <button
              key={step.num}
              onClick={() => onStepClick(step.num)}
              style={{
                padding: '16px',
                background: isActive ? 'var(--primary-muted)' : isCompleted ? 'var(--success-muted)' : 'var(--color-surface-2)',
                border: `2px solid ${isActive ? 'var(--primary)' : isCompleted ? 'var(--green)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
              className="hover:scale-105"
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                {isCompleted ? '✓' : step.icon}
              </div>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: isActive ? 'var(--primary)' : isCompleted ? 'var(--green)' : 'var(--text-muted)',
                marginBottom: '4px'
              }}>
                {step.num}
              </div>
              <div className="text-xs" style={{ 
                color: isActive ? 'var(--primary)' : isCompleted ? 'var(--green)' : 'var(--text-muted)',
                fontWeight: 600 
              }}>
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
