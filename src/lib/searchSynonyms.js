// ─────────────────────────────────────────────────────────────────────
// Recherche sémantique « sans IA » par dictionnaire de synonymes (§6).
//   expandQuery(query) → liste dédupliquée de termes liés (normalisés,
//   minuscules, sans accents), incluant toujours les mots d'origine.
//   Pensé pour le vocabulaire des marchés publics burkinabè.
// ─────────────────────────────────────────────────────────────────────

// Normalisation : minuscule, sans accents, espaces compactés.
export const normalize = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// ── Dictionnaire de synonymes (clés et valeurs déjà normalisées) ──
// Chaque clé (mot-déclencheur) renvoie un ensemble de termes liés.
const SYNONYMS = {
  ecole: ['ecole', 'scolaire', 'education', 'enseignement', 'lycee', 'college', 'classe', 'batiment scolaire', 'csps', 'primaire', 'secondaire', 'universite', 'alphabetisation', 'salle de classe'],
  education: ['education', 'enseignement', 'ecole', 'scolaire', 'lycee', 'college', 'formation', 'universite', 'alphabetisation'],
  construction: ['construction', 'batiment', 'travaux', 'genie civil', 'rehabilitation', 'amenagement', 'btp', 'edifice', 'ouvrage', 'infrastructure', 'maconnerie'],
  batiment: ['batiment', 'construction', 'travaux', 'genie civil', 'rehabilitation', 'edifice', 'btp'],
  travaux: ['travaux', 'construction', 'chantier', 'genie civil', 'rehabilitation', 'amenagement', 'btp'],
  route: ['route', 'voirie', 'piste', 'pont', 'bitume', 'infrastructure routiere', 'chaussee', 'goudron', 'pavage', 'terrassement'],
  pont: ['pont', 'ouvrage', 'franchissement', 'dalot', 'infrastructure routiere'],
  eau: ['eau', 'forage', 'adduction', 'hydraulique', 'assainissement', 'latrine', 'puits', 'aep', 'potable', 'pompe', 'chateau d\'eau', 'borne fontaine'],
  forage: ['forage', 'eau', 'puits', 'hydraulique', 'adduction', 'pompe', 'aep'],
  assainissement: ['assainissement', 'latrine', 'eau', 'hydraulique', 'hygiene', 'drainage', 'egout'],
  informatique: ['informatique', 'numerique', 'logiciel', 'ordinateur', 'serveur', 'reseau', 'materiel informatique', 'telecom', 'digital', 'imprimante', 'systeme', 'application', 'internet'],
  numerique: ['numerique', 'informatique', 'digital', 'logiciel', 'internet', 'telecom', 'dematerialisation'],
  sante: ['sante', 'medical', 'hopital', 'csps', 'district sanitaire', 'medicament', 'dispensaire', 'maternite', 'soins', 'clinique', 'pharmacie', 'csps', 'centre de sante'],
  medical: ['medical', 'sante', 'hopital', 'medicament', 'soins', 'clinique', 'equipement medical'],
  electricite: ['electricite', 'solaire', 'energie', 'photovoltaique', 'reseau electrique', 'lampadaire', 'groupe electrogene', 'kit solaire', 'eclairage'],
  energie: ['energie', 'electricite', 'solaire', 'photovoltaique', 'reseau electrique', 'kit solaire', 'panneau solaire'],
  solaire: ['solaire', 'photovoltaique', 'kit solaire', 'panneau solaire', 'energie', 'electricite'],
  fourniture: ['fourniture', 'acquisition', 'materiel', 'equipement', 'livraison', 'approvisionnement', 'achat', 'consommable'],
  acquisition: ['acquisition', 'fourniture', 'achat', 'materiel', 'equipement', 'livraison'],
  equipement: ['equipement', 'materiel', 'fourniture', 'acquisition', 'mobilier', 'appareil'],
  formation: ['formation', 'recrutement', 'emploi', 'stage', 'consultant', 'renforcement de capacites', 'atelier', 'seminaire'],
  recrutement: ['recrutement', 'formation', 'emploi', 'stage', 'consultant', 'poste', 'candidature', 'personnel', 'agent'],
  emploi: ['emploi', 'recrutement', 'poste', 'travail', 'candidature', 'stage'],
  consultant: ['consultant', 'cabinet', 'bureau d\'etudes', 'prestataire', 'expert', 'consultation', 'etude'],
  etude: ['etude', 'consultant', 'cabinet', 'bureau d\'etudes', 'evaluation', 'faisabilite', 'diagnostic', 'expertise'],
  audit: ['audit', 'controle', 'verification', 'evaluation', 'inspection', 'comptable', 'financier'],
  agriculture: ['agriculture', 'agricole', 'semence', 'intrant', 'engrais', 'elevage', 'pastoral', 'irrigation', 'maraichage', 'rural'],
  elevage: ['elevage', 'pastoral', 'betail', 'animaux', 'veterinaire', 'agriculture'],
  transport: ['transport', 'vehicule', 'voiture', 'moto', 'camion', 'carburant', 'logistique', 'engin'],
  vehicule: ['vehicule', 'voiture', 'transport', 'moto', 'camion', 'engin', 'automobile'],
  securite: ['securite', 'gardiennage', 'surveillance', 'police', 'gendarmerie', 'protection', 'cloture'],
  nettoyage: ['nettoyage', 'entretien', 'proprete', 'gardiennage', 'menage'],
  mobilier: ['mobilier', 'meuble', 'table', 'chaise', 'bureau', 'equipement', 'fourniture'],
  alimentaire: ['alimentaire', 'vivres', 'nourriture', 'denrees', 'cantine', 'ration', 'riz', 'cereales'],
};

// Petite indexation inverse : chaque terme d'un groupe déclenche le groupe.
// Permet de retrouver la « famille » quel que soit le mot saisi.
const TERM_TO_GROUPS = (() => {
  const map = new Map();
  for (const terms of Object.values(SYNONYMS)) {
    for (const term of terms) {
      if (!map.has(term)) map.set(term, new Set());
      // On associe ce terme à tous les termes du groupe.
      terms.forEach((t) => map.get(term).add(t));
    }
  }
  // On ajoute aussi les clés explicites.
  for (const [key, terms] of Object.entries(SYNONYMS)) {
    if (!map.has(key)) map.set(key, new Set());
    terms.forEach((t) => map.get(key).add(t));
  }
  return map;
})();

// ── Expansion sémantique d'une requête ──
// Retourne toujours au minimum les mots d'origine (normalisés).
export function expandQuery(query) {
  const nq = normalize(query);
  if (!nq) return [];

  const result = new Set();

  // 1) La requête complète telle quelle (utile pour les expressions).
  result.add(nq);

  // 2) Correspondance directe de la requête entière dans le dico.
  if (TERM_TO_GROUPS.has(nq)) {
    TERM_TO_GROUPS.get(nq).forEach((t) => result.add(t));
  }

  // 3) Découpage en mots (on coupe aussi sur l'élision : d', l', qu'…).
  //    Chaque mot ajoute ses synonymes s'il en a.
  const words = nq.split(/[\s']+/).filter((w) => w.length > 1);
  for (const word of words) {
    result.add(word);
    if (TERM_TO_GROUPS.has(word)) {
      TERM_TO_GROUPS.get(word).forEach((t) => result.add(t));
    }
  }

  return Array.from(result);
}

export default expandQuery;
