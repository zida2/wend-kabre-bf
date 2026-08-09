import { describe, it, expect } from 'vitest';
import {
  resolveProcedure,
  regleEnveloppe,
  estimerGarantieSoumission,
  validitePiece,
  fenetreEclaircissements,
  echeancePaiement,
  PIECES_ADMINISTRATIVES,
  CHECKLIST_DEPOT,
  VALIDITE_PIECES_MOIS,
  DELAIS_OFFRES,
  ECLAIRCISSEMENTS,
  DELAIS_PAIEMENT,
  RECOURS,
  RECOURS_EXECUTION,
  REGIME_PIECES,
  PREFERENCES,
  cumulPreferences,
  OFFRE_ANORMALEMENT_BASSE,
  GARANTIE_BONNE_EXECUTION_MAJOREE,
  PENALITES_RETARD,
  piecesRequises,
  VALIDITE_PIECES_INDICATIVE,
  GARANTIE_SOUMISSION,
  GARANTIE_BONNE_EXECUTION,
  garantieBonneExecutionExigible,
} from './arcop.js';

const M = 1_000_000;
const proc = (p) => resolveProcedure(p)?.procedure.id;

describe('resolveProcedure — seuils art. 6 du décret n°2024-1748', () => {
  it('bascule en cotation non formelle sous 1 million', () => {
    expect(proc({ nature: 'TRAVAUX', montantTTC: 900_000, autorite: 'ETAT' })).toBe('COTATION_NON_FORMELLE');
    expect(proc({ nature: 'FOURNITURES', montantTTC: 0, autorite: 'EPE_CT' })).toBe('COTATION_NON_FORMELLE');
  });

  it('applique la cotation formelle jusqu\'à 10 M pour un établissement public', () => {
    expect(proc({ nature: 'TRAVAUX', montantTTC: 1 * M, autorite: 'EPE_CT' })).toBe('COTATION_FORMELLE');
    expect(proc({ nature: 'TRAVAUX', montantTTC: 9_999_999, autorite: 'EPE_CT' })).toBe('COTATION_FORMELLE');
    expect(proc({ nature: 'TRAVAUX', montantTTC: 10 * M, autorite: 'EPE_CT' })).toBe('DEMANDE_DE_PRIX');
  });

  it('applique la cotation formelle jusqu\'à 20 M pour les autres autorités', () => {
    expect(proc({ nature: 'TRAVAUX', montantTTC: 19_999_999, autorite: 'ETAT' })).toBe('COTATION_FORMELLE');
    expect(proc({ nature: 'TRAVAUX', montantTTC: 20 * M, autorite: 'ETAT' })).toBe('DEMANDE_DE_PRIX');
  });

  describe('travaux', () => {
    it('passe en appel d\'offres à 150 M', () => {
      expect(proc({ nature: 'TRAVAUX', montantTTC: 149_999_999, autorite: 'ETAT' })).toBe('DEMANDE_DE_PRIX');
      expect(proc({ nature: 'TRAVAUX', montantTTC: 150 * M, autorite: 'ETAT' })).toBe('APPEL_OFFRES');
    });

    it('recule le seuil d\'appel d\'offres à 200 M pour une société d\'État', () => {
      expect(proc({ nature: 'TRAVAUX', montantTTC: 150 * M, autorite: 'SOCIETE_ETAT' })).toBe('DEMANDE_DE_PRIX');
      expect(proc({ nature: 'TRAVAUX', montantTTC: 200 * M, autorite: 'SOCIETE_ETAT' })).toBe('APPEL_OFFRES');
    });
  });

  describe('fournitures et services courants', () => {
    it('passe en appel d\'offres à 100 M', () => {
      expect(proc({ nature: 'FOURNITURES', montantTTC: 99_999_999, autorite: 'ETAT' })).toBe('DEMANDE_DE_PRIX');
      expect(proc({ nature: 'FOURNITURES', montantTTC: 100 * M, autorite: 'ETAT' })).toBe('APPEL_OFFRES');
    });

    it('traite les services courants comme les fournitures', () => {
      expect(proc({ nature: 'SERVICES_COURANTS', montantTTC: 100 * M, autorite: 'ETAT' })).toBe('APPEL_OFFRES');
    });

    it('recule le seuil à 150 M pour une société d\'État', () => {
      expect(proc({ nature: 'FOURNITURES', montantTTC: 100 * M, autorite: 'SOCIETE_ETAT' })).toBe('DEMANDE_DE_PRIX');
      expect(proc({ nature: 'FOURNITURES', montantTTC: 150 * M, autorite: 'SOCIETE_ETAT' })).toBe('APPEL_OFFRES');
    });
  });

  describe('prestations intellectuelles', () => {
    it('consulte des consultants sous 10 M pour un établissement public', () => {
      expect(proc({ nature: 'PRESTATIONS_INTELLECTUELLES', montantTTC: 9 * M, autorite: 'EPE_CT' })).toBe('CONSULTATION_CONSULTANTS');
    });

    it('consulte des consultants sous 20 M pour les autres autorités', () => {
      expect(proc({ nature: 'PRESTATIONS_INTELLECTUELLES', montantTTC: 19 * M, autorite: 'ETAT' })).toBe('CONSULTATION_CONSULTANTS');
    });

    it('passe en demande de propositions allégée jusqu\'à 60 M', () => {
      expect(proc({ nature: 'PRESTATIONS_INTELLECTUELLES', montantTTC: 20 * M, autorite: 'ETAT' })).toBe('DEMANDE_PROPOSITIONS_ALLEGEE');
      expect(proc({ nature: 'PRESTATIONS_INTELLECTUELLES', montantTTC: 59_999_999, autorite: 'ETAT' })).toBe('DEMANDE_PROPOSITIONS_ALLEGEE');
    });

    it('passe en demande de propositions à 60 M, quelle que soit l\'autorité', () => {
      for (const autorite of ['EPE_CT', 'ETAT', 'SOCIETE_ETAT']) {
        expect(proc({ nature: 'PRESTATIONS_INTELLECTUELLES', montantTTC: 60 * M, autorite })).toBe('DEMANDE_PROPOSITIONS');
      }
    });
  });

  it('refuse les entrées inexploitables plutôt que de deviner', () => {
    expect(resolveProcedure({ nature: 'INCONNU', montantTTC: 5 * M })).toBeNull();
    expect(resolveProcedure({ nature: 'TRAVAUX', montantTTC: -1 })).toBeNull();
    expect(resolveProcedure({ nature: 'TRAVAUX', montantTTC: 'beaucoup' })).toBeNull();
    expect(resolveProcedure({ nature: 'TRAVAUX', montantTTC: 5 * M, autorite: 'MAIRIE' })).toBeNull();
  });

  it('expose le seuil qui a motivé la réponse', () => {
    const r = resolveProcedure({ nature: 'TRAVAUX', montantTTC: 200 * M, autorite: 'ETAT' });
    expect(r.seuil).toContain('150');
  });
});

