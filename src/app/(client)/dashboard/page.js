'use client';

import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recommendMarkets } from '@/lib/recommend';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);
  const router = useRouter();

  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' }
  const [allMarches, setAllMarches] = useState([]);
  const [matchingMarches, setMatchingMarches] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
          // Source de vérité unique : alertPrefs.keywords (migration douce depuis l'ancien champ racine data.keywords)
          setKeywords(data.alertPrefs?.keywords || data.keywords || []);
          
          if (!data.hasSeenWelcome) {
            setShowWelcomeModal(true);
          }
        }

        // Vérifier si l'utilisateur a un paiement en attente
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

  // Chargement des marchés de la base
  useEffect(() => {
    const fetchAllMarches = async () => {
      try {
        const marchesSnap = await getDocs(collection(db, 'marches'));
        let arr = [];
        marchesSnap.forEach(d => {
          arr.push({ id: d.id, ...d.data() });
        });
        // Trier par date de publication décroissante
        arr.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setAllMarches(arr);
      } catch (err) {
        console.error("Error loading markets in dashboard:", err);
      }
    };
    fetchAllMarches();
  }, []);

  // Filtrage intelligent selon les mots-clés de l'utilisateur
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
      // Si aucun mot-clé, on montre les 5 derniers marchés publiés
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
      } catch (err) {
        console.error("Erreur flag welcome", err);
      }
    }
  };

  const addKeyword = (kw) => {
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setNewKeyword('');
  };

  const removeKeyword = (kwToRemove) => {
    setKeywords(keywords.filter(kw => kw !== kwToRemove));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Écriture dans la source de vérité canonique partagée avec la page /alertes et le moteur d'alertes
      await updateDoc(userDocRef, {
        'alertPrefs.keywords': keywords,
        'alertPrefs.active': true,
      });
      // Refléter localement pour rester cohérent avec /alertes
      setUserData(prev => ({
        ...prev,
        alertPrefs: { ...(prev?.alertPrefs || {}), keywords, active: true },
      }));
      showToast('Vos préférences d\'alerte ont été sauvegardées avec succès !', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- CRM Logic ---
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
      // Trier par date d'ajout
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
      const currentCrm = userData?.crm || {};
      const newCrm = { ...currentCrm };
      
      if (newCrm[marcheId]) {
        newCrm[marcheId].status = newStatus;
      }

      await updateDoc(userRef, { crm: newCrm });
      setUserData({ ...userData, crm: newCrm });
      showToast('Statut mis à jour !', 'success');
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  const removeCrm = async (marcheId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentCrm = userData?.crm || {};
      const newCrm = { ...currentCrm };
      delete newCrm[marcheId];
      await updateDoc(userRef, { crm: newCrm });
      setUserData({ ...userData, crm: newCrm });
      showToast('Marché retiré du suivi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  // --- Recommandations (§7) ---
  // Profil dérivé des mots-clés (source de vérité alertPrefs.keywords) + secteur/région éventuels.
  const recommendedMarches = useMemo(() => {
    const profile = {
      keywords,
      secteur: userData?.secteur || userData?.alertPrefs?.secteur || '',
      region: userData?.region || userData?.alertPrefs?.region || '',
    };
    return recommendMarkets(allMarches, profile, 6);
  }, [allMarches, keywords, userData]);

  // Couleur du badge de compatibilité selon le score.
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

  return (
    <div className="container animate-fadeIn" style={{ padding: '60px 20px' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '40px' }}>
        <h1 className="heading-lg">
          {userData?.name ? `Espace PME — ${userData.name}` : 'Mon Espace PME'}
        </h1>
        <button onClick={handleLogout} className="btn btn-outline">Se déconnecter</button>
      </div>

      <div className="grid grid-3 gap-8">
        
        {/* COL 1: Profil & Statut */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="heading-md" style={{ marginBottom: '16px' }}>
            {userData?.name ? `Profil de ${userData.name}` : 'Mon Profil'}
          </h3>
          <p className="text-secondary text-sm" style={{ marginBottom: '8px' }}>
            <strong>Email :</strong> {user?.email}
          </p>
          <div style={{ marginBottom: '24px' }}>
            <strong>Statut : </strong>
            {userData?.isSubscribed ? (
              <>
                <span className="badge badge-gold" style={{ marginLeft: '8px' }}>Premium Actif</span>
                {userData.subscriptionExpiresAt && (
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--green)', background: 'var(--success-muted)', padding: '8px', borderRadius: '4px', border: '1px solid var(--green)' }}>
                    ⏳ Expire le : <strong>{new Date(userData.subscriptionExpiresAt).toLocaleDateString('fr-FR')}</strong>
                    <br/>(Reste {Math.ceil((new Date(userData.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))} jours)
                  </div>
                )}
              </>
            ) : (
              <span className="badge badge-gray" style={{ marginLeft: '8px' }}>Compte Gratuit</span>
            )}
          </div>

          {!userData?.isSubscribed && pendingPayment && (
            <div style={{ background: 'var(--accent-muted)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(217,119,6,0.3)', marginTop: '20px' }}>
              <h4 className="text-gold text-sm" style={{ marginBottom: '8px', fontWeight: 'bold' }}>⏳ Approbation en attente</h4>
              <p className="text-xs text-secondary" style={{ marginBottom: '12px' }}>
                Votre reçu est en cours d'analyse manuelle par notre équipe. Votre compte Premium sera activé d'ici quelques minutes.
              </p>
            </div>
          )}

          {!userData?.isSubscribed && !pendingPayment && (
            <div style={{ background: 'var(--success-muted)', padding: '16px', borderRadius: '8px', border: '1px solid var(--green)', marginTop: '20px', textAlign: 'center' }}>
              <h4 className="text-green text-sm" style={{ marginBottom: '8px', fontWeight: 'bold' }}>🚀 Passez à la vitesse supérieure</h4>
              <p className="text-xs text-secondary" style={{ marginBottom: '12px' }}>
                Débloquez le Studio de Candidature IA et les alertes WhatsApp instantanées pour multiplier vos chances.
              </p>
              <Link href="/tarifs" className="btn btn-primary w-full text-center" style={{ padding: '10px', fontSize: '0.9rem' }}>
                S'abonner maintenant
              </Link>
            </div>
          )}

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <h4 className="heading-sm" style={{ marginBottom: '12px' }}>🛠️ Outils Pratiques</h4>
            <Link href="/devis" className="btn btn-outline w-full text-center" style={{ padding: '12px', justifyContent: 'center', display: 'flex', gap: '8px' }}>
              📄 Créer un Devis Rapide
            </Link>
          </div>

        </div>

        {/* COL 2 & 3: Alertes et Mots clés */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            <h3 className="heading-md">Configuration des Alertes (WhatsApp & Email)</h3>
          </div>
          <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
            Ajoutez les catégories ou mots-clés de votre secteur d'activité. Notre moteur cherchera ces termes dans les nouveaux appels d'offres et vous préviendra instantanément.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label className="text-sm text-secondary" style={{ display: 'block', marginBottom: '8px' }}>Suggestions rapides :</label>
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

          <div className="flex gap-2" style={{ marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="Ex: Fourniture de bureau, Forage..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="form-input"
              style={{ flex: 1, color: 'var(--text-primary)', backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)' }}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword(newKeyword)}
            />
            <button onClick={() => addKeyword(newKeyword)} className="btn btn-outline" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
              Ajouter
            </button>
          </div>

          <div style={{ minHeight: '100px', background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
            {keywords.length === 0 ? (
              <p className="text-center text-sm" style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Vous n'avez aucun mot-clé configuré.</p>
            ) : (
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                {keywords.map(kw => (
                  <div key={kw} className="badge flex items-center gap-2" style={{ background: 'var(--green)', color: "#fff", padding: '6px 12px' }}>
                    {kw}
                    <button onClick={() => removeKeyword(kw)} aria-label={`Retirer ${kw}`} style={{ background: 'none', border: 'none', color: "#fff", cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={savePreferences} 
            className="btn btn-primary w-full text-center"
            disabled={saving}
          >
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder mes alertes'}
          </button>
        </div>

      </div>

      {/* SECTION : MARCHÉS RECOMMANDÉS (§7) */}
      <div className="card" style={{ marginTop: '40px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>✨</span>
          <h3 className="heading-md">Marchés recommandés pour vous</h3>
        </div>
        <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
          Sélection personnalisée selon vos mots-clés, avec un score de compatibilité calculé automatiquement.
        </p>

        {keywords.length === 0 ? (
          <p className="text-secondary text-sm text-center" style={{ padding: '40px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
            Configurez vos mots-clés ci-dessus pour recevoir des recommandations de marchés adaptées à votre activité.
          </p>
        ) : recommendedMarches.length === 0 ? (
          <p className="text-secondary text-sm text-center" style={{ padding: '40px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
            Aucun marché correspondant pour l'instant. Nous vous préviendrons dès qu'une opportunité pertinente sera publiée.
          </p>
        ) : (
          <div className="grid grid-3 gap-6">
            {recommendedMarches.map((m) => {
              const c = scoreColor(m.score);
              return (
                <div key={m.id} style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex justify-between items-center gap-2" style={{ marginBottom: '12px' }}>
                    <span className="badge" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontWeight: 'bold' }}>
                      {m.score}% compatible
                    </span>
                    {m.urgence && m.urgence !== 'Non datée' && m.urgence !== 'Normal' && (
                      <span className="badge" style={{ background: (m.urgence === 'Urgent' ? 'var(--danger)' : 'var(--gold)'), color: '#fff', fontSize: '0.7rem' }}>
                        {m.urgence === 'Urgent' ? '🔴 Urgent' : '🟠 Bientôt'}
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.4' }}>{m.title}</h5>
                  {(m.secteur || m.category) && (
                    <p className="text-xs text-secondary" style={{ marginBottom: '12px' }}>
                      {m.secteur || m.category}
                    </p>
                  )}
                  <Link
                    href={`/marches/details?id=${m.id}`}
                    className="btn btn-outline text-center"
                    style={{ marginTop: 'auto', padding: '8px', fontSize: '0.85rem' }}
                  >
                    Voir les détails
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION CRM : MON SUIVI DE CANDIDATURES (KANBAN) */}
      <div className="card" style={{ marginTop: '40px' }}>
        <h3 className="heading-md" style={{ marginBottom: '24px' }}>📌 Mon Suivi de Candidatures</h3>
        
        {crmMarches.length === 0 ? (
          <p className="text-secondary text-sm text-center" style={{ padding: '40px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
            Vous ne suivez aucun marché pour le moment. Cliquez sur "🔖 Suivre ce marché" dans la page de détails d'un appel d'offres pour le retrouver ici.
          </p>
        ) : (
          <div className="grid grid-3 gap-6">
            
            {/* Colonne 1: Favoris */}
            <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', borderTop: '4px solid var(--gold)' }}>
              <h4 className="heading-sm" style={{ marginBottom: '16px', color: 'var(--gold)', display: 'flex', justifyContent: 'space-between' }}>
                <span>⭐ Favoris</span>
                <span className="badge" style={{ background: 'var(--color-border)' }}>{crmMarches.filter(m => m.crmStatus === 'favoris').length}</span>
              </h4>
              <div className="flex flex-col gap-4">
                {crmMarches.filter(m => m.crmStatus === 'favoris').map(m => (
                  <div key={m.id} style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <h5 className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '8px' }}>{m.title}</h5>
                    <div className="flex justify-between items-center" style={{ marginTop: '12px' }}>
                      <Link href={`/marches/details?id=${m.id}`} className="text-xs" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Détails</Link>
                      <select 
                        className="form-input text-xs" 
                        style={{ padding: '4px', width: 'auto', background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--gold)' }}
                        value="favoris"
                        onChange={(e) => {
                          if (e.target.value === 'remove') removeCrm(m.id);
                          else updateCrmStatus(m.id, e.target.value);
                        }}
                      >
                        <option value="favoris">⭐ Favoris</option>
                        <option value="preparation">⏳ En préparation</option>
                        <option value="soumis">✅ Soumis</option>
                        <option value="remove">❌ Retirer</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne 2: En préparation */}
            <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', borderTop: '4px solid #0D9488' }}>
              <h4 className="heading-sm" style={{ marginBottom: '16px', color: '#0D9488', display: 'flex', justifyContent: 'space-between' }}>
                <span>⏳ En préparation</span>
                <span className="badge" style={{ background: 'var(--color-border)' }}>{crmMarches.filter(m => m.crmStatus === 'preparation').length}</span>
              </h4>
              <div className="flex flex-col gap-4">
                {crmMarches.filter(m => m.crmStatus === 'preparation').map(m => (
                  <div key={m.id} style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <h5 className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '8px' }}>{m.title}</h5>
                    <div className="flex justify-between items-center" style={{ marginTop: '12px' }}>
                      <Link href={`/marches/details?id=${m.id}`} className="text-xs" style={{ color: '#0D9488', textDecoration: 'underline' }}>Détails</Link>
                      <select 
                        className="form-input text-xs" 
                        style={{ padding: '4px', width: 'auto', background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid #0D9488' }}
                        value="preparation"
                        onChange={(e) => {
                          if (e.target.value === 'remove') removeCrm(m.id);
                          else updateCrmStatus(m.id, e.target.value);
                        }}
                      >
                        <option value="favoris">⭐ Favoris</option>
                        <option value="preparation">⏳ En préparation</option>
                        <option value="soumis">✅ Soumis</option>
                        <option value="remove">❌ Retirer</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne 3: Soumis */}
            <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', borderTop: '4px solid var(--green)' }}>
              <h4 className="heading-sm" style={{ marginBottom: '16px', color: 'var(--green)', display: 'flex', justifyContent: 'space-between' }}>
                <span>✅ Soumis</span>
                <span className="badge" style={{ background: 'var(--color-border)' }}>{crmMarches.filter(m => m.crmStatus === 'soumis').length}</span>
              </h4>
              <div className="flex flex-col gap-4">
                {crmMarches.filter(m => m.crmStatus === 'soumis').map(m => (
                  <div key={m.id} style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <h5 className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '8px' }}>{m.title}</h5>
                    <div className="flex justify-between items-center" style={{ marginTop: '12px' }}>
                      <Link href={`/marches/details?id=${m.id}`} className="text-xs" style={{ color: 'var(--green)', textDecoration: 'underline' }}>Détails</Link>
                      <select 
                        className="form-input text-xs" 
                        style={{ padding: '4px', width: 'auto', background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--green)' }}
                        value="soumis"
                        onChange={(e) => {
                          if (e.target.value === 'remove') removeCrm(m.id);
                          else updateCrmStatus(m.id, e.target.value);
                        }}
                      >
                        <option value="favoris">⭐ Favoris</option>
                        <option value="preparation">⏳ En préparation</option>
                        <option value="soumis">✅ Soumis</option>
                        <option value="remove">❌ Retirer</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* SECTION 3 : HISTORIQUE D'ALERTES WHATSAPP */}
      {userData?.isSubscribed && (
        <div className="card" style={{ marginTop: '40px' }}>
          <h3 className="heading-md" style={{ marginBottom: '8px' }}>💬 Aperçu (exemple) des alertes WhatsApp</h3>
          <p className="text-secondary text-xs" style={{ marginBottom: '24px' }}>
            Ceci est une <strong>illustration</strong> du format des notifications que vous recevrez sur votre numéro <strong>{userData.alertPrefs?.phone || userData.phone || 'Non Configuré'}</strong>. Aucun message réel n'a encore été envoyé.
          </p>

          <div className="table-responsive">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Horodatage</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Destinataire</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Message d'Alerte</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Canal</th>
                </tr>
              </thead>
              <tbody>
                {keywords.length > 0 ? (
                  keywords.slice(0, 3).map((kw, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 8px', fontSize: '0.85rem' }}>Aujourd'hui à {17 - i}h05</td>
                      <td style={{ padding: '14px 8px', fontSize: '0.85rem', color: 'var(--green)' }}>{userData.phone || 'PME'}</td>
                      <td style={{ padding: '14px 8px', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        "🚨 NOUVEL APPEL D'OFFRES détecté au Burkina pour le mot-clé <strong>{kw}</strong>. Consultez vos détails sur la plateforme..."
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Exemple</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '25px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      En attente de mots-clés pour démarrer l'envoi de vos alertes instantanées.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOAST FLOTTANT */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: toast.type === 'success' ? 'var(--primary)' : 'var(--danger)',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(6,78,59,0.25)',
          zIndex: 100000,
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid var(--color-border)',
        }} className="animate-fadeIn">
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span style={{ fontSize: '0.9rem' }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* WELCOME MODAL */}
      {showWelcomeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="card animate-fadeIn" style={{ maxWidth: '500px', width: '90%', position: 'relative', border: '1px solid var(--gold)' }}>
            <h2 className="heading-md text-gold" style={{ marginBottom: '16px', textAlign: 'center' }}>
              🎉 Bienvenue sur Wend-Kabré !
            </h2>
            <p className="text-secondary" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              Nous sommes ravis de vous compter parmi nous, <strong>{userData?.name || 'cher partenaire'}</strong>. 
              Notre système d'Intelligence Artificielle scrute en permanence les appels d'offres au Burkina Faso pour vous faire gagner du temps.
            </p>
            <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Comment ça marche ?</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '8px' }}><strong>1. Configurez vos mots-clés</strong> (ex: BTP, Informatique...) sur ce tableau de bord.</li>
                <li style={{ marginBottom: '8px' }}><strong>2. Recevez des alertes ciblées</strong> sur WhatsApp et par Email.</li>
                <li><strong>3. Suivez vos candidatures</strong> grâce à notre CRM intégré.</li>
              </ul>
            </div>
            <p className="text-sm" style={{ color: 'var(--green)', marginBottom: '24px', textAlign: 'center', fontStyle: 'italic' }}>
              N'hésitez pas à nous contacter pour profiter d'un essai Premium offert !
            </p>
            <button 
              onClick={dismissWelcomeModal}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            >
              J'ai compris, configurer mes mots-clés
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
