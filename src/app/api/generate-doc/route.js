// API pour générer des documents ARCOP (Lettre de soumission, Déclaration de probité)
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type'); // 'lettre-soumission' ou 'declaration-probite'
  const marcheTitle = searchParams.get('marcheTitle') || '';
  const entreprise = searchParams.get('entreprise') || '';
  const rccm = searchParams.get('rccm') || '';
  const ifu = searchParams.get('ifu') || '';

  if (!type || !entreprise || !rccm) {
    return new Response('Paramètres manquants (type, entreprise, rccm requis)', { status: 400 });
  }

  let doc;

  if (type === 'lettre-soumission') {
    doc = generateLettreSoumission({ marcheTitle, entreprise, rccm, ifu });
  } else if (type === 'declaration-probite') {
    doc = generateDeclarationProbite({ marcheTitle, entreprise, rccm, ifu });
  } else {
    return new Response('Type de document invalide', { status: 400 });
  }

  try {
    const buffer = await Packer.toBuffer(doc);
    
    const filename = type === 'lettre-soumission' 
      ? `Lettre_Soumission_${entreprise.replace(/\s+/g, '_')}.docx`
      : `Declaration_Probite_${entreprise.replace(/\s+/g, '_')}.docx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Erreur génération document:', err);
    return new Response('Erreur lors de la génération du document', { status: 500 });
  }
}

// ===== LETTRE DE SOUMISSION =====
function generateLettreSoumission({ marcheTitle, entreprise, rccm, ifu }) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return new Document({
    sections: [{
      properties: {},
      children: [
        // En-tête entreprise
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: entreprise,
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `RCCM: ${rccm}`,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `IFU: ${ifu}`,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `Ouagadougou, le ${date}`,
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Destinataire
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: 'À',
              bold: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "L'Autorité Contractante",
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: '[Adresse de l\'autorité contractante]',
              size: 22,
              italics: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Objet
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: 'Objet : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: 'Lettre de soumission',
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Corps de la lettre
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: 'Madame, Monsieur,',
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `En réponse à votre Appel d'Offres concernant "${marcheTitle}", nous avons l'honneur de vous soumettre notre offre technique et financière conformément aux dispositions du dossier d'appel d'offres.`,
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Nous déclarons que notre entreprise dispose des capacités techniques, financières et humaines nécessaires pour exécuter la prestation demandée dans les délais impartis et selon les normes de qualité requises.",
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Nous nous engageons à maintenir cette offre valable pendant 90 jours à compter de la date limite de remise des offres.",
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Notre offre est accompagnée des pièces justificatives requises par le dossier d'appel d'offres, notamment :",
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),

        // Liste des pièces
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "• Attestation de non-redevance fiscale en cours de validité",
              size: 22,
            }),
          ],
          spacing: { before: 50, after: 50 },
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "• Attestation CNSS à jour",
              size: 22,
            }),
          ],
          spacing: { before: 50, after: 50 },
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "• Copie certifiée conforme du RCCM",
              size: 22,
            }),
          ],
          spacing: { before: 50, after: 50 },
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "• Copie de l'Identifiant Fiscal Unique (IFU)",
              size: 22,
            }),
          ],
          spacing: { before: 50, after: 50 },
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "• Agrément ARCOP en cours de validité",
              size: 22,
            }),
          ],
          spacing: { before: 50, after: 300 },
        }),

        // Formule de politesse
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Dans l'attente d'une suite favorable, nous vous prions d'agréer, Madame, Monsieur, l'expression de notre considération distinguée.",
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Signature
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: "Le Directeur Général",
              bold: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: entreprise,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: "[Signature et cachet]",
              italics: true,
              size: 20,
            }),
          ],
        }),
      ],
    }],
  });
}

// ===== DÉCLARATION DE PROBITÉ =====
function generateDeclarationProbite({ marcheTitle, entreprise, rccm, ifu }) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return new Document({
    sections: [{
      properties: {},
      children: [
        // Titre
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'DÉCLARATION DE PROBITÉ',
              bold: true,
              size: 28,
              underline: {},
            }),
          ],
          spacing: { after: 600 },
        }),

        // Référence du marché
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Relative à :',
              bold: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: marcheTitle,
              size: 22,
              italics: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Corps de la déclaration
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Je soussigné(e), ',
              size: 22,
            }),
            new TextRun({
              text: '[NOM ET PRÉNOM DU REPRÉSENTANT LÉGAL]',
              size: 22,
              bold: true,
            }),
            new TextRun({
              text: ', agissant en qualité de représentant légal de l\'entreprise ',
              size: 22,
            }),
            new TextRun({
              text: entreprise,
              size: 22,
              bold: true,
            }),
            new TextRun({
              text: ', immatriculée au RCCM sous le numéro ',
              size: 22,
            }),
            new TextRun({
              text: rccm,
              size: 22,
              bold: true,
            }),
            new TextRun({
              text: ' et titulaire de l\'IFU N° ',
              size: 22,
            }),
            new TextRun({
              text: ifu,
              size: 22,
              bold: true,
            }),
            new TextRun({
              text: ', déclare sur l\'honneur que :',
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        }),

        // Article 1
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Article 1 : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "Je n'ai pas été condamné(e) pour une infraction pénale incompatible avec l'exercice de mes fonctions, notamment pour des faits de corruption, fraude, blanchiment d'argent ou tout autre délit économique.",
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Article 2
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Article 2 : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "Mon entreprise n'a jamais été impliquée dans des pratiques frauduleuses, des manquements graves aux obligations contractuelles, ou des actes de corruption dans le cadre de marchés publics.",
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Article 3
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Article 3 : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "Je m'engage à ne pas offrir, directement ou indirectement, de pots-de-vin, cadeaux, commissions ou avantages quelconques à un agent public ou à toute autre personne en vue d'obtenir ou de conserver un marché public.",
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Article 4
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Article 4 : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "Mon entreprise n'a pas fait l'objet d'une interdiction de soumissionner aux marchés publics au Burkina Faso ou dans tout autre pays.",
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Article 5
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Article 5 : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "Je m'engage à respecter l'ensemble des dispositions législatives et réglementaires en vigueur au Burkina Faso, notamment le Code des Marchés Publics et les normes de l'ARCOP.",
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        }),

        // Engagement
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Je reconnais que toute fausse déclaration ou dissimulation d'information peut entraîner l'exclusion de mon entreprise de la présente procédure de passation de marché, ainsi que des poursuites judiciaires.",
              size: 22,
              bold: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Fait à
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: `Fait à Ouagadougou, le ${date}`,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Signature
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: 'Le Représentant Légal',
              bold: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: '[NOM ET PRÉNOM]',
              italics: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: entreprise,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: '[Signature et cachet]',
              italics: true,
              size: 20,
            }),
          ],
        }),
      ],
    }],
  });
}
