'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';

const DISMISS_KEY = 'wk_emailverif_dismissed';

export default function EmailVerificationBanner() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | checking
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const dismissed = typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1';
      setShow(!!user && user.emailVerified === false && !dismissed);
    });
    return () => unsub();
  }, []);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setStatus('sending');
    setMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setStatus('sent');
      setMessage('Email de vérification envoyé. Pensez à regarder vos spams.');
    } catch (e) {
      setStatus('error');
      setMessage(
        e?.code === 'auth/too-many-requests'
          ? 'Trop de tentatives. Réessayez dans quelques minutes.'
          : 'Envoi impossible pour le moment. Réessayez plus tard.'
      );
    }
  };

  const handleCheck = async () => {
    if (!auth.currentUser) return;
    setStatus('checking');
    setMessage('');
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setMessage('');
        setShow(false);
      } else {
        setStatus('idle');
        setMessage('Pas encore vérifié. Cliquez le lien reçu par email, puis réessayez.');
      }
    } catch (e) {
      setStatus('idle');
      setMessage('Vérification impossible pour le moment.');
    }
  };

  const handleDismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="status"
      style={{
        background: 'var(--accent-muted)',
        borderBottom: '1px solid rgba(217,119,6,0.28)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 16px',
          fontSize: '0.88rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span aria-hidden="true">📧</span>
          {message ? (
            <span style={{ color: status === 'error' ? 'var(--danger)' : 'var(--text-secondary)' }}>{message}</span>
          ) : (
            <span>Vérifiez votre adresse email pour sécuriser votre compte.</span>
          )}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleResend}
            disabled={status === 'sending'}
            className="btn btn-accent btn-sm"
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            {status === 'sending' ? 'Envoi…' : status === 'sent' ? 'Renvoyer' : 'Envoyer l\'email'}
          </button>
          <button
            onClick={handleCheck}
            disabled={status === 'checking'}
            className="btn btn-outline btn-sm"
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            {status === 'checking' ? 'Vérification…' : 'J\'ai vérifié'}
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}
