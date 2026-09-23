/**
 * Métadonnées SEO centralisées pour Wend-Kabré
 * Ce fichier permet de gérer facilement toutes les métadonnées du site
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wend-kabre-bf.vercel.app';
const SITE_NAME = 'Wend-Kabré';
const TWITTER_HANDLE = '@wendkabre'; // À remplacer par votre vrai handle Twitter/X

// ═══════════════════════════════════════════════════════════════════════════════
// 📄 PAGES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════════

export const homePageMetadata = {
  title: 'Wend-Kabré | Marchés Publics & Appels d\'Offres au Burkina Faso',
  description:
    'Accédez en temps réel aux marchés publics et appels d\'offres du Burkina Faso (ARCOP, DGCMEF). Alertes WhatsApp & SMS, procédures détaillées, pièces requises et assistant IA de conformité pour les PME.',
  keywords: [
    'marchés publics Burkina Faso',
    'appels d\'offres Burkina Faso',
    'ARCOP',
    'DGCMEF',
    'alertes marchés publics',
    'appel d\'offres PME',
    'soumission marché public Burkina',
    'Wend-Kabré',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_BF',
    url: '/',
    siteName: SITE_NAME,
    title: 'Wend-Kabré — Marchés Publics du Burkina Faso en Temps Réel',
    description:
      'La plateforme qui centralise les appels d\'offres burkinabè et guide les PME de l\'alerte à la signature.',
    images: [
      {
        url: '/wend_kabre_banner.png',
        width: 1200,
        height: 630,
        alt: 'Wend-Kabré — Marchés Publics du Burkina Faso',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wend-Kabré — Marchés Publics du Burkina Faso',
    description:
      'Alertes en temps réel, procédures détaillées et assistant IA pour les appels d\'offres au Burkina Faso.',
    images: ['/wend_kabre_banner.png'],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export const marchesPageMetadata = {
  title: 'Marchés Publics & Appels d\'Offres — Burkina Faso en Temps Réel',
  description:
    'Accédez aux appels d\'offres et marchés publics officiels du Burkina Faso (ARCOP, DGCMEF). BTP, informatique, fournitures, prestations. Alertes instantanées, détails complets et documents PDF.',
  keywords: [
    'marchés publics Burkina Faso',
    'appels d\'offres BF',
    'ARCOP marchés',
    'DGCMEF appels d\'offres',
    'BTP Burkina',
    'fournitures publiques Burkina',
    'marchés informatique Burkina Faso',
    'soumission marché public',
    'DAO Burkina Faso',
  ],
  alternates: {
    canonical: '/marches',
  },
  openGraph: {
    title: 'Marchés Publics du Burkina Faso — Accès en Temps Réel',
    description:
      'Consultez tous les appels d\'offres et marchés publics du Burkina Faso : construction, informatique, fournitures. Documents PDF, détails complets et alertes.',
    url: `${SITE_URL}/marches`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/wend_kabre_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Marchés Publics du Burkina Faso',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marchés Publics du Burkina Faso — Wend-Kabré',
    description: 'Tous les appels d\'offres du Burkina en temps réel : BTP, informatique, prestations.',
    images: [`${SITE_URL}/wend_kabre_banner.png`],
  },
};

export const recrutementsPageMetadata = {
  title: 'Recrutements & Formations — Offres d\'Emploi Burkina Faso',
  description:
    'Consultez les offres d\'emploi, recrutements et formations professionnelles au Burkina Faso. Secteur public, privé, ONG et organisations internationales. Candidatures en ligne.',
  keywords: [
    'recrutement Burkina Faso',
    'offres d\'emploi BF',
    'emploi public Burkina',
    'recrutement ONG Burkina',
    'formation professionnelle Burkina',
    'carrière Burkina Faso',
    'candidature emploi Ouagadougou',
  ],
  alternates: {
    canonical: '/recrutements',
  },
  openGraph: {
    title: 'Recrutements & Formations au Burkina Faso',
    description:
      'Offres d\'emploi, recrutements et formations au Burkina Faso. Secteur public, privé, ONG. Alertes personnalisées.',
    url: `${SITE_URL}/recrutements`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/wend_kabre_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Recrutements Burkina Faso',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recrutements & Formations — Burkina Faso',
    description: 'Offres d\'emploi et formations au Burkina Faso en temps réel.',
    images: [`${SITE_URL}/wend_kabre_banner.png`],
  },
};

export const assistantPageMetadata = {
  title: 'Assistant IA — Analyse de Dossiers d\'Appels d\'Offres',
  description:
    'Assistant IA intelligent pour analyser vos dossiers d\'appels d\'offres. Vérification de conformité, suggestions d\'amélioration et recommandations personnalisées pour augmenter vos chances de succès.',
  keywords: [
    'assistant IA marchés publics',
    'analyse dossier appel d\'offres',
    'conformité DAO Burkina',
    'vérification dossier soumission',
    'IA marchés publics',
    'chatbot appels d\'offres',
  ],
  alternates: {
    canonical: '/assistant',
  },
  openGraph: {
    title: 'Assistant IA — Analyse de Dossiers d\'Appels d\'Offres',
    description:
      'Intelligence artificielle pour analyser vos dossiers d\'appels d\'offres. Conformité, suggestions et recommandations personnalisées.',
    url: `${SITE_URL}/assistant`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/wend_kabre_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Assistant IA Wend-Kabré',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assistant IA — Analyse d\'Appels d\'Offres',
    description: 'IA pour analyser et optimiser vos dossiers de soumission.',
    images: [`${SITE_URL}/wend_kabre_banner.png`],
  },
};

export const tarifsPageMetadata = {
  title: 'Tarifs & Abonnements — Plans Premium Wend-Kabré',
  description:
    'Découvrez nos plans d\'abonnement : Découverte gratuit, Premium 15 000 FCFA/mois et Entreprise 55 000 FCFA/mois. Alertes temps réel, PDF complets, assistant IA et support prioritaire.',
  keywords: [
    'tarifs Wend-Kabré',
    'abonnement marchés publics',
    'prix alerte appels d\'offres',
    'plan premium Burkina',
    'abonnement entreprise',
  ],
  alternates: {
    canonical: '/tarifs',
  },
  openGraph: {
    title: 'Tarifs & Abonnements — Wend-Kabré',
    description:
      'Plans adaptés à vos besoins : Découverte gratuit, Premium 15K FCFA/mois, Entreprise 55K FCFA/mois. Alertes, PDF, IA inclus.',
    url: `${SITE_URL}/tarifs`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/wend_kabre_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Tarifs Wend-Kabré',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs & Abonnements — Wend-Kabré',
    description: 'Plans adaptés : Gratuit, Premium 15K, Entreprise 55K FCFA/mois.',
    images: [`${SITE_URL}/wend_kabre_banner.png`],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SCHEMAS JSON-LD (Données Structurées)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Schema.org pour la page des marchés (ItemList)
 */
