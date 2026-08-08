'use client';

import DataTable from '../DataTable';
import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/adminClient';

// Les clés doivent correspondre à l'enum AuditAction de
// payment-service/prisma/schema.prisma. Les entrées absentes de l'enum
// (MARCHE_DELETE, COUPON_*, BROADCAST_SENT…) proviennent du journal Firestore
// `admin_logs` et sont conservées pour un affichage unifié à terme.
const ACTION_BADGE = {
  ROLE_CHANGE: { cls: 'badge-gold', label: 'Changement rôle' },
  PAYMENT_VALIDATION: { cls: 'badge-green', label: 'Paiement validé' },
  PAYMENT_REJECTED: { cls: 'badge-red', label: 'Paiement rejeté' },
  SUBSCRIPTION_UPDATE: { cls: 'badge-accent', label: 'Abonnement modifié' },
  SUBSCRIPTION_CANCELLED: { cls: 'badge-muted', label: 'Abonnement coupé' },
  USER_SUSPEND: { cls: 'badge-red', label: 'Suspension' },
  USER_REACTIVATE: { cls: 'badge-green', label: 'Réactivation' },
  USER_DELETE: { cls: 'badge-red', label: 'Suppression' },
  ADMIN_LOGIN: { cls: 'badge-accent', label: 'Login admin' },
  SETTINGS_CHANGE: { cls: 'badge-gold', label: 'Paramètres' },
  WEBHOOK_MANUAL_RETRY: { cls: 'badge-gold', label: 'Rejeu manuel' },
  MARCHE_DELETE: { cls: 'badge-red', label: 'Marché supprimé' },
  COUPON_CREATE: { cls: 'badge-green', label: 'Coupon créé' },
  COUPON_DELETE: { cls: 'badge-red', label: 'Coupon supprimé' },
  BROADCAST_SENT: { cls: 'badge-accent', label: 'Diffusion envoyée' },
};

