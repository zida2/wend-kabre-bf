'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CATEGORIES = [
  { value: 'Informatique', label: '💻 Informatique & Réseau' },
  { value: 'Construction', label: '🏗️ BTP & Génie Civil' },
  { value: 'Fourniture',   label: '📦 Fourniture de Bureau & Matériel' },
  { value: 'Prestation',   label: '⚙️ Prestations de Services & Conseil' },
  { value: 'Recrutement',  label: '👥 Recrutement & Formation' },
];

export default function AlertesPage() {
  const [user, setUser]         = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form state
  const [phone,    setPhone]    = useState('');
  const [channel,  setChannel]  = useState('whatsapp');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('Informatique');

  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // ─── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            // Pré-remplir les champs avec les préférences existantes
            if (data.alertPrefs) {
              setPhone(data.alertPrefs.phone || data.phone || '');
              setChannel(data.alertPrefs.channel || 'whatsapp');
              // alertPrefs.keywords est la source de vérité partagée avec le dashboard : stocké en tableau.
              // On affiche ici sous forme de chaîne séparée par des virgules. Fallback ancien champ data.keywords.
              const kw = data.alertPrefs.keywords ?? data.keywords ?? '';
              setKeywords(Array.isArray(kw) ? kw.join(', ') : kw);
              setCategory(data.alertPrefs.category || 'Informatique');
            } else {
              setPhone(data.phone || '');
              const kw = data.keywords ?? '';
              setKeywords(Array.isArray(kw) ? kw.join(', ') : kw);
            }
          }
        } catch (e) { console.error(e); }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ─── Sauvegarde réelle dans Firestore ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Blocage pour les utilisateurs gratuits
    if (!userData?.isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      // On normalise les mots-clés en tableau pour partager exactement le même format
      // que le dashboard (alertPrefs.keywords[]) et le moteur d'alertes.
      const keywordsArr = keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
      await updateDoc(userRef, {
        alertPrefs: {
          phone:     phone.trim(),
          channel,
          keywords:  keywordsArr,
          category,
          updatedAt: new Date().toISOString(),
          active:    true,
        },
        // Aussi mettre à jour le téléphone principal si vide
        ...(userData?.phone ? {} : { phone: phone.trim() }),
      });

      setMessage(`✅ Alertes configurées ! Vous recevrez vos notifications sur ${phone} via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} dès qu'un marché en "${category}" est publié.`);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde. Vérifiez votre connexion et réessayez.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Désactiver les alertes ────────────────────────────────────────
  const handleDisable = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'alertPrefs.active': false,
        'alertPrefs.updatedAt': new Date().toISOString(),
      });
      setUserData(prev => ({ ...prev, alertPrefs: { ...prev?.alertPrefs, active: false } }));
      setMessage('🔕 Alertes désactivées. Vous pouvez les réactiver à tout moment.');
    } catch (e) {
      setError('Impossible de désactiver les alertes.');
    }
  };

  // ─── Non connecté ─────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <main className="container section animate-fadeIn" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center" style={{ maxWidth: '480px', padding: '48px 32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔔</div>
          <h2 className="heading-md" style={{ marginBottom: '12px' }}>Connexion requise</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: '28px', lineHeight: 1.7 }}>
            Les alertes WhatsApp et SMS sont liées à votre compte entreprise.
            Connectez-vous pour les configurer.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/connexion" className="btn btn-primary">Se connecter</Link>
            <Link href="/inscription" className="btn btn-outline">Créer un compte</Link>
          </div>
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="container section" style={{ textAlign: 'center', paddingTop: '120px' }}>
        <span className="loader" style={{ width: '36px', height: '36px' }}></span>
      </main>
    );
  }

  const hasActiveAlerts = userData?.alertPrefs?.active === true;

  return (
    <main className="container section animate-fadeIn" style={{ maxWidth: '820px' }}>

      {/* En-tête */}
      <div className="text-center" style={{ marginBottom: '40px' }}>
        <span className="badge badge-green" style={{ marginBottom: '12px' }}>
          <span className="dot dot-green"></span> Notifications Temps Réel
        </span>
        <h1 className="heading-lg">Mes Alertes Marchés</h1>
        <p className="text-secondary text-sm" style={{ marginTop: '10px' }}>
          Soyez le premier notifié dès qu'un marché correspond à votre secteur.
        </p>
      </div>

      {/* Statut actuel des alertes */}
      {hasActiveAlerts && (
        <div className="card-glass" style={{
          marginBottom: '30px',
          borderLeft: '3px solid var(--green-primary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="dot dot-green"></span>
              <span style={{ color: 'var(--green-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Alertes actives
              </span>
            </div>
            <p className="text-muted text-xs">
              {userData.alertPrefs?.channel === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'} · {userData.alertPrefs?.category} · {userData.alertPrefs?.phone}
            </p>
          </div>
          <button
            onClick={handleDisable}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(220,38,38,0.35)', color: 'var(--danger)', background: 'var(--danger-muted)', flexShrink: 0 }}
          >
            Désactiver
          </button>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="card-glass" style={{ marginBottom: '24px', borderLeft: '3px solid var(--green-primary)', padding: '16px' }}>
          <p className="text-sm" style={{ color: 'var(--green-primary)', lineHeight: 1.7 }}>{message}</p>
        </div>
      )}
      {error && (
        <div className="card-glass" style={{ marginBottom: '24px', borderLeft: '3px solid var(--red-accent)', padding: '16px' }}>
          <p className="text-sm" style={{ color: 'var(--red-accent)' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Formulaire */}
      <div className="card">
        <h3 className="heading-md" style={{ marginBottom: '24px' }}>
          {hasActiveAlerts ? '✏️ Modifier mes préférences' : '🔔 Configurer mes alertes'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="form-group">
            <label className="form-label">Numéro de téléphone (avec indicatif pays)</label>
            <input
              type="tel"
              placeholder="+226 70 00 00 00"
              className="form-input"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <p className="text-muted text-xs">Ce numéro recevra vos alertes WhatsApp ou SMS.</p>
          </div>

          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Canal de notification</label>
              <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="whatsapp">💬 WhatsApp (Recommandé)</option>
                <option value="sms">📱 SMS Classique</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Secteur d'activité</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mots-clés supplémentaires (séparés par des virgules)</label>
            <input
              type="text"
              placeholder="Ex: audit, logiciel, tablette, formation, forage..."
              className="form-input"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            />
            <p className="text-muted text-xs">
              Vous serez alerté si ces mots apparaissent dans le titre ou la description d'un marché.
            </p>
          </div>

          <div className="divider" style={{ margin: '4px 0' }}></div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving}
          >
            {saving
              ? <span className="loader"></span>
              : hasActiveAlerts ? '💾 Mettre à jour mes alertes' : '🔔 Activer mes alertes'
            }
          </button>
        </form>
      </div>

      {/* Info box */}
      <div className="card-glass text-center" style={{
        marginTop: '32px',
        borderLeft: '3px solid var(--gold)',
        padding: '20px 24px',
      }}>
        <p className="text-secondary text-sm" style={{ lineHeight: 1.8 }}>
          💡 <strong style={{ color: 'var(--gold)' }}>WhatsApp est fortement recommandé</strong> au Burkina Faso —
          les alertes y arrivent instantanément et sans frais de réseau supplémentaires.
          Le délai moyen entre la publication et votre notification est de{' '}
          <strong style={{ color: 'var(--text-primary)' }}>moins de 5 minutes.</strong>
        </p>
      </div>

      {/* Modal Premium */}
      {showPremiumModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card text-center animate-fadeIn" style={{ maxWidth: '420px', margin: '20px', padding: '40px 32px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⭐</div>
            <h3 className="heading-md" style={{ marginBottom: '12px' }}>Fonctionnalité Premium</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '28px', lineHeight: 1.6 }}>
              Les alertes instantanées sur WhatsApp et SMS sont réservées aux abonnés <strong>Premium</strong>. Passez à la vitesse supérieure pour recevoir les marchés de votre secteur directement sur votre téléphone, avant tout le monde.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/tarifs" className="btn btn-primary w-full">
                Découvrir les offres Premium
              </Link>
              <button 
                type="button" 
                onClick={() => setShowPremiumModal(false)} 
                className="btn btn-outline w-full"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
