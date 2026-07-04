// Ingestion des événements analytics. Enrichit chaque événement avec la
// géolocalisation (en-têtes Vercel) et l'analyse du User-Agent, puis écrit
// dans la collection Firestore `events` (append-only, lecture admin).
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

function parseUA(ua = '') {
  const u = ua.toLowerCase();
  // Appareil
  let device = 'desktop';
  if (/ipad|tablet|playbook|silk/.test(u) || (/android/.test(u) && !/mobile/.test(u))) device = 'tablet';
  else if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(u)) device = 'mobile';
  // OS
  let os = 'Autre';
  if (/windows nt/.test(u)) os = 'Windows';
  else if (/iphone|ipad|ipod/.test(u)) os = 'iOS';
  else if (/mac os x/.test(u)) os = 'macOS';
  else if (/android/.test(u)) os = 'Android';
  else if (/linux/.test(u)) os = 'Linux';
  // Navigateur (ordre important : Edge/Samsung avant Chrome)
  let browser = 'Autre';
  if (/edg\//.test(u)) browser = 'Edge';
  else if (/samsungbrowser/.test(u)) browser = 'Samsung Internet';
  else if (/opr\/|opera/.test(u)) browser = 'Opera';
  else if (/firefox\//.test(u)) browser = 'Firefox';
  else if (/chrome\//.test(u)) browser = 'Chrome';
  else if (/safari\//.test(u)) browser = 'Safari';
  return { device, os, browser };
}

function sourceFromRef(ref = '') {
  if (!ref) return { source: 'Direct', medium: 'direct' };
  let host = '';
  try { host = new URL(ref).hostname.toLowerCase().replace(/^www\./, ''); } catch { return { source: 'Direct', medium: 'direct' }; }
  const map = [
    [/google\./, 'Google'], [/bing\./, 'Bing'], [/duckduckgo\./, 'DuckDuckGo'], [/yahoo\./, 'Yahoo'],
    [/facebook\.|fb\.com|fb\.me/, 'Facebook'], [/instagram\./, 'Instagram'],
    [/t\.co|twitter\.|x\.com/, 'Twitter/X'], [/linkedin\./, 'LinkedIn'],
    [/whatsapp|wa\.me/, 'WhatsApp'], [/t\.me|telegram/, 'Telegram'], [/youtube\./, 'YouTube'], [/tiktok\./, 'TikTok'],
  ];
  for (const [re, name] of map) {
    if (re.test(host)) {
      const medium = /google|bing|duckduckgo|yahoo/.test(host) ? 'organic' : 'social';
      return { source: name, medium };
    }
  }
  return { source: host, medium: 'referral' };
}

export async function POST(request) {
  let e;
  try {
    e = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!e || !e.type) return Response.json({ ok: false }, { status: 400 });

  const h = request.headers;
  const geo = {
    country: h.get('x-vercel-ip-country') || 'Inconnu',
    region: h.get('x-vercel-ip-country-region') || 'Inconnu',
    city: decodeURIComponent(h.get('x-vercel-ip-city') || 'Inconnu'),
  };
  const { device, os, browser } = parseUA(e.ua);
  const { source, medium } = sourceFromRef(e.ref);

  const doc = {
    type: String(e.type).slice(0, 40),
    path: String(e.path || '').slice(0, 300),
    visitorId: String(e.visitorId || 'anon').slice(0, 60),
    sessionId: String(e.sessionId || 'anon').slice(0, 60),
    userId: e.userId ? String(e.userId).slice(0, 60) : null,
    isNewVisitor: !!e.isNewVisitor,
    props: (e.props && typeof e.props === 'object') ? e.props : {},
    lang: String(e.lang || '').slice(0, 12),
    screen: String(e.screen || '').slice(0, 16),
    ...geo,
    device, os, browser,
    source, medium,
    createdAt: e.ts || new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'events'), doc);
  } catch (err) {
    // silencieux : ne jamais renvoyer d'erreur au client analytics
    console.error('[track] write error:', err?.message);
  }
  return Response.json({ ok: true });
}
