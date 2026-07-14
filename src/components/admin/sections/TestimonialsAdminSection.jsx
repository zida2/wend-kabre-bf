'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import layout from '../adminLayout.module.css';

export default function TestimonialsAdminSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTestimonials(data);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      await updateDoc(doc(db, 'testimonials', id), { status: newStatus });
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating testimonial:', error);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet avis définitivement ?')) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className={layout.sectionContainer}>
      <div className={layout.card}>
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <h3 className="heading-sm">Tous les Avis Clients</h3>
          <button onClick={fetchTestimonials} className="btn btn-sm btn-outline">
            🔄 Rafraîchir
          </button>
        </div>

        {loading ? (
          <p className="text-muted">Chargement...</p>
        ) : testimonials.length === 0 ? (
          <p className="text-muted text-sm">Aucun avis pour le moment.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={layout.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom / Rôle</th>
                  <th>Message</th>
                  <th>Note</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map(t => {
                  const dateStr = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
                  return (
                    <tr key={t.id}>
                      <td className="text-sm text-secondary">{dateStr}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div className="text-xs text-muted">{t.role || '-'}</div>
                      </td>
                      <td className="text-sm text-secondary" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                        {t.content}
                      </td>
                      <td className="text-center">
                        <span style={{ color: '#F59E0B' }}>
                          {t.rating} ★
                        </span>
                      </td>
                      <td>
                        {t.status === 'approved' ? (
                          <span className={layout.badgeSuccess}>Publié</span>
                        ) : (
                          <span className={layout.badgeWarning}>En attente</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApprove(t.id, t.status)} 
                            className="btn btn-sm"
                            style={{ background: t.status === 'approved' ? '#f3f4f6' : 'var(--primary)', color: t.status === 'approved' ? '#374151' : '#fff' }}
                          >
                            {t.status === 'approved' ? 'Masquer' : 'Approuver'}
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            className="btn btn-sm btn-outline text-danger"
                          >
                            X
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
