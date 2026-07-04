export default function manifest() {
  return {
    name: 'Wend-Kabré — Marchés Publics du Burkina Faso',
    short_name: 'Wend-Kabré',
    description:
      'Alertes et centralisation des appels d\'offres et marchés publics au Burkina Faso.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7FDF9',
    theme_color: '#059669',
    lang: 'fr',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/wend_kabre_banner.png',
        sizes: '1200x630',
        type: 'image/png',
      },
    ],
  };
}
