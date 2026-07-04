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

  // --- 1. Scrape ReliefWeb (Tightly filtered to Burkina Faso) ---
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Freliefweb.int%2Fjobs%2Frss.xml%3Fcountry%3D46');
    const feedData = await response.json();
    if (feedData && feedData.items) {
      for (const item of feedData.items) {
        const title = item.title ? item.title.trim() : '';
        let description = item.description ? item.description.trim() : '';
        description = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

        const lowerTitle = title.toLowerCase();
        const lowerDesc = description.toLowerCase();

        // Strict location filtering for Burkina Faso
        const isBurkina = lowerTitle.includes('burkina') || lowerTitle.includes('ouagadougou') || 
                          lowerDesc.includes('burkina') || lowerDesc.includes('ouagadougou');

        if (isBurkina) {
          listTenders.push({
            title,
            description,
            source: 'ReliefWeb (Burkina)',
            link: item.link || '',
            publishedAt: item.pubDate || new Date().toISOString(),
            category: 'Recrutement',
            status: 'Ouvert',
            scrapedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (e) {
    console.error("Erreur de scraping sur ReliefWeb:", e.message);
  }

  // --- 2. Scrape ARCOP Appels d'offres ---
  try {
    const res = await fetch('https://www.arcop.bf/appels-doffres/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);

    const table = $('table').first();
    if (table.length > 0) {
      table.find('tr').each((i, tr) => {
        if (i === 0) return; // Skip header
        const td = $(tr).find('td').first();
        if (td.length > 0) {
          const text = td.text().trim().replace(/\s+/g, ' ');
          if (text.includes('Télécharger')) {
            // Extract the title (text before "Télécharger")
            const titlePart = text.split('Télécharger')[0].trim();
            const downloadLink = td.find('a').attr('href') || 'https://www.arcop.bf/appels-doffres/';
            
            // Categorize based on keywords
            let category = 'Prestation';
            const lowerTitle = titlePart.toLowerCase();
            if (lowerTitle.includes('informatique') || lowerTitle.includes('numérique') || lowerTitle.includes('logiciel') || lowerTitle.includes('matériel')) {
              category = 'Informatique';
            } else if (lowerTitle.includes('btp') || lowerTitle.includes('construction') || lowerTitle.includes('travaux') || lowerTitle.includes('bâtiment')) {
              category = 'Construction';
            } else if (lowerTitle.includes('recrutement') || lowerTitle.includes('avis de recrutement')) {
              category = 'Recrutement';
            } else if (lowerTitle.includes('fourniture') || lowerTitle.includes('achat') || lowerTitle.includes('acquisition')) {
              category = 'Fourniture';
            }

            listTenders.push({
              title: titlePart,
              description: `Avis d'appel d'offres officiel publié par l'ARCOP Burkina Faso. Téléchargez le document officiel pour consulter les détails et soumissionner.`,
              source: 'ARCOP Burkina Faso',
              link: downloadLink,
              publishedAt: new Date().toISOString(),
              category,
              status: 'Ouvert',
              scrapedAt: new Date().toISOString(),
            });
          }
        }
      });
    }
  } catch (e) {
    console.error("Erreur de scraping sur ARCOP:", e.message);
  }

  // --- 3. Scrape DGCMEF Appels d'offres (Le Quotidien) ---
  try {
    const res = await fetch('https://www.dgcmef.gov.bf/fr/appels-d-offre', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      let href = $(el).attr('href');
      if (text && text.includes('Quotidien n°') && href) {
        if (href.startsWith('/')) {
          href = `http://www.dgcmef.gov.bf${href}`;
        }
        
        listTenders.push({
          title: text,
          description: `Le Quotidien des Marchés Publics officiel du Burkina Faso. Téléchargez le PDF officiel de la DGCMEF pour consulter l'ensemble des avis de recrutement, demandes de prix et appels d'offres de la journée.`,
          source: 'DGCMEF Burkina Faso',
          link: href,
          publishedAt: new Date().toISOString(),
          category: 'Prestation',
          status: 'Ouvert',
          scrapedAt: new Date().toISOString(),
        });
      }
    });
  } catch (e) {
    console.error("Erreur de scraping sur DGCMEF:", e.message);
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
