'use client';

import { useMemo } from 'react';

const REVENUE_PER_PREMIUM = 15000; // FCFA / mois (estimation)

function StatTile({ icon, label, value, sub, accent = 'var(--primary)' }) {
  return (
    <div className="card" style={{ padding: '20px', borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: '1.3rem' }} aria-hidden="true">{icon}</span>
      </div>
      <div className="font-display" style={{ fontSize: '1.9rem', fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="text-xs text-muted" style={{ marginTop: '6px' }}>{sub}</div>}
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
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('fr-FR', { month: 'short' }), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() });
    }
    return months.map((m) => ({
      label: m.label,
      // cumul des inscriptions jusqu'à la fin de ce mois
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
          {/* grille discrète */}
          {gridVals.map((g, i) => (
            <g key={i}>
              <line x1={PAD.l} y1={y(g)} x2={W - PAD.r} y2={y(g)} stroke="var(--color-border)" strokeWidth="1" />
              <text x={PAD.l - 8} y={y(g) + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{g}</text>
            </g>
          ))}
          {/* aire + ligne */}
          <polygon points={areaPts} fill="url(#areaFill)" />
          <polyline points={linePts} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* points + labels x */}
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

export default function OverviewSection({ users, marches, requests }) {
  const premiumCount = users.filter((u) => u.isSubscribed && !u.isTrial).length;
  const pendingPayments = requests.filter((r) => r.status === 'pending').length;
  const activeAlerts = users.filter((u) => u.alertPrefs?.active === true).length;
  const revenue = premiumCount * REVENUE_PER_PREMIUM;

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-3 gap-4">
        <StatTile icon="👥" label="Utilisateurs" value={users.length} accent="var(--forest)" />
        <StatTile icon="💎" label="Abonnés Premium" value={premiumCount} sub={`CA estimé : ${revenue.toLocaleString('fr-FR')} FCFA/mois`} accent="var(--accent)" />
        <StatTile icon="📄" label="Marchés en base" value={marches.length} accent="var(--primary)" />
        <StatTile icon="💳" label="Paiements en attente" value={pendingPayments} sub={pendingPayments > 0 ? 'Action requise' : 'À jour'} accent={pendingPayments > 0 ? 'var(--danger)' : 'var(--primary)'} />
        <StatTile icon="🔔" label="Alertes actives" value={activeAlerts} accent="var(--forest)" />
        <StatTile icon="📊" label="Taux Premium" value={`${users.length ? Math.round((premiumCount / users.length) * 100) : 0}%`} sub="des utilisateurs" accent="var(--primary)" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-2 gap-6">
        <SignupsArea users={users} />
        <MarchesByCategory marches={marches} />
      </div>
    </div>
  );
}