export const generateMarchesJsonLd = (marches = []) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Marchés Publics du Burkina Faso',
  description: 'Liste des appels d\'offres et marchés publics disponibles au Burkina Faso',
  numberOfItems: marches.length,
  itemListElement: marches.slice(0, 10).map((marche, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Service',
      name: marche.title,
      description: marche.description?.substring(0, 200),
      category: marche.category,
      areaServed: {
        '@type': 'Country',
        name: 'Burkina Faso',
      },
    },
  })),
});

/**
 * Schema.org pour les offres d'emploi (JobPosting)
 */
export const generateJobPostingJsonLd = (recrutement) => ({
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: recrutement.title,
  description: recrutement.description,
  datePosted: recrutement.publishedAt,
  validThrough: recrutement.dateLimite || recrutement.deadline,
  employmentType: recrutement.employmentType || 'FULL_TIME',
  hiringOrganization: {
    '@type': 'Organization',
    name: recrutement.source || 'Non spécifié',
  },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BF',
      addressRegion: recrutement.region || 'Burkina Faso',
    },
  },
});

/**
 * Schema.org FAQ (Questions Fréquentes)
 */
export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment accéder aux marchés publics du Burkina Faso ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Wend-Kabré centralise tous les appels d\'offres des sources officielles (ARCOP, DGCMEF). Créez un compte gratuit pour consulter les titres et catégories, ou souscrivez au plan Premium pour accéder aux détails complets, PDF et alertes personnalisées.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels sont les tarifs de Wend-Kabré ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nous proposons 3 plans : Découverte (gratuit), Premium (15 000 FCFA/mois) avec accès complet, alertes et assistant IA, et Entreprise (55 000 FCFA/mois) pour jusqu\'à 10 utilisateurs avec fonctionnalités avancées.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment fonctionne l\'assistant IA ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'assistant IA analyse vos dossiers d\'appels d\'offres, vérifie la conformité avec les exigences, suggère des améliorations et répond à vos questions sur les procédures de marchés publics au Burkina Faso.',
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je recevoir des alertes pour des catégories spécifiques ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui ! Les abonnés Premium peuvent configurer des alertes personnalisées par catégorie (BTP, informatique, fournitures, etc.), région et seuil de montant. Les alertes sont envoyées par WhatsApp et SMS en temps réel.',
      },
    },
    {
      '@type': 'Question',
      name: 'Les documents PDF sont-ils disponibles ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, pour les marchés qui disposent de documents officiels PDF (DAO, TDR, etc.), les abonnés Premium peuvent les télécharger directement depuis la plateforme.',
      },
    },
  ],
};

