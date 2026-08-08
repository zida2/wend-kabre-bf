'use client';
import { useState } from 'react';
import { track } from '@/lib/track';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    plan: 'ENTERPRISE',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Track l'événement
      track('contact_form_submit', { plan: formData.plan });

      // Simuler l'envoi (à remplacer par vraie API d'envoi email)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Intégrer avec un service d'email (SendGrid, Resend, etc.)
      console.log('Formulaire de contact:', formData);

      setSuccess(true);
      track('contact_form_success', { plan: formData.plan });

      // Réinitialiser le formulaire après 3s
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          plan: 'ENTERPRISE',
          message: ''
        });
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur envoi formulaire:', err);
      setError('Une erreur est survenue. Veuillez réessayer ou nous contacter directement.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className="animate-fadeIn">
      {/* Hero */}
      <section className="section" style={{ background: 'var(--grad-hero)', textAlign: 'center' }}>
        <div className="container">
          <span className="badge badge-gold animate-pulse-green" style={{ marginBottom: '20px' }}>
            🏢 Plan Entreprise
          </span>
          <h1 className="heading-xl" style={{ marginBottom: '20px' }}>
            Discutons de votre projet<br />
            <span className="text-green">ensemble</span>
          </h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto 40px', fontSize: '1.1rem' }}>
            Notre équipe commerciale vous contactera sous 24h pour comprendre vos besoins et vous proposer une solution sur-mesure.
          </p>
        </div>
      </section>

      {/* Formulaire de contact */}
      <section className="section" style={{ marginTop: '-40px' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card" style={{ padding: '48px' }}>
            {success ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✓</div>
                <h2 className="heading-lg text-green" style={{ marginBottom: '16px' }}>
                  Message envoyé avec succès !
                </h2>
                <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
                  Notre équipe vous contactera sous 24h ouvrées.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                  <h2 className="heading-lg" style={{ marginBottom: '12px' }}>
                    Contactez notre équipe commerciale
                  </h2>
                  <p className="text-secondary">
                    Remplissez ce formulaire et nous vous recontacterons rapidement
                  </p>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Nom */}
                  <div>
                    <label htmlFor="name" style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Jean Ouédraogo"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '2px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--primary)';
                        e.target.style.background = 'var(--color-bg-1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.background = 'var(--color-surface-2)';
                      }}
                    />
                  </div>

                  {/* Email et Téléphone */}
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <label htmlFor="email" style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        Email professionnel *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="jean@entreprise.bf"
                        className="form-input"
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: '2px solid var(--color-border)',
                          background: 'var(--color-surface-2)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--primary)';
                          e.target.style.background = 'var(--color-bg-1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                          e.target.style.background = 'var(--color-surface-2)';
                        }}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+226 70 00 00 00"
                        className="form-input"
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: '2px solid var(--color-border)',
                          background: 'var(--color-surface-2)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--primary)';
                          e.target.style.background = 'var(--color-bg-1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                          e.target.style.background = 'var(--color-surface-2)';
                        }}
                      />
                    </div>
                  </div>

                  {/* Entreprise */}
                  <div>
                    <label htmlFor="company" style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      Nom de l'entreprise *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Mon Entreprise SARL"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '2px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--primary)';
                        e.target.style.background = 'var(--color-bg-1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.background = 'var(--color-surface-2)';
                      }}
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <label htmlFor="plan" style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      Plan souhaité
                    </label>
                    <select
                      id="plan"
                      name="plan"
                      value={formData.plan}
                      onChange={handleChange}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '2px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--primary)';
                        e.target.style.background = 'var(--color-bg-1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.background = 'var(--color-surface-2)';
                      }}
                    >
                      <option value="PREMIUM">Plan Premium (15,000 FCFA/mois)</option>
                      <option value="ENTERPRISE">Plan Entreprise (55,000 FCFA/mois)</option>
                      <option value="CUSTOM">Solution personnalisée</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      Votre message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Décrivez-nous votre projet, vos besoins spécifiques, le nombre de collaborateurs..."
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '2px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--primary)';
                        e.target.style.background = 'var(--color-bg-1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.background = 'var(--color-surface-2)';
                      }}
                    />
                  </div>

                  {/* Bouton submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      background: loading ? 'var(--color-bg-3)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      marginTop: '12px'
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ 
                          width: '20px', 
                          height: '20px',
                          border: '3px solid rgba(255,255,255,0.2)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }}></div>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Envoyer ma demande</span>
                        <span style={{ fontSize: '20px' }}>→</span>
                      </>
                    )}
                  </button>

                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center',
                    marginTop: '8px'
                  }}>
                    En envoyant ce formulaire, vous acceptez d'être contacté par notre équipe.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Informations de contact alternatives */}
          <div className="contact-grid" style={{ 
            marginTop: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div className="card-glass" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📧</div>
              <h3 className="text-primary" style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>
                Email
              </h3>
              <a href="mailto:contact@wend-kabre.com" style={{ color: 'var(--primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
                contact@wend-kabre.com
              </a>
            </div>

            <div className="card-glass" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📱</div>
              <h3 className="text-primary" style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>
                WhatsApp
              </h3>
              <a href="https://wa.me/22670000000" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
                +226 70 00 00 00
              </a>
            </div>

            <div className="card-glass" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏰</div>
              <h3 className="text-primary" style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>
                Horaires
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                Lun-Ven 8h-18h
              </p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .form-input::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }
        
        @media (max-width: 768px) {
          .card {
            padding: 32px 24px !important;
          }
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
