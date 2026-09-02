import { verifyFirebaseToken } from '@/lib/authGuard';

export const maxDuration = 30;
export const runtime = 'nodejs';

// Moteur conversationnel intelligent basé sur ARCOP
function generateIntelligentResponse(messages, question) {
  const q = question.toLowerCase();
  const previousMessages = messages.slice(0, -1); // Tous les messages sauf le dernier
  const hasContext = previousMessages.length > 0;
  
  // Détection d'intentions
  const intent = detectIntent(q);
  
  switch (intent) {
    case 'GREETING':
      return handleGreeting(q, hasContext);
    
    case 'THANKS':
      return handleThanks(q, hasContext);
    
    case 'GOODBYE':
      return handleGoodbye(q);
    
    case 'DOCUMENTS':
      return handleDocuments(q);
    
    case 'SEUILS':
      return handleSeuils(q);
    
    case 'PREFERENCES':
      return handlePreferences(q);
    
    case 'METHODOLOGIE':
      return handleMethodologie(q);
    
    case 'OFFRE_TECHNIQUE':
      return handleOffreTechnique(q);
    
    case 'OFFRE_FINANCIERE':
      return handleOffreFinanciere(q);
    
    case 'DELAIS':
      return handleDelais(q);
    
    case 'ARCOP':
      return handleARCOP(q);
    
    case 'SOUMISSION':
      return handleSoumission(q);
    
    case 'GARANTIES':
      return handleGaranties(q);
    
    case 'EVALUATION':
      return handleEvaluation(q);
    
    case 'RESULTATS':
      return handleResultats(q);
    
    case 'RECLAMATIONS':
      return handleReclamations(q);
    
    case 'AIDE':
      return handleAide(q);
    
    default:
      return handleGeneral(q, previousMessages);
  }
}

