'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FileText, Download, CheckCircle, FileSignature, BookOpen, AlertTriangle } from 'lucide-react';

export default function ModelesArcopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/connexion');
        return;
      }
      setUser(currentUser);
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserData(snap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const printDocument = (type) => {
    // In a real application, you would render a specific hidden printable component 
    // based on the 'type' or open a new window with a printable route.
    // For this MVP, we use alert to simulate the PDF generation.
    alert(`La génération de la "${type}" en PDF est en cours de développement. Bientôt disponible !`);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
      </div>
    );
  }

  const isProfileComplete = userData?.name && userData?.rccm && userData?.ifu;

  return (
    <div className="container section animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="heading-lg">Modèles ARCOP</h1>
          <p className="text-secondary mt-2">Générez vos documents administratifs conformes aux standards de la commande publique (Burkina Faso).</p>
        </div>
        <Link href="/devis" className="btn btn-outline">
          Retour aux Devis
        </Link>
      </div>

      {!isProfileComplete && (
        <div style={{ background: 'var(--danger-muted)', borderLeft: '4px solid var(--danger)', padding: '16px 24px', borderRadius: 'var(--radius-sm)', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: '4px' }}>Profil incomplet</h4>
            <p className="text-sm text-secondary">
              Pour générer automatiquement ces documents avec vos informations, veuillez compléter votre profil (Nom, RCCM, IFU) depuis le tableau de bord.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-3 gap-6">
        
        {/* Lettre de soumission */}
        <div className="card hover-lift" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--success-muted)', borderRadius: '12px', color: 'var(--primary)' }}>
              <FileSignature size={28} />
            </div>
            <h3 className="heading-sm">Lettre de Soumission</h3>
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: '24px', flexGrow: 1 }}>
            Modèle type obligatoire pour présenter votre offre formelle à l'autorité contractante. (Format ARCOP)
          </p>
          <button 
            onClick={() => printDocument('Lettre de Soumission')}
            className="btn btn-outline w-full"
            disabled={!isProfileComplete}
          >
            <Download size={16} /> Générer (PDF)
          </button>
        </div>

        {/* Déclaration de probité */}
        <div className="card hover-lift" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--accent-muted)', borderRadius: '12px', color: 'var(--accent)' }}>
              <BookOpen size={28} />
            </div>
            <h3 className="heading-sm">Déclaration de Probité</h3>
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: '24px', flexGrow: 1 }}>
            Déclaration sur l'honneur d'engagement à respecter les règles d'éthique et de transparence.
          </p>
          <button 
            onClick={() => printDocument('Déclaration de Probité')}
            className="btn btn-outline w-full"
            disabled={!isProfileComplete}
          >
            <Download size={16} /> Générer (PDF)
          </button>
        </div>

        {/* DQE */}
        <div className="card hover-lift" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--forest-muted)', borderRadius: '12px', color: 'var(--forest)' }}>
              <FileText size={28} />
            </div>
            <h3 className="heading-sm">DQE / BPU</h3>
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: '24px', flexGrow: 1 }}>
            Devis Quantitatif et Estimatif (DQE) et Bordereau des Prix Unitaires. Utilisez le générateur de Devis pour le créer.
          </p>
          <Link href="/devis/nouveau" className="btn btn-primary w-full text-center">
            Créer avec le Générateur
          </Link>
        </div>

      </div>

      <div style={{ marginTop: '48px', padding: '24px', background: 'var(--color-surface-2)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <h3 className="heading-sm flex items-center gap-2" style={{ marginBottom: '16px' }}>
          <CheckCircle size={20} color="var(--primary)" /> 
          À propos des modèles ARCOP
        </h3>
        <p className="text-secondary text-sm" style={{ lineHeight: 1.6, marginBottom: '20px' }}>
          L'Autorité de Régulation de la Commande Publique (ARCOP) exige que les dossiers de candidature respectent des formats stricts. 
          En utilisant ces générateurs, nous pré-remplissons les informations de votre entreprise (Nom, RCCM, IFU, Adresse) directement dans les canevas officiels.
          Cela réduit drastiquement les risques de rejet de votre offre pour "non-conformité administrative".
        </p>
        <Link href="/guide-soumission" className="btn btn-primary">
          📖 Voir le Guide complet de Dépôt ARCOP
        </Link>
      </div>

    </div>
  );
}
