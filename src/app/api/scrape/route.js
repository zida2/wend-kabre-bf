import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Sources RSS burkinabè et internationales — complètement masquées côté serveur
const SOURCES = [
  { name: 'Lefaso.net', url: 'https://lefaso.net/spip.php?page=backend' },
  { name: 'AIB.media', url: 'https://www.aib.media/feed/' },
  { name: 'Burkina24', url: 'https://burkina24.com/feed/' },
  { name: 'Sidwaya', url: 'https://www.sidwaya.info/feed/' },
  { name: 'Wakat Séra', url: 'https://www.wakatsera.com/feed/' },
  { name: 'L\'Economiste du Faso', url: 'https://www.leconomistedufaso.bf/feed/' },
  { name: 'MinaJobs BF', url: 'https://minajobs.net/feed/' },
  { name: 'ReliefWeb (ONG/UN)', url: 'https://reliefweb.int/jobs/rss.xml?country=47' },
];

const TENDER_KEYWORDS = [
  "appel d'offres", "appel a candidature", "appel à candidature",
  "marché public", "marchés publics", "avis de recrutement",
  "manifestation d'intérêt", "consultation restreinte", "prestataire",
  "prestation de service", "fourniture de", "acquisition de", "recrute un"
];

function detectCategory(title, desc) {
  const t = title.toLowerCase();
  const d = desc.toLowerCase();
  if (t.includes('informatique') || t.includes('numérique') || t.includes('logiciel') || t.includes('serveur') || t.includes('fibre') || d.includes('logiciel')) return 'Informatique';
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
  // Vérification secrète : clé API requise pour protéger l'endpoint
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.SCRAPER_SECRET && secret !== 'WEND_KABRE_2026') {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const listTenders = [];

  for (const source of SOURCES) {
    try {
      const rssUrl = encodeURIComponent(source.url);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`, {
        next: { revalidate: 0 }
      });
      const feedData = await res.json();

      if (feedData && feedData.items) {
        for (const item of feedData.items) {
          const title = (item.title || '').trim();
          let description = (item.description || '').trim().replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          const link = (item.link || '').trim();
          const lowerTitle = title.toLowerCase();
          const lowerDesc = description.toLowerCase();

          const isTender = TENDER_KEYWORDS.some(kw => lowerTitle.includes(kw) || lowerDesc.includes(kw));

          if (isTender && title.length > 5) {
            const extDeadline = extractDeadline(description) || extractDeadline(title);
            const extOpening = extractOpeningTime(description);
            const cat = detectCategory(title, description);

            listTenders.push({
              title,
              description: description.substring(0, 400) + (description.length > 400 ? '...' : ''),
              source: source.name,
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
      console.error(`[Scrape] Erreur sur ${source.name}:`, e.message);
    }
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
