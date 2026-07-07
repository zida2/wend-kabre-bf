'use client';

import { useState, useMemo } from 'react';

// Helpers
const ts = (iso) => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { 
    day: '2-digit', month: 'short', 
    hour: '2-digit', minute: '2-digit' 
  });
};

const getEventIcon = (type) => {
  switch (type) {
    case 'page_view': return '👁️';
    case 'market_view': return '📄';
    case 'search': return '🔍';
    case 'search_no_result': return '❌';
    case 'click': return '🖱️';
    case 'download': return '⬇️';
    case 'signup_complete': return '🎉';
    case 'payment_start': return '💳';
    case 'subscribe': return '⭐';
    default: return '⚡';
  }
};

const getEventLabel = (type) => {
  switch (type) {
    case 'page_view': return 'Page vue';
    case 'market_view': return 'A consulté un marché';
    case 'search': return 'Recherche';
    case 'search_no_result': return 'Recherche (Sans résultat)';
    case 'click': return 'Clic sur un bouton';
    case 'download': return 'Téléchargement';
    case 'signup_complete': return 'Inscription terminée';
    case 'payment_start': return 'Paiement initié';
    case 'subscribe': return 'Abonnement activé';
    default: return type;
  }
};

const getEventDetail = (e) => {
  if (e.type === 'page_view') return e.path;
  if (e.type === 'market_view') return e.props?.title || e.props?.marketId || '';
  if (e.type.startsWith('search')) return `« ${e.props?.query} »`;
  if (e.type === 'click') return e.props?.label || e.props?.id || '';
  if (e.type === 'download') return e.props?.document || e.path || '';
  return '';
};

