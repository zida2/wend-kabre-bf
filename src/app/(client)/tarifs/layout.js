const faqs = [
  {
    q: 'Comment les marchés sont-ils collectés ?',
    a: 'Notre système surveille automatiquement les portails officiels burkinabè 24h/24. Dès qu\'un nouveau marché est publié, il apparaît instantanément sur la plateforme.',
  },
  {
    q: 'Puis-je annuler mon abonnement à tout moment ?',
    a: 'Oui, sans engagement. Vous pouvez résilier à tout moment depuis votre tableau de bord. L\'accès reste actif jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Les alertes WhatsApp fonctionnent-elles sur tout le territoire ?',
    a: 'Oui. Les alertes sont envoyées sur tout numéro burkinabè dès qu\'un appel d\'offres correspondant à votre secteur est détecté.',
  },
  {
    q: 'Qu\'est-ce que l\'assistant IA Wend-Kabré ?',
    a: 'C\'est notre assistant intelligent qui analyse les exigences d\'un appel d\'offres et vérifie instantanément si votre dossier administratif est conforme aux critères requis.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export const metadata = {
  title: 'Tarifs & Abonnements Premium',
  description:
    'Découvrez les formules Wend-Kabré : essai, PME Pro et Élite. Accès aux détails des marchés, alertes WhatsApp/SMS et assistant IA. Sans engagement.',
  alternates: { canonical: '/tarifs' },
  openGraph: {
    title: 'Tarifs Wend-Kabré — Accès Premium aux Marchés Publics',
    description:
      'Choisissez votre niveau d\'accès aux appels d\'offres du Burkina Faso. Sans engagement.',
    url: '/tarifs',
  },
};

export default function TarifsLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
