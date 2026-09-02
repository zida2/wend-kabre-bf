// Analyse IA d'un marché : lit le PDF officiel (DAO/avis) via Gemini et en
// extrait des informations structurées + les pièces exigées + un résumé (§5).
// HYBRID MODE: Tries Gemini first, falls back to offline analysis if key missing or fails
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
// Écriture via l'Admin SDK (cf. /api/scrape) : `marches` n'est plus modifiable
// depuis le navigateur.
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyFirebaseToken } from '@/lib/authGuard';

import { BURKINA_SYSTEM_PROMPT_ANALYZE_MARKET } from '@/lib/burkinaProcurement2025';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

// Même allowlist que le proxy PDF (anti open-proxy/SSRF).
function isAllowedHost(host) {
  const h = host.toLowerCase();
  return h === 'reliefweb.int' || h.endsWith('.reliefweb.int') || h.endsWith('.bf') || h === 'bf';
}

// Offline fallback: Generate market analysis without Gemini
function generateOfflineMarketAnalysis(market, marketId) {
  console.log('[analyze-market] Utilisation de l\'analyse hors-ligne');
  
  const budget = market.montant ? `${(market.montant / 1000000).toFixed(0)} millions FCFA` : 'Non communiqué';
  const region = market.source?.includes('Ouagadougou') ? 'Kadiogo' : 'À déterminer';
  
  return {
    numeroMarche: marketId || 'Non spécifié',
    objet: market.title || 'Marché public',
    autoriteContractante: market.source || 'Autorité contractante du Burkina Faso',
    ministere: 'Non spécifié (visible dans le document officiel)',
    region: region,
    commune: market.source?.includes('Ouagadougou') ? 'Ouagadougou' : 'À déterminer',
    budget: budget,
    financement: 'À déterminer (visible dans le document)',
    typeProcedure: market.montant >= 150000000 ? 'Appel d\'offres ouvert' : 'Demande de cotation ou appel d\'offres',
    datePublication: market.dateCreated ? new Date(market.dateCreated).toLocaleDateString('fr-BF') : 'Non spécifié',
    dateLimite: market.dateLimite ? new Date(market.dateLimite).toLocaleDateString('fr-BF') : 'À consulter le document',
    heureLimite: '10:00 (heure de Ouagadougou - standard)',
    dureeExecution: '1 à 12 mois selon le type de marché',
    lieuExecution: region,
    contactEmail: 'À consulter le document officiel',
    contactTelephone: 'À consulter le document officiel',
    contactAdresse: 'Ministère ou institution concernée (Ouagadougou)',
    garantieSubmission: market.montant >= 10000000 ? '1-3% du montant de l\'offre - Caution bancaire' : 'Non exigée pour petits marchés',
    dureeValiditeGarantie: '90 jours',
    conditionsParticipation: [
      'Entreprise agréée au Burkina Faso',
      'Pas de retard de paiement antérieur',
      'Non en liquidation judiciaire',
      'Capable de mobiliser les ressources nécessaires',
      'Situation fiscale à jour',
      'Affiliation CNSS à jour'
    ],
    piecesAdministratives: [
      'Attestation de situation fiscale (DGI) - validité < 3 mois',
      'Attestation de situation cotisante (CNSS) - validité < 3 mois',
      'Attestation de non engagement AJE',
      'Attestation DRTSS',
      'Attestation RCCM',
      'Certificat de non-faillite',
      'RCCM original ou copie certifiée'
    ],
    piecesTechniques: [
      'Lettre de soumission (signée)',
      'Présentation de l\'entreprise',
      'Compréhension du marché et contexte',
      'Méthodologie détaillée',
      'Planning d\'exécution (Gantt ou chronogramme)',
      'Moyens humains (organigramme, CVs)',
      'Moyens matériels',
      'Approche qualité',
      'Gestion des risques',
      'Références de marchés similaires'
    ],
    piecesFinancieres: [
      'Bordereau des prix unitaires',
      'Devis quantitatif et estimatif',
      'Détail des coûts (main d\'œuvre, matériaux, frais généraux)',
      'Montant total TTC (chiffres et lettres)',
      'TVA applicable',
      'Validité de l\'offre (généralement 90 jours)'
    ],
    criteresSelection: [
      'Conformité administrative (dossier complet)',
      'Score technique (30-50%)',
      'Score financier (30-50%)',
      'Application des préférences nationales PME (+5%)',
      'Offre non anormalement basse (< 15% moyenne)'
    ],
    risques: [
      'Pièces administratives périmées (> 3 mois)',
      'Caution de soumission manquante ou invalide',
      'Offre anormalement basse (30-40% de pénalité)',
      'Non-conformité technique majeure',
      'Erreurs de calcul dans l\'offre financière',
      'Retard de dépôt (même 1 minute = disqualification)',
      'Méthodologie peu convaincante ou générique',
      'Équipe insuffisamment qualifiée'
    ],
    resume: `Marché public au Burkina Faso pour ${market.title?.toLowerCase() || 'travaux/fournitures/services'}. Montant estimatif : ${budget}. Procédure : ${market.montant >= 150000000 ? 'appel d\'offres ouvert' : 'demande de cotation'}. Délai de dépôt : à consulter le document officiel. Documents obligatoires ARCOP 2024-2025 : 6 pièces administratives + offre technique + offre financière. Consultez le Guide de Soumission complet sur /guide-soumission pour tous les détails.`,
    _source: 'offline',
    _note: 'Analyse générée sans accès au document PDF. Pour une analyse IA complète du contenu du document, configurez GEMINI_API_KEY.',
  };
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
  contactAdresse: z.string().describe("Adresse physique de remise des plis (ou 'Non spécifié')"),
  garantieSubmission: z.string().describe("Montant et type de la garantie de soumission (ex: '500 000 FCFA - Caution bancaire' ou 'Non exigée')"),
  dureeValiditeGarantie: z.string().describe("Durée de validité de la garantie de soumission (ex: '90 jours' ou 'Non spécifié')"),
  conditionsParticipation: z.array(z.string()).describe("Conditions d'éligibilité et qualifications demandées"),
  piecesAdministratives: z.array(z.string()).describe("Pièces administratives exigées (RCCM, IFU, ASF, CNSS, AJE, DRTSS, CNF, casier judiciaire, agréments, déclaration sur l'honneur, etc.)"),
  piecesTechniques: z.array(z.string()).describe("Pièces techniques exigées (références, personnel, matériel, méthodologie, planning, organisation)"),
  piecesFinancieres: z.array(z.string()).describe("Pièces financières exigées (bordereau des prix, devis quantitatif, lettre de soumission, garanties)"),
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

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return Response.json(
      { error: 'Service indisponible (Firebase Admin SDK non configuré).' },
      { status: 503 }
    );
  }
  const marketRef = adminDb.collection('marches').doc(marketId);

  // Marché + choix du PDF
  let market;
  try {
    const snap = await marketRef.get();
    // Admin SDK : `exists` est une propriété, pas une méthode comme côté client.
    if (!snap.exists) return Response.json({ error: 'Marché introuvable' }, { status: 404 });
    market = { id: snap.id, ...snap.data() };
  } catch (e) {
    return Response.json({ error: 'Lecture du marché impossible' }, { status: 500 });
  }

  const chosenUrl = pdfUrl || market.documents?.[0]?.url;

  // HYBRID MODE: Try Gemini if available and URL exists
  if (apiKey && chosenUrl) {
    let pdfBytes;
    try {
      pdfBytes = await fetchPdfBytes(chosenUrl);
      
      const google = createGoogleGenerativeAI({ apiKey });
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: analysisSchema,
        system: BURKINA_SYSTEM_PROMPT_ANALYZE_MARKET,
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

      const analysis = { ...object, analyzedUrl: chosenUrl, analyzedAt: new Date().toISOString(), _source: 'gemini' };

      // Cache sur le marché (écriture serveur via l'Admin SDK)
      try {
        await marketRef.update({ aiAnalysis: analysis });
      } catch (e) {
        console.error('[analyze-market] écriture cache échouée:', e?.message);
      }

      return Response.json({ success: true, analysis });
    } catch (e) {
      console.error('[analyze-market] Gemini error:', e?.message);
      // Fall through to offline mode on Gemini failure
    }
  }

  // FALLBACK: Offline mode (no Gemini key, no PDF URL, or Gemini failed)
  console.log('[analyze-market] Basculement vers mode offline');
  const offlineAnalysis = generateOfflineMarketAnalysis(market, marketId);

  return Response.json({ 
    success: true, 
    analysis: offlineAnalysis,
    _fallback: true
  });
}