export default function AuditLogsSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { ok, data, error: err } = await adminFetch('/api/admin/audit-logs?limit=200');
      if (ok) {
        setLogs(data.logs || []);
      } else {
        setError(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const byAction = logs.reduce((acc, l) => {
    if (!l.action) return acc;
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});
  const topAction = Object.entries(byAction).sort((a, b) => b[1] - a[1])[0];

  const columns = [
    {
      key: 'timestamp',
      label: 'Date',
      sortable: true,
      sortValue: (r) => (r.createdAt || r.timestamp ? new Date(r.createdAt || r.timestamp).getTime() : 0),
      render: (r) => {
        const d = r.createdAt || r.timestamp;
        return (
          <div>
            <div className="text-sm" style={{ fontWeight: 600 }}>
              {d ? new Date(d).toLocaleDateString('fr-FR') : '—'}
            </div>
            <div className="text-xs text-muted">
              {d ? new Date(d).toLocaleTimeString('fr-FR') : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (r) => {
        const b = ACTION_BADGE[r.action] || { cls: 'badge-muted', label: r.action || '—' };
        return <span className={`badge ${b.cls}`} style={{ fontSize: '0.72rem' }}>{b.label}</span>;
      },
    },
    {
      key: 'actor',
      label: 'Acteur',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            {r.actorEmail || r.adminEmail || r.performedBy || r.adminId?.toString()?.slice(0, 8) || '—'}
          </div>
          {r.actorRole && (
            <span className="badge badge-gold text-xs" style={{ marginTop: '3px' }}>{r.actorRole}</span>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      label: 'Cible',
      render: (r) => {
        // L'API renvoie la cible imbriquée (`targetUser`) et la référence de
        // paiement dans `metadata`, pas à plat sur la ligne.
        const targetEmail = r.targetUser?.email;
        const paymentRef = r.metadata?.reference;
        const hasTarget = r.targetUserId || targetEmail || paymentRef;
        return (
          <div className="text-sm">
            {targetEmail && <div style={{ fontWeight: 600 }}>{targetEmail}</div>}
            {!targetEmail && r.targetUserId && (
              <div className="text-muted">User ID: {r.targetUserId?.toString()?.slice(0, 10)}…</div>
            )}
            {paymentRef && (
              <code style={{ fontSize: '0.68rem' }}>Paiement: {paymentRef}</code>
            )}
            {!hasTarget && <span className="text-muted">—</span>}
          </div>
        );
      },
    },
    {
      key: 'summary',
      label: 'Détails',
      render: (r) => {
        const summary = r.message || r.summary || (r.details?.message);
        return (
          <div style={{ maxWidth: '320px', fontSize: '0.82rem' }}>
            {summary || (r.details && typeof r.details === 'object' ? Object.entries(r.details).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`).join(' • ') : '')}
            {!summary && (!r.details || Object.keys(r.details || {}).length === 0) && (
              <span className="text-muted">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'ip',
      label: 'IP',
      render: (r) => (
        <span className="text-xs text-muted" style={{ fontFamily: 'ui-monospace, monospace' }}>
          {r.sourceIp || r.ipAddress || '—'}
        </span>
      ),
    },
    {
      key: 'expand',
      label: 'Infos',
      render: (r) => (
        <button
          className="btn btn-outline btn-sm"
          style={{ padding: '5px 11px', fontSize: '0.72rem' }}
          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
        >
          {expandedId === r.id ? 'Masquer' : 'Détails'}
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
          <div className="text-xs text-muted">Total entrées</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{logs.length}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(245,158,11,0.06)' }}>
          <div className="text-xs text-muted">Action la plus fréquente</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>
            {topAction ? (ACTION_BADGE[topAction[0]]?.label || topAction[0]) : '—'}
          </div>
          <div className="text-xs text-muted">{topAction ? `${topAction[1]} ×` : ''}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(5,150,105,0.05)' }}>
          <div className="text-xs text-muted">Validations de paiement</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>
            {(byAction.PAYMENT_VALIDATION || 0) + (byAction.SUBSCRIPTION_UPDATE || 0)}
          </div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(220,38,38,0.05)' }}>
          <div className="text-xs text-muted">Actions critiques</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--danger)' }}>
            {(byAction.USER_SUSPEND || 0) + (byAction.USER_DELETE || 0) + (byAction.PAYMENT_REJECTED || 0)}
          </div>
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

      <div
        className="card"
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: 'rgba(245,158,11,0.04)',
          border: '1px solid rgba(245,158,11,0.15)',
          fontSize: '0.82rem',
        }}
      >
        🔒 <strong>Politique :</strong> Ce journal est <em>append-only</em> — aucune ligne ne doit être modifiée ou supprimée après insertion. Utile pour l'audit interne, la conformité PCI-DSS et les litiges de paiement.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><span className="loader"></span></div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📜</div>
          <h3 className="heading-sm">Aucune entrée d'audit</h3>
          <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
            Toute action admin (changement d'abonnement, validation, suspension) sera loggée ici
            avec l'identité de l'acteur, la cible, l'IP et le contexte détaillé.
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={logs}
            getRowKey={(r) => r.id || r.eventId || (r.createdAt + r.actionType)}
            searchKeys={['actionType', 'actorEmail', 'targetUserEmail', 'targetPaymentRef', 'message', 'sourceIp']}
            searchPlaceholder="Rechercher dans l'audit (action, email, IP)…"
            filters={[
              {
                key: 'actionType',
                label: 'Action',
                options: Object.entries(ACTION_BADGE).map(([v, { label }]) => ({ value: v, label })),
              },
            ]}
            initialSort={{ key: 'timestamp', dir: 'desc' }}
            pageSize={20}
            emptyMessage="Aucune entrée."
          />
          {logs.map((r) => {
            const id = r.id || r.eventId || (r.createdAt + r.actionType);
            if (expandedId !== id) return null;
            const details = r.details || r.metadata || {};
            return (
              <div
                key={'exp-' + id}
                className="card"
                style={{ marginTop: '10px', padding: '16px', background: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contexte complet de l'entrée :</div>
                  {r.id && <code style={{ fontSize: '0.68rem', color: 'var(--accent)' }}>ID: {r.id}</code>}
                </div>
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
                  {JSON.stringify(
                    {
                      id: r.id,
                      createdAt: r.createdAt || r.timestamp,
                      actionType: r.actionType,
                      actor: { email: r.actorEmail || r.adminEmail, role: r.actorRole, id: r.adminId },
                      target: { userId: r.targetUserId, email: r.targetUserEmail, paymentRef: r.targetPaymentRef, type: r.targetType },
                      message: r.message || r.summary,
                      details,
                      sourceIp: r.sourceIp || r.ipAddress,
                      userAgent: r.userAgent,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
