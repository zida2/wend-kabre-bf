'use client';

import { PIECES_ADMINISTRATIVES } from '@/lib/arcop';

export default function Step1Admin({ marche, studioData, updateStudioData, goToStep }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    updateStudioData({ selectedFiles: files });
  };

  const extractSpecificDocuments = (m) => {
    if (!m) return [];
    
    if (m.category === 'Recrutement' && m.requirements && m.requirements.length > 0 && m.requirements[0] !== "Voir les documents requis dans l'avis officiel") {
       return m.requirements; 
    }
    
    const text = (m.description || "").toLowerCase() + " " + (m.title || "").toLowerCase();
    const reqs = [];
    
    if (m.category === 'Recrutement') {
      if (text.includes('cv') || text.includes('curriculum vitae')) reqs.push('CV à jour');
      if (text.includes('lettre de motivation')) reqs.push('Lettre de motivation');
      if (text.includes('diplôme') || text.includes('diplome')) reqs.push('Copie des diplômes');
      if (text.includes('certificat') || text.includes('attestation')) reqs.push('Certificats de travail / Attestations');
      if (text.includes('cni') || text.includes("carte d'identité") || text.includes('passeport')) reqs.push("Pièce d'identité (CNI/Passeport)");
    } else {
      if (text.includes('agrément') || text.includes('agrement technique')) reqs.push('Agrément technique');
      if (text.includes('caution') || text.includes('garantie')) reqs.push('Caution de soumission');
      if (text.includes("chiffre d'affaire") || text.includes('bilan')) reqs.push('États financiers');
      if (text.includes('bonne fin') || text.includes('expérience')) reqs.push('Attestations de bonne exécution');
    }
    
    return reqs;
  };

  const specificDocs = extractSpecificDocuments(marche);

  return (
    <div className="animate-fadeIn">
      <h2 className="heading-md" style={{ marginBottom: '24px' }}>
        📋 Étape 1 : Pièces à Fournir
      </h2>

      {/* Documents requis */}
      <div style={{ 
        background: 'var(--success-muted)', 
        border: '1px solid rgba(5,150,105,0.2)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '24px' 
      }}>
        <h3 className="text-sm font-bold text-primary" style={{ marginBottom: '16px' }}>
          📌 Documents Attendus pour ce Marché
        </h3>
        
        {/* 6 pièces ARCOP obligatoires */}
        <p className="text-xs text-muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
          Socle administratif (6 pièces obligatoires - Référentiel ARCOP) :
        </p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '0 0 16px 0' }} className="text-sm text-secondary">
          {PIECES_ADMINISTRATIVES.map((piece) => (
            <li key={piece.id}>
              {piece.label} <span className="text-xs text-muted">({piece.emetteur})</span>
            </li>
          ))}
        </ul>

        {/* Documents spécifiques */}
        <p className="text-xs text-muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
          Documents spécifiques à cet avis :
        </p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }} className="text-sm text-secondary">
          {specificDocs.length > 0 ? (
            specificDocs.map((req, i) => (
              <li key={i}>{req}</li>
            ))
          ) : (
            <li>Veuillez lire attentivement la description de l'avis pour d'éventuelles exigences particulières.</li>
          )}
        </ul>

        {/* Accord de groupement */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'var(--color-bg)', 
          borderRadius: '6px', 
          border: '1px solid var(--color-border)' 
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={studioData.enGroupement || false}
              onChange={(e) => updateStudioData({ enGroupement: e.target.checked })}
            />
            <span className="text-xs text-primary" style={{ fontWeight: 600 }}>
              Je soumissionne en groupement
            </span>
          </label>
          {studioData.enGroupement && (
            <p className="text-xs text-muted" style={{ marginTop: '8px', paddingLeft: '24px' }}>
              ⚠️ N'oubliez pas de joindre l'accord de groupement signé par toutes les parties.
            </p>
          )}
        </div>
      </div>

      {/* Zone de sélection de fichiers */}
      <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
        Sélectionnez vos documents numérisés. L'IA les lira pour vérifier leur conformité et rédiger l'offre technique avec vos données.
      </p>

      <div style={{ 
        border: '2px dashed var(--primary)', 
        padding: '40px', 
        textAlign: 'center', 
        borderRadius: '8px', 
        marginBottom: '24px', 
        background: 'var(--primary-muted)' 
      }}>
        <input 
          type="file" 
          multiple 
          accept="image/*,application/pdf" 
          onChange={handleFileChange} 
          id="fileUpload" 
          style={{ display: 'none' }} 
        />
        <label htmlFor="fileUpload" className="btn btn-primary" style={{ cursor: 'pointer', marginBottom: '16px' }}>
          📁 Sélectionner vos fichiers
        </label>
        <p className="text-xs text-muted">Formats acceptés : PDF, JPG, PNG (max 10 fichiers)</p>
        
        {studioData.selectedFiles?.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <p className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '12px' }}>
              ✓ Fichiers sélectionnés ({studioData.selectedFiles.length}) :
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
              {studioData.selectedFiles.map((f, i) => (
                <li 
                  key={i} 
                  className="text-sm text-secondary" 
                  style={{ 
                    padding: '8px 12px', 
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ color: 'var(--primary)' }}>📄</span>
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => goToStep(2)} 
          className="btn btn-primary"
          disabled={!studioData.selectedFiles?.length}
          style={{ flex: 1, opacity: studioData.selectedFiles?.length ? 1 : 0.5 }}
        >
          Continuer vers l'Offre Technique →
        </button>
      </div>
    </div>
  );
}
