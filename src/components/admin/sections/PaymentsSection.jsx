'use client';

import DataTable from '../DataTable';

const STATUS_BADGE = {
  approved: { cls: 'badge-green', label: 'Validé' },
  pending: { cls: 'badge-accent', label: 'En attente' },
  rejected: { cls: 'badge-red', label: 'Rejeté' },
};

const PAYMENT_METHOD_INFO = {
  ORANGE_MONEY_OCR: { icon: '🟠', label: 'Orange Money', color: '#FF6B00' },
  MOOV_MONEY_OCR: { icon: '🔵', label: 'Moov Money', color: '#0066CC' },
  MONEY_FUSION: { icon: '💳', label: 'Money Fusion', color: '#059669' },
};

export default function PaymentsSection({ requests, onAction, onViewScreenshot }) {
  const columns = [
    {
      key: 'userName',
      label: 'Utilisateur',
      sortable: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.userName}</div>
          <div className="text-xs text-muted">{r.userEmail}</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date de demande',
      sortable: true,
      sortValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      render: (r) => {
        if (!r.createdAt) return <span className="text-xs text-muted">—</span>;
        const date = new Date(r.createdAt);
        return (
          <div>
            <div className="text-sm" style={{ fontWeight: 600 }}>
              {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </div>
            <div className="text-xs text-muted">
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      key: 'planName',
      label: 'Plan & Montant',
      render: (r) => (
        <div>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem', marginBottom: '6px' }}>
            {r.planName || r.plan}
          </span>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
            {parseInt(r.amount || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Méthode',
      sortable: true,
      render: (r) => {
        const method = r.paymentMethod || 'ORANGE_MONEY_OCR';
        const info = PAYMENT_METHOD_INFO[method] || PAYMENT_METHOD_INFO.ORANGE_MONEY_OCR;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{info.icon}</span>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: info.color }}>
                {info.label}
              </div>
              <div className="text-xs text-muted">Manuel</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'screenshot',
      label: 'Preuve',
      render: (r) => {
        if (r.screenshot) {
          return (
            <button 
              onClick={() => onViewScreenshot(r.screenshot)} 
              className="btn btn-outline btn-sm" 
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '1rem' }}>👁️</span>
              <span>Voir</span>
            </button>
          );
        }
        if (r.screenshotName) {
          return (
            <div className="text-xs text-muted">
              <div>📎 {r.screenshotName}</div>
              <div style={{ marginTop: '2px' }}>
                {(r.screenshotSize / 1024).toFixed(0)} Ko
              </div>
            </div>
          );
        }
        return <span className="text-muted text-xs">Aucune</span>;
      },
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (r) => {
        const b = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
        return (
          <div>
            <span className={`badge ${b.cls}`} style={{ fontSize: '0.75rem' }}>
              {b.label}
            </span>
            {r.processedAt && (
              <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                {new Date(r.processedAt).toLocaleDateString('fr-FR', { 
                  day: '2-digit', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex gap-2" style={{ flexDirection: 'column' }}>
            <button 
              onClick={() => onAction(r.id, r.userId, r.planId || r.plan?.toLowerCase(), 'approved')} 
              className="btn btn-primary btn-sm" 
              style={{ 
                padding: '7px 14px', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minWidth: '120px'
              }}
            >
              <span>✓</span>
              <span>Approuver</span>
            </button>
            <button
              onClick={() => onAction(r.id, r.userId, r.planId || r.plan?.toLowerCase(), 'rejected')}
              className="btn btn-sm"
              style={{ 
                padding: '7px 14px', 
                fontSize: '0.75rem', 
                background: 'var(--danger-muted)', 
                border: '1px solid rgba(220,38,38,0.3)', 
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minWidth: '120px'
              }}
            >
              <span>✕</span>
              <span>Rejeter</span>
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <span className="text-xs text-muted">
              {r.status === 'approved' ? '✓ Traité' : '✕ Rejeté'}
            </span>
          </div>
        ),
    },
  ];

  return (
    <div>
      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            {requests.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-xs text-muted">En attente</div>
        </div>
        
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            {requests.filter(r => r.status === 'approved').length}
          </div>
          <div className="text-xs text-muted">Validés</div>
        </div>
        
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✕</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
            {requests.filter(r => r.status === 'rejected').length}
          </div>
          <div className="text-xs text-muted">Rejetés</div>
        </div>
        
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            {requests
              .filter(r => r.status === 'approved')
              .reduce((sum, r) => sum + parseInt(r.amount || 0), 0)
              .toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-muted">FCFA validés</div>
        </div>
      </div>

      {/* Info box pour validation */}
      {requests.filter(r => r.status === 'pending').length > 0 && (
        <div style={{
          background: 'rgba(5, 150, 105, 0.08)',
          border: '2px solid rgba(5, 150, 105, 0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '6px' }}>
              Instructions de validation
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <strong>Orange Money :</strong> 62 20 28 77 • 
              <strong style={{ marginLeft: '12px' }}>Moov Money :</strong> 06 13 90 16
              <br />
              Vérifiez le montant, la date et le numéro de destinataire sur la preuve de paiement avant validation.
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        rows={requests}
        getRowKey={(r) => r.id}
        searchKeys={['userName', 'userEmail', 'planName', 'plan']}
        searchPlaceholder="Rechercher une demande (nom, email, plan)…"
        filters={[
          {
            key: 'status',
            label: 'Statut',
            options: [
              { value: 'pending', label: '⏳ En attente' },
              { value: 'approved', label: '✓ Validé' },
              { value: 'rejected', label: '✕ Rejeté' },
            ],
          },
          {
            key: 'paymentMethod',
            label: 'Méthode',
            options: [
              { value: 'ORANGE_MONEY_OCR', label: '🟠 Orange Money' },
              { value: 'MOOV_MONEY_OCR', label: '🔵 Moov Money' },
              { value: 'MONEY_FUSION', label: '💳 Money Fusion' },
            ],
          },
        ]}
        initialSort={null}
        pageSize={15}
        emptyMessage="Aucune demande de paiement reçue."
      />
    </div>
  );
}
