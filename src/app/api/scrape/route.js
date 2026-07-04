import { db } from '@/lib/firebase';
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

function detectCategory(title, desc) {
  const t = title.toLowerCase();
  const d = desc.toLowerCase();
  if (t.includes('informatique') || t.includes('numérique') || t.includes('logiciel') || t.includes('serveur') || t.includes('fibre') || d.includes('logiciel') || t.includes('matériel')) return 'Informatique';
  if (t.includes('btp') || t.includes('construction') || t.includes('forage') || t.includes('travaux') || d.includes('bâtiment')) return 'Construction';
  if (t.includes('recrutement') || t.includes('recrute') || d.includes('recrute un')) return 'Recrutement';
  if (t.includes('fourniture') || t.includes('matériel') || t.includes('acquisition') || d.includes('fourniture de')) return 'Fourniture';
  return 'Prestation';
}

function extractDeadline(text) {
  const dateRegex = /(?:avant le|limite|clôture).*?(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/i;
  const match = text.match(dateRegex);
  if (match) return match[1];
  return null;
}

function extractOpeningTime(text) {
  const timeRegex = /(?:heure|à)\s+(\d{1,2}h\d{0,2})/i;
  const match = text.match(timeRegex);
  if (match) return match[1] + " GMT";
  return null;
}

function extractRequirements(text) {
  const reqs = [];
  const lower = text.toLowerCase();
  if (lower.includes('cv') || lower.includes('curriculum vitae')) reqs.push('CV à jour');
  if (lower.includes('lettre de motivation')) reqs.push('Lettre de motivation');
  if (lower.includes('diplôme') || lower.includes('diplome')) reqs.push('Copie des diplômes');
  if (lower.includes('certificat') || lower.includes('attestation')) reqs.push('Certificats de travail / Attestations');
  if (lower.includes('cni') || lower.includes("carte d'identité") || lower.includes('passeport')) reqs.push("Pièce d'identité (CNI/Passeport)");
  return reqs.length > 0 ? reqs : ["Voir les documents requis dans l'avis officiel"];
}

function extractContact(text, link) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  if (match) return `Envoyer par email à : ${match[0]}`;
  if (link && link.startsWith('http')) return `Postuler via le lien officiel : ${link}`;
  return "Dépôt physique ou voir détails dans l'avis complet";
}

export async function GET(request) {
  // Autorisation. Trois voies acceptées :
  //  1. Cron Vercel : en-tête `Authorization: Bearer <CRON_SECRET>` (envoyé
  //     automatiquement par Vercel quand la variable CRON_SECRET est définie).
  //  2. Appel serveur/curl du propriétaire : ?secret=<SCRAPER_SECRET>.
  //  3. Déclencheur manuel depuis la console admin : ?secret=<NEXT_PUBLIC_SCRAPER_SECRET>
  //     (jeton peu sensible : il ne fait que lancer un scrape de flux RSS publics).
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization') || '';

  const cronSecret = process.env.CRON_SECRET;
  const scraperSecret = process.env.SCRAPER_SECRET;
  const publicTrigger = process.env.NEXT_PUBLIC_SCRAPER_SECRET;

  const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isServerSecret = !!scraperSecret && secret === scraperSecret;
  const isManualTrigger = !!publicTrigger && secret === publicTrigger;

  if (!isCron && !isServerSecret && !isManualTrigger) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const listTenders = [];

  // --- 1. Scrape ReliefWeb (Tightly filtered to Burkina Faso) ---
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Freliefweb.int%2Fjobs%2Frss.xml%3Fcountry%3D46', {
      next: { revalidate: 0 }
    });
    const feedData = await response.json();
    if (feedData && feedData.items) {
      for (const item of feedData.items) {
        const title = (item.title || '').trim();
        let description = (item.description || '').trim().replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        const link = (item.link || '').trim();
        const lowerTitle = title.toLowerCase();
        const lowerDesc = description.toLowerCase();

        // Location check
        const isBurkina = lowerTitle.includes('burkina') || lowerTitle.includes('ouagadougou') || 
                          lowerDesc.includes('burkina') || lowerDesc.includes('ouagadougou');

        if (isBurkina) {
          if (link) {
            description = await fetchFullText(link, description);
          }

          const extDeadline = extractDeadline(description) || extractDeadline(title);
          const extOpening = extractOpeningTime(description);
          const cat = detectCategory(title, description);

          listTenders.push({
            title,
            description,
            source: 'ReliefWeb (Burkina)',
            link,
            publishedAt: item.pubDate || new Date().toISOString(),
            category: cat,
            status: 'Ouvert',
            scrapedAt: new Date().toISOString(),
            deadline: extDeadline ? extDeadline : null,
            openingTime: extOpening ? extOpening : null,
            requirements: cat === 'Recrutement' ? extractRequirements(description) : null,
            contactInfo: cat === 'Recrutement' ? extractContact(description, link) : null
          });
        }
      }
    }
  } catch (e) {
    console.error(`[Scrape] Erreur sur ReliefWeb:`, e.message);
  }

  // --- 2. Scrape ARCOP ---
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
            const titlePart = text.split('Télécharger')[0].trim();
            const downloadLink = td.find('a').attr('href') || 'https://www.arcop.bf/appels-doffres/';
            const cat = detectCategory(titlePart, '');
            const extDeadline = extractDeadline(titlePart);

            listTenders.push({
              title: titlePart,
              description: `Avis d'appel d'offres officiel publié par l'ARCOP Burkina Faso. Téléchargez le document officiel pour consulter les détails et soumissionner.`,
              source: 'ARCOP Burkina Faso',
              link: downloadLink,
              publishedAt: new Date().toISOString(),
              category: cat,
              status: 'Ouvert',
              scrapedAt: new Date().toISOString(),
              deadline: extDeadline ? extDeadline : null,
              openingTime: null,
              requirements: cat === 'Recrutement' ? ["Voir dossier complet"] : null,
              contactInfo: `Voir documents officiels : ${downloadLink}`
            });
          }
        }
      });
    }
  } catch (e) {
    console.error(`[Scrape] Erreur sur ARCOP:`, e.message);
  }

  // --- 3. Scrape DGCMEF (Le Quotidien) ---
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
          deadline: null,
          openingTime: null,
          requirements: null,
          contactInfo: `Télécharger le Quotidien : ${href}`
        });
      }
    });
  } catch (e) {
    console.error(`[Scrape] Erreur sur DGCMEF:`, e.message);
  }

  // Déduplications et sauvegarde Firestore
  let addedCount = 0;
  const tendersRef = collection(db, 'marches');

  for (const tender of listTenders) {
    try {
      const q = query(tendersRef, where('title', '==', tender.title));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(tendersRef, tender);
        addedCount++;
      } else {
        const existingDoc = snap.docs[0];
        const existingData = existingDoc.data();
        if (tender.description && tender.description.length > (existingData.description || '').length) {
          await updateDoc(existingDoc.ref, { description: tender.description });
        }
      }
    } catch (e) {
      console.error('[Scrape] Firestore error:', e.message);
    }
  }

  return Response.json({
    success: true,
    added: addedCount,
    total: listTenders.length,
    timestamp: new Date().toISOString()
  });
}
