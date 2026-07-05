// ─────────────────────────────────────────────────────────────────────
// Moteur de recommandation de marchés (§7).
// 100% règles (aucune dépendance, aucun coût réseau).
//   - scoreMarket(market, profile)  → score de compatibilité 0–100
//   - recommendMarkets(markets, profile, limit) → marchés triés + score
// Robuste aux champs manquants ; ne throw jamais.
// ─────────────────────────────────────────────────────────────────────

// Normalisation accent-insensible pour des comparaisons tolérantes.
const norm = (s) =>
  (s == null ? '' : String(s))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Calcule un score de compatibilité 0–100 entre un marché et un profil.
 * @param {Object} market  { title, description, category, secteur, region, urgence, publishedAt, procedure }
 * @param {Object} profile { keywords: string[], secteur?: string, region?: string }
 * @returns {number} score entier clampé sur [0, 100]
 */
export function scoreMarket(market, profile) {
  try {
    const m = market || {};
    const p = profile || {};
    const keywords = Array.isArray(p.keywords) ? p.keywords : [];

    let score = 0;

    // Texte agrégé du marché pour la recherche de mots-clés.
    const haystack = norm(
      [m.title, m.description, m.secteur, m.category, m.procedure]
        .filter(Boolean)
        .join(' ')
    );

    // +40 : au moins un mot-clé du profil apparaît dans le marché.
    const hasKeywordMatch = keywords.some((kw) => {
      const k = norm(kw);
      return k.length > 0 && haystack.includes(k);
    });
    if (hasKeywordMatch) score += 40;

    // +20 : le secteur du marché correspond à un centre d'intérêt du profil.
    const marketSecteur = norm(m.secteur);
    if (marketSecteur) {
      const profileSecteur = norm(p.secteur);
      const secteurMatch =
        (profileSecteur && marketSecteur.includes(profileSecteur)) ||
        keywords.some((kw) => {
          const k = norm(kw);
          return k.length > 0 && marketSecteur.includes(k);
        });
      if (secteurMatch) score += 20;
    }

    // +15 : la région du marché correspond à celle du profil.
    const marketRegion = norm(m.region);
    const profileRegion = norm(p.region);
    if (
      marketRegion &&
      profileRegion &&
      marketRegion !== 'non specifie' &&
      marketRegion.includes(profileRegion)
    ) {
      score += 15;
    }

    // +15 : opportunité fraîche (échéance proche).
    const urgence = norm(m.urgence);
    if (urgence === 'urgent' || urgence === 'bientot') score += 15;

    // +10 : marché publié récemment (moins de 14 jours).
    if (m.publishedAt) {
      const published = new Date(m.publishedAt).getTime();
      if (!isNaN(published)) {
        const days = (Date.now() - published) / (24 * 60 * 60 * 1000);
        if (days >= 0 && days < 14) score += 10;
      }
    }

    // Clamp final sur [0, 100].
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return Math.round(score);
  } catch (e) {
    return 0;
  }
}

/**
 * Trie les marchés par score décroissant, filtre les scores > 0 et
 * retourne les `limit` meilleurs avec leur score attaché.
 * @param {Array}  markets
 * @param {Object} profile
 * @param {number} limit
 * @returns {Array<Object>} chaque élément = { ...market, score }
 */
export function recommendMarkets(markets, profile, limit = 6) {
  try {
    const list = Array.isArray(markets) ? markets : [];
    const max = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 6;

    return list
      .map((market) => ({ ...market, score: scoreMarket(market, profile) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max);
  } catch (e) {
    return [];
  }
}
