// ─────────────────────────────────────────────────────────────────────
// Classification & détection intelligente des marchés publics (§5).
// 100% règles (aucune dépendance, aucun coût) — appliqué au scraping.
//   - isRealTender  : distingue un vrai marché public du bruit
//   - classifyMarket: région, commune, ministère, procédure, montant,
//                     urgence, secteur
//   - detectRelation: additif / rectificatif / report / annulation
//   - normalizeTitle: pour la détection de doublons
// ─────────────────────────────────────────────────────────────────────

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/\s+/g, ' ')
    .trim();

// ── Régions du Burkina Faso ──
const REGIONS = [
  'boucle du mouhoun', 'cascades', 'centre-est', 'centre-nord', 'centre-ouest',
  'centre-sud', 'centre', 'est', 'hauts-bassins', 'nord', 'plateau-central',
  'plateau central', 'sahel', 'sud-ouest',
];

// ── Communes / villes principales → région ──
const COMMUNES = {
  ouagadougou: 'Centre', bobo: 'Hauts-Bassins', 'bobo-dioulasso': 'Hauts-Bassins',
  koudougou: 'Centre-Ouest', ouahigouya: 'Nord', banfora: 'Cascades',
  kaya: 'Centre-Nord', tenkodogo: 'Centre-Est', 'fada': "Est", "fada n'gourma": 'Est',
  dedougou: 'Boucle du Mouhoun', dori: 'Sahel', gaoua: 'Sud-Ouest',
  ziniare: 'Plateau-Central', manga: 'Centre-Sud', 'po': 'Centre-Sud',
  dedougou2: 'Boucle du Mouhoun', koupela: 'Centre-Est', reo: 'Centre-Ouest',
  boulsa: 'Centre-Nord', djibo: 'Sahel', gorom: 'Sahel', titao: 'Nord',
  yako: 'Nord', kombissiri: 'Centre-Sud', zorgho: 'Plateau-Central',
  houndé: 'Hauts-Bassins', hounde: 'Hauts-Bassins', orodara: 'Hauts-Bassins',
  diebougou: 'Sud-Ouest', batie: 'Sud-Ouest', sindou: 'Cascades', solenzo: 'Boucle du Mouhoun',
  nouna: 'Boucle du Mouhoun', toma: 'Boucle du Mouhoun', bogande: 'Est', diapaga: 'Est',
  pama: 'Est', bousse: 'Plateau-Central', sapouy: 'Centre-Ouest', leo: 'Centre-Ouest',
};

