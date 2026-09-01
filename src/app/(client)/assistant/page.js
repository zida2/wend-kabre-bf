'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from './assistant.module.css';

export default function AssistantPage() {
  // Suivi de l'état d'authentification
  const [authUser, setAuthUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // État du chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthUser(currentUser);
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          if (snap.exists()) {
            setUserData(snap.data());
          }
        } catch (e) { console.error(e); }
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const isSubscribed = userData?.isSubscribed;
    console.log('👤 User data:', userData);
    console.log('💎 isSubscribed:', isSubscribed);
    
    if (!isSubscribed) {
      console.warn('❌ Accès refusé : utilisateur non abonné');
      setShowPremiumModal(true);
      return;
    }
    
    console.log('✅ Utilisateur Premium - Envoi du message');
    
    // Ajouter le message utilisateur
    const userMessage = { role: 'user', content: input, id: Date.now().toString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.content) {
        // Ajouter la réponse de l'assistant
        const assistantMessage = { role: 'assistant', content: data.content, id: (Date.now() + 1).toString() };
        setMessages([...newMessages, assistantMessage]);
      } else {
        // Messages d'erreur personnalisés
        let errorMsg = data.error || 'Une erreur est survenue';
        
        // Si c'est un message de chargement du modèle, l'afficher tel quel
        if (errorMsg.includes('réveiller') || errorMsg.includes('chargement')) {
          const loadingMessage = { role: 'assistant', content: errorMsg, id: (Date.now() + 1).toString() };
          setMessages([...newMessages, loadingMessage]);
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Erreur appel API:', err);
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll vers le bas quand un nouveau message arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className={styles.container}>
        
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Assistant IA <span className={styles.highlight}>Wend-Kabré</span>
          </h1>
          <p className={styles.subtitle}>
            Votre expert dédié en marchés publics au Burkina Faso. Posez-moi vos questions sur la rédaction de vos offres techniques ou administratives.
          </p>
        </div>

        {/* Accès réservé aux membres connectés */}
        {authReady && !authUser ? (
          <div className={styles.chatContainer} style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px' }}>
            <div className={styles.botIcon}>🔒</div>
            <h3 className={styles.emptyTitle}>Connexion requise</h3>
            <p className={styles.emptyDesc} style={{ marginBottom: '24px' }}>
              L'Assistant IA est réservé aux membres. Connectez-vous pour discuter avec votre expert en marchés publics.
            </p>
            <Link href="/connexion" className="btn btn-primary">
              Se connecter →
            </Link>
          </div>
        ) : (
        /* Fenêtre de Chat */
        <div className={styles.chatContainer}>

          {/* Zone des Messages */}
          <div className={styles.messagesArea}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.botIcon}>🤖</div>
                <h3 className={styles.emptyTitle}>Comment puis-je vous aider aujourd'hui ?</h3>
                <p className={styles.emptyDesc}>
                  Posez des questions comme : <br/>
                  <i>"Quels documents fournir pour un marché de 50 millions ?"</i> ou <br/>
                  <i>"Comment structurer la partie méthodologie ?"</i>
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '16px', opacity: 0.7 }}>
                  💡 Première utilisation : le modèle peut prendre ~20 secondes à se réveiller
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userMessage : styles.botMessage}`}>
                  <div className={`${styles.messageBubble} ${m.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                    {/* Affichage du texte en conservant les sauts de ligne */}
                    {m.content.split('\n').map((line, i) => (
                      <p key={i} className={styles.messageParagraph}>
                        {/* Mise en gras rudimentaire pour les textes entre étoiles */}
                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className={styles.loadingWrapper}>
                <div className={styles.loadingBubble}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            )}

            {/* État d'erreur */}
            {error && !isLoading && (
              <div role="alert" style={{ alignSelf: 'center', textAlign: 'center', background: 'var(--danger-muted)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.88rem' }}>
                ⚠️ Une erreur est survenue. Vérifiez votre connexion et réessayez.<br/>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '8px', display: 'block', wordBreak: 'break-word' }}>Détail technique : {error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className={styles.inputArea}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                className={styles.input}
                value={input}
                placeholder="Posez votre question à l'expert..."
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Envoyer le message"
                className={styles.sendButton}
              >
                <svg className={styles.sendIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
        )}

      </div>

      {/* Modal Premium */}
      {showPremiumModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card text-center animate-fadeIn" style={{ maxWidth: '420px', margin: '20px', padding: '40px 32px', background: 'var(--color-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🤖⭐</div>
            <h3 className="heading-md" style={{ marginBottom: '12px' }}>Fonctionnalité Premium</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '28px', lineHeight: 1.6 }}>
              L'Assistant IA est votre expert dédié, capable de vous aider à rédiger vos offres techniques et administratives à la vitesse de la lumière. Il est réservé aux abonnés <strong>Premium</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/tarifs" className="btn btn-primary w-full">
                Découvrir les offres Premium
              </Link>
              <button 
                type="button" 
                onClick={() => setShowPremiumModal(false)} 
                className="btn btn-outline w-full"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
