'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

export default function CouponsSection() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulaire de création
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Erreur chargement coupons:', err);
      setError(
        "Impossible de charger les coupons. Vérifiez que les règles Firestore de la collection « coupons » sont bien déployées."
      );
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    const cleanCode = code.trim().toUpperCase();
    const percent = parseInt(discountPercent, 10);

    if (!cleanCode) {
      setError('Veuillez saisir un code promo.');
      return;
    }
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      setError('La réduction doit être un nombre entre 1 et 100.');
      return;
    }
    if (coupons.some((c) => (c.code || '').toUpperCase() === cleanCode)) {
      setError(`Le code « ${cleanCode} » existe déjà.`);
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code: cleanCode,
        discountPercent: percent,
        active: true,
        uses: 0,
        createdAt: new Date().toISOString(),
      });
      setCode('');
      setDiscountPercent('');
      await loadCoupons();
    } catch (err) {
      console.error('Erreur création coupon:', err);
      setError(
        "La création du coupon a échoué. Les règles Firestore autorisent-elles l'écriture dans « coupons » ?"
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (coupon) => {
    setError('');
    setBusyId(coupon.id);
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active });
      await loadCoupons();
    } catch (err) {
      console.error('Erreur mise à jour coupon:', err);
      setError("La mise à jour du statut du coupon a échoué.");
    } finally {
      setBusyId(null);
    }
  };

  const removeCoupon = async (coupon) => {
    setError('');
    setBusyId(coupon.id);
    try {
      await deleteDoc(doc(db, 'coupons', coupon.id));
      await loadCoupons();
    } catch (err) {
      console.error('Erreur suppression coupon:', err);
      setError('La suppression du coupon a échoué.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Formulaire de création */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="heading-md" style={{ marginBottom: '6px' }}>🎟️ Coupons promotionnels</h3>
        <p className="text-secondary text-sm" style={{ marginBottom: '20px' }}>
          Créez des codes de réduction que vos clients pourront appliquer au moment du paiement.
        </p>

        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}
        >
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label" htmlFor="coupon-code">Code promo</label>
            <input
              id="coupon-code"
              type="text"
              className="form-input"
              placeholder="EX : BIENVENUE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={32}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group" style={{ flex: '0 1 160px', marginBottom: 0 }}>
            <label className="form-label" htmlFor="coupon-discount">Réduction (%)</label>
            <input
              id="coupon-discount"
              type="number"
              className="form-input"
              placeholder="1 à 100"
              min={1}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating}
            style={{ justifyContent: 'center', minWidth: '140px' }}
          >
            {creating ? 'Création…' : '＋ Créer'}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-muted)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Liste des coupons */}
      <div className="card">
        {loading ? (
          <div className="text-center" style={{ padding: '40px 0' }}>
            <span className="loader" style={{ width: '36px', height: '36px', margin: '0 auto 16px' }}></span>
            <p className="text-sm text-muted">Chargement des coupons…</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center" style={{ padding: '48px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎟️</div>
            <h4 className="text-primary" style={{ fontWeight: 600, marginBottom: '6px' }}>Aucun coupon</h4>
            <p className="text-secondary text-sm">
              Créez votre premier code promo à l'aide du formulaire ci-dessus.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Réduction</th>
                  <th style={thStyle}>Statut</th>
                  <th style={thStyle}>Utilisations</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span className="badge badge-gold">-{c.discountPercent}%</span>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge ${c.active ? 'badge-green' : 'badge-gray'}`}>
                        {c.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span className="text-sm">
                        {c.uses ?? 0}
                        {typeof c.maxUses === 'number' ? ` / ${c.maxUses}` : ''}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => toggleActive(c)}
                          className="btn btn-outline btn-sm"
                          disabled={busyId === c.id}
                          style={{ padding: '5px 11px', fontSize: '0.75rem' }}
                        >
                          {c.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => removeCoupon(c)}
                          className="btn btn-sm"
                          disabled={busyId === c.id}
                          style={{
                            padding: '5px 11px',
                            fontSize: '0.75rem',
                            background: 'var(--danger-muted)',
                            border: '1px solid rgba(220,38,38,0.3)',
                            color: 'var(--danger)',
                          }}
                        >
                          Supprimer
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

const thStyle = {
  textAlign: 'left',
  padding: '12px 14px',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-muted)',
};

const tdStyle = {
  padding: '14px',
  fontSize: '0.9rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle',
};
