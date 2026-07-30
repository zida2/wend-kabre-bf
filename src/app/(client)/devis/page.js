'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUserDevis, deleteDevis } from '@/lib/devisService';
import { Plus, FileText, Trash2, Edit, Printer, FileDown, CheckCircle, Clock } from 'lucide-react';

export default function DevisDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/connexion');
        return;
      }
      setUser(currentUser);
      try {
        const list = await getUserDevis(currentUser.uid);
        setDevisList(list);
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleDelete = async (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce devis ?')) {
      try {
        await deleteDevis(id);
        setDevisList(devisList.filter(d => d.id !== id));
      } catch(e) {
        console.error(e);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'brouillon': return <span className="badge badge-gray"><Clock size={14} /> Brouillon</span>;
      case 'envoyé': return <span className="badge badge-blue"><FileText size={14} /> Envoyé</span>;
      case 'accepté': return <span className="badge badge-green"><CheckCircle size={14} /> Accepté</span>;
      default: return <span className="badge badge-gray">Brouillon</span>;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="heading-lg">Gestion des Devis</h1>
          <p className="text-secondary mt-2">Créez et suivez vos devis et factures proforma.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/modeles-arcop" className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <FileDown size={18} /> Modèles ARCOP
          </Link>
          <Link href="/devis/nouveau" className="btn btn-primary">
            <Plus size={18} /> Créer un devis
          </Link>
        </div>
      </div>

      <div className="card">
        {devisList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
            <FileText size={48} color="var(--color-border-hover)" style={{ margin: '0 auto 16px' }} />
            <h3 className="heading-md" style={{ marginBottom: '8px' }}>Aucun devis trouvé</h3>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>Vous n'avez pas encore créé de devis.</p>
            <Link href="/devis/nouveau" className="btn btn-primary">
              Créer mon premier devis
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '16px', fontWeight: 600 }}>N° Devis</th>
                  <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '16px', fontWeight: 600 }}>Client</th>
                  <th style={{ padding: '16px', fontWeight: 600 }}>Montant TTC</th>
                  <th style={{ padding: '16px', fontWeight: 600 }}>Statut</th>
                  <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devisList.map(devis => (
                  <tr key={devis.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="hover:bg-green-50">
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{devis.meta?.number || '—'}</td>
                    <td style={{ padding: '16px' }}>{new Date(devis.meta?.date).toLocaleDateString('fr-FR') || '—'}</td>
                    <td style={{ padding: '16px' }}>{devis.client?.name || '—'}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>
                      {devis.totalTtc ? devis.totalTtc.toLocaleString('fr-FR') + ' FCFA' : '—'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(devis.status || 'brouillon')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <Link href={`/devis/nouveau?id=${devis.id}`} className="btn btn-outline btn-sm" title="Éditer">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(devis.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-muted)' }} title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
