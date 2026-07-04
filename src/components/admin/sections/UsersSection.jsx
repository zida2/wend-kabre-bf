'use client';

import DataTable from '../DataTable';

export default function UsersSection({ users, processingUser, onUpdateSubscription, onDeleteUser }) {
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

  const busy = processingUser !== null;

  const actionBtn = (label, onClick, variant) => {
    const styleMap = {
      trial: { background: 'var(--success-muted)', border: '1px solid var(--primary)', color: 'var(--primary-dark)' },
      month: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', color: 'var(--text-secondary)' },
      year: { background: 'var(--grad-accent)', border: 'none', color: '#fff' },
      danger: { background: 'var(--danger-muted)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--danger)' },
    };
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className="btn btn-sm"
        style={{ padding: '5px 10px', fontSize: '0.72rem', fontWeight: 700, ...styleMap[variant] }}
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
      sortValue: (u) => (u.isSubscribed ? 1 : 0),
      render: (u) =>
        u.isSubscribed ? (
          <span className="badge badge-green">Premium</span>
        ) : (
          <span className="badge badge-gray">Gratuit</span>
        ),
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
        <div className="flex flex-wrap gap-2" style={{ minWidth: '220px' }}>
          {processingUser === u.id ? (
            <span className="text-xs text-muted">Traitement…</span>
          ) : (
            <>
              {actionBtn('+2 j', () => onUpdateSubscription(u.id, 2), 'trial')}
              {actionBtn('+1 mois', () => onUpdateSubscription(u.id, 30), 'month')}
              {actionBtn('+1 an', () => onUpdateSubscription(u.id, 365), 'year')}
              {u.isSubscribed && actionBtn('Désactiver', () => onUpdateSubscription(u.id, 0), 'danger')}
              {actionBtn('🗑️', () => onDeleteUser(u.id), 'danger')}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      getRowKey={(u) => u.id}
      searchKeys={['name', 'email', 'phone']}
      searchPlaceholder="Rechercher une PME (nom, email, tél.)…"
      filters={[
        {
          key: 'isSubscribed',
          label: 'Statut',
          options: [
            { value: 'premium', label: 'Premium' },
            { value: 'gratuit', label: 'Gratuit' },
          ],
          match: (u, v) => (v === 'premium' ? !!u.isSubscribed : !u.isSubscribed),
        },
      ]}
      initialSort={{ key: 'name', dir: 'asc' }}
      pageSize={12}
      emptyMessage="Aucun utilisateur trouvé."
    />
  );
}
