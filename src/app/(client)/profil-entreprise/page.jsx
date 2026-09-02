'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { track } from '@/lib/track';

export const dynamic = 'force-dynamic';

function CompanyInfoCard({ label, value, icon = '📋', editable = false, onEdit = null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  if (!value && !editable) return null;

  const handleSave = async () => {
    if (onEdit) {
      await onEdit(editValue);
      setIsEditing(false);
    }
  };

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      border: '1px solid var(--color-border)', 
      borderRadius: 'var(--radius-sm)', 
      padding: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="text-xs text-muted" style={{ marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </p>
        {isEditing ? (
          <div className="flex gap-2">
            <input 
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setEditValue(value || '');
                setIsEditing(false);
              }}
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-primary" style={{ fontWeight: 600, wordBreak: 'break-word' }}>
              {value || 'Non renseigné'}
            </p>
            {editable && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.75rem', flexShrink: 0 }}
              >
                ✎
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentSection({ title, icon, items, onAddItem }) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddItem(newItem);
      setNewItem('');
    }
  };

  return (
    <div style={{ 
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px'
    }}>
      <h3 className="heading-sm" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        {title}
      </h3>

      {items && items.length > 0 ? (
        <ul style={{ 
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {items.map((item, i) => (
            <li 
              key={i}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <span className="text-sm text-primary" style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item}>
                ✓ {item}
              </span>
              <button
                onClick={() => onAddItem(null, i)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)', flexShrink: 0 }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary" style={{ marginBottom: '16px', fontStyle: 'italic' }}>
          Aucun élément pour le moment
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder={`Ajouter un élément à ${title.toLowerCase()}`}
          className="text-sm"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-bg)',
            color: 'var(--text-primary)'
          }}
        />
        <button
          onClick={handleAdd}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', fontSize: '0.8rem', flexShrink: 0 }}
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
}

function CompanyProfileContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('id');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCompany = async () => {
      try {
        let docId = companyId || user.uid;
        const companyRef = doc(db, 'companies', docId);
        const snap = await getDoc(companyRef);

        if (snap.exists()) {
          setCompanyData({ id: snap.id, ...snap.data() });
        } else {
          const defaultCompany = {
            userId: user.uid,
            name: '',
            rccm: '',
            ifu: '',
            email: user.email,
            phone: '',
            address: '',
            city: '',
            website: '',
            sector: '',
            employees: '',
            yearsInBusiness: '',
            description: '',
            references: [],
            certifications: [],
            capabilities: [],
            equipment: [],
            team: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCompanyData({ id: docId, ...defaultCompany });
        }
      } catch (e) {
        console.error('Error loading company:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [user]);

  const handleSaveCompany = async () => {
    if (!companyData || !user) return;

    setSaving(true);
    track('company_profile_save', { companyId: companyData.id });

    try {
      const { id, ...dataToSave } = companyData;
      dataToSave.updatedAt = new Date().toISOString();

      const companyRef = doc(db, 'companies', companyData.id);
      await setDoc(companyRef, dataToSave, { merge: true });

      setIsEditing(false);
    } catch (e) {
      console.error('Error saving company:', e);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field, newItem, index = null) => {
    setCompanyData(prev => {
      const arr = [...(prev[field] || [])];
      if (index !== null) {
        arr.splice(index, 1);
      } else if (newItem) {
        arr.push(newItem);
      }
      return { ...prev, [field]: arr };
    });
  };

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '80px 20px', paddingTop: '150px' }}>
        <span className="loader" style={{ width: '40px', height: '40px' }}></span>
        <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement du profil d'entreprise...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center" style={{ padding: '80px 20px', paddingTop: '150px' }}>
        <h2 className="heading-md">Accès réservé</h2>
        <p className="text-secondary" style={{ marginBottom: '24px' }}>Connectez-vous pour accéder à votre profil d'entreprise.</p>
        <Link href="/connexion" className="btn btn-primary">Se connecter</Link>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="text-center" style={{ padding: '80px 20px', paddingTop: '150px' }}>
        <h2 className="heading-md">Erreur</h2>
        <p className="text-secondary">Impossible de charger le profil.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '90px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="flex justify-between items-start" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="heading-lg" style={{ marginBottom: '8px' }}>
              {companyData.name || 'Mon Profil Entreprise'}
            </h1>
            <p className="text-secondary">Gérez les informations de votre entreprise pour l'IA</p>
          </div>
          <div className="flex gap-2" style={{ flexShrink: 0 }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? '💾 Enregistrement...' : '💾 Enregistrer'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                ✎ Éditer le profil
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div className="card">
            <h2 className="heading-md" style={{ marginBottom: '16px' }}>🏢 Identification</h2>
            <div className="flex flex-col gap-3">
              <CompanyInfoCard
                label="Raison Sociale / Dénomination"
                value={companyData.name}
                icon="🏛️"
                editable={isEditing}
                onEdit={(val) => updateField('name', val)}
              />
              <CompanyInfoCard
                label="RCCM (Registre du Commerce)"
                value={companyData.rccm}
                icon="📜"
                editable={isEditing}
                onEdit={(val) => updateField('rccm', val)}
              />
              <CompanyInfoCard
                label="IFU (Identifiant Financier Unique)"
                value={companyData.ifu}
                icon="💳"
                editable={isEditing}
                onEdit={(val) => updateField('ifu', val)}
              />
              <CompanyInfoCard
                label="Secteur d'activité"
                value={companyData.sector}
                icon="🏭"
                editable={isEditing}
                onEdit={(val) => updateField('sector', val)}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="heading-md" style={{ marginBottom: '16px' }}>📍 Contacts & Localisation</h2>
            <div className="flex flex-col gap-3">
              <CompanyInfoCard
                label="Email"
                value={companyData.email}
                icon="📧"
                editable={isEditing}
                onEdit={(val) => updateField('email', val)}
              />
              <CompanyInfoCard
                label="Téléphone"
                value={companyData.phone}
                icon="☎️"
                editable={isEditing}
                onEdit={(val) => updateField('phone', val)}
              />
              <CompanyInfoCard
                label="Adresse"
                value={companyData.address}
                icon="📌"
                editable={isEditing}
                onEdit={(val) => updateField('address', val)}
              />
              <CompanyInfoCard
                label="Ville / Région"
                value={companyData.city}
                icon="🌍"
                editable={isEditing}
                onEdit={(val) => updateField('city', val)}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="heading-md" style={{ marginBottom: '16px' }}>📝 À Propos</h2>
          <div className="grid grid-2 gap-4" style={{ marginBottom: '16px' }}>
            <CompanyInfoCard
              label="Nombre d'Employés"
              value={companyData.employees}
              icon="👥"
              editable={isEditing}
              onEdit={(val) => updateField('employees', val)}
            />
            <CompanyInfoCard
              label="Années d'Expérience"
              value={companyData.yearsInBusiness}
              icon="⏳"
              editable={isEditing}
              onEdit={(val) => updateField('yearsInBusiness', val)}
            />
          </div>
          <div>
            <p className="text-xs text-muted" style={{ marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
              Description / Présentation
            </p>
            {isEditing ? (
              <textarea
                value={companyData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Décrivez votre entreprise, ses forces et son positionnement..."
                className="text-sm"
                style={{
                  width: '100%',
                  padding: '12px',
                  minHeight: '120px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            ) : (
              <p className="text-sm text-primary" style={{ lineHeight: 1.6 }}>
                {companyData.description || 'Aucune description renseignée'}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="grid grid-2 gap-4" style={{ marginBottom: '24px' }}>
            <DocumentSection
              title="Certifications & Agréments"
              icon="🏆"
              items={companyData.certifications}
              onAddItem={(item, idx) => updateArrayField('certifications', item, idx)}
            />
            <DocumentSection
              title="Références de Projets"
              icon="⭐"
              items={companyData.references}
              onAddItem={(item, idx) => updateArrayField('references', item, idx)}
            />
            <DocumentSection
              title="Équipements & Ressources"
              icon="🔧"
              items={companyData.equipment}
              onAddItem={(item, idx) => updateArrayField('equipment', item, idx)}
            />
            <DocumentSection
              title="Compétences Clés"
              icon="💡"
              items={companyData.capabilities}
              onAddItem={(item, idx) => updateArrayField('capabilities', item, idx)}
            />
          </div>
        )}

        {!isEditing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <DocumentSection
              title="Certifications & Agréments"
              icon="🏆"
              items={companyData.certifications}
              onAddItem={() => {}}
            />
            <DocumentSection
              title="Références de Projets"
              icon="⭐"
              items={companyData.references}
              onAddItem={() => {}}
            />
            <DocumentSection
              title="Équipements & Ressources"
              icon="🔧"
              items={companyData.equipment}
              onAddItem={() => {}}
            />
            <DocumentSection
              title="Compétences Clés"
              icon="💡"
              items={companyData.capabilities}
              onAddItem={() => {}}
            />
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs text-muted">
            Dernier mise à jour : {new Date(companyData.updatedAt).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-xs text-secondary" style={{ marginTop: '8px' }}>
            Ces informations seront utilisées par l'IA pour générer vos offres techniques avec plus de précision.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompanyProfileLoading() {
  return (
    <div className="text-center" style={{ padding: '80px 20px', paddingTop: '150px' }}>
      <span className="loader" style={{ width: '40px', height: '40px' }}></span>
      <p className="text-secondary" style={{ marginTop: '16px' }}>Chargement du profil d'entreprise...</p>
    </div>
  );
}

export default function CompanyProfilePage() {
  return (
    <Suspense fallback={<CompanyProfileLoading />}>
      <CompanyProfileContent />
    </Suspense>
  );
}
