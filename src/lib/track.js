'use client';

// ─────────────────────────────────────────────────────────────────────
// Collecte d'événements analytics (côté client) → POST /api/track.
// Identité visiteur : visitorId persistant (localStorage) pour distinguer
// visiteurs uniques/récurrents, sessionId (sessionStorage) pour les sessions.
// Envoi « fire-and-forget » (keepalive) pour ne jamais bloquer l'UI.
// ─────────────────────────────────────────────────────────────────────

const VID_KEY = 'wk_vid';
const SID_KEY = 'wk_sid';

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxxyxxxxyxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }) + Date.now().toString(36);
}

export function getVisitorId() {
  if (typeof window === 'undefined') return null;
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) { v = uuid(); localStorage.setItem(VID_KEY, v); }
    return v;
  } catch { return null; }
}

// Session : nouvel identifiant si plus de 30 min d'inactivité.
export function getSessionId() {
  if (typeof window === 'undefined') return null;
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(SID_KEY);
    let sid, last;
    if (raw) { [sid, last] = raw.split('|'); }
    if (!sid || !last || now - Number(last) > 30 * 60 * 1000) {
      sid = uuid();
    }
    sessionStorage.setItem(SID_KEY, `${sid}|${now}`);
    return sid;
  } catch { return null; }
}

// Est-ce un visiteur récurrent ? (a déjà un visitorId d'une session précédente)
export function isReturningVisitor() {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem('wk_seen') === '1'; } catch { return false; }
}

let currentUserId = null;
export function setTrackedUser(uid) { currentUserId = uid || null; }

/**
 * Enregistre un événement analytics.
 * @param {string} type  - ex: 'page_view', 'search', 'market_view', 'download',
 *                         'click', 'signup_start', 'signup_complete',
 *                         'payment_start', 'payment_abandon', 'subscribe',
 *                         'search_no_result'
 * @param {object} props - données spécifiques (query, marketId, category, ...)
 */
export function track(type, props = {}) {
  if (typeof window === 'undefined') return;
  try {
    const firstTime = !isReturningVisitor();
    const payload = {
      type,
      path: window.location.pathname,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      userId: currentUserId,
      isNewVisitor: firstTime,
      ref: document.referrer || '',
      ua: navigator.userAgent || '',
      lang: navigator.language || '',
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      props,
      ts: new Date().toISOString(),
    };
    try { localStorage.setItem('wk_seen', '1'); } catch {}

    const body = JSON.stringify(payload);
    // sendBeacon si dispo (survit à la navigation), sinon fetch keepalive.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* silencieux : l'analytics ne doit jamais casser l'app */
  }
}

export function trackPageView(extra = {}) {
  track('page_view', extra);
}
