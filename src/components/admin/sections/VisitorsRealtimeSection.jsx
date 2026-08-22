'use client';

import { useState, useMemo } from 'react';

// Format date français
function formatDateTime(iso) {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return 'N/A';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffMs = today.getTime() - eventDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const time = date.toLocaleString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
  
  if (diffDays === 0) {
    return `Aujourd'hui ${time}`;
  } else if (diffDays === 1) {
    return `Hier ${time}`;
  } else if (diffDays < 7) {
    return `${diffDays}j ago ${time}`;
  } else {
    const dateStr = date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    });
    return `${dateStr} ${time}`;
  }
}

// Usable visitor name
function getVisitorName(event, users) {
  if (event?.userId) {
    const user = users?.find(u => u.uid === event.userId);
    return user?.name || user?.email || `User ${event.userId.slice(0, 6)}`;
  }
  if (event?.visitorId) {
    return `Visiteur ${event.visitorId.slice(0, 6)}`;
  }
  return 'Anonyme';
}

// Visitor badge
function VisitorBadge({ event, users }) {
  const name = getVisitorName(event, users);
  const isUser = !!event?.userId;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '1.1rem' }}>{isUser ? '👤' : '👁️'}</span>
      <span className="text-sm" style={{ fontWeight: 600, color: isUser ? 'var(--primary)' : 'var(--text-secondary)' }}>
        {name}
      </span>
    </div>
  );
}

// Device badge
function DeviceBadge({ device }) {
  const icons = {
    mobile: '📱',
    tablet: '📱',
    desktop: '💻',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span>{icons[device] || '❓'}</span>
      <span className="text-xs" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
        {device || 'N/A'}
      </span>
    </div>
  );
}

// Page link formatter
function formatPage(path) {
  const names = {
    '/': '🏠 Accueil',
    '/marches': '📋 Marchés',
    '/dashboard': '📊 Dashboard',
    '/inscription': '✍️ Inscription',
    '/connexion': '🔑 Connexion',
    '/tarifs': '💰 Tarifs',
    '/admin': '⚙️ Admin',
    '/devis': '📄 Devis',
  };
  
  // Check exact match first
  if (names[path]) return names[path];
  
  // Check prefix
  for (const [key, val] of Object.entries(names)) {
    if (path.startsWith(key)) return val;
  }
  
  return path || '/';
}

// Filter buttons
function FilterButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
      style={{
        padding: '8px 16px',
        fontSize: '0.9rem',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Main component
export default function VisitorsRealtimeSection({ events = [], users = [] }) {
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events
  const filtered = useMemo(() => {
    let result = Array.isArray(events) ? [...events] : [];
    
    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filterPeriod === 'today') {
      result = result.filter(e => {
        const eDate = new Date(e?.createdAt);
        const eDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate());
        return eDay.getTime() === today.getTime();
      });
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(e => {
        const eDate = new Date(e?.createdAt);
        return eDate >= weekAgo;
      });
    } else if (filterPeriod === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter(e => {
        const eDate = new Date(e?.createdAt);
        return eDate >= monthAgo;
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        const name = getVisitorName(e, users).toLowerCase();
        const page = (e?.path || '').toLowerCase();
        return name.includes(q) || page.includes(q);
      });
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt));
    
    return result;
  }, [events, users, filterPeriod, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paged = filtered.slice(startIdx, endIdx);

  if (filtered.length === 0) {
    return (
      <div className="card flex flex-col items-center" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', marginBottom: '12px' }} aria-hidden="true">👥</span>
        <h3 className="heading-sm" style={{ marginBottom: '8px' }}>Aucun visiteur</h3>
        <p className="text-sm text-muted" style={{ maxWidth: '460px' }}>
          Il n'y a pas de visiteurs correspondant aux critères sélectionnés. Essayez d'ajuster les filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="card">
        <div style={{ marginBottom: '12px' }}>
          <h2 className="heading-sm" style={{ marginBottom: '2px' }}>🕐 Visiteurs en Temps Réel</h2>
          <p className="text-xs text-muted">
            {filtered.length.toLocaleString('fr-FR')} visiteur{filtered.length !== 1 ? 's' : ''} · 
            {filterPeriod === 'all' ? ' Tous les temps' : filterPeriod === 'today' ? ' Aujourd\'hui' : filterPeriod === 'week' ? ' Cette semaine' : ' Ce mois'}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterButton 
            icon="∞" 
            label="Tous" 
            active={filterPeriod === 'all'} 
            onClick={() => { setFilterPeriod('all'); setCurrentPage(1); }}
          />
          <FilterButton 
            icon="📅" 
            label="Aujourd'hui" 
            active={filterPeriod === 'today'} 
            onClick={() => { setFilterPeriod('today'); setCurrentPage(1); }}
          />
          <FilterButton 
            icon="📆" 
            label="Semaine" 
            active={filterPeriod === 'week'} 
            onClick={() => { setFilterPeriod('week'); setCurrentPage(1); }}
          />
          <FilterButton 
            icon="📊" 
            label="Mois" 
            active={filterPeriod === 'month'} 
            onClick={() => { setFilterPeriod('month'); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Rechercher par visiteur, page..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="form-input"
          style={{ width: '100%' }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                🕐 Date & Heure
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                👤 Visiteur
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                📄 Page
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                🌍 Pays
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                💻 Appareil
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((event, idx) => (
              <tr 
                key={`${event?.visitorId}-${idx}`} 
                style={{ 
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-surface-2)',
                }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <div className="text-sm" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {formatDateTime(event?.createdAt)}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <VisitorBadge event={event} users={users} />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div className="text-sm" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {formatPage(event?.path)}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {event?.country || 'N/A'}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <DeviceBadge device={event?.device} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card flex items-center justify-between">
          <div className="text-sm text-muted">
            Affichage {startIdx + 1}–{Math.min(endIdx, filtered.length)} sur {filtered.length.toLocaleString('fr-FR')}
          </div>
          
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
            >
              ←
            </button>
            
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: '32px' }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
            >
              →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Par page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--text-primary)',
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
