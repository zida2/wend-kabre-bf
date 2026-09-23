const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wend-kabre-bf.vercel.app';

export const metadata = {
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

// Schema.org pour la page des marchés (ItemList)
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