describe('regleEnveloppe — art. 101', () => {
  // Changement de fond du cadre 2024 : la double enveloppe technique/financière
  // ne s'applique plus qu'aux prestations intellectuelles.
  it('impose une enveloppe unique pour travaux, fournitures et services', () => {
    for (const n of ['TRAVAUX', 'FOURNITURES', 'SERVICES_COURANTS']) {
      expect(regleEnveloppe(n).type).toBe('UNIQUE');
    }
  });

  it('conserve la double enveloppe pour les prestations intellectuelles', () => {
    const r = regleEnveloppe('PRESTATIONS_INTELLECTUELLES');
    expect(r.type).toBe('DOUBLE');
    expect(r.details.join(' ')).toMatch(/NE PAS OUVRIR EN MÊME TEMPS/);
  });

  it('cite l\'article qui fonde la règle', () => {
    expect(regleEnveloppe('TRAVAUX').article).toBe('Art. 101');
  });
});

describe('estimerGarantieSoumission — art. 100', () => {
  it('encadre la garantie entre 1 % et 3 %', () => {
    expect(estimerGarantieSoumission(100 * M)).toEqual({ min: 1 * M, max: 3 * M });
  });

  it('refuse un montant absent ou négatif', () => {
    expect(estimerGarantieSoumission(0)).toBeNull();
    expect(estimerGarantieSoumission(-5)).toBeNull();
    expect(estimerGarantieSoumission(undefined)).toBeNull();
  });
});

