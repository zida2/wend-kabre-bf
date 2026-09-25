// Génération de la matrice de cas limites pour Ground Truth V1
import fs from 'fs';

// Cas limites organisés par frontières critiques
const boundaryCases = {
  
  // FRONTIÈRE 1: Marché vs Recrutement
  marche_vs_recrutement: [
    {
      id: "boundary-001",
      texte: "Appel d'offres pour prestation de services de gardiennage 24h/24 des bâtiments ministériels",
      classe_attendue: "VALID",
      justification: "Appel d'offres explicite + prestation contractuelle externe",
      frontiere: "marché_vs_recrutement",
      signaux_positifs: ["appel d'offres", "prestation de services", "contractuelle"],
      signaux_negatifs: []
    },
    {
      id: "boundary-002", 
      texte: "Recrutement prestataire - Services de maintenance des jardins publics de Ouagadougou",
      classe_attendue: "REVIEW",
      justification: "Ambiguïté : recrutement direct vs marché de service externalisé",
      frontiere: "marché_vs_recrutement",
      signaux_positifs: ["services de maintenance"],
      signaux_negatifs: ["recrutement"]
    },
    {
      id: "boundary-003",
      texte: "Avis de recrutement - 50 agents de sécurité pour la surveillance des écoles",
      classe_attendue: "REJECTED",
      justification: "Recrutement direct d'agents, pas prestation externe",
      frontiere: "marché_vs_recrutement", 
      signaux_positifs: [],
      signaux_negatifs: ["avis de recrutement", "agents"]
    },
    {
      id: "boundary-004",
      texte: "Marché public de prestations d'entretien et nettoyage des centres de santé",
      classe_attendue: "VALID",
      justification: "Marché public explicite + prestations définies",
      frontiere: "marché_vs_recrutement",
      signaux_positifs: ["marché public", "prestations"],
      signaux_negatifs: []
    },
    {
      id: "boundary-005",
      texte: "Services de nettoyage et désinfection pour 200 établissements scolaires",
      classe_attendue: "REVIEW", 
      justification: "Services définis mais procédure contractuelle non précisée",
      frontiere: "marché_vs_recrutement",
      signaux_positifs: ["services de nettoyage"],
      signaux_negatifs: []
    }
  ],

  // FRONTIÈRE 2: Marché vs Communication Officielle  
  marche_vs_communication: [
    {
      id: "boundary-006",
      texte: "Appel d'offres pour construction de 20 centres de santé dans la région du Sahel",
      classe_attendue: "VALID",
      justification: "Appel d'offres + objet défini + procédure lancée",
      frontiere: "marché_vs_communication",
      signaux_positifs: ["appel d'offres", "construction"],
      signaux_negatifs: []
    },
    {
      id: "boundary-007",
      texte: "Le gouvernement annonce la construction de 20 centres de santé dans le Sahel",
      classe_attendue: "REJECTED",
      justification: "Annonce politique générale, pas de procédure marchés publics",
      frontiere: "marché_vs_communication",
      signaux_positifs: [],
      signaux_negatifs: ["gouvernement annonce"]
    },
    {
      id: "boundary-008", 
      texte: "Déclaration du Ministre sur le programme de construction d'écoles primaires",
      classe_attendue: "REJECTED",
      justification: "Communication officielle sans procédure contractuelle spécifique",
      frontiere: "marché_vs_communication",
      signaux_positifs: [],
      signaux_negatifs: ["déclaration", "ministre"]
    },
    {
      id: "boundary-009",
      texte: "Lancement de la procédure d'appel d'offres pour réhabilitation de l'aéroport",
      classe_attendue: "VALID", 
      justification: "Procédure d'appel d'offres + objet spécifique (réhabilitation)",
      frontiere: "marché_vs_communication",
      signaux_positifs: ["procédure d'appel d'offres", "réhabilitation"],
      signaux_negatifs: []
    },
    {
      id: "boundary-010",
      texte: "Communiqué de presse - Projet de modernisation du réseau électrique national",
      classe_attendue: "REJECTED",
      justification: "Communiqué projet futur, pas de procédure contractuelle active",
      frontiere: "marché_vs_communication",
      signaux_positifs: [],
      signaux_negatifs: ["communiqué de presse", "projet"]
    }
  ],

  // FRONTIÈRE 3: Service vs Recrutement
  service_vs_recrutement: [
    {
      id: "boundary-011",
      texte: "Contrat de prestation - Services de restauration collective pour 100 écoles",
      classe_attendue: "VALID",
      justification: "Contrat de prestation + services externes définis",
      frontiere: "service_vs_recrutement",
      signaux_positifs: ["contrat de prestation", "services"],
      signaux_negatifs: []
    },
    {
      id: "boundary-012",
      texte: "Recherche de prestataire pour services de traduction français-mooré",
      classe_attendue: "REVIEW",
      justification: "Recherche prestataire ambigu : contrat externe vs recrutement temporaire",
      frontiere: "service_vs_recrutement", 
      signaux_positifs: ["prestataire", "services"],
      signaux_negatifs: ["recherche"]
    },
    {
      id: "boundary-013",
      texte: "Recrutement de 10 cuisinières pour les cantines scolaires gouvernementales",
      classe_attendue: "REJECTED",
      justification: "Recrutement direct personnel, pas externalisation service",
      frontiere: "service_vs_recrutement",
      signaux_positifs: [],
      signaux_negatifs: ["recrutement", "cuisinières"]
    },
    {
      id: "boundary-014",
      texte: "Prestation de services informatiques - Maintenance réseau ministères",
      classe_attendue: "REVIEW",
      justification: "Prestation technique, modalités contractuelles à clarifier",
      frontiere: "service_vs_recrutement",
      signaux_positifs: ["prestation de services"],
      signaux_negatifs: []
    }
  ],

  // FRONTIÈRE 4: Études/Consulting vs Marché vs Académique
  etudes_consulting: [
    {
      id: "boundary-015", 
      texte: "Appel d'offres pour étude de faisabilité du projet de barrage de Kandadji",
      classe_attendue: "VALID",
      justification: "Appel d'offres + étude contractuelle spécialisée",
      frontiere: "études_consulting",
      signaux_positifs: ["appel d'offres", "étude de faisabilité"],
      signaux_negatifs: []
    },
    {
      id: "boundary-016",
      texte: "Mission d'expertise comptable pour audit des comptes de l'État",
      classe_attendue: "REVIEW",
      justification: "Mission expertise : peut être marché spécialisé ou mission interne",
      frontiere: "études_consulting",
      signaux_positifs: ["mission d'expertise"],
      signaux_negatifs: []
    },
    {
      id: "boundary-017",
      texte: "Étude d'impact environnemental du projet minier - Université de Ouagadougou",
      classe_attendue: "REJECTED",
      justification: "Étude académique/recherche, pas marché public commercial",
      frontiere: "études_consulting",
      signaux_positifs: [],
      signaux_negatifs: ["université"]
    },
    {
      id: "boundary-018",
      texte: "Contrat de conseil en gestion pour modernisation administration fiscale",
      classe_attendue: "VALID",
      justification: "Contrat de conseil + objet défini + procédure commerciale",
      frontiere: "études_consulting",
      signaux_positifs: ["contrat de conseil"],
      signaux_negatifs: []
    },
    {
      id: "boundary-019",
      texte: "Évaluation des politiques de santé publique - Rapport annuel ministériel",
      classe_attendue: "REJECTED",
      justification: "Évaluation interne administrative, pas marché externe", 
      frontiere: "études_consulting",
      signaux_positifs: [],
      signaux_negatifs: ["rapport annuel ministériel"]
    }
  ],

  // FRONTIÈRE 5: Formation Marché vs Formation Académique
  formation_frontiere: [
    {
      id: "boundary-020",
      texte: "Marché de prestation de formation en informatique pour 500 fonctionnaires",
      classe_attendue: "VALID",
      justification: "Marché de prestation + formation commerciale externalisée",
      frontiere: "formation",
      signaux_positifs: ["marché de prestation", "formation"],
      signaux_negatifs: []
    },
    {
      id: "boundary-021",
      texte: "Séminaire de formation continue des enseignants du primaire",
      classe_attendue: "REJECTED",
      justification: "Séminaire formation interne/académique, pas prestation commerciale",
      frontiere: "formation", 
      signaux_positifs: [],
      signaux_negatifs: ["séminaire"]
    },
    {
      id: "boundary-022",
      texte: "Prestation de services de formation en gestion de projets pour cadres",
      classe_attendue: "REVIEW",
      justification: "Prestation formation : peut être marché externe ou programme interne",
      frontiere: "formation",
      signaux_positifs: ["prestation de services", "formation"],
      signaux_negatifs: []
    },
    {
      id: "boundary-023",
      texte: "Atelier de renforcement de capacités - Techniques agricoles modernes",
      classe_attendue: "REJECTED", 
      justification: "Atelier formation académique/technique, pas marché commercial",
      frontiere: "formation",
      signaux_positifs: [],
      signaux_negatifs: ["atelier"]
    }
  ],

  // FRONTIÈRE 6: Fourniture vs Information vs Communication
  fourniture_frontiere: [
    {
      id: "boundary-024",
      texte: "Acquisition de 1000 ordinateurs portables pour l'administration centrale",
      classe_attendue: "VALID", 
      justification: "Acquisition + objet défini + quantité = marché fourniture clair",
      frontiere: "fourniture",
      signaux_positifs: ["acquisition", "ordinateurs"],
      signaux_negatifs: []
    },
    {
      id: "boundary-025",
      texte: "Information sur la disponibilité de matériel médical auprès des fournisseurs",
      classe_attendue: "REJECTED",
      justification: "Information générale, pas appel d'achat ni procédure contractuelle",
      frontiere: "fourniture",
      signaux_positifs: [],
      signaux_negatifs: ["information"]
    },
    {
      id: "boundary-026", 
      texte: "Demande de prix pour fourniture de 500 véhicules administratifs",
      classe_attendue: "VALID",
      justification: "Demande de prix = procédure d'achat + fourniture spécifiée",
      frontiere: "fourniture",
      signaux_positifs: ["demande de prix", "fourniture"],
      signaux_negatifs: []
    },
    {
      id: "boundary-027",
      texte: "Le ministère étudie l'acquisition de nouveaux équipements de bureau",
      classe_attendue: "REJECTED",
      justification: "Projet d'étude, pas procédure d'achat lancée",
      frontiere: "fourniture", 
      signaux_positifs: [],
      signaux_negatifs: ["étudie"]
    }
  ],

  // FRONTIÈRE 7: Travaux vs Annonce vs Cérémonie
  travaux_frontiere: [
    {
      id: "boundary-028",
      texte: "Marché de travaux de construction de 50 logements sociaux à Bobo-Dioulasso",
      classe_attendue: "VALID",
      justification: "Marché de travaux + construction définie + localisation = marché clair",
      frontiere: "travaux",
      signaux_positifs: ["marché de travaux", "construction"],
      signaux_negatifs: []
    },
    {
      id: "boundary-029",
      texte: "Inauguration des travaux de réhabilitation du stade municipal",
      classe_attendue: "REJECTED", 
      justification: "Inauguration = cérémonie, travaux déjà attribués/terminés",
      frontiere: "travaux",
      signaux_positifs: [],
      signaux_negatifs: ["inauguration"]
    },
    {
      id: "boundary-030",
      texte: "Travaux de bitumage de la route Ouagadougou-Koudougou - Phase 2",
      classe_attendue: "REVIEW",
      justification: "Travaux mentionnés mais procédure contractuelle non précisée",
      frontiere: "travaux",
      signaux_positifs: ["travaux", "bitumage"],
      signaux_negatifs: []
    },
    {
      id: "boundary-031",
      texte: "Pose de la première pierre du nouveau palais de justice de Banfora",
      classe_attendue: "REJECTED",
      justification: "Cérémonie officielle, pas procédure de marché",
      frontiere: "travaux",
      signaux_positifs: [],
      signaux_negatifs: ["pose de la première pierre"]
    }
  ],

  // FRONTIÈRE 8: Avis Ambigu
  avis_ambigu: [
    {
      id: "boundary-032",
      texte: "Avis d'appel d'offres pour prestation de services de transport scolaire",
      classe_attendue: "VALID",
      justification: "Avis d'appel d'offres = procédure claire + prestation définie",
      frontiere: "avis_ambigu",
      signaux_positifs: ["avis d'appel d'offres", "prestation"],
      signaux_negatifs: []
    },
    {
      id: "boundary-033",
      texte: "Avis de recherche de prestataire pour animation culturelle",
      classe_attendue: "REVIEW",
      justification: "Recherche prestataire ambigu : procédure formelle vs informelle",
      frontiere: "avis_ambigu", 
      signaux_positifs: ["prestataire"],
      signaux_negatifs: ["recherche"]
    },
    {
      id: "boundary-034",
      texte: "Avis de recrutement - Directeur général de l'Agence nationale",
      classe_attendue: "REJECTED",
      justification: "Avis de recrutement = embauche directe, pas marché",
      frontiere: "avis_ambigu",
      signaux_positifs: [],
      signaux_negatifs: ["avis de recrutement"]
    },
    {
      id: "boundary-035",
      texte: "Avis aux entreprises - Opportunités dans le secteur des énergies renouvelables",
      classe_attendue: "REVIEW",
      justification: "Avis général : peut précéder marchés spécifiques ou information générale",
      frontiere: "avis_ambigu",
      signaux_positifs: ["entreprises", "opportunités"],
      signaux_negatifs: []
    }
  ],

  // FRONTIÈRE 9: Communications Officielles Complexes  
  communications_complexes: [
    {
      id: "boundary-036",
      texte: "Communiqué du Conseil des Ministres approuvant le marché de construction d'hôpitaux",
      classe_attendue: "REJECTED",
      justification: "Communiqué approbation = information post-décision, pas appel candidatures",
      frontiere: "communications_complexes",
      signaux_positifs: [],
      signaux_negatifs: ["communiqué", "approuvant"]
    },
    {
      id: "boundary-037",
      texte: "Déclaration ministérielle lançant la procédure d'appel d'offres pour équipements médicaux",
      classe_attendue: "VALID",
      justification: "Déclaration lançant procédure = début processus contractuel actionnable",
      frontiere: "communications_complexes",
      signaux_positifs: ["lançant la procédure d'appel d'offres"],
      signaux_negatifs: []
    },
    {
      id: "boundary-038",
      texte: "Message du Président sur la politique nationale d'infrastructures routières",
      classe_attendue: "REJECTED",
      justification: "Message présidentiel = communication stratégique générale",
      frontiere: "communications_complexes",
      signaux_positifs: [],
      signaux_negatifs: ["message du président", "politique nationale"]
    }
  ],

  // FRONTIÈRE 10: Cas Multi-Signaux Contradictoires
  signaux_contradictoires: [
    {
      id: "boundary-039",
      texte: "Recrutement d'entreprise prestataire pour marché de fourniture de matériel scolaire",
      classe_attendue: "VALID",
      justification: "Malgré 'recrutement', contexte marché + fourniture = procédure commerciale",
      frontiere: "signaux_contradictoires",
      signaux_positifs: ["marché", "fourniture"],
      signaux_negatifs: ["recrutement"]
    },
    {
      id: "boundary-040",
      texte: "Appel à candidatures pour mission de conseil - Poste de consultant interne",
      classe_attendue: "REJECTED", 
      justification: "Malgré 'mission conseil', poste interne = recrutement direct",
      frontiere: "signaux_contradictoires",
      signaux_positifs: ["mission de conseil"],
      signaux_negatifs: ["poste", "interne"]
    },
    {
      id: "boundary-041",
      texte: "Déclaration d'ouverture d'appel d'offres pour construction centres formation",
      classe_attendue: "VALID",
      justification: "Malgré 'déclaration', ouverture appel d'offres = procédure contractuelle",
      frontiere: "signaux_contradictoires",
      signaux_positifs: ["ouverture d'appel d'offres", "construction"],
      signaux_negatifs: ["déclaration"]
    }
  ],

  // FRONTIÈRE 11: Modalités Contractuelles Spéciales
  modalites_speciales: [
    {
      id: "boundary-042",
      texte: "Convention de partenariat public-privé pour gestion déchets urbains Ouagadougou",
      classe_attendue: "VALID", 
      justification: "PPP = modalité contractuelle commerciale avec sélection partenaire",
      frontiere: "modalités_spéciales",
      signaux_positifs: ["partenariat public-privé"],
      signaux_negatifs: []
    },
    {
      id: "boundary-043",
      texte: "Accord de coopération avec partenaires internationaux - Projet éducation",
      classe_attendue: "REJECTED",
      justification: "Accord coopération = partenariat institutionnel, pas marché commercial",
      frontiere: "modalités_spéciales", 
      signaux_positifs: [],
      signaux_negatifs: ["accord de coopération"]
    },
    {
      id: "boundary-044",
      texte: "Concession pour exploitation mines d'or - Appel à manifestation d'intérêt",
      classe_attendue: "VALID",
      justification: "Concession + AMI = procédure sélection commerciale",
      frontiere: "modalités_spéciales",
      signaux_positifs: ["concession", "appel à manifestation d'intérêt"],
      signaux_negatifs: []
    },
    {
      id: "boundary-045",
      texte: "Délégation de service public - Gestion réseau distribution d'eau Bobo-Dioulasso",
      classe_attendue: "REVIEW",
      justification: "DSP : modalité commerciale mais procédure pas toujours ouverte",
      frontiere: "modalités_spéciales",
      signaux_positifs: ["délégation de service public"],
      signaux_negatifs: []
    }
  ],

  // FRONTIÈRE 12: Secteurs Spécialisés
  secteurs_specialises: [
    {
      id: "boundary-046",
      texte: "Marché de fourniture de médicaments essentiels pour pharmacies régionales",
      classe_attendue: "VALID",
      justification: "Marché fourniture + secteur spécialisé médical = procédure commerciale",
      frontiere: "secteurs_spécialisés",
      signaux_positifs: ["marché", "fourniture"],
      signaux_negatifs: []
    },
    {
      id: "boundary-047", 
      texte: "Distribution gratuite de moustiquaires imprégnées - Programme national paludisme",
      classe_attendue: "REJECTED",
      justification: "Distribution gratuite programme = action sanitaire publique, pas marché",
      frontiere: "secteurs_spécialisés",
      signaux_positifs: [],
      signaux_negatifs: ["distribution gratuite", "programme"]
    },
    {
      id: "boundary-048",
      texte: "Appel d'offres pour système de gestion électronique des douanes",
      classe_attendue: "VALID",
      justification: "Appel d'offres + système spécialisé = marché technologique",
      frontiere: "secteurs_spécialisés", 
      signaux_positifs: ["appel d'offres", "système"],
      signaux_negatifs: []
    }
  ],

  // FRONTIÈRE 13: Échéances et Temporalité
  temporalite: [
    {
      id: "boundary-049",
      texte: "Appel d'offres clos pour construction école primaire - Résultats publiés",
      classe_attendue: "REJECTED",
      justification: "Appel d'offres clos = procédure terminée, plus d'opportunité",
      frontiere: "temporalité",
      signaux_positifs: [],
      signaux_negatifs: ["clos", "résultats publiés"]
    },
    {
      id: "boundary-050", 
      texte: "Préparation appel d'offres pour réhabilitation routes - Publication prochaine",
      classe_attendue: "REVIEW",
      justification: "Préparation = procédure future probable, modalités à surveiller",
      frontiere: "temporalité",
      signaux_positifs: ["appel d'offres"],
      signaux_negatifs: ["préparation", "prochaine"]
    },
    {
      id: "boundary-051",
      texte: "Extension délai soumission - Marché équipements informatiques jusqu'au 15 décembre",
      classe_attendue: "VALID",
      justification: "Extension délai = procédure active, opportunité encore ouverte",
      frontiere: "temporalité",
      signaux_positifs: ["marché", "extension délai"],
      signaux_negatifs: []
    }
  ]
};

