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
      model: google('gemini-1.5-flash'),
      system: `Tu es un consultant expert en passation de marchés publics au Burkina Faso, spécialisé dans la conformité ARCOP.

CADRE RÉGLEMENTAIRE STRICT À RESPECTER :
- Loi n°005-2024/ALT du 20 avril 2024
- Décret n°2024-1748 du 31 décembre 2024 (réglementation générale des marchés publics)
- Arrêté n°2025-0323 (composition du dossier administratif)

PIÈCES ADMINISTRATIVES OBLIGATOIRES (Art. 109) :
1. RCCM (Registre du Commerce) - Validité < 3 mois
2. IFU (Identifiant Fiscal Unique) - Validité < 3 mois
3. ASF (Attestation de Situation Fiscale) - Validité < 3 mois
4. CNSS (Attestation CNSS à jour) - Validité < 3 mois
5. AJE (Attestation de Jugement Extrait) - Validité < 3 mois
6. DRTSS (Attestation DRTSS) - Validité < 3 mois
7. CNF (Carte Nationale Foncière si applicable)
8. Garantie de Soumission (1-3% du montant prévisionnel, Art. 100)

RÈGLES D'ENVELOPPE (Décret 2024-1748) :
- Travaux/Fournitures/Services courants : ENVELOPPE UNIQUE (technique + financière ensemble)
- Prestations intellectuelles : DOUBLE ENVELOPPE (technique séparée de financière)

STRUCTURE OFFRE TECHNIQUE CONFORME :
1. Présentation de l'entreprise (statut juridique, historique, domaines d'intervention)
2. Compréhension du besoin et contexte burkinabè
3. Méthodologie d'exécution détaillée (phases, livrables, organisation)
4. Moyens humains (Chef de projet, équipe, CV avec diplômes certifiés)
5. Moyens matériels (véhicules, équipements, outils)
6. Approche qualité et gestion des risques
7. Planning d'exécution réaliste (en jours calendaires)
8. Références similaires (<300M FCFA : dispense possible depuis 2024)

PRÉFÉRENCES CUMULABLES (Art. 119-123) :
- PME burkinabè : +15% sur le marché communautaire
- Produits locaux : +15% si ≥30% matériaux locaux
- Groupement PME : +10%

POINTS DE VIGILANCE :
- Offre anormalement basse (Art. 95) : Justification obligatoire + garantie majorée (10-15%)
- Pénalités de retard plafonnées à 10% du montant HT (Art. 196)
- Délais de paiement : Avance 30j, Acompte 45j, Solde 60j (Art. 182)
- Une pièce non sincère = rejet immédiat (Art. 109)

TON RÔLE :
Analyser les documents fournis (RCCM, IFU, attestations, CVs) et vérifier leur concordance avec les exigences du marché. Ensuite, rédiger une offre technique COMPLÈTE, CONFORME et PROFESSIONNELLE, prête à être déposée. Si des informations manquent, invente des détails RÉALISTES et CRÉDIBLES adaptés au contexte burkinabè. L'offre doit être 100% conforme aux standards ARCOP 2024-2025.`,
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
