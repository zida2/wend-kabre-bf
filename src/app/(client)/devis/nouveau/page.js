'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createDevis, getDevisById, updateDevis } from '@/lib/devisService';
import styles from '../devis.module.css';
import { Save, Printer, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';

function DevisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  const [status, setStatus] = useState('brouillon'); // brouillon, envoyé, accepté

  const [company, setCompany] = useState({
    name: '', address: '', phone: '', email: '', rccm: '', ifu: '', regime: 'RSI'
  });

  const [client, setClient] = useState({
    name: 'Nom du Maître d\'ouvrage / Client', address: 'Adresse', contact: ''
  });

  const [meta, setMeta] = useState({
    number: `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    validity: '30 jours'
  });

  const [items, setItems] = useState([
    { id: 1, desc: 'Prestation de service', qty: 1, price: 150000 }
  ]);

  const [applyTva, setApplyTva] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          if (editId) {
            // Load existing devis
            const existing = await getDevisById(editId);
            if (existing && existing.userId === currentUser.uid) {
              setCompany(existing.company || company);
              setClient(existing.client || client);
              setMeta(existing.meta || meta);
              setItems(existing.items || items);
              setApplyTva(existing.applyTva ?? true);
              setStatus(existing.status || 'brouillon');
            }
          } else {
            // Load user profile for new devis
            const docRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              setCompany({
                name: data.companyName || data.name || '',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || currentUser.email,
                rccm: data.rccm || '',
                ifu: data.ifu || '',
                regime: data.regime || 'RSI'
              });
            }
          }
        } catch(e) {
          console.error(e);
        }
      } else {
        router.push('/connexion');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [editId, router]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const subTotal = items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
  const tvaAmount = applyTva ? subTotal * 0.18 : 0;
  const totalTtc = subTotal + tvaAmount;

  const numberToFrench = (num) => {
    if (num === 0) return 'zéro';
    const units = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
    const tens = ['','dix','vingt','trente','quarante','cinquante','soixante','soixante-dix','quatre-vingt','quatre-vingt-dix'];
    
    const translateUnder100 = (n) => {
      if (n < 20) return units[n];
      let ten = Math.floor(n/10);
      let unit = n % 10;
      if (ten === 7 || ten === 9) { ten--; unit += 10; }
      let res = tens[ten];
      if (unit > 0) { res += (unit === 1 || unit === 11) && ten !== 8 ? ' et ' + units[unit] : '-' + units[unit]; }
      return res;
    };
    const translateUnder1000 = (n) => {
      let h = Math.floor(n/100);
      let rest = n % 100;
      let res = '';
      if (h === 1) res = 'cent ';
      else if (h > 1) res = units[h] + ' cent' + (rest === 0 ? 's ' : ' ');
      if (rest > 0) res += translateUnder100(rest);
      return res.trim();
    };
    
    if (num < 1000) return translateUnder1000(num);
    if (num < 1000000) {
      let m = Math.floor(num/1000);
      let rest = num % 1000;
      let res = '';
      if (m === 1) res = 'mille ';
      else res = translateUnder1000(m) + ' mille ';
      if (rest > 0) res += translateUnder1000(rest);
      return res.trim();
    }
    let mil = Math.floor(num/1000000);
    let rest = num % 1000000;
    let res = translateUnder1000(mil) + ' million' + (mil > 1 ? 's ' : ' ');
    if (rest > 0) {
      let m = Math.floor(rest/1000);
      let r2 = rest % 1000;
      if (m === 1) res += 'mille ';
      else if (m > 1) res += translateUnder1000(m) + ' mille ';
      if (r2 > 0) res += translateUnder1000(r2);
    }
    return res.trim();
  };

  const handleAddItem = () => setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }]);
  const handleRemoveItem = (id) => { if (items.length > 1) setItems(items.filter(it => it.id !== id)); };
  const updateItem = (id, field, value) => setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));
  const handlePrint = () => window.print();

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      company, client, meta, items, applyTva, subTotal, tvaAmount, totalTtc, status
    };
    try {
      if (editId) {
        await updateDevis(editId, payload);
        showToast('Devis mis à jour avec succès');
      } else {
        const newId = await createDevis(user.uid, payload);
        showToast('Devis sauvegardé avec succès');
        router.push(`/devis/nouveau?id=${newId}`);
      }
    } catch(e) {
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container section text-center"><span className="loader"></span></div>;

  return (
    <div className={styles.container}>
      <div className={styles.formArea}>
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '24px' }}>
          <div className="flex items-center gap-3">
            <Link href="/devis" className="btn btn-outline btn-sm"><ArrowLeft size={16} /> Retour</Link>
            <h1 className={styles.title} style={{ marginBottom: 0 }}>{editId ? 'Modifier le devis' : 'Nouveau devis'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <select className="form-select" style={{ padding: '8px 30px 8px 12px', minWidth: '130px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="brouillon">Brouillon</option>
              <option value="envoyé">Envoyé</option>
              <option value="accepté">Accepté</option>
            </select>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              <Save size={18} /> {saving ? '...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🏢 Votre Entreprise</h3>
            <div className={styles.grid2}>
              <div className={styles.formGroup}><label>Nom de l'entreprise</label><input className={styles.input} type="text" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Téléphone</label><input className={styles.input} type="text" value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} /></div>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}><label>Adresse complète</label><input className={styles.input} type="text" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Email professionnel</label><input className={styles.input} type="email" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} /></div>
              <div className={styles.formGroup}><label>N° RCCM</label><input className={styles.input} type="text" value={company.rccm} onChange={e => setCompany({...company, rccm: e.target.value})} /></div>
              <div className={styles.formGroup}><label>N° IFU</label><input className={styles.input} type="text" value={company.ifu} onChange={e => setCompany({...company, ifu: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Régime Fiscal</label><input className={styles.input} type="text" value={company.regime} onChange={e => setCompany({...company, regime: e.target.value})} /></div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>👤 Informations du Client</h3>
            <div className={styles.grid2}>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}><label>Nom du Maître d'ouvrage / Client</label><input className={styles.input} type="text" value={client.name} onChange={e => setClient({...client, name: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Adresse du client</label><input className={styles.input} type="text" value={client.address} onChange={e => setClient({...client, address: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Contact (Optionnel)</label><input className={styles.input} type="text" value={client.contact} onChange={e => setClient({...client, contact: e.target.value})} /></div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📄 Lignes de facturation</h3>
            <div className={styles.tableHeader}>
              <span>Désignation</span><span>Qté</span><span>Prix U. (FCFA)</span><span>Total</span><span></span>
            </div>
            
            {items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <input className={styles.input} type="text" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder="Description" />
                <input className={styles.input} type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                <input className={styles.input} type="number" min="0" step="100" value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', paddingRight: '8px' }}>
                  {(item.qty * item.price).toLocaleString('fr-FR')}
                </div>
                <button className={styles.deleteBtn} onClick={() => handleRemoveItem(item.id)}><Trash2 size={16} /></button>
              </div>
            ))}
            
            <button className={styles.addBtn} onClick={handleAddItem}><Plus size={16}/> Ajouter une ligne</button>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⚙️ Paramètres du devis</h3>
            <div className={styles.grid2}>
              <div className={styles.formGroup}><label>N° du Devis</label><input className={styles.input} type="text" value={meta.number} onChange={e => setMeta({...meta, number: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Date</label><input className={styles.input} type="date" value={meta.date} onChange={e => setMeta({...meta, date: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Validité</label><input className={styles.input} type="text" value={meta.validity} onChange={e => setMeta({...meta, validity: e.target.value})} /></div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                <input type="checkbox" id="tva" checked={applyTva} onChange={e => setApplyTva(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="tva" style={{ cursor: 'pointer' }}>Appliquer la TVA (18%)</label>
              </div>
            </div>
          </div>

          <button onClick={handlePrint} className="btn btn-outline" style={{ width: '100%', marginTop: '12px' }}>
            <Printer size={18} /> Télécharger / Imprimer (PDF)
          </button>
        </div>
      </div>

      <div className={styles.previewArea}>
        <div className={styles.quoteDocument}>
          <div className={styles.qHeader}>
            <div>
              <div className={styles.qTitle}>DEVIS</div>
              <div style={{ marginTop: '8px', color: '#555', fontSize: '0.9rem' }}>N° {meta.number}</div>
            </div>
            <div className={styles.qMeta}>
              <div>Date : <strong>{new Date(meta.date).toLocaleDateString('fr-FR')}</strong></div>
              <div style={{ marginTop: '4px' }}>Validité : {meta.validity}</div>
            </div>
          </div>

          <div className={styles.qAddressBlock}>
            <div className={styles.qCompany}>
              <div className={styles.qLabel}>Émetteur</div>
              <div className={styles.qStrong}>{company.name || 'Nom de votre entreprise'}</div>
              <div className={styles.qText}>{company.address}</div>
              {company.phone && <div className={styles.qText}>{company.phone}</div>}
              {company.email && <div className={styles.qText}>{company.email}</div>}
              <div style={{ marginTop: '12px' }}></div>
              <div className={styles.qText}><strong>RCCM :</strong> {company.rccm || '________________'}</div>
              <div className={styles.qText}><strong>IFU :</strong> {company.ifu || '________________'}</div>
              <div className={styles.qText}><strong>Régime :</strong> {company.regime || '________________'}</div>
            </div>
            <div className={styles.qClient}>
              <div className={styles.qLabel}>Adressé à</div>
              <div className={styles.qStrong}>{client.name}</div>
              <div className={styles.qText}>{client.address}</div>
              {client.contact && <div className={styles.qText}>{client.contact}</div>}
            </div>
          </div>

          <table className={styles.qTable}>
            <thead>
              <tr>
                <th>Désignation</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Qté</th>
                <th className={styles.right} style={{ width: '20%' }}>Prix Unitaire</th>
                <th className={styles.right} style={{ width: '20%' }}>Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.desc || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{it.qty}</td>
                  <td className={styles.right}>{it.price.toLocaleString('fr-FR')}</td>
                  <td className={styles.right}>{(it.qty * it.price).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.qTotals}>
            <div className={styles.qTotalRow}>
              <span>Total HT</span><span>{subTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {applyTva && (
              <div className={styles.qTotalRow}>
                <span>TVA (18%)</span><span>{tvaAmount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className={`${styles.qTotalRow} ${styles.grandTotal}`}>
              <span>Net à payer TTC</span><span>{totalTtc.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          <div className={styles.qFooter}>
            <div style={{ background: '#f8f9fa', padding: '12px', borderLeft: '4px solid #059669', marginBottom: '24px', fontSize: '0.95rem' }}>
              Arrêté le présent devis à la somme de :<br/>
              <strong style={{ textTransform: 'uppercase', color: '#000' }}>
                {totalTtc > 0 ? numberToFrench(totalTtc) : 'zéro'} Francs CFA
              </strong>
            </div>
            <p style={{ fontWeight: 700, marginBottom: '6px' }}>Conditions de paiement</p>
            <p>Le paiement s'effectuera par virement bancaire ou chèque à l'ordre de {company.name || 'l\'entreprise'}.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <p style={{ fontWeight: 700, marginBottom: '60px' }}>Le Directeur Général</p>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>(Cachet et Signature)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', background: toast.type === 'success' ? 'var(--primary)' : 'var(--danger)', color: '#fff', padding: '14px 24px', borderRadius: '8px', zIndex: 100000, display: 'flex', alignItems: 'center', gap: '12px' }} className="animate-fadeIn">
          <CheckCircle size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

export default function NouveauDevisPage() {
  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Suspense fallback={<div className="container section text-center"><span className="loader"></span></div>}>
        <DevisForm />
      </Suspense>
    </main>
  );
}
