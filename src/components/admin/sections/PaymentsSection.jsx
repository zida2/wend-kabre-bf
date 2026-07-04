'use client';

import DataTable from '../DataTable';

const STATUS_BADGE = {
  approved: { cls: 'badge-green', label: 'Validé' },
  pending: { cls: 'badge-accent', label: 'En attente' },
  rejected: { cls: 'badge-red', label: 'Rejeté' },
};

export default function PaymentsSection({ requests, onAction, onViewScreenshot }) {
  const columns = [
    {
      key: 'userName',
      label: 'Utilisateur',
      sortable: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.userName}</div>
          <div className="text-xs text-muted">{r.userEmail}</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      sortValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      render: (r) => <span className="text-sm text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}</span>,
    },
    {
      key: 'planName',
      label: 'Forfait & Montant',
      render: (r) => (
        <div>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{r.planName}</span>
          <div style={{ fontWeight: 700, marginTop: '4px', fontSize: '0.9rem' }}>{r.amount} FCFA</div>
        </div>
      ),
    },
    {
      key: 'screenshot',
      label: 'Reçu',
      render: (r) =>
        r.screenshot ? (
          <button onClick={() => onViewScreenshot(r.screenshot)} className="btn btn-outline btn-sm" style={{ padding: '5px 11px', fontSize: '0.75rem' }}>
            👁️ Voir
          </button>
        ) : (
          <span className="text-muted text-xs">Aucune</span>
        ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (r) => {
        const b = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
        return <span className={`badge ${b.cls}`}>{b.label}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex gap-2">
            <button onClick={() => onAction(r.id, r.userId, r.planId, 'approved')} className="btn btn-primary btn-sm" style={{ padding: '5px 11px', fontSize: '0.75rem' }}>
              Approuver ✓
            </button>
            <button
              onClick={() => onAction(r.id, r.userId, r.planId, 'rejected')}
              className="btn btn-sm"
              style={{ padding: '5px 11px', fontSize: '0.75rem', background: 'var(--danger-muted)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--danger)' }}
            >
              Rejeter
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">Terminé</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={requests}
      getRowKey={(r) => r.id}
      searchKeys={['userName', 'userEmail', 'planName']}
      searchPlaceholder="Rechercher une demande (nom, email)…"
      filters={[
        {
          key: 'status',
          label: 'Statut',
          options: [
            { value: 'pending', label: 'En attente' },
            { value: 'approved', label: 'Validé' },
            { value: 'rejected', label: 'Rejeté' },
          ],
        },
      ]}
      initialSort={null}
      pageSize={10}
      emptyMessage="Aucune demande de paiement reçue."
    />
  );
}
