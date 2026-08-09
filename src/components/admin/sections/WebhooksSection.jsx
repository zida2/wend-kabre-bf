'use client';

import DataTable from '../DataTable';
import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/adminClient';

// Aligné sur l'enum WebhookEventType de payment-service/prisma/schema.prisma.
const EVENT_BADGE = {
  PAYMENT_SUCCESS: { cls: 'badge-green', label: 'Paiement Succès' },
  PAYMENT_FAILED: { cls: 'badge-red', label: 'Paiement Échec' },
  PAYMENT_CANCELLED: { cls: 'badge-muted', label: 'Paiement Annulé' },
  SUBSCRIPTION_ACTIVATED: { cls: 'badge-gold', label: 'Abonnement activé' },
  SUBSCRIPTION_EXPIRED: { cls: 'badge-muted', label: 'Abonnement expiré' },
  UNKNOWN: { cls: 'badge-muted', label: 'Inconnu' },
};

const DELIVERY_BADGE = {
  DELIVERED: { cls: 'badge-green', label: 'Traité' },
  FAILED: { cls: 'badge-red', label: 'Rejeté' },
  PENDING: { cls: 'badge-accent', label: 'Non traité' },
};

// Le modèle WebhookEvent ne stocke pas de statut de livraison : il expose
// `success` (traitement métier abouti) et `processedAt` (date de traitement).
// On en dérive l'état affiché plutôt que de lire un champ inexistant.
function deliveryState(e) {
  if (e?.success === true) return 'DELIVERED';
  if (e?.processedAt || e?.errorMessage) return 'FAILED';
  return 'PENDING';
}

export default function WebhooksSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { ok, data, error: err } = await adminFetch('/api/admin/payment/webhooks?limit=100');
      if (ok) {
        setEvents(data.events || []);
      } else {
        setError(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const stats = {
    total: events.length,
    delivered: events.filter((e) => deliveryState(e) === 'DELIVERED').length,
    failed: events.filter((e) => deliveryState(e) === 'FAILED').length,
    successEvents: events.filter((e) => e.eventType === 'PAYMENT_SUCCESS').length,
  };

  const columns = [
    {
      key: 'eventType',
      label: 'Événement',
      sortable: true,
      render: (r) => {
        const b = EVENT_BADGE[r.eventType] || { cls: 'badge-muted', label: r.eventType };
        return <span className={`badge ${b.cls}`} style={{ fontSize: '0.72rem' }}>{b.label}</span>;
      },
    },
    {
      key: 'reference',
      label: 'Référence paiement',
      render: (r) => (
        <div>
          <code style={{ fontSize: '0.72rem' }}>{r.reference || '—'}</code>
          {r.rawPayload?.amount && (
            <div className="text-xs text-muted" style={{ marginTop: '3px' }}>
              {Number(r.rawPayload.amount).toLocaleString('fr-FR')} FCFA
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'security',
      label: 'Sécurité',
      render: (r) => (
        <div style={{ fontSize: '0.7rem', lineHeight: 1.6 }}>
          {r.hmacValidated !== false && <div>✅ HMAC signé</div>}
          {r.hmacValidated === false && <div style={{ color: 'var(--danger)' }}>❌ HMAC invalide</div>}
          {r.ipValidated !== false && <div>🛡️ IP whitelistée</div>}
          {r.ipValidated === false && <div style={{ color: 'var(--danger)' }}>⚠️ IP hors whitelist</div>}
          {r.replayChecked && <div>🚫 Anti-rejeu OK</div>}
        </div>
      ),
    },
    {
      key: 'deliveryStatus',
      label: 'Traitement',
      sortable: true,
      sortValue: (r) => deliveryState(r),
      render: (r) => {
        const b = DELIVERY_BADGE[deliveryState(r)];
        return (
          <div>
            <span className={`badge ${b.cls}`}>{b.label}</span>
            {r.errorMessage && (
              <div className="text-xs" style={{ marginTop: '3px', color: 'var(--danger)' }}>{r.errorMessage}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Horodatage',
      sortable: true,
      sortValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      render: (r) => (
        <div className="text-sm text-muted">
          {r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}
        </div>
      ),
    },
    {
      key: 'expand',
      label: 'Payload',
      render: (r) => (
        <button
          className="btn btn-outline btn-sm"
          style={{ padding: '5px 11px', fontSize: '0.72rem' }}
          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
        >
          {expandedId === r.id ? 'Masquer' : 'Voir JSON'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '14px', background: 'var(--bg-muted)' }}>
          <div className="text-xs text-muted">Callbacks reçus</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stats.total}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(5,150,105,0.05)' }}>
          <div className="text-xs text-muted">Livrés (traités)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>{stats.delivered}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(220,38,38,0.05)' }}>
          <div className="text-xs text-muted">En échec</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--danger)' }}>{stats.failed}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(5,150,105,0.08)' }}>
          <div className="text-xs text-muted">Paiements succès</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>{stats.successEvents}</div>
        </div>
      </div>

      {error && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.2)',
            fontSize: '0.85rem',
          }}
        >
          ⚠️ <strong>Info :</strong> {error}. Le microservice <code>payment-service</code> doit être en ligne avec un token admin JWT valide.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><span className="loader"></span></div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔔</div>
          <h3 className="heading-sm">Aucun webhook reçu</h3>
          <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
            Les callbacks MoneyFusion (paiements succès, échecs, remboursements) s'affichent ici avec leur état
            de validation HMAC, IP et anti-rejeu.
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={events}
            getRowKey={(r) => r.id || r.eventId}
            searchKeys={['eventType', 'paymentReference', 'reference', 'sourceIp']}
            searchPlaceholder="Rechercher un événement (type, référence, IP)…"
            filters={[
              {
                key: 'eventType',
                label: 'Événement',
                options: Object.entries(EVENT_BADGE).map(([v, { label }]) => ({ value: v, label })),
              },
              {
                key: 'deliveryStatus',
                label: 'Livraison',
                options: Object.entries(DELIVERY_BADGE).map(([v, { label }]) => ({ value: v, label })),
              },
            ]}
            initialSort={{ key: 'createdAt', dir: 'desc' }}
            pageSize={15}
            emptyMessage="Aucun webhook."
          />
          {events.map((r) => {
            const id = r.id || r.eventId;
            if (expandedId !== id) return null;
            const payload = r.rawPayload || r.payload || {};
            return (
              <div
                key={'exp-' + id}
                className="card"
                style={{ marginTop: '10px', padding: '16px', background: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Payload brut du webhook (POST /webhook/moneyfusion):</div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: '0.72rem',
                    color: '#e2e8f0',
                    fontFamily: 'ui-monospace, "JetBrains Mono", Consolas, monospace',
                    overflowX: 'auto',
                    maxHeight: '420px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
