'use client';

import { useState } from 'react';

export default function Step2Technical({ marche, studioData, updateStudioData, goToStep }) {
  const [generating, setGenerating] = useState(false);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({
        name: file.name,
        mimeType: file.type,
        data: reader.result.split(',')[1]
      });
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!studioData.selectedFiles?.length) {
      updateStudioData({ generationError: "Veuillez sélectionner au moins un document à l'étape 1." });
      return;
    }

    setGenerating(true);
    updateStudioData({ generationError: null });

    try {
      const base64Files = await Promise.all(
        studioData.selectedFiles.map(convertFileToBase64)
      );

      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          market: marche, 
          files: base64Files 
        })
      });

      if (!response.ok) throw new Error("Erreur lors de l'analyse des documents");

      const data = await response.json();
      updateStudioData({ extractedData: data });
      goToStep(3);
    } catch (err) {
      console.error(err);
      updateStudioData({ 
        generationError: "Une erreur est survenue lors de l'analyse de vos documents par l'IA. Vérifiez la taille des fichiers." 
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="heading-md" style={{ marginBottom: '24px' }}>
        🪄 Étape 2 : Génération de l'Offre Technique par IA
      </h2>

      <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
        Notre IA va analyser vos <strong>{studioData.selectedFiles?.length || 0} documents</strong> et rédiger 
        l'<strong>intégralité de l'offre technique sur-mesure</strong> pour ce marché spécifique.
      </p>

      {/* Liste des sections générées */}
      <div style={{ 
        background: 'var(--color-surface-2)', 
        border: '1px solid var(--color-border)', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '24px' 
      }}>
        <h3 className="text-sm font-bold" style={{ marginBottom: '16px', color: 'var(--primary)' }}>
          📝 Sections qui seront rédigées automatiquement :
        </h3>
        
        <div className="grid grid-2 gap-3">
          {[
            { icon: '🏢', label: 'Présentation de l\'entreprise' },
            { icon: '🎯', label: 'Compréhension du besoin' },
            { icon: '⚙️', label: 'Méthodologie d\'exécution' },
            { icon: '👥', label: 'Moyens humains et organisation' },
            { icon: '🛠️', label: 'Moyens matériels et logistiques' },
            { icon: '✅', label: 'Approche qualité et gestion des risques' },
            { icon: '📅', label: 'Planning d\'exécution détaillé' },
            { icon: '📄', label: 'Lettre de soumission personnalisée' },
          ].map((section, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '10px',
              background: 'var(--color-bg)',
              borderRadius: '6px',
              border: '1px solid var(--color-border)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
              <span className="text-sm text-secondary">{section.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Erreur */}
      {studioData.generationError && (
        <div style={{ 
          background: 'var(--danger-muted)', 
          color: 'var(--danger)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '1px solid rgba(220,38,38,0.3)' 
        }}>
          <p className="text-sm" style={{ fontWeight: 600, marginBottom: '8px' }}>❌ Erreur</p>
          <p className="text-xs">{studioData.generationError}</p>
        </div>
      )}

      {/* Bouton de génération ou progression */}
      {!generating && !studioData.extractedData ? (
        <button 
          onClick={handleGenerate} 
          className="btn btn-gold w-full"
          style={{ fontSize: '1.1rem', padding: '18px' }}
        >
          🪄 Lancer l'Analyse IA et Rédiger l'Offre Complète
        </button>
      ) : null}

      {generating && (
        <div className="text-center" style={{ padding: '40px 20px' }}>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: 'var(--color-border)', 
            borderRadius: '4px', 
            overflow: 'hidden', 
            marginBottom: '24px' 
          }}>
            <div style={{ 
              width: '60%', 
              height: '100%', 
              background: 'var(--grad-primary)', 
              borderRadius: '4px',
              animation: 'progressAnim 2s infinite linear' 
            }}></div>
          </div>
          <style>{`
            @keyframes progressAnim {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
          <p className="text-gold" style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '12px' }}>
            Traitement en cours...
          </p>
          <p className="text-sm text-secondary">
            📖 Lecture OCR des documents<br />
            🧠 Extraction des données d'entreprise<br />
            ✍️ Rédaction sur-mesure de la méthodologie
          </p>
          <p className="text-xs text-muted" style={{ marginTop: '16px' }}>
            Cela peut prendre jusqu'à 60 secondes
          </p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button 
          onClick={() => goToStep(1)} 
          className="btn btn-outline"
          style={{ flex: 1 }}
        >
          ← Retour aux Documents
        </button>
        <button 
          onClick={() => goToStep(3)} 
          className="btn btn-primary"
          disabled={!studioData.extractedData}
          style={{ flex: 1, opacity: studioData.extractedData ? 1 : 0.5 }}
        >
          Voir le Résultat →
        </button>
      </div>
    </div>
  );
}
