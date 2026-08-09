'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

// Import des composants d'étapes
import Step1Admin from './components/Step1Admin';
import Step2Technical from './components/Step2Technical';
import Step3Verification from './components/Step3Verification';
import ProgressBar from './components/ProgressBar';

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marcheId = searchParams.get('id');
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [marche, setMarche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState(null);

  // État du studio (sauvegardé dans Firestore)
  const [studioData, setStudioData] = useState({
    step: 1,
    selectedFiles: [],
    extractedData: null,
    enGroupement: false,
    agreedToTerms: false,
    generationError: null,
    lastUpdated: null,
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

          // Charger l'état du studio s'il existe
          const studioSnap = await getDoc(doc(db, 'studio', `${currentUser.uid}_${marcheId}`));
          if (studioSnap.exists()) {
            const savedData = studioSnap.data();
            setStudioData(savedData);
            setCurrentStep(savedData.step || 1);
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

  // Sauvegarde automatique
  const saveStudio = async (updatedData = null) => {
    if (!user || !marcheId) return;
    
    setSaving(true);
    try {
      const dataToSave = updatedData || studioData;
      const studioRef = doc(db, 'studio', `${user.uid}_${marcheId}`);
      await setDoc(studioRef, {
        ...dataToSave,
        userId: user.uid,
        marcheId,
        step: currentStep,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      
      showToast('✓ Progression sauvegardée', 'success');
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Mise à jour des données du studio
  const updateStudioData = (updates) => {
    const newData = { ...studioData, ...updates };
    setStudioData(newData);
    saveStudio(newData);
  };

  // Navigation entre étapes
  const goToStep = (step) => {
    setCurrentStep(step);
    updateStudioData({ step });
  };

  // Calcul de progression
  const calculateProgress = () => {
    let progress = 0;
    if (studioData.selectedFiles?.length > 0) progress += 33;
    if (studioData.extractedData) progress += 34;
    if (studioData.agreedToTerms) progress += 33;
    return progress;
  };

  if (loading) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement du studio...</p>
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
          <Link href="/marches" className="btn btn-primary">
            Retour aux marchés
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/marches/details?id=${marcheId}`} className="btn btn-outline btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Retour au marché
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
              <span className="badge badge-gold">Studio Premium</span>
              {saving && <span className="text-xs text-muted">Sauvegarde en cours...</span>}
            </div>
            <h1 className="heading-lg" style={{ marginBottom: '12px' }}>
              🪄 Studio de Candidature
            </h1>
            <p className="text-secondary text-sm" style={{ maxWidth: '600px' }}>
              {marche.title}
            </p>
          </div>
          
          <button onClick={() => saveStudio()} className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <ProgressBar 
        currentStep={currentStep} 
        progress={calculateProgress()} 
        onStepClick={goToStep}
      />

      {/* Contenu de l'étape active */}
      <div className="card" style={{ minHeight: '500px' }}>
        {currentStep === 1 && (
          <Step1Admin 
            marche={marche}
            studioData={studioData}
            updateStudioData={updateStudioData}
            goToStep={goToStep}
          />
        )}
        
        {currentStep === 2 && (
          <Step2Technical 
            marche={marche}
            studioData={studioData}
            updateStudioData={updateStudioData}
            goToStep={goToStep}
          />
        )}
        
        {currentStep === 3 && (
          <Step3Verification 
            marche={marche}
            userData={userData}
            studioData={studioData}
            updateStudioData={updateStudioData}
            goToStep={goToStep}
          />
        )}
      </div>

      {/* Toast notifications */}
      {toast && (
        <div style={{ 
          position: 'fixed', 
          bottom: '30px', 
          right: '30px', 
          background: toast.type === 'success' ? 'var(--green)' : toast.type === 'error' ? 'var(--danger)' : 'var(--primary)', 
          color: '#fff', 
          padding: '14px 24px', 
          borderRadius: '8px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)', 
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="container section" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Initialisation...</p>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}
