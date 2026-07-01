'use client';
import { useState } from 'react';
import Link from 'next/link';
import { auth, db, analytics } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

export default function InscriptionPage() {
  const [name, setName] = useState('');
  const [rccm, setRccm] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create user account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Log sign_up event
      if (analytics) {
        logEvent(analytics, 'sign_up', { method: 'email' });
      }

      // 2. Save additional PME info in Firestore user profile
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name,
        rccm: rccm || '',
        phone,
        email,
        isSubscribed: email.includes('demo') ? true : false, // Auto-abonnement pour la démo
        createdAt: new Date().toISOString()
      });

      // Redirect to tenders list
      window.location.href = '/marches';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section flex justify-center items-center animate-fadeIn" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <h2 className="heading-md" style={{ marginBottom: '8px' }}>Enregistrer mon Entreprise</h2>
          <p className="text-secondary text-xs">Rejoignez la plateforme numérique souveraine du Burkina Faso</p>
        </div>

        {error && (
          <div className="badge badge-red text-center w-full" style={{ marginBottom: '20px', padding: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Nom de l'Entreprise / PME</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: FASO DIGITAL SARL" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Numéro RCCM (facultatif)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: BF-OUA-2026-B-0000" 
              value={rccm}
              onChange={(e) => setRccm(e.target.value)}
            />
          </div>

          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Téléphone WhatsApp</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+226 70 00 00 00" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="contact@entreprise.bf" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de Passe (min. 6 caractères)</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="divider" style={{ margin: '10px 0' }}></div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loader"></span> : 'Enregistrer ma PME 🚀'}
          </button>
          
          <div className="text-center" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p className="text-xs text-secondary">✅ Inscription 100% gratuite, sans carte bancaire.</p>
            <p className="text-xs text-secondary" style={{ opacity: 0.8 }}>🔒 Vos données sont sécurisées et strictement confidentielles.</p>
          </div>
        </form>

        <div className="divider"></div>

        <p className="text-center text-xs text-secondary">
          Vous avez déjà un compte ? <Link href="/connexion" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
