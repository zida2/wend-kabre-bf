'use client';
import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from "docx";
import { saveAs } from "file-saver";

function DetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [marche, setMarche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Paywall states
  const [showPricing, setShowPricing] = useState(false);

  // Studio de Candidature states
  const [showStudio, setShowStudio] = useState(false);
  const [studioStep, setStudioStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // CRM states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // 1. Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          } else {
            const defaultProfile = { email: currentUser.email, isSubscribed: false };
            await setDoc(userDocRef, defaultProfile);
            setUserData(defaultProfile);
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        }
      } else {
        setUserData(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Tender Details
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, 'marches', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMarche({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({
        name: file.name,
        mimeType: file.type,
        data: reader.result.split(',')[1] // remove data:image/png;base64,
      });
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      alert("Veuillez sélectionner au moins un document.");
      return;
    }
    setGeneratingDoc(true);
    setGenerationError(null);
    try {
      const base64Files = await Promise.all(selectedFiles.map(convertFileToBase64));
      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: marche, files: base64Files })
      });
      if (!response.ok) throw new Error("Erreur lors de l'analyse des documents");
      const data = await response.json();
      setExtractedData(data);
      setStudioStep(3);
    } catch (err) {
      console.error(err);
      setGenerationError("Une erreur est survenue lors de l'analyse de vos documents par l'IA. Vérifiez la taille des fichiers.");
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleDownload = async () => {
    if (!extractedData) return;
    
    const companyInfo = extractedData.extractedCompanyInfo || {};
    const offer = extractedData.generatedOffer || {};

    const createText = (text) => new Paragraph({ children: [new TextRun({ text })], spacing: { after: 200 } });

    const docFile = new Document({
      sections: [
        {
          properties: {},
          children: [
            // PAGE DE GARDE
            new Paragraph({ children: [new TextRun({ text: "DOSSIER DE CANDIDATURE - OFFRE TECHNIQUE", bold: true, size: 48, color: "064E3B" })], alignment: AlignmentType.CENTER, spacing: { before: 1000, after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: `Appel d'offres : ${marche.title || '[Titre du marché]'}`, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Présenté par : ${companyInfo.name || '[VOTRE ENTREPRISE]'}`, size: 32, bold: true, color: "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: `RCCM : ${companyInfo.rccm || 'N/A'} | IFU : ${companyInfo.ifu || 'N/A'}`, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Adresse : ${companyInfo.address || 'N/A'}`, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
            new Paragraph({ children: [new TextRun({ text: `Date : ${new Date().toLocaleDateString('fr-FR')}`, size: 24 })], alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [new PageBreak()] }),

            // LETTRE DE SOUMISSION
            new Paragraph({ children: [new TextRun({ text: "LETTRE DE SOUMISSION", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: `À l'attention de : ${marche.source || "L'autorité contractante"}`, bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Objet : Soumission pour le marché relatif à " + (marche.title || '[Objet du marché]'), bold: true })], spacing: { before: 200, after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "Monsieur/Madame le Directeur," })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Après avoir examiné le Dossier d'Appel d'Offres, nous, soussignés ${companyInfo.name || '[Votre entreprise]'}, représentés par ${companyInfo.managerName || 'le Gérant'}, vous proposons de réaliser et d'achever les prestations conformément aux conditions du DAO.` })], spacing: { after: 200 } }),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 1: PRÉSENTATION
            new Paragraph({ children: [new TextRun({ text: "1. PRÉSENTATION DE L'ENTREPRISE", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.presentation || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 2: COMPRÉHENSION
            new Paragraph({ children: [new TextRun({ text: "2. COMPRÉHENSION DU BESOIN ET ENJEUX", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.comprehension || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 3: MÉTHODOLOGIE
            new Paragraph({ children: [new TextRun({ text: "3. MÉTHODOLOGIE D'EXÉCUTION", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.methodology || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 4: MOYENS HUMAINS
            new Paragraph({ children: [new TextRun({ text: "4. MOYENS HUMAINS ET ORGANISATION", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.humanResources || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 5: MOYENS MATÉRIELS
            new Paragraph({ children: [new TextRun({ text: "5. MOYENS MATÉRIELS ET LOGISTIQUES", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.materials || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 6: QUALITÉ & RISQUES
            new Paragraph({ children: [new TextRun({ text: "6. APPROCHE QUALITÉ ET GESTION DES RISQUES", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.qualityAndRisks || "Non renseigné"),
            new Paragraph({ children: [new PageBreak()] }),

            // SECTION 7: PLANNING
            new Paragraph({ children: [new TextRun({ text: "7. PLANNING D'EXÉCUTION", bold: true, size: 32, color: "064E3B" })], spacing: { after: 400 } }),
            createText(offer.planning || "Non renseigné"),
          ],
        },
      ],
    });

    Packer.toBlob(docFile).then((blob) => {
      saveAs(blob, `Dossier_Technique_${companyInfo.name ? companyInfo.name.replace(/\s+/g, '_') : 'Entreprise'}.docx`);
    });
  };

  useEffect(() => {
    if (userData && userData.crm && id) {
      setIsFollowing(!!userData.crm[id]);
    } else {
      setIsFollowing(false);
    }
  }, [userData, id]);

  const handleToggleFollow = async () => {
    if (!user) {
      // router.push is not available here, fallback to alert or link
      alert('Veuillez vous connecter pour suivre ce marché.');
      return;
    }
    setFollowLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentCrm = userData?.crm || {};
      let newCrm = { ...currentCrm };
      
      if (isFollowing) {
        delete newCrm[id];
      } else {
        newCrm[id] = { status: 'favoris', addedAt: new Date().toISOString() };
      }

      await updateDoc(userRef, { crm: newCrm });
      setUserData({ ...userData, crm: newCrm });
      setIsFollowing(!isFollowing);
    } catch (e) {
      console.error("Error toggling follow:", e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="text-center" style={{ padding: '80px 0' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement des détails du marché...</p>
      </div>
    );
  }

  if (!marche) {
    return (
      <div className="text-center" style={{ padding: '80px 0' }}>
        <h2 className="heading-md">Marché introuvable</h2>
        <p className="text-secondary" style={{ marginBottom: '24px' }}>Ce marché n'existe pas ou a été archivé.</p>
        <Link href="/marches" className="btn btn-primary">Retour aux marchés</Link>
      </div>
    );
  }

  const isUserLoggedIn = !!user;
  const isUserSubscribed = userData?.isSubscribed === true;
  const hasFullAccess = isUserSubscribed || marche.category === 'Recrutement';

  // Mocking dates if they don't exist in the DB for the demo
  const deadlineDate = marche.deadline ? new Date(marche.deadline).toLocaleDateString('fr-FR') : 'À vérifier sur le DAO';
  const openingTime = marche.openingTime || '09h00 GMT';

  return (
    <>
    <div className="grid grid-3 gap-8 relative">
      {/* Main Info */}
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <span className="badge badge-green">{marche.status}</span>
          <span className="text-muted text-xs">
            Publié le {marche.publishedAt ? new Date(marche.publishedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
          </span>
        </div>

        <div className="flex justify-between items-start" style={{ gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h1 className="heading-lg" style={{ color: 'var(--text-primary)', flex: 1 }}>{marche.title}</h1>
          {isUserLoggedIn && (
            <button 
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
              style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: isFollowing ? 'var(--gold)' : 'transparent', color: isFollowing ? 'var(--gold)' : '#000', backgroundColor: isFollowing ? 'transparent' : 'var(--gold)' }}
            >
              {followLoading ? '...' : isFollowing ? 'Retirer du suivi' : '🔖 Suivre ce marché'}
            </button>
          )}
        </div>
        
        <h3 className="heading-md" style={{ marginBottom: '12px' }}>Description du projet</h3>
        
        {hasFullAccess ? (
          <p className="text-secondary" style={{ marginBottom: '30px', whiteSpace: 'pre-line' }}>
            {marche.description}
          </p>
        ) : (
          <div style={{ position: 'relative', marginBottom: '30px' }}>
            <p className="text-secondary" style={{ 
              filter: 'blur(4px)', 
              userSelect: 'none',
              lineHeight: '1.8'
            }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              background: 'linear-gradient(to bottom, transparent 20%, var(--color-bg) 95%)',
              pointerEvents: 'none'
            }}></div>
          </div>
        )}
        
        <div className="divider"></div>
        
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <p className="text-xs text-muted">ORGANISME ÉMETTEUR</p>
            <p className="text-sm text-primary" style={{ fontWeight: 600 }}>
              {hasFullAccess ? marche.source : '••••••••••••••••'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">CATÉGORIE</p>
            <p className="text-sm text-gold" style={{ fontWeight: 600 }}>{marche.category || 'Non spécifié'}</p>
          </div>
        </div>

        {/* NOUVEAU : INFORMATIONS DE RECRUTEMENT */}
        {marche.category === 'Recrutement' && (
          <div style={{ background: 'rgba(245, 200, 66, 0.05)', border: '1px solid rgba(245, 200, 66, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 className="heading-sm" style={{ marginBottom: '12px', color: 'var(--gold)' }}>📋 Informations de Candidature</h4>
            <div style={{ marginBottom: '16px' }}>
              <p className="text-xs text-muted" style={{ marginBottom: '8px' }}>DOCUMENTS REQUIS</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }} className="text-sm text-secondary">
                {(marche.requirements || ['Voir les détails dans la description complète ci-dessus']).map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted" style={{ marginBottom: '8px' }}>COMMENT POSTULER</p>
              <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{marche.contactInfo || "Voir l'avis complet ci-dessus"}</p>
            </div>
          </div>
        )}

        {/* NOUVEAU : CALENDRIER DU MARCHÉ */}
        {hasFullAccess && (
          <div style={{ background: 'rgba(52, 211, 114, 0.05)', border: '1px solid rgba(52, 211, 114, 0.2)', padding: '16px', borderRadius: '8px' }}>
            <h4 className="heading-sm" style={{ marginBottom: '12px', color: 'var(--green)' }}>📅 Calendrier du Marché</h4>
            <div className="grid grid-2 gap-4">
              <div>
                <p className="text-xs text-muted">DATE LIMITE DE DÉPÔT</p>
                <p className="text-sm text-primary" style={{ fontWeight: 600, color: '#ef4444' }}>{deadlineDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted">OUVERTURE DES PLIS</p>
                <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{openingTime}</p>
              </div>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: '12px', fontStyle: 'italic' }}>
              *Veillez à déposer votre dossier physique avant la date et l'heure limite.
            </p>
          </div>
        )}

      </div>

      {/* Sidebar Paywall / Actions */}
      <div className="flex flex-col gap-6" style={{ height: 'fit-content' }}>

        {marche.category === 'Recrutement' ? (
          <div className="card text-center" style={{ border: '1px solid var(--green)', boxShadow: '0 8px 30px rgba(52,211,114,0.15)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✅</div>
            <h3 className="heading-md" style={{ marginBottom: '12px', color: 'var(--green)' }}>Accès Gratuit</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
              La consultation des offres d'emploi et de recrutement est 100% libre et gratuite sur Wend-Kabré.
            </p>
            <button 
              className="btn btn-outline w-full" 
              style={{ border: '1px solid var(--green)', color: 'var(--green)' }}
              onClick={() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' })}
            >
              Voir les instructions de candidature
            </button>
          </div>
        ) : (
          <>
            {!isUserLoggedIn && (
              <div className="card text-center" style={{ border: '1px solid var(--gold)', boxShadow: 'var(--shadow-gold)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
                <h3 className="heading-md" style={{ marginBottom: '12px', color: 'var(--gold)' }}>Détails Verrouillés</h3>
                <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
                  Pour consulter les pièces requises et utiliser le Studio de Candidature, veuillez créer un compte.
                </p>
                <Link href="/inscription" className="btn btn-gold w-full text-center" style={{ marginBottom: '12px' }}>
                  Créer un Compte 🚀
                </Link>
              </div>
            )}

            {isUserLoggedIn && !isUserSubscribed && (
              <div className="card" style={{ border: '1px solid var(--gold)', boxShadow: 'var(--shadow-gold)' }}>
                <div className="text-center" style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔐</div>
                  <span className="tag" style={{ background: 'var(--grad-gold)', color: '#000', marginBottom: '12px', display: 'inline-block' }}>Premium requis</span>
                  <h3 className="heading-md" style={{ color: 'var(--gold)', marginBottom: '8px', marginTop: '8px' }}>Débloquer ce marché</h3>
                  <p className="text-muted text-xs" style={{ lineHeight: 1.7 }}>
                    Accédez au Studio de Candidature : L'IA rédige votre offre technique sur-mesure.
                  </p>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '16px 0 4px' }}>
                    15 000 FCFA
                  </h2>
                </div>
                <Link href="/tarifs" className="btn btn-gold w-full" style={{ justifyContent: 'center' }}>
                  Choisir mon abonnement 🚀
                </Link>
              </div>
            )}

            {isUserLoggedIn && isUserSubscribed && (
              <div className="card flex flex-col justify-between" style={{ border: '1px solid var(--gold)', gap: '16px' }}>
                <div>
                  <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
                    <span className="badge badge-gold">Outil Premium</span>
                    <h3 className="heading-md">Studio de Candidature</h3>
                  </div>
                  <p className="text-secondary text-xs" style={{ marginBottom: '16px' }}>
                    Ne perdez plus de temps. Laissez notre IA générer la trame complète de votre dossier technique et administratif.
                  </p>
                  
                  <button 
                    onClick={() => setShowStudio(true)} 
                    className="btn btn-gold w-full text-center"
                  >
                    Générer mon Dossier 🪄
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* STUDIO DE CANDIDATURE MODAL */}
    {showStudio && (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div className="card" style={{ 
          width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid var(--gold)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' 
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
            <h2 className="heading-lg" style={{ color: 'var(--gold)' }}>Studio de Candidature 🪄</h2>
            <button onClick={() => setShowStudio(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Stepper */}
          <div className="flex gap-4" style={{ marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            <div style={{ flex: 1, textAlign: 'center', color: studioStep >= 1 ? 'var(--gold)' : 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>1</div>
              <div className="text-xs">Dossier Administratif</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', color: studioStep >= 2 ? 'var(--gold)' : 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>2</div>
              <div className="text-xs">Offre Technique (IA)</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', color: studioStep >= 3 ? 'var(--gold)' : 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>3</div>
              <div className="text-xs">Vérification & Dépôt</div>
            </div>
          </div>

          {/* STEP 1 */}
          {studioStep === 1 && (
            <div className="animate-fadeIn">
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>Étape 1 : Pièces à fournir</h3>
              
              <div style={{ background: 'rgba(52, 211, 114, 0.05)', border: '1px solid rgba(52, 211, 114, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 className="text-sm font-bold text-primary" style={{ marginBottom: '12px' }}>📌 Documents attendus pour ce marché :</h4>
                
                <p className="text-xs text-muted" style={{ marginBottom: '8px' }}>Socle administratif (obligatoire pour tout marché) :</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '0 0 16px 0' }} className="text-sm text-secondary">
                  <li>Registre de Commerce (RCCM)</li>
                  <li>Attestation de Situation Fiscale (ASF) ou IFU</li>
                  <li>Attestation de la CNSS</li>
                </ul>

                <p className="text-xs text-muted" style={{ marginBottom: '8px' }}>Documents spécifiques à cet avis :</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }} className="text-sm text-secondary">
                  {marche.requirements ? (
                    marche.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))
                  ) : (
                    <li>Consultez la description de l'avis pour les exigences spécifiques (ex: CV, attestations de bonne fin, agréments).</li>
                  )}
                </ul>
              </div>

              <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
                Veuillez sélectionner vos documents numérisés correspondants. L'IA les lira pour vérifier leur conformité et rédiger l'offre technique avec vos vraies données.
              </p>
              
              <div style={{ border: '2px dashed var(--gold)', padding: '30px', textAlign: 'center', borderRadius: '8px', marginBottom: '24px', background: 'rgba(245, 200, 66, 0.05)' }}>
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileChange} id="fileUpload" style={{ display: 'none' }} />
                <label htmlFor="fileUpload" className="btn btn-outline" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', cursor: 'pointer', display: 'inline-block', marginBottom: '16px' }}>
                  📁 Sélectionner vos fichiers
                </label>
                <p className="text-xs text-muted">Formats acceptés : PDF, JPG, PNG.</p>
                
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '16px', textAlign: 'left' }}>
                    <p className="text-sm text-primary" style={{ fontWeight: 'bold', marginBottom: '8px' }}>Fichiers sélectionnés ({selectedFiles.length}) :</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '100px', overflowY: 'auto' }}>
                      {selectedFiles.map((f, i) => (
                        <li key={i} className="text-xs text-secondary" style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>📄 {f.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <button onClick={() => setStudioStep(2)} className="btn btn-primary w-full text-center" disabled={selectedFiles.length === 0} style={{ opacity: selectedFiles.length === 0 ? 0.5 : 1 }}>
                Continuer avec ces documents →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {studioStep === 2 && (
            <div className="animate-fadeIn">
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>Génération Complète de l'Offre</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: '24px' }}>
                Notre IA va analyser vos {selectedFiles.length} documents et rédiger l'<strong>intégralité de l'offre technique sur-mesure</strong> pour ce marché spécifique.
              </p>

              {generationError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
                  ❌ {generationError}
                </div>
              )}

              {!generatingDoc && !generationError && !extractedData ? (
                <button onClick={handleGenerate} className="btn btn-gold w-full text-center" style={{ fontSize: '1.1rem', padding: '16px' }}>
                  🪄 Lancer l'Analyse IA et Rédiger l'Offre
                </button>
              ) : null}

              {generatingDoc && (
                <div className="text-center" style={{ padding: '30px 0' }}>
                  <div style={{ 
                    width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' 
                  }}>
                    <div style={{ 
                      width: '50%', height: '100%', background: 'var(--gold)', borderRadius: '4px',
                      animation: 'progressAnim 2s infinite linear' 
                    }}></div>
                  </div>
                  <style>{`
                    @keyframes progressAnim {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(200%); }
                    }
                  `}</style>
                  <p className="text-gold" style={{ fontWeight: 'bold', marginBottom: '8px' }}>Traitement en cours...</p>
                  <p className="text-xs text-secondary">Lecture OCR, extraction des données, et rédaction sur-mesure de la méthodologie (Cela peut prendre jusqu'à 60 secondes).</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {studioStep === 3 && extractedData && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <h3 className="heading-md text-green">Offre Rédigée avec Succès !</h3>
              </div>
              
              <div style={{ background: 'rgba(52, 211, 114, 0.05)', border: '1px solid rgba(52, 211, 114, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                  <h4 className="text-sm font-bold text-primary">Score de Concordance</h4>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: extractedData.concordanceScore >= 80 ? 'var(--green)' : 'var(--gold)' }}>
                    {extractedData.concordanceScore}%
                  </span>
                </div>
                {extractedData.missingDocuments && extractedData.missingDocuments.length > 0 ? (
                  <div>
                    <p className="text-xs text-muted" style={{ marginBottom: '8px' }}>Documents manquants ou non détectés :</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }} className="text-xs text-secondary">
                      {extractedData.missingDocuments.map((doc, i) => <li key={i}>{doc}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-green">Tous les documents requis semblent présents !</p>
                )}
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 className="text-sm" style={{ color: '#ef4444', marginBottom: '8px', fontWeight: 'bold' }}>⚠️ Responsabilité de Relecture</h4>
                <p className="text-xs text-secondary" style={{ marginBottom: '12px' }}>
                  Bien que l'IA ait rédigé l'offre de bout en bout pour vous (Méthodologie, Risques, Planning), il s'agit de <strong>contenu généré automatiquement</strong>. Vous êtes responsable de vérifier si les délais et approches inventés par l'IA correspondent aux capacités réelles de votre entreprise.
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ marginTop: '2px' }} />
                  <span className="text-xs text-primary">Je m'engage à relire et adapter le document final généré par l'IA avant toute soumission officielle.</span>
                </label>
              </div>

              <div className="grid grid-2 gap-4" style={{ marginBottom: '24px' }}>
                <button 
                  onClick={handleDownload}
                  disabled={!agreedToTerms} 
                  className="btn btn-primary w-full text-center" 
                  style={{ opacity: agreedToTerms ? 1 : 0.5 }}
                >
                  📥 Télécharger l'Offre Rédigée (.docx)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    )}
    </>
  );
}

export default function MarcheDetailPage() {
  return (
    <main className="container section animate-fadeIn">
      <div style={{ marginBottom: '30px' }}>
        <Link href="/marches" className="text-green text-sm" style={{ fontWeight: 600 }}>← Retour à la liste</Link>
      </div>
      
      <Suspense fallback={
        <div className="text-center" style={{ padding: '80px 0' }}>
          <span className="loader" style={{ width: '40px', height: '40px' }}></span>
          <p className="text-secondary" style={{ marginTop: '16px' }}>Initialisation...</p>
        </div>
      }>
        <DetailsContent />
      </Suspense>
    </main>
  );
}