export default function UserJourneysSection({ events = [], users = [] }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'abandon_pay' | 'zero_result'

  // Group events by user/visitor
  const activeUsers = useMemo(() => {
    const userMap = new Map(); // key: userId || visitorId
    
    // Create a dictionary of registered users by ID
    const registeredUsers = {};
    users.forEach(u => {
      registeredUsers[u.id] = u;
    });

    events.forEach(e => {
      const id = e.userId || e.visitorId;
      if (!id || id === 'anon') return;

      if (!userMap.has(id)) {
        const isRegistered = !!e.userId || !!registeredUsers[id];
        const registeredData = registeredUsers[e.userId] || registeredUsers[id] || {};
        
        userMap.set(id, {
          id,
          isRegistered,
          name: registeredData.name || 'Visiteur Anonyme',
          email: registeredData.email || '',
          phone: registeredData.phone || '',
          plan: registeredData.isSubscribed ? 'Premium' : (registeredData.plan || 'Gratuit'),
          events: [],
          lastActive: 0,
          totalSearches: 0,
          totalMarketViews: 0
        });
      }

      const userData = userMap.get(id);
      userData.events.push(e);
      
      const eventTime = ts(e.createdAt);
      if (eventTime > userData.lastActive) {
        userData.lastActive = eventTime;
      }

      if (e.type === 'search' || e.type === 'search_no_result') userData.totalSearches++;
      if (e.type === 'market_view') userData.totalMarketViews++;
    });

    // Sort events inside each user (newest first)
    userMap.forEach(u => {
      u.events.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    });

    // Return array sorted by most recently active
    return Array.from(userMap.values()).sort((a, b) => b.lastActive - a.lastActive);
  }, [events, users]);

  const displayedUsers = useMemo(() => {
    return activeUsers.filter(u => {
      if (filterMode === 'abandon_pay') return u.events.some(e => e.type === 'payment_abandon');
      if (filterMode === 'zero_result') return u.events.some(e => e.type === 'search_no_result');
      return true;
    });
  }, [activeUsers, filterMode]);

  if (activeUsers.length === 0) {
    return (
      <div className="card flex flex-col items-center" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', marginBottom: '12px' }} aria-hidden="true">🕵️‍♂️</span>
        <h3 className="heading-sm" style={{ marginBottom: '8px' }}>Aucun parcours détecté</h3>
        <p className="text-sm text-muted" style={{ maxWidth: '460px' }}>
          En attente d'activité des utilisateurs sur la plateforme pour analyser leurs parcours individuels.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: selectedUser ? '1fr 400px' : '1fr', alignItems: 'start', transition: 'all 0.3s ease' }}>
      
      {/* Colonne Liste des Utilisateurs */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="flex flex-col gap-4" style={{ marginBottom: '16px' }}>
          <div className="flex items-center justify-between">
            <h2 className="heading-sm">Parcours Individuels</h2>
            <span className="badge badge-gray">{displayedUsers.length} profils trouvés</span>
          </div>
          
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button 
              onClick={() => { setFilterMode('all'); setSelectedUser(null); }}
              className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => { setFilterMode('abandon_pay'); setSelectedUser(null); }}
              className={`btn btn-sm ${filterMode === 'abandon_pay' ? 'btn-danger' : 'btn-outline'}`}
              style={filterMode === 'abandon_pay' ? {} : { borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              🛒 Abandons de paiement
            </button>
            <button 
              onClick={() => { setFilterMode('zero_result'); setSelectedUser(null); }}
              className={`btn btn-sm ${filterMode === 'zero_result' ? 'btn-accent' : 'btn-outline'}`}
              style={filterMode === 'zero_result' ? {} : { borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              ❌ Recherches sans résultat
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Utilisateur</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Statut</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Activité</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Dernière vue</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map(u => (
                <tr 
                  key={u.id} 
                  style={{ 
                    borderBottom: '1px solid var(--color-border)', 
                    background: selectedUser?.id === u.id ? 'var(--color-surface-2)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedUser(u)}
                >
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    {(u.email || u.phone) && <div className="text-xs text-muted" style={{ marginTop: '2px' }}>{u.email} {u.phone ? `• ${u.phone}` : ''}</div>}
                    {!u.isRegistered && <div className="text-xs text-muted" style={{ marginTop: '2px' }}>ID: {u.id.substring(0,8)}...</div>}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    {u.isRegistered ? (
                      <span className="badge" style={{ background: u.plan === 'Premium' ? 'rgba(5,150,105,0.1)' : 'var(--color-surface-2)', color: u.plan === 'Premium' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {u.plan}
                      </span>
                    ) : (
                      <span className="badge badge-gray">Anonyme</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    <div className="flex gap-2 text-xs">
                      <span title="Recherches">🔍 {u.totalSearches}</span>
                      <span title="Marchés consultés">📄 {u.totalMarketViews}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(u.lastActive)}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      Inspecter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Colonne Chronologie (Drill-down) */}
      {selectedUser && (
        <div className="card animate-fadeInRight" style={{ position: 'sticky', top: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <h3 className="heading-sm">{selectedUser.name}</h3>
              <p className="text-xs text-muted">{selectedUser.events.length} actions suivies</p>
            </div>
            <button 
              onClick={() => setSelectedUser(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
            {selectedUser.events.map((e, i) => (
              <div key={i} className="flex gap-3" style={{ marginBottom: '16px', position: 'relative' }}>
                {i !== selectedUser.events.length - 1 && (
                  <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '-16px', width: '2px', background: 'var(--color-border)' }} />
                )}
                
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', zIndex: 1,
                  flexShrink: 0
                }}>
                  {getEventIcon(e.type)}
                </div>
                
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <div className="flex justify-between items-start" style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {getEventLabel(e.type)}
                    </span>
                    <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {formatDate(e.createdAt).split(' ')[1] || formatDate(e.createdAt)}
                    </span>
                  </div>
                  
                  {getEventDetail(e) && (
                    <div style={{ 
                      background: 'var(--color-surface-2)', padding: '8px 12px', 
                      borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)',
                      marginTop: '4px', wordBreak: 'break-word'
                    }}>
                      {getEventDetail(e)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
