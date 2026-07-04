'use client';

import { useMemo } from 'react';

const REVENUE_PER_PREMIUM = 15000; // FCFA / mois (estimation)
const DAY = 24 * 60 * 60 * 1000;

function StatTile({ icon, label, value, sub, accent = 'var(--primary)' }) {
  return (
    <div className="card" style={{ padding: '18px', borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: '1.15rem' }} aria-hidden="true">{icon}</span>
      </div>
      <div className="font-display" style={{ fontSize: '1.7rem', fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="text-xs text-muted" style={{ marginTop: '5px' }}>{sub}</div>}
    </div>
  );
}

// ── Aire mono-série : croissance cumulée des inscriptions (6 derniers mois) ──
function SignupsArea({ users }) {
  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() });
    }
    return months.map((m) => ({
      label: m.label,
      value: users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() < m.end).length,
    }));
  }, [users]);

  const W = 560, H = 180, PAD = { l: 34, r: 14, t: 16, b: 26 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v) => PAD.t + plotH - (v / max) * plotH;
  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPts = `${PAD.l},${PAD.t + plotH} ${linePts} ${PAD.l + plotW},${PAD.t + plotH}`;
  const gridVals = [0, Math.round(max / 2), max];

  return (
    <div className="card">
      <h3 className="heading-sm" style={{ marginBottom: '2px' }}>Croissance des inscriptions</h3>
      <p className="text-xs text-muted" style={{ marginBottom: '14px' }}>Nombre cumulé de comptes — 6 derniers mois</p>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: '420px', display: 'block' }} role="img" aria-label="Croissance cumulée des inscriptions sur 6 mois">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(5,150,105,0.22)" />
              <stop offset="100%" stopColor="rgba(5,150,105,0.02)" />
            </linearGradient>
          </defs>
          {gridVals.map((g, i) => (
            <g key={i}>
              <line x1={PAD.l} y1={y(g)} x2={W - PAD.r} y2={y(g)} stroke="var(--color-border)" strokeWidth="1" />
              <text x={PAD.l - 8} y={y(g) + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{g}</text>
            </g>
          ))}
          <polygon points={areaPts} fill="url(#areaFill)" />
          <polyline points={linePts} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--primary)" stroke="#fff" strokeWidth="1.5">
                <title>{d.label} : {d.value} comptes</title>
              </circle>
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{d.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Barres horizontales mono-teinte : marchés par secteur ──
function MarchesByCategory({ marches }) {
  const data = useMemo(() => {
    const counts = {};
    for (const m of marches) {
      const c = m.category || 'Général';
      counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [marches]);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="card">
      <h3 className="heading-sm" style={{ marginBottom: '2px' }}>Marchés par secteur</h3>
      <p className="text-xs text-muted" style={{ marginBottom: '16px' }}>Répartition des {marches.length} marchés en base</p>
      {data.length === 0 ? (
        <p className="text-sm text-muted">Aucun marché en base.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-sm" style={{ width: '110px', flexShrink: 0, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>{d.label}</span>
              <div style={{ flex: 1, height: '18px', background: 'var(--color-surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', minWidth: '4px', background: 'var(--grad-primary)', borderRadius: '4px' }} />
              </div>
              <span className="text-sm font-bold" style={{ width: '34px', flexShrink: 0, color: 'var(--text-primary)' }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Temps relatif court ──
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}

const ACTION_ICON = {
  subscription_update: '💎',
  payment_approved: '✅',
  payment_rejected: '🚫',
  marche_delete: '🗑️',
  user_delete: '🗑️',
};

// ── Santé du scraping ──
function ScrapingHealth({ runs }) {
  const last = runs[0];
  const ok = last?.status === 'success';
  return (
    <div className="card">
      <h3 className="heading-sm" style={{ marginBottom: '14px' }}>Santé du scraping</h3>
      {!last ? (
        <p className="text-sm text-muted">Aucun run enregistré pour l'instant. Lancez une extraction ou attendez le cron (06:00 UTC).</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="dot" style={{ background: ok ? 'var(--primary)' : 'var(--danger)' }}></span>
            <span className="text-sm" style={{ fontWeight: 600, color: ok ? 'var(--primary-dark)' : 'var(--danger)' }}>
              {ok ? 'Opérationnel' : 'Erreur au dernier run'}
            </span>
            <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{timeAgo(last.createdAt)}</span>
          </div>
          <div className="grid grid-2 gap-3">
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <div className="text-xs text-muted">Ajoutés (dernier run)</div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>+{last.added ?? 0}</div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <div className="text-xs text-muted">Analysés</div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{last.total ?? 0}</div>
            </div>
          </div>
          <div className="text-xs text-muted">{runs.length} run{runs.length > 1 ? 's' : ''} récent{runs.length > 1 ? 's' : ''} enregistré{runs.length > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

// ── Activité récente (journal d'audit) ──
function RecentActivity({ logs }) {
  return (
    <div className="card">
      <h3 className="heading-sm" style={{ marginBottom: '14px' }}>Activité récente</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-muted">Aucune action enregistrée pour l'instant.</p>
      ) : (
        <div className="flex flex-col" style={{ gap: '2px' }}>
          {logs.slice(0, 8).map((l) => (
            <div key={l.id} className="flex items-start gap-3" style={{ padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '1rem' }} aria-hidden="true">{ACTION_ICON[l.action] || '•'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{l.message || l.action}</div>
                <div className="text-xs text-muted">{l.actorEmail} · {timeAgo(l.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OverviewSection({ users, marches, requests, scrapeRuns = [], adminLogs = [] }) {
  const now = Date.now();
  const premiumCount = users.filter((u) => u.isSubscribed && !u.isTrial).length;
  const pendingPayments = requests.filter((r) => r.status === 'pending').length;
  const activeAlerts = users.filter((u) => u.alertPrefs?.active === true).length;
  const revenue = premiumCount * REVENUE_PER_PREMIUM;
  const newUsers7d = users.filter((u) => u.createdAt && now - new Date(u.createdAt).getTime() < 7 * DAY).length;
  const newMarches24h = marches.filter((m) => m.publishedAt && now - new Date(m.publishedAt).getTime() < DAY).length;
  const expiringSoon = marches.filter((m) => {
    if (!m.deadline) return false;
    const t = new Date(m.deadline).getTime();
    return !isNaN(t) && t >= now && t - now <= 7 * DAY;
  }).length;
  const conversion = users.length ? Math.round((premiumCount / users.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <StatTile icon="👥" label="Utilisateurs" value={users.length} sub={`+${newUsers7d} sur 7 j`} accent="var(--forest)" />
        <StatTile icon="💎" label="Abonnés Premium" value={premiumCount} sub={`${revenue.toLocaleString('fr-FR')} FCFA/mois`} accent="var(--accent)" />
        <StatTile icon="📈" label="Taux de conversion" value={`${conversion}%`} sub="inscription → abonnement" accent="var(--primary)" />
        <StatTile icon="📄" label="Marchés en base" value={marches.length} accent="var(--primary)" />
        <StatTile icon="🆕" label="Nouveaux marchés" value={newMarches24h} sub="dernières 24 h" accent="var(--forest)" />
        <StatTile icon="⏳" label="Expirent bientôt" value={expiringSoon} sub="sous 7 jours" accent={expiringSoon > 0 ? 'var(--accent)' : 'var(--primary)'} />
        <StatTile icon="💳" label="Paiements en attente" value={pendingPayments} sub={pendingPayments > 0 ? 'Action requise' : 'À jour'} accent={pendingPayments > 0 ? 'var(--danger)' : 'var(--primary)'} />
        <StatTile icon="🔔" label="Alertes actives" value={activeAlerts} accent="var(--forest)" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-2 gap-6">
        <SignupsArea users={users} />
        <MarchesByCategory marches={marches} />
      </div>

      {/* Santé + activité */}
      <div className="grid grid-2 gap-6">
        <ScrapingHealth runs={scrapeRuns} />
        <RecentActivity logs={adminLogs} />
      </div>
    </div>
  );
}
