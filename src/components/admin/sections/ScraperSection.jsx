'use client';

const SOURCES = [
  'Lefaso.net', 'Sidwaya', 'AIB', 'Burkina24', 'Wakat Séra', "L'Economiste",
  'MinaJobs', 'ReliefWeb', "L'Express", 'Les Affaires', 'Oméga', 'FasoZine',
];

export default function ScraperSection({ scraping, scrapeLogs, onScrape }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <h3 className="heading-sm" style={{ marginBottom: '6px' }}>🚀 Moteur d'Extraction Global</h3>
          <p className="text-secondary text-sm">
            Pilotez le robot d'aspiration en temps réel. Le système surveille <strong>12 sources</strong> nationales et internationales (presse, ONG, agences d'État). Le cron tourne automatiquement chaque jour à 06:00 UTC.
          </p>
        </div>

        <div className="grid grid-2" style={{ gap: 0 }}>
          {/* Panneau gauche : sources + bouton */}
          <div style={{ padding: '24px', borderRight: '1px solid var(--color-border)' }}>
            <h4 className="text-xs" style={{ marginBottom: '14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              SOURCES CONNECTÉES
            </h4>
            <div className="flex flex-wrap gap-2" style={{ marginBottom: '28px' }}>
              {SOURCES.map((s) => (
                <span key={s} className="badge" style={{ background: 'var(--color-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--primary)', marginRight: '2px' }}>●</span> {s}
                </span>
              ))}
            </div>
            <button
              onClick={onScrape}
              className="btn btn-primary w-full"
              disabled={scraping}
            >
              {scraping ? (
                <><span className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> Analyse en cours…</>
              ) : (
                <>🤖 Lancer l'aspiration manuelle</>
              )}
            </button>
          </div>

          {/* Panneau droit : terminal */}
          <div style={{ background: '#04241C', padding: '20px 22px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem', color: '#6EE7B7', minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'rgba(230,245,238,0.5)', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>● Terminal Admin</span>
              <span>/var/log/scraper.log</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {scrapeLogs.length === 0 ? (
                <span style={{ color: 'rgba(230,245,238,0.35)' }}>&gt; Système prêt. En attente de commande…</span>
              ) : (
                scrapeLogs.map((log, i) => (
                  <span key={i} style={{ opacity: i === scrapeLogs.length - 1 ? 1 : 0.65 }}>{log}</span>
                ))
              )}
              {scraping && <span className="admin-blink">_</span>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-blink { animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
