'use client';
import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.toLowerCase().trim() === 'zidadesire20@gmail.com') {
      setShowAdminCode(true);
    } else {
      setShowAdminCode(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Connexion Admin secrète
    if (email.toLowerCase().trim() === 'zidadesire20@gmail.com' && adminCode === '3002') {
      localStorage.setItem('wendkabre_admin', '3002');
      window.location.href = '/admin';
      return;
    }

    if (email.toLowerCase().trim() === 'zidadesire20@gmail.com' && adminCode !== '' && adminCode !== '3002') {
      setError("Code Administrateur invalide.");
      return;
    }

    if (!password) {
      setError('Veuillez renseigner votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setError('Identifiants incorrects ou problème de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section flex justify-center items-center animate-fadeIn" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <h2 className="heading-md" style={{ marginBottom: '8px' }}>Ravi de vous revoir !</h2>
          <p className="text-secondary text-xs">Accédez à votre espace entreprise Wend-Kabré</p>
        </div>

        {error && (
          <div className="badge badge-red text-center w-full" style={{ marginBottom: '20px', padding: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="contact@entreprise.bf" 
              required
              value={email}
              onChange={handleEmailChange}
            />
          </div>

          {showAdminCode && (
            <div className="form-group animate-fadeIn" style={{ background: 'rgba(232, 184, 75, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--gold)' }}>
              <label className="form-label text-gold">Code Administrateur (Optionnel)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Entrez le code secret" 
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Mot de Passe</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loader"></span> : 'Se connecter 🔑'}
          </button>
        </form>

        <div className="divider"></div>

        <p className="text-center text-xs text-secondary">
          Vous n'avez pas de compte ? <Link href="/inscription" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Créer un compte</Link>
        </p>
      </div>
    </main>
  );
}
