'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { trackPageView, setTrackedUser } from '@/lib/track';

// Monté une fois dans le layout : enregistre une vue de page à chaque
// changement de route, et associe l'userId courant aux événements.
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setTrackedUser(u?.uid || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    trackPageView({ title: typeof document !== 'undefined' ? document.title : '' });
  }, [pathname]);

  return null;
}
