import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { classifyMarket, isRealTender } from '@/lib/marketClassifier';
import { processAlertsForTenders } from '@/lib/alertEngine';

// Le scraping (fetch multi-sources + cheerio) dure plusieurs dizaines de secondes.
// Sans ceci, Vercel tue la fonction à la durée par défaut → scrape KO en prod.
export const maxDuration = 60;      // secondes (max du plan Hobby)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PDF_RE = /\.pdf($|\?)/i;
function isPdfUrl(u) { try { return PDF_RE.test((u || '').split('#')[0]); } catch { return false; } }
function absUrl(href, base) { try { return new URL(href, base).href; } catch { return null; } }

// Récupère tous les liens PDF d'une page (résolus en URL absolues, dédupliqués).
function extractPdfsFromHtml($, baseUrl) {
  const docs = [];
  const seen = new Set();
  $('a[href]').each((i, el) => {
    const raw = ($(el).attr('href') || '').split('#')[0];
    if (!PDF_RE.test(raw)) return;
    const abs = absUrl(raw, baseUrl);
    if (!abs || seen.has(abs)) return;
    seen.add(abs);
    const name = ($(el).text().trim() || $(el).attr('title') || 'Document PDF').replace(/\s+/g, ' ').slice(0, 120);
    docs.push({ name, url: abs });
  });
  return docs.slice(0, 12);
}

