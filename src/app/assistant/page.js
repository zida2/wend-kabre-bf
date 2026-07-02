'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import styles from './assistant.module.css';

export default function AssistantPage() {
  const chat = useChat();
  const messages = chat.messages || [];
  const status = chat.status || (chat.isLoading ? 'streaming' : 'ready');
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const sendFn = chat.sendMessage || chat.append;
    if (sendFn) {
      sendFn({ role: 'user', content: input });
    } else {
      console.error("No sendMessage or append function found in useChat", chat);
    }
    setInput('');
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

        {/* Fenêtre de Chat */}
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
                className={styles.sendButton}
              >
                <svg className={styles.sendIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
