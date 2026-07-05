'use client';

import { useMemo } from 'react';

// ── Helpers robustes ──────────────────────────────────────────────
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

// Normalise un libellé de dimension : les valeurs vides ou « Non spécifié »
// sont regroupées sous « Non précisé ».
const label = (v) => {
  if (!isStr(v)) return 'Non précisé';
  const t = v.trim();
  return /^non\s*(spécifié|precise|précisé|specifie)/i.test(t) ? 'Non précisé' : t;
};

// Parse un montant depuis un nombre ou une chaîne « 12 000 000 FCFA ».
const parseMontant = (v) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v > 0 ? v : 0;
  if (typeof v !== 'string') return 0;
  const digits = v.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const fmtFCFA = (n) => {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')} Md`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} k`;
  return String(n);
};

// Agrège un tableau de marchés selon un accesseur de dimension.
const tallyBy = (list, accessor, limit = 10) => {
  const map = new Map();
  for (const item of list) {
    const key = label(accessor(item));
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([k, value]) => ({ label: k, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

// Un document ressemble-t-il à un PDF ?
// Détecte explicitement le format ; à défaut de métadonnée, ne l'exclut que
// s'il correspond clairement à un autre type de fichier.
const looksLikePdf = (d) => {
  const s = String(typeof d === 'string' ? d : d?.url || d?.name || d?.href || d?.title || '');
  const type = String((typeof d === 'object' && d) ? d.type || d.mime || '' : '');
  if (/\.pdf(\?|#|$)/i.test(s) || /pdf/i.test(type)) return true;
  return !/\.(docx?|xlsx?|pptx?|zip|rar|jpe?g|png|gif)(\?|#|$)/i.test(s);
};
// Un marché possède-t-il au moins un document PDF ?
const hasPdf = (m) => {
  const docs = m?.documents;
  if (!Array.isArray(docs) || docs.length === 0) return false;
  return docs.some(looksLikePdf);
};

// ── Tuile statistique (aligné sur OverviewSection) ─────────────────
function StatTile({ icon, label: lbl, value, sub, accent = 'var(--primary)' }) {
  return (
    <div className="card" style={{ padding: '18px', borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{lbl}</span>
        <span style={{ fontSize: '1.15rem' }} aria-hidden="true">{icon}</span>
      </div>
      <div className="font-display" style={{ fontSize: '1.7rem', fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="text-xs text-muted" style={{ marginTop: '5px' }}>{sub}</div>}
    </div>
  );
}

// ── Barres horizontales mono-teinte (aligné sur OverviewSection) ───
function BarList({ title, sub, data, labelWidth = 130, valueSuffix = '', emptyLabel = 'Aucune donnée disponible.' }) {
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
              <span
                className="text-sm"
                style={{ width: `${labelWidth}px`, flexShrink: 0, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={d.label}
              >
                {d.label}
              </span>
              <div style={{ flex: 1, height: '18px', background: 'var(--color-surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', minWidth: '4px', background: 'var(--grad-primary)', borderRadius: '4px' }} />
              </div>
              <span className="text-sm font-bold" style={{ minWidth: '40px', flexShrink: 0, color: 'var(--text-primary)', textAlign: 'right' }}>{d.value}{valueSuffix}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Liste de rangs (comportement produit) ─────────────────────────
function RankList({ title, sub, data, emptyLabel = 'Aucune donnée.' }) {
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
              <span className="text-sm" style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>{d.label}</span>
              <span className="badge" style={{ flexShrink: 0, background: 'var(--color-surface-2)', color: 'var(--text-primary)', fontWeight: 700 }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
export default function StatsSection({ marches = [], events = [], scrapeRuns = [], users = [] }) {
  const stats = useMemo(() => {
    const mk = Array.isArray(marches) ? marches.filter(Boolean) : [];
    const evts = Array.isArray(events) ? events.filter(Boolean) : [];
    const runs = Array.isArray(scrapeRuns) ? scrapeRuns.filter(Boolean) : [];

    // ── Marchés : répartitions ──
    const byMinistere = tallyBy(mk, (m) => m.ministere);
    const byRegion = tallyBy(mk, (m) => m.region);
    const bySecteur = tallyBy(mk, (m) => m.secteur ?? m.category);
    const byProcedure = tallyBy(mk, (m) => m.procedure);

    // ── Valeur ──
    let valeurCumulee = 0;
    let marchesAvecMontant = 0;
    for (const m of mk) {
      const v = parseMontant(m.montantEstime);
      if (v > 0) { valeurCumulee += v; marchesAvecMontant += 1; }
    }
    const marchesUrgents = mk.filter((m) => isStr(m.urgence) && /urgent/i.test(m.urgence)).length;

    // ── Qualité scraping ──
    const runsWithStatus = runs.filter((r) => isStr(r.status));
    const successRuns = runsWithStatus.filter((r) => r.status === 'success').length;
    const successRate = runsWithStatus.length ? Math.round((successRuns / runsWithStatus.length) * 100) : null;
    const totalAdded = runs.reduce((s, r) => s + (Number(r.kept) || Number(r.added) || 0), 0);
    const totalRejected = runs.reduce((s, r) => s + (Number(r.rejected) || 0), 0);
    const pdfAnalyses = mk.filter((m) => m.aiAnalysis != null && m.aiAnalysis !== '' && !(typeof m.aiAnalysis === 'object' && Object.keys(m.aiAnalysis).length === 0)).length;
    const marchesAvecPdf = mk.filter(hasPdf).length;

    // ── Comportement produit (events) ──
    const marketViews = evts.filter((e) => e.type === 'market_view');
    const searches = evts.filter((e) => e.type === 'search');
    const downloads = evts.filter((e) => e.type === 'download');

    const topMarches = tallyBy(marketViews, (e) => e?.props?.title, 8);

    const searchTally = tallyBy(searches, (e) => (isStr(e?.props?.query) ? e.props.query.trim() : ''), 8)
      .filter((d) => d.label !== 'Non précisé');

    // Mots-clés : décompose chaque requête en tokens
    const kwMap = new Map();
    for (const e of searches) {
      const q = e?.props?.query;
      if (!isStr(q)) continue;
      const tokens = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
      for (const t of new Set(tokens)) kwMap.set(t, (kwMap.get(t) || 0) + 1);
    }
    const topKeywords = [...kwMap.entries()]
      .map(([k, value]) => ({ label: k, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      totalMarches: mk.length,
      byMinistere, byRegion, bySecteur, byProcedure,
      valeurCumulee, marchesAvecMontant, marchesUrgents,
      successRate, successRuns, runsCount: runsWithStatus.length,
      totalAdded, totalRejected, pdfAnalyses, marchesAvecPdf,
      topMarches, searchTally, topKeywords,
      downloadsTotal: downloads.length,
      hasAnyData: mk.length > 0 || evts.length > 0 || runs.length > 0,
    };
  }, [marches, events, scrapeRuns]);

  // ── État vide ──
  if (!stats.hasAnyData) {
    return (
      <div className="card flex flex-col items-center" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', marginBottom: '12px' }} aria-hidden="true">📊</span>
        <h3 className="heading-sm" style={{ marginBottom: '8px' }}>Aucune statistique à afficher</h3>
        <p className="text-sm text-muted" style={{ maxWidth: '460px' }}>
          Les statistiques avancées apparaîtront ici dès que des marchés seront collectés
          et que la plateforme enregistrera de l&apos;activité.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Tuiles de tête ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <StatTile icon="📄" label="Marchés en base" value={stats.totalMarches.toLocaleString('fr-FR')} accent="var(--primary)" />
        <StatTile icon="🤖" label="PDF analysés (IA)" value={stats.pdfAnalyses.toLocaleString('fr-FR')} sub={`${stats.marchesAvecPdf} marchés avec PDF`} accent="var(--forest)" />
        <StatTile icon="💰" label="Valeur estimée cumulée" value={`${fmtFCFA(stats.valeurCumulee)} FCFA`} sub={`sur ${stats.marchesAvecMontant} marchés chiffrés`} accent="var(--accent)" />
        <StatTile icon="⚡" label="Marchés urgents" value={stats.marchesUrgents.toLocaleString('fr-FR')} sub={stats.marchesUrgents > 0 ? 'à traiter en priorité' : 'aucun en cours'} accent={stats.marchesUrgents > 0 ? 'var(--danger)' : 'var(--primary)'} />
      </div>

      {/* ── Répartition des marchés ── */}
      <div>
        <h2 className="heading-sm" style={{ marginBottom: '12px' }}>🏛️ Répartition des marchés</h2>
        <div className="grid grid-2 gap-6">
          <BarList title="Par ministère" sub="Origine administrative des appels d'offres" data={stats.byMinistere} labelWidth={150} emptyLabel="Aucun ministère renseigné." />
          <BarList title="Par région" sub="Localisation géographique" data={stats.byRegion} labelWidth={130} emptyLabel="Aucune région renseignée." />
          <BarList title="Par secteur" sub="Domaine d'activité" data={stats.bySecteur} labelWidth={130} emptyLabel="Aucun secteur renseigné." />
          <BarList title="Par procédure" sub="Type de procédure de passation" data={stats.byProcedure} labelWidth={130} emptyLabel="Aucune procédure renseignée." />
        </div>
      </div>

      {/* ── Qualité du scraping ── */}
      <div>
        <h2 className="heading-sm" style={{ marginBottom: '12px' }}>🩺 Qualité du scraping</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <StatTile
            icon="✅"
            label="Taux de réussite"
            value={stats.successRate == null ? '—' : `${stats.successRate}%`}
            sub={stats.runsCount ? `${stats.successRuns}/${stats.runsCount} runs OK` : 'aucun run enregistré'}
            accent={stats.successRate != null && stats.successRate >= 80 ? 'var(--primary)' : stats.successRate == null ? 'var(--forest)' : 'var(--accent)'}
          />
          <StatTile icon="➕" label="Total ajoutés" value={stats.totalAdded.toLocaleString('fr-FR')} sub="marchés retenus (runs récents)" accent="var(--forest)" />
          <StatTile icon="🚫" label="Total rejetés" value={stats.totalRejected.toLocaleString('fr-FR')} sub="doublons / hors périmètre" accent="var(--danger)" />
          <StatTile icon="📎" label="Marchés avec PDF" value={stats.marchesAvecPdf.toLocaleString('fr-FR')} sub={`${stats.pdfAnalyses} analysés par IA`} accent="var(--primary)" />
        </div>
      </div>

      {/* ── Comportement produit ── */}
      <div>
        <h2 className="heading-sm" style={{ marginBottom: '12px' }}>🧭 Comportement produit</h2>
        <div className="grid grid-2 gap-6">
          <RankList title="Marchés les plus consultés" sub="Fiches ouvertes (market_view)" data={stats.topMarches} emptyLabel="Aucune fiche consultée pour l'instant." />
          <RankList title="Recherches populaires" sub="Requêtes complètes les plus fréquentes" data={stats.searchTally} emptyLabel="Aucune recherche enregistrée." />
          <RankList title="Mots-clés les plus recherchés" sub="Termes extraits des requêtes" data={stats.topKeywords} emptyLabel="Aucun mot-clé disponible." />
          <div className="card flex flex-col justify-center items-center" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.8rem', marginBottom: '6px' }} aria-hidden="true">⬇️</span>
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{stats.downloadsTotal.toLocaleString('fr-FR')}</div>
            <div className="text-sm text-muted" style={{ marginTop: '6px' }}>Téléchargements de documents</div>
          </div>
        </div>
      </div>
    </div>
  );
}
