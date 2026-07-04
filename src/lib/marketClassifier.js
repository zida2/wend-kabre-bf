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

// ── Vocabulaire « vrai marché public » ──
const TENDER_VOCAB = [
  'appel d\'offres', 'appel d offres', 'demande de cotation', 'demande de prix',
  'demande de proposition', 'manifestation d\'interet', 'manifestation d interet',
  'avis d\'appel', 'avis de recrutement', 'avis a manifestation', 'consultation restreinte',
  'dossier d\'appel', 'autorite contractante', 'soumission', 'cahier des charges',
  'dao', 'appel a candidature', 'avis general de passation', 'passation de marche',
  'ouverture des plis', 'caution', 'attributaire', 'marche public',
];

// ── Vocabulaire à exclure (bruit : pas un marché) ──
const EXCLUDE_VOCAB = [
  'nomination', 'nomme', 'decret n', 'arrete n', 'communique', 'communique de presse',
  'felicitation', 'deces', 'condoleance', 'necrologie', 'in memoriam',
  'compte rendu du conseil', 'conseil des ministres', 'remaniement', 'discours',
  'ceremonie', 'inauguration', 'visite officielle', 'declaration de politique',
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

// ── Détection « vrai marché public » ──
export function isRealTender(title, description, source) {
  const t = norm(`${title} ${description}`);
  const src = norm(source);
  // Sources déjà spécialisées marchés/emploi → on garde par défaut.
  const trustedSource = /arcop|dgcmef|reliefweb/.test(src);
  const hasTenderVocab = TENDER_VOCAB.some((v) => t.includes(norm(v)));
  const hasExclude = EXCLUDE_VOCAB.some((v) => t.includes(norm(v)));
  // Rejet clair : bruit sans aucun vocabulaire de marché.
  if (hasExclude && !hasTenderVocab) return false;
  if (trustedSource) return true;
  return hasTenderVocab;
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
