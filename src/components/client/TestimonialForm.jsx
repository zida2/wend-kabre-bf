'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function TestimonialForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    rating: 5,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.content) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        ...formData,
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setFormData({ name: '', role: '', content: '', rating: 5 });
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la soumission de l'avis:", error);
      alert('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="text-center" style={{ marginTop: '32px' }}>
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-outline hover-lift"
        >
          ✏️ Laisser un avis
        </button>
      </div>
    );
  }

  return (
    <div className="text-center" style={{ marginTop: '32px', maxWidth: '500px', margin: '32px auto 0' }}>
      <div className="card-glass" style={{ padding: '24px', textAlign: 'left' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <h3 className="heading-sm">Votre expérience compte</h3>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {success ? (
          <div style={{ background: 'var(--success-muted)', color: 'var(--primary-dark)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            Merci ! Votre avis a été soumis et sera publié après validation.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-bold" style={{ display: 'block', marginBottom: '6px' }}>Votre Nom / Entreprise *</label>
              <input 
                type="text" 
                required 
                className="input" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Ousmane S. (BTP)"
              />
            </div>
            
            <div>
              <label className="text-sm font-bold" style={{ display: 'block', marginBottom: '6px' }}>Votre Rôle / Secteur</label>
              <input 
                type="text" 
                className="input" 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                placeholder="Ex: Gérant PME"
              />
            </div>

            <div>
              <label className="text-sm font-bold" style={{ display: 'block', marginBottom: '6px' }}>Note (sur 5)</label>
              <select 
                className="input" 
                value={formData.rating}
                onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (Excellent)</option>
                <option value={4}>⭐⭐⭐⭐ (Très bien)</option>
                <option value={3}>⭐⭐⭐ (Bien)</option>
                <option value={2}>⭐⭐ (Passable)</option>
                <option value={1}>⭐ (Médiocre)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold" style={{ display: 'block', marginBottom: '6px' }}>Votre Message *</label>
              <textarea 
                required 
                className="input" 
                rows={4}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Partagez votre expérience avec Wend-Kabré..."
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Envoi...' : 'Soumettre mon avis'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
