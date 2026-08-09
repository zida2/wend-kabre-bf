'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export default function Step3Verification({ marche, userData, studioData, updateStudioData, goToStep }) {
  const handleDownload = async () => {
    if (!studioData.extractedData) return;
    
    const companyInfo = studioData.extractedData.extractedCompanyInfo || {};
    const offer = studioData.extractedData.generatedOffer || {};

    const createText = (text) => {
      if (!text) return [new Paragraph({ children: [new TextRun({ text: "Non renseigné" })], spacing: { after: 200 } })];
      const lines = text.split('\n').filter(l => l.trim() !== '');
      return lines.map(line => new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 120 } }));
    };

    const docFile = new Document({
      sections: [
        {
          properties: {},
          children: [
            // PAGE DE GARDE
            new Paragraph({ 
              children: [new TextRun({ 
                text: "DOSSIER DE CANDIDATURE - OFFRE TECHNIQUE", 
                bold: true, 
                size: 48, 
                color: "064E3B" 
              })], 
              alignment: AlignmentType.CENTER, 
              spacing: { before: 1000, after: 400 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `Appel d'offres : ${marche.title || '[Titre du marché]'}`, 
                size: 28 
              })], 
              alignment: AlignmentType.CENTER, 
              spacing: { after: 200 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `Présenté par : ${companyInfo.name || '[VOTRE ENTREPRISE]'}`, 
                size: 32, 
                bold: true, 
                color: "000000" 
              })], 
              alignment: AlignmentType.CENTER, 
              spacing: { after: 400 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `RCCM : ${companyInfo.rccm || 'N/A'} | IFU : ${companyInfo.ifu || 'N/A'}`, 
                size: 24 
              })], 
              alignment: AlignmentType.CENTER, 
              spacing: { after: 200 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `Adresse : ${companyInfo.address || 'N/A'}`, 
                size: 24 
              })], 
              alignment: AlignmentType.CENTER, 
              spacing: { after: 800 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `Date : ${new Date().toLocaleDateString('fr-FR')}`, 
                size: 24 
              })], 
              alignment: AlignmentType.CENTER 
            }),
            new Paragraph({ children: [new PageBreak()] }),

            // LETTRE DE SOUMISSION
            new Paragraph({ 
              children: [new TextRun({ 
                text: "LETTRE DE SOUMISSION", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `À l'attention de : ${marche.source || "L'autorité contractante"}`, 
                bold: true 
              })] 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: "Objet : Soumission pour le marché relatif à " + (marche.title || '[Objet du marché]'), 
                bold: true 
              })], 
              spacing: { before: 200, after: 400 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ text: "Monsieur/Madame le Directeur," })], 
              spacing: { after: 200 } 
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `Après avoir examiné le Dossier d'Appel d'Offres, nous, soussignés ${companyInfo.name || '[Votre entreprise]'}, représentés par ${companyInfo.managerName || 'le Gérant'}, vous proposons de réaliser et d'achever les prestations conformément aux conditions du DAO.` 
              })], 
              spacing: { after: 200 } 
            }),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTIONS
            new Paragraph({ 
              children: [new TextRun({ 
                text: "1. PRÉSENTATION DE L'ENTREPRISE", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.presentation || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            new Paragraph({ 
              children: [new TextRun({ 
                text: "2. COMPRÉHENSION DU BESOIN ET ENJEUX", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.comprehension || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            new Paragraph({ 
              children: [new TextRun({ 
                text: "3. MÉTHODOLOGIE D'EXÉCUTION", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.methodology || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            new Paragraph({ 
              children: [new TextRun({ 
                text: "4. MOYENS HUMAINS ET ORGANISATION", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.humanResources || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            new Paragraph({ 
              children: [new TextRun({ 
                text: "5. MOYENS MATÉRIELS ET LOGISTIQUES", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.materials || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            new Paragraph({ 
              children: [new TextRun({ 
                text: "6. APPROCHE QUALITÉ ET GESTION DES RISQUES", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.qualityAndRisks || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            new Paragraph({ 
              children: [new TextRun({ 
                text: "7. PLANNING D'EXÉCUTION", 
                bold: true, 
                size: 32, 
                color: "064E3B" 
              })], 
              spacing: { after: 400 } 
            }),
            ...createText(offer.planning || "Non renseigné"),
          ],
        },
      ],
    });

    Packer.toBlob(docFile).then((blob) => {
      saveAs(blob, `Dossier_Technique_${companyInfo.name ? companyInfo.name.replace(/\s+/g, '_') : 'Entreprise'}.docx`);
    });
  };

  if (!studioData.extractedData) {
    return (
      <div className="animate-fadeIn text-center" style={{ padding: '60px 20px' }}>
        <p className="text-secondary" style={{ marginBottom: '24px' }}>
          Aucune offre générée. Veuillez retourner à l'étape 2 pour lancer la génération.
        </p>
        <button onClick={() => goToStep(2)} className="btn btn-primary">
          ← Retour à l'Étape 2
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '2.5rem' }}>✅</span>
        <h2 className="heading-lg text-green">Offre Rédigée avec Succès !</h2>
      </div>

      {/* Score de concordance */}
      <div style={{ 
        background: 'var(--success-muted)', 
        border: '1px solid rgba(5,150,105,0.2)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '24px' 
      }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
          <h3 className="text-sm font-bold text-primary">Score de Concordance</h3>
          <span style={{ 
            fontSize: '2rem', 
            fontWeight: 900, 
            color: studioData.extractedData.concordanceScore >= 80 ? 'var(--green)' : 'var(--primary)' 
          }}>
            {studioData.extractedData.concordanceScore || 0}%
          </span>
        </div>
        
        {studioData.extractedData.missingDocuments?.length > 0 ? (
          <div>
            <p className="text-xs text-muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
              Documents manquants ou non détectés :
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }} className="text-xs text-secondary">
              {studioData.extractedData.missingDocuments.map((doc, i) => <li key={i}>{doc}</li>)}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-green" style={{ fontWeight: 600 }}>
            ✓ Tous les documents requis semblent présents !
          </p>
        )}
      </div>

      {/* Avertissement responsabilité */}
      <div style={{ 
        background: 'var(--danger-muted)', 
        border: '1px solid rgba(220,38,38,0.28)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '24px' 
      }}>
        <h4 className="text-sm" style={{ color: 'var(--danger)', marginBottom: '12px', fontWeight: 'bold' }}>
          ⚠️ Responsabilité de Relecture
        </h4>
        <p className="text-xs text-secondary" style={{ marginBottom: '12px', lineHeight: 1.6 }}>
          Bien que l'IA ait rédigé l'offre de bout en bout pour vous (Méthodologie, Risques, Planning), 
          il s'agit de <strong>contenu généré automatiquement</strong>. Vous êtes responsable de vérifier 
          si les délais et approches inventés par l'IA correspondent aux capacités réelles de votre entreprise.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={studioData.agreedToTerms || false}
            onChange={(e) => updateStudioData({ agreedToTerms: e.target.checked })}
            style={{ marginTop: '2px' }} 
          />
          <span className="text-xs text-primary" style={{ fontWeight: 600 }}>
            Je m'engage à relire et adapter le document final généré par l'IA avant toute soumission officielle.
          </span>
        </label>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-2 gap-4" style={{ marginBottom: '24px' }}>
        <button 
          onClick={handleDownload}
          disabled={!studioData.agreedToTerms} 
          className="btn btn-primary"
          style={{ opacity: studioData.agreedToTerms ? 1 : 0.5, fontSize: '1rem', padding: '16px' }}
        >
          📥 Télécharger l'Offre Rédigée (.docx)
        </button>
        <button 
          onClick={() => goToStep(1)}
          className="btn btn-outline"
          style={{ fontSize: '1rem', padding: '16px' }}
        >
          🔄 Recommencer avec d'autres documents
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => goToStep(1)} 
          className="btn btn-outline btn-sm"
          style={{ flex: 1 }}
        >
          ← Étape 1
        </button>
        <button 
          onClick={() => goToStep(2)} 
          className="btn btn-outline btn-sm"
          style={{ flex: 1 }}
        >
          ← Étape 2
        </button>
      </div>
    </div>
  );
}
