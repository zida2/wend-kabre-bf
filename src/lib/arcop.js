/**
 * Référentiel de la commande publique burkinabè — cadre 2024.
 *
 * SOURCES
 *   • Loi n°005-2024/ALT du 20 avril 2024 portant règlementation générale
 *     de la commande publique au Burkina Faso.
 *   • Décret n°2024-1748 portant procédures de passation, d'exécution et de
 *     règlement des marchés publics (texte d'application de la loi 005-2024).
 *     Ces textes remplacent le décret n°2017-049 depuis le 1er janvier 2024.
 *
 * Chaque donnée porte l'article qui la fonde. Les éléments non encore vérifiés
 * dans les textes 2024 sont marqués `aVerifier: true` — ils viennent du Guide
 * du soumissionnaire ARCOP de décembre 2018, antérieur à la réforme, et ne
 * doivent pas être présentés à l'utilisateur comme du droit en vigueur.
 *
 * Ce module est la source unique : le guide de soumission, le tracker de
 * dossier et le générateur de documents le lisent tous. Ne pas dupliquer ces
 * listes ailleurs.
 */

// ─── Natures de prestations ────────────────────────────────────────────────
export const NATURES = {
  TRAVAUX: 'Travaux',
  FOURNITURES: 'Fournitures',
  SERVICES_COURANTS: 'Services courants',
  PRESTATIONS_INTELLECTUELLES: 'Prestations intellectuelles',
};

/**
 * Catégories d'autorités contractantes retenues par l'article 6 pour fixer
 * les seuils. Le décret les distingue par leurs montants, pas par un nom :
 * ces clés sont une commodité de code.
 */
export const AUTORITES = {
  EPE_CT: {
    label: 'Établissement public de l\'État ou collectivité territoriale',
    detail: 'Collectivités territoriales autres que celles à statut particulier',
  },
  ETAT: {
    label: 'Ministère, institution ou organisme public',
    detail: 'Ministères, institutions, autorités administratives indépendantes, collectivités à statut particulier, autres organismes publics',
  },
  SOCIETE_ETAT: {
    label: 'Société d\'État',
    detail: 'Sociétés d\'État',
  },
};

const M = 1_000_000;

// ─── Procédures de passation ───────────────────────────────────────────────
export const PROCEDURES = {
  COTATION_NON_FORMELLE: {
    id: 'COTATION_NON_FORMELLE',
    label: 'Demande de cotations non formelle',
    article: 'Art. 6.1',
  },
  COTATION_FORMELLE: {
    id: 'COTATION_FORMELLE',
    label: 'Demande de cotations formelle',
    article: 'Art. 6.1',
  },
  DEMANDE_DE_PRIX: {
    id: 'DEMANDE_DE_PRIX',
    label: 'Demande de prix',
    article: 'Art. 6.2',
  },
  APPEL_OFFRES: {
    id: 'APPEL_OFFRES',
    label: 'Appel d\'offres',
    article: 'Art. 6.3',
  },
  CONSULTATION_CONSULTANTS: {
    id: 'CONSULTATION_CONSULTANTS',
    label: 'Consultation de consultants',
    article: 'Art. 6.4',
  },
  DEMANDE_PROPOSITIONS_ALLEGEE: {
    id: 'DEMANDE_PROPOSITIONS_ALLEGEE',
    label: 'Demande de propositions allégée',
    article: 'Art. 6.5',
  },
  DEMANDE_PROPOSITIONS: {
    id: 'DEMANDE_PROPOSITIONS',
    label: 'Demande de propositions',
    article: 'Art. 6.6',
  },
};

/**
 * Seuils de l'article 6 du décret n°2024-1748, en FCFA TTC sur le montant
 * PRÉVISIONNEL du marché. `max` est une borne strictement supérieure.
 */
const SEUILS = {
  // Travaux, fournitures et services courants partagent la demande de cotations.
  COTATION: {
    EPE_CT: { min: 1 * M, max: 10 * M },
    ETAT: { min: 1 * M, max: 20 * M },
    SOCIETE_ETAT: { min: 1 * M, max: 20 * M },
  },
  DEMANDE_DE_PRIX: {
    TRAVAUX: {
      EPE_CT: { min: 10 * M, max: 150 * M },
      ETAT: { min: 20 * M, max: 150 * M },
      SOCIETE_ETAT: { min: 20 * M, max: 200 * M },
    },
    FOURNITURES_SERVICES: {
      EPE_CT: { min: 10 * M, max: 100 * M },
      ETAT: { min: 20 * M, max: 100 * M },
      SOCIETE_ETAT: { min: 20 * M, max: 150 * M },
    },
  },
  APPEL_OFFRES: {
    TRAVAUX: { EPE_CT: 150 * M, ETAT: 150 * M, SOCIETE_ETAT: 200 * M },
    FOURNITURES_SERVICES: { EPE_CT: 100 * M, ETAT: 100 * M, SOCIETE_ETAT: 150 * M },
  },
  // Prestations intellectuelles (art. 6.4 à 6.6)
  CONSULTATION_CONSULTANTS: { EPE_CT: 10 * M, ETAT: 20 * M, SOCIETE_ETAT: 20 * M },
  DEMANDE_PROPOSITIONS: 60 * M,
};

