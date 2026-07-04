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
      return cleanText.substring(0, 10000);
    }
  } catch (e) {
  }
  return fallbackDesc;
}

async function runClientScrape() {
  const listTenders = [];
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
          description = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

          const lowerTitle = title.toLowerCase();
          const lowerDesc = description.toLowerCase();

          const isTender = 
            lowerTitle.includes('appel d\'offres') || lowerTitle.includes('recrutement') || lowerTitle.includes('marché public') ||
            lowerTitle.includes('marchés publics') || lowerTitle.includes('avis de recrutement') || lowerTitle.includes('manifestation d\'intérêt') ||
            lowerTitle.includes('consultation restreinte') || lowerTitle.includes('prestataire') || lowerTitle.includes('prestation de service') ||
            lowerTitle.includes('fourniture de') || lowerTitle.includes('acquisition de') || lowerTitle.includes('recrute un') ||
            lowerDesc.includes('appel d\'offres') || lowerDesc.includes('manifestation d\'intérêt') || lowerDesc.includes('prestataire') ||
            lowerDesc.includes('consultant') || lowerDesc.includes('marché public');

          if (isTender && title.length > 5) {
             let fullText = await fetchFullText(link, description);
             listTenders.push({
               title,
               source: source.name,
               descLength: fullText.length,
               descPreview: fullText.substring(0, 150).replace(/\n/g, ' ')
             });
          }
        }
      }
    } catch(e) {}
  }
  return listTenders;
}

runClientScrape().then(r => console.log(r));
