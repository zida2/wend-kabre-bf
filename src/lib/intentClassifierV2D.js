/**
 * CLASSIFICATEUR D'INTENTION V2D - VERSION FINALE PRODUCTION
 * ==========================================================
 * 
 * OBJECTIFS:
 * - Pollution ≤ 5% (actuellement 8.8%)
 * - Recall VALID ≥ 95% (maintenir 100%)
 * - Traitement intelligent des cas limites
 * 
 * AMÉLIORATIONS V2D:
 * - Détection avis de décès (principal source pollution)
 * - Distinction fine recrutement direct vs prestation
 * - Règles contextuelles renforcées
 * - Seuils adaptatifs par type de contenu
 */

/**
 * Classification intelligente avec analyse d'intention V2D
 * @param {string} title - Titre de l'avis
 * @param {string} description - Description de l'avis
 * @returns {Object} Résultat de classification
 */
export function classifyWithIntentAnalysisV2D(title, description = '') {
    const fullText = `${title} ${description}`.toLowerCase();
    
    const result = {
        classification: 'REVIEW',
        score: 0,
        confidence: 0,
        reasons: [],
        intentAnalysis: {
            recruitmentScore: 0,
            marketScore: 0,
            primaryIntent: 'UNKNOWN',
            isAmbiguous: false,
            contentType: 'GENERAL',
            recruitmentType: 'UNKNOWN'
        }
    };

    // ===== ÉTAPE 1: DÉTECTION CONTENUS NON-MARCHÉS =====
    
    // 🚫 AVIS DE DÉCÈS - Principal source de pollution
    const deathNoticePatterns = [
        /avis de d[eé]c[eè]s/i,
        /rappel [aà] dieu/i,
        /rappel au seigneur/i,
        /d[eé]c[eè]s.*ministre/i,
        /ministre.*d[eé]c[eé]d[eé]/i,
        /d[eé]c[eé]d[eé].*ministre/i
    ];
    
    if (deathNoticePatterns.some(pattern => pattern.test(fullText))) {
        result.classification = 'REJECTED';
        result.score = -5;
        result.confidence = 0.95;
        result.reasons.push('Avis de décès détecté → rejet automatique');
        result.intentAnalysis.contentType = 'DEATH_NOTICE';
        return result;
    }

    // 🚫 AUTRES CONTENUS NON-MARCHÉS
    const nonMarketPatterns = [
        /communiqu[eé] de presse/i,
        /avis.*inauguration/i,
        /inauguration.*officielle/i,
        /inauguration.*centre/i,
        /c[eé]r[eé]monie.*officielle/i,
        /c[eé]r[eé]monie.*inauguration/i,
        /inauguration.*complexe/i,
        /discours.*ministre/i,
        /visite.*officielle/i,
        /soutenance.*th[eè]se/i,
        /th[eè]se.*master/i,
        /th[eè]se.*doctorat/i,
        /universit[eé].*soutenance/i,
        /d[eé]cret.*nomination/i,
        /nomination.*minist[eè]re/i,
        /nomination.*directeur/i,
        /nomination.*général/i,
        /portant.*nomination/i
    ];
    
    if (nonMarketPatterns.some(pattern => pattern.test(fullText))) {
        result.classification = 'REJECTED';
        result.score = -3;
        result.confidence = 0.85;
        result.reasons.push('Contenu non-marché détecté → rejet');
        result.intentAnalysis.contentType = 'NON_MARKET';
        return result;
    }

    // ===== ÉTAPE 2: ANALYSE DES SIGNAUX D'INTENTION =====
    
    // Signaux de recrutement
    const recruitmentSignals = {
        'avis de recrutement': 4,
        'recrutement': 3,
        'poste vacant': 3,
        'offre d\'emploi': 3,
        'candidat': 2,
        'agent': 2,
        'personnel': 2,
        'emploi': 1,
        'cv': 1,
        'candidature': 1,
        'entretien': 1
    };
    
    // Signaux de marché
    const marketSignals = {
        'appel d\'offres': 4,
        'marché public': 4,
        'soumission': 3,
        'fourniture': 3,
        'acquisition': 3,
        'prestation': 2,
        'travaux': 2,
        'service': 1,
        'contrat': 1,
        'livraison': 1,
        'installation': 1
    };
    
    // Calcul des scores
    let recruitmentScore = 0;
    let marketScore = 0;
    
    for (const [signal, weight] of Object.entries(recruitmentSignals)) {
        if (fullText.includes(signal)) {
            recruitmentScore += weight;
        }
    }
    
    for (const [signal, weight] of Object.entries(marketSignals)) {
        if (fullText.includes(signal)) {
            marketScore += weight;
        }
    }
    
    result.intentAnalysis.recruitmentScore = recruitmentScore;
    result.intentAnalysis.marketScore = marketScore;

    // ===== ÉTAPE 3: TYPOLOGIE DU RECRUTEMENT =====
    
    let recruitmentType = 'UNKNOWN';
    
    // Recrutement direct (agent/employé)
    if (fullText.includes('agent') || fullText.includes('personnel') || 
        fullText.includes('emploi') || fullText.includes('poste')) {
        recruitmentType = 'DIRECT';
    }
    
    // Recrutement de prestataire (service externalisé)
    if (fullText.includes('prestation') || fullText.includes('service') || 
        fullText.includes('gardiennage') || fullText.includes('securite') ||
        fullText.includes('nettoyage') || fullText.includes('maintenance')) {
        recruitmentType = 'SERVICE_OUTSOURCING';
    }
    
    result.intentAnalysis.recruitmentType = recruitmentType;

    // ===== ÉTAPE 4: DÉTERMINATION INTENTION PRIMAIRE =====
    
    const ambiguityThreshold = 2;
    
    if (recruitmentScore >= ambiguityThreshold && marketScore >= ambiguityThreshold) {
        result.intentAnalysis.isAmbiguous = true;
        if (recruitmentType === 'SERVICE_OUTSOURCING') {
            result.intentAnalysis.primaryIntent = 'SERVICE_OUTSOURCING';
        } else {
            result.intentAnalysis.primaryIntent = 'AMBIGUOUS';
        }
    } else if (recruitmentScore > marketScore) {
        result.intentAnalysis.primaryIntent = 'RECRUITMENT';
    } else if (marketScore > recruitmentScore) {
        result.intentAnalysis.primaryIntent = 'MARKET';
    } else {
        result.intentAnalysis.primaryIntent = 'NEUTRAL';
    }

    // ===== ÉTAPE 5: CALCUL DU SCORE BASE =====
    
    let baseScore = 0;
    
    // Score basé sur les signaux marchés
    baseScore += marketScore * 0.4;
    
    // Bonus spécifiques
    if (fullText.includes('appel d\'offres') || fullText.includes('marché public')) {
        baseScore += 1.5;
        result.reasons.push('Marché public explicite → bonus');
    }
    
    if (fullText.includes('acquisition') || fullText.includes('fourniture')) {
        baseScore += 1;
        result.reasons.push('Acquisition/fourniture détectée → bonus');
    }
    
    if (fullText.includes('travaux')) {
        baseScore += 0.8;
        result.reasons.push('Travaux détectés → bonus');
    }
    
    // Bonus pour prestations de service légitimes
    if (fullText.includes('prestation de services') || fullText.includes('contrat de maintenance')) {
        baseScore += 1.2;
        result.reasons.push('Prestation de service détectée → bonus');
    }

    // ===== ÉTAPE 6: AJUSTEMENTS D'INTENTION =====
    
    let intentAdjustment = 0;
    
    if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
        // Recrutement de prestataire = marché déguisé
        intentAdjustment += 0; // Neutre
        result.reasons.push('Recrutement de prestataire → évaluation neutre');
    } else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && recruitmentType === 'DIRECT') {
        // Vrai recrutement direct
        intentAdjustment -= 2; // Pénalité renforcée V2D
        result.reasons.push('Recrutement direct → pénalité forte');
    } else if (result.intentAnalysis.primaryIntent === 'MARKET') {
        intentAdjustment += 0.5;
        result.reasons.push('Intention marché claire → bonus');
    }

    // ===== ÉTAPE 7: SCORE FINAL ET CLASSIFICATION =====
    
    const finalScore = baseScore + intentAdjustment;
    result.score = Math.round(finalScore * 100) / 100;
    
    // Seuils adaptatifs V2D
    const validThreshold = 2.0; // Légèrement plus strict
    const rejectThreshold = -1.0; // Plus tolérant
    
    // Logique de classification finale
    if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
        // Force en REVIEW sauf si score très élevé
        if (finalScore >= validThreshold + 1) {
            result.classification = 'VALID';
            result.reasons.push('Prestation avec score élevé → validation');
        } else {
            result.classification = 'REVIEW';
            result.reasons.push('Recrutement prestataire → révision manuelle');
        }
    } else if (finalScore >= validThreshold) {
        result.classification = 'VALID';
    } else if (finalScore <= rejectThreshold) {
        result.classification = 'REJECTED';
    } else {
        result.classification = 'REVIEW';
    }
    
    // Calcul de la confiance
    const maxPossibleScore = 10;
    const minPossibleScore = -5;
    const normalizedScore = (finalScore - minPossibleScore) / (maxPossibleScore - minPossibleScore);
    result.confidence = Math.round(Math.max(0.1, Math.min(0.9, normalizedScore)) * 100) / 100;
    
    return result;
}