'use client';

import { useMemo, useState } from 'react';
import DataTable from '../DataTable';

// Classe un utilisateur dans une catégorie de statut unique.
// Priorité : Suspendu > Premium > Essai > Expiré > Gratuit.
function getUserStatus(u) {
  if (u?.suspended === true) return 'suspendu';
  if (u?.isSubscribed && !u?.isTrial) return 'premium';
  if (u?.isTrial) return 'essai';
  if (u?.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < Date.now()) return 'expire';
  return 'gratuit';
}

const STATUS_META = {
  suspendu: { label: 'Suspendu', badge: 'badge-gray' },
  premium: { label: 'Premium', badge: 'badge-green' },
  essai: { label: 'Essai', badge: 'badge-blue' },
  expire: { label: 'Expiré', badge: 'badge-gray' },
  gratuit: { label: 'Gratuit', badge: 'badge-gray' },
};

export default function UsersSection({ users, processingUser, onUpdateSubscription, onDeleteUser, onSuspend, events = [] }) {
  const [detailUser, setDetailUser] = useState(null);

  const waLink = (u) => {
    const num = (u.phone || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Bonjour ${u.name || ''} ! J'ai remarqué votre inscription sur Wend-Kabré. Je vous ai activé un essai Premium gratuit de 2 jours pour découvrir la plateforme. Bonne découverte !`
    );
    return `https://wa.me/${num}?text=${msg}`;
  };
  const mailLink = (u) =>
    `mailto:${u.email}?subject=${encodeURIComponent('Votre essai gratuit sur Wend-Kabré')}&body=${encodeURIComponent(
      `Bonjour ${u.name || ''},\n\nMerci pour votre inscription sur Wend-Kabré !\nPour vous souhaiter la bienvenue, je viens de vous activer un accès Premium Gratuit de 2 jours.\n\nL'équipe Wend-Kabré`
    )}`;

  const busy = processingUser !== null && processingUser !== undefined;

  const actionBtn = (label, onClick, variant, title) => {
    const styleMap = {
      trial: { background: 'var(--success-muted)', border: '1px solid var(--primary)', color: 'var(--primary-dark)' },
      month: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', color: 'var(--text-secondary)' },
      year: { background: 'var(--grad-accent)', border: 'none', color: '#fff' },
      neutral: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', color: 'var(--text-secondary)' },
      warn: { background: 'var(--warning-muted, var(--color-surface-2))', border: '1px solid var(--color-border-strong)', color: 'var(--text-secondary)' },
      danger: { background: 'var(--danger-muted)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--danger)' },
    };
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className="btn btn-sm"
        style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, ...styleMap[variant] }}
        title={title}
      >
        {label}
      </button>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Entreprise',
      sortable: true,
      render: (u) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name || 'N/A'}</div>
          <div className="text-xs text-muted">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (u) => (
        <div className="flex flex-col gap-2">
          {u.phone ? (
            <a href={waLink(u)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-dark)', fontSize: '0.82rem', fontWeight: 600 }} title="Contacter sur WhatsApp">💬 {u.phone}</a>
          ) : (
            <span className="text-muted text-xs">Aucun tél.</span>
          )}
          <a href={mailLink(u)} style={{ color: 'var(--forest-light)', fontSize: '0.78rem' }} title="Envoyer un email">✉️ Email</a>
        </div>
      ),
    },
    {
      key: 'isSubscribed',
      label: 'Statut',
      sortable: true,
      sortValue: (u) => getUserStatus(u),
      render: (u) => {
        const meta = STATUS_META[getUserStatus(u)];
        return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
      },
    },
    {
      key: 'subscriptionExpiresAt',
      label: 'Expiration',
      sortable: true,
      sortValue: (u) => (u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).getTime() : 0),
      render: (u) => <span className="text-sm text-muted">{u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString('fr-FR') : '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="flex gap-2">
          {processingUser === u.id ? (
            <span className="text-xs text-muted" style={{ padding: '6px 0' }}>Traitement…</span>
          ) : (
            <button
              onClick={() => setDetailUser(u)}
              className="btn btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
            >
              ⚙️ Gérer le compte
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={users}
        getRowKey={(u) => u.id}
        searchKeys={['name', 'email', 'phone']}
        searchPlaceholder="Rechercher une PME (nom, email, tél.)…"
        filters={[
          {
            key: 'status',
            label: 'Statut',
            options: [
              { value: 'premium', label: 'Premium' },
              { value: 'essai', label: 'Essai' },
              { value: 'expire', label: 'Expiré' },
              { value: 'suspendu', label: 'Suspendu' },
              { value: 'gratuit', label: 'Gratuit' },
            ],
            match: (u, v) => getUserStatus(u) === v,
          },
        ]}
        initialSort={{ key: 'name', dir: 'asc' }}
        pageSize={12}
        emptyMessage="Aucun utilisateur trouvé."
      />
      {detailUser && (
        <UserDetailModal 
          user={detailUser} 
          events={events} 
          onClose={() => setDetailUser(null)}
          processingUser={processingUser}
          onUpdateSubscription={onUpdateSubscription}
          onDeleteUser={(id) => { onDeleteUser(id); setDetailUser(null); }}
          onSuspend={onSuspend}
        />
      )}
    </>
  );
}

function UserDetailModal({ user, events, onClose, processingUser, onUpdateSubscription, onDeleteUser, onSuspend }) {
  const busy = processingUser === user.id;

  const activity = useMemo(() => {
    const list = (events || []).filter((e) => e && e.userId === user.id);
    const byType = (t) => list.filter((e) => e.type === t);
    const views = byType('market_view');
    const searches = byType('search');
    const downloads = byType('download');
    const pageViews = byType('page_view');
    return {
      total: list.length,
      pageViews: pageViews.length,
      markets: views.map((e) => e.props?.title || e.props?.marketId).filter(Boolean),
      searches: searches.map((e) => e.props?.query).filter(Boolean),
      downloads: downloads.map((e) => e.props?.docName).filter(Boolean),
    };
  }, [events, user.id]);

  const status = STATUS_META[getUserStatus(user)];
  const keywords = user.alertPrefs?.keywords || [];

  const row = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span className="text-xs text-muted" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-sm" style={{ textAlign: 'right', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );

  const listBlock = (title, icon, items, emptyLabel) => (
    <div style={{ marginTop: '14px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
        {icon} {title} <span className="text-muted">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted">{emptyLabel}</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {items.slice(0, 30).map((it, i) => (
            <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-surface, #fff)', borderRadius: '14px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{user.name || 'N/A'}</div>
            <span className={`badge ${status.badge}`} style={{ marginTop: '6px', display: 'inline-block' }}>{status.label}</span>
          </div>
          <button onClick={onClose} className="btn btn-sm" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '4px 10px' }} title="Fermer">✕</button>
        </div>

        <div style={{ marginTop: '16px' }}>
          {row('Email', user.email || '—')}
          {row('Téléphone', user.phone || '—')}
          {row('Statut', status.label)}
          {row('Expiration', user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('fr-FR') : '—')}
          {row('Mots-clés d’alerte', keywords.length ? keywords.join(', ') : '—')}
        </div>

        <div style={{ marginTop: '18px', borderTop: '1px solid var(--color-border-strong)', paddingTop: '14px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>📊 Activité</div>
          {activity.total === 0 ? (
            <div className="text-sm text-muted" style={{ marginTop: '8px' }}>Aucune activité enregistrée</div>
          ) : (
            <>
              <div className="text-sm text-muted" style={{ marginTop: '6px' }}>
                {activity.pageViews} connexion{activity.pageViews > 1 ? 's' : ''}/visite{activity.pageViews > 1 ? 's' : ''} · {activity.total} événement{activity.total > 1 ? 's' : ''} au total
              </div>
              {listBlock('Marchés consultés', '📄', activity.markets, 'Aucun marché consulté')}
              {listBlock('Recherches effectuées', '🔍', activity.searches, 'Aucune recherche')}
              {listBlock('Téléchargements', '⬇️', activity.downloads, 'Aucun téléchargement')}
            </>
          )}
        </div>

        {/* ── Actions Administrateur ── */}
        <div style={{ marginTop: '24px', background: 'var(--color-surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-strong)' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>🛠️ Actions Administrateur</div>
          
          {busy ? (
            <div className="text-sm text-muted" style={{ padding: '12px 0' }}>Traitement en cours... veuillez patienter.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Abonnement */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Gérer l'abonnement</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onUpdateSubscription(user.id, 7)} className="btn btn-sm" style={{ background: 'var(--success-muted)', color: 'var(--primary-dark)', border: '1px solid var(--primary)', fontWeight: 600 }}>+7 jours (Essai)</button>
                  <button onClick={() => onUpdateSubscription(user.id, 30)} className="btn btn-sm" style={{ background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--color-border-strong)', fontWeight: 600 }}>+1 mois</button>
                  <button onClick={() => onUpdateSubscription(user.id, 365)} className="btn btn-sm" style={{ background: 'var(--grad-accent)', color: '#fff', border: 'none', fontWeight: 600 }}>+1 an</button>
                  {user.isSubscribed && (
                    <button onClick={() => onUpdateSubscription(user.id, 0)} className="btn btn-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.3)', fontWeight: 600 }}>Désactiver</button>
                  )}
                </div>
              </div>

              {/* Sécurité */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Sécurité & Accès</div>
                <div className="flex flex-wrap gap-2">
                  {onSuspend && (
                    <button 
                      onClick={() => onSuspend(user.id, !user.suspended)} 
                      className="btn btn-sm" 
                      style={{ background: user.suspended ? 'var(--success-muted)' : 'var(--warning-muted, #fef3c7)', color: user.suspended ? 'var(--primary-dark)' : '#b45309', border: `1px solid ${user.suspended ? 'var(--primary)' : '#fcd34d'}`, fontWeight: 600 }}
                    >
                      {user.suspended ? '▶️ Réactiver le compte' : '⏸️ Suspendre le compte'}
                    </button>
                  )}
                  <button onClick={() => onDeleteUser(user.id)} className="btn btn-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.3)', fontWeight: 600 }}>
                    🗑️ Supprimer l'utilisateur
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
