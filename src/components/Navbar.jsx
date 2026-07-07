'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Logo from './Logo';
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

  // Empêche le défilement de l'arrière-plan quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    setMenuOpen(false);
    window.location.href = '/';
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <Logo size={28} className={styles.logoIcon} />
          <span>Wend-<span className={styles.logoAccent}>Kabré</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.navLinks}>
          <Link href="/marches" className={styles.navLink}>Marchés Publics</Link>
          <Link href="/recrutements" className={styles.navLink}>Recrutements</Link>
          <Link href="/assistant" className={styles.navLink}>Assistant IA 🤖</Link>
          {!isPremium && (
            <Link href="/tarifs" className={`${styles.navLink} ${styles.navLinkAccent}`}>Tarifs 💎</Link>
          )}
          {user && (
            <>
              <Link href="/alertes" className={styles.navLink}>Mes Alertes</Link>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            </>
          )}
        </div>

        {/* CTA desktop */}
        <div className={styles.navCta}>
          {user ? (
            <>
              {!isPremium && (
                <Link href="/tarifs" className={styles.btnNavPrimary}>Premium 🔐</Link>
              )}
              <button onClick={handleSignOut} className={styles.btnNavGhost}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" className={styles.btnNavGhost}>Connexion</Link>
              <Link href="/tarifs" className={styles.btnNavPrimary}>Premium 🔐</Link>
            </>
          )}
        </div>

        {/* Mobile Burger */}
        <button
          className={styles.burger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          <span className={`${styles.burgerLine} ${menuOpen ? styles.open : ''}`}></span>
          <span className={`${styles.burgerLine} ${menuOpen ? styles.open : ''}`}></span>
          <span className={`${styles.burgerLine} ${menuOpen ? styles.open : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/marches" className={styles.mobileLink} onClick={closeMenu}>Marchés Publics</Link>
          <Link href="/recrutements" className={styles.mobileLink} onClick={closeMenu}>Recrutements</Link>
          <Link href="/assistant" className={styles.mobileLink} onClick={closeMenu}>Assistant IA 🤖</Link>
          {!isPremium && (
            <Link href="/tarifs" className={`${styles.mobileLink} ${styles.mobileLinkAccent}`} onClick={closeMenu}>Tarifs 💎</Link>
          )}
          {user && (
            <>
              <Link href="/alertes" className={styles.mobileLink} onClick={closeMenu}>Mes Alertes</Link>
              <Link href="/dashboard" className={styles.mobileLink} onClick={closeMenu}>Dashboard</Link>
            </>
          )}
          <div className={styles.mobileCta}>
            {user ? (
              <>
                {!isPremium && (
                  <Link href="/tarifs" className={styles.btnNavPrimary} onClick={closeMenu}>Accès Premium 🔐</Link>
                )}
                <button onClick={handleSignOut} className={styles.btnNavGhost}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" className={styles.btnNavGhost} onClick={closeMenu}>Connexion</Link>
                <Link href="/tarifs" className={styles.btnNavPrimary} onClick={closeMenu}>Accès Premium 🔐</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
