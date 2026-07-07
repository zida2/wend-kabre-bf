'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const ADMIN_EMAIL = 'zidadesire20@gmail.com';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.email?.toLowerCase() === ADMIN_EMAIL) {
        window.location.href = '/admin';
      } else {
        setError('Ce compte n\'a pas les droits d\'administration.');
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
    } catch (err) {
      console.error(err);
      setError('Identifiants incorrects ou problème de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #0f0f14 100%)',
      padding: '20px',
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-150px', left: '-150px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="animate-fadeIn" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 15, 20, 0.9)',
        border: '1px solid rgba(5, 150, 105, 0.2)',
        borderRadius: '16px',
        padding: '48px 36px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(5, 150, 105, 0.05)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 12px rgba(5, 150, 105, 0.4))',
          }}>
            👑
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '8px',
          }}>
            Panel Administrateur
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.4)',
          }}>
            Wend-Kabré • Accès Restreint
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fadeIn" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Email Administrateur
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@wendkabre.bf"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '14px 16px',
                borderRadius: '8px',
                width: '100%',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '14px 16px',
                borderRadius: '8px',
                width: '100%',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
              marginTop: '8px',
              letterSpacing: '0.5px',
            }}
          >
            {loading ? 'Vérification...' : 'Accéder au Panel 🔐'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.2)',
          marginTop: '32px',
        }}>
          Accès strictement réservé aux administrateurs autorisés.
        </p>
      </div>
    </div>
  );
}
