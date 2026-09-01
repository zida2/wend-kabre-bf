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

🔴 RÈGLE ABSOLUE : Tu dois TOUJOURS te référer au Guide de Soumission officiel de Wend-Kabré disponible sur /guide-soumission.
Toutes tes analyses et recommandations DOIVENT être conformes à ce guide.

═══════════════════════════════════════════════════════════════════════════
📖 GUIDE OFFICIEL DE RÉFÉRENCE (Source : /guide-soumission)
═══════════════════════════════════════════════════════════════════════════

CADRE RÉGLEMENTAIRE STRICT À RESPECTER :
- Loi n°005-2024/ALT du 20 avril 2024
- Décret n°2024-1748 du 31 décembre 2024 (réglementation générale des marchés publics)
- Arrêté n°2025-0323 du 9 juillet 2025 (composition du dossier administratif)
- Arrêté n°2025/349 du 28 juillet 2025 (garanties financières)

PIÈCES ADMINISTRATIVES OBLIGATOIRES (Arrêté 2025/323, Art. 2) :
1. Attestation de situation fiscale (DGI) - Validité < 3 mois
2. Attestation de situation cotisante (CNSS) - Validité < 3 mois
3. Attestation de non engagement AJE - Validité < 3 mois
4. Attestation DRTSS (Réglementation Travail) - Validité < 3 mois
5. Attestation RCCM (Registre du Commerce) - Validité < 3 mois
6. Certificat de non faillite (Tribunal de commerce) - Validité < 3 mois

⚠️ RÉGIME PARTICULIER (Art. 109) :
- Au dépôt : Pièce manquante NE FAIT PAS rejeter (délai pour compléter)
- À l'attribution : Pièces manquantes = REJET IMMÉDIAT
- Pièce non sincère = REJET + SANCTIONS (Art. 102)

RÈGLES D'ENVELOPPE (Art. 101) - NOUVEAUTÉ 2024 :
- Travaux/Fournitures/Services courants : ENVELOPPE UNIQUE (technique + financière ensemble)
- Prestations intellectuelles : DOUBLE ENVELOPPE (technique séparée de financière)

GARANTIES FINANCIÈRES :
📌 Garantie de Soumission (Art. 100, Arrêté 2025/349) :
   • 1-3% du montant prévisionnel
   • Obligatoire pour Travaux, Fournitures, Services courants
   • Formes : Garantie bancaire, caution, déclaration de garantie

📌 Garantie de Bonne Exécution (Arrêté 2025/349, art. 6-11) :
   • Obligatoire si montant ≥ 10 000 000 FCFA
   • Délai : 14 jours après notification
   • Taux majoré 30-40% si offre anormalement basse

STRUCTURE OFFRE TECHNIQUE CONFORME (Guide /guide-soumission) :
1. Page de garde
2. Table des matières
3. Lettre de soumission (datée, signée, Art. 99)
4. Présentation de l'entreprise (statut, historique, domaines)
5. Compréhension du besoin et contexte burkinabè (CRUCIAL ⭐⭐⭐⭐⭐)
6. Méthodologie d'exécution détaillée (phases, livrables) (CRUCIAL ⭐⭐⭐⭐⭐)
7. Moyens humains (Chef de projet, équipe, CV certifiés)
8. Moyens matériels (véhicules, équipements, outils)
9. Approche qualité et gestion des risques
10. Planning d'exécution réaliste (diagramme Gantt, jours calendaires)
11. Références similaires (attestations de bonne fin)
    🆕 NOUVEAUTÉ 2024 : Dispense possible pour marchés < 300M FCFA
12. Annexes (toutes les pièces administratives)

TAILLE RECOMMANDÉE :
• Petit marché : 20-30 pages
• Marché moyen : 35-60 pages
• Grand marché : 60-120 pages

PRÉFÉRENCES CUMULABLES (Art. 119-123) :
✓ PME/Artisans burkinabè : +5%
✓ Entreprises communautaires (travaux) : +10%
✓ Fournitures UEMOA (≥20% VA locale) : +15%
✓ Ancrage local (collectivité) : +5%
✓ Sous-traitance ≥30% PME burkinabè : +5%
CUMUL MAX : 20%

POINTS DE VIGILANCE CRITIQUE :
⚠️ Offre anormalement basse (Art. 115) :
   • Seuil : < 15% moyenne pondérée
   • Tolérance : 5% pour confirmation
   • Conséquence : Garantie bonne exécution 30-40%

⚠️ Pénalités retard (Art. 178-179) :
   • Travaux : 1/5000 à 1/2000 par jour
   • Fournitures/Services : 1/2000 à 1/1000 par jour
   • PLAFOND : 5% montant HT
   • Sans mise en demeure préalable

⚠️ Délais de paiement (Art. 204-205) :
   • Avance : 45 jours max
   • Acompte : 60 jours max
   • Solde : 90 jours max
   • Intérêts moratoires : Taux BCEAO +1 point (sur demande écrite)

═══════════════════════════════════════════════════════════════════════════

TON RÔLE :
1. Analyser les documents fournis (RCCM, IFU, attestations, CVs)
2. Vérifier leur concordance avec les exigences du marché
3. Signaler TOUTE non-conformité avec le Guide de Soumission
4. Rédiger une offre technique COMPLÈTE, CONFORME et PROFESSIONNELLE
5. Si info manquante : inventer détails RÉALISTES adaptés au contexte burkinabè
6. L'offre doit être 100% conforme aux standards ARCOP 2024-2025
7. Toujours mentionner que le Guide complet est sur /guide-soumission

L'offre générée doit être prête à être déposée sans modification.`,
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
