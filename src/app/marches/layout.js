export const metadata = {
  title: 'Marchés Publics & Appels d\'Offres',
  description:
    'Consultez en temps réel les appels d\'offres et marchés publics de l\'administration burkinabè (ARCOP, DGCMEF). Filtrez par secteur, accédez aux procédures, pièces requises et liens de dépôt.',
  alternates: { canonical: '/marches' },
  openGraph: {
    title: 'Marchés Publics & Appels d\'Offres au Burkina Faso',
    description:
      'Tous les appels d\'offres burkinabè, mis à jour automatiquement, avec procédures et pièces requises.',
    url: '/marches',
  },
};

export default function MarchesLayout({ children }) {
  return children;
}
