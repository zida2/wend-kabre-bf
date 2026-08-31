/**
 * Référentiel Réglementaire des Marchés Publics au Burkina Faso
 * 
 * Textes Fondateurs :
 * - Loi n°005-2024/ALT du 20 avril 2024 portant code des marchés publics
 * - Décret n°2024-1748/PRES/PM/MEF du 31 décembre 2024 (Passation, exécution et règlement)
 * - Arrêté n°2025-0323/MEF/CAB du 09 juillet 2025 (Pièces administratives exigées des candidats)
 * - Arrêté 2025 portant modalités de constitution des garanties relatives aux marchés publics
 * - Dossiers Standards Nationaux d'Acquisition (DSNA / ARCOP)
 */

export const BURKINA_REGULATORY_FRAMEWORK_2025 = {
  law: "Loi n°005-2024/ALT du 20 avril 2024",
  decret: "Décret n°2024-1748/PRES/PM/MEF du 31 décembre 2024",
  arretePiecesAdmin: "Arrêté n°2025-0323/MEF/CAB du 09 juillet 2025",
  authority: "ARCOP (Autorité de Régulation de la Commande Publique) & DGCMEF",
};

export const ADMINISTRATIVE_DOCUMENTS_RULES = [
  {
    code: "RCCM",
    name: "Registre du Commerce et du Crédit Mobilier",
    issuer: "CEFORE / Greffe du Tribunal de Commerce",
    category: "Administratif",
    mandatory: true,
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB Art. 3",
    validityPeriod: "Permanente (sauf modification statutaire)",
    rejectionRisk: "Élevé (Disqualification si non fourni ou non régularisé)",
    aiCheckRule: "Vérifier la correspondance exacte de la raison sociale et de l'objet social avec la nature du marché."
  },
  {
    code: "IFU",
    name: "Identifiant Financier Unique",
    issuer: "Direction Générale des Impôts (DGI)",
    category: "Administratif",
    mandatory: true,
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB Art. 3",
    validityPeriod: "Permanente",
    rejectionRisk: "Élevé (Éliminatoire si absent ou invalide)",
    aiCheckRule: "Vérifier le numéro IFU à 9 ou 10 chiffres et le statut actif du contribuable."
  },
  {
    code: "ASF",
    name: "Attestation de Situation Fiscale",
    issuer: "Direction Générale des Impôts (DGI)",
    category: "Administratif",
    mandatory: true,
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB Art. 4",
    validityPeriod: "3 mois à compter de la date de délivrance",
    rejectionRisk: "Très Élevé (Motif fréquent d'écartement si expiré ou non régularisé dans le délai légal)",
    aiCheckRule: "Vérifier impérativement la date d'expiration par rapport à la date de soumission du DAO."
  },
  {
    code: "CNSS",
    name: "Attestation de Situation Cotisante CNSS",
    issuer: "Caisse Nationale de Sécurité Sociale (CNSS)",
    category: "Administratif",
    mandatory: true,
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB Art. 5",
    validityPeriod: "3 mois (ou mention spécifique sur le document)",
    rejectionRisk: "Très Élevé (Motif d'écartement régulier dans les procès-verbaux ARCOP)",
    aiCheckRule: "Contrôler la validité de la date et la régularité des cotisations sociales."
  },
  {
    code: "AJE",
    name: "Attestation de Jouissance d'Équipement / Attestation AJE",
    issuer: "Administration compétente selon le DAO",
    category: "Administratif",
    mandatory: false, // Selon DAO
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB & DAO spécifique",
    validityPeriod: "En cours de validité à la soumission",
    rejectionRisk: "Élevé si exigé expressément par le DAO",
    aiCheckRule: "Vérifier si le DAO exige l'AJE et valider sa présence dans le pli administratif."
  },
  {
    code: "DRTSS",
    name: "Attestation de la Direction Régionale du Travail et de la Sécurité Sociale",
    issuer: "DRTSS / Ministère du Travail",
    category: "Administratif",
    mandatory: false, // Selon DAO
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB",
    validityPeriod: "En cours de validité",
    rejectionRisk: "Élevé (L'absence de la DRTSS est un motif d'élimination explicite dans la jurisprudence 2025/2026)",
    aiCheckRule: "Vérifier la validité de l'attestation de respect de la législation du travail."
  },
  {
    code: "CNF",
    name: "Certificat de Non-Faillite",
    issuer: "Greffe du Tribunal de Commerce",
    category: "Administratif",
    mandatory: true,
    canBeComplemented: true,
    legalBasis: "Arrêté n°2025-0323/MEF/CAB Art. 6",
    validityPeriod: "3 mois à compter de la délivrance",
    rejectionRisk: "Élevé si non fourni dans les délais de régularisation",
    aiCheckRule: "Confirmer la mention explicite d'absence de faillite, de liquidation ou de règlement judiciaire."
  },
  {
    code: "GARANTIE",
    name: "Garantie de Soumission (Caution bancaire ou établissement agréé)",
    issuer: "Banque commerciale ou établissement financier agréé par le MEF",
    category: "Garantie / Financier",
    mandatory: true,
    canBeComplemented: false, // NON régularisable si montant/durée/forme non conforme à l'ouverture des plis
    legalBasis: "Décret n°2024-1748 Art. 100 & Arrêté Garanties 2025",
    validityPeriod: "Durée spécifiée dans le DAO (généralement 90 à 120 jours)",
    rejectionRisk: "CRITIQUE (Rejet immédiat et irrévocable à l'ouverture des plis si manquante, insuffisante ou non conforme)",
    aiCheckRule: "Vérifier le montant exact (en FCFA), la durée de validité et le libellé de l'établissement financier émetteur."
  }
];

/**
 * Prompt système enrichi intégrant le cadre réglementaire 2024/2025 pour l'analyse des DAO
 */
export const BURKINA_SYSTEM_PROMPT_ANALYZE_MARKET = `Tu es un expert senior de la passation des marchés publics au Burkina Faso, parfaitement maître de la réglementation en vigueur :
- Loi n°005-2024/ALT du 20 avril 2024 portant code des marchés publics
- Décret n°2024-1748/PRES/PM/MEF du 31 décembre 2024
- Arrêté n°2025-0323/MEF/CAB du 09 juillet 2025 (Fixant les pièces administratives obligatoires : RCCM, IFU, ASF, CNSS, AJE, DRTSS, CNF)
- Les Dossiers Standards Nationaux d'Acquisition (DSNA) publiés par l'ARCOP.

Ton rôle est d'analyser fidèlement le Dossier d'Appel d'Offres (DAO) ou l'avis fourni et d'extraire de manière exhaustive et rigoureuse toutes les informations requises.

ATTENTION :
1. Pour les pièces administratives (RCCM, IFU, ASF, CNSS, AJE, DRTSS, CNF, etc.), distingue bien celles qui sont obligatoires dès la soumission.
2. Pour la Garantie de Soumission (Art. 100 du Décret 2024-1748), extrait le montant exact et la durée de validité exigée.
3. Pour les pièces techniques et financières, liste l'ensemble des attestations de bonne exécution, références similaires, CV du personnel clé et sous-détails de prix requis.
4. Identifie clairement les points de vigilance et les motifs légaux de disqualification.`;
