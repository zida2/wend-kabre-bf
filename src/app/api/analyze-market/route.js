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

// Offline fallback: Generate market analysis from available market data
function generateOfflineMarketAnalysis(market, marketId) {
  console.log('[analyze-market] Utilisation de l\'analyse intelligente (données du marché)');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTION INTELLIGENTE DES DONNÉES RÉELLES DU MARCHÉ
  // ═══════════════════════════════════════════════════════════════════════════
  
  const description = market.description || '';
  const title = market.title || '';
  const source = market.source || '';
  const fullText = `${title} ${description} ${source}`.toLowerCase();
  
  // Budget
  const budget = market.montantEstime || market.montant 
    ? `${market.montantEstime || ((market.montant / 1000000).toFixed(0) + ' millions FCFA')}`
    : 'Non communiqué dans l\'avis';
  
  // Région (extraction intelligente)
  let region = market.region || 'Non spécifié';
  if (region === 'Non spécifié') {
    const regions = ['Kadiogo', 'Boucle du Mouhoun', 'Cascades', 'Centre', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest', 'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'];
    for (const r of regions) {
      if (fullText.includes(r.toLowerCase()) || source.includes(r)) {
        region = r;
        break;
      }
    }
  }
  
  // Commune
  let commune = 'Non spécifié';
  if (fullText.includes('ouagadougou') || source.includes('Ouagadougou')) commune = 'Ouagadougou';
  else if (fullText.includes('bobo-dioulasso') || source.includes('Bobo')) commune = 'Bobo-Dioulasso';
  else if (fullText.includes('koudougou')) commune = 'Koudougou';
  else if (fullText.includes('ouahigouya')) commune = 'Ouahigouya';
  
  // Type de procédure (extraction depuis procedure ou montant)
  let typeProcedure = market.procedure || 'Non spécifié';
  if (typeProcedure === 'Non spécifié') {
    if (market.montant >= 150000000) typeProcedure = 'Appel d\'offres ouvert international';
    else if (market.montant >= 50000000) typeProcedure = 'Appel d\'offres ouvert';
    else if (market.montant >= 10000000) typeProcedure = 'Appel d\'offres restreint';
    else typeProcedure = 'Demande de cotation';
  }
  
  // Dates
  const datePublication = market.publishedAt 
    ? new Date(market.publishedAt).toLocaleDateString('fr-FR')
    : 'Non spécifié';
  
  const dateLimite = market.dateLimite || market.deadline
    ? new Date(market.dateLimite || market.deadline).toLocaleDateString('fr-FR')
    : 'À consulter le document officiel';
  
  const heureLimite = market.heureLimite || (fullText.match(/(\d{1,2})[h:](\d{2})/)?.[0]) || '10h00 (standard)';
  
  // Durée d'exécution (extraction intelligente)
  let dureeExecution = market.dureeExecution || 'Non spécifié';
  if (dureeExecution === 'Non spécifié') {
    const dureMatch = description.match(/(\d+)\s*(mois|jours|semaines)/i);
    if (dureMatch) {
      dureeExecution = `${dureMatch[1]} ${dureMatch[2]}`;
    }
  }
  
  // Financement (extraction intelligente)
  let financement = market.financement || 'Non spécifié';
  if (financement === 'Non spécifié') {
    if (fullText.includes('budget national') || fullText.includes('état burkinabè')) {
      financement = 'Budget national du Burkina Faso';
    } else if (fullText.includes('banque mondiale') || fullText.includes('world bank')) {
      financement = 'Banque Mondiale';
    } else if (fullText.includes('bad') || fullText.includes('banque africaine')) {
      financement = 'Banque Africaine de Développement (BAD)';
    } else if (fullText.includes('ue') || fullText.includes('union européenne')) {
      financement = 'Union Européenne';
    } else if (fullText.includes('france') || fullText.includes('afd')) {
      financement = 'AFD / Coopération française';
    } else if (fullText.includes('pnud') || fullText.includes('nations unies')) {
      financement = 'PNUD / Nations Unies';
    }
  }
  
  // Autorité contractante
  const autoriteContractante = market.source || 'Autorité contractante du Burkina Faso';
  
  // Ministère (extraction intelligente)
  let ministere = market.ministere || 'Non spécifié';
  if (ministere === 'Non spécifié') {
    if (fullText.includes('santé')) ministere = 'Ministère de la Santé';
    else if (fullText.includes('éducation') || fullText.includes('education')) ministere = 'Ministère de l\'Éducation';
    else if (fullText.includes('infrastructure') || fullText.includes('travaux publics')) ministere = 'Ministère des Infrastructures';
    else if (fullText.includes('agriculture')) ministere = 'Ministère de l\'Agriculture';
    else if (fullText.includes('eau') || fullText.includes('assainissement')) ministere = 'Ministère de l\'Eau et de l\'Assainissement';
  }
  
  // Garantie de soumission (règles ARCOP)
  let garantieSubmission = market.garantieSubmission || 'Non spécifié';
  if (garantieSubmission === 'Non spécifié') {
    if (market.montant >= 10000000) {
      const pourcentage = market.montant >= 100000000 ? '1-2%' : '2-3%';
      garantieSubmission = `${pourcentage} du montant de l'offre - Caution bancaire ou chèque certifié`;
    } else {
      garantieSubmission = 'Non exigée (marché < 10 millions FCFA)';
    }
  }
  
  // Pièces spécifiques selon la catégorie
  let piecesAdministrativesBase = [
    'Attestation de situation fiscale (DGI) - validité < 3 mois',
    'Attestation de situation cotisante (CNSS) - validité < 3 mois',
    'Attestation de non engagement (ANE/AJE)',
    'RCCM (Registre du Commerce) - copie certifiée',
  ];
  
  let piecesTechniquesBase = [
    'Lettre de soumission signée et datée',
    'Présentation de l\'entreprise (historique, activités)',
    'Note de compréhension du projet et du contexte',
  ];
  
  let piecesFinancieresBase = [
    'Bordereau des prix unitaires (BPU)',
    'Devis quantitatif et estimatif (DQE)',
    'Montant total de l\'offre (en chiffres et en lettres)',
  ];
  
  // Adaptation selon la catégorie
  if (market.category === 'Construction' || market.category === 'BTP') {
    piecesAdministrativesBase.push('Agrément technique BTP (catégorie adaptée)');
    piecesTechniquesBase.push(
      'Planning détaillé d\'exécution (Gantt)',
      'Liste du matériel de chantier disponible',
      'Équipe technique (chef de chantier, conducteurs de travaux)',
      'Attestations de bonne exécution de marchés similaires'
    );
  } else if (market.category === 'Informatique' || title.includes('informatique') || title.includes('logiciel')) {
    piecesAdministrativesBase.push('Agrément ou certification informatique (si requis)');
    piecesTechniquesBase.push(
      'Architecture technique proposée',
      'CVs des développeurs/techniciens',
      'Planning de développement/déploiement',
      'Support et maintenance proposés'
    );
  } else if (market.category === 'Prestation' || market.category === 'Services') {
    piecesTechniquesBase.push(
      'Méthodologie détaillée d\'intervention',
      'CVs et diplômes de l\'équipe d\'experts',
      'Chronogramme des activités',
      'Livrables attendus à chaque étape'
    );
  } else if (market.category === 'Fourniture') {
    piecesTechniquesBase.push(
      'Fiches techniques des produits proposés',
      'Certificats de conformité (normes internationales)',
      'Conditions de livraison et de garantie',
      'Preuves de capacité d\'approvisionnement'
    );
  }
  
  // Conditions de participation (extraction intelligente)
  const conditionsParticipation = [
    'Être une personne physique ou morale légalement constituée',
    'Ne pas être en liquidation judiciaire ou en cessation d\'activité',
    'Situation fiscale à jour (DGI)',
    'Cotisations sociales à jour (CNSS)',
    'Ne pas avoir été sanctionné ou radié des marchés publics',
  ];
  
  if (market.category === 'Construction') {
    conditionsParticipation.push('Disposer d\'un agrément technique BTP valide');
  }
  
  if (market.montant >= 50000000) {
    conditionsParticipation.push('Chiffre d\'affaires moyen des 3 dernières années ≥ montant du marché');
    conditionsParticipation.push('Expérience sur au moins 2 marchés similaires');
  }
  
  // Critères de sélection
  const criteresSelection = [
    'Conformité administrative : dossier complet et pièces valides',
    'Score technique : 40-60 points (méthodologie, planning, équipe, références)',
    'Score financier : 40-60 points (offre la plus basse économiquement avantageuse)',
  ];
  
  if (fullText.includes('pme') || fullText.includes('préférence nationale')) {
    criteresSelection.push('Préférence nationale PME : +5 à +10% de bonification');
  }
  
  criteresSelection.push('Élimination des offres anormalement basses (< 15-20% de la moyenne)');
  
  // Risques de disqualification
  const risques = [
    '⚠️ Pièces administratives périmées (DGI/CNSS > 3 mois)',
    '⚠️ Caution de soumission manquante ou non conforme',
    '⚠️ Retard de dépôt même d\'1 minute = disqualification automatique',
    '⚠️ Dossier incomplet ou pièces manquantes',
    '⚠️ Erreurs arithmétiques dans l\'offre financière',
  ];
  
  if (market.category === 'Construction') {
    risques.push('⚠️ Agrément BTP inadapté ou expiré');
    risques.push('⚠️ Absence de planning réaliste d\'exécution');
  }
  
  if (market.montant >= 50000000) {
    risques.push('⚠️ Chiffre d\'affaires insuffisant par rapport au montant');
    risques.push('⚠️ Manque de références de marchés similaires');
  }
  
  risques.push('⚠️ Offre anormalement basse (pénalité de 30-40%)');
  risques.push('⚠️ Non-respect des spécifications techniques');
  
  // Contacts (extraction intelligente)
  const emailMatch = fullText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  const contactEmail = emailMatch ? emailMatch[0] : 'Voir le document officiel';
  
  const telMatch = fullText.match(/(\+226\s?)?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/);
  const contactTelephone = telMatch ? telMatch[0] : 'Voir le document officiel';
  
  const contactAdresse = market.contactAdresse || (source.includes('Ouagadougou') ? 'Ouagadougou' : 'Voir le document officiel');
  
  // Résumé intelligent
  const urgenceInfo = market.urgence === 'Urgent' ? ' ⚠️ Date limite PROCHE !' : '';
  const resume = `Marché ${market.category || 'public'} au Burkina Faso : ${title}.${urgenceInfo} Autorité contractante : ${autoriteContractante}. Budget estimatif : ${budget}. Procédure : ${typeProcedure}. Date limite de dépôt : ${dateLimite} à ${heureLimite}. Région : ${region}. Documents obligatoires ARCOP 2024-2025 : ${piecesAdministrativesBase.length} pièces administratives + offre technique + offre financière détaillée. ${market.montant >= 10000000 ? 'Caution de soumission exigée.' : ''} Consultez le document officiel complet pour les spécifications techniques précises.`;
  
  return {
    numeroMarche: marketId || 'Non spécifié',
    objet: title,
    autoriteContractante,
    ministere,
    region,
    commune,
    budget,
    financement,
    typeProcedure,
    datePublication,
    dateLimite,
    heureLimite,
    dureeExecution,
    lieuExecution: region !== 'Non spécifié' ? region : commune,
    contactEmail,
    contactTelephone,
    contactAdresse,
    garantieSubmission,
    dureeValiditeGarantie: '90 jours (standard ARCOP)',
    conditionsParticipation,
    piecesAdministratives: piecesAdministrativesBase,
    piecesTechniques: piecesTechniquesBase,
    piecesFinancieres: piecesFinancieresBase,
    criteresSelection,
    risques,
    resume,
    _source: 'intelligent_extraction',
    _note: 'Analyse générée à partir des données disponibles du marché. Pour une analyse IA complète du document PDF officiel, configurez GEMINI_API_KEY.',
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