describe('validitePiece — règle des 3 mois', () => {
  const ilYaJours = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  it('valide une pièce obtenue hier', () => {
    expect(validitePiece(ilYaJours(1)).valide).toBe(true);
  });

  it('invalide une pièce de plus de trois mois', () => {
    expect(validitePiece(ilYaJours(120)).valide).toBe(false);
  });

  it('annonce les jours restants avant péremption', () => {
    const r = validitePiece(ilYaJours(60));
    expect(r.joursRestants).toBeGreaterThan(0);
    expect(r.joursRestants).toBeLessThan(VALIDITE_PIECES_MOIS * 31);
  });

  it('traite l\'absence de date comme non valide, sans lever', () => {
    expect(validitePiece(null).valide).toBe(false);
    expect(validitePiece('pas-une-date').valide).toBe(false);
  });
});

describe('régime des pièces administratives — art. 109', () => {
  // Le guide de l'app affirmait qu'une pièce manquante entraînait le rejet
  // immédiat. Le décret 2024 dit l'inverse au dépôt.
  it('établit qu\'une pièce absente ne fait pas rejeter l\'offre au dépôt', () => {
    expect(REGIME_PIECES.auDepot).toMatch(/ne constitue pas un motif de rejet/);
  });

  it('maintient l\'écartement à l\'attribution', () => {
    expect(REGIME_PIECES.aLAttribution).toMatch(/écartée/);
  });

  it('renvoie la liste des pièces à un arrêté ministériel', () => {
    expect(REGIME_PIECES.sourceDeLaListe).toMatch(/arrêté du ministre chargé du budget/);
  });
});

describe('marges de préférence — art. 119 à 123', () => {
  it('expose les cinq marges du décret', () => {
    expect(PREFERENCES.map((p) => p.article)).toEqual([
      'Art. 119', 'Art. 120', 'Art. 121', 'Art. 122', 'Art. 123',
    ]);
  });

  it('accorde 5 % aux PME et artisans', () => {
    expect(PREFERENCES.find((p) => p.id === 'pmeArtisan').taux).toBe(0.05);
  });

  it('cumule les marges additionnelles avec la meilleure base', () => {
    // PME locale sur un marché de travaux communautaire : 10 % + 5 % + 5 %.
    const r = cumulPreferences(['communautaireTravaux', 'ancrageLocal', 'pmeArtisan']);
    expect(r.taux).toBeCloseTo(0.20, 5);
  });

  it('ne cumule pas les deux bases entre elles mais retient la plus forte', () => {
    const r = cumulPreferences(['communautaireTravaux', 'fournituresUEMOA']);
    expect(r.taux).toBeCloseTo(0.15, 5);
  });

  it('renvoie zéro sans marge applicable', () => {
    expect(cumulPreferences([]).taux).toBe(0);
    expect(cumulPreferences(['inexistant']).taux).toBe(0);
  });
});

