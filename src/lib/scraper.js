import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export async function runClientScrape() {
  const listTenders = [];
  
  // Élargissement à l'ensemble des grands portails d'actualités et d'annonces légales du Burkina Faso
  const sources = [
    { name: 'Lefaso.net (Annonces Officielles & Appels d\'offres)', url: 'https://lefaso.net/spip.php?page=backend' },
    { name: 'AIB.media (Agence d\'Information du Burkina)', url: 'https://www.aib.media/feed/' },
    { name: 'Burkina24 (Opportunités & Économie)', url: 'https://burkina24.com/feed/' },
    { name: 'Sidwaya (Journal Officiel / Annonces)', url: 'https://www.sidwaya.info/feed/' },
    { name: 'Wakat Séra (Annonces & Emplois)', url: 'https://www.wakatsera.com/feed/' }
  ];

  for (const source of sources) {
    try {
      const rssUrl = encodeURIComponent(source.url);
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
      const feedData = await response.json();

      if (feedData && feedData.items) {
        for (const item of feedData.items) {
          const title = item.title ? item.title.trim() : '';
          const link = item.link ? item.link.trim() : '';
          let description = item.description ? item.description.trim() : '';

          // Nettoyage HTML
          description = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

          const lowerTitle = title.toLowerCase();
          const lowerDesc = description.toLowerCase();

          // Mots-clés de filtrage très larges pour capturer tous les marchés et opportunités d'affaires
          const isTender = 
            lowerTitle.includes('appel d\'offres') ||
            lowerTitle.includes('appel a candidature') ||
            lowerTitle.includes('appel à candidature') ||
            lowerTitle.includes('recrutement') ||
            lowerTitle.includes('marché public') ||
            lowerTitle.includes('marchés publics') ||
            lowerTitle.includes('avis de recrutement') ||
            lowerTitle.includes('manifestation d\'intérêt') ||
            lowerTitle.includes('consultation restreinte') ||
            lowerTitle.includes('prestataire') ||
            lowerTitle.includes('prestation de service') ||
            lowerTitle.includes('fourniture de') ||
            lowerTitle.includes('acquisition de') ||
            lowerTitle.includes('recrute un') ||
            lowerDesc.includes('appel d\'offres') ||
            lowerDesc.includes('manifestation d\'intérêt') ||
            lowerDesc.includes('prestataire') ||
            lowerDesc.includes('consultant') ||
            lowerDesc.includes('marché public');

          if (isTender && title.length > 5) {
            // Catégorisation intelligente
            let category = 'Prestation';
            if (
              lowerTitle.includes('informatique') || 
              lowerTitle.includes('numérique') || 
              lowerTitle.includes('logiciel') || 
              lowerTitle.includes('ordinateur') ||
              lowerTitle.includes('fibre') ||
              lowerTitle.includes('site internet') ||
              lowerTitle.includes('serveur') ||
              lowerDesc.includes('logiciel') ||
              lowerDesc.includes('informatique')
            ) {
              category = 'Informatique';
            } else if (
              lowerTitle.includes('btp') || 
              lowerTitle.includes('construction') || 
              lowerTitle.includes('bâtiment') || 
              lowerTitle.includes('forage') ||
              lowerTitle.includes('travaux publics') ||
              lowerTitle.includes('aménagement') ||
              lowerDesc.includes('construction de') ||
              lowerDesc.includes('bâtiment')
            ) {
              category = 'Construction';
            } else if (
              lowerTitle.includes('recrutement') || 
              lowerTitle.includes('avis de recrutement') || 
              lowerTitle.includes('recrute') ||
              lowerDesc.includes('recrute un')
            ) {
              category = 'Recrutement';
            } else if (
              lowerTitle.includes('fourniture') || 
              lowerTitle.includes('matériel') || 
              lowerTitle.includes('achat') ||
              lowerTitle.includes('acquisition') ||
              lowerDesc.includes('fourniture de')
            ) {
              category = 'Fourniture';
            }

            listTenders.push({
              title,
              description: description,
              source: source.name,
              link: link,
              publishedAt: item.pubDate || new Date().toISOString(),
              category: category,
              status: 'Ouvert',
              scrapedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      console.error(`Erreur de fetch sur la source ${source.name}:`, e);
    }
  }

  // Éviter d'insérer des doublons dans Firestore
  let addedCount = 0;
  const tendersRef = collection(db, 'marches');

  for (const tender of listTenders) {
    const q = query(tendersRef, where('title', '==', tender.title));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(tendersRef, tender);
      addedCount++;
    }
  }

  return {
    success: true,
    message: `${addedCount} nouveaux appels d'offres réels ont été importés à partir de l'ensemble des portails burkinabè.`,
    total: listTenders.length
  };
}
