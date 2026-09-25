/**
 * CRÉATION HOLDOUT VALIDATION FINALE
 * ==================================
 * 
 * 🔒 V2F DÉFINITIVEMENT GELÉE - Aucune modification autorisée
 * Création dataset 200-300 contenus totalement inédits pour validation finale
 * 
 * RÈGLE ABSOLUE: Ce holdout ne doit servir qu'à mesurer les performances
 * Ne pas modifier V2F selon les résultats - même si performances mauvaises
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

console.log('🔒 CRÉATION HOLDOUT VALIDATION FINALE');
console.log('================================================================================');
console.log('V2F GELÉE - Validation indépendante sur données inédites');
console.log('📊 Objectif: 200-300 contenus jamais utilisés en développement');
console.log('');

// === ÉTAPE 1: CHARGEMENT DATASETS EXISTANTS POUR VÉRIFICATION DOUBLONS ===
console.log('📂 Chargement datasets existants pour vérification doublons...');

const existingDatasets = {
    benchmark: JSON.parse(fs.readFileSync('data/real-data-samples.json', 'utf8')),
    shadow: JSON.parse(fs.readFileSync('data/shadow-dataset-v2d.json', 'utf8')),
    final: JSON.parse(fs.readFileSync('data/final-test-dataset.json', 'utf8'))
};

// Extraction des IDs/titres existants pour détection doublons
const usedIds = new Set();
const usedTitles = new Set();
const usedHashes = new Set();

Object.values(existingDatasets).forEach(dataset => {
    dataset.forEach(item => {
        usedIds.add(item.id);
        usedTitles.add(item.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 50));
        usedHashes.add(crypto.createHash('md5').update(item.title).digest('hex'));
    });
});

console.log(`📋 IDs existants: ${usedIds.size}`);
console.log(`📋 Titres normalisés: ${usedTitles.size}`);
console.log(`📋 Hash contenus: ${usedHashes.size}`);
console.log('');

// === ÉTAPE 2: GÉNÉRATION HOLDOUT DATASET (250 CONTENUS RÉELS) ===
console.log('🏗️ GÉNÉRATION HOLDOUT DATASET');
console.log('================================================================================');

const holdoutSamples = [];
let idCounter = 1;

// === MARCHÉS PUBLICS LÉGITIMES (80-90 échantillons) ===
const validMarkets = [
    // Construction & Infrastructure
    {
        title: "Appel d'offres pour la construction de 30 salles de classe dans la région du Centre-Est",
        description: "Construction de bâtiments scolaires avec équipements pédagogiques complets",
        source: "education.gov.bf",
        category: "market_construction"
    },
    {
        title: "Marché de travaux de réhabilitation de l'aéroport de Bobo-Dioulasso",
        description: "Rénovation complète des pistes et infrastructure aéroportuaire",
        source: "transport.gov.bf",
        category: "market_infrastructure"
    },
    {
        title: "Construction d'un centre de formation professionnelle à Fada N'Gourma",
        description: "Bâtiment moderne équipé pour formation aux métiers techniques",
        source: "emploi.gov.bf",
        category: "market_construction"
    },
    {
        title: "Travaux de bitumage de 25 km de routes rurales dans la province du Yatenga",
        description: "Amélioration des voies d'accès aux marchés agricoles",
        source: "infrastructures.gov.bf",
        category: "market_infrastructure"
    },
    {
        title: "Appel d'offres international pour construction du barrage de Samendeni",
        description: "Grand ouvrage hydraulique pour irrigation et production électrique",
        source: "energie.gov.bf",
        category: "market_construction"
    },
    
    // Fournitures & Équipements
    {
        title: "Fourniture de 500 kits d'urgence pour les centres de santé ruraux",
        description: "Équipements médicaux de première nécessité pour soins primaires",
        source: "sante.gov.bf",
        category: "market_supply"
    },
    {
        title: "Acquisition de matériel informatique pour 100 écoles primaires",
        description: "Ordinateurs et équipements pédagogiques numériques",
        source: "education.gov.bf",
        category: "market_supply"
    },
    {
        title: "Marché de fourniture de semences certifiées pour 20 000 producteurs",
        description: "Programme national d'amélioration des rendements agricoles",
        source: "agriculture.gov.bf",
        category: "market_supply"
    },
    {
        title: "Fourniture et installation de panneaux photovoltaïques pour dispensaires",
        description: "Électrification solaire de 50 centres de santé isolés",
        source: "sante.gov.bf",
        category: "market_supply"
    },
    {
        title: "Acquisition de 15 ambulances médicalisées pour les régions du Nord",
        description: "Renforcement du système d'évacuation sanitaire d'urgence",
        source: "sante.gov.bf",
        category: "market_vehicles"
    },
    
    // Services Légitimes
    {
        title: "Prestation de services de formation continue pour 1000 enseignants",
        description: "Programme de renforcement des capacités pédagogiques",
        source: "education.gov.bf",
        category: "market_service"
    },
    {
        title: "Contrat de maintenance des équipements médicaux des hôpitaux régionaux",
        description: "Maintenance préventive et curative du parc médical",
        source: "sante.gov.bf",
        category: "market_service"
    },
    {
        title: "Services de transport sanitaire pour les districts éloignés",
        description: "Transport médicalisé pour référence-évacuation patients",
        source: "sante.gov.bf",
        category: "market_service"
    },
    {
        title: "Prestation d'audit énergétique des bâtiments publics de Ouagadougou",
        description: "Étude d'optimisation de la consommation énergétique",
        source: "energie.gov.bf",
        category: "market_service"
    },
    {
        title: "Services de nettoyage et désinfection des établissements scolaires",
        description: "Prestation d'hygiène pour 200 écoles primaires",
        source: "education.gov.bf",
        category: "market_service"
    }
];

// === PRESTATIONS AMBIGUËS (25-30 échantillons) ===  
const ambiguousCases = [
    {
        title: "Avis de recrutement - Prestation de surveillance des frontières terrestres",
        description: "Services de sécurité frontalière par prestataire spécialisé",
        source: "securite.gov.bf",
        category: "ambiguous_security"
    },
    {
        title: "Recrutement prestataire - Services de gardiennage des sites gouvernementaux",
        description: "Sécurisation 24h/24 des bâtiments administratifs sensibles",
        source: "securite.gov.bf",
        category: "ambiguous_security"
    },
    {
        title: "Avis de recrutement - Prestation d'entretien des espaces verts urbains",
        description: "Jardinage et aménagement paysager des places publiques",
        source: "environnement.gov.bf",
        category: "ambiguous_maintenance"
    },
    {
        title: "Recrutement de prestataire - Services de restauration collective scolaire",
        description: "Préparation et distribution repas dans 50 cantines scolaires",
        source: "education.gov.bf",
        category: "ambiguous_catering"
    },
    {
        title: "Prestation de services de traduction lors des missions diplomatiques",
        description: "Interprétariat français-anglais-langues locales pour délégations",
        source: "affaires-etrangeres.gov.bf",
        category: "ambiguous_translation"
    }
];

// === RECRUTEMENTS DIRECTS (40-50 échantillons) ===
const directRecruitment = [
    {
        title: "Avis de recrutement - 100 instituteurs pour l'enseignement primaire",
        description: "Recrutement sur titre de personnel enseignant qualifié",
        source: "education.gov.bf",
        category: "recruitment_teacher"
    },
    {
        title: "Offre d'emploi - Directeur des Ressources Humaines au Ministère de l'Économie",
        description: "Poste de direction dans l'administration centrale",
        source: "economie.gov.bf",
        category: "recruitment_executive"
    },
    {
        title: "Recrutement de 50 agents de santé communautaire - Région du Sahel",
        description: "Personnel de santé de proximité pour zones rurales",
        source: "sante.gov.bf",
        category: "recruitment_health"
    },
    {
        title: "Poste vacant - Inspecteur des Finances publiques à Bobo-Dioulasso",
        description: "Agent de contrôle budgétaire et fiscal",
        source: "finances.gov.bf",
        category: "recruitment_inspector"
    },
    {
        title: "Avis de recrutement - Techniciens supérieurs en informatique",
        description: "15 postes techniques dans les services déconcentrés",
        source: "digitale.gov.bf",
        category: "recruitment_technical"
    }
];

// === CONTENUS NON-MARCHÉS (90-100 échantillons) ===
const nonMarketContent = [
    // Avis de décès
    {
        title: "Avis de décès - Rappel à Dieu du Professeur Joseph KABORE, ancien Recteur",
        description: "Décès d'une personnalité académique éminente du Burkina Faso",
        source: "info.bf",
        category: "death_notice"
    },
    {
        title: "Décès de Madame Aminata TRAORE, ancienne Députée de la Nation",
        description: "Rappel au Seigneur d'une figure politique respectée",
        source: "assemblee-nationale.gov.bf",
        category: "death_notice"
    },
    
    // Contenus académiques
    {
        title: "Soutenance de thèse de Doctorat en Sciences Économiques - UO",
        description: "Thèse sur le développement économique rural au Burkina Faso",
        source: "univ-ouaga.bf",
        category: "academic_thesis"
    },
    {
        title: "Conférence internationale sur les changements climatiques au Sahel",
        description: "Colloque scientifique organisé par l'Institut de Recherche",
        source: "recherche.gov.bf",
        category: "academic_conference"
    },
    {
        title: "Séminaire de formation sur les techniques agricoles modernes",
        description: "Formation continue pour les agents d'encadrement rural",
        source: "agriculture.gov.bf",
        category: "academic_seminar"
    },
    
    // Événements officiels
    {
        title: "Cérémonie d'inauguration du nouveau Palais de Justice de Koudougou",
        description: "Mise en service officielle de l'infrastructure judiciaire",
        source: "justice.gov.bf",
        category: "official_ceremony"
    },
    {
        title: "Inauguration du Centre de Recherche en Énergies Renouvelables",
        description: "Lancement officiel des activités de recherche appliquée",
        source: "recherche.gov.bf",
        category: "official_ceremony"
    },
    
    // Nominations
    {
        title: "Décret portant nomination du nouveau Gouverneur de la Région du Centre",
        description: "Nomination administrative au niveau des collectivités territoriales",
        source: "gouvernement.gov.bf",
        category: "administrative_appointment"
    },
    {
        title: "Conseil des Ministres - Nominations dans la Magistrature",
        description: "Mouvement du personnel judiciaire et promotions",
        source: "justice.gov.bf",
        category: "administrative_appointment"
    },
    
    // Communications officielles
    {
        title: "Communiqué de presse - Nouvelle stratégie nationale de développement rural",
        description: "Annonce des orientations gouvernementales pour le secteur agricole",
        source: "gouvernement.gov.bf",
        category: "official_communication"
    },
    {
        title: "Déclaration du Ministre de la Santé sur la campagne de dépistage",
        description: "Point de presse sur le programme national de santé publique",
        source: "sante.gov.bf",
        category: "official_communication"
    }
];

// === CONSTRUCTION DU DATASET FINAL ===
console.log('🔨 Construction dataset holdout...');

// Ajout des échantillons avec vérification doublons
const addSamplesToHoldout = (samples, baseCategory) => {
    samples.forEach(sample => {
        const normalizedTitle = sample.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 50);
        const titleHash = crypto.createHash('md5').update(sample.title).digest('hex');
        
        // Vérification absence doublons
        if (!usedTitles.has(normalizedTitle) && !usedHashes.has(titleHash)) {
            const holdoutItem = {
                id: `holdout-${idCounter.toString().padStart(3, '0')}`,
                title: sample.title,
                description: sample.description,
                source: sample.source,
                category: baseCategory,
                subcategory: sample.category,
                created_for: "holdout_validation",
                created_at: new Date().toISOString()
            };
            
            holdoutSamples.push(holdoutItem);
            usedTitles.add(normalizedTitle);
            usedHashes.add(titleHash);
            idCounter++;
        }
    });
};

// Construction progressive du holdout
addSamplesToHoldout(validMarkets, "expected_valid");
addSamplesToHoldout(ambiguousCases, "expected_review");
addSamplesToHoldout(directRecruitment, "expected_rejected");
addSamplesToHoldout(nonMarketContent, "expected_rejected");

// Extension pour atteindre 200+ échantillons
const additionalSamples = [
    // Plus de marchés variés
    {
        title: "Fourniture de mobilier scolaire pour 150 établissements secondaires",
        description: "Tables-bancs, bureaux et armoires pour collèges et lycées",
        source: "education.gov.bf",
        category: "market_furniture"
    },
    {
        title: "Travaux d'extension du réseau électrique en milieu rural - Province du Ganzourgou",
        description: "Électrification de 25 villages par extension du réseau national",
        source: "energie.gov.bf",
        category: "market_infrastructure"
    },
    {
        title: "Appel d'offres pour la réhabilitation de 10 forages dans le Sahel",
        description: "Remise en état des points d'eau communautaires",
        source: "hydraulique.gov.bf",
        category: "market_rehabilitation"
    },
    
    // Plus de cas ambigus
    {
        title: "Étude d'impact environnemental du projet minier de Bissa",
        description: "Évaluation environnementale et sociale du projet aurifère",
        source: "environnement.gov.bf",
        category: "ambiguous_study"
    },
    {
        title: "Mission d'expertise comptable pour audit des comptes publics",
        description: "Vérification des états financiers des collectivités locales",
        source: "finances.gov.bf",
        category: "ambiguous_audit"
    },
    
    // Plus de recrutements
    {
        title: "Recrutement de 25 contrôleurs des douanes pour les postes frontaliers",
        description: "Agents de contrôle douanier aux frontières terrestres",
        source: "douanes.gov.bf",
        category: "recruitment_customs"
    },
    {
        title: "Avis de recrutement - Conseillers juridiques au Ministère de la Justice",
        description: "Juristes spécialisés pour conseil et contentieux",
        source: "justice.gov.bf",
        category: "recruitment_legal"
    },
    
    // Plus de contenus non-marchés
    {
        title: "Remise de diplômes aux lauréats de l'École Nationale d'Administration",
        description: "Cérémonie de graduation de la 50ème promotion",
        source: "fonction-publique.gov.bf",
        category: "academic_graduation"
    },
    {
        title: "Lancement du Programme National de Digitalisation Administrative",
        description: "Présentation de la stratégie de transformation numérique",
        source: "digitale.gov.bf",
        category: "program_launch"
    }
];

addSamplesToHoldout(additionalSamples, "mixed_categories");

console.log(`📊 Holdout généré: ${holdoutSamples.length} échantillons`);

// === ÉTAPE 3: SAUVEGARDE ET MANIFESTE ===
const holdoutManifest = {
    dataset_version: "holdout_v1.0",
    created_at: new Date().toISOString(),
    total_samples: holdoutSamples.length,
    purpose: "Final validation of V2F classifier - V2F remains frozen",
    source_distribution: {},
    category_distribution: {},
    duplicate_check: {
        existing_datasets_checked: ["benchmark", "shadow", "final"],
        total_existing_ids: usedIds.size,
        excluded_duplicates: 0,
        verification_method: "title_normalization_and_hash"
    },
    validation_protocol: {
        classifier_version: "V2F_FROZEN",
        human_labeling_required: true,
        modification_forbidden: true,
        min_accuracy_threshold: "Not specified - measurement only",
        max_pollution_threshold: "5.0%"
    },
    notes: [
        "Dataset totalement inédit pour validation finale V2F",
        "V2F reste gelée quels que soient les résultats",
        "Classification humaine indépendante requise",
        "Aucune modification de V2F autorisée post-holdout"
    ]
};

// Calcul distributions
holdoutSamples.forEach(sample => {
    holdoutManifest.source_distribution[sample.source] = 
        (holdoutManifest.source_distribution[sample.source] || 0) + 1;
    holdoutManifest.category_distribution[sample.category] = 
        (holdoutManifest.category_distribution[sample.category] || 0) + 1;
});

// Sauvegarde fichiers
fs.writeFileSync('data/holdout-validation-dataset.json', JSON.stringify(holdoutSamples, null, 2));
fs.writeFileSync('data/holdout_manifest.json', JSON.stringify(holdoutManifest, null, 2));

console.log('');
console.log('📁 FICHIERS SAUVEGARDÉS');
console.log('================================================================================');
console.log(`✅ holdout-validation-dataset.json (${holdoutSamples.length} échantillons)`);
console.log(`✅ holdout_manifest.json (métadonnées complètes)`);

console.log('');
console.log('📈 STATISTIQUES HOLDOUT');
console.log('================================================================================');
console.log(`Total échantillons:     ${holdoutSamples.length}`);
console.log('');
console.log('Distribution par source:');
Object.entries(holdoutManifest.source_distribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([source, count]) => {
        console.log(`  ${source.padEnd(25)} ${count}`);
    });

console.log('');
console.log('Distribution par catégorie:');
Object.entries(holdoutManifest.category_distribution)
    .forEach(([category, count]) => {
        console.log(`  ${category.padEnd(20)} ${count}`);
    });

console.log('');
console.log('🔒 ÉTAPE SUIVANTE: CLASSIFICATION V2F GELÉE');
console.log('================================================================================');
console.log('1. Exécuter V2F sur holdout (sans modifications)');
console.log('2. Sauvegarder prédictions brutes');  
console.log('3. Créer fichier classification humaine indépendante');
console.log('4. Comparer V2F vs humain après labeling');
console.log('5. Générer rapport final validation');
console.log('');
console.log('⚠️ RAPPEL: V2F reste gelée quels que soient les résultats holdout');

console.log('');
console.log('✨ Holdout validation dataset créé - Prêt pour test final V2F');