describe('offre anormalement basse et garantie majorée — art. 115, 116', () => {
  it('fixe le seuil à 15 % sous la moyenne pondérée', () => {
    expect(OFFRE_ANORMALEMENT_BASSE.seuil).toBe(0.15);
    expect(OFFRE_ANORMALEMENT_BASSE.toleranceConfirmation).toBe(0.05);
  });

  it('exclut la formule des prestations intellectuelles', () => {
    expect(OFFRE_ANORMALEMENT_BASSE.nonApplicable).toMatch(/prestations intellectuelles/);
  });

  it('porte la garantie de bonne exécution entre 30 % et 40 %', () => {
    expect(GARANTIE_BONNE_EXECUTION_MAJOREE.tauxMin).toBe(0.30);
    expect(GARANTIE_BONNE_EXECUTION_MAJOREE.tauxMax).toBe(0.40);
  });

  it('n\'invente pas de taux de droit commun', () => {
    // Ni le décret ni l'arrêté 2025/349 ne le fixent : mieux vaut rien qu'un
    // chiffre plausible. La note doit renvoyer l'utilisateur au bon endroit.
    expect(GARANTIE_BONNE_EXECUTION_MAJOREE.tauxDeDroitCommun).toBeNull();
    expect(GARANTIE_BONNE_EXECUTION_MAJOREE.tauxDeDroitCommunNote).toMatch(/dossiers standard/);
  });
});

