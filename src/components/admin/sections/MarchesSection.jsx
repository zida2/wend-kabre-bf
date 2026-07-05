'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import DataTable from '../DataTable';

export default function MarchesSection({ marches, onDelete }) {
  // Options dérivées des valeurs distinctes présentes en base
  const distinctOptions = (key) => {
    const set = new Set(marches.map((m) => m[key]).filter(Boolean));
    return [...set].sort().map((v) => ({ value: v, label: v }));
  };

  const categories = useMemo(() => distinctOptions('category'), [marches]);
  const regions = useMemo(() => distinctOptions('region'), [marches]);
  const procedures = useMemo(() => distinctOptions('procedure'), [marches]);
  const urgences = useMemo(() => distinctOptions('urgence'), [marches]);

  const columns = [
    {
      key: 'title',
      label: 'Titre du marché',
      sortable: true,
      render: (m) => (
        <div style={{ maxWidth: '380px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{m.title}</div>
          {m.id && (
            <Link href={`/marches/details?id=${m.id}`} target="_blank" style={{ color: 'var(--forest-light)', fontSize: '0.75rem', textDecoration: 'underline', display: 'inline-block', marginTop: '4px' }}>
              Voir la fiche ↗
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Secteur',
      sortable: true,
      render: (m) => <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{m.category || 'Général'}</span>,
    },
    {
      key: 'classement',
      label: 'Classement',
      sortValue: (m) => `${m.procedure || ''} ${m.region || ''}`,
      render: (m) => (
        <div className="flex flex-col gap-2" style={{ maxWidth: '160px' }}>
          {m.procedure ? (
            <span className="badge badge-gray" style={{ fontSize: '0.68rem' }} title="Procédure">📄 {m.procedure}</span>
          ) : null}
          {m.region ? (
            <span className="badge badge-green" style={{ fontSize: '0.68rem' }} title="Région">📍 {m.region}</span>
          ) : null}
          {!m.procedure && !m.region ? <span className="text-muted text-xs">—</span> : null}
        </div>
      ),
    },
    { key: 'source', label: 'Émetteur', sortable: true, render: (m) => <span className="text-secondary text-sm">{m.source || 'N/A'}</span> },
    {
      key: 'publishedAt',
      label: 'Publié le',
      sortable: true,
      sortValue: (m) => (m.publishedAt ? new Date(m.publishedAt).getTime() : 0),
      render: (m) => <span className="text-sm text-muted">{m.publishedAt ? new Date(m.publishedAt).toLocaleDateString('fr-FR') : 'N/A'}</span>,
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (m) => (
        <button
          onClick={() => onDelete(m.id)}
          className="btn btn-sm"
          style={{ background: 'var(--danger-muted)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--danger)', fontSize: '0.75rem', padding: '6px 12px' }}
          title="Supprimer ce marché"
        >
          🗑️ Supprimer
        </button>
      ),
    },
  ];

  const filters = [
    { key: 'category', label: 'Secteur', options: categories },
    { key: 'region', label: 'Région', options: regions },
    { key: 'procedure', label: 'Procédure', options: procedures },
    { key: 'urgence', label: 'Urgence', options: urgences },
  ].filter((f) => f.options.length > 0);

  return (
    <DataTable
      columns={columns}
      rows={marches}
      getRowKey={(m) => m.id}
      searchKeys={['title', 'source', 'category', 'region', 'procedure']}
      searchPlaceholder="Rechercher un marché (titre, émetteur)…"
      filters={filters}
      initialSort={{ key: 'publishedAt', dir: 'desc' }}
      pageSize={12}
      emptyMessage="Aucun marché en base. Lancez le robot extracteur pour en récupérer."
    />
  );
}