/**
 * Détermine la procédure applicable à un marché.
 *
 * Répond à la question que se pose une PME devant un avis : « est-ce que je
 * suis sur une demande de prix ou un appel d'offres, et donc quelles règles
 * s'appliquent à moi ? »
 *
 * @param {{nature: keyof typeof NATURES, montantTTC: number, autorite: keyof typeof AUTORITES}} params
 * @returns {{procedure: object, seuil: string}|null} null si les entrées sont inexploitables
 */
export function resolveProcedure({ nature, montantTTC, autorite = 'ETAT' }) {
  const montant = Number(montantTTC);
  if (!nature || !NATURES[nature] || !Number.isFinite(montant) || montant < 0) return null;
  if (!AUTORITES[autorite]) return null;

  if (nature === 'PRESTATIONS_INTELLECTUELLES') {
    const plafondConsultation = SEUILS.CONSULTATION_CONSULTANTS[autorite];
    if (montant < plafondConsultation) {
      return { procedure: PROCEDURES.CONSULTATION_CONSULTANTS, seuil: `< ${fmt(plafondConsultation)}` };
    }
    if (montant < SEUILS.DEMANDE_PROPOSITIONS) {
      return {
        procedure: PROCEDURES.DEMANDE_PROPOSITIONS_ALLEGEE,
        seuil: `${fmt(plafondConsultation)} à < ${fmt(SEUILS.DEMANDE_PROPOSITIONS)}`,
      };
    }
    return { procedure: PROCEDURES.DEMANDE_PROPOSITIONS, seuil: `≥ ${fmt(SEUILS.DEMANDE_PROPOSITIONS)}` };
  }

  const famille = nature === 'TRAVAUX' ? 'TRAVAUX' : 'FOURNITURES_SERVICES';

  const cotation = SEUILS.COTATION[autorite];
  if (montant < cotation.min) {
    return { procedure: PROCEDURES.COTATION_NON_FORMELLE, seuil: `< ${fmt(cotation.min)}` };
  }
  if (montant < cotation.max) {
    return {
      procedure: PROCEDURES.COTATION_FORMELLE,
      seuil: `${fmt(cotation.min)} à < ${fmt(cotation.max)}`,
    };
  }

  const dp = SEUILS.DEMANDE_DE_PRIX[famille][autorite];
  if (montant >= dp.min && montant < dp.max) {
    return { procedure: PROCEDURES.DEMANDE_DE_PRIX, seuil: `${fmt(dp.min)} à < ${fmt(dp.max)}` };
  }

  const ao = SEUILS.APPEL_OFFRES[famille][autorite];
  if (montant >= ao) {
    return { procedure: PROCEDURES.APPEL_OFFRES, seuil: `≥ ${fmt(ao)}` };
  }

  // Zone entre le plafond de cotation et le plancher de demande de prix
  // (ex. société d'État, travaux, 15 M) : le décret ne nomme pas de procédure,
  // c'est au dossier d'appel à concurrence de trancher.
  return null;
}