describe('pénalités de retard — art. 178, 179', () => {
  it('plafonne les pénalités à 5 % du montant hors taxes', () => {
    expect(PENALITES_RETARD.plafond).toBe(0.05);
  });

  it('applique un taux journalier plus doux aux travaux', () => {
    const { travaux, fournituresServicesEtPrestationsIntellectuelles: autres } =
      PENALITES_RETARD.tauxParJour;
    expect(travaux.max).toBeLessThanOrEqual(autres.min);
  });

  it('rappelle que la force majeure doit être signalée avant l\'échéance', () => {
    expect(PENALITES_RETARD.forceMajeure).toMatch(/AVANT l'expiration/);
  });
});

describe('délais de réception des offres — art. 95 à 97', () => {
  it('fixe les planchers de 30, 45 et 60 jours', () => {
    expect(DELAIS_OFFRES.minimumJours).toEqual({
      seuilNational: 30,
      seuilCommunautaire: 45,
      concoursArchitectural: 60,
    });
  });

  it('admet un raccourcissement de 7 jours au format électronique UEMOA', () => {
    expect(DELAIS_OFFRES.reductionElectroniqueJours).toBe(7);
  });

  it('encadre la procédure d\'urgence entre 7 et 15 jours au seuil national', () => {
    expect(DELAIS_OFFRES.urgence.seuilNational).toEqual({ min: 7, max: 15 });
    expect(DELAIS_OFFRES.urgence.seuilCommunautaire).toBe(30);
  });
});

describe('fenetreEclaircissements — art. 96', () => {
  const dansJours = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  it('ouvre la fenêtre jusqu\'à 14 jours avant la date limite', () => {
    const r = fenetreEclaircissements(dansJours(30));
    expect(r.ouvert).toBe(true);
    // 30 j avant le dépôt, il reste ~16 j pour poser ses questions.
    expect(r.joursRestants).toBeGreaterThanOrEqual(15);
    expect(r.joursRestants).toBeLessThanOrEqual(17);
  });

  it('ferme la fenêtre à moins de 14 jours du dépôt', () => {
    expect(fenetreEclaircissements(dansJours(10)).ouvert).toBe(false);
  });

  it('place la date limite de demande 14 jours avant le dépôt', () => {
    const depot = dansJours(40);
    const r = fenetreEclaircissements(depot);
    const ecart = Math.round((depot - r.dateLimiteDemande) / (24 * 60 * 60 * 1000));
    expect(ecart).toBe(ECLAIRCISSEMENTS.delaiDemandeJours);
  });

  it('refuse une date absente ou illisible', () => {
    expect(fenetreEclaircissements(null)).toBeNull();
    expect(fenetreEclaircissements('bientôt')).toBeNull();
  });
});

describe('echeancePaiement — art. 204', () => {
  const ilYaJours = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  it('applique 45, 60 et 90 jours selon le type de paiement', () => {
    expect(DELAIS_PAIEMENT.plafondsJours).toEqual({ avance: 45, acompte: 60, solde: 90 });
    expect(echeancePaiement(new Date(), 'avance').plafondJours).toBe(45);
    expect(echeancePaiement(new Date(), 'solde').plafondJours).toBe(90);
  });

  it('détecte un acompte en retard au-delà de 60 jours', () => {
    const r = echeancePaiement(ilYaJours(75), 'acompte');
    expect(r.enRetard).toBe(true);
    expect(r.joursDeRetard).toBeGreaterThanOrEqual(14);
  });

  it('ne signale pas de retard dans le délai', () => {
    const r = echeancePaiement(ilYaJours(30), 'acompte');
    expect(r.enRetard).toBe(false);
    expect(r.joursDeRetard).toBe(0);
  });

  it('rappelle que les intérêts moratoires se demandent', () => {
    // Point d'attention : ils ne sont pas versés d'office.
    expect(DELAIS_PAIEMENT.interetsMoratoires.condition).toMatch(/demande/i);
    expect(DELAIS_PAIEMENT.interetsMoratoires.taux).toMatch(/BCEAO/);
  });

  it('refuse un type de paiement inconnu', () => {
    expect(echeancePaiement(new Date(), 'pourboire')).toBeNull();
  });
});

describe('voies de recours', () => {
  it('décrit la chaîne complète, de l\'ORD au Conseil d\'État', () => {
    expect(RECOURS.map((r) => r.etape)).toEqual([
      'Saisine de l\'organe de règlement des différends (ORD)',
      'Décision de l\'ORD',
      'Recours devant le tribunal administratif',
      'Pourvoi en cassation devant le Conseil d\'État',
    ]);
  });

  it('fixe 10 jours pour saisir le tribunal administratif, qui statue en 30', () => {
    const ta = RECOURS.find((r) => r.etape.includes('tribunal administratif'));
    expect(ta.delai).toEqual({ valeur: 10, unite: 'jours' });
    expect(ta.delaiPourStatuer).toEqual({ valeur: 30, unite: 'jours' });
  });

  it('signale explicitement le délai de saisine de l\'ORD comme inconnu', () => {
    // Ne jamais afficher un délai inventé sur une étape où rater la date
    // rend le recours irrecevable.
    const ord = RECOURS[0];
    expect(ord.delai).toBeNull();
    expect(ord.delaiInconnu).toBe(true);
    expect(ord.note).toMatch(/ARCOP/);
  });

  it('rappelle que le recours devant le TA n\'est pas suspensif', () => {
    const ta = RECOURS.find((r) => r.etape.includes('tribunal administratif'));
    expect(ta.objet).toMatch(/pas suspensif/);
  });

  it('donne 10 jours après un procès-verbal de non-conciliation', () => {
    expect(RECOURS_EXECUTION.delai).toEqual({ valeur: 10, unite: 'jours' });
    expect(RECOURS_EXECUTION.sanction).toMatch(/irrecevabilité/);
  });
});

describe('référentiel des pièces et check-list', () => {
  it('reprend les six pièces de l\'arrêté n°2025/323', () => {
    expect(PIECES_ADMINISTRATIVES).toHaveLength(6);
    const ids = PIECES_ADMINISTRATIVES.map((p) => p.id);
    // Régression : ces trois pièces manquaient au tracker.
    expect(ids).toContain('nonEngagementAJE');
    expect(ids).toContain('reglementationTravail');
    expect(ids).toContain('nonFaillite');
  });

  // Le guide 2018 attribuait cette attestation au Trésor public ; l'arrêté
  // 2025 la rattache à l'Agence judiciaire de l'État. Se tromper d'émetteur
  // envoie l'utilisateur au mauvais guichet.
  it('rattache l\'attestation de non engagement à l\'Agence judiciaire de l\'État', () => {
    const piece = PIECES_ADMINISTRATIVES.find((p) => p.id === 'nonEngagementAJE');
    expect(piece.emetteur).toMatch(/Agence judiciaire/);
    expect(PIECES_ADMINISTRATIVES.some((p) => /Trésor/.test(p.emetteur))).toBe(false);
  });

  it('ne marque plus les pièces comme à vérifier', () => {
    expect(PIECES_ADMINISTRATIVES.some((p) => p.aVerifier)).toBe(false);
  });

  it('allège à deux pièces pour cotations et consultation de consultants', () => {
    expect(piecesRequises('COTATION_FORMELLE').map((p) => p.id)).toEqual(['situationFiscale', 'rccm']);
    expect(piecesRequises('CONSULTATION_CONSULTANTS')).toHaveLength(2);
    expect(piecesRequises('APPEL_OFFRES')).toHaveLength(6);
    expect(piecesRequises('DEMANDE_DE_PRIX')).toHaveLength(6);
  });

  it('signale que la validité de 3 mois est indicative, pas normative', () => {
    expect(VALIDITE_PIECES_INDICATIVE).toBe(true);
  });
});

describe('garantie de soumission — arrêté n°2025/349', () => {
  it('est obligatoire pour travaux, fournitures et services courants', () => {
    expect(GARANTIE_SOUMISSION.obligatoirePour).toEqual(['TRAVAUX', 'FOURNITURES', 'SERVICES_COURANTS']);
  });

  it('n\'est exigée ni en prestations intellectuelles ni en demande de cotations', () => {
    expect(GARANTIE_SOUMISSION.nonExigee).toMatch(/prestations intellectuelles/);
    expect(GARANTIE_SOUMISSION.nonExigee).toMatch(/cotations/);
  });
});

describe('garantie de bonne exécution — arrêté n°2025/349', () => {
  it('devient obligatoire à partir de 10 millions', () => {
    expect(garantieBonneExecutionExigible({ nature: 'TRAVAUX', montantMarche: 10_000_000 }).exigible).toBe(true);
    expect(garantieBonneExecutionExigible({ nature: 'TRAVAUX', montantMarche: 50_000_000 }).exigible).toBe(true);
  });

  it('n\'est pas exigible d\'office en dessous de 10 millions', () => {
    const r = garantieBonneExecutionExigible({ nature: 'FOURNITURES', montantMarche: 8_000_000 });
    expect(r.exigible).toBe(false);
    expect(r.motif).toMatch(/tolérance de 5 %/);
  });

  it('ne s\'applique pas aux prestations intellectuelles', () => {
    const r = garantieBonneExecutionExigible({ nature: 'PRESTATIONS_INTELLECTUELLES', montantMarche: 500_000_000 });
    expect(r.exigible).toBe(false);
  });

  it('laisse 14 jours pour la constituer', () => {
    expect(GARANTIE_BONNE_EXECUTION.delaiConstitutionJours).toBe(14);
  });

  it('exempte le carburant et les cartes de recharge', () => {
    const ex = GARANTIE_BONNE_EXECUTION.exemptions.join(' ');
    expect(ex).toMatch(/carburant/);
    expect(ex).toMatch(/recharge téléphoniques/);
  });

  it('refuse un montant illisible', () => {
    expect(garantieBonneExecutionExigible({ nature: 'TRAVAUX', montantMarche: 'beaucoup' })).toBeNull();
  });

  it('reprend les quatre blocs de la check-list avant dépôt', () => {
    expect(CHECKLIST_DEPOT.map((b) => b.id)).toEqual([
      'piecesAdministratives',
      'garantieSoumission',
      'preuvesReferences',
      'accordGroupement',
    ]);
  });
});
