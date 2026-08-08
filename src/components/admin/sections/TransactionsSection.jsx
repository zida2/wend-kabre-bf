'use client';

import DataTable from '../DataTable';
import { useState, useEffect } from 'react';

const STATUS_BADGE = {
  SUCCESS: { cls: 'badge-green', label: 'Succès' },
  PENDING: { cls: 'badge-accent', label: 'En attente' },
  FAILED: { cls: 'badge-red', label: 'Échoué' },
  CANCELLED: { cls: 'badge-muted', label: 'Annulé' },
};

const PLAN_BADGE = {
  FREE: { cls: 'badge-muted', label: 'Gratuit' },
  PREMIUM: { cls: 'badge-gold', label: 'Premium' },
  ENTERPRISE: { cls: 'badge-green', label: 'Entreprise' },
  STARTER: { cls: 'badge-accent', label: 'Starter 7j' },
};

export default function TransactionsSection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, revenue: 0, success: 0, failed: 0, pending: 0 });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [txRes, statsRes] = await Promise.all([
          fetch('/api/admin/payment/transactions?limit=100', { headers }).catch(() => null),
          fetch('/api/admin/payment/stats', { headers }).catch(() => null),
        ]);

        if (txRes && txRes.ok) {
          const data = await txRes.json();
          if (data.success) setRows(data.transactions || []);
        }

        if (statsRes && statsRes.ok) {
          const s = await statsRes.json();
          if (s.success && s.stats) {
            setStats({
              total: s.stats.totalTransactions || 0,
              revenue: s.stats.totalRevenue || 0,
              success: s.stats.successfulPayments || 0,
              failed: s.stats.failedPayments || 0,
              pending: s.stats.pendingPayments || 0,
            });
          }
        }
      } catch (e) {
        setError(e.message || 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.userName || r.userId?.toString()?.slice(0, 8) || '—'}</div>
          <div className="text-xs text-muted">{r.userEmail || 'ID: ' + (r.userId || '—')}</div>
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
      render: (r) => <code style={{ fontSize: '0.72rem' }}>{r.reference || r.providerReference || '—'}</code>,
    },
    {
      key: 'plan',
      label: 'Forfait',
      render: (r) => {
        const b = PLAN_BADGE[r.planId] || { cls: 'badge-muted', label: r.planId || '—' };
        return <span className={`badge ${b.cls}`}>{b.label}</span>;
      },
    },
    {
      key: 'provider',
      label: 'Processeur',
      render: (r) => <span className="text-sm">{r.provider || 'MoneyFusion'}</span>,
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      sortValue: (r) => Number(r.amount) || 0,
      render: (r) => <div style={{ fontWeight: 700 }}>{(Number(r.amount) || 0).toLocaleString('fr-FR')} FCFA</div>,
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (r) => {
        const b = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
        return <span className={`badge ${b.cls}`}>{b.label}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      sortValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      render: (r) => <span className="text-sm text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}</span>,
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
          <div className="text-xs text-muted">Total transactions</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stats.total}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(5,150,105,0.08)' }}>
          <div className="text-xs text-muted">Chiffre d'affaires</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>
            {stats.revenue.toLocaleString('fr-FR')} <span style={{ fontSize: '0.75rem' }}>FCFA</span>
          </div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(5,150,105,0.05)' }}>
          <div className="text-xs text-muted">Succès</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>{stats.success}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(220,38,38,0.05)' }}>
          <div className="text-xs text-muted">Échecs</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--danger)' }}>{stats.failed}</div>
        </div>
        <div className="card" style={{ padding: '14px', background: 'rgba(245,158,11,0.06)' }}>
          <div className="text-xs text-muted">En attente</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)' }}>{stats.pending}</div>
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
          ⚠️ <strong>Info :</strong> {error}. Le microservice de paiement doit être en ligne et un token admin JWT est requis pour afficher les données PostgreSQL.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><span className="loader"></span></div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💳</div>
          <h3 className="heading-sm">Aucune transaction MoneyFusion</h3>
          <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
            Les paiements validés via le microservice de paiement apparaîtront ici.<br />
            Démarrez <code>payment-service</code> et connectez-vous avec un compte admin pour afficher la DB Supabase.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id || r.reference}
          searchKeys={['reference', 'providerReference', 'userName', 'userEmail', 'planId']}
          searchPlaceholder="Rechercher une transaction (référence, utilisateur)…"
          filters={[
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'PENDING', label: 'En attente' },
                { value: 'SUCCESS', label: 'Succès' },
                { value: 'FAILED', label: 'Échec' },
                { value: 'CANCELLED', label: 'Annulé' },
              ],
            },
          ]}
          initialSort={{ key: 'createdAt', dir: 'desc' }}
          pageSize={20}
          emptyMessage="Aucune transaction."
        />
      )}
    </div>
  );
}
