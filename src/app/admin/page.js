'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = 'zidadesire20@gmail.com';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    users: 0,
    premium: 0,
    marches: 0
  });

  const [scraping, setScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [marchesList, setMarchesList] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' | 'info' }
  const router = useRouter();

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    // Accès admin : uniquement via un compte Firebase authentifié dont l'email
    // est celui de l'admin. Les écritures sont de toute façon re-vérifiées par
    // les règles Firestore (isAdmin), donc pas de bypass exploitable côté client.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/connexion');
        return;
      }

      if (currentUser.email?.toLowerCase() !== ADMIN_EMAIL) {
        router.push('/dashboard');
        return;
      }

      setUser(currentUser);
      fetchAdminData();
    });
    return () => unsubscribe && unsubscribe();
  }, [router]);

  const fetchAdminData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let premiumCount = 0;
      let usersArray = [];
      
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.isSubscribed && !data.isTrial) premiumCount++;
        usersArray.push({ id: doc.id, ...data });
      });

      const marchesSnap = await getDocs(collection(db, 'marches'));
      let marchesArray = [];
      marchesSnap.forEach(doc => {
        marchesArray.push({ id: doc.id, ...doc.data() });
      });
      // Trier par date de publication décroissante
      marchesArray.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      // Récupérer les demandes de paiement
      const requestsSnap = await getDocs(collection(db, 'payment_requests'));
      let requestsArray = [];
      requestsSnap.forEach(doc => {
        const data = doc.data();
        requestsArray.push({ id: doc.id, ...data });
      });

      // Trier : 'pending' en premier, puis du plus récent au plus ancien
      requestsArray.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setStats({
        users: usersSnap.size,
        premium: premiumCount,
        marches: marchesSnap.size
      });
      
      setUsersList(usersArray);
      setPaymentRequests(requestsArray);
      setMarchesList(marchesArray);
    } catch (err) {
      console.error("Admin fetch error:", err);
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
         '> Filtrage des appels d\'offres et offres d\'emploi...'
      ];
      setScrapeLogs(prev => {
        if(prev.length - 2 < logs.length) return [...prev, logs[prev.length - 2]];
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch('/api/scrape?secret=' + (process.env.NEXT_PUBLIC_SCRAPER_SECRET || ''));
      const data = await res.json();
      clearInterval(interval);
      setScrapeLogs(prev => [...prev, `> TERMINÉ : ${data.added} nouveaux marchés enregistrés sur ${data.total} analysés.`]);
      showToast(`Scraping terminé ! ${data.added} nouveaux marchés trouvés.`, 'success');
      // Refresh markets count
      const marchesSnap = await getDocs(collection(db, 'marches'));
      setStats(prev => ({ ...prev, marches: marchesSnap.size }));
      fetchAdminData();
    } catch (e) {
      clearInterval(interval);
      setScrapeLogs(prev => [...prev, '> ERREUR FATALE : Impossible de joindre le serveur.']);
      showToast("Erreur lors du scraping.", "error");
    } finally {
      setScraping(false);
    }
  };

  // Mise à jour d'abonnement directement en Firestore (l'admin authentifié est
  // autorisé par les règles isAdmin()). days === 0 => désactivation.
  const applySubscription = async (userId, days) => {
    const userRef = doc(db, 'users', userId);
    if (days === 0) {
      await updateDoc(userRef, { isSubscribed: false, subscriptionExpiresAt: null });
      return;
    }
    // Prolonge à partir de l'expiration en cours si elle est encore valide.
    const target = usersList.find(u => u.id === userId);
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
      showToast("✅ Abonnement mis à jour avec succès !", "success");
      fetchAdminData(); // Rafraîchir la liste
    } catch (err) {
      console.error(err);
      showToast("❌ Erreur: " + err.message, "error");
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRequestAction = async (requestId, userId, planId, status) => {
    try {
      // 1. Mettre à jour la demande dans Firestore
      const requestRef = doc(db, 'payment_requests', requestId);
      await updateDoc(requestRef, { status: status });

      // 2. Si approuvé, on active l'abonnement (écriture Firestore côté admin)
      if (status === 'approved') {
        const days = planId === 'starter' ? 7 : 30; // Starter = 7j, les autres = 30j
        await applySubscription(userId, days);
        showToast("✅ Demande validée et abonnement activé !", "success");
      } else {
        showToast("🚫 Demande de reçu rejetée.", "info");
      }
      fetchAdminData();
    } catch (err) {
      console.error(err);
      showToast("❌ Erreur lors du traitement de la demande.", "error");
    }
  };

  const handleDeleteMarche = async (marcheId) => {
    if (!confirm("Voulez-vous vraiment supprimer ce marché ? Cette action est irréversible.")) return;
    try {
      await deleteDoc(doc(db, 'marches', marcheId));
      showToast("🗑️ Marché supprimé de la base de données avec succès.", "success");
      fetchAdminData();
    } catch (e) {
      console.error(e);
      showToast("❌ Erreur lors de la suppression du marché.", "error");
    }
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
        <h1 className="heading-lg">👑 Salle de Contrôle Administrateur</h1>
      </div>

      <div className="grid grid-3 gap-6" style={{ marginBottom: '40px' }}>
        {/* STAT 1 */}
        <div className="card text-center" style={{ borderTop: '4px solid var(--forest)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
          <h4 className="text-secondary text-sm" style={{ marginBottom: '8px' }}>Utilisateurs Inscrits</h4>
          <h2 className="heading-lg">{stats.users}</h2>
        </div>

        {/* STAT 2 */}
        <div className="card text-center" style={{ borderTop: '4px solid var(--accent)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💎</div>
          <h4 className="text-secondary text-sm" style={{ marginBottom: '8px' }}>Abonnés Premium</h4>
          <h2 className="heading-lg text-accent">{stats.premium}</h2>
          <p className="text-xs text-muted" style={{ marginTop: '8px' }}>CA Estimé: {stats.premium * 15000} FCFA/mois</p>
        </div>

        {/* STAT 3 */}
        <div className="card text-center" style={{ borderTop: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
          <h4 className="text-secondary text-sm" style={{ marginBottom: '8px' }}>Marchés en Base</h4>
          <h2 className="heading-lg text-primary">{stats.marches}</h2>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '40px', padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <h3 className="heading-md" style={{ marginBottom: '8px' }}>🚀 Moteur d'Extraction Global</h3>
          <p className="text-secondary text-sm">
            Pilotez le robot d'aspiration de données en temps réel. Le système surveille actuellement <strong>12 sources nationales et internationales</strong> (Presse, ONG, Agences d'État).
          </p>
        </div>
        
        <div className="grid grid-2" style={{ gap: 0 }}>
          <div style={{ padding: '24px', borderRight: '1px solid var(--color-border)' }}>
            <h4 className="text-sm" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>SOURCES CONNECTÉES</h4>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '32px' }}>
              {['Lefaso.net', 'Sidwaya', 'AIB', 'Burkina24', 'Wakat Séra', 'L\'Economiste', 'MinaJobs', 'ReliefWeb', 'L\'Express', 'Les Affaires', 'Oméga', 'FasoZine'].map(s => (
                <span key={s} className="badge" style={{ background: 'var(--color-border)', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--green)', marginRight: '6px' }}>●</span> {s}
                </span>
              ))}
            </div>

            <button 
              onClick={handleForceScrape}
              className="btn btn-primary"
              disabled={scraping}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' }}
            >
              {scraping ? (
                <><span className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> Analyse en cours...</>
              ) : (
                <>🤖 Lancer l'Aspiration Manuelle</>
              )}
            </button>
          </div>

          <div style={{ background: '#0a0a0a', padding: '24px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#00ff00', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#888', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Terminal Admin</span>
              <span>/var/log/scraper.log</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scrapeLogs.length === 0 ? (
                <span style={{ color: '#555' }}>&gt; Système prêt. En attente de commande...</span>
              ) : (
                scrapeLogs.map((log, i) => (
                  <span key={i} style={{ opacity: i === scrapeLogs.length - 1 ? 1 : 0.7 }}>{log}</span>
                ))
              )}
              {scraping && (
                <span style={{ animation: 'blink 1s infinite' }}>_</span>
              )}
            </div>
            <style jsx>{`
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* TABLEAU GESTION DEMANDES DE PAIEMENT */}
      <div className="card" style={{ marginBottom: '40px' }}>
        <h3 className="heading-md" style={{ marginBottom: '24px' }}>Demandes de Paiement par Reçu (OCR/Dépôt)</h3>
        
        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Utilisateur</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Forfait & Montant</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Reçu d'Envoi</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Statut</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{r.userName}</div>
                    <div className="text-xs text-muted">{r.userEmail}</div>
                  </td>
                  <td style={{ padding: '16px 8px', fontSize: '0.85rem' }}>
                    {new Date(r.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>{r.planName}</span>
                    <div style={{ fontWeight: 'bold', marginTop: '4px', fontSize: '0.9rem' }}>{r.amount} FCFA</div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    {r.screenshot ? (
                      <button 
                        onClick={() => setSelectedScreenshot(r.screenshot)}
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        👁️ Voir la capture
                      </button>
                    ) : (
                      <span className="text-muted">Aucune</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    {r.status === 'approved' && <span className="badge badge-green">Validé</span>}
                    {r.status === 'pending' && <span className="badge badge-accent">En attente</span>}
                    {r.status === 'rejected' && <span className="badge badge-red" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>Rejeté</span>}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRequestAction(r.id, r.userId, r.planId, 'approved')}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          Approuver ✓
                        </button>
                        <button 
                          onClick={() => handleRequestAction(r.id, r.userId, r.planId, 'rejected')}
                          style={{ padding: '6px 12px', background: 'var(--danger-muted)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Terminé</span>
                    )}
                  </td>
                </tr>
              ))}
              {paymentRequests.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune demande de paiement reçue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLEAU GESTION PME */}
      <div className="card">
        <h3 className="heading-md" style={{ marginBottom: '24px' }}>Gestion des Abonnements (PME)</h3>
        
        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Entreprise</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Contact</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Statut</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Expiration</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Actions Rapides</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{u.name || 'N/A'}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    {u.phone ? (
                      <a href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Bonjour " + (u.name || "") + " ! J'ai remarqué votre inscription sur Wend-Kabré. Je vous ai activé un essai Premium gratuit de 2 jours pour découvrir la plateforme. Bonne découverte !")}`} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', display: 'block', marginBottom: '4px' }} title="Contacter sur WhatsApp">
                        💬 {u.phone}
                      </a>
                    ) : (
                      <span className="text-muted" style={{ display: 'block', marginBottom: '4px' }}>Aucun Tel</span>
                    )}
                    <a href={`mailto:${u.email}?subject=${encodeURIComponent("Votre essai gratuit sur Wend-Kabré")}&body=${encodeURIComponent("Bonjour " + (u.name || "") + ",\n\nMerci pour votre inscription sur Wend-Kabré !\nPour vous souhaiter la bienvenue, je viens de vous activer un accès Premium Gratuit de 2 jours afin que vous puissiez découvrir nos alertes et nos appels d'offres.\n\nSi vous avez des questions, n'hésitez pas.\n\nL'équipe Wend-Kabré")}`} style={{ color: 'var(--forest-light)', fontSize: '0.8rem' }} title="Envoyer un Email">
                      ✉️ {u.email}
                    </a>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    {u.isSubscribed ? (
                      <span className="badge badge-green">Premium</span>
                    ) : (
                      <span className="badge badge-red" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>Gratuit</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 8px', fontSize: '0.85rem' }}>
                    {u.subscriptionExpiresAt 
                      ? new Date(u.subscriptionExpiresAt).toLocaleDateString('fr-FR')
                      : '---'}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => handleUpdateSubscription(u.id, 2)}
                        style={{ padding: '6px 12px', background: 'var(--success-muted)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        disabled={processingUser !== null}
                        title="Activer 2 jours d'essai"
                      >
                        {processingUser === u.id ? '...' : '+2 Jours'}
                      </button>
                      <button 
                        onClick={() => handleUpdateSubscription(u.id, 30)}
                        style={{ padding: '6px 12px', background: 'var(--color-bg-2)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        disabled={processingUser !== null}
                      >
                        {processingUser === u.id ? '...' : '+1 Mois'}
                      </button>
                      <button 
                        onClick={() => handleUpdateSubscription(u.id, 365)}
                        style={{ padding: '6px 12px', background: 'var(--grad-gold)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        disabled={processingUser !== null}
                      >
                        {processingUser === u.id ? '...' : '+1 An'}
                      </button>
                      {u.isSubscribed && (
                        <button 
                          onClick={() => handleUpdateSubscription(u.id, 0)}
                          style={{ padding: '6px 12px', background: 'var(--danger-muted)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                          disabled={processingUser !== null}
                        >
                          {processingUser === u.id ? '...' : 'Désactiver'}
                        </button>
                      )}
                      <button 
                        onClick={async () => {
                          if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
                          setProcessingUser(u.id);
                          try {
                            await deleteDoc(doc(db, 'users', u.id));
                            showToast("🗑️ Utilisateur supprimé avec succès.", "success");
                            fetchAdminData();
                          } catch (e) {
                            console.error(e);
                            showToast("❌ Erreur lors de la suppression.", "error");
                          } finally {
                            setProcessingUser(null);
                          }
                        }}
                        style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        disabled={processingUser !== null}
                        title="Supprimer l'utilisateur"
                      >
                        {processingUser === u.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLEAU GESTION MARCHÉS */}
      <div className="card" style={{ marginTop: '40px', marginBottom: '40px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
          <h3 className="heading-md">📄 Liste des Marchés en BDD ({marchesList.length})</h3>
          <span className="text-xs text-muted">Trié par date de publication</span>
        </div>
        
        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Titre du Marché</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Secteur</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Émetteur</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Date de Pub.</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {marchesList.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 8px', maxWidth: '400px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {m.title}
                    </div>
                    {m.id && (
                      <Link href={`/marches/details?id=${m.id}`} target="_blank" style={{ color: 'var(--blue)', fontSize: '0.75rem', textDecoration: 'underline', display: 'inline-block', marginTop: '4px' }}>
                        Voir la fiche publique ↗
                      </Link>
                    )}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{m.category || 'Général'}</span>
                  </td>
                  <td style={{ padding: '16px 8px', fontSize: '0.85rem' }}>
                    {m.source || 'N/A'}
                  </td>
                  <td style={{ padding: '16px 8px', fontSize: '0.85rem' }}>
                    {m.publishedAt ? new Date(m.publishedAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <button 
                      onClick={() => handleDeleteMarche(m.id)}
                      style={{ padding: '6px 10px', background: 'var(--danger-muted)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      title="Supprimer ce marché"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {marchesList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun marché en base. Cliquez sur le robot extracteur pour en récupérer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE DE VISUALISATION DU REÇU */}
      {selectedScreenshot && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card flex flex-col items-center" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => setSelectedScreenshot(null)}
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h3 className="heading-md" style={{ marginBottom: '20px' }}>Reçu de Paiement</h3>
            <img 
              src={selectedScreenshot} 
              alt="Reçu de Paiement" 
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
            />
          </div>
        </div>
      )}
      {/* TOAST DE NOTIFICATION FLOTTANT PRO */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? 'var(--danger)' : 'var(--accent)',
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
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span style={{ fontSize: '0.9rem' }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