function fmt(n) {
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

export function formatFCFA(n) {
  return fmt(n);
}

// ─── Garantie de soumission (art. 100) ─────────────────────────────────────
export const GARANTIE_SOUMISSION = {
  tauxMin: 0.01,
  tauxMax: 0.03,
  article: 'Art. 100 · arrêté n°2025/349',
  // Arrêté n°2025/349 du 28 juillet 2025, art. 2.
  obligatoirePour: ['TRAVAUX', 'FOURNITURES', 'SERVICES_COURANTS'],
  nonExigee:
    'Non requise pour les marchés de prestations intellectuelles ni pour les marchés passés suivant la procédure de demande de cotations.',
  // Art. 3 : la forme dépend du montant prévisionnel.
  formeSelonSeuil:
    'Au-dessus des seuils de l\'appel d\'offres, la garantie financière est obligatoire. En dessous, le soumissionnaire choisit entre déclaration de garantie et garantie financière. En cas d\'allotissement, le choix se fait lot par lot.',
  manquement:
    'Les soumissionnaires ayant manqué à leurs engagements de déclaration de garantie sont signalés à l\'ARCOP par la personne responsable de la commande publique (art. 5).',
  // Exigible « lorsque la nature des prestations le requiert » ; le montant
  // exact est fixé par l'autorité contractante et figure au dossier.
  formes: [
    'Garantie autonome',
    'Cautionnement d\'une banque',
    'Cautionnement d\'une institution de micro-finance agréée',
    'Cautionnement d\'une compagnie d\'assurance',
    'Cautionnement d\'un établissement financier',
    'Déclaration de garantie des soumissionnaires',
  ],
  restitution:
    'Restituée aux soumissionnaires non retenus dès la constitution du cautionnement définitif par le titulaire, ou à l\'expiration du délai de validité des offres.',
};

/** Fourchette indicative du montant de la garantie pour un marché donné. */
export function estimerGarantieSoumission(montantTTC) {
  const m = Number(montantTTC);
  if (!Number.isFinite(m) || m <= 0) return null;
  return {
    min: Math.round(m * GARANTIE_SOUMISSION.tauxMin),
    max: Math.round(m * GARANTIE_SOUMISSION.tauxMax),
  };
}

// ─── Règle des enveloppes (art. 101) ───────────────────────────────────────
/**
 * Changement majeur du cadre 2024 : l'offre tient dans UNE SEULE enveloppe,
 * sauf pour les marchés de prestations intellectuelles. La double enveloppe
 * « offre technique / offre financière » du régime antérieur ne s'applique
 * plus aux travaux, fournitures et services courants.
 */
export function regleEnveloppe(nature) {
  if (nature === 'PRESTATIONS_INTELLECTUELLES') {
    return {
      type: 'DOUBLE',
      article: 'Art. 101',
      resume: 'Deux enveloppes séparées et cachetées : proposition technique et proposition financière.',
      details: [
        'Enveloppe « PROPOSITION TECHNIQUE » : original et copies, cachetée.',
        'Enveloppe « PROPOSITION FINANCIÈRE » : original et copies, cachetée, suivie du nom de la mission.',
        'Mention « NE PAS OUVRIR EN MÊME TEMPS QUE LA PROPOSITION TECHNIQUE » sur l\'enveloppe financière.',
      ],
    };
  }
  return {
    type: 'UNIQUE',
    article: 'Art. 101',
    resume:
      'Une seule enveloppe contenant les renseignements de candidature, l\'offre technique et l\'offre financière.',
    details: [
      'L\'enveloppe ne porte QUE les mentions prévues par l\'appel à concurrence.',
      'La séparation technique / financière en deux plis ne s\'applique plus aux travaux, fournitures et services courants.',
    ],
  };
}

// ─── Ouverture des plis (art. 103) ─────────────────────────────────────────
export const OUVERTURE_PLIS = {
  article: 'Art. 103',
  regles: [
    'La séance d\'ouverture est publique : vous pouvez y assister ou vous y faire représenter.',
    'La date d\'ouverture et la date limite de dépôt coïncident ; l\'ouverture intervient immédiatement après l\'heure limite.',
    'Si le jour d\'ouverture est férié ou chômé, dépôt et ouverture sont reportés au jour ouvrable suivant, à la même heure.',
    'Les plis déposés hors délai sont constatés et consignés au procès-verbal.',
  ],
};

// ─── Sincérité des pièces (art. 102) ───────────────────────────────────────
export const SINCERITE = {
  article: 'Art. 102',
  regle:
    'Vous devez vous assurer de la sincérité de toutes les pièces de votre offre (garanties financières, pièces administratives, personnel, matériel, références, capacités financières). La non-sincérité de l\'une d\'elles entraîne le rejet de l\'offre, sans préjudice des sanctions.',
};

// ─── Pièces administratives ────────────────────────────────────────────────
/**
 * Liste officielle fixée par l'arrêté n°2025/323 du 9 juillet 2025 (art. 2),
 * pris en application de l'article 109 du décret n°2024-1748.
 *
 * S'applique à toutes les procédures SAUF la demande de cotations et la
 * consultation de consultants, qui relèvent du régime allégé ci-dessous.
 */
export const PIECES_ADMINISTRATIVES = [
  { id: 'situationFiscale', label: 'Attestation de situation fiscale', emetteur: 'Direction générale des impôts' },
  { id: 'situationCotisante', label: 'Attestation de situation cotisante', emetteur: 'CNSS' },
  {
    id: 'nonEngagementAJE',
    label: 'Attestation de non engagement de l\'Agence judiciaire de l\'État',
    emetteur: 'Agence judiciaire de l\'État',
  },
  {
    id: 'reglementationTravail',
    label: 'Attestation de la direction chargée de la réglementation du travail et des lois sociales',
    emetteur: 'DRTSS',
  },
  {
    id: 'rccm',
    label: 'Attestation d\'inscription au registre du commerce et du crédit mobilier (ou tout autre extrait de registre professionnel)',
    emetteur: 'RCCM',
  },
  {
    id: 'nonFaillite',
    label: 'Certificat de non faillite, de redressement et de liquidation judiciaire',
    emetteur: 'Tribunal de commerce',
  },
];

/**
 * Régime allégé : demande de cotations et consultation de consultants
 * (arrêté n°2025/323, art. 3). Deux pièces au lieu de six.
 */
export const PIECES_COTATION_CONSULTATION = PIECES_ADMINISTRATIVES.filter((p) =>
  ['situationFiscale', 'rccm'].includes(p.id)
);

/** Quelles pièces produire pour une procédure donnée ? */
export function piecesRequises(procedureId) {
  const allegees = ['COTATION_NON_FORMELLE', 'COTATION_FORMELLE', 'CONSULTATION_CONSULTANTS'];
  return allegees.includes(procedureId) ? PIECES_COTATION_CONSULTATION : PIECES_ADMINISTRATIVES;
}

/** Régimes particuliers (arrêté n°2025/323, art. 5 à 7). */
export const REGIMES_PARTICULIERS = {
  article: 'Arrêté n°2025/323, art. 5 à 7',
  uemoaSansBaseFixe:
    'Les candidats établis dans la zone UEMOA sans base fixe ni établissement stable au Burkina Faso fournissent les pièces requises par la législation du pays où ils sont établis.',
  horsUemoa:
    'Les candidats installés hors de la zone UEMOA fournissent uniquement l\'extrait du registre du commerce et du crédit mobilier et un certificat de non-faillite, de redressement et de liquidation judiciaire, ou leurs équivalents.',
  dispenses:
    'Les associations reconnues d\'utilité publique et les consultants individuels sont dispensés. Les associations fournissent néanmoins le justificatif de leur reconnaissance d\'utilité publique.',
  cooperatives:
    'Pour les sociétés coopératives de producteurs agro-sylvo-pastoraux, halieutiques et fauniques et leurs faîtières : attestation de situation fiscale, document d\'immatriculation et attestation de situation cotisante.',
};

/**
 * Durée de validité indicative, en mois.
 *
 * ⚠️ Ce n'est pas une règle des textes 2024-2025 : ni le décret n°2024-1748 ni
 * l'arrêté n°2025/323 ne fixent de durée. Le repère de trois mois vient du
 * Guide du soumissionnaire 2018. Chaque attestation porte sa propre durée de
 * validité, et le dossier d'appel à concurrence peut en imposer une autre.
 * Traiter cette valeur comme une alerte de prudence, pas comme du droit.
 */
export const VALIDITE_PIECES_MOIS = 3;
export const VALIDITE_PIECES_INDICATIVE = true;

/**
 * Une pièce est-elle encore valable ?
 * @param {string|Date|null} dateObtention
 * @returns {{valide: boolean, joursRestants: number|null, expireLe: Date|null}}
 */
export function validitePiece(dateObtention) {
  if (!dateObtention) return { valide: false, joursRestants: null, expireLe: null };
  const obtenue = new Date(dateObtention);
  if (Number.isNaN(obtenue.getTime())) return { valide: false, joursRestants: null, expireLe: null };

  const expireLe = new Date(obtenue);
  expireLe.setMonth(expireLe.getMonth() + VALIDITE_PIECES_MOIS);

  const joursRestants = Math.ceil((expireLe.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return { valide: joursRestants > 0, joursRestants, expireLe };
}

// ─── Régime des pièces administratives (art. 109) ──────────────────────────
/**
 * Confirmé par le décret 2024 : une pièce absente ou périmée ne fait PAS
 * rejeter l'offre au dépôt. C'est à l'attribution que le couperet tombe.
 */
export const REGIME_PIECES = {
  article: 'Art. 109',
  auDepot:
    'L\'absence ou la non-validité des pièces administratives ne constitue pas un motif de rejet de l\'offre. Le soumissionnaire est invité à les produire dans un délai compatible avec les travaux de la Commission d\'attribution des marchés.',
  aLAttribution:
    'L\'appréciation est faite avant toute proposition d\'attribution. À l\'attribution, si les pièces requises ne sont pas fournies ou ne sont pas valides, l\'offre est écartée.',
  dispenses:
    'Les associations reconnues d\'utilité publique et les consultants individuels ne sont pas soumis à cette obligation.',
  controle:
    'L\'entité chargée du contrôle de la commande publique vérifie la validité des attestations du soumissionnaire retenu avant la publication des résultats.',
  // C'est pourquoi la liste ne figure pas dans le décret lui-même.
  sourceDeLaListe: 'La liste des pièces administratives à produire est fixée par arrêté du ministre chargé du budget.',
};

// ─── Marges de préférence (art. 119 à 123) ─────────────────────────────────
/**
 * Levier le plus direct pour une PME burkinabè : plusieurs marges se cumulent.
 * Toute préférence doit être prévue au dossier d'appel à concurrence et
 * quantifiée en pourcentage du montant de l'offre.
 */
export const PREFERENCES = [
  {
    id: 'communautaireTravaux',
    article: 'Art. 119',
    taux: 0.10,
    label: 'Entreprises communautaires — marchés de travaux',
    condition: 'Marché de travaux, entreprise communautaire.',
    cumulable: false,
  },
  {
    id: 'fournituresUEMOA',
    article: 'Art. 120',
    taux: 0.15,
    label: 'Fournitures ouvrées ou manufacturées dans l\'espace UEMOA',
    condition:
      'Entreprise installée dans l\'espace UEMOA, coût de fabrication intégrant des intrants communautaires, valeur ajoutée d\'au moins 20 %.',
    cumulable: false,
  },
  {
    id: 'ancrageLocal',
    article: 'Art. 121',
    taux: 0.05,
    label: 'Entreprise installée dans le ressort de la collectivité',
    condition:
      'Marché d\'une collectivité territoriale ou de son établissement public, financé sur ressources propres.',
    cumulable: true,
  },
  {
    id: 'pmeArtisan',
    article: 'Art. 122',
    taux: 0.05,
    label: 'PME, artisans et entreprises artisanales burkinabè ou communautaires',
    condition: 'Être une PME, un artisan ou une entreprise artisanale.',
    cumulable: true,
  },
  {
    id: 'sousTraitancePME',
    article: 'Art. 123',
    taux: 0.05,
    label: 'Sous-traitance d\'au moins 30 % à une PME burkinabè',
    condition:
      'Marché d\'une collectivité territoriale ou de son établissement public, sous-traitance d\'au moins 30 % de la valeur globale à une PME, un artisan ou une entreprise artisanale burkinabè.',
    cumulable: true,
  },
];

/**
 * Marge de préférence totale mobilisable, sachant que les taux des articles
 * 121 à 123 se cumulent avec ceux des articles 119 et 120.
 * @param {string[]} ids identifiants de PREFERENCES applicables
 */
export function cumulPreferences(ids = []) {
  const retenues = PREFERENCES.filter((p) => ids.includes(p.id));
  // Les deux bases (art. 119 et 120) ne se cumulent pas entre elles :
  // on retient la plus favorable.
  const bases = retenues.filter((p) => !p.cumulable);
  const meilleureBase = bases.reduce((max, p) => Math.max(max, p.taux), 0);
  const additionnelles = retenues.filter((p) => p.cumulable).reduce((s, p) => s + p.taux, 0);
  return {
    taux: meilleureBase + additionnelles,
    detail: retenues.map((p) => ({ id: p.id, article: p.article, taux: p.taux })),
  };
}

// ─── Offre anormalement basse et offre déséquilibrée (art. 115, 116) ───────
export const OFFRE_ANORMALEMENT_BASSE = {
  article: 'Art. 115',
  seuil: 0.15,
  definition:
    'Offre inférieure de plus de 15 % à la moyenne pondérée du montant prévisionnel de l\'autorité contractante et de la moyenne arithmétique des montants TTC corrigés des offres techniquement conformes.',
  exclusionsDuCalcul:
    'Les offres techniquement conformes hors enveloppe et les offres financières inférieures à 50 % du montant prévisionnel ne sont pas prises en compte.',
  toleranceConfirmation: 0.05,
  procedure:
    'Les soumissionnaires situés dans la tolérance de 5 % en deçà du seuil sont invités par écrit à confirmer leurs prix. Le défaut de confirmation entraîne le rejet. En dessous de la tolérance, l\'offre est rejetée.',
  nonApplicable: 'La formule ne s\'applique pas aux procédures de prestations intellectuelles.',
};

/**
 * Garantie de bonne exécution majorée : c'est la contrepartie d'un prix
 * agressif. Le taux est fixé à l'avance dans le dossier d'appel à concurrence.
 */
export const GARANTIE_BONNE_EXECUTION_MAJOREE = {
  article: 'Art. 115 et 116',
  tauxMin: 0.30,
  tauxMax: 0.40,
  assiette: 'Prix de base du marché, augmenté ou diminué le cas échéant des avenants.',
  declencheurs: [
    'Offre confirmée dans la tolérance de 5 % du seuil d\'offre anormalement basse (art. 115).',
    'Offre déséquilibrée attribuée (art. 116).',
  ],
  // L'arrêté n°2025/349 règle les modalités de constitution, pas les taux :
  // le pourcentage de droit commun est fixé par les dossiers standard
  // nationaux d'acquisition et les CCAG, auxquels les textes renvoient.
  tauxDeDroitCommun: null,
  tauxDeDroitCommunNote:
    'Ni le décret n°2024-1748 ni l\'arrêté n°2025/349 ne fixent le taux applicable au cas général : il figure dans les dossiers standard nationaux d\'acquisition et les cahiers des clauses administratives générales. Le dossier de votre marché fait foi.',
};

/**
 * Quand la garantie de bonne exécution est-elle exigible ?
 * Arrêté n°2025/349 du 28 juillet 2025, art. 8 à 10.
 */
export const GARANTIE_BONNE_EXECUTION = {
  article: 'Arrêté n°2025/349, art. 6 à 11',
  requisePour: ['TRAVAUX', 'FOURNITURES', 'SERVICES_COURANTS'],
  nonExigee: 'Non requise pour les marchés de prestations intellectuelles (art. 8).',
  seuilObligation: 10_000_000,
  seuilNote:
    'Obligatoire lorsque le montant du marché est supérieur ou égal à 10 000 000 FCFA. En dessous ou égal à ce montant, elle n\'est demandée qu\'aux soumissionnaires situés dans la tolérance de 5 % du seuil de l\'offre anormalement basse (art. 9).',
  delaiConstitutionJours: 14,
  delaiNote:
    'À constituer dans les 14 jours suivant la notification du marché approuvé, et avant toute notification de l\'ordre de service de démarrage (art. 10).',
  exemptions: [
    'Marchés exécutés par les administrations publiques',
    'Sociétés coopératives de producteurs agro-sylvo-pastoraux, halieutiques et fauniques, et leurs faîtières',
    'Souscription à une police d\'assurance',
    'Acquisition de carburant',
    'Cartes de recharge téléphoniques',
  ],
  exemptionsNote:
    'Ces dérogations ne dispensent pas des obligations contractuelles ni des responsabilités.',
  autresGarantiesExecution: [
    'Garantie de remboursement de l\'avance de démarrage (art. 7)',
    'Garantie de parfait achèvement ou retenue de garantie, pour les marchés de travaux et d\'équipement comportant un délai de garantie (art. 11)',
  ],
};

/** La garantie de bonne exécution est-elle exigible pour ce marché ? */
export function garantieBonneExecutionExigible({ nature, montantMarche }) {
  if (!GARANTIE_BONNE_EXECUTION.requisePour.includes(nature)) {
    return { exigible: false, motif: GARANTIE_BONNE_EXECUTION.nonExigee };
  }
  const montant = Number(montantMarche);
  if (!Number.isFinite(montant)) return null;
  if (montant >= GARANTIE_BONNE_EXECUTION.seuilObligation) {
    return { exigible: true, motif: `Montant ≥ ${fmt(GARANTIE_BONNE_EXECUTION.seuilObligation)}` };
  }
  return {
    exigible: false,
    motif:
      'Montant inférieur ou égal à 10 000 000 FCFA : exigible seulement si votre offre se situe dans la tolérance de 5 % du seuil de l\'offre anormalement basse.',
  };
}

export const OFFRE_DESEQUILIBREE = {
  article: 'Art. 116',
  consequenceStandard:
    'Le marché peut être attribué, mais la garantie de bonne exécution est portée entre 30 % et 40 % du prix de base.',
  desistement:
    'En cas de désistement du soumissionnaire, l\'autorité contractante saisit sa garantie de soumission et passe au deuxième classé.',
  marcheACommandes:
    'Dans un marché à commandes ou de clientèle, une offre jugée déséquilibrée est purement et simplement rejetée.',
};

// ─── Pénalités de retard (art. 178, 179) ───────────────────────────────────
export const PENALITES_RETARD = {
  article: 'Art. 178 et 179',
  sansMiseEnDemeure: 'Les pénalités s\'appliquent sans mise en demeure préalable.',
  tauxParJour: {
    fournituresServicesEtPrestationsIntellectuelles: { min: 1 / 2000, max: 1 / 1000 },
    travaux: { min: 1 / 5000, max: 1 / 2000 },
  },
  assiette: 'Montant du marché hors taxes, par jour calendaire de retard.',
  plafond: 0.05,
  plafondNote: 'Le total des pénalités ne peut dépasser 5 % du montant hors taxes du marché.',
  forceMajeure:
    'Aucune pénalité en cas de force majeure, à condition que les faits soient communiqués à l\'autorité contractante AVANT l\'expiration des délais d\'exécution (art. 179).',
};

// ─── Résiliation utile au titulaire (art. 191) ─────────────────────────────
export const RESILIATION_PAR_LE_TITULAIRE = {
  article: 'Art. 191',
  motifs: [
    'Défaillance de l\'autorité contractante, notamment un défaut de paiement rendant l\'exécution impossible, après une requête restée sans effet pendant au moins trois (3) mois.',
    'Ajournement dans les conditions de l\'article 187.',
    'Diminution des prestations excédant 30 % du montant initial du contrat.',
  ],
  indemnite:
    'En cas de résiliation sans faute du titulaire, celui-ci a droit à une indemnité calculée sur la base des prestations restant à exécuter (art. 192). Le taux est fixé par les cahiers des clauses administratives générales.',
};

// ─── Délais de réception des offres (art. 95 à 97) ─────────────────────────
export const DELAIS_OFFRES = {
  article: 'Art. 95 à 97',
  /** Délai minimum entre la première parution de l'avis et la date limite. */
  minimumJours: {
    seuilNational: 30,
    seuilCommunautaire: 45,
    concoursArchitectural: 60,
  },
  /** Le délai court à compter de la première parution dans la revue des marchés publics. */
  pointDeDepart: 'Première parution de l\'avis dans la revue des marchés publics',
  /** Raccourcissement admis quand avis et dossier circulent au format électronique UEMOA. */
  reductionElectroniqueJours: 7,
  /** Procédure d'urgence dûment motivée (art. 97). */
  urgence: {
    seuilNational: { min: 7, max: 15 },
    seuilCommunautaire: 30,
    condition: 'L\'urgence ne doit pas résulter du fait ou de la négligence de l\'autorité contractante.',
  },
};

/** Demandes d'éclaircissements (art. 96). */
export const ECLAIRCISSEMENTS = {
  article: 'Art. 96',
  /** Délai avant la date limite de dépôt pour adresser sa demande. */
  delaiDemandeJours: 14,
  /** Délai dont dispose l'autorité contractante pour répondre. */
  delaiReponseJours: 7,
  diffusion:
    'La réponse est adressée à toutes les entreprises ayant acheté ou qui achèteront le dossier d\'appel à concurrence.',
};

/** Report de la date limite de dépôt (art. 96). */
export const REPORT_DEPOT = {
  article: 'Art. 96',
  preavisJours: {
    standard: 10,
    seuilCommunautaireOuConcours: 15,
    demandeDePrixOuPropositionsAllegee: 5,
  },
};

/**
 * Jusqu'à quand peut-on encore demander des éclaircissements sur un dossier ?
 *
 * @param {string|Date} dateLimiteDepot
 * @returns {{dateLimiteDemande: Date, ouvert: boolean, joursRestants: number}|null}
 */
export function fenetreEclaircissements(dateLimiteDepot) {
  if (!dateLimiteDepot) return null;
  const limite = new Date(dateLimiteDepot);
  if (Number.isNaN(limite.getTime())) return null;

  const dateLimiteDemande = new Date(limite);
  dateLimiteDemande.setDate(dateLimiteDemande.getDate() - ECLAIRCISSEMENTS.delaiDemandeJours);

  const joursRestants = Math.ceil((dateLimiteDemande.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return { dateLimiteDemande, ouvert: joursRestants > 0, joursRestants };
}

// ─── Délais de règlement et intérêts moratoires (art. 204, 205) ────────────
export const DELAIS_PAIEMENT = {
  article: 'Art. 204 et 205',
  plafondsJours: {
    avance: 45,
    acompte: 60,
    solde: 90,
  },
  pointDeDepart:
    'À compter de l\'acceptation de la demande d\'avance ou de la facture par l\'autorité contractante, matérialisée par un document donnant date certaine.',
  interetsMoratoires: {
    // Point souvent ignoré des PME : les intérêts ne sont pas versés d'office.
    declencheur: 'Dus de plein droit à compter du jour suivant l\'expiration du délai.',
    condition: 'Calculés sur demande du cocontractant.',
    taux: 'Taux d\'intérêt légal de la BCEAO majoré d\'un (1) point.',
  },
};

/**
 * Date à laquelle un paiement devient exigible, et retard éventuel.
 * @param {string|Date} dateAcceptation
 * @param {'avance'|'acompte'|'solde'} type
 */
export function echeancePaiement(dateAcceptation, type = 'acompte') {
  const plafond = DELAIS_PAIEMENT.plafondsJours[type];
  if (!dateAcceptation || !plafond) return null;
  const depart = new Date(dateAcceptation);
  if (Number.isNaN(depart.getTime())) return null;

  const echeance = new Date(depart);
  echeance.setDate(echeance.getDate() + plafond);

  const joursDeRetard = Math.floor((Date.now() - echeance.getTime()) / (24 * 60 * 60 * 1000));
  return {
    echeance,
    plafondJours: plafond,
    enRetard: joursDeRetard > 0,
    joursDeRetard: Math.max(0, joursDeRetard),
  };
}

// ─── Voies de recours ──────────────────────────────────────────────────────
/**
 * Chaîne de recours ouverte au soumissionnaire, telle qu'établie par la
 * loi n°005-2024/ALT. Les délais de l'étage non juridictionnel ne figurent
 * dans aucun des textes consultés : l'article 47 de la loi les renvoie à un
 * décret, et l'article 48 du décret n°2024-1695 les renvoie à son tour à une
 * décision du Président du Conseil de régulation de l'ARCOP.
 */
export const RECOURS = [
  {
    etape: 'Saisine de l\'organe de règlement des différends (ORD)',
    fondement: 'Loi 005-2024, art. 44',
    objet:
      'Les candidats, soumissionnaires, attributaires et titulaires peuvent contester les dossiers d\'appel à concurrence et les décisions prises à l\'occasion de la passation, de l\'exécution et du règlement qui leur font grief.',
    delai: null,
    delaiInconnu: true,
    note:
      'Délai fixé par décision du Président du Conseil de régulation de l\'ARCOP (loi art. 47, décret n°2024-1695 art. 48). À vérifier auprès de l\'ARCOP avant de s\'y fier.',
  },
  {
    etape: 'Décision de l\'ORD',
    fondement: 'Loi 005-2024, art. 45 et 46',
    objet:
      'En phase de passation, l\'ORD rend des décisions. En phase d\'exécution, il constate par procès-verbal la conciliation totale, partielle ou la non-conciliation. Décisions et conciliations sont exécutoires ; tout acte pris en violation d\'une décision de l\'ORD est nul et de nul effet. L\'ORD peut également s\'autosaisir.',
    delai: null,
  },
  {
    etape: 'Recours devant le tribunal administratif',
    fondement: 'Loi 005-2024, art. 48 et 50',
    objet:
      'À défaut de règlement satisfaisant devant l\'ORD. Le recours n\'est pas suspensif, et les décisions rendues en phase de passation ne sont pas susceptibles de référé suspension.',
    delai: { valeur: 10, unite: 'jours' },
    pointDeDepart:
      'À compter du prononcé pour les décisions contradictoires ou réputées contradictoires, ou de la notification pour les décisions rendues par défaut.',
    delaiPourStatuer: { valeur: 30, unite: 'jours' },
  },
  {
    etape: 'Pourvoi en cassation devant le Conseil d\'État',
    fondement: 'Loi 005-2024, art. 50',
    objet: 'Contre la décision du tribunal administratif, qui statue en premier et dernier ressort.',
    delai: { valeur: 10, unite: 'jours' },
    delaiPourStatuer: { valeur: 30, unite: 'jours' },
  },
];

/** Litige né en phase d'exécution après non-conciliation (loi art. 51). */
export const RECOURS_EXECUTION = {
  fondement: 'Loi 005-2024, art. 51',
  delai: { valeur: 10, unite: 'jours' },
  pointDeDepart: 'À compter de la notification du procès-verbal de non-conciliation ou de conciliation partielle.',
  sanction: 'À peine d\'irrecevabilité.',
};

/** Arbitrage OHADA, ouvert aux litiges d'exécution (loi art. 56). */
export const ARBITRAGE = {
  fondement: 'Loi 005-2024, art. 56',
  objet:
    'En cas de litige entre parties contractantes survenant en cours ou après exécution, ou portant sur l\'interprétation du contrat, les parties peuvent soumettre leur différend à l\'arbitrage dans les conditions de l\'Acte uniforme OHADA.',
};

// ─── Check-list avant dépôt ────────────────────────────────────────────────
/**
 * Reprend les quatre blocs de la liste de contrôle officielle
 * (Guide du soumissionnaire ARCOP, point 3.3.6.2).
 */
export const CHECKLIST_DEPOT = [
  {
    id: 'piecesAdministratives',
    titre: 'Pièces administratives, y compris agrément technique',
    controle: 'Vérifier qu\'elles ont été fournies et qu\'elles sont valides.',
  },
  {
    id: 'garantieSoumission',
    titre: 'Garantie de soumission',
    controle: 'Lorsqu\'elle est exigée, vérifier qu\'elle est fournie et établie suivant le modèle imposé par le dossier.',
  },
  {
    id: 'preuvesReferences',
    titre: 'Preuves des références et conformité des prestations',
    controle:
      'Pages de garde et de signature, attestations de bonne fin, prospectus, dessins, photos, modèles ou échantillons correspondant aux spécifications techniques.',
  },
  {
    id: 'accordGroupement',
    titre: 'Accord de groupement',
    controle: 'En cas de groupement, s\'assurer que l\'accord est signé de toutes les parties.',
  },
];