function detectIntent(question) {
  const q = question.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/['']/g, "'"); // Normaliser apostrophes
  
  // Salutations et politesse (nombreuses variations)
  if (/^(bonjour|salut|hello|hi|bonsoir|hey|coucou|cc|slt|bjr|bsr|yo|wesh|comment|ca va|ça va|bonne journee|bon matin)/i.test(q)) {
    return 'GREETING';
  }
  
  // Remerciements
  if (/(merci|thank|remerci|cool|super|parfait|genial|ok merci|d'accord|compris)/i.test(q)) {
    return 'THANKS';
  }
  
  // Documents - Variations très étendues
  if (/(document|piece|attestation|papier|fournir|fourni|fourniture|certificat|dossier|justificatif|preuve|qu[\'e]?est[- ]?ce qu[\'e]? il faut|il me faut|besoin de|doit donner|doit presenter|presenter quoi|a preparer|a fournir|liste des|fichier|joindre|envoyer|remettre)/i.test(q)) {
    return 'DOCUMENTS';
  }
  
  // Seuils - Toutes les façons de demander les montants
  if (/(seuil|montant|million|prix|cout|valeur|combien|ca coute|c[\'e]? combien|tarif|budget|enveloppe|de quel ordre|categorie de marche|type de marche|quelle procedure|cotation|demande de prix|appel d[\'']offre|ao|dp)/i.test(q)) {
    return 'SEUILS';
  }
  
  // Préférences nationales - Toutes variations
  if (/(preference|pme|national|burkinabe|burkinabais|local|avantage|benefice|%|pourcent|marge|majoration|bonification|priorite|favoris|entreprise locale|soumissionnaire national|quota)/i.test(q)) {
    return 'PREFERENCES';
  }
  
  // Méthodologie - Approches variées
  if (/(method|structur|organis|planif|plan|approche|comment faire|comment proceder|demarche|etape|phase|process|strategie|technique a utiliser|facon de|maniere de)/i.test(q)) {
    return 'METHODOLOGIE';
  }
  
  // Offre technique - Synonymes multiples
  if (/(offre technique|partie technique|volet technique|technique|methodologie|equipe|moyen|materiel|personnel|ressource|competence|experience|reference|cv|qualification)/i.test(q)) {
    return 'OFFRE_TECHNIQUE';
  }
  
  // Offre financière - Vocabulaire financier
  if (/(offre financiere|partie financiere|volet financier|offre de prix|proposition financiere|prix|devis|bordereau|quantite|dpgf|bpu|estimation|coutant|facturation|chiffrage)/i.test(q)) {
    return 'OFFRE_FINANCIERE';
  }
  
  // Délais - Tout ce qui concerne le temps
  if (/(delai|date|quand|duree|temps|calendrier|echeance|limite|jusqu[\'a]? quand|combien de temps|periode|jour|mois|annee|validite|expiration)/i.test(q)) {
    return 'DELAIS';
  }
  
  // ARCOP et réglementation - Juridique
  if (/(arcop|loi|decret|arrete|reglementation|legal|juridique|code|texte|article|procedure|regle|norme|conforme|conformite)/i.test(q)) {
    return 'ARCOP';
  }
  
  // Soumission et dépôt - Processus
  if (/(soumission|soumissionner|deposer|depot|comment soumettre|ou deposer|comment participer|candidater|postuler|se porter candidat)/i.test(q)) {
    return 'SOUMISSION';
  }
  
  // Garanties et cautions
  if (/(garantie|caution|cautionnement|aval|assurance|bancaire|garantie bancaire|caution de soumission|caution provisoire|caution definitive)/i.test(q)) {
    return 'GARANTIES';
  }
  
  // Critères d'évaluation et notation
  if (/(critere|evaluation|notation|note|point|bareme|grille|ponderation|comment sont[- ]evalues|comment sont[- ]notes|comment sont[- ]juges)/i.test(q)) {
    return 'EVALUATION';
  }
  
  // Résultats et attribution
  if (/(resultat|attribution|gagnant|retenu|adjudicataire|notification|qui a gagne|proclamation|publication)/i.test(q)) {
    return 'RESULTATS';
  }
  
  // Réclamations et recours
  if (/(reclamation|recours|contester|contestation|plainte|litige|desaccord|probleme|injustice)/i.test(q)) {
    return 'RECLAMATIONS';
  }
  
  // Aide - Expressions variées
  if (/(aide|aider|aides[- ]moi|expliqu|explique|comprend|comprends pas|je ne sais pas|besoin|assistance|soutien|conseil|guide|peut[stu][- ]m[\'e]?|pouvez[- ]vous|peux[- ]tu)/i.test(q)) {
    return 'AIDE';
  }
  
  // Au revoir
  if (/(au revoir|bye|salut|a bientot|a plus|ciao|merci bye|ok bye)/i.test(q)) {
    return 'GOODBYE';
  }
  
  return 'GENERAL';
}

function handleGreeting(q, hasContext) {
  const responses = [
    "Bonjour ! 👋 Je suis ravi de vous aider avec vos questions sur les marchés publics au Burkina Faso. Que souhaitez-vous savoir ?",
    "Salut ! 🤖 Je suis votre assistant expert ARCOP. Posez-moi vos questions sur les documents, les seuils, la rédaction d'offres... Je suis là pour vous aider !",
    "Bonjour ! Bienvenue sur votre assistant marchés publics. Je connais toute la réglementation ARCOP 2024-2025. Comment puis-je vous accompagner aujourd'hui ?",
  ];
  
  if (hasContext) {
    return "Bonjour ! 😊 Content de vous revoir. Comment puis-je vous aider davantage ?";
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function handleThanks(q, hasContext) {
  const responses = [
    "De rien ! 😊 Je suis là pour ça. N'hésitez pas si vous avez d'autres questions sur les marchés publics !",
    "Avec plaisir ! 🤝 Si vous avez besoin d'autre chose, je reste à votre disposition.",
    "Content d'avoir pu vous aider ! 🎯 Revenez quand vous voulez pour d'autres questions.",
    "C'est mon rôle ! 💼 Bonne chance avec votre dossier de soumission !",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function handleGoodbye(q) {
  const responses = [
    "Au revoir ! 👋 Bonne chance avec vos marchés publics. Revenez quand vous voulez !",
    "À bientôt ! 🤖 N'hésitez pas à revenir si vous avez d'autres questions.",
    "Salut ! 😊 Bon succès dans vos soumissions !",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function handleSoumission(q) {
  let response = `📤 **Comment soumettre votre dossier** :\n\n`;
  response += `**OÙ DÉPOSER ?** 📍\n`;
  response += `• Au secrétariat de l'entité contractante (adresse dans le DAO)\n`;
  response += `• Par voie électronique si prévu (plateforme e-procurement)\n`;
  response += `• Dans l'urne ou boîte prévue à cet effet\n\n`;
  
  response += `**QUAND DÉPOSER ?** ⏰\n`;
  response += `• Avant la date et heure limite indiquée dans l'avis\n`;
  response += `• Même 1 minute de retard = disqualification automatique !\n`;
  response += `• Conseil : déposez 24h à l'avance par sécurité\n\n`;
  
  response += `**COMMENT PRÉSENTER ?** 📦\n`;
  response += `• Enveloppe fermée et scellée\n`;
  response += `• Mention "À ne pas ouvrir avant la séance d'ouverture"\n`;
  response += `• Références du marché (numéro, objet)\n`;
  response += `• Nom et adresse du soumissionnaire\n\n`;
  
  response += `**CONTENU** 📋\n`;
  response += `• Dossier administratif (pièces obligatoires)\n`;
  response += `• Offre technique\n`;
  response += `• Offre financière (souvent en enveloppe séparée)\n`;
  response += `• En nombre d'exemplaires requis (original + copies)\n\n`;
  
  response += `💡 **Astuce** : Faites une checklist complète avant de sceller l'enveloppe. Aucune modification ne sera acceptée après dépôt !`;
  
  return response;
}

function handleGaranties(q) {
  let response = `🏦 **Garanties et cautions dans les marchés publics** :\n\n`;
  response += `**1. CAUTION DE SOUMISSION** 💰\n`;
  response += `• **Montant** : 1% à 3% du montant de l'offre\n`;
  response += `• **Quand** : À joindre obligatoirement avec l'offre\n`;
  response += `• **Forme** : Garantie bancaire ou caution d'assurance\n`;
  response += `• **Validité** : 30 jours après validité de l'offre\n`;
  response += `• **But** : Preuve de sérieux du soumissionnaire\n\n`;
  
  response += `**2. CAUTION DE BONNE EXÉCUTION** ✅\n`;
  response += `• **Montant** : 5% à 10% du montant du marché\n`;
  response += `• **Quand** : Avant signature du contrat\n`;
  response += `• **Validité** : Pendant toute l'exécution + garantie\n`;
  response += `• **Restitution** : Après réception définitive\n`;
  response += `• **But** : Garantie de bonne exécution des travaux\n\n`;
  
  response += `**QUI PEUT DÉLIVRER ?** 🏢\n`;
  response += `• Banques agréées au Burkina Faso\n`;
  response += `• Compagnies d'assurance agréées\n`;
  response += `• Institutions financières reconnues\n\n`;
  
  response += `**FORME ACCEPTÉE** 📄\n`;
  response += `• Attestation originale (pas de photocopie)\n`;
  response += `• Référence au marché spécifique\n`;
  response += `• Signature et cachet de l'institution\n`;
  response += `• Caution à première demande (sans condition)\n\n`;
  
  response += `⚠️ **Important** : Sans caution valide, votre offre sera rejetée automatiquement !`;
  
  return response;
}

function handleEvaluation(q) {
  let response = `📊 **Critères d'évaluation des offres** :\n\n`;
  response += `**ÉTAPE 1 : ÉVALUATION ADMINISTRATIVE** 📋\n`;
  response += `• Conformité des pièces obligatoires\n`;
  response += `• Validité des attestations (< 3 mois)\n`;
  response += `• Présence de la caution de soumission\n`;
  response += `• **Si non conforme → Élimination directe**\n\n`;
  
  response += `**ÉTAPE 2 : ÉVALUATION TECHNIQUE** 🔧\n`;
  response += `• Compréhension du projet : 20-30 points\n`;
  response += `• Méthodologie : 25-35 points\n`;
  response += `• Planning : 10-15 points\n`;
  response += `• Équipe et moyens : 15-25 points\n`;
  response += `• Références similaires : 10-20 points\n`;
  response += `• **Note minimale requise : 70/100 généralement**\n\n`;
  
  response += `**ÉTAPE 3 : ÉVALUATION FINANCIÈRE** 💵\n`;
  response += `• Ouverture uniquement des offres qualifiées techniquement\n`;
  response += `• Vérification des calculs (erreurs = ajustement)\n`;
  response += `• Application des préférences nationales\n`;
  response += `• Prix anormalement bas → enquête\n`;
  response += `• Prix anormalement élevé → exclusion\n\n`;
  
  response += `**MÉTHODE DE SÉLECTION** 🎯\n`;
  response += `**Pour travaux complexes :**\n`;
  response += `• Note technique × 0.8 + Note financière × 0.2\n\n`;
  
  response += `**Pour fournitures simples :**\n`;
  response += `• Moins-disant qualifié (prix le plus bas)\n\n`;
  
  response += `💡 **Conseil** : Soignez autant le technique que le financier. Un prix bas ne suffit pas si la note technique est faible !`;
  
  return response;
}

function handleResultats(q) {
  let response = `🏆 **Résultats et attribution des marchés** :\n\n`;
  response += `**PUBLICATION DES RÉSULTATS** 📢\n`;
  response += `• Affichage au siège de l'entité contractante\n`;
  response += `• Publication sur le site web (si existant)\n`;
  response += `• Notification individuelle au(x) gagnant(s)\n`;
  response += `• Délai : Généralement 30 à 60 jours après ouverture\n\n`;
  
  response += `**CONTENU DE LA NOTIFICATION** 📄\n`;
  response += `• Nom de l'attributaire\n`;
  response += `• Montant du marché attribué\n`;
  response += `• Délai d'exécution\n`;
  response += `• Classement des soumissionnaires (parfois)\n\n`;
  
  response += `**SI VOUS ÊTES RETENU** ✅\n`;
  response += `1. Réception de la lettre de notification\n`;
  response += `2. Dépôt de la caution de bonne exécution\n`;
  response += `3. Signature du contrat (sous 15 jours)\n`;
  response += `4. Ordre de service de démarrage\n`;
  response += `5. Début des travaux/fournitures\n\n`;
  
  response += `**SI VOUS N'ÊTES PAS RETENU** ❌\n`;
  response += `• Demandez les résultats détaillés (débrief)\n`;
  response += `• Analysez vos points faibles\n`;
  response += `• Améliorez pour la prochaine fois\n`;
  response += `• Possibilité de recours (voir délais)\n\n`;
  
  response += `**RESTITUTION CAUTION** 💰\n`;
  response += `• Pour les non-retenus : sous 30 jours\n`;
  response += `• Pour l'attributaire : après signature du contrat\n\n`;
  
  response += `💡 **Astuce** : Même si vous ne gagnez pas, demandez toujours un retour pour vous améliorer !`;
  
  return response;
}

function handleReclamations(q) {
  let response = `⚖️ **Réclamations et recours** :\n\n`;
  response += `**DÉLAIS DE RECOURS** ⏰\n`;
  response += `• **10 jours** après publication des résultats provisoires\n`;
  response += `• Ou **15 jours** après notification individuelle\n`;
  response += `• Passé ce délai = recours irrecevable\n\n`;
  
  response += `**MOTIFS VALABLES** 📋\n`;
  response += `• Non-respect de la procédure réglementaire\n`;
  response += `• Erreur manifeste dans l'évaluation\n`;
  response += `• Discrimination ou favoritisme\n`;
  response += `• Vice de forme dans l'appel d'offres\n`;
  response += `• Non-application des critères annoncés\n\n`;
  
  response += `**PROCÉDURE** 📝\n`;
  response += `**1. Recours administratif préalable**\n`;
  response += `• Lettre recommandée à l'autorité contractante\n`;
  response += `• Exposé détaillé des griefs\n`;
  response += `• Preuves et documents à l'appui\n`;
  response += `• Réponse sous 15 jours\n\n`;
  
  response += `**2. Saisine de l'ARCOP**\n`;
  response += `• Si recours administratif insatisfaisant\n`;
  response += `• Dossier complet + chronologie\n`;
  response += `• Décision de l'ARCOP sous 30 jours\n\n`;
  
  response += `**3. Recours juridictionnel**\n`;
  response += `• En dernier recours\n`;
  response += `• Tribunal administratif compétent\n`;
  response += `• Assistance d'un avocat conseillée\n\n`;
  
  response += `**CONSEILS PRATIQUES** 💡\n`;
  response += `• Rassemblez toutes les preuves\n`;
  response += `• Restez factuel et professionnel\n`;
  response += `• Évitez les attaques personnelles\n`;
  response += `• Concentrez-vous sur la procédure\n`;
  response += `• Faites-vous assister si possible\n\n`;
  
  response += `⚠️ **Important** : Un recours abusif peut vous porter préjudice. Assurez-vous d'avoir des motifs solides !`;
  
  return response;
}

function handleDocuments(q) {
  // Extraction du montant si mentionné
  const montantMatch = q.match(/(\d+)\s*(million|m|fcfa)?/i);
  const montant = montantMatch ? parseInt(montantMatch[1]) : null;
  
  let response = `📋 **Pièces obligatoires pour tout marché** (validité < 3 mois) :\n\n`;
  response += `1️⃣ **Attestation fiscale** (DGI)\n`;
  response += `2️⃣ **Attestation CNSS** (Caisse Nationale de Sécurité Sociale)\n`;
  response += `3️⃣ **Attestation AJE** (Agrément Judiciaire des Entreprises)\n`;
  response += `4️⃣ **Attestation DRTSS** (Direction Régionale du Travail)\n`;
  response += `5️⃣ **Attestation RCCM** (Registre du Commerce)\n`;
  response += `6️⃣ **Certificat de non-faillite**\n\n`;
  
  if (montant) {
    if (montant >= 150) {
      response += `💡 **Pour un marché de ${montant}M FCFA** (appel d'offres), vous devez aussi fournir :\n`;
      response += `• Caution de soumission (1-3% du montant)\n`;
      response += `• Références de projets similaires\n`;
      response += `• Moyens humains et matériels\n\n`;
    } else if (montant >= 20) {
      response += `💡 **Pour un marché de ${montant}M FCFA** (demande de prix), ajoutez :\n`;
      response += `• Références d'expérience\n`;
      response += `• Capacités techniques\n\n`;
    }
  }
  
  response += `⚠️ **Important** : Toutes ces attestations doivent avoir **moins de 3 mois** à la date de soumission !\n\n`;
  response += `📖 Pour plus de détails, consultez le [Guide de Soumission complet](/guide-soumission).`;
  
  return response;
}

function handleSeuils(q) {
  let response = `💰 **Seuils des marchés publics** selon l'Art. 6 du Code ARCOP :\n\n`;
  response += `**TRAVAUX** 🏗️\n`;
  response += `• **< 1 million** : Cotation non formelle\n`;
  response += `• **1M à 20M** : Cotation formelle\n`;
  response += `• **20M à 150M** : Demande de prix\n`;
  response += `• **≥ 150M** : Appel d'offres\n\n`;
  
  response += `**FOURNITURES & SERVICES** 📦\n`;
  response += `• **< 500 000** : Cotation non formelle\n`;
  response += `• **500K à 15M** : Cotation formelle\n`;
  response += `• **15M à 100M** : Demande de prix\n`;
  response += `• **≥ 100M** : Appel d'offres\n\n`;
  
  response += `💡 **Conseil** : Plus le montant est élevé, plus le dossier doit être complet et détaillé !\n\n`;
  response += `Besoin d'aide pour préparer un dossier ? Je peux vous guider sur les documents nécessaires. 📋`;
  
  return response;
}

function handlePreferences(q) {
  let response = `🇧🇫 **Préférences nationales et avantages** :\n\n`;
  response += `**MARGE DE PRÉFÉRENCE**\n`;
  response += `• PME burkinabè : **+5%** 🏢\n`;
  response += `• Entreprise communautaire (UEMOA) : **+10%** 🌍\n`;
  response += `• Produits/services UEMOA : **+15%** 📦\n`;
  response += `• **Maximum cumulé : 20%**\n\n`;
  
  response += `**COMMENT ÇA MARCHE ?** 🤔\n`;
  response += `Si votre offre est 15% plus chère qu'un concurrent étranger, vous pouvez quand même gagner grâce aux préférences !\n\n`;
  
  response += `**EXEMPLE CONCRET** 💡\n`;
  response += `• Concurrent étranger : 100M FCFA\n`;
  response += `• Votre offre PME burkinabè : 104M FCFA\n`;
  response += `• Avec préférence +5% : 100M × 1.05 = 105M\n`;
  response += `• **Résultat : Vous gagnez !** 🎉\n\n`;
  response += `Ces avantages favorisent l'économie locale. En avez-vous d'autres questions sur ce sujet ?`;
  
  return response;
}

function handleMethodologie(q) {
  let response = `📝 **Comment structurer votre offre technique** :\n\n`;
  response += `**1. COMPRÉHENSION DU PROJET** 🎯\n`;
  response += `• Reformulez les besoins du client\n`;
  response += `• Identifiez les enjeux et contraintes\n`;
  response += `• Montrez que vous avez bien compris\n\n`;
  
  response += `**2. MÉTHODOLOGIE** 🔧\n`;
  response += `• Décrivez votre approche étape par étape\n`;
  response += `• Expliquez COMMENT vous allez faire\n`;
  response += `• Justifiez vos choix techniques\n\n`;
  
  response += `**3. PLANNING & ORGANISATION** 📅\n`;
  response += `• Calendrier détaillé (diagramme de Gantt)\n`;
  response += `• Répartition des tâches\n`;
  response += `• Points de contrôle qualité\n\n`;
  
  response += `**4. MOYENS** 👥\n`;
  response += `• Équipe : CV + organigramme\n`;
  response += `• Matériel : liste détaillée\n`;
  response += `• Sous-traitants éventuels\n\n`;
  
  response += `💡 **Astuce** : Soyez concret ! Évitez les généralités, donnez des détails spécifiques à ce projet.\n\n`;
  response += `Besoin d'aide sur une partie spécifique ? Demandez-moi !`;
  
  return response;
}

function handleOffreTechnique(q) {
  return handleMethodologie(q);
}

function handleOffreFinanciere(q) {
  let response = `💵 **Comment préparer votre offre financière** :\n\n`;
  response += `**ÉLÉMENTS À INCLURE** 📊\n`;
  response += `• Bordereau des prix unitaires\n`;
  response += `• Devis quantitatif et estimatif\n`;
  response += `• Détail des coûts (main d'œuvre, matériaux, etc.)\n`;
  response += `• Taxes (TVA, etc.)\n`;
  response += `• Total TTC en chiffres ET en lettres\n\n`;
  
  response += `**CONSEILS IMPORTANTS** ⚠️\n`;
  response += `1. **Pas d'erreurs de calcul** : Vérifiez 3 fois !\n`;
  response += `2. **Prix cohérents** : Ni trop bas, ni trop élevés\n`;
  response += `3. **Monnaie** : FCFA ou devise autorisée\n`;
  response += `4. **Validité** : Généralement 90 jours\n\n`;
  
  response += `💡 **Astuce** : L'offre financière est souvent ouverte APRÈS l'offre technique. Ne vous concentrez pas que sur le prix !\n\n`;
  response += `D'autres questions sur l'aspect financier ?`;
  
  return response;
}

function handleDelais(q) {
  let response = `⏰ **Délais importants à respecter** :\n\n`;
  response += `**VALIDITÉ DES DOCUMENTS** 📅\n`;
  response += `• Attestations : < 3 mois\n`;
  response += `• Caution de soumission : Selon DAO\n`;
  response += `• Offre financière : Généralement 90 jours\n\n`;
  
  response += `**DÉLAIS DE SOUMISSION** 🕐\n`;
  response += `• Appel d'offres : Minimum 30 jours\n`;
  response += `• Demande de prix : Minimum 15 jours\n`;
  response += `• Cotation : Selon urgence\n\n`;
  
  response += `**APRÈS SOUMISSION** ⏳\n`;
  response += `• Analyse des offres : 30-60 jours\n`;
  response += `• Notification : Sous 15 jours\n`;
  response += `• Signature du contrat : Variable\n\n`;
  
  response += `⚠️ **Important** : Un retard = disqualification automatique ! Anticipez toujours.\n\n`;
  response += `Une question sur un délai spécifique ?`;
  
  return response;
}

function handleARCOP(q) {
  let response = `📚 **Cadre réglementaire ARCOP 2024-2025** :\n\n`;
  response += `**TEXTES DE BASE** 📖\n`;
  response += `• **Loi n°005-2024/ALT** (20 avril 2024)\n`;
  response += `  → Loi fondamentale sur les marchés publics\n\n`;
  
  response += `• **Décret n°2024-1748** (31 décembre 2024)\n`;
  response += `  → Application de la loi\n\n`;
  
  response += `• **Arrêté n°2025-0323** (9 juillet 2025)\n`;
  response += `  → Modalités pratiques\n\n`;
  
  response += `**PRINCIPES FONDAMENTAUX** ⚖️\n`;
  response += `• Transparence\n`;
  response += `• Égalité de traitement\n`;
  response += `• Libre concurrence\n`;
  response += `• Efficacité de la commande publique\n\n`;
  
  response += `📖 Pour le texte complet et tous les détails, consultez le [Guide de Soumission](/guide-soumission).\n\n`;
  response += `Une question sur un article spécifique ?`;
  
  return response;
}

function handleAide(q) {
  let response = `🆘 **Je suis là pour vous aider !** Voici ce que je peux faire :\n\n`;
  response += `📋 **Documents** : Quelles pièces fournir\n`;
  response += `💰 **Seuils** : Cotation, demande de prix, appel d'offres\n`;
  response += `🇧🇫 **Préférences** : Avantages PME et nationaux\n`;
  response += `📝 **Offre technique** : Structure et méthodologie\n`;
  response += `💵 **Offre financière** : Devis et bordereau de prix\n`;
  response += `⏰ **Délais** : Validité documents et soumission\n`;
  response += `📚 **Réglementation** : ARCOP, lois, décrets\n\n`;
  
  response += `💡 **Exemples de questions** :\n`;
  response += `• "Quels documents pour un marché de 50M ?"\n`;
  response += `• "Comment calculer la préférence PME ?"\n`;
  response += `• "Comment structurer ma méthodologie ?"\n\n`;
  response += `Posez-moi votre question, je vous réponds immédiatement ! 😊`;
  
  return response;
}

function handleGeneral(question, previousMessages) {
  // Analyse sémantique plus poussée
  const q = question.toLowerCase();
  
  // Questions partielles ou mal formées
  if (q.length < 3) {
    return "🤔 Votre question est un peu courte. Pourriez-vous développer un peu ? Je suis là pour vous aider sur les marchés publics !";
  }
  
  // Détection de confusion ou incompréhension
  if (/(sais pas|connais pas|comprend pas|c[\'e]?est quoi|qu[\'e]?est[- ]?ce|confus|perdu)/i.test(q)) {
    return `Je sens que vous avez besoin d'orientation ! 🧭 Pas de souci, je suis là pour ça.\n\n**Voici ce que je peux vous expliquer** :\n\n📋 **Documents** : "Quels papiers fournir ?"\n💰 **Seuils** : "C'est quoi cotation, demande de prix, appel d'offres ?"\n🇧🇫 **Préférences PME** : "Quel avantage pour les entreprises locales ?"\n📝 **Rédaction offres** : "Comment faire une bonne offre technique ?"\n📤 **Soumission** : "Comment et où déposer mon dossier ?"\n🏦 **Cautions** : "C'est quoi une caution de soumission ?"\n📊 **Évaluation** : "Comment les offres sont notées ?"\n\nChoisissez un sujet et posez votre question, même de manière simple ! 😊`;
  }
  
  // Questions sur la difficulté ou complexité
  if (/(difficile|compliqu|dur|complexe|galere|chiant)/i.test(q)) {
    return `Je comprends que ça peut sembler compliqué au début ! 😅 Mais pas de panique, c'est mon rôle de simplifier tout ça.\n\n**Décomposons ensemble** :\n\n1️⃣ **Identifiez votre marché** : Quel est son montant ?\n2️⃣ **Connaissez la procédure** : Cotation, demande de prix, ou appel d'offres ?\n3️⃣ **Rassemblez les documents** : Je vous donne la liste exacte\n4️⃣ **Rédigez votre offre** : Je vous guide étape par étape\n5️⃣ **Déposez dans les délais** : Je vous explique comment\n\n💡 **Commençons par le début** : De quel montant de marché parlez-vous approximativement ?`;
  }
  
  // Référence à un marché spécifique
  if (/(un marche|ce marche|le marche|mon marche|ma soumission)/i.test(q)) {
    return `Vous parlez d'un marché spécifique ! 📋 Super, je peux vous aider de manière précise.\n\n**Pour vous guider au mieux, dites-moi** :\n\n1. **Le montant** : environ combien de millions de FCFA ?\n2. **Le type** : travaux, fournitures, ou services ?\n3. **Votre besoin** : documents, rédaction offre, délais... ?\n\n**Exemples de questions précises** :\n• "Quels documents pour un marché de travaux de 80M ?"\n• "Comment structurer une offre technique pour des fournitures de 25M ?"\n• "Quels délais pour soumettre sur un marché de 150M ?"`;
  }
  
  // Questions sur le "comment gagner"
  if (/(gagner|remporter|reussir|chance|probabilite|tips|astuce|secret)/i.test(q)) {
    return `Excellente question ! 🎯 Voici mes **meilleurs conseils** pour maximiser vos chances :\n\n**1. DOSSIER IMPECCABLE** 📋\n• Toutes les pièces valides (< 3 mois)\n• Aucun document manquant\n• Caution de soumission conforme\n\n**2. OFFRE TECHNIQUE SOLIDE** 📝\n• Compréhension parfaite du besoin\n• Méthodologie détaillée et réaliste\n• Équipe et moyens adaptés\n• Références pertinentes\n\n**3. PRIX COMPÉTITIF MAIS RÉALISTE** 💰\n• Ni trop bas (suspicion), ni trop haut\n• Calculs exacts (vérifiez 3 fois !)\n• Profitez des préférences PME si applicable\n\n**4. PRÉSENTATION PROFESSIONNELLE** 🎨\n• Dossier bien organisé\n• Sommaire clair\n• Documents lisibles\n• Respect des formats demandés\n\n**5. ANTICIPATION** ⏰\n• Déposez 24h avant la limite\n• Vérifiez tout avant de sceller\n• Gardez des copies\n\nQuelle partie voulez-vous approfondir ?`;
  }
  
  // Expression de frustration ou échec
  if (/(perdu|rate|refuse|rejete|elimine|pas retenu)/i.test(q)) {
    return `Je sens une frustration... 😔 C'est normal, la compétition est rude. Mais chaque échec est une leçon !\n\n**Pourquoi les offres sont refusées** :\n\n❌ **Raisons administratives** (60% des cas)\n• Document manquant ou périmé\n• Caution absente ou non conforme\n• Erreur de signature\n\n❌ **Raisons techniques** (30%)\n• Méthodologie faible ou générique\n• Moyens insuffisants\n• Note < 70/100\n\n❌ **Raisons financières** (10%)\n• Prix anormalement bas\n• Erreurs de calcul importantes\n• Prix hors budget\n\n**ACTIONS À MENER** 💪\n1. Demandez le rapport d'évaluation détaillé\n2. Identifiez vos points faibles\n3. Améliorez votre dossier pour la prochaine fois\n4. N'hésitez pas à demander conseil (je suis là !)\n\nQue voulez-vous améliorer pour votre prochaine soumission ?`;
  }
  
  // Questions sur les coûts ou frais
  if (/(ca coute|frais|payer|payant|gratuit|argent a debourser)/i.test(q)) {
    return `💵 **Les frais dans les marchés publics** :\n\n**FRAIS OBLIGATOIRES** 💳\n• **Dossier d'Appel d'Offres (DAO)** : Généralement gratuit ou frais minimes (5 000 à 50 000 FCFA)\n• **Caution de soumission** : 1-3% du montant (ex: 500 000 FCFA pour un marché de 50M)\n• **Timbre fiscal** : Variable selon documents\n\n**FRAIS FACULTATIFS** 📋\n• Assistance d'un consultant : Variable (100 000 à plusieurs millions selon complexité)\n• Traductions certifiées : Si documents étrangers\n• Frais bancaires : Pour cautions et garanties\n\n**GRATUIT** ✅\n• Consultation des avis de marchés\n• Dépôt du dossier\n• Assistance ARCOP (conseil réglementaire)\n• Mon assistance ici ! 🤖\n\n💡 **Conseil** : Le coût principal est votre temps. Prévoyez 1 à 3 semaines pour un dossier complet de qualité.\n\nD'autres questions sur les aspects financiers ?`;
  }
  
  // Analyse de mots-clés résiduels
  if (/comment|pourquoi|quoi|quel/i.test(q)) {
    return `Je détecte une question, mais je n'ai pas saisi exactement ce que vous cherchez. 🤔\n\n**Pour mieux vous aider, reformulez en mentionnant** :\n\n• 📋 **Documents** → "Quels papiers fournir ?"\n• 💰 **Montants** → "Quels sont les seuils ?"\n• 📝 **Rédaction** → "Comment faire une offre technique ?"\n• 🇧🇫 **Avantages PME** → "Quelle préférence nationale ?"\n• 📤 **Dépôt** → "Comment soumettre ?"\n• 🏦 **Cautions** → "C'est quoi les garanties ?"\n• ⏰ **Délais** → "Combien de temps ?"\n\nOu tapez simplement "**aide**" pour voir tout ce que je peux faire ! 😊`;
  }
  
  // Réponse par défaut plus engageante
  return `🤖 Je suis votre assistant spécialisé en **marchés publics burkinabè** !\n\n**Je n'ai pas bien compris votre question**, mais ne partez pas ! 😊\n\n**Essayez de poser votre question autrement**, par exemple :\n• "Je veux soumissionner, comment faire ?"\n• "C'est quoi les papiers obligatoires ?"\n• "Combien coûte un marché de 30 millions ?"\n• "Comment avoir l'avantage PME ?"\n\n**Ou choisissez un thème** :\n📋 Documents • 💰 Seuils • 📝 Offres • 🇧🇫 Préférences • 📤 Soumission • 🏦 Cautions • 📊 Évaluation\n\nTapez "**aide**" pour voir absolument tout ce que je peux faire pour vous ! 💪`;
}

export async function POST(req) {
  console.log('[Chat API] Request reçue');
  
  try {
    // Accès réservé aux utilisateurs connectés
    const authResult = await verifyFirebaseToken(req);
    if (!authResult.ok) {
      console.log('[Chat API] Auth failed');
      return new Response(JSON.stringify({ error: 'Connexion requise' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('[Chat API] Auth OK:', authResult.uid);

    // Vérification Premium
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      
      if (projectId && apiKey) {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${authResult.uid}?key=${apiKey}`;
        const userResponse = await fetch(firestoreUrl);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const isSubscribed = userData?.fields?.isSubscribed?.booleanValue;
          console.log('[Chat API] isSubscribed:', isSubscribed);
          
          if (!isSubscribed) {
            console.log('[Chat API] Premium check FAILED');
            return new Response(JSON.stringify({ 
              error: 'L\'Assistant IA est réservé aux abonnés Premium. Consultez /tarifs.' 
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (premiumError) {
      console.error('[Chat API] Premium check error:', premiumError);
    }

    const body = await req.json();
    const { messages } = body;
    
    console.log('[Chat API] Messages count:', messages?.length);

    const systemPrompt = `Tu es un expert en marchés publics au Burkina Faso. Tu aides les entreprises à préparer leurs offres conformes aux normes ARCOP 2024-2025.

CADRE RÉGLEMENTAIRE :
- Loi n°005-2024/ALT (20 avril 2024)
- Décret n°2024-1748 (31 décembre 2024)
- Arrêté n°2025-0323 (9 juillet 2025)

PIÈCES OBLIGATOIRES (< 3 mois) :
1. Attestation fiscale (DGI)
2. Attestation CNSS
3. Attestation AJE
4. Attestation DRTSS
5. Attestation RCCM
6. Certificat non-faillite

SEUILS (Art. 6) :
< 1M : Cotation non formelle
1M-20M : Cotation formelle
20M-150M travaux : Demande de prix
≥150M travaux : Appel d'offres

PRÉFÉRENCES :
PME burkinabè : +5%
Communautaire : +10%
Produits UEMOA : +15%
Max cumulé : 20%

TON RÔLE :
- Citer les articles de loi
- Renvoyer au /guide-soumission
- Être précis et professionnel
- Répondre en français

Réponds de manière concise et professionnelle.`;

    console.log('[Chat API] Calling intelligent response engine...');
    
    // Utiliser le moteur conversationnel intelligent
    const lastMessage = messages[messages.length - 1];
    const aiResponse = generateIntelligentResponse(messages, lastMessage.content);
    
    console.log('[Chat API] Response OK');

    // Retourner la réponse au format attendu par le client
    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: aiResponse,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('[Chat API] Fatal error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur: ${error?.message || 'Une erreur est survenue'}`,
        details: error?.name || 'Unknown'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