/**
 * Schema.org Breadcrumb (fil d'ariane)
 */
export const generateBreadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

/**
 * Schema.org SoftwareApplication (pour l'assistant IA)
 */
export const assistantSoftwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Assistant IA Wend-Kabré',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '15000',
    priceCurrency: 'XOF',
  },
  operatingSystem: 'Web',
  description:
    'Assistant intelligent pour analyser et optimiser vos dossiers d\'appels d\'offres au Burkina Faso.',
  featureList: [
    'Analyse de conformité',
    'Vérification de documents',
    'Suggestions personnalisées',
    'Questions-réponses sur les procédures',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Générer des métadonnées personnalisées pour une page
 */
export const createPageMetadata = ({
  title,
  description,
  keywords = [],
  path = '/',
  image = '/wend_kabre_banner.png',
  imageAlt = 'Wend-Kabré',
  type = 'website',
}) => ({
  title,
  description,
  keywords,
  alternates: {
    canonical: path,
  },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}${path}`,
    type,
    images: [
      {
        url: `${SITE_URL}${image}`,
        width: 1200,
        height: 630,
        alt: imageAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${SITE_URL}${image}`],
  },
});

/**
 * Métadonnées pour les pages de détails de marchés
 */
export const createMarcheDetailMetadata = (marche) => {
  const title = `${marche.title} — Appel d'Offres Burkina Faso`;
  const description = marche.description
    ? marche.description.substring(0, 155) + '...'
    : `Détails complets de l'appel d'offres : ${marche.title}. Source officielle, documents PDF et procédure de soumission.`;

  return createPageMetadata({
    title,
    description,
    keywords: [
      'appel d\'offres',
      marche.category,
      marche.region || 'Burkina Faso',
      'marché public',
      'ARCOP',
    ].filter(Boolean),
    path: `/marches/details?id=${marche.id}`,
    type: 'article',
  });
};

/**
 * Métadonnées pour les pages de recrutements
 */
export const createRecrutementDetailMetadata = (recrutement) => {
  const title = `${recrutement.title} — Offre d'Emploi Burkina Faso`;
  const description = recrutement.description
    ? recrutement.description.substring(0, 155) + '...'
    : `Détails de l'offre : ${recrutement.title}. Postulez en ligne.`;

  return createPageMetadata({
    title,
    description,
    keywords: [
      'recrutement',
      'emploi',
      recrutement.category,
      recrutement.region || 'Burkina Faso',
    ].filter(Boolean),
    path: `/recrutements/details?id=${recrutement.id}`,
    type: 'article',
  });
};

export default {
  SITE_URL,
  SITE_NAME,
  homePageMetadata,
  marchesPageMetadata,
  recrutementsPageMetadata,
  assistantPageMetadata,
  tarifsPageMetadata,
  faqJsonLd,
  generateMarchesJsonLd,
  generateJobPostingJsonLd,
  generateBreadcrumbJsonLd,
  assistantSoftwareJsonLd,
  createPageMetadata,
  createMarcheDetailMetadata,
  createRecrutementDetailMetadata,
};
