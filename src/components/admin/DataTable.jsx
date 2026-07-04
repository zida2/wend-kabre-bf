'use client';

import { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

/**
 * Table générique : recherche + filtres + tri + pagination (côté client).
 *
 * props:
 *  - columns: [{ key, label, sortable?, align?, render?(row), sortValue?(row) }]
 *  - rows: object[]
 *  - getRowKey: (row) => string
 *  - searchKeys: string[]  (champs parcourus par la recherche)
 *  - searchPlaceholder: string
 *  - filters: [{ key, label, options: [{value,label}], match?(row,value) }]
 *  - initialSort: { key, dir: 'asc'|'desc' }
 *  - pageSize: number (défaut 10)
 *  - emptyMessage: string
 */
export default function DataTable({
  columns,
  rows = [],
  getRowKey,
  searchKeys = [],
  searchPlaceholder = 'Rechercher…',
  filters = [],
  initialSort = null,
  pageSize = 10,
  emptyMessage = 'Aucune donnée.',
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [filterValues, setFilterValues] = useState({});
  const [page, setPage] = useState(1);

  const normalized = (v) => (v ?? '').toString().toLowerCase();

  const filtered = useMemo(() => {
    let out = rows;

    // Filtres (dropdowns)
    for (const f of filters) {
      const val = filterValues[f.key];
      if (val && val !== '__all__') {
        out = out.filter((row) =>
          f.match ? f.match(row, val) : normalized(row[f.key]) === normalized(val)
        );
      }
    }

    // Recherche plein-texte
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter((row) =>
        searchKeys.some((k) => normalized(row[k]).includes(q))
      );
    }

    // Tri
    if (sort?.key) {
      const col = columns.find((c) => c.key === sort.key);
      const getVal = (row) =>
        col?.sortValue ? col.sortValue(row) : row[sort.key];
      out = [...out].sort((a, b) => {
        let va = getVal(a);
        let vb = getVal(b);
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va == null) return 1;
        if (vb == null) return -1;
        if (va < vb) return sort.dir === 'asc' ? -1 : 1;
        if (va > vb) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return out;
  }, [rows, filters, filterValues, query, sort, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    setPage(1);
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null; // 3e clic = tri désactivé
    });
  };

  const setFilter = (key, value) => {
    setPage(1);
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const gotoPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // Pages à afficher (fenêtre autour de la page courante)
  const pageNumbers = useMemo(() => {
    const nums = [];
    const win = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= currentPage - win && p <= currentPage + win)) {
        nums.push(p);
      } else if (nums[nums.length - 1] !== '…') {
        nums.push('…');
      }
    }
    return nums;
  }, [totalPages, currentPage]);

  return (
    <div className={styles.wrap}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {searchKeys.length > 0 && (
          <div className={styles.search}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            className={styles.filter}
            value={filterValues[f.key] || '__all__'}
            onChange={(e) => setFilter(f.key, e.target.value)}
            aria-label={f.label}
          >
            <option value="__all__">{f.label} : tous</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
        <span className={styles.count}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={col.sortable ? styles.sortable : undefined}
                    style={{ textAlign: col.align || 'left' }}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    {col.label}
                    {col.sortable && (
                      <span className={`${styles.sortArrow} ${active ? styles.sortActive : ''}`}>
                        {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.empty}>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {currentPage} / {totalPages}
          </span>
          <div className={styles.pageBtns}>
            <button className={styles.pageBtn} onClick={() => gotoPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
            {pageNumbers.map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className={styles.pageInfo}>…</span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
                  onClick={() => gotoPage(p)}
                >
                  {p}
                </button>
              )
            )}
            <button className={styles.pageBtn} onClick={() => gotoPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}
