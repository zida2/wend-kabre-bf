import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import * as cheerio from 'cheerio';

async function fetchFullText(url, fallbackDesc) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeout);
    
    if (!res.ok) return fallbackDesc;
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer, aside, .sidebar, .widget, .comments, .menu').remove();
    
    const container = $('article, .entry-content, .post-content, .content, main, body').first();
    const paragraphs = [];
    
    container.find('p, li').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt.length > 40 && !txt.includes('Archives') && !txt.includes('Copyright') && !txt.includes('Article similaire')) {
        paragraphs.push(txt);
      }
    });
    
    let mainContent = paragraphs.join('\n\n');
    
    const cleanText = mainContent.replace(/\s+/g, ' ').trim();
    if (cleanText.length > fallbackDesc.length) {
      return cleanText.substring(0, 10000); // 10k chars max
    }
  } catch (e) {
    console.error("Scraping approfondi échoué pour", url);
  }
  return fallbackDesc;
}

export async function runClientScrape() {
  const listTenders = [];
  
  // Élargissement à l'ensemble des grands portails d'actualités et d'annonces légales du Burkina Faso
  const sources = [
    { name: 'Lefaso.net', url: 'https://lefaso.net/spip.php?page=backend' },
    { name: 'AIB.media', url: 'https://www.aib.media/feed/' },
    { name: 'Burkina24', url: 'https://burkina24.com/feed/' },
    { name: 'Sidwaya', url: 'https://www.sidwaya.info/feed/' },
    { name: 'Wakat Séra', url: 'https://www.wakatsera.com/feed/' },
    { name: 'L\'Economiste du Faso', url: 'https://www.leconomistedufaso.bf/feed/' },
    { name: 'MinaJobs BF', url: 'https://minajobs.net/feed/' },
    { name: 'ReliefWeb (ONG/UN)', url: 'https://reliefweb.int/jobs/rss.xml?country=47' }
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

            if (link) {
              description = await fetchFullText(link, description);
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
    } else {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      if (tender.description && tender.description.length > (existingData.description || '').length) {
        await updateDoc(existingDoc.ref, { description: tender.description });
      }
    }
  }

  return {
    success: true,
    message: `${addedCount} nouveaux appels d'offres réels ont été importés à partir de l'ensemble des portails burkinabè.`,
    total: listTenders.length
  };
}
