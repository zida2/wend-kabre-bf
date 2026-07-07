'use client';

import { useState, useMemo } from 'react';
import UserJourneysSection from './UserJourneysSection';
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const clean = (v, fallback = 'Inconnu') => (isStr(v) ? v.trim() : fallback);
const ts = (iso) => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
};
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

function fmtDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m}m ${rest}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ── Tuile statistique ─────────────────────────────────────────────
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

// ── Barres horizontales mono-teinte ───────────────────────────────
function BarList({ title, sub, data, labelWidth = 120, emptyLabel = 'Aucune donnée', valueSuffix = '', accent = 'var(--grad-primary)' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card">
      <h3 className="heading-sm" style={{ marginBottom: '2px' }}>{title}</h3>
      {sub && <p className="text-xs text-muted" style={{ marginBottom: '16px' }}>{sub}</p>}
      {data.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-sm" style={{ width: `${labelWidth}px`, flexShrink: 0, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.title || d.label}>{d.label}</span>
              <div style={{ flex: 1, height: '18px', background: 'var(--color-surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', minWidth: '4px', background: accent, borderRadius: '4px' }} />
              </div>
              <span className="text-sm font-bold" style={{ minWidth: '40px', flexShrink: 0, color: 'var(--text-primary)', textAlign: 'right' }}>{d.value}{valueSuffix}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Liste de rangs (top pages / recherches / boutons) ─────────────
function RankList({ title, sub, data, emptyLabel = 'Aucune donnée', danger = false }) {
  return (
    <div className="card">
      <h3 className="heading-sm" style={{ marginBottom: '2px' }}>{title}</h3>
      {sub && <p className="text-xs text-muted" style={{ marginBottom: '14px' }}>{sub}</p>}
      {data.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: '2px' }}>
          {data.map((d, i) => (
            <div key={d.label + i} className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-xs" style={{ width: '20px', flexShrink: 0, color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</span>
              <span className="text-sm" style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.title || d.label}>{d.label}</span>
              {d.meta && <span className="text-xs text-muted" style={{ flexShrink: 0 }}>{d.meta}</span>}
              <span className="badge" style={{ flexShrink: 0, background: danger ? 'var(--danger)' : 'var(--color-surface-2)', color: danger ? '#fff' : 'var(--text-primary)', fontWeight: 700 }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Entonnoir de conversion ───────────────────────────────────────
function FunnelStep({ label, value, share, rate, accent }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: accent }}>{value.toLocaleString('fr-FR')}</span>
      </div>
      <div style={{ height: '24px', background: 'var(--color-surface-2)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(share, value > 0 ? 3 : 0)}%`, height: '100%', minWidth: value > 0 ? '6px' : 0, background: accent, borderRadius: '6px', transition: 'width .3s' }} />
      </div>
      {rate != null && <div className="text-xs text-muted">↳ {rate}% depuis l'étape précédente</div>}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
export default function AnalyticsSection({ events = [], users = [] }) {
  const [viewMode, setViewMode] = useState('global');

  const a = useMemo(() => {
    const evts = Array.isArray(events) ? events : [];
    const by = (type) => evts.filter((e) => e && e.type === type);

    const pageViews = by('page_view');
    const marketViews = by('market_view');
    const searches = by('search');
    const noResults = by('search_no_result');
    const clicks = by('click');
    const downloads = by('download');
    const signupComplete = by('signup_complete');
    const subscribes = by('subscribe');
    const paymentStart = by('payment_start');
    const paymentAbandon = by('payment_abandon');

    // ── KPIs Trafic ──
    const visitorSet = new Set();
    const sessionSet = new Set();
    const visitorSessions = {};   // visitorId -> Set(sessionId)
    const visitorNewFlags = {};   // visitorId -> bool (a été vu comme récurrent)
    const sessionTimes = {};      // sessionId -> {min, max}
    const sessionPageViews = {};  // sessionId -> count page_view

    for (const e of evts) {
      const vid = e?.visitorId;
      const sid = e?.sessionId;
      if (isStr(vid)) {
        visitorSet.add(vid);
        if (isStr(sid)) {
          (visitorSessions[vid] = visitorSessions[vid] || new Set()).add(sid);
        }
        if (e.isNewVisitor === false) visitorNewFlags[vid] = true;
      }
      if (isStr(sid)) {
        sessionSet.add(sid);
        const t = ts(e?.createdAt);
        if (t != null) {
          const cur = sessionTimes[sid] || { min: t, max: t };
          cur.min = Math.min(cur.min, t);
          cur.max = Math.max(cur.max, t);
          sessionTimes[sid] = cur;
        }
        if (e?.type === 'page_view') sessionPageViews[sid] = (sessionPageViews[sid] || 0) + 1;
      }
    }

    const uniqueVisitors = visitorSet.size;
    const sessions = sessionSet.size;
    const returningVisitors = [...visitorSet].filter(
      (v) => visitorNewFlags[v] || (visitorSessions[v] && visitorSessions[v].size > 1),
    ).length;

    // Durée moyenne de session (uniquement sessions à durée mesurable)
    const durations = Object.values(sessionTimes).map((s) => s.max - s.min).filter((d) => d >= 0);
    const avgDuration = durations.length ? durations.reduce((x, y) => x + y, 0) / durations.length : 0;

    // Taux de rebond : sessions avec exactement 1 page_view / sessions ayant ≥1 page_view
    const sessionsWithPV = Object.keys(sessionPageViews).length;
    const bounceSessions = Object.values(sessionPageViews).filter((c) => c === 1).length;
    const bounceRate = pct(bounceSessions, sessionsWithPV);

    // ── Agrégateur générique ──
    const tally = (list, keyFn, labelFn) => {
      const map = new Map();
      for (const e of list) {
        const key = keyFn(e);
        if (key == null || key === '') continue;
        const rec = map.get(key) || { key, label: labelFn ? labelFn(e) : key, value: 0 };
        rec.value += 1;
        map.set(key, rec);
      }
      return [...map.values()].sort((x, y) => y.value - x.value);
    };

    // ── Provenance ──
    const byCountry = tally(evts, (e) => clean(e?.country), (e) => clean(e?.country)).slice(0, 8);
    const bySource = tally(
      evts,
      (e) => `${clean(e?.source, 'direct')} / ${clean(e?.medium, '—')}`,
      (e) => `${clean(e?.source, 'direct')} · ${clean(e?.medium, '—')}`,
    ).slice(0, 8);
    const byBrowser = tally(evts, (e) => clean(e?.browser)).slice(0, 6);
    const byDevice = tally(evts, (e) => clean(e?.device)).slice(0, 6);
    const byOS = tally(evts, (e) => clean(e?.os)).slice(0, 6);

    // ── Comportement ──
    const topPages = tally(pageViews, (e) => clean(e?.path, '/'), (e) => clean(e?.path, '/')).slice(0, 8);
    const topMarkets = tally(
      marketViews,
      (e) => clean(e?.props?.marketId, null) || clean(e?.props?.title, '—'),
      (e) => clean(e?.props?.title, null) || clean(e?.props?.marketId, '—'),
    ).slice(0, 8);
    const topSearches = tally(searches, (e) => clean(e?.props?.query, null)?.toLowerCase(), (e) => clean(e?.props?.query)).slice(0, 8);
    const noResultSearches = tally(noResults, (e) => clean(e?.props?.query, null)?.toLowerCase(), (e) => clean(e?.props?.query)).slice(0, 8);
    const topClicks = tally(
      clicks,
      (e) => clean(e?.props?.label, null) || clean(e?.props?.id, null),
      (e) => clean(e?.props?.label, null) || clean(e?.props?.id, '—'),
    ).slice(0, 8);

    // ── Entonnoir de conversion ──
    const nSignups = signupComplete.length;
    const nSubscribes = subscribes.length;
    const funnelBase = Math.max(uniqueVisitors, nSignups, nSubscribes, 1);
    const funnel = [
      { label: 'Visiteurs uniques', value: uniqueVisitors, share: pct(uniqueVisitors, funnelBase), rate: null, accent: 'var(--forest)' },
      { label: 'Inscriptions', value: nSignups, share: pct(nSignups, funnelBase), rate: pct(nSignups, uniqueVisitors), accent: 'var(--primary)' },
      { label: 'Abonnements', value: nSubscribes, share: pct(nSubscribes, funnelBase), rate: pct(nSubscribes, nSignups), accent: 'var(--accent)' },
    ];

    const nPayStart = paymentStart.length;
    const nPayAbandon = paymentAbandon.length;
    const payAbandonRate = pct(nPayAbandon, Math.max(nPayStart, nPayAbandon));

    return {
      total: evts.length,
      pageViews: pageViews.length,
      uniqueVisitors,
      returningVisitors,
      sessions,
      avgDuration,
      bounceRate,
      byCountry, bySource, byBrowser, byDevice, byOS,
      topPages, topMarkets, topSearches, noResultSearches, topClicks,
      downloads: downloads.length,
      funnel, nSignups, nSubscribes,
      nPayStart, nPayAbandon, payAbandonRate,
    };
  }, [events]);

  // ── Recommandations automatiques (règles) ──
  const recommendations = useMemo(() => {
    const recs = [];
    if (a.total === 0) return recs;

    if (a.total < 50) {
      recs.push({ tone: 'info', icon: '🌱', text: `La collecte vient de démarrer (${a.total} événements). Les tendances se préciseront à mesure du trafic.` });
    }

    // Meilleure source de trafic
    if (a.bySource.length > 0) {
      const best = a.bySource[0];
      recs.push({ tone: 'good', icon: '🚀', text: `Votre meilleure source de trafic est « ${best.label} » avec ${best.value} événements. Renforcez ce canal.` });
    }

    // Recherches sans résultat
    if (a.noResultSearches.length > 0) {
      const totalNoRes = a.noResultSearches.reduce((s, d) => s + d.value, 0);
      const tops = a.noResultSearches.slice(0, 3).map((d) => `« ${d.label} »`).join(', ');
      recs.push({ tone: 'warn', icon: '🔎', text: `${totalNoRes} recherche(s) sans résultat. Requêtes fréquentes non couvertes : ${tops}. Ajoutez des sources ou du contenu pour ces sujets.` });
    }

    // Taux de rebond
    if (a.bounceRate > 60) {
      recs.push({ tone: 'warn', icon: '⚠️', text: `Taux de rebond élevé (${a.bounceRate}%). Améliorez les pages d'entrée et les appels à l'action pour retenir les visiteurs.` });
    } else if (a.bounceRate > 0 && a.bounceRate <= 35) {
      recs.push({ tone: 'good', icon: '✅', text: `Bon taux de rebond (${a.bounceRate}%) : les visiteurs explorent plusieurs pages.` });
    }

    // Abandon paiement
    if (a.nPayStart > 0 && a.payAbandonRate > 40) {
      recs.push({ tone: 'danger', icon: '💳', text: `Abandon de paiement élevé (${a.payAbandonRate}%). Simplifiez le tunnel de paiement et rassurez sur les moyens de paiement locaux.` });
    }

    // Conversion inscription
    if (a.uniqueVisitors > 0 && a.nSignups > 0) {
      const convRate = pct(a.nSignups, a.uniqueVisitors);
      if (convRate < 2) {
        recs.push({ tone: 'warn', icon: '📉', text: `Faible conversion visiteur → inscription (${convRate}%). Mettez en avant la valeur de l'inscription dès la page d'accueil.` });
      }
    }

    // Récurrence faible
    if (a.uniqueVisitors >= 20 && pct(a.returningVisitors, a.uniqueVisitors) < 15) {
      recs.push({ tone: 'info', icon: '🔁', text: `Peu de visiteurs récurrents (${pct(a.returningVisitors, a.uniqueVisitors)}%). Envisagez des alertes e-mail pour faire revenir les visiteurs.` });
    }

    return recs.slice(0, 6);
  }, [a]);

  const TONE = {
    good: { bg: 'rgba(5,150,105,0.08)', border: 'var(--primary)', color: 'var(--primary-dark, var(--primary))' },
    info: { bg: 'var(--color-surface-2)', border: 'var(--forest)', color: 'var(--forest)' },
    warn: { bg: 'rgba(217,119,6,0.08)', border: 'var(--accent)', color: 'var(--accent)' },
    danger: { bg: 'rgba(220,38,38,0.08)', border: 'var(--danger)', color: 'var(--danger)' },
  };

  // ── État vide ──
  if (a.total === 0) {
    return (
      <div className="card flex flex-col items-center" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', marginBottom: '12px' }} aria-hidden="true">📈</span>
        <h3 className="heading-sm" style={{ marginBottom: '8px' }}>La collecte d'analytics vient de démarrer</h3>
        <p className="text-sm text-muted" style={{ maxWidth: '460px' }}>
          Les données apparaîtront ici à mesure que les visiteurs naviguent sur la plateforme —
          trafic, provenance, comportement et conversion.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Onglets ── */}
      <div className="flex gap-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        <button 
          className={`btn ${viewMode === 'global' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('global')}
          style={{ padding: '8px 16px' }}
        >
          🌍 Vue Globale
        </button>
        <button 
          className={`btn ${viewMode === 'journeys' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('journeys')}
          style={{ padding: '8px 16px' }}
        >
          🕵️‍♂️ Parcours Individuels (Deep Dive)
        </button>
      </div>

      {viewMode === 'journeys' ? (
        <UserJourneysSection events={events} users={users} />
      ) : (
        <>
          {/* ── KPIs Trafic ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        <StatTile icon="👁️" label="Pages vues" value={a.pageViews.toLocaleString('fr-FR')} sub={`${a.total.toLocaleString('fr-FR')} événements`} accent="var(--forest)" />
        <StatTile icon="🧑" label="Visiteurs uniques" value={a.uniqueVisitors.toLocaleString('fr-FR')} accent="var(--primary)" />
        <StatTile icon="🔁" label="Visiteurs récurrents" value={a.returningVisitors.toLocaleString('fr-FR')} sub={`${pct(a.returningVisitors, a.uniqueVisitors)}% des uniques`} accent="var(--forest)" />
        <StatTile icon="🗂️" label="Sessions" value={a.sessions.toLocaleString('fr-FR')} accent="var(--primary)" />
        <StatTile icon="⏱️" label="Durée moy. session" value={fmtDuration(a.avgDuration)} accent="var(--accent)" />
        <StatTile icon="↩️" label="Taux de rebond" value={`${a.bounceRate}%`} sub={a.bounceRate > 60 ? 'À améliorer' : 'Correct'} accent={a.bounceRate > 60 ? 'var(--danger)' : 'var(--primary)'} />
      </div>

      {/* ── Provenance ── */}
      <div>
        <h2 className="heading-sm" style={{ marginBottom: '12px' }}>🌍 Provenance du trafic</h2>
        <div className="grid grid-2 gap-6">
          <BarList title="Par pays" sub="Répartition géographique des événements" data={a.byCountry} labelWidth={120} />
          <BarList title="Par source" sub="Canal d'acquisition (source · medium)" data={a.bySource} labelWidth={140} />
          <BarList title="Par navigateur" sub="Navigateurs utilisés" data={a.byBrowser} labelWidth={110} />
          <BarList title="Par appareil" sub="Type d'appareil" data={a.byDevice} labelWidth={110} />
        </div>
        <div style={{ marginTop: '24px' }}>
          <BarList title="Par système d'exploitation" sub="OS des visiteurs" data={a.byOS} labelWidth={110} />
        </div>
      </div>

      {/* ── Comportement ── */}
      <div>
        <h2 className="heading-sm" style={{ marginBottom: '12px' }}>🧭 Comportement des visiteurs</h2>
        <div className="grid grid-2 gap-6">
          <RankList title="Top pages consultées" sub="Par chemin (page_view)" data={a.topPages} emptyLabel="Aucune page vue." />
          <RankList title="Top marchés consultés" sub="Fiches marché les plus ouvertes" data={a.topMarkets} emptyLabel="Aucune fiche consultée." />
          <RankList title="Top recherches" sub="Requêtes les plus fréquentes" data={a.topSearches} emptyLabel="Aucune recherche." />
          <RankList title="Recherches sans résultat" sub="Demande non couverte — à traiter en priorité" data={a.noResultSearches} emptyLabel="Aucune recherche infructueuse. 👍" danger />
          <RankList title="Boutons les plus cliqués" sub="Interactions (click)" data={a.topClicks} emptyLabel="Aucun clic suivi." />
          <div className="card flex flex-col justify-center" style={{ alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '1.8rem', marginBottom: '6px' }} aria-hidden="true">⬇️</span>
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{a.downloads.toLocaleString('fr-FR')}</div>
            <div className="text-sm text-muted" style={{ marginTop: '6px' }}>Téléchargements de documents</div>
          </div>
        </div>
      </div>

      {/* ── Entonnoir de conversion ── */}
      <div>
        <h2 className="heading-sm" style={{ marginBottom: '12px' }}>🎯 Entonnoir de conversion</h2>
        <div className="grid grid-2 gap-6">
          <div className="card flex flex-col gap-4">
            {a.funnel.map((f) => (
              <FunnelStep key={f.label} label={f.label} value={f.value} share={f.share} rate={f.rate} accent={f.accent} />
            ))}
          </div>
          <div className="card flex flex-col gap-3">
            <h3 className="heading-sm" style={{ marginBottom: '2px' }}>Tunnel de paiement</h3>
            <p className="text-xs text-muted">Paiements initiés vs abandonnés</p>
            <div className="grid grid-2 gap-3">
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                <div className="text-xs text-muted">Paiements initiés</div>
                <div className="font-display" style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{a.nPayStart}</div>
              </div>
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                <div className="text-xs text-muted">Paiements abandonnés</div>
                <div className="font-display" style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--danger)' }}>{a.nPayAbandon}</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                <span className="text-sm" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Taux d'abandon</span>
                <span className="text-sm font-bold" style={{ color: a.payAbandonRate > 40 ? 'var(--danger)' : 'var(--accent)' }}>{a.payAbandonRate}%</span>
              </div>
              <div style={{ height: '18px', background: 'var(--color-surface-2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(a.payAbandonRate, 100)}%`, height: '100%', minWidth: a.nPayAbandon > 0 ? '6px' : 0, background: a.payAbandonRate > 40 ? 'var(--danger)' : 'var(--accent)', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommandations ── */}
      {recommendations.length > 0 && (
        <div className="card">
          <h2 className="heading-sm" style={{ marginBottom: '4px' }}>💡 Recommandations</h2>
          <p className="text-xs text-muted" style={{ marginBottom: '16px' }}>Conseils générés automatiquement à partir de vos données</p>
          <div className="flex flex-col gap-3">
            {recommendations.map((r, i) => {
              const t = TONE[r.tone] || TONE.info;
              return (
                <div key={i} className="flex items-start gap-3" style={{ padding: '12px 14px', background: t.bg, borderLeft: `3px solid ${t.border}`, borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1.3 }} aria-hidden="true">{r.icon}</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{r.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
