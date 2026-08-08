'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { track } from '@/lib/track';

function PaiementOCRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const plan = searchParams.get('plan') || 'premium';
  const amount = searchParams.get('amount') || '15000';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push('/connexion');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
      // Créer une entrée dans Firestore payment_requests
      const paymentRequest = {
        userId: user.uid,
        userEmail: user.email,
        plan: plan.toUpperCase(),
        amount: parseInt(amount, 10),
        paymentMethod: 'ORANGE_MONEY_OCR',
        status: 'PENDING',
        screenshotName: screenshot.name,
        screenshotSize: screenshot.size,
        createdAt: new Date(),
        processedAt: null,
        notes: 'En attente de validation manuelle - Système OCR temporaire'
      };

      const docRef = await addDoc(collection(db, 'payment_requests'), paymentRequest);
      
      track('payment_ocr_submit', { 
        plan: plan.toUpperCase(), 
        amount: parseInt(amount, 10),
        requestId: docRef.id 
      });

      setUploadSuccess(true);

      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/dashboard?payment=pending');
      }, 3000);

    } catch (error) {
      console.error('Erreur soumission paiement OCR:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
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
        <div className="container" style={{ maxWidth: '700px' }}>
          
          {uploadSuccess ? (
            <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', marginBottom: '24px' }}>✓</div>
              <h2 className="heading-lg text-green" style={{ marginBottom: '16px' }}>
                Paiement en cours de validation
              </h2>
              <p className="text-secondary" style={{ fontSize: '1.1rem', marginBottom: '24px' }}>
                Votre preuve de paiement a été soumise avec succès.
                <br />
                Notre équipe la validera sous 24h ouvrées.
              </p>
              <div style={{
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <p className="text-sm text-muted" style={{ margin: 0 }}>
                  📧 Vous recevrez un email de confirmation dès validation.
                </p>
              </div>
              <p className="text-muted text-sm">
                Redirection automatique vers votre tableau de bord...
              </p>
            </div>
          ) : (
            <>
              {/* Bandeau avertissement temporaire */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))',
                border: '2px solid rgba(245,158,11,0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
                <div>
                  <h3 style={{ color: '#F59E0B', fontWeight: 600, marginBottom: '8px', fontSize: '1rem' }}>
                    Mode de paiement temporaire
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                    Le système de paiement automatique Money Fusion est en cours d'activation. 
                    En attendant, vous pouvez effectuer votre paiement via Orange Money et soumettre la preuve ici.
                    <br />
                    <strong>Validation manuelle sous 24h.</strong>
                  </p>
                </div>
              </div>

              <div className="card" style={{ padding: '40px' }}>
                <h1 className="heading-lg" style={{ marginBottom: '24px', textAlign: 'center' }}>
                  Paiement Plan {plan === 'premium' ? 'Premium' : 'Entreprise'}
                </h1>

                {/* Instructions de paiement */}
                <div style={{
                  background: 'var(--color-bg-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '32px'
                }}>
                  <h3 className="text-primary" style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1.1rem' }}>
                    📱 Instructions de paiement Orange Money
                  </h3>
                  
                  <ol style={{ 
                    paddingLeft: '20px', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.8,
                    fontSize: '0.95rem'
                  }}>
                    <li style={{ marginBottom: '12px' }}>
                      Composez <strong style={{ color: 'var(--primary)' }}>#144*82#</strong> sur votre téléphone Orange Money
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      Sélectionnez <strong>1. Transfert d'argent</strong>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      Entrez le numéro destinataire: <strong style={{ color: 'var(--primary)' }}>+226 70 00 00 00</strong>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      Montant: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{parseInt(amount, 10).toLocaleString('fr-FR')} FCFA</strong>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      Validez avec votre code secret
                    </li>
                    <li style={{ marginBottom: '0' }}>
                      <strong style={{ color: 'var(--primary)' }}>Prenez une capture d'écran</strong> du message de confirmation reçu par SMS
                    </li>
                  </ol>
                </div>

                {/* Formulaire upload */}
                <form onSubmit={handleSubmit}>
                  <h3 className="text-primary" style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1rem' }}>
                    📸 Soumettez votre preuve de paiement
                  </h3>

                  <div style={{ marginBottom: '24px' }}>
                    <label 
                      htmlFor="screenshot" 
                      style={{
                        display: 'block',
                        padding: '40px 20px',
                        border: '2px dashed var(--color-border-hover)',
                        borderRadius: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: previewUrl ? 'var(--color-bg-2)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!previewUrl) e.target.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!previewUrl) e.target.style.borderColor = 'var(--color-border-hover)';
                      }}
                    >
                      {previewUrl ? (
                        <div>
                          <img 
                            src={previewUrl} 
                            alt="Aperçu" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '300px', 
                              borderRadius: '12px',
                              marginBottom: '12px'
                            }} 
                          />
                          <p className="text-sm text-secondary" style={{ margin: 0 }}>
                            ✓ Fichier sélectionné: {screenshot?.name}
                          </p>
                          <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                            Cliquez pour changer
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📤</div>
                          <p className="text-primary" style={{ fontWeight: 600, marginBottom: '8px' }}>
                            Cliquez pour sélectionner votre capture d'écran
                          </p>
                          <p className="text-sm text-muted">
                            Formats acceptés: JPG, PNG, PDF • Max 5 Mo
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

                  {/* Info utilisateur */}
                  <div style={{
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    fontSize: '0.9rem'
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
                      <strong>Compte:</strong> {user.email}
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      <strong>Montant:</strong> {parseInt(amount, 10).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>

                  {/* Bouton submit */}
                  <button
                    type="submit"
                    disabled={!screenshot || loading}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      background: loading || !screenshot ? 'var(--color-bg-3)' : 'var(--grad-primary)',
                      cursor: loading || !screenshot ? 'not-allowed' : 'pointer',
                      opacity: loading || !screenshot ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ 
                          width: '20px', 
                          height: '20px',
                          border: '3px solid rgba(255,255,255,0.2)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }}></div>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Soumettre ma preuve de paiement</span>
                        <span style={{ fontSize: '20px' }}>→</span>
                      </>
                    )}
                  </button>

                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center',
                    marginTop: '16px'
                  }}>
                    🔒 Vos données sont sécurisées et traitées confidentiellement
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
