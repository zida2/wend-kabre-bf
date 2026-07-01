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

  const ADMIN_EMAIL = 'zidadesire20@gmail.com';

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password) {
      setError('Veuillez renseigner votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // L'accès admin est déterminé par le compte Firebase authentifié (email),
      // et vérifié à nouveau par les règles Firestore côté serveur.
      if (cred.user.email?.toLowerCase() === ADMIN_EMAIL) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

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
