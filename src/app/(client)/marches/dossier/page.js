'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import {
  FileText, CheckCircle, Download, ExternalLink,
  AlertTriangle, ArrowLeft, Save, Printer, Mail
} from 'lucide-react';
import { PIECES_ADMINISTRATIVES, CHECKLIST_DEPOT, regleEnveloppe, VALIDITE_PIECES_MOIS } from '@/lib/arcop';

function DossierContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marcheId = searchParams.get('id');
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [marche, setMarche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // État du dossier avec checklist
  // Modèle aligné sur le référentiel ARCOP (cf. src/lib/arcop.js).
  // Le suivi portait auparavant sur une « copie de l'IFU » et un « agrément
  // ARCOP » qui ne figurent pas parmi les pièces exigées, tout en ignorant
  // trois pièces qui, elles, le sont — un dossier à 100 % pouvait donc être
  // rejeté au dépôt.
  const [dossier, setDossier] = useState({
    // Les six pièces administratives exigées
    situationFiscale: false,
    situationCotisante: false,
    nonEngagementAJE: false,
    reglementationTravail: false,
    rccm: false,
    nonFaillite: false,

    // Documents à produire
    lettresoumission: false,
    declarationProbite: false,

    // Blocs de la vérification avant dépôt
    garantieSoumission: false,
    preuvesReferences: false,
    accordGroupement: false,
    enGroupement: false,

    // Pli (art. 101 : enveloppe unique hors prestations intellectuelles)
    pliPrepare: false,

    // Notes personnelles
    notes: '',
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Auth & Data Loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/connexion');
        return;
      }
      setUser(currentUser);
      
      try {
        // Charger les données utilisateur
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        // Charger le marché
        if (marcheId) {
          const marcheSnap = await getDoc(doc(db, 'marches', marcheId));
          if (marcheSnap.exists()) {
            setMarche({ id: marcheSnap.id, ...marcheSnap.data() });
          }

          // Charger l'état du dossier s'il existe
          const dossierSnap = await getDoc(doc(db, 'dossiers', `${currentUser.uid}_${marcheId}`));
          if (dossierSnap.exists()) {
            setDossier(prev => ({ ...prev, ...dossierSnap.data() }));
          }
        }
      } catch (err) {
        console.error('Erreur chargement:', err);
        showToast('Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [marcheId, router]);

  // Calcul de la progression
  const calculateProgress = () => {
    const checks = [
      ...PIECES_ADMINISTRATIVES.map((p) => dossier[p.id]),
      dossier.lettresoumission,
      dossier.declarationProbite,
      dossier.garantieSoumission,
      dossier.preuvesReferences,
      // L'accord de groupement ne compte que si l'utilisateur soumissionne
      // effectivement en groupement.
      ...(dossier.enGroupement ? [dossier.accordGroupement] : []),
      dossier.pliPrepare,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  // Sauvegarder l'état du dossier
  const saveDossier = async () => {
    if (!user || !marcheId) return;
    
    setSaving(true);
    try {
      const dossierRef = doc(db, 'dossiers', `${user.uid}_${marcheId}`);
      await setDoc(dossierRef, {
        ...dossier,
        userId: user.uid,
        marcheId,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      
      showToast('Progression sauvegardée !', 'success');
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle checkbox
  const toggleCheck = (field) => {
    setDossier(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Générer un document ARCOP
  const generateDocument = (type) => {
    if (!marche || !userData) {
      showToast('Données manquantes pour la génération', 'error');
      return;
    }

    if (!userData.rccm || !userData.name) {
      showToast('Complétez votre profil (nom et RCCM requis)', 'error');
      return;
    }

    // Rediriger vers l'API de génération de documents
    const params = new URLSearchParams({
      type,
      marcheTitle: marche.title || '',
      entreprise: userData.name || '',
      rccm: userData.rccm || '',
      ifu: userData.ifu || '',
    });

    window.open(`/api/generate-doc?${params.toString()}`, '_blank');
    showToast(`Document ${type} en cours de génération...`, 'success');
    
    // Marquer comme complété après un court délai
    setTimeout(() => {
      if (type === 'lettre-soumission') {
        toggleCheck('lettresoumission');
      } else if (type === 'declaration-probite') {
        toggleCheck('declarationProbite');
      }
    }, 1000);
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement du dossier...</p>
      </div>
    );
  }

  if (!marche) {
    return (
      <div className="container section">
        <div className="card text-center" style={{ padding: '60px 40px' }}>
          <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 20px' }} />
          <h2 className="heading-md">Marché introuvable</h2>
          <p className="text-secondary" style={{ marginTop: '12px', marginBottom: '24px' }}>
            Le marché demandé n'existe pas ou a été supprimé.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/dashboard" className="btn btn-outline btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <span className="badge badge-green" style={{ marginBottom: '8px' }}>
              {marche.category || 'Général'}
            </span>
            <h1 className="heading-lg" style={{ marginBottom: '12px' }}>
              Montage du Dossier
            </h1>
            <p className="text-secondary text-sm" style={{ maxWidth: '600px' }}>
              {marche.title}
            </p>
          </div>
          
          <button onClick={saveDossier} className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="card" style={{ marginBottom: '32px', background: progress === 100 ? 'var(--success-muted)' : 'var(--color-bg-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="heading-sm">Progression du dossier</h3>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: progress === 100 ? 'var(--green)' : 'var(--primary)' }}>
            {progress}%
          </span>
        </div>
        
        <div style={{ 
          height: '12px', 
          background: 'var(--color-surface-2)', 
          borderRadius: '50px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress === 100 ? 'var(--green)' : 'var(--grad-primary)',
            transition: 'width 0.3s ease',
            borderRadius: '50px'
          }} />
        </div>
        
        {progress === 100 && (
          <p className="text-sm" style={{ marginTop: '12px', color: 'var(--green)', fontWeight: 600 }}>
            🎉 Dossier complet ! Vous êtes prêt à soumettre votre candidature.
          </p>
        )}
      </div>

      <div className="grid grid-2 gap-6">
        {/* Colonne 1 : Pièces administratives */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <FileText size={24} color="var(--primary)" />
            <h3 className="heading-md">Pièces Administratives</h3>
          </div>
          
          <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
            Récupérez vos attestations officielles via les liens directs ci-dessous. Cochez au fur et à mesure.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Attestation Impôts */}
            <div style={{ 
              padding: '16px', 
              background: dossier.situationFiscale ? 'var(--success-muted)' : 'var(--color-surface-2)',
              border: `1px solid ${dossier.situationFiscale ? 'var(--green)' : 'var(--color-border)'}`,
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={dossier.situationFiscale}
                    onChange={() => toggleCheck('situationFiscale')}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span className="text-sm" style={{ fontWeight: 600 }}>Attestation de non-redevance fiscale</span>
                </label>
                {dossier.situationFiscale && <CheckCircle size={20} color="var(--green)" />}
              </div>
              <a 
                href="https://esintax.impots.bf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              >
                <ExternalLink size={16} /> Accéder à eSINTAX
              </a>
            </div>

            {/* Attestation CNSS */}
            <div style={{ 
              padding: '16px', 
              background: dossier.situationCotisante ? 'var(--success-muted)' : 'var(--color-surface-2)',
              border: `1px solid ${dossier.situationCotisante ? 'var(--green)' : 'var(--color-border)'}`,
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={dossier.situationCotisante}
                    onChange={() => toggleCheck('situationCotisante')}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span className="text-sm" style={{ fontWeight: 600 }}>Attestation CNSS à jour</span>
                </label>
                {dossier.situationCotisante && <CheckCircle size={20} color="var(--green)" />}
              </div>
              <a 
                href="https://www.cnss.bf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              >
                <ExternalLink size={16} /> Accéder à la CNSS
              </a>
            </div>

            {/* RCCM */}
            <div style={{ 
              padding: '16px', 
              background: dossier.rccm ? 'var(--success-muted)' : 'var(--color-surface-2)',
              border: `1px solid ${dossier.rccm ? 'var(--green)' : 'var(--color-border)'}`,
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={dossier.rccm}
                    onChange={() => toggleCheck('rccm')}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span className="text-sm" style={{ fontWeight: 600 }}>Copie du RCCM</span>
                </label>
                {dossier.rccm && <CheckCircle size={20} color="var(--green)" />}
              </div>
              <p className="text-xs text-muted">Document délivré par le CEFORE ou le Guichet Unique</p>
            </div>

            {/* Pièces exigées qui manquaient au suivi : non engagement Trésor,
                réglementation du travail, non faillite. */}
            {PIECES_ADMINISTRATIVES
              .filter((p) => ['nonEngagementAJE', 'reglementationTravail', 'nonFaillite'].includes(p.id))
              .map((piece) => (
                <div key={piece.id} style={{
                  padding: '16px',
                  background: dossier[piece.id] ? 'var(--success-muted)' : 'var(--color-surface-2)',
                  border: `1px solid ${dossier[piece.id] ? 'var(--green)' : 'var(--color-border)'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={!!dossier[piece.id]}
                        onChange={() => toggleCheck(piece.id)}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span className="text-sm" style={{ fontWeight: 600 }}>{piece.label}</span>
                    </label>
                    {dossier[piece.id] && <CheckCircle size={20} color="var(--green)" />}
                  </div>
                  <p className="text-xs text-muted">Délivrée par : {piece.emetteur}</p>
                </div>
              ))}

            <p className="text-xs" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              <AlertTriangle size={12} className="inline mr-1" />
              Ces pièces doivent dater de moins de {VALIDITE_PIECES_MOIS} mois au dépôt.
              La liste exacte figurant dans le dossier d'appel à concurrence fait foi.
            </p>

            {/* Bloc retiré : « Agrément ARCOP » ne fait pas partie des pièces exigées. */}
          </div>
        </div>

        {/* Colonne 2 : Documents générés & Enveloppes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Documents ARCOP */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Download size={24} color="var(--accent)" />
              <h3 className="heading-md">Documents ARCOP</h3>
            </div>
            
            <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
              Générez automatiquement les documents pré-remplis pour ce marché spécifique.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Lettre de soumission */}
              <div style={{ 
                padding: '16px', 
                background: dossier.lettresoumission ? 'var(--success-muted)' : 'var(--color-surface-2)',
                border: `1px solid ${dossier.lettresoumission ? 'var(--green)' : 'var(--color-border)'}`,
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {dossier.lettresoumission && <CheckCircle size={20} color="var(--green)" />}
                    <span className="text-sm" style={{ fontWeight: 600 }}>Lettre de Soumission</span>
                  </div>
                </div>
                <button 
                  onClick={() => generateDocument('lettre-soumission')}
                  className="btn btn-accent btn-sm"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                  disabled={!userData?.name || !userData?.rccm}
                >
                  <Printer size={16} /> Générer le document
                </button>
                {(!userData?.name || !userData?.rccm) && (
                  <p className="text-xs text-danger" style={{ marginTop: '8px' }}>
                    ⚠️ Complétez votre profil (RCCM obligatoire)
                  </p>
                )}
              </div>

              {/* Déclaration de probité */}
              <div style={{ 
                padding: '16px', 
                background: dossier.declarationProbite ? 'var(--success-muted)' : 'var(--color-surface-2)',
                border: `1px solid ${dossier.declarationProbite ? 'var(--green)' : 'var(--color-border)'}`,
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {dossier.declarationProbite && <CheckCircle size={20} color="var(--green)" />}
                    <span className="text-sm" style={{ fontWeight: 600 }}>Déclaration de Probité</span>
                  </div>
                </div>
                <button 
                  onClick={() => generateDocument('declaration-probite')}
                  className="btn btn-accent btn-sm"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                  disabled={!userData?.name || !userData?.rccm}
                >
                  <Printer size={16} /> Générer le document
                </button>
                {(!userData?.name || !userData?.rccm) && (
                  <p className="text-xs text-danger" style={{ marginTop: '8px' }}>
                    ⚠️ Complétez votre profil (RCCM obligatoire)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Gestion des Enveloppes */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Mail size={24} color="var(--forest)" />
              <h3 className="heading-md">Vérification avant dépôt</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Les blocs 2 à 4 de la liste de contrôle officielle. Le bloc 1
                  (pièces administratives) est suivi dans la colonne de gauche. */}
              {CHECKLIST_DEPOT.filter((b) => b.id !== 'piecesAdministratives').map((bloc) => {
                const estGroupement = bloc.id === 'accordGroupement';
                const coche = !!dossier[bloc.id];
                const inactif = estGroupement && !dossier.enGroupement;
                return (
                  <div key={bloc.id} style={{
                    padding: '16px',
                    background: coche && !inactif ? 'var(--success-muted)' : 'var(--color-surface-2)',
                    border: `1px solid ${coche && !inactif ? 'var(--green)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    opacity: inactif ? 0.55 : 1,
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: inactif ? 'default' : 'pointer', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={coche}
                        disabled={inactif}
                        onChange={() => toggleCheck(bloc.id)}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span className="text-sm" style={{ fontWeight: 600 }}>{bloc.titre}</span>
                      {coche && !inactif && <CheckCircle size={20} color="var(--green)" />}
                    </label>
                    <p className="text-xs text-muted">{bloc.controle}</p>
                    {estGroupement && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!dossier.enGroupement}
                          onChange={() => toggleCheck('enGroupement')}
                        />
                        <span className="text-xs text-muted">Je soumissionne en groupement</span>
                      </label>
                    )}
                  </div>
                );
              })}

              {/* Pli — art. 101 du décret n°2024-1748 */}
              {(() => {
                const enveloppe = regleEnveloppe(marche?.natureArcop || 'TRAVAUX');
                return (
                  <div style={{
                    padding: '16px',
                    background: dossier.pliPrepare ? 'var(--success-muted)' : 'var(--color-surface-2)',
                    border: `1px solid ${dossier.pliPrepare ? 'var(--green)' : 'var(--color-border)'}`,
                    borderRadius: '8px'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={!!dossier.pliPrepare}
                        onChange={() => toggleCheck('pliPrepare')}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {enveloppe.type === 'UNIQUE' ? 'Pli préparé (enveloppe unique)' : 'Plis préparés (double enveloppe)'}
                      </span>
                      {dossier.pliPrepare && <CheckCircle size={20} color="var(--green)" />}
                    </label>
                    <p className="text-xs text-muted">{enveloppe.resume}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                      {enveloppe.article} du décret n°2024-1748. La double enveloppe
                      technique/financière ne s'applique plus hors prestations intellectuelles.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Notes personnelles */}
          <div className="card">
            <h4 className="text-sm" style={{ fontWeight: 600, marginBottom: '12px' }}>📝 Notes personnelles</h4>
            <textarea 
              className="form-input"
              rows="4"
              placeholder="Ajoutez vos remarques, points à vérifier, etc."
              value={dossier.notes}
              onChange={(e) => setDossier(prev => ({ ...prev, notes: e.target.value }))}
              style={{ resize: 'vertical', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div style={{ 
          position: 'fixed', 
          bottom: '30px', 
          right: '30px', 
          background: toast.type === 'success' ? 'var(--green)' : 'var(--danger)', 
          color: '#fff', 
          padding: '14px 24px', 
          borderRadius: '8px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)', 
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function DossierPage() {
  return (
    <Suspense fallback={
      <div className="container section" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement...</p>
      </div>
    }>
      <DossierContent />
    </Suspense>
  );
}
