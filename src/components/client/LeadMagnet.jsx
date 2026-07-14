'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadMagnet() {
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!sector) return;
    setLoading(true);
    // Simulate AI searching...
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleSubmitContact = (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    // Simulate saving lead and redirect to signup
    setTimeout(() => {
      // In a real app, you would save this lead to Firestore here
      // For now, redirect to signup with prefilled phone/sector if possible
      router.push(`/inscription`);
    }, 1000);
  };

  return (
    <div className="card-glass animate-fadeInUp delay-5" style={{ 
      maxWidth: '600px', 
      margin: '40px auto 0', 
      padding: '32px', 
      textAlign: 'center',
      border: '1px solid var(--gold)',
      boxShadow: '0 10px 30px rgba(217, 119, 6, 0.15)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🤖</div>
      <h3 className="heading-sm" style={{ marginBottom: '8px' }}>Testez l'IA gratuitement</h3>
      
      {step === 1 && (
        <>
          <p className="text-sm text-secondary" style={{ marginBottom: '24px' }}>
            Découvrez combien de marchés correspondent à votre activité en ce moment.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <input 
              type="text" 
              className="form-input flex-1" 
              placeholder="Votre secteur (ex: BTP, Informatique...)" 
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Recherche...' : 'Chercher'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <div className="animate-popIn">
          <p className="text-sm" style={{ marginBottom: '16px', color: 'var(--green)', fontWeight: 'bold' }}>
            ✅ Nous avons trouvé plusieurs marchés récents pour le secteur "{sector}".
          </p>
          <p className="text-sm text-secondary" style={{ marginBottom: '24px' }}>
            Entrez votre numéro WhatsApp pour recevoir un extrait gratuit de ces opportunités.
          </p>
          <form onSubmit={handleSubmitContact} className="flex gap-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <input 
              type="tel" 
              className="form-input flex-1" 
              placeholder="Numéro WhatsApp" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-gold" disabled={loading}>
              {loading ? 'Envoi...' : 'Recevoir 🚀'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
