/**
 * CLASSIFICATEUR D'INTENTION V2E - CORRECTIONS CIBLÉES POST-SHADOW
 * ================================================================
 * 
 * Développé à partir de l'analyse des 8 erreurs du shadow test V2D
 * V2D reste figée - V2E corrige uniquement les causes racines identifiées
 * 
 * CORRECTIONS V2E basées sur l'analyse shadow:
 * 1. SCORE_ZERO_DEFAULT_REVIEW (5 cas) → Logique intelligente Score=0
 * 2. SEUIL_VALID_TROP_STRICT (3 cas) → Seuils adaptatifs prestations
 * 3. COMMUNICATION_NON_DETECTEE (2 cas) → Patterns étendus communications
 * 4. ACADEMIQUE_PARTIEL (1 cas) → Patterns conférences scientifiques  
 * 5. NOMINATION_INCOMPLETE (1 cas) → Patterns nominations gouvernement
 */

/**
 * Classification intelligente avec analyse d'intention V2E
 * @param {string} title - Titre de l'avis
 * @param {string} description - Description de l'avis  
 * @returns {Object} Résultat de classification
 */
export function classifyWithIntentAnalysisV2E(title, description = '') {
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

    // ===== ÉTAPE 1: DÉTECTION CONTENUS NON-MARCHÉS (V2D + Corrections V2E) =====
    
    // 🚫 AVIS DE DÉCÈS - Maintenu de V2D
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

    // 🚫 AUTRES CONTENUS NON-MARCHÉS (V2D + Extensions V2E)
    const nonMarketPatterns = [
        // V2D patterns maintenus
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
        /portant.*nomination/i,
        // V2E corrections shadow
        /conf[eé]rence.*scientifique/i,           // ACADEMIQUE_PARTIEL
        /c[eé]r[eé]monie.*dipl[oô]mes/i,          // Événements académiques
        /conseil.*ministres.*nomination/i,        // NOMINATION_INCOMPLETE
        /d[eé]claration.*ministre/i,              // COMMUNICATION_NON_DETECTEE
        /communiqu[eé].*s[eé]curit[eé]/i,         // COMMUNICATION_NON_DETECTEE
        /communiqu[eé].*conseil.*national/i       // Communications officielles
    ];
    
    if (nonMarketPatterns.some(pattern => pattern.test(fullText))) {
        result.classification = 'REJECTED';
        result.score = -3;
        result.confidence = 0.85;
        result.reasons.push('Contenu non-marché détecté → rejet');
        result.intentAnalysis.contentType = 'NON_MARKET';
        return result;
    }

    // ===== ÉTAPE 2: ANALYSE DES SIGNAUX D'INTENTION (Identique V2D) =====
    
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

    // ===== ÉTAPE 3: TYPOLOGIE DU RECRUTEMENT (Identique V2D) =====
    
    let recruitmentType = 'UNKNOWN';
    
    if (fullText.includes('agent') || fullText.includes('personnel') || 
        fullText.includes('emploi') || fullText.includes('poste')) {
        recruitmentType = 'DIRECT';
    }
    
    if (fullText.includes('prestation') || fullText.includes('service') || 
        fullText.includes('gardiennage') || fullText.includes('securite') ||
        fullText.includes('nettoyage') || fullText.includes('maintenance')) {
        recruitmentType = 'SERVICE_OUTSOURCING';
    }
    
    result.intentAnalysis.recruitmentType = recruitmentType;

    // ===== ÉTAPE 4: DÉTERMINATION INTENTION PRIMAIRE (Identique V2D) =====
    
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

    // ===== ÉTAPE 5: CALCUL DU SCORE BASE (V2D + Extensions V2E) =====
    
    let baseScore = 0;
    
    baseScore += marketScore * 0.4;
    
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
    
    // V2E: Bonus renforcé prestations service (SEUIL_VALID_TROP_STRICT)
    if (fullText.includes('prestation de services') || fullText.includes('contrat de maintenance')) {
        baseScore += 1.2;
        result.reasons.push('Prestation de service détectée → bonus');
    }
    
    // V2E: Bonus spécial réhabilitation/restauration
    if (fullText.includes('réhabilitation') || fullText.includes('restauration')) {
        baseScore += 0.8;
        result.reasons.push('Réhabilitation/restauration → bonus V2E');
    }

    // ===== ÉTAPE 6: AJUSTEMENTS D'INTENTION (Identique V2D) =====
    
    let intentAdjustment = 0;
    
    if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
        intentAdjustment += 0;
        result.reasons.push('Recrutement de prestataire → évaluation neutre');
    } else if (result.intentAnalysis.primaryIntent === 'RECRUITMENT' && recruitmentType === 'DIRECT') {
        intentAdjustment -= 2;
        result.reasons.push('Recrutement direct → pénalité forte');
    } else if (result.intentAnalysis.primaryIntent === 'MARKET') {
        intentAdjustment += 0.5;
        result.reasons.push('Intention marché claire → bonus');
    }

    // ===== ÉTAPE 7: SCORE FINAL ET CLASSIFICATION (V2E Logic) =====
    
    const finalScore = baseScore + intentAdjustment;
    result.score = Math.round(finalScore * 100) / 100;
    
    // V2E: Seuils adaptatifs selon correction SEUIL_VALID_TROP_STRICT
    const validThreshold = 1.5; // V2E: Abaissé de 2.0 à 1.5
    const rejectThreshold = -1.0;
    
    // === V2E: LOGIQUE SCORE=0 INTELLIGENTE (Correction SCORE_ZERO_DEFAULT_REVIEW) ===
    if (finalScore === 0) {
        // Analyse des signaux pour Score=0
        const hasPositiveSignals = marketScore > 0 || 
                                  fullText.includes('marché') || 
                                  fullText.includes('appel') ||
                                  fullText.includes('acquisition') ||
                                  fullText.includes('fourniture') ||
                                  fullText.includes('prestation');
        
        const hasNegativeSignals = fullText.includes('décès') ||
                                  fullText.includes('nomination') ||
                                  fullText.includes('communiqué') ||
                                  fullText.includes('déclaration') ||
                                  fullText.includes('conférence') ||
                                  fullText.includes('cérémonie');
        
        if (hasNegativeSignals && !hasPositiveSignals) {
            result.classification = 'REJECTED';
            result.reasons.push('Score=0 avec signaux négatifs → rejet V2E');
        } else if (hasPositiveSignals) {
            result.classification = 'REVIEW';
            result.reasons.push('Score=0 avec signaux positifs → révision V2E');
        } else {
            result.classification = 'REJECTED';
            result.reasons.push('Score=0 sans signaux clairs → rejet par défaut V2E');
        }
    }
    // === FIN LOGIQUE SCORE=0 V2E ===
    
    // Logique normale si Score ≠ 0
    else if (result.intentAnalysis.primaryIntent === 'SERVICE_OUTSOURCING') {
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
    
    // Calcul de la confiance (identique V2D)
    const maxPossibleScore = 10;
    const minPossibleScore = -5;
    const normalizedScore = (finalScore - minPossibleScore) / (maxPossibleScore - minPossibleScore);
    result.confidence = Math.round(Math.max(0.1, Math.min(0.9, normalizedScore)) * 100) / 100;
    
    return result;
}