// Compiler tous les cas
const allCases = [];
Object.entries(boundaryCases).forEach(([frontiere, cases]) => {
  cases.forEach(case_ => {
    allCases.push({
      ...case_,
      frontiere_principale: frontiere
    });
  });
});

console.log(`=== MATRICE DES CAS LIMITES V1 ===`);
console.log(`Total cas générés: ${allCases.length}`);

// Statistiques par classe
const byClass = {};
allCases.forEach(case_ => {
  if (!byClass[case_.classe_attendue]) byClass[case_.classe_attendue] = 0;
  byClass[case_.classe_attendue]++;
});

console.log(`\\nDistribution par classe:`);
Object.entries(byClass).forEach(([classe, count]) => {
  console.log(`  ${classe}: ${count} cas (${(count/allCases.length*100).toFixed(1)}%)`);
});

// Statistiques par frontière
const byFrontiere = {};
allCases.forEach(case_ => {
  if (!byFrontiere[case_.frontiere_principale]) byFrontiere[case_.frontiere_principale] = 0;
  byFrontiere[case_.frontiere_principale]++;
});

console.log(`\\nDistribution par frontière:`);
Object.entries(byFrontiere).forEach(([frontiere, count]) => {
  console.log(`  ${frontiere}: ${count} cas`);
});

// Sauvegarder la matrice
const matrixData = {
  metadata: {
    total_cases: allCases.length,
    creation_date: new Date().toISOString(),
    purpose: "Test boundary cases for Ground Truth Policy V1",
    usage: "Do NOT use for V2F training - validation only"
  },
  distribution: {
    by_class: byClass,
    by_frontier: byFrontiere
  },
  boundary_cases: allCases,
  validation_instructions: [
    "Each case tests specific boundary between classes",
    "Justification explains expected classification reasoning", 
    "Positive/negative signals help understand decision factors",
    "Cases are synthetic but realistic for Burkina Faso context",
    "Use for testing human/AI classifier consistency"
  ]
};

fs.writeFileSync('../data/BOUNDARY_CASES_MATRIX_V1.json', JSON.stringify(matrixData, null, 2));
console.log(`\\nMatrice sauvée dans: data/BOUNDARY_CASES_MATRIX_V1.json`);

// Afficher quelques exemples par frontière
console.log(`\\n=== EXEMPLES PAR FRONTIÈRE ===`);
Object.entries(boundaryCases).forEach(([frontiere, cases]) => {
  console.log(`\\n${frontiere.toUpperCase()}:`);
  cases.slice(0, 2).forEach(case_ => {
    console.log(`  ${case_.id}: "${case_.texte}"`);
    console.log(`    → ${case_.classe_attendue}: ${case_.justification}`);
  });
});

console.log(`\\n✅ Matrice de ${allCases.length} cas limites créée avec succès!`);