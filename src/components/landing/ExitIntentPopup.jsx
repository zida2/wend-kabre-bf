'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './ExitIntentPopup.module.css';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Track popup shown event
  const trackPopupShown = () => {
    if (window.gtag) {
      window.gtag('event', 'exit_intent_popup_shown');
    }
  };

  // Track email captured
  const trackEmailCaptured = (domain = '') => {
    if (window.gtag) {
      window.gtag('event', 'exit_intent_popup_email_captured', {
        email_domain: domain
      });
    }
  };

  // Track popup closed
  const trackPopupClosed = () => {
    if (window.gtag) {
      window.gtag('event', 'exit_intent_popup_closed');
    }
  };

  useEffect(() => {
    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem('exit_intent_shown');
    if (popupShown) return;

    // Detect exit intent (mouseout from top)
    const handleMouseLeave = (e) => {
      // Only trigger if user is moving toward top (leaving)
      if (e.clientY <= 0) {
        setIsVisible(true);
        trackPopupShown();
        sessionStorage.setItem('exit_intent_shown', 'true');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    trackPopupClosed();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Veuillez entrer votre email');
      setMessageType('error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Email invalide');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const emailDomain = email.split('@')[1];
      
      // Save to Firestore
      await addDoc(collection(db, 'leads'), {
        email: email.toLowerCase(),
        source: 'exit_intent_popup',
        captured_at: serverTimestamp(),
        segment: 'high', // Exit intent is high intent
        last_email_sent: null,
        email_opens: 0,
        email_clicks: 0,
        status: 'active'
      });

      trackEmailCaptured(emailDomain);
      
      setMessage('✅ Vérifiez votre email! Lien de téléchargement envoyé.');
      setMessageType('success');
      setEmail('');
      
      // Close popup after 3 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);

    } catch (error) {
      console.error('Error capturing email:', error);
      setMessage('Erreur. Veuillez réessayer.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <div className={styles.content}>
          <h2 className={styles.headline}>
            🎁 7 Jours Premium Gratuits
          </h2>
          
          <p className={styles.description}>
            Débloquez l'accès complet + guide des 50 meilleurs marchés du mois
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Votre email professionnel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Envoi...' : 'Débloquer l\'accès'}
            </button>
          </form>

          {message && (
            <p className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </p>
          )}

          <p className={styles.guarantee}>
            ✅ Pas de spam, désinscription en 1 clic
          </p>
        </div>
      </div>
    </div>
  );
}
