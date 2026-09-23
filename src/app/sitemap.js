import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wend-kabre-bf.vercel.app';

// Pages publiques indexables (les espaces admin/dashboard sont exclus, cf. robots.js)
export default async function sitemap() {
  const now = new Date();
  
  // Routes statiques
  const staticRoutes = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/marches', changeFrequency: 'hourly', priority: 0.9 },
    { path: '/recrutements', changeFrequency: 'daily', priority: 0.8 },
    { path: '/assistant', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/tarifs', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/inscription', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/connexion', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/guide-soumission', changeFrequency: 'monthly', priority: 0.75 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/conditions', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/confidentialite', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/mentions-legales', changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Routes dynamiques : marchés publics récents (100 derniers)
  let marcheRoutes = [];
  try {
    const marchesQuery = query(
      collection(db, 'marches'),
      orderBy('publishedAt', 'desc'),
      limit(100)
    );
    const marchesSnapshot = await getDocs(marchesQuery);
    
    marcheRoutes = marchesSnapshot.docs
      .filter(doc => doc.data().category !== 'Recrutement') // Exclure les recrutements
      .map((doc) => ({
        url: `${SITE_URL}/marches/details?id=${doc.id}`,
        lastModified: doc.data().publishedAt 
          ? new Date(doc.data().publishedAt) 
          : now,
        changeFrequency: 'weekly',
        priority: 0.75,
      }));
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap (marchés):', error);
    // Continue avec les routes statiques seulement
  }

  // Routes dynamiques : recrutements récents (50 derniers)
  let recrutementRoutes = [];
  try {
    const recrutementsQuery = query(
      collection(db, 'marches'),
      orderBy('publishedAt', 'desc'),
      limit(50)
    );
    const recrutementsSnapshot = await getDocs(recrutementsQuery);
    
    recrutementRoutes = recrutementsSnapshot.docs
      .filter(doc => doc.data().category === 'Recrutement')
      .map((doc) => ({
        url: `${SITE_URL}/recrutements/details?id=${doc.id}`,
        lastModified: doc.data().publishedAt 
          ? new Date(doc.data().publishedAt) 
          : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap (recrutements):', error);
  }

  // Combiner toutes les routes
  const allRoutes = [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...marcheRoutes,
    ...recrutementRoutes,
  ];

  return allRoutes;
}
