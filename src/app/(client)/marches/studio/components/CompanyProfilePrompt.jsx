'use client';
import Link from 'next/link';

export default function CompanyProfilePrompt() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(5, 150, 105, 0.05))',
      border: '1px solid rgba(5, 150, 105, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    }}>
      <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>💡</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: 700, 
          color: 'var(--primary-dark)',
          marginBottom: '6px'
        }}>
          Complétez votre profil d'entreprise
        </h4>
        <p className="text-sm text-secondary" style={{ marginBottom: '12px', lineHeight: 1.5 }}>
          Plus vos informations d'entreprise sont complètes et précises, plus l'IA générera une offre technique adaptée et convaincante. Incluez vos certifications, références, équipements et compétences.
        </p>
        <Link 
          href="/profil-entreprise"
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          🏢 Aller au profil d'entreprise
        </Link>
      </div>
    </div>
  );
}
