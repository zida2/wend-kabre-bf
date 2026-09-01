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
  
  // Questions suggérées
  const suggestedQuestions = [
    "📋 Quels documents fournir pour un marché de 50 millions ?",
    "💰 Quels sont les seuils des marchés publics ?",
    "📝 Comment structurer une offre technique ?",
    "🇧🇫 Comment fonctionne la préférence nationale PME ?",
  ];

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
  
  const handleSuggestedQuestion = (question) => {
    // Retirer l'emoji du début
    const cleanQuestion = question.replace(/^[^\s]+\s/, '');
    setInput(cleanQuestion);
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
    <main className={styles.pageWrapper}>
      <div className={styles.container}>
        
        {/* Header avec avatar bot */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.botAvatar}>
              <div className={styles.botAvatarIcon}>🤖</div>
              <div className={styles.botAvatarPulse}></div>
            </div>
            <div>
              <h1 className={styles.title}>
                Assistant IA <span className={styles.highlight}>Wend-Kabré</span>
              </h1>
              <p className={styles.subtitle}>
                Expert en marchés publics ARCOP • Disponible 24/7
              </p>
            </div>
          </div>
          <div className={styles.headerBadge}>
            <span className={styles.statusDot}></span>
            En ligne
          </div>
        </div>

        {/* Accès réservé aux membres connectés */}
        {authReady && !authUser ? (
          <div className={styles.chatContainer}>
            <div className={styles.lockedState}>
              <div className={styles.lockedIcon}>🔒</div>
              <h3 className={styles.lockedTitle}>Connexion requise</h3>
              <p className={styles.lockedDesc}>
                L'Assistant IA est réservé aux membres. Connectez-vous pour discuter avec votre expert en marchés publics.
              </p>
              <Link href="/connexion" className={styles.connectButton}>
                <span>Se connecter</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        ) : (
        /* Fenêtre de Chat */
        <div className={styles.chatContainer}>

          {/* Zone des Messages */}
          <div className={styles.messagesArea}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.welcomeCard}>
                  <div className={styles.welcomeIcon}>👋</div>
                  <h3 className={styles.welcomeTitle}>Bienvenue !</h3>
                  <p className={styles.welcomeDesc}>
                    Je suis votre assistant expert en marchés publics burkinabè. Je peux vous aider avec :
                  </p>
                  <ul className={styles.featuresList}>
                    <li>📋 Les documents et pièces obligatoires</li>
                    <li>💰 Les seuils et procédures de passation</li>
                    <li>📝 La rédaction d'offres techniques et administratives</li>
                    <li>🇧🇫 Les préférences nationales et avantages PME</li>
                  </ul>
                </div>
                
                <div className={styles.suggestionsSection}>
                  <p className={styles.suggestionsTitle}>Questions fréquentes :</p>
                  <div className={styles.suggestionsGrid}>
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestedQuestion(q)}
                        className={styles.suggestionButton}
                        type="button"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                
                <p className={styles.tipText}>
                  💡 <strong>Astuce :</strong> Le modèle peut prendre ~20 secondes à répondre lors de la première utilisation
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userMessage : styles.botMessage}`}>
                  {m.role === 'assistant' && (
                    <div className={styles.messageAvatar}>
                      <div className={styles.messageAvatarIcon}>🤖</div>
                    </div>
                  )}
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
                  {m.role === 'user' && (
                    <div className={styles.messageAvatar}>
                      <div className={styles.messageAvatarIcon}>👤</div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className={`${styles.messageWrapper} ${styles.botMessage}`}>
                <div className={styles.messageAvatar}>
                  <div className={styles.messageAvatarIcon}>🤖</div>
                </div>
                <div className={styles.loadingBubble}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <span className={styles.loadingText}>En train d'écrire...</span>
                </div>
              </div>
            )}

            {/* État d'erreur */}
            {error && !isLoading && (
              <div className={styles.errorMessage}>
                <div className={styles.errorIcon}>⚠️</div>
                <div className={styles.errorContent}>
                  <p className={styles.errorTitle}>Une erreur est survenue</p>
                  <p className={styles.errorDesc}>Vérifiez votre connexion et réessayez.</p>
                  <p className={styles.errorDetail}>{error}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className={styles.inputArea}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  value={input}
                  placeholder="Posez votre question à l'expert ARCOP..."
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label="Envoyer le message"
                  className={styles.sendButton}
                >
                  {isLoading ? (
                    <div className={styles.sendButtonLoader}></div>
                  ) : (
                    <svg className={styles.sendIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className={styles.inputHint}>
                💬 Basé sur le Guide de Soumission ARCOP 2024-2025
              </p>
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
