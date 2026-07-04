// Proxy de lecture PDF : récupère un PDF distant côté serveur et le renvoie
// « inline » depuis notre domaine. Permet de lire le document DANS la plateforme
// (les sites officiels bloquent souvent l'iframe via X-Frame-Options / CORS).
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Allowlist de domaines de confiance (anti open-proxy / SSRF).
function isAllowedHost(host) {
  const h = host.toLowerCase();
  return h === 'reliefweb.int' || h.endsWith('.reliefweb.int') || h.endsWith('.bf') || h === 'bf';
}

const MAX_BYTES = 25 * 1024 * 1024; // 25 Mo

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('url');
  if (!raw) return new Response('Paramètre "url" manquant', { status: 400 });

  let target;
  try {
    target = new URL(raw);
  } catch {
    return new Response('URL invalide', { status: 400 });
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return new Response('Protocole non autorisé', { status: 400 });
  }
  if (!isAllowedHost(target.hostname)) {
    return new Response('Domaine non autorisé', { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(target.href, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/pdf,*/*' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(`Document introuvable (source ${res.status})`, { status: 502 });
    }

    const len = Number(res.headers.get('content-length') || '0');
    if (len && len > MAX_BYTES) {
      return new Response('Document trop volumineux', { status: 413 });
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return new Response('Document trop volumineux', { status: 413 });
    }

    const filename = decodeURIComponent(target.pathname.split('/').pop() || 'document.pdf').replace(/[^\w.\-]/g, '_');

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename.endsWith('.pdf') ? filename : filename + '.pdf'}"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    return new Response('Erreur de récupération du document', { status: 502 });
  }
}
