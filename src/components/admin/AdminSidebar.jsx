'use client';

import styles from './adminLayout.module.css';

export default function AdminSidebar({ sections, active, onSelect, onLogout }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>👑</span>
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
