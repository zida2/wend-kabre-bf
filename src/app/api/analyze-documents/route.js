import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60; // Timeout de 60s sur Vercel pour l'analyse de documents

export async function POST(req) {
  try {
    const { market, files } = await req.json();

    const parts = files.map(f => {
      if (f.mimeType === 'application/pdf') {
        return {
          type: 'file',
          data: f.data,
          mediaType: f.mimeType
        };
      }
      return {
        type: 'image',
        image: f.data,
        mediaType: f.mimeType
      };
    });

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: `Tu es un consultant expert en passation de marchés publics au Burkina Faso. Ton rôle est d'analyser les documents administratifs fournis par une entreprise (RCCM, IFU, attestations, CVs) et de vérifier s'ils concordent avec les exigences d'un marché spécifique. 

Ensuite, tu dois rédiger l'intégralité d'une offre technique professionnelle et complète pour ce marché, basée sur l'entreprise. Ne laisse aucun espace vide, invente des détails pertinents, professionnels et réalistes si nécessaire pour que l'offre soit 100% prête à être déposée par l'entreprise. Utilise un langage très professionnel.`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Voici les détails du marché : ${JSON.stringify(market)}\n\nEt voici les documents scannés de mon entreprise. Extrais les informations (nom, rccm, etc.), donne un score de concordance sur 100, liste les pièces manquantes (s'il y en a) par rapport aux exigences du marché, puis rédige le contenu complet de chaque section de l'offre technique.` },
            ...parts
          ]
        }
      ],
      schema: z.object({
        concordanceScore: z.number().describe('Score de concordance sur 100 entre les pièces fournies et celles requises.'),
        missingDocuments: z.array(z.string()).describe('Liste des documents obligatoires manquants selon les exigences du marché'),
        extractedCompanyInfo: z.object({
          name: z.string().describe("Nom de l'entreprise (ou 'Votre Entreprise' si introuvable)"),
          rccm: z.string().describe("Numéro RCCM (ou '[Non renseigné]')"),
          ifu: z.string().describe("Numéro IFU (ou '[Non renseigné]')"),
          address: z.string().describe("Adresse / Siège social"),
          managerName: z.string().describe("Nom du gérant / directeur")
        }),
        generatedOffer: z.object({
          presentation: z.string().describe("Présentation détaillée de l'entreprise (Historique, statuts, domaines d'intervention)."),
          comprehension: z.string().describe("Compréhension du besoin et des enjeux du marché. Contextualisez avec la réalité du terrain."),
          methodology: z.string().describe("Méthodologie détaillée d'exécution (Phases, organisation, livrables). C'est le cœur de l'offre."),
          humanResources: z.string().describe("Moyens humains affectés au projet (Chef de projet, équipe technique, qualifications). Inventez des profils pertinents s'il n'y a pas de CV."),
          materials: z.string().describe("Moyens matériels et logistiques mobilisés (Véhicules, ordinateurs, logiciels, outillage)."),
          qualityAndRisks: z.string().describe("Approche qualité (procédures) et plan de gestion des risques (retards, sécurité)."),
          planning: z.string().describe("Description textuelle du chronogramme d'exécution (Phase 1 : 1 semaine, Phase 2 : etc.).")
        })
      }),
    });

    return new Response(JSON.stringify(result.object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur Analyse Document:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
