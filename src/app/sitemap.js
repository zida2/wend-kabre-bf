const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wend-kabre-bf.vercel.app';

// Pages publiques indexables (les espaces admin/dashboard sont exclus, cf. robots.js)
export default function sitemap() {
  const now = new Date();
  const routes = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/marches', changeFrequency: 'hourly', priority: 0.9 },
    { path: '/recrutements', changeFrequency: 'daily', priority: 0.8 },
    { path: '/assistant', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/tarifs', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/inscription', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/connexion', changeFrequency: 'monthly', priority: 0.5 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
