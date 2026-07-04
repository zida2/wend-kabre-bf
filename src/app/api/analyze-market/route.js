// Analyse IA d'un marché : lit le PDF officiel (DAO/avis) via Gemini et en
// extrait des informations structurées + les pièces exigées + un résumé (§5).
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

// Même allowlist que le proxy PDF (anti open-proxy/SSRF).
function isAllowedHost(host) {
  const h = host.toLowerCase();
  return h === 'reliefweb.int' || h.endsWith('.reliefweb.int') || h.endsWith('.bf') || h === 'bf';
}

const analysisSchema = z.object({
  numeroMarche: z.string().describe("Numéro/référence du marché (ou 'Non spécifié')"),
  objet: z.string().describe("Objet du marché en une phrase claire"),
  autoriteContractante: z.string().describe("Autorité contractante / maître d'ouvrage"),
  ministere: z.string().describe("Ministère ou institution de tutelle (ou 'Non spécifié')"),
  region: z.string().describe("Région (ou 'Non spécifié')"),
  commune: z.string().describe("Commune / ville (ou 'Non spécifié')"),
  budget: z.string().describe("Budget ou montant estimatif s'il est indiqué (ou 'Non communiqué')"),
  financement: z.string().describe("Source de financement (ou 'Non spécifié')"),
  typeProcedure: z.string().describe("Type de procédure de passation (appel d'offres ouvert, demande de cotation, etc.)"),
  datePublication: z.string().describe("Date de publication (ou 'Non spécifié')"),
  dateLimite: z.string().describe("Date limite de dépôt des offres (ou 'Non spécifié')"),
  heureLimite: z.string().describe("Heure limite de dépôt (ou 'Non spécifié')"),
  dureeExecution: z.string().describe("Durée d'exécution / de validité (ou 'Non spécifié')"),
  lieuExecution: z.string().describe("Lieu d'exécution / de livraison (ou 'Non spécifié')"),
  contactEmail: z.string().describe("Email de contact (ou 'Non spécifié')"),
  contactTelephone: z.string().describe("Téléphone de contact (ou 'Non spécifié')"),
  conditionsParticipation: z.array(z.string()).describe("Conditions d'éligibilité et qualifications demandées"),
  piecesAdministratives: z.array(z.string()).describe("Pièces administratives exigées (RCCM, IFU, ASF, CNSS, ANPE, casier judiciaire, non-faillite, agréments, déclaration sur l'honneur, etc.)"),
  piecesTechniques: z.array(z.string()).describe("Pièces techniques exigées (références, personnel, matériel, méthodologie, planning, organisation)"),
  piecesFinancieres: z.array(z.string()).describe("Pièces financières exigées (bordereau des prix, devis quantitatif, lettre de soumission, caution, garanties)"),
  criteresSelection: z.array(z.string()).describe("Critères de sélection / d'évaluation des offres"),
  risques: z.array(z.string()).describe("Points de vigilance et risques de disqualification"),
  resume: z.string().describe("Résumé clair et synthétique du marché en 3 à 5 phrases"),
});

async function fetchPdfBytes(url) {
  let target;
  try { target = new URL(url); } catch { throw new Error('URL invalide'); }
  if (!isAllowedHost(target.hostname)) throw new Error('Domaine non autorisé');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(target.href, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/pdf,*/*' } });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`Document introuvable (${res.status})`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 25 * 1024 * 1024) throw new Error('Document trop volumineux');
  return new Uint8Array(buf);
}

export async function POST(req) {
  if (!apiKey) {
    return Response.json({ error: "Clé IA non configurée (GOOGLE_GENERATIVE_AI_API_KEY)." }, { status: 503 });
  }

  // Accès réservé aux utilisateurs connectés (analyse IA coûteuse).
  const authResult = await verifyFirebaseToken(req);
  if (!authResult.ok) {
    return Response.json({ error: 'Connexion requise' }, { status: 401 });
  }

  let marketId, pdfUrl;
  try {
    ({ marketId, pdfUrl } = await req.json());
  } catch {
    return Response.json({ error: 'Requête invalide' }, { status: 400 });
  }
  if (!marketId) return Response.json({ error: 'marketId manquant' }, { status: 400 });

  // Marché + choix du PDF
  let market;
  try {
    const snap = await getDoc(doc(db, 'marches', marketId));
    if (!snap.exists()) return Response.json({ error: 'Marché introuvable' }, { status: 404 });
    market = { id: snap.id, ...snap.data() };
  } catch (e) {
    return Response.json({ error: 'Lecture du marché impossible' }, { status: 500 });
  }

  const chosenUrl = pdfUrl || market.documents?.[0]?.url;
  if (!chosenUrl) {
    return Response.json({ error: "Aucun document PDF associé à ce marché." }, { status: 422 });
  }

  // PDF -> Gemini
  let pdfBytes;
  try {
    pdfBytes = await fetchPdfBytes(chosenUrl);
  } catch (e) {
    return Response.json({ error: `PDF illisible : ${e.message}` }, { status: 502 });
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: analysisSchema,
      system:
        "Tu es un expert de la passation des marchés publics au Burkina Faso. Tu lis intégralement un Dossier d'Appel d'Offres (DAO) ou un avis officiel et tu en extrais des informations FIDÈLES au document. N'invente jamais une information absente : mets 'Non spécifié'. Les listes de pièces doivent être précises et exhaustives.",
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Contexte connu (peut être incomplet) : ${JSON.stringify({ title: market.title, source: market.source, category: market.category })}\n\nAnalyse le document officiel ci-joint et remplis toutes les informations structurées demandées.` },
            { type: 'file', data: pdfBytes, mediaType: 'application/pdf' },
          ],
        },
      ],
    });

    const analysis = { ...object, analyzedUrl: chosenUrl, analyzedAt: new Date().toISOString() };

    // Cache sur le marché (écriture serveur autorisée par les règles marchés)
    try {
      await updateDoc(doc(db, 'marches', marketId), { aiAnalysis: analysis });
    } catch (e) {
      console.error('[analyze-market] écriture cache échouée:', e?.message);
    }

    return Response.json({ success: true, analysis });
  } catch (e) {
    console.error('[analyze-market] Gemini error:', e?.message);
    return Response.json({ error: "L'analyse IA a échoué. Réessayez plus tard." }, { status: 500 });
  }
}
