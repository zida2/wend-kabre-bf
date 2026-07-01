'use client';
import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
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

  const handleGenerate = () => {
    setGeneratingDoc(true);
    setTimeout(() => {
      setGeneratingDoc(false);
      setStudioStep(3); // Go to final download step
    }, 2500);
  };

  const handleDownload = async () => {
    const docFile = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `TRAME DE CANDIDATURE - ${marche.title}`,
                  bold: true,
                  size: 32,
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Émetteur : ", bold: true }),
                new TextRun({ text: marche.source || 'N/A' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Catégorie : ", bold: true }),
                new TextRun({ text: marche.category || 'Général' }),
              ],
            }),
            new Paragraph({ children: [] }),
            new Paragraph({
              children: [
                new TextRun({ text: "[À COMPLÉTER : NOM DE VOTRE ENTREPRISE]", color: "FF0000", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "[À COMPLÉTER : VOTRE RCCM / IFU]", color: "FF0000", bold: true }),
              ],
            }),
            new Paragraph({ children: [] }),

            // SECTION 1
            new Paragraph({
              children: [
                new TextRun({ text: "1. RÉSUMÉ DES ENGAGEMENTS", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Dans le cadre de cet appel d'offres, notre entreprise s'engage formellement à exécuter les prestations conformément aux spécifications du CCTP et dans les délais impartis. ", italics: true }),
                new TextRun({ text: "[Détaillez en 3 lignes votre motivation et votre force principale]", color: "FF0000", italics: true }),
              ],
            }),

            // SECTION 2
            new Paragraph({
              children: [
                new TextRun({ text: "2. COMPRÉHENSION DU BESOIN ET ENJEUX", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "[Démontrez que vous avez lu le DAO. Reformulez les objectifs de l'acheteur avec vos propres mots pour prouver votre expertise.]", color: "FF0000", italics: true }),
              ],
            }),

            // SECTION 3
            new Paragraph({
              children: [
                new TextRun({ text: "3. PRÉSENTATION DE L'ENTREPRISE", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "[Insérez ici une présentation de votre société : Date de création, Chiffre d'affaires, Domaines d'expertise, Nombre d'employés fixes.]", color: "FF0000", italics: true }),
              ],
            }),

            // SECTION 4
            new Paragraph({
              children: [
                new TextRun({ text: "4. MÉTHODOLOGIE D'EXÉCUTION ET CHRONOGRAMME", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "[Étape la plus importante : Décrivez étape par étape COMMENT vous allez exécuter le marché. Ex: 1. Préparation, 2. Approvisionnement, 3. Exécution, 4. Contrôle et Livraison. Insérez également votre planning / chronogramme.]", color: "FF0000", italics: true }),
              ],
            }),

            // SECTION 5
            new Paragraph({
              children: [
                new TextRun({ text: "5. MOYENS HUMAINS ET MATÉRIELS", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "- Chef de projet : ", bold: true }),
                new TextRun({ text: "[Nom et résumé du CV]", color: "FF0000" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "- Équipe technique : ", bold: true }),
                new TextRun({ text: "[Nombre de techniciens et qualifications]", color: "FF0000" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "- Matériel mobilisé : ", bold: true }),
                new TextRun({ text: "[Liste des véhicules, machines ou outils informatiques]", color: "FF0000" })
              ]
            }),

            // SECTION 6
            new Paragraph({
              children: [
                new TextRun({ text: "6. DÉMARCHE QUALITÉ, SÉCURITÉ ET ENVIRONNEMENT (QSE)", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "[Expliquez comment vous garantissez la sécurité sur le chantier/site, vos équipements de protection (EPI), et vos procédures de qualité et SAV.]", color: "FF0000", italics: true }),
              ],
            }),

            // SECTION 7
            new Paragraph({
              children: [
                new TextRun({ text: "7. RÉFÉRENCES SIMILAIRES", bold: true, size: 24, color: "00529b" })
              ],
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "[Citez 3 marchés similaires que vous avez déjà réalisés, avec l'année, le client, et le montant. Joignez les attestations de bonne fin d'exécution en annexe.]", color: "FF0000", italics: true }),
              ],
            }),

            new Paragraph({ children: [] }),
            new Paragraph({ children: [] }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "____________________________________________________________________",
                  color: "888888"
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "* Généré de manière assistée avec Wend-Kabré AI. Ce canevas structurel professionnel doit être obligatoirement adapté et complété avec vos données propres pour être recevable.*",
                  italics: true,
                  size: 16,
                  color: "888888"
                }),
              ],
            }),
          ],
        },
      ],
    });

    Packer.toBlob(docFile).then((blob) => {
      saveAs(blob, `Trame_Candidature_${marche.id || 'Wend_Kabre'}.docx`);
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
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>Checklist Administrative Obligatoire</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: '24px' }}>
                Avant de générer l'offre technique, assurez-vous de réunir ces pièces dans une enveloppe scellée.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <li className="flex gap-3 text-sm items-start">
                  <span>📄</span>
                  <div>
                    <strong className="text-primary">Registre de Commerce (RCCM)</strong><br/>
                    <span className="text-muted text-xs">À récupérer au Centre de Formalités des Entreprises (CEFORE).</span>
                  </div>
                </li>
                <li className="flex gap-3 text-sm items-start">
                  <span>📄</span>
                  <div>
                    <strong className="text-primary">Attestation de Situation Fiscale (ASF)</strong><br/>
                    <span className="text-muted text-xs">À demander à votre centre des impôts (DGI) - Valable 3 mois.</span>
                  </div>
                </li>
                <li className="flex gap-3 text-sm items-start">
                  <span>📄</span>
                  <div>
                    <strong className="text-primary">Attestation CNSS</strong><br/>
                    <span className="text-muted text-xs">Prouve que vous êtes à jour de vos cotisations sociales.</span>
                  </div>
                </li>
              </ul>
              <button onClick={() => setStudioStep(2)} className="btn btn-primary w-full text-center">
                Pièces réunies, passer à l'offre technique →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {studioStep === 2 && (
            <div className="animate-fadeIn">
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>Génération de la Trame Technique</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: '24px' }}>
                Notre IA a analysé ce marché ({marche.category || 'Général'}) et va rédiger la méthodologie de base. Vous devrez <strong style={{color: '#ef4444'}}>OBLIGATOIREMENT</strong> compléter les zones en rouge avec les données de votre entreprise.
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <p className="text-xs text-gold" style={{ marginBottom: '8px' }}>💡 Astuce de l'IA pour gagner :</p>
                <p className="text-sm text-secondary">
                  "Pour ce type de marché émis par <strong>{marche.source}</strong>, les évaluateurs privilégient un chronogramme détaillé et des garanties sur le SAV. L'IA va structurer l'offre autour de ces points."
                </p>
              </div>

              {!generatingDoc ? (
                <button onClick={handleGenerate} className="btn btn-gold w-full text-center" style={{ fontSize: '1.1rem', padding: '16px' }}>
                  🪄 Générer ma Trame Technique (Brouillon Assisté)
                </button>
              ) : (
                <div className="text-center" style={{ padding: '20px 0' }}>
                  <span className="loader" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }}></span>
                  <p className="text-gold">Analyse du CPS et rédaction du canevas en cours...</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {studioStep === 3 && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <h3 className="heading-md text-green">Trame de Candidature Prête !</h3>
              </div>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 className="text-sm" style={{ color: '#ef4444', marginBottom: '8px', fontWeight: 'bold' }}>⚠️ Responsabilité et Relecture</h4>
                <p className="text-xs text-secondary" style={{ marginBottom: '12px' }}>
                  Ce document est un <strong>brouillon structuré</strong>. Si vous soumettez ce document sans remplir les <span style={{ color: '#ef4444', fontWeight: 'bold' }}>[ZONES ROUGES]</span> avec vos propres CV, méthodologies spécifiques et devis, votre offre sera rejetée.
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ marginTop: '2px' }} />
                  <span className="text-xs text-primary">J'ai compris que je dois adapter cette trame aux exigences exactes du DAO de l'émetteur.</span>
                </label>
              </div>

              <div className="grid grid-2 gap-4" style={{ marginBottom: '24px' }}>
                <button 
                  onClick={handleDownload}
                  disabled={!agreedToTerms} 
                  className="btn btn-primary w-full text-center" 
                  style={{ opacity: agreedToTerms ? 1 : 0.5 }}
                >
                  📥 Télécharger le Brouillon (.DOCX)
                </button>
                <a href="https://wa.me/22600000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full text-center" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                  👨‍💼 Faire relire par un Expert
                </a>
              </div>

              <div className="divider" style={{ margin: '20px 0' }}></div>

              <h4 className="heading-sm" style={{ marginBottom: '12px' }}>Où déposer l'enveloppe physique finale ?</h4>
              <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
                Une fois votre dossier complété, imprimé et scellé, déposez-le à l'adresse suivante :<br/>
                <strong className="text-primary" style={{ display: 'block', marginTop: '8px' }}>📍 Direction des Marchés de : {marche.source}</strong>
                <span className="text-xs text-muted">Vérifiez l'heure limite de dépôt sur l'avis officiel.</span>
              </p>

              {marche.link && marche.link !== 'https://www.dgcmef.gov.bf' && (
                <a href={marche.link} target="_blank" rel="noopener noreferrer" className="text-xs text-green" style={{ textDecoration: 'underline' }}>
                  Voir l'avis officiel sur le portail de l'État ↗
                </a>
              )}
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