// ── Ministères (mots-clés → libellé) ──
const MINISTERES = [
  [/\bsante\b|hopital|chr|csps|cm-|district sanitaire|medic/, 'Ministère de la Santé'],
  [/education|enseignement|scolaire|ecole|lycee|college|universit|alphabet/, 'Ministère de l\'Éducation'],
  [/infrastructur|route|voirie|pont|batiment|construction|travaux publics|btp/, 'Ministère des Infrastructures'],
  [/agricultur|hydraulique agricole|semence|elevage|pastoral|peche/, 'Ministère de l\'Agriculture'],
  [/\beau\b|assainissement|forage|adduction|hydraulique|latrine/, 'Ministère de l\'Eau et de l\'Assainissement'],
  [/energie|electricit|solaire|photovolta|reseau electrique/, 'Ministère de l\'Énergie'],
  [/defense|militaire|arme|caserne/, 'Ministère de la Défense'],
  [/securit|police|gendarmerie|douane/, 'Ministère de la Sécurité'],
  [/finance|budget|tresor|impot|fiscal|economie/, 'Ministère de l\'Économie et des Finances'],
  [/justice|tribunal|penitentiaire|prison/, 'Ministère de la Justice'],
  [/environnement|foret|faune|climat|assainissement urbain/, 'Ministère de l\'Environnement'],
  [/transport|aeroport|aerien|ferroviaire|routier/, 'Ministère des Transports'],
  [/habitat|urbanisme|logement|foncier/, 'Ministère de l\'Urbanisme et de l\'Habitat'],
  [/fonction publique|travail|emploi/, 'Ministère de la Fonction publique'],
  [/jeunesse|sport|loisir/, 'Ministère de la Jeunesse et des Sports'],
  [/femme|genre|solidarite|social|humanitaire|action sociale/, 'Ministère de l\'Action sociale'],
  [/culture|tourisme|art\b/, 'Ministère de la Culture et du Tourisme'],
  [/commerce|industrie|artisanat|mine/, 'Ministère du Commerce et de l\'Industrie'],
  [/communication|numerique|telecom|digital|informatique d\'etat/, 'Ministère de la Transition numérique'],
];

// ── Vocabulaire « vrai marché public » (strict) ──
const TENDER_VOCAB = [
  'appel d\'offres', 'appel d offres', 'demande de cotation', 'demande de prix',
  'demande de proposition', 'manifestation d\'interet', 'manifestation d interet',
  'avis d\'appel', 'avis de recrutement', 'avis a manifestation', 'consultation restreinte',
  'dossier d\'appel', 'autorite contractante', 'soumission', 'cahier des charges',
  'dao', 'appel a candidature', 'avis general de passation', 'passation de marche',
  'ouverture des plis', 'caution', 'attributaire', 'marche public', 'acquisition de',
  'fourniture de', 'prestation de service', 'travaux de construction', 'recrutement',
];

// ── Vocabulaire à exclure ABSOLUMENT (bruit : pas un marché) ──
const EXCLUDE_VOCAB = [
  'nomination', 'nomme', 'decret n', 'arrete n', 'communique', 'communique de presse',
  'felicitation', 'deces', 'condoleance', 'necrologie', 'in memoriam',
  'compte rendu du conseil', 'conseil des ministres', 'remaniement', 'discours',
  'ceremonie', 'inauguration', 'visite officielle', 'declaration de politique',
  'soutenance', 'these', 'memoire', 'master', 'doctorat', 'diplome', 'formation academique',
  'universite', 'etudiant', 'recherche academique', 'publication', 'article scientifique',
  'conference', 'seminaire', 'atelier de formation', 'session de formation',
  'actualite', 'nouvelle', 'information', 'breve', 'flash info', 'mise a jour',
  'analyse', 'etude de cas', 'rapport d\'etude', 'evaluation', 'bilan',
];

// ── Indicateurs forts de NON-marché ──
const ACADEMIC_INDICATORS = [
  'soutenance de', 'memoire de', 'these de', 'master en', 'doctorat en',
  'recherche sur', 'analyse des', 'etude des pratiques', 'evaluation de',
  'universite', 'faculte', 'institut', 'ecole superieure', 'campus',
  'article de', 'publication de', 'revue scientifique',
];

// ── Indicateurs forts de marché public ──
const STRONG_TENDER_INDICATORS = [
  'appel d\'offres', 'demande de cotation', 'avis de recrutement',
  'acquisition de', 'fourniture de', 'prestation de service',
  'travaux de construction', 'marche public', 'dao',
  'autorite contractante', 'soumission', 'caution',
  'ouverture des plis', 'date limite', 'depot des offres',
];

// ── Types de procédure ──
function detectProcedure(text) {
  const t = norm(text);
  if (/manifestation d.?interet|avis a manifestation|sollicitation de manifestation/.test(t)) return "Manifestation d'intérêt";
  if (/demande de prix|demande de cotation/.test(t)) return 'Demande de prix / cotation';
  if (/consultation restreinte|liste restreinte/.test(t)) return 'Consultation restreinte';
  if (/demande de proposition|request for proposal|\brfp\b/.test(t)) return 'Demande de propositions';
  if (/appel d.?offres? restreint/.test(t)) return "Appel d'offres restreint";
  if (/appel d.?offres?|avis d.?appel|dao\b/.test(t)) return "Appel d'offres ouvert";
  if (/recrutement|avis de recrutement/.test(t)) return 'Recrutement';
  return 'Non spécifié';
}

function detectRegion(text) {
  const t = norm(text);
  for (const r of REGIONS) {
    if (t.includes(r)) {
      // remet une casse propre
      return r.split(/[- ]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(t.includes('-') ? '-' : ' ');
    }
  }
  // via commune
  for (const [c, region] of Object.entries(COMMUNES)) {
    if (/^\w+2$/.test(c)) continue;
    if (new RegExp(`\\b${c.replace(/[^a-z' -]/g, '')}\\b`).test(t)) return region;
  }
  return 'Non spécifié';
}

function detectCommune(text) {
  const t = norm(text);
  for (const c of Object.keys(COMMUNES)) {
    if (/^\w+2$/.test(c)) continue;
    if (new RegExp(`\\b${c.replace(/[^a-z' -]/g, '')}\\b`).test(t)) {
      return c.split(/[- ]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
    }
  }
  return 'Non spécifié';
}

function detectMinistere(text) {
  const t = norm(text);
  for (const [re, label] of MINISTERES) {
    if (re.test(t)) return label;
  }
  return 'Non spécifié';
}

// ── Montant estimatif (FCFA) ──
function extractMontant(text) {
  if (!text) return 'Non communiqué';
  const t = text.replace(/ /g, ' ');
  // "12 000 000 FCFA", "12.000.000 F CFA", "1 200 000 000 francs"
  const m = t.match(/(\d[\d . ]{4,})\s*(?:f\s?cfa|fcfa|francs?\b|f\b)/i);
  if (m) {
    const digits = m[1].replace(/[ . ]/g, '');
    const n = parseInt(digits, 10);
    if (!isNaN(n) && n >= 10000) return `${n.toLocaleString('fr-FR')} FCFA`;
  }
  // "X millions"
  const mm = t.match(/(\d+(?:[.,]\d+)?)\s*millions?\s*(?:de\s*)?(?:f\s?cfa|fcfa|francs?)/i);
  if (mm) return `${mm[1]} million(s) FCFA`;
  return 'Non communiqué';
}

// ── Urgence selon la date limite ──
function detectUrgence(deadline) {
  if (!deadline) return 'Non datée';
  const t = new Date(deadline).getTime();
  if (isNaN(t)) return 'Non datée';
  const days = (t - Date.now()) / (24 * 60 * 60 * 1000);
  if (days < 0) return 'Clôturé';
  if (days <= 7) return 'Urgent';
  if (days <= 15) return 'Bientôt';
  return 'Normal';
}

// ── Secteur économique (à partir de la catégorie/texte) ──
function detectSecteur(category, text) {
  const c = norm(category);
  if (c === 'recrutement') return 'Emploi & Formation';
  if (c === 'informatique') return 'Informatique & Télécoms';
  if (c === 'construction') return 'BTP & Infrastructures';
  if (c === 'fourniture') return 'Fournitures & Équipements';
  if (c === 'prestation') return 'Services & Conseil';
  const t = norm(text);
  if (/logiciel|serveur|reseau|informatique|numerique/.test(t)) return 'Informatique & Télécoms';
  if (/construction|batiment|route|forage|travaux/.test(t)) return 'BTP & Infrastructures';
  if (/fourniture|acquisition|materiel|equipement/.test(t)) return 'Fournitures & Équipements';
  return 'Services & Conseil';
}

// ── Détection additif / rectificatif / report / annulation ──
export function detectRelation(title) {
  const t = norm(title);
  if (/annulation|annule\b/.test(t)) return 'annulation';
  if (/report|prorogation|proroge|prolongation|report de date/.test(t)) return 'report';
  if (/additif|complement/.test(t)) return 'additif';
  if (/rectificatif|rectification|erratum|modificatif|modification/.test(t)) return 'rectificatif';
  return null;
}

// ── Titre normalisé (dédoublonnage tolérant) ──
export function normalizeTitle(title) {
  return norm(title)
    .replace(/\b(additif|rectificatif|erratum|report|prorogation|annulation|modificatif|complement)\b/g, '')
    .replace(/\bn[°o]\s*\d+[-\/\d]*/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

// ── Détection « vrai marché public » (VERSION ROBUSTE À 3 NIVEAUX) ──
export function isRealTender(title, description, source) {
  const fullText = `${title} ${description}`.toLowerCase();
  const t = norm(fullText);
  const src = norm(source || '');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 1: ÉVALUATION DE LA SOURCE (confiance de base)
  // ═══════════════════════════════════════════════════════════════════════════
  let sourceConfidence = 0;
  const trustedSources = ['arcop', 'dgcmef', 'reliefweb', 'marches-publics'];
  const partiallyTrustedSources = ['ministere', 'gouvernement', 'administration'];
  
  if (trustedSources.some(ts => src.includes(ts))) {
    sourceConfidence = 0.8; // Source très fiable
  } else if (partiallyTrustedSources.some(pts => src.includes(pts))) {
    sourceConfidence = 0.5; // Source moyennement fiable
  } else {
    sourceConfidence = 0.2; // Source inconnue
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 2: INDICATEURS POSITIFS (preuves que c'est un marché)
  // ═══════════════════════════════════════════════════════════════════════════
  let positiveScore = 0;
  const maxPositiveScore = 10;
  
  // Indicateurs forts (+3 points chacun)
  const strongIndicators = [
    'appel d\'offres', 'demande de cotation', 'avis de recrutement',
    'dao', 'manifestation d\'interet', 'passation de marche'
  ];
  strongIndicators.forEach(indicator => {
    if (t.includes(norm(indicator))) positiveScore += 3;
  });
  
  // Indicateurs moyens (+2 points chacun)
  const mediumIndicators = [
    'acquisition de', 'fourniture de', 'prestation de service',
    'travaux de construction', 'marche public', 'autorite contractante'
  ];
  mediumIndicators.forEach(indicator => {
    if (t.includes(norm(indicator))) positiveScore += 2;
  });
  
  // Indicateurs faibles (+1 point chacun)
  const weakIndicators = [
    'soumission', 'caution', 'ouverture des plis', 'date limite',
    'depot des offres', 'candidature', 'cahier des charges'
  ];
  weakIndicators.forEach(indicator => {
    if (t.includes(norm(indicator))) positiveScore += 1;
  });
  
  // Plafonner le score positif
  positiveScore = Math.min(positiveScore, maxPositiveScore);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEAU 3: INDICATEURS NÉGATIFS (preuves que ce N'EST PAS un marché)
  // ═══════════════════════════════════════════════════════════════════════════
  let negativeScore = 0;
  const maxNegativeScore = 10;
  
  // Exclusions académiques fortes (-4 points chacune)
  const academicExclusions = [
    'soutenance de', 'memoire de', 'these de', 'master en',
    'doctorat en', 'recherche sur', 'universite', 'faculte'
  ];
  academicExclusions.forEach(exclusion => {
    if (t.includes(norm(exclusion))) negativeScore += 4;
  });
  
  // Exclusions administratives (-3 points chacune)
  const adminExclusions = [
    'nomination', 'nomme', 'decret n', 'arrete n',
    'communique de presse', 'conseil des ministres'
  ];
  adminExclusions.forEach(exclusion => {
    if (t.includes(norm(exclusion))) negativeScore += 3;
  });
  
  // Exclusions actualités (-2 points chacune)
  const newsExclusions = [
    'actualite', 'nouvelle', 'information', 'breve',
    'mise a jour', 'flash info', 'conference de presse'
  ];
  newsExclusions.forEach(exclusion => {
    if (t.includes(norm(exclusion))) negativeScore += 2;
  });
  
  // Exclusions événements (-2 points chacune)
  const eventExclusions = [
    'ceremonie', 'inauguration', 'visite officielle',
    'seminaire', 'atelier de formation', 'session de formation'
  ];
  eventExclusions.forEach(exclusion => {
    if (t.includes(norm(exclusion))) negativeScore += 2;
  });
  
  // Plafonner le score négatif
  negativeScore = Math.min(negativeScore, maxNegativeScore);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL DU SCORE FINAL ET DÉCISION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Score final = (source * 0.3) + (positifs * 0.4) - (négatifs * 0.6)
  // Les négatifs ont plus de poids pour éviter les faux positifs
  const finalScore = (sourceConfidence * 3) + (positiveScore * 0.4) - (negativeScore * 0.6);
  
  // Seuils de décision
  const ACCEPT_THRESHOLD = 2.5;
  const REJECT_THRESHOLD = 0.5;
  
  let decision = 'unknown';
  let confidence = 0;
  let reasons = [];
  
  if (finalScore >= ACCEPT_THRESHOLD) {
    decision = 'accept';
    confidence = Math.min(finalScore / 5, 1); // Normaliser sur [0,1]
    
    // Identifier les raisons principales de l'acceptation
    if (positiveScore >= 6) reasons.push('strong_market_indicators');
    if (sourceConfidence >= 0.8) reasons.push('trusted_source');
    if (negativeScore === 0) reasons.push('no_exclusion_flags');
    
    console.log(`[ACCEPT] ${title} - Score: ${finalScore.toFixed(2)} (${Math.round(confidence*100)}% confiance)`);
    return true;
    
  } else if (finalScore <= REJECT_THRESHOLD) {
    decision = 'reject';
    confidence = Math.min(Math.abs(finalScore) / 2, 1);
    
    // Identifier les raisons principales du rejet
    if (negativeScore >= 4) reasons.push('strong_exclusion_indicators');
    if (positiveScore === 0) reasons.push('no_market_indicators');
    if (sourceConfidence <= 0.2) reasons.push('untrusted_source');
    
    console.log(`[REJECT] ${title} - Score: ${finalScore.toFixed(2)} (${Math.round(confidence*100)}% confiance)`, {
      negativeScore,
      positiveScore,
      sourceConfidence,
      reasons
    });
    return false;
    
  } else {
    // Zone grise - nécessite une vérification manuelle ou des règles plus fines
    decision = 'review';
    confidence = 0.3;
    reasons = ['ambiguous_content'];
    
    console.log(`[REVIEW NEEDED] ${title} - Score: ${finalScore.toFixed(2)} (contenu ambigu)`, {
      negativeScore,
      positiveScore,
      sourceConfidence,
      suggestion: 'manual_review_recommended'
    });
    
    // Pour l'instant, on accepte avec réserve les contenus ambigus des sources fiables
    return sourceConfidence >= 0.5;
  }
}

// ── Classification complète d'un marché ──
export function classifyMarket({ title = '', description = '', category = '', deadline = null } = {}) {
  const text = `${title}\n${description}`;
  return {
    procedure: detectProcedure(text),
    region: detectRegion(text),
    commune: detectCommune(text),
    ministere: detectMinistere(text),
    montantEstime: extractMontant(text),
    urgence: detectUrgence(deadline),
    secteur: detectSecteur(category, text),
    relation: detectRelation(title),
    normalizedTitle: normalizeTitle(title),
  };
}
