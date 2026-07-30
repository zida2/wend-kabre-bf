'use client';

import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recommendMarkets } from '@/lib/recommend';
import { 
  Bell, FileText, CheckCircle, TrendingUp, LogOut, AlertTriangle, 
  Settings, X, Star, Clock, CheckSquare, Briefcase, Plus, Save
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);
  const router = useRouter();

  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [toast, setToast] = useState(null); 
  const [allMarches, setAllMarches] = useState([]);
  const [matchingMarches, setMatchingMarches] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', rccm: '', ifu: '', phone: '' });

  const SUGGESTED_KEYWORDS = ['Informatique', 'BTP', 'Fournitures', 'Recrutement', 'Consultant', 'Sécurité', 'Nettoyage'];

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/connexion');
        return;
      }
      setUser(currentUser);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setProfileForm({ 
            name: data.name || '', 
            rccm: data.rccm || '', 
            ifu: data.ifu || '', 
            phone: data.phone || '' 
          });
          setKeywords(data.alertPrefs?.keywords || data.keywords || []);
          
          if (!data.hasSeenWelcome) setShowWelcomeModal(true);
          if (!data.hasSeenUpdateModal) setShowUpdateModal(true);
        }

        const q = query(
          collection(db, 'payment_requests'), 
          where('userId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        const pSnap = await getDocs(q);
        setPendingPayment(!pSnap.empty);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchAllMarches = async () => {
      try {
        const marchesSnap = await getDocs(collection(db, 'marches'));
        let arr = [];
        marchesSnap.forEach(d => {
          arr.push({ id: d.id, ...d.data() });
        });
        arr.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setAllMarches(arr);
      } catch (err) {
        console.error("Error loading markets:", err);
      }
    };
    fetchAllMarches();
  }, []);

  useEffect(() => {
    if (allMarches.length === 0) return;
    if (keywords.length > 0) {
      const filtered = allMarches.filter(m => {
        const titleText = (m.title || '').toLowerCase();
        const categoryText = (m.category || '').toLowerCase();
        const descText = (m.description || '').toLowerCase();
        return keywords.some(kw => 
          titleText.includes(kw.toLowerCase()) || 
          categoryText.includes(kw.toLowerCase()) ||
          descText.includes(kw.toLowerCase())
        );
      });
      setMatchingMarches(filtered);
    } else {
      setMatchingMarches(allMarches.slice(0, 5));
    }
  }, [keywords, allMarches]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const dismissWelcomeModal = async () => {
    setShowWelcomeModal(false);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { hasSeenWelcome: true });
        setUserData(prev => ({ ...prev, hasSeenWelcome: true }));
      } catch (err) {}
    }
  };

  const addKeyword = (kw) => {
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setNewKeyword('');
  };

  const removeKeyword = (kwToRemove) => {
    setKeywords(keywords.filter(kw => kw !== kwToRemove));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'alertPrefs.keywords': keywords,
        'alertPrefs.active': true,
      });
      setUserData(prev => ({
        ...prev,
        alertPrefs: { ...(prev?.alertPrefs || {}), keywords, active: true },
      }));
      showToast('Vos préférences d\'alerte ont été sauvegardées !', 'success');
    } catch (err) {
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveProfileSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileForm.name,
        rccm: profileForm.rccm,
        ifu: profileForm.ifu,
        phone: profileForm.phone
      });
      setUserData(prev => ({ ...prev, ...profileForm }));
      setShowProfileModal(false);
      showToast('Profil mis à jour avec succès !', 'success');
    } catch (err) {
      showToast('Erreur lors de la mise à jour.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // CRM Logic
  const [crmMarches, setCrmMarches] = useState([]);

  useEffect(() => {
    if (userData && userData.crm && allMarches.length > 0) {
      const crmList = [];
      for (const [id, data] of Object.entries(userData.crm)) {
        const found = allMarches.find(m => m.id === id);
        if (found) {
          crmList.push({ ...found, crmStatus: data.status, addedAt: data.addedAt });
        }
      }
      crmList.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      setCrmMarches(crmList);
    } else {
      setCrmMarches([]);
    }
  }, [userData, allMarches]);

  const updateCrmStatus = async (marcheId, newStatus) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newCrm = { ...(userData?.crm || {}) };
      if (newCrm[marcheId]) newCrm[marcheId].status = newStatus;
      await updateDoc(userRef, { crm: newCrm });
      setUserData({ ...userData, crm: newCrm });
      showToast('Statut mis à jour !', 'success');
    } catch (e) {
      showToast('Erreur de mise à jour.', 'error');
    }
  };

  const removeCrm = async (marcheId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newCrm = { ...(userData?.crm || {}) };
      delete newCrm[marcheId];
      await updateDoc(userRef, { crm: newCrm });
      setUserData({ ...userData, crm: newCrm });
      showToast('Marché retiré du suivi.', 'success');
    } catch (e) {
      showToast('Erreur de suppression.', 'error');
    }
  };

  const recommendedMarches = useMemo(() => {
    const profile = {
      keywords,
      secteur: userData?.secteur || userData?.alertPrefs?.secteur || '',
      region: userData?.region || userData?.alertPrefs?.region || '',
    };
    return recommendMarkets(allMarches, profile, 6);
  }, [allMarches, keywords, userData]);

  const scoreColor = (score) => {
    if (score >= 70) return { bg: 'var(--success-muted)', color: 'var(--green)', border: 'var(--green)' };
    if (score >= 40) return { bg: 'var(--accent-muted)', color: 'var(--gold)', border: 'rgba(217,119,6,0.4)' };
    return { bg: 'var(--color-surface-2)', color: 'var(--text-muted)', border: 'var(--color-border)' };
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
      </div>
    );
  }

  // Count active CRM items
  const favorisCount = crmMarches.filter(m => m.crmStatus === 'favoris').length;
  const prepCount = crmMarches.filter(m => m.crmStatus === 'preparation').length;
  const soumisCount = crmMarches.filter(m => m.crmStatus === 'soumis').length;

  return (
    <div className={styles.dashboardContainer}>
      
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          Tableau de bord {userData?.name ? `— ${userData.name}` : ''}
        </h1>
        <div className="flex gap-3">
          <button onClick={() => setShowProfileModal(true)} className="btn btn-outline" title="Paramètres">
            <Settings size={18} /> Profil
          </button>
          <button onClick={handleLogout} className="btn btn-outline" title="Se déconnecter">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {(!userData?.isSubscribed && !pendingPayment) && (
        <div style={{ background: 'var(--accent-muted)', borderLeft: '4px solid var(--accent)', padding: '16px 24px', borderRadius: 'var(--radius-sm)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: 'var(--shadow-gold)' }}>
          <div>
            <h4 style={{ color: 'var(--accent)', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} /> Offre de Bienvenue : Pass Essai à 2 500 FCFA
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Débloquez l'assistant IA et maximisez vos chances de remporter vos premiers marchés.
            </p>
          </div>
          <Link href="/tarifs" className="btn btn-accent" style={{ whiteSpace: 'nowrap' }}>
            Activer mon Pass 🚀
          </Link>
        </div>
      )}

      {(!userData?.rccm || !userData?.ifu) && (
        <div style={{ background: 'var(--danger-muted)', borderLeft: '4px solid var(--danger)', padding: '16px 24px', borderRadius: 'var(--radius-sm)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Profil incomplet
            </h4>
            <p className="text-sm text-secondary">Renseignez votre N° RCCM et votre IFU pour générer des devis valides.</p>
          </div>
          <button onClick={() => setShowProfileModal(true)} className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }}>
            Compléter mon profil
          </button>
        </div>
      )}

      {/* --- STATS GRID --- */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.blue}`}>
            <Briefcase size={26} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{matchingMarches.length}</span>
            <span className={styles.statLabel}>Marchés correspondants</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.gold}`}>
            <Star size={26} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{crmMarches.length}</span>
            <span className={styles.statLabel}>Candidatures suivies</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.primary}`}>
            <CheckCircle size={26} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{soumisCount}</span>
            <span className={styles.statLabel}>Dossiers Soumis</span>
          </div>
        </div>
      </div>

      <div className="grid grid-3 gap-8">
        {/* COL 1: Profil & Alertes */}
        <div className="card col-span-1" style={{ height: 'fit-content' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
            <Bell size={24} color="var(--primary)" />
            <h3 className="heading-md">Mots-clés & Alertes</h3>
          </div>
          <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
            Mots-clés surveillés par notre IA pour vos alertes WhatsApp et Email.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {SUGGESTED_KEYWORDS.map(sk => (
                <button 
                  key={sk} 
                  onClick={() => addKeyword(sk)}
                  className="badge" 
                  style={{ background: 'var(--primary-muted)', border: '1px solid var(--color-border-strong)', cursor: 'pointer', color: 'var(--primary-dark)' }}
                >
                  + {sk}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2" style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Ex: Fourniture..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword(newKeyword)}
            />
            <button onClick={() => addKeyword(newKeyword)} className="btn btn-outline" style={{ padding: '10px', borderColor: 'var(--green)', color: 'var(--green)' }}>
              <Plus size={18} />
            </button>
          </div>

          <div style={{ minHeight: '80px', background: 'var(--color-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
            {keywords.length === 0 ? (
              <p className="text-center text-xs" style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Aucun mot-clé configuré.</p>
            ) : (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {keywords.map(kw => (
                  <div key={kw} className="badge flex items-center gap-1" style={{ background: 'var(--green)', color: "#fff", padding: '4px 10px' }}>
                    {kw}
                    <button onClick={() => removeKeyword(kw)} aria-label={`Retirer ${kw}`} style={{ background: 'none', border: 'none', color: "#fff", cursor: 'pointer', marginLeft: '4px' }}><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={savePreferences} className="btn btn-primary w-full text-center" disabled={saving}>
            <Save size={18} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* COL 2 & 3: Recommandations */}
        <div className="card col-span-2">
          <div className="flex items-center gap-2" style={{ marginBottom: '24px' }}>
            <TrendingUp size={24} color="var(--accent)" />
            <h3 className="heading-md">Marchés Recommandés</h3>
          </div>
          
          {keywords.length === 0 ? (
            <div style={{ padding: '40px', background: 'var(--color-surface-2)', borderRadius: '8px', textAlign: 'center' }}>
              <p className="text-secondary text-sm">
                Configurez vos mots-clés pour recevoir des recommandations adaptées.
              </p>
            </div>
          ) : recommendedMarches.length === 0 ? (
            <div style={{ padding: '40px', background: 'var(--color-surface-2)', borderRadius: '8px', textAlign: 'center' }}>
              <p className="text-secondary text-sm">Aucun marché récent ne correspond à vos mots-clés.</p>
            </div>
          ) : (
            <div className="grid grid-2 gap-6">
              {recommendedMarches.map((m) => {
                const c = scoreColor(m.score);
                return (
                  <div key={m.id} style={{ background: 'var(--color-surface-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex justify-between items-center gap-2" style={{ marginBottom: '12px' }}>
                      <span className="badge" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                        {m.score}% de match
                      </span>
                      {m.urgence === 'Urgent' && (
                        <span className="badge" style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.7rem' }}>🔴 Urgent</span>
                      )}
                    </div>
                    <h5 className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.4' }}>{m.title}</h5>
                    <p className="text-xs text-secondary" style={{ marginBottom: '16px' }}>{m.secteur || m.category}</p>
                    <Link href={`/marches/details?id=${m.id}`} className="btn btn-outline text-center" style={{ marginTop: 'auto', padding: '8px', fontSize: '0.85rem' }}>
                      Voir détails & Postuler
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- CRM KANBAN --- */}
      <div className="card" style={{ marginTop: '40px' }}>
        <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '16px' }}>
          <div className="flex items-center gap-2">
            <FileText size={24} color="var(--forest)" />
            <h3 className="heading-md">Mon Pipeline de Candidatures</h3>
          </div>
          <Link href="/devis" className="btn btn-primary btn-sm">
            Gérer mes Devis
          </Link>
        </div>

        <div className={styles.kanbanBoard}>
          
          <div className={`${styles.kanbanColumn} ${styles.favoris}`}>
            <div className={styles.kanbanHeader}>
              <span className={styles.kanbanTitle}><Star size={18} /> Favoris</span>
              <span className={styles.kanbanCount}>{favorisCount}</span>
            </div>
            {crmMarches.filter(m => m.crmStatus === 'favoris').map(m => (
              <div key={m.id} className={styles.kanbanItem}>
                <div className={styles.kanbanItemTitle}>{m.title}</div>
                <div className={styles.kanbanActions}>
                  <Link href={`/marches/details?id=${m.id}`} className="text-xs text-gold font-semibold hover-lift" style={{ textDecoration: 'underline' }}>Détails</Link>
                  <select 
                    className={styles.selectStatus}
                    value="favoris"
                    onChange={(e) => e.target.value === 'remove' ? removeCrm(m.id) : updateCrmStatus(m.id, e.target.value)}
                  >
                    <option value="favoris">Favoris</option>
                    <option value="preparation">En préparation</option>
                    <option value="soumis">Soumis</option>
                    <option value="remove">Retirer ❌</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.kanbanColumn} ${styles.preparation}`}>
            <div className={styles.kanbanHeader}>
              <span className={styles.kanbanTitle}><Clock size={18} /> En préparation</span>
              <span className={styles.kanbanCount}>{prepCount}</span>
            </div>
            {crmMarches.filter(m => m.crmStatus === 'preparation').map(m => (
              <div key={m.id} className={styles.kanbanItem}>
                <div className={styles.kanbanItemTitle}>{m.title}</div>
                <div className={styles.kanbanActions}>
                  <Link href={`/marches/details?id=${m.id}`} className="text-xs text-teal font-semibold hover-lift" style={{ textDecoration: 'underline' }}>Détails</Link>
                  <select 
                    className={styles.selectStatus}
                    value="preparation"
                    onChange={(e) => e.target.value === 'remove' ? removeCrm(m.id) : updateCrmStatus(m.id, e.target.value)}
                  >
                    <option value="favoris">Favoris</option>
                    <option value="preparation">En préparation</option>
                    <option value="soumis">Soumis</option>
                    <option value="remove">Retirer ❌</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.kanbanColumn} ${styles.soumis}`}>
            <div className={styles.kanbanHeader}>
              <span className={styles.kanbanTitle}><CheckSquare size={18} /> Soumis</span>
              <span className={styles.kanbanCount}>{soumisCount}</span>
            </div>
            {crmMarches.filter(m => m.crmStatus === 'soumis').map(m => (
              <div key={m.id} className={styles.kanbanItem}>
                <div className={styles.kanbanItemTitle}>{m.title}</div>
                <div className={styles.kanbanActions}>
                  <Link href={`/marches/details?id=${m.id}`} className="text-xs text-green font-semibold hover-lift" style={{ textDecoration: 'underline' }}>Détails</Link>
                  <select 
                    className={styles.selectStatus}
                    value="soumis"
                    onChange={(e) => e.target.value === 'remove' ? removeCrm(m.id) : updateCrmStatus(m.id, e.target.value)}
                  >
                    <option value="favoris">Favoris</option>
                    <option value="preparation">En préparation</option>
                    <option value="soumis">Soumis</option>
                    <option value="remove">Retirer ❌</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* TOAST FLOTTANT */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', background: toast.type === 'success' ? 'var(--primary)' : 'var(--danger)', color: '#fff', padding: '14px 24px', borderRadius: '8px', boxShadow: '0 20px 40px rgba(6,78,59,0.25)', zIndex: 100000, display: 'flex', alignItems: 'center', gap: '12px' }} className="animate-fadeIn">
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18}/></button>
        </div>
      )}

      {/* WELCOME MODAL */}
      {showWelcomeModal && (
        <div className={styles.modalOverlay}>
          <div className={`card ${styles.modalContent}`}>
            <h2 className="heading-md text-gold text-center" style={{ marginBottom: '16px' }}>Bienvenue sur Wend-Kabré ! 🎉</h2>
            <p className="text-secondary text-sm" style={{ marginBottom: '16px' }}>
              Notre IA scrute en permanence les appels d'offres au Burkina Faso pour vous.
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              <li><strong>1. Configurez vos mots-clés</strong></li>
              <li><strong>2. Recevez des alertes</strong> WhatsApp/Email</li>
              <li><strong>3. Gérez vos devis et candidatures</strong></li>
            </ul>
            <button onClick={dismissWelcomeModal} className="btn btn-primary w-full">J'ai compris</button>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className={styles.modalOverlay}>
          <div className={`card ${styles.modalContent} text-center`}>
            <h2 className="heading-md text-green" style={{ marginBottom: '16px' }}>Mise à jour terminée !</h2>
            <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
              Votre espace a été mis à jour avec le nouveau tableau de bord et le système de devis avancé.
            </p>
            <button onClick={async () => { setShowUpdateModal(false); if (user) { await updateDoc(doc(db, 'users', user.uid), { hasSeenUpdateModal: true }); setUserData(prev => ({ ...prev, hasSeenUpdateModal: true })); } }} className="btn btn-primary w-full">Découvrir</button>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className={styles.modalOverlay}>
          <div className={`card ${styles.modalContent}`}>
            <h2 className="heading-md text-primary" style={{ marginBottom: '16px' }}>Mon Profil Entreprise</h2>
            <form onSubmit={saveProfileSettings} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-secondary">Nom de l'entreprise</label>
                <input type="text" className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-bold text-secondary">Numéro RCCM</label>
                <input type="text" className="form-input" value={profileForm.rccm} onChange={e => setProfileForm({...profileForm, rccm: e.target.value})} placeholder="BF OUA..." />
              </div>
              <div>
                <label className="text-sm font-bold text-secondary">IFU</label>
                <input type="text" className="form-input" value={profileForm.ifu} onChange={e => setProfileForm({...profileForm, ifu: e.target.value})} placeholder="00012345Z" />
              </div>
              <div>
                <label className="text-sm font-bold text-secondary">Téléphone</label>
                <input type="text" className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+226..." />
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowProfileModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
