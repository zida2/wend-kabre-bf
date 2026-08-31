'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { PLAN_PRICES } from '@/lib/subscription';
import { track } from '@/lib/track';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

function PaiementOCRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);

  // 🔒 Sécurité du montant : calculé côté client à partir des constantes serveur PLAN_PRICES
  const rawPlan = (searchParams.get('plan') || 'PREMIUM').toUpperCase();
  const planId = ['FREE', 'PREMIUM', 'ENTERPRISE'].includes(rawPlan) ? rawPlan : 'PREMIUM';
  const billingPeriod = searchParams.get('billing') === 'annual' ? 'annual' : 'monthly';

  const basePrice = PLAN_PRICES[planId] || 15000;
  const officialAmount = billingPeriod === 'annual' && planId !== 'FREE'
    ? Math.round(basePrice * 12 * 0.8)
    : basePrice;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push('/connexion');
        return;
      }

      // Vérifier si l'utilisateur a déjà une demande en attente
      try {
        const q = query(
          collection(db, 'payment_requests'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          reqs.sort((a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0) - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0));
          const latest = reqs[0];
          const statusLower = (latest.status || '').toLowerCase();
          if (statusLower === 'pending' || statusLower === 'en attente') {
            setExistingRequest(latest);
          }
        }
      } catch (err) {
        console.error('Erreur vérification demandes existantes:', err);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 5 Mo.');
        return;
      }
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot || !user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/payment/submit-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan: planId,
          billingPeriod,
          screenshotName: screenshot.name,
          reference: screenshot.name
        })
      });

      const data = await response.json();

      if (data.success) {
        track('payment_manual_submit_success', { 
          plan: planId, 
          amount: officialAmount,
          requestId: data.requestId 
        });

        setUploadSuccess(true);
        setExistingRequest({ 
          id: data.requestId, 
          plan: planId, 
          amount: officialAmount, 
          status: 'approved', 
          screenshotName: screenshot.name 
        });
      } else {
        alert(`Erreur d'activation : ${data.error || 'Impossible d\'activer le compte'}`);
      }

    } catch (error) {
      console.error('Erreur soumission paiement manuel:', error);
      alert('Erreur lors de la soumission de la preuve. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div className="loader" style={{ margin: '0 auto 20px' }}></div>
        <p className="text-secondary">Vérification de votre connexion...</p>
      </div>
    );
  }

  return (
    <main className="animate-fadeIn">
      <section className="section">
        <div className="container" style={{ maxWidth: '720px' }}>
          
          <Link href="/tarifs" className="btn btn-outline btn-sm" style={{ marginBottom: '24px' }}>
            <ArrowLeft size={16} /> Retour aux tarifs
          </Link>

          {/* SI DEMANDE ACTIVÉE AVEC SUCCÈS OU DÉJÀ EXISTANTE */}
          {(uploadSuccess || existingRequest) ? (
            <div className="card" style={{ padding: '48px 32px', textAlign: 'center', borderRadius: '24px', background: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)', border: '2px solid #10B981', color: '#FFFFFF' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 25px rgba(16,185,129,0.4)'
              }}>
                <CheckCircle size={44} />
              </div>

              <span style={{
                background: '#10B981',
                color: '#022C22',
                fontWeight: 900,
                fontSize: '0.8rem',
                padding: '6px 16px',
                borderRadius: '50px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                ⚡ COMPTE PREMIUM ACTIVÉ AUTOMATIQUEMENT
              </span>

              <h2 className="heading-lg" style={{ marginBottom: '16px', color: '#FFFFFF' }}>
                Félicitations ! Votre Accès est Débloqué
              </h2>

              <p style={{ fontSize: '1.05rem', marginBottom: '28px', lineHeight: 1.6, color: '#D1FAE5' }}>
                Votre transfert pour le <strong>Plan {planId}</strong> ({officialAmount.toLocaleString('fr-FR')} FCFA) a bien été pris en compte.
                <br />
                Votre abonnement Premium est <strong>immédiatement actif</strong> !
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '32px',
                textAlign: 'left',
                backdropFilter: 'blur(4px)'
              }}>
                <h4 style={{ fontWeight: 700, marginBottom: '10px', color: '#FFFFFF', fontSize: '0.95rem' }}>
                  📌 Détails de votre accès :
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', color: '#ECFDF5' }}>
                  <li style={{ marginBottom: '6px' }}>• <strong>Compte :</strong> {user.email}</li>
                  <li style={{ marginBottom: '6px' }}>• <strong>Plan :</strong> {planId} ({billingPeriod === 'annual' ? 'Facturation annuelle' : 'Facturation mensuelle'})</li>
                  <li style={{ marginBottom: '6px' }}>• <strong>Montant :</strong> {officialAmount.toLocaleString('fr-FR')} FCFA</li>
                  <li style={{ marginBottom: '6px' }}>• <strong>Statut :</strong> <span style={{ color: '#34D399', fontWeight: 800 }}>✓ Actif</span></li>
                  <li>• <strong>Preuve transmise :</strong> {screenshot?.name || existingRequest?.screenshotName || 'Capture enregistrée'}</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/marches" className="btn btn-lg" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF', fontWeight: 800 }}>
                  Explorer les marchés publics →
                </Link>
                <Link href="/dashboard" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF' }}>
                  Tableau de bord
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* BANDEAU MÉTHODE DISPONIBLE */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(16,185,129,0.05))',
                border: '2px solid rgba(5,150,105,0.3)',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  🟢
                </div>
                <div>
                  <h3 style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '6px', fontSize: '1.05rem' }}>
                    Paiement par Transfert Manuel
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                    Effectuez votre transfert Orange Money ou Moov Money vers l'un des numéros ci-dessous, puis déposez votre capture d'écran de confirmation.
                    <br />
                    <strong>Validation et activation sous 24h ouvrées.</strong>
                  </p>
                </div>
              </div>

              <div className="card" style={{ padding: '36px', borderRadius: '24px' }}>
                
                {/* En-tête Récapitulatif Plan */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '24px',
                  marginBottom: '28px',
                  borderBottom: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <span className="badge badge-gold" style={{ marginBottom: '6px' }}>Plan sélectionné</span>
                    <h1 className="heading-md" style={{ margin: 0 }}>
                      Plan {planId === 'PREMIUM' ? 'Premium ⚡' : 'Entreprise 🏢'}
                    </h1>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
                      {officialAmount.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-sm text-secondary" style={{ marginLeft: '4px' }}>FCFA</span>
                    <p className="text-xs text-muted" style={{ margin: 0 }}>
                      {billingPeriod === 'annual' ? 'Facturé annuellement (-20%)' : 'Facturé mensuellement'}
                    </p>
                  </div>
                </div>

                {/* Instructions de Transfert */}
                <div style={{
                  background: 'var(--color-surface-2)',
                  border: '2px solid var(--color-border)',
                  borderRadius: '18px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <h3 style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: 700, 
                    marginBottom: '20px', 
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📱 Coordonnées de paiement Mobile Money
                  </h3>
                  
                  {/* Orange Money */}
                  <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
                    <p style={{ fontWeight: 700, color: '#F97316', marginBottom: '8px', fontSize: '0.95rem' }}>
                      🟠 Option 1 : Orange Money
                    </p>
                    <div style={{ background: 'var(--color-bg-1)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <p style={{ margin: '0 0 6px 0' }}>1. Composez <strong>*144#</strong> ➔ Transfert d'argent</p>
                      <p style={{ margin: '0 0 6px 0' }}>2. Numéro destinataire : <strong style={{ fontSize: '1.1rem', color: '#F97316' }}>62 20 28 77</strong></p>
                      <p style={{ margin: 0 }}>3. Montant exact : <strong>{officialAmount.toLocaleString('fr-FR')} FCFA</strong></p>
                    </div>
                  </div>

                  {/* Moov Money */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#3B82F6', marginBottom: '8px', fontSize: '0.95rem' }}>
                      🔵 Option 2 : Moov Money
                    </p>
                    <div style={{ background: 'var(--color-bg-1)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <p style={{ margin: '0 0 6px 0' }}>1. Composez <strong>*555#</strong> ➔ Transfert d'argent</p>
                      <p style={{ margin: '0 0 6px 0' }}>2. Numéro destinataire : <strong style={{ fontSize: '1.1rem', color: '#3B82F6' }}>06 13 90 16</strong></p>
                      <p style={{ margin: 0 }}>3. Montant exact : <strong>{officialAmount.toLocaleString('fr-FR')} FCFA</strong></p>
                    </div>
                  </div>
                </div>

                {/* Formulaire de dépôt de la preuve */}
                <form onSubmit={handleSubmit}>
                  <h3 className="text-primary" style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📸 Joindre votre preuve de transfert
                  </h3>

                  <div style={{ marginBottom: '24px' }}>
                    <label 
                      htmlFor="screenshot" 
                      style={{
                        display: 'block',
                        padding: '36px 20px',
                        border: '2px dashed var(--primary)',
                        borderRadius: '18px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: previewUrl ? 'var(--color-bg-2)' : 'var(--primary-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {previewUrl ? (
                        <div>
                          <img 
                            src={previewUrl} 
                            alt="Aperçu du reçu" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '260px', 
                              borderRadius: '12px',
                              marginBottom: '12px',
                              boxShadow: 'var(--shadow-sm)'
                            }} 
                          />
                          <p className="text-sm text-primary" style={{ fontWeight: 600, margin: 0 }}>
                            ✓ Fichier sélectionné : {screenshot?.name}
                          </p>
                          <p className="text-xs text-muted" style={{ marginTop: '6px' }}>
                            Cliquez pour remplacer le fichier
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>📤</div>
                          <p className="text-primary" style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.95rem' }}>
                            Cliquez pour choisir une capture d'écran ou un PDF du reçu
                          </p>
                          <p className="text-xs text-muted" style={{ margin: 0 }}>
                            Formats acceptés : JPG, PNG, PDF (Taille max : 5 Mo)
                          </p>
                        </div>
                      )}
                    </label>
                    <input
                      type="file"
                      id="screenshot"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      required
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Récapitulatif utilisateur */}
                  <div style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '28px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className="text-secondary">Compte demandeur :</span>
                      <strong className="text-primary">{user.email}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-secondary">Montant à valider :</span>
                      <strong className="text-primary">{officialAmount.toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                  </div>

                  {/* Bouton de soumission */}
                  <button
                    type="submit"
                    disabled={!screenshot || loading}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontWeight: 700,
                      padding: '16px 32px',
                      fontSize: '1rem',
                      opacity: (!screenshot || loading) ? 0.5 : 1,
                      cursor: (!screenshot || loading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="loader" style={{ width: '20px', height: '20px' }}></span>
                        <span>Transmission en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Soumettre la preuve de paiement</span>
                        <span style={{ fontSize: '18px' }}>→</span>
                      </>
                    )}
                  </button>

                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center',
                    marginTop: '16px',
                    margin: '16px 0 0 0'
                  }}>
                    🔒 Vos données sont sécurisées et vérifiées par notre équipe avant activation.
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function PaiementOCRPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div className="loader" style={{ margin: '0 auto 20px' }}></div>
        <p className="text-secondary">Chargement...</p>
      </div>
    }>
      <PaiementOCRContent />
    </Suspense>
  );
}
