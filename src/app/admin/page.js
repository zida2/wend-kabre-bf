'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import AdminSidebar from '@/components/admin/AdminSidebar';
import OverviewSection from '@/components/admin/sections/OverviewSection';
import UsersSection from '@/components/admin/sections/UsersSection';
import PaymentsSection from '@/components/admin/sections/PaymentsSection';
import MarchesSection from '@/components/admin/sections/MarchesSection';
import ScraperSection from '@/components/admin/sections/ScraperSection';
import layout from '@/components/admin/adminLayout.module.css';

const ADMIN_EMAIL = 'zidadesire20@gmail.com';

const SECTION_META = {
  overview: { title: 'Vue d\'ensemble', sub: 'Indicateurs clés et tendances de la plateforme' },
  users: { title: 'Utilisateurs & Abonnements', sub: 'Gérez les PME inscrites et leurs abonnements' },
  payments: { title: 'Paiements', sub: 'Validez les demandes de paiement par reçu' },
  marches: { title: 'Marchés', sub: 'Consultez et gérez les marchés en base' },
  scraper: { title: 'Extraction', sub: 'Pilotez le robot d\'aspiration des sources' },
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('overview');

  const [usersList, setUsersList] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [marchesList, setMarchesList] = useState([]);

  const [scraping, setScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push('/connexion'); return; }
      if (currentUser.email?.toLowerCase() !== ADMIN_EMAIL) { router.push('/dashboard'); return; }
      setUser(currentUser);
      fetchAdminData();
    });
    return () => unsubscribe && unsubscribe();
  }, [router]);

  const fetchAdminData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersArray = [];
      usersSnap.forEach((d) => usersArray.push({ id: d.id, ...d.data() }));

      const marchesSnap = await getDocs(collection(db, 'marches'));
      const marchesArray = [];
      marchesSnap.forEach((d) => marchesArray.push({ id: d.id, ...d.data() }));
      marchesArray.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      const requestsSnap = await getDocs(collection(db, 'payment_requests'));
      const requestsArray = [];
      requestsSnap.forEach((d) => requestsArray.push({ id: d.id, ...d.data() }));
      requestsArray.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setUsersList(usersArray);
      setPaymentRequests(requestsArray);
      setMarchesList(marchesArray);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceScrape = async () => {
    setScraping(true);
    setScrapeLogs(['> Initialisation des modules d\'extraction...', '> Détection de 12 sources de données configurées...']);
    const interval = setInterval(() => {
      const logs = [
        '> Connexion aux serveurs RSS (Lefaso, Sidwaya, AIB...)...',
        '> Aspiration et normalisation des données en cours...',
        '> Analyse sémantique par l\'Intelligence Artificielle...',
        '> Filtrage des appels d\'offres et offres d\'emploi...',
      ];
      setScrapeLogs((prev) => (prev.length - 2 < logs.length ? [...prev, logs[prev.length - 2]] : prev));
    }, 1500);

    try {
      const res = await fetch('/api/scrape?secret=' + (process.env.NEXT_PUBLIC_SCRAPER_SECRET || ''));
      const data = await res.json();
      clearInterval(interval);
      setScrapeLogs((prev) => [...prev, `> TERMINÉ : ${data.added} nouveaux marchés enregistrés sur ${data.total} analysés.`]);
      showToast(`Scraping terminé ! ${data.added} nouveaux marchés trouvés.`, 'success');
      fetchAdminData();
    } catch (e) {
      clearInterval(interval);
      setScrapeLogs((prev) => [...prev, '> ERREUR FATALE : Impossible de joindre le serveur.']);
      showToast('Erreur lors du scraping.', 'error');
    } finally {
      setScraping(false);
    }
  };

  // Mise à jour d'abonnement (admin authentifié autorisé par isAdmin()). days === 0 => désactivation.
  const applySubscription = async (userId, days) => {
    const userRef = doc(db, 'users', userId);
    if (days === 0) {
      await updateDoc(userRef, { isSubscribed: false, subscriptionExpiresAt: null });
      return;
    }
    const target = usersList.find((u) => u.id === userId);
    let expirationDate = new Date();
    if (target?.isSubscribed && target?.subscriptionExpiresAt) {
      const currentExp = new Date(target.subscriptionExpiresAt);
      if (currentExp > new Date()) expirationDate = currentExp;
    }
    expirationDate.setDate(expirationDate.getDate() + days);
    await updateDoc(userRef, {
      isSubscribed: true,
      lastPaymentDate: new Date().toISOString(),
      subscriptionExpiresAt: expirationDate.toISOString(),
    });
  };

  const handleUpdateSubscription = async (userId, days) => {
    setProcessingUser(userId);
    try {
      await applySubscription(userId, days);
      showToast('✅ Abonnement mis à jour avec succès !', 'success');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      showToast('❌ Erreur : ' + err.message, 'error');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRequestAction = async (requestId, userId, planId, status) => {
    try {
      await updateDoc(doc(db, 'payment_requests', requestId), { status });
      if (status === 'approved') {
        const days = planId === 'starter' ? 7 : 30;
        await applySubscription(userId, days);
        showToast('✅ Demande validée et abonnement activé !', 'success');
      } else {
        showToast('🚫 Demande de reçu rejetée.', 'info');
      }
      fetchAdminData();
    } catch (err) {
      console.error(err);
      showToast('❌ Erreur lors du traitement de la demande.', 'error');
    }
  };

  const handleDeleteMarche = async (marcheId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce marché ? Cette action est irréversible.')) return;
    try {
      await deleteDoc(doc(db, 'marches', marcheId));
      showToast('🗑️ Marché supprimé avec succès.', 'success');
      fetchAdminData();
    } catch (e) {
      console.error(e);
      showToast('❌ Erreur lors de la suppression du marché.', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    setProcessingUser(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      showToast('🗑️ Utilisateur supprimé avec succès.', 'success');
      fetchAdminData();
    } catch (e) {
      console.error(e);
      showToast('❌ Erreur lors de la suppression.', 'error');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleLogout = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    router.push('/');
  };

  const pendingCount = paymentRequests.filter((r) => r.status === 'pending').length;

  const sections = [
    { id: 'overview', icon: '📊', label: 'Vue d\'ensemble' },
    { id: 'users', icon: '👥', label: 'Utilisateurs' },
    { id: 'payments', icon: '💳', label: 'Paiements', badge: pendingCount },
    { id: 'marches', icon: '📄', label: 'Marchés', badge: marchesList.length, badgeMuted: true },
    { id: 'scraper', icon: '🤖', label: 'Extraction' },
  ];

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement de la console admin…</p>
      </div>
    );
  }

  const meta = SECTION_META[section];

  return (
    <div className="animate-fadeIn">
      <div className={layout.shell}>
        <AdminSidebar sections={sections} active={section} onSelect={setSection} onLogout={handleLogout} />

        <main className={layout.main}>
          <div className={layout.pageHead}>
            <h1 className={layout.pageTitle}>{meta.title}</h1>
            <p className={layout.pageSub}>{meta.sub}</p>
          </div>

          {section === 'overview' && <OverviewSection users={usersList} marches={marchesList} requests={paymentRequests} />}
          {section === 'users' && <UsersSection users={usersList} processingUser={processingUser} onUpdateSubscription={handleUpdateSubscription} onDeleteUser={handleDeleteUser} />}
          {section === 'payments' && <PaymentsSection requests={paymentRequests} onAction={handleRequestAction} onViewScreenshot={setSelectedScreenshot} />}
          {section === 'marches' && <MarchesSection marches={marchesList} onDelete={handleDeleteMarche} />}
          {section === 'scraper' && <ScraperSection scraping={scraping} scrapeLogs={scrapeLogs} onScrape={handleForceScrape} />}
        </main>
      </div>

      {/* Modale reçu */}
      {selectedScreenshot && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,44,34,0.75)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedScreenshot(null)}>
          <div className="card flex flex-col items-center" style={{ width: '100%', maxWidth: '500px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedScreenshot(null)} aria-label="Fermer" style={{ position: 'absolute', top: '14px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            <h3 className="heading-sm" style={{ marginBottom: '18px' }}>Reçu de paiement</h3>
            <img src={selectedScreenshot} alt="Reçu de paiement" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed', bottom: '30px', right: '30px',
            background: toast.type === 'success' ? 'var(--primary)' : toast.type === 'error' ? 'var(--danger)' : 'var(--accent)',
            color: '#fff', padding: '14px 22px', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)', zIndex: 100000, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '90vw',
          }}
        >
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span style={{ fontSize: '0.9rem' }}>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>✕</button>
        </div>
      )}
    </div>
  );
}