// Un seul fetch → texte enrichi + liste des PDF de la page (ou le PDF lui-même).
async function fetchPageData(url, fallbackDesc) {
  const result = { text: fallbackDesc, documents: [] };
  if (isPdfUrl(url)) {
    result.documents = [{ name: 'Document officiel (PDF)', url }];
    return result;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeout);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) return result;
    if (ct.includes('application/pdf')) {
      result.documents = [{ name: 'Document officiel (PDF)', url }];
      return result;
    }
    if (!ct.includes('html')) return result;

    const html = await res.text();
    const $ = cheerio.load(html);
    result.documents = extractPdfsFromHtml($, url);

    $('script, style, nav, header, footer, aside, .sidebar, .widget, .comments, .menu').remove();
    const container = $('article, .entry-content, .post-content, .content, main, body').first();
    const paragraphs = [];
    container.find('p, li').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt.length > 40 && !txt.includes('Archives') && !txt.includes('Copyright') && !txt.includes('Article similaire')) {
        paragraphs.push(txt);
      }
    });
    const cleanText = paragraphs.join('\n\n').replace(/\s+/g, ' ').trim();
    if (cleanText.length > (fallbackDesc || '').length) result.text = cleanText.substring(0, 10000);
  } catch (e) {
    console.error('fetchPageData échoué pour', url);
  }
  return result;
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

  // Garde-fou temps : au-delà de ~25 s, on arrête les fetches profonds (PDF /
  // texte enrichi) pour ne pas dépasser maxDuration=60 s sur Vercel.
  const SCRAPE_START = Date.now();
  const budgetOk = () => Date.now() - SCRAPE_START < 25000;

  const listTenders = [];

  // --- 1. Scrape RSS Sources ---
  const rssSources = [
    { name: 'Lefaso.net', url: 'https://lefaso.net/spip.php?page=backend' },
    { name: 'AIB', url: 'https://www.aib.media/feed/' },
    { name: 'Burkina24', url: 'https://burkina24.com/feed/' },
    { name: 'Sidwaya', url: 'https://www.sidwaya.info/feed/' },
    { name: 'Wakat Séra', url: 'https://www.wakatsera.com/feed/' },
    { name: 'L\'Economiste', url: 'https://www.leconomistedufaso.bf/feed/' },
    { name: 'MinaJobs', url: 'https://minajobs.net/feed/' },
    { name: 'ReliefWeb', url: 'https://reliefweb.int/jobs/rss.xml?country=46' }
  ];

  await Promise.allSettled(rssSources.map(async (source) => {
    try {
      const encodedUrl = encodeURIComponent(source.url);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodedUrl}`, { next: { revalidate: 0 } });
      const feedData = await res.json();
      
      if (feedData && feedData.items) {
        for (const item of feedData.items) {
          const title = (item.title || '').trim();
          let description = (item.description || '').trim().replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          const link = (item.link || '').trim();
          
          const tNorm = (title + ' ' + description).toLowerCase();
          const isTender = tNorm.includes('appel d\'offres') || tNorm.includes('recrutement') || 
                           tNorm.includes('marché public') || tNorm.includes('marchés publics') || 
                           tNorm.includes('manifestation d\'intérêt') || tNorm.includes('prestataire') ||
                           tNorm.includes('consultation restreinte') || tNorm.includes('fourniture de') ||
                           tNorm.includes('acquisition de') || tNorm.includes('recrute un');

          const isReliefWeb = source.name === 'ReliefWeb';
          const isBurkina = tNorm.includes('burkina') || tNorm.includes('ouagadougou');
          
          if (isReliefWeb && !isBurkina) continue;

          if (isTender || (isReliefWeb && isBurkina)) {
            let documents = [];
            if (link && budgetOk()) {
              const pd = await fetchPageData(link, description);
              description = pd.text;
              documents = pd.documents;
            } else if (isPdfUrl(link)) {
              documents = [{ name: 'Document officiel (PDF)', url: link }];
            }

            const extDeadline = extractDeadline(description) || extractDeadline(title);
            const extOpening = extractOpeningTime(description);
            const cat = detectCategory(title, description);

            listTenders.push({
              title,
              description,
              source: source.name,
              link,
              documents,
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
      console.error(`[Scrape] Erreur sur ${source.name}:`, e.message);
    }
  }));

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
            const absDownload = absUrl(downloadLink, 'https://www.arcop.bf/') || downloadLink;
            const cat = detectCategory(titlePart, '');
            const extDeadline = extractDeadline(titlePart);

            // PDF direct détecté en synchrone ; sinon la passe d'enrichissement
            // ci-dessous ira chercher les PDF sur la page de détail.
            const documents = isPdfUrl(absDownload)
              ? [{ name: "Avis d'appel d'offres (PDF)", url: absDownload }]
              : [];

            listTenders.push({
              title: titlePart,
              description: `Avis d'appel d'offres officiel publié par l'ARCOP Burkina Faso. Téléchargez le document officiel pour consulter les détails et soumissionner.`,
              source: 'ARCOP Burkina Faso',
              link: absDownload,
              documents,
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
          href = `https://www.dgcmef.gov.bf${href}`;
        } else if (href.startsWith('http://www.dgcmef.gov.bf')) {
          href = href.replace('http://', 'https://');
        }

        const documents = isPdfUrl(href)
          ? [{ name: 'Le Quotidien (PDF)', url: href }]
          : [];

        listTenders.push({
          title: text,
          description: `Le Quotidien des Marchés Publics officiel du Burkina Faso. Téléchargez le PDF officiel de la DGCMEF pour consulter l'ensemble des avis de recrutement, demandes de prix et appels d'offres de la journée.`,
          source: 'DGCMEF Burkina Faso',
          link: href,
          documents,
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

  // Passe d'enrichissement : pour les marchés sans PDF direct (ARCOP/DGCMEF dont
  // le lien pointe vers une page de détail), on va y chercher les PDF. Bornée par
  // le budget temps pour ne pas dépasser maxDuration.
  for (const t of listTenders) {
    if (!budgetOk()) break;
    const noDocs = !(t.documents && t.documents.length);
    const isDetailPage = t.link && !isPdfUrl(t.link) && (t.source?.includes('ARCOP') || t.source?.includes('DGCMEF'));
    if (noDocs && isDetailPage) {
      const pd = await fetchPageData(t.link, '');
      if (pd.documents.length) t.documents = pd.documents;
    }
  }

  // ── Détection intelligente + classification automatique (§5) ──
  // On rejette le bruit (nominations, décrets, communiqués…) et on enrichit
  // chaque vrai marché avec des champs structurés (région, ministère, procédure,
  // montant, urgence, secteur, relation additif/report, titre normalisé).
  let rejected = 0;
  const classifiedTenders = [];
  for (const t of listTenders) {
    if (!isRealTender(t.title, t.description, t.source)) { rejected++; continue; }
    const c = classifyMarket({ title: t.title, description: t.description, category: t.category, deadline: t.deadline });
    classifiedTenders.push({ ...t, ...c });
  }

  // Déduplications et sauvegarde Firestore en parallèle pour gagner du temps
  let addedCount = 0;
  const newTenders = [];
  const tendersRef = collection(db, 'marches');
  const CLASSIF_KEYS = ['procedure', 'region', 'commune', 'ministere', 'montantEstime', 'urgence', 'secteur', 'relation', 'normalizedTitle'];

  await Promise.allSettled(classifiedTenders.map(async (tender) => {
    try {
      const q = query(tendersRef, where('title', '==', tender.title));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(tendersRef, tender);
        addedCount++;
        newTenders.push(tender);
      } else {
        const existingDoc = snap.docs[0];
        const existingData = existingDoc.data();
        const updates = {};
        if (tender.description && tender.description.length > (existingData.description || '').length) {
          updates.description = tender.description;
        }
        if (tender.documents && tender.documents.length && !(existingData.documents && existingData.documents.length)) {
          updates.documents = tender.documents;
        }
        // Rétro-remplit la classification sur les marchés déjà en base qui ne l'ont pas.
        for (const k of CLASSIF_KEYS) {
          if (existingData[k] === undefined && tender[k] !== undefined) updates[k] = tender[k];
        }
        if (Object.keys(updates).length) {
          await updateDoc(existingDoc.ref, updates);
        }
      }
    } catch (e) {
      console.error('[Scrape] Firestore error:', e.message);
    }
  }

  // Enregistre le run pour le suivi de santé du scraping (§1/§10 du cahier des charges)
  try {
    await addDoc(collection(db, 'scrape_runs'), {
      added: addedCount,
      total: listTenders.length,
      kept: classifiedTenders.length,
      rejected,
      status: 'success',
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[Scrape] log run error:', e.message);
  }

  // ── Lancement des alertes WhatsApp / SMS pour les nouveaux marchés ──
  let alertsReport = null;
  if (newTenders.length > 0) {
    alertsReport = await processAlertsForTenders(newTenders);
  }

  return Response.json({
    success: true,
    added: addedCount,
    total: listTenders.length,
    kept: classifiedTenders.length,
    rejected,
    alertsReport,
    timestamp: new Date().toISOString()
  });
}
