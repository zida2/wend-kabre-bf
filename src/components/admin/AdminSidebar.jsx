'use client';

import Logo from '../Logo';
import styles from './adminLayout.module.css';

export default function AdminSidebar({ sections, active, onSelect, onLogout, sectionsByCategory }) {
  // Si sectionsByCategory est fourni, afficher les sections groupées par catégorie
  if (sectionsByCategory && Object.keys(sectionsByCategory).length > 0) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={32} className={styles.brandIcon} />
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>Admin</span>
            <span className={styles.brandSub}>Wend-Kabré</span>
          </span>
        </div>

        {Object.entries(sectionsByCategory).map(([category, items]) => (
          <div key={category}>
            <div style={{ padding: '14px 16px 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
              {category}
            </div>
            {items.map((s) => (
              <button
                key={s.id}
                className={`${styles.navItem} ${active === s.id ? styles.navItemActive : ''}`}
                onClick={() => onSelect(s.id)}
                aria-current={active === s.id ? 'page' : undefined}
              >
                <span className={styles.navIcon} aria-hidden="true">{s.icon}</span>
                <span className={styles.navLabel}>{s.label}</span>
                {s.badge > 0 && (
                  <span className={`${styles.navBadge} ${s.badgeMuted ? styles.navBadgeMuted : ''}`}>
                    {s.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className={styles.sidebarFoot}>
          <button className={styles.navItem} onClick={onLogout}>
            <span className={styles.navIcon} aria-hidden="true">🚪</span>
            <span className={styles.navLabel}>Se déconnecter</span>
          </button>
        </div>
      </aside>
    );
  }

  // Fallback : affichage simple sans groupes (rétrocompatibilité)
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo size={32} className={styles.brandIcon} />
        <span className={styles.brandText}>
          <span className={styles.brandTitle}>Admin</span>
          <span className={styles.brandSub}>Wend-Kabré</span>
        </span>
      </div>

      {sections.map((s) => (
        <button
          key={s.id}
          className={`${styles.navItem} ${active === s.id ? styles.navItemActive : ''}`}
          onClick={() => onSelect(s.id)}
          aria-current={active === s.id ? 'page' : undefined}
        >
          <span className={styles.navIcon} aria-hidden="true">{s.icon}</span>
          <span className={styles.navLabel}>{s.label}</span>
          {s.badge > 0 && (
            <span className={`${styles.navBadge} ${s.badgeMuted ? styles.navBadgeMuted : ''}`}>
              {s.badge}
            </span>
          )}
        </button>
      ))}

      <div className={styles.sidebarFoot}>
        <button className={styles.navItem} onClick={onLogout}>
          <span className={styles.navIcon} aria-hidden="true">🚪</span>
          <span className={styles.navLabel}>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
