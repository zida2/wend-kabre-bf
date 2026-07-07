import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';

// URL de base du site (configurable ; fallback sur le déploiement Vercel actuel)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wend-kabre-bf.vercel.app';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Wend-Kabré | Marchés Publics & Appels d\'Offres au Burkina Faso',
    template: '%s | Wend-Kabré',
  },
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
  authors: [{ name: 'Wend-Kabré' }],
  creator: 'Wend-Kabré',
  publisher: 'Wend-Kabré',
  applicationName: 'Wend-Kabré',
  category: 'business',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_BF',
    url: '/',
    siteName: 'Wend-Kabré',
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
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
};

// Données structurées (JSON-LD) — Organisation
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Wend-Kabré',
  url: SITE_URL,
  logo: `${SITE_URL}/wend_kabre_banner.png`,
  description:
    'Plateforme de centralisation des appels d\'offres et marchés publics au Burkina Faso.',
  foundingDate: '2026',
  areaServed: { '@type': 'Country', name: 'Burkina Faso' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: ['fr'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Wend-Kabré',
  url: SITE_URL,
  inLanguage: 'fr',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
