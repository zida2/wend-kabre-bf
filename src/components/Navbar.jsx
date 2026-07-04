'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data().isSubscribed === true) {
            setIsPremium(true);
          } else {
            setIsPremium(false);
          }
        } catch (e) {
          console.error("Navbar sub check error:", e);
        }
      } else {
        setIsPremium(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span>Wend-<span className={styles.logoAccent}>Kabré</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className={`${styles.navLinks} hide-mobile`}>
          <Link href="/marches" className={styles.navLink}>Marchés Publics</Link>
          <Link href="/recrutements" className={styles.navLink}>Recrutements</Link>
          <Link href="/assistant" className={styles.navLink}>Assistant IA 🤖</Link>
          {!isPremium && (
            <Link href="/tarifs" className={styles.navLink} style={{ color: 'var(--gold)', fontWeight: 600 }}>Tarifs 💎</Link>
          )}
          {user && (
            <>
              <Link href="/alertes" className={styles.navLink}>Mes Alertes</Link>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            </>
          )}
        </div>

        {/* CTA */}
        <div className={`${styles.navCta} hide-mobile`}>
          {user ? (
            <div className="flex gap-3">
              {!isPremium && (
                <Link href="/tarifs" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>Premium 🔐</Link>
              )}
              <button 
                onClick={async () => {
                  const { signOut } = await import('firebase/auth');
                  await signOut(auth);
                  window.location.href = '/';
                }} 
                className="btn btn-outline btn-sm"
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#E2E8F0' }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-outline btn-sm" style={{ color: '#E2E8F0', borderColor: 'rgba(255,255,255,0.2)' }}>Connexion</Link>
              <Link href="/tarifs" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>Premium 🔐</Link>
            </>
          )}
        </div>

        {/* Mobile Burger */}
        <button
          className={styles.burger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`${styles.burgerLine} ${menuOpen ? styles.open : ''}`}></span>
          <span className={`${styles.burgerLine} ${menuOpen ? styles.open : ''}`}></span>
          <span className={`${styles.burgerLine} ${menuOpen ? styles.open : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/marches" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Marchés Publics</Link>
          <Link href="/recrutements" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Recrutements</Link>
          <Link href="/assistant" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Assistant IA 🤖</Link>
          {!isPremium && (
            <Link href="/tarifs" className={styles.mobileLink} onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)' }}>Tarifs 💎</Link>
          )}
          {user && (
            <>
              <Link href="/alertes" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Mes Alertes</Link>
              <Link href="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            </>
          )}
          <div className={styles.mobileCta}>
            {user ? (
              <>
                {!isPremium && (
                  <Link href="/tarifs" className="btn btn-primary btn-sm w-full" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center', fontWeight: 700 }}>Accès Premium 🔐</Link>
                )}
                <button 
                  onClick={async () => {
                    const { signOut } = await import('firebase/auth');
                    await signOut(auth);
                    setMenuOpen(false);
                    window.location.href = '/';
                  }} 
                  className="btn btn-outline btn-sm w-full"
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#E2E8F0', justifyContent: 'center' }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" className="btn btn-outline btn-sm w-full" onClick={() => setMenuOpen(false)} style={{ color: '#E2E8F0', borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' }}>Connexion</Link>
                <Link href="/tarifs" className="btn btn-primary btn-sm w-full" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center', fontWeight: 700 }}>Accès Premium 🔐</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
