'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { track } from '@/lib/track';
import styles from './profil.module.css';

export const dynamic = 'force-dynamic';

function CompanyInfoField({ label, value, icon = '📋', onEdit = null, type = 'text', placeholder = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (onEdit) {
      await onEdit(editValue);
      setIsEditing(false);
    }
  };

  return (
    <div className={styles.infoField}>
      <label className={styles.fieldLabel}>
        <span className={styles.fieldIcon}>{icon}</span>
        {label}
      </label>
      {isEditing ? (
        <div className={styles.editMode}>
          <input 
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className={styles.fieldInput}
            autoFocus
          />
          <div className={styles.editActions}>
            <button onClick={handleSave} className="btn btn-primary btn-sm">✓</button>
            <button 
              onClick={() => {
                setEditValue(value || '');
                setIsEditing(false);
              }} 
              className="btn btn-outline btn-sm"
            >✕</button>
          </div>
        </div>
      ) : (
        <div className={styles.viewMode}>
          <p className={styles.fieldValue}>{value || 'Non renseigné'}</p>
          <button onClick={() => setIsEditing(true)} className={styles.editBtn}>✎</button>
        </div>
      )}
    </div>
  );
}

function CompanyTextArea({ label, value, icon = '📋', onEdit = null, placeholder = '', rows = 4 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (onEdit) {
      await onEdit(editValue);
      setIsEditing(false);
    }
  };

  return (
    <div className={styles.textareaField}>
      <label className={styles.fieldLabel}>
        <span className={styles.fieldIcon}>{icon}</span>
        {label}
      </label>
      {isEditing ? (
        <div className={styles.editMode}>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={styles.fieldTextarea}
            autoFocus
          />
          <div className={styles.editActions}>
            <button onClick={handleSave} className="btn btn-primary btn-sm">✓ Enregistrer</button>
            <button 
              onClick={() => {
                setEditValue(value || '');
                setIsEditing(false);
              }} 
              className="btn btn-outline btn-sm"
            >✕ Annuler</button>
          </div>
        </div>
      ) : (
        <div className={styles.viewMode}>
          <p className={styles.fieldTextValue}>{value || 'Non renseigné'}</p>
          <button onClick={() => setIsEditing(true)} className={styles.editBtn}>✎ Modifier</button>
        </div>
      )}
    </div>
  );
}

function DocumentSection({ title, icon, items, onAddItem, placeholder }) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddItem(newItem);
      setNewItem('');
    }
  };

  return (
    <div className={styles.documentSection}>
      <h4 className={styles.sectionTitle}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        {title}
      </h4>

      {items && items.length > 0 ? (
        <ul className={styles.itemsList}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.itemText}>✓ {item}</span>
              <button
                onClick={() => onAddItem(null, i)}
                className={styles.removeBtn}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyText}>Aucun élément pour le moment</p>
      )}

      <div className={styles.addItem}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder={placeholder || `Ajouter un élément`}
          className={styles.addInput}
        />
        <button onClick={handleAdd} className="btn btn-primary btn-sm">+ Ajouter</button>
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
  const [activeTab, setActiveTab] = useState('identity');

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
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().companyProfile) {
          setCompanyData({ id: user.uid, ...userSnap.data().companyProfile });
        } else {
          const defaultCompany = {
            userId: user.uid,
            // Identification
            name: '',
            rccm: '',
            ifu: '',
            legalForm: '',
            creationDate: '',
            
            // Contacts
            email: user.email,
            phone: '',
            phone2: '',
            fax: '',
            address: '',
            city: '',
            postalCode: '',
            country: 'Burkina Faso',
            website: '',
            
            // Activité
            sector: '',
            mainActivity: '',
            secondaryActivities: [],
            specializations: [],
            serviceCategories: [],
            
            // Capacités
            employees: '',
            yearsInBusiness: '',
            description: '',
            vision: '',
            mission: '',
            values: [],
            
            // Financier
            capitalSocial: '',
            annualRevenue: '',
            revenueYear: '',
            
            // Certifications & Agréments
            certifications: [],
            accreditations: [],
            insurances: [],
            bankReferences: [],
            
            // Expérience
            references: [],
            majorProjects: [],
            notableClients: [],
            awardsAndRecognitions: [],
            
            // Ressources
            equipment: [],
            facilities: [],
            softwareTools: [],
            capabilities: [],
            
            // Équipe
            keyPersonnel: [],
            technicalStaff: [],
            qualifications: [],
            
            // Documents
            documents: [],
            
            // Zones d'intervention
            interventionZones: [],
            
            // Partenariats
            partnerships: [],
            suppliers: [],
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCompanyData({ id: user.uid, ...defaultCompany });
        }
      } catch (e) {
        console.error('Error loading company:', e);
        const defaultCompany = {
          userId: user.uid,
          name: '',
          rccm: '',
          ifu: '',
          legalForm: '',
          email: user.email,
          phone: '',
          address: '',
          city: '',
          sector: '',
          employees: '',
          yearsInBusiness: '',
          description: '',
          references: [],
          certifications: [],
          capabilities: [],
          equipment: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCompanyData({ id: user.uid, ...defaultCompany });
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

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { companyProfile: dataToSave }, { merge: true });

      setIsEditing(false);
      alert('✅ Profil enregistré avec succès!');
    } catch (e) {
      console.error('Error saving company:', e);
      alert('❌ Erreur lors de la sauvegarde');
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
      <div className={styles.loadingContainer}>
        <span className="loader"></span>
        <p>Chargement du profil d'entreprise...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.authContainer}>
        <h2>🔒 Accès réservé</h2>
        <p>Connectez-vous pour accéder à votre profil d'entreprise.</p>
        <Link href="/connexion" className="btn btn-primary">Se connecter</Link>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Erreur</h2>
        <p>Impossible de charger le profil.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'identity', label: '🏢 Identification', icon: '🏢' },
    { id: 'contacts', label: '📞 Contacts', icon: '📞' },
    { id: 'activity', label: '💼 Activité', icon: '💼' },
    { id: 'financial', label: '💰 Financier', icon: '💰' },
    { id: 'certifications', label: '🏆 Certifications', icon: '🏆' },
    { id: 'experience', label: '⭐ Expérience', icon: '⭐' },
    { id: 'resources', label: '🔧 Ressources', icon: '🔧' },
    { id: 'team', label: '👥 Équipe', icon: '👥' },
    { id: 'zones', label: '🌍 Zones', icon: '🌍' },
    { id: 'partnerships', label: '🤝 Partenariats', icon: '🤝' },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {companyData.name || 'Mon Profil Entreprise'}
            </h1>
            <p className={styles.pageSubtitle}>
              Complétez votre profil pour que l'IA puisse mieux vous assister dans vos candidatures
            </p>
          </div>
          <div className={styles.headerRight}>
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

        {/* Completion Progress */}
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <h3>📊 Complétude du profil</h3>
            <span className={styles.progressPercent}>
              {Math.round(
                (Object.values(companyData).filter(v => 
                  v && (typeof v !== 'object' || (Array.isArray(v) && v.length > 0))
                ).length / Object.keys(companyData).length) * 100
              )}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${Math.round(
                  (Object.values(companyData).filter(v => 
                    v && (typeof v !== 'object' || (Array.isArray(v) && v.length > 0))
                  ).length / Object.keys(companyData).length) * 100
                )}%` 
              }}
            />
          </div>
          <p className={styles.progressHint}>
            💡 Plus votre profil est complet, plus l'IA pourra générer des offres techniques pertinentes et personnalisées
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* IDENTIFICATION */}
          {activeTab === 'identity' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>🏢 Identification de l'entreprise</h2>
              <div className={styles.grid2}>
                <CompanyInfoField
                  label="Raison Sociale / Dénomination"
                  value={companyData.name}
                  icon="🏛️"
                  onEdit={(val) => updateField('name', val)}
                  placeholder="Ex: BURKINA CONSTRUCTION SARL"
                />
                <CompanyInfoField
                  label="Forme Juridique"
                  value={companyData.legalForm}
                  icon="⚖️"
                  onEdit={(val) => updateField('legalForm', val)}
                  placeholder="Ex: SARL, SA, SAS, SARLU"
                />
                <CompanyInfoField
                  label="RCCM (Registre du Commerce)"
                  value={companyData.rccm}
                  icon="📜"
                  onEdit={(val) => updateField('rccm', val)}
                  placeholder="Ex: BF OUA 2023 B 1234"
                />
                <CompanyInfoField
                  label="IFU (Identifiant Financier Unique)"
                  value={companyData.ifu}
                  icon="💳"
                  onEdit={(val) => updateField('ifu', val)}
                  placeholder="Ex: 00012345Z"
                />
                <CompanyInfoField
                  label="Date de Création"
                  value={companyData.creationDate}
                  icon="📅"
                  type="date"
                  onEdit={(val) => updateField('creationDate', val)}
                />
                <CompanyInfoField
                  label="Années d'Expérience"
                  value={companyData.yearsInBusiness}
                  icon="⏳"
                  type="number"
                  onEdit={(val) => updateField('yearsInBusiness', val)}
                  placeholder="Ex: 15"
                />
              </div>
              <CompanyTextArea
                label="Description de l'entreprise"
                value={companyData.description}
                icon="📝"
                onEdit={(val) => updateField('description', val)}
                placeholder="Présentez votre entreprise, ses forces et son positionnement sur le marché..."
                rows={5}
              />
              <div className={styles.grid2}>
                <CompanyTextArea
                  label="Vision"
                  value={companyData.vision}
                  icon="🎯"
                  onEdit={(val) => updateField('vision', val)}
                  placeholder="Quelle est votre vision à long terme?"
                  rows={3}
                />
                <CompanyTextArea
                  label="Mission"
                  value={companyData.mission}
                  icon="🚀"
                  onEdit={(val) => updateField('mission', val)}
                  placeholder="Quelle est votre mission principale?"
                  rows={3}
                />
              </div>
              <DocumentSection
                title="Valeurs de l'entreprise"
                icon="💎"
                items={companyData.values}
                onAddItem={(item, idx) => updateArrayField('values', item, idx)}
                placeholder="Ex: Intégrité, Excellence, Innovation"
              />
            </div>
          )}

          {/* CONTACTS */}
          {activeTab === 'contacts' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>📞 Informations de Contact</h2>
              <div className={styles.grid2}>
                <CompanyInfoField
                  label="Email Principal"
                  value={companyData.email}
                  icon="📧"
                  type="email"
                  onEdit={(val) => updateField('email', val)}
                  placeholder="contact@entreprise.bf"
                />
                <CompanyInfoField
                  label="Site Web"
                  value={companyData.website}
                  icon="🌐"
                  type="url"
                  onEdit={(val) => updateField('website', val)}
                  placeholder="https://www.entreprise.bf"
                />
                <CompanyInfoField
                  label="Téléphone Principal"
                  value={companyData.phone}
                  icon="☎️"
                  type="tel"
                  onEdit={(val) => updateField('phone', val)}
                  placeholder="+226 XX XX XX XX"
                />
                <CompanyInfoField
                  label="Téléphone Secondaire"
                  value={companyData.phone2}
                  icon="📱"
                  type="tel"
                  onEdit={(val) => updateField('phone2', val)}
                  placeholder="+226 XX XX XX XX"
                />
                <CompanyInfoField
                  label="Fax"
                  value={companyData.fax}
                  icon="📠"
                  type="tel"
                  onEdit={(val) => updateField('fax', val)}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              <h3 className={styles.subheading}>📍 Adresse</h3>
              <div className={styles.grid2}>
                <CompanyInfoField
                  label="Adresse Complète"
                  value={companyData.address}
                  icon="📌"
                  onEdit={(val) => updateField('address', val)}
                  placeholder="Ex: Secteur 15, Avenue Kwame N'Krumah"
                />
                <CompanyInfoField
                  label="Ville / Commune"
                  value={companyData.city}
                  icon="🏙️"
                  onEdit={(val) => updateField('city', val)}
                  placeholder="Ex: Ouagadougou"
                />
                <CompanyInfoField
                  label="Code Postal"
                  value={companyData.postalCode}
                  icon="📮"
                  onEdit={(val) => updateField('postalCode', val)}
                  placeholder="Ex: 01 BP 1234"
                />
                <CompanyInfoField
                  label="Pays"
                  value={companyData.country}
                  icon="🌍"
                  onEdit={(val) => updateField('country', val)}
                  placeholder="Burkina Faso"
                />
              </div>
            </div>
          )}

          {/* ACTIVITÉ */}
          {activeTab === 'activity' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>💼 Domaine d'Activité</h2>
              <div className={styles.grid2}>
                <CompanyInfoField
                  label="Secteur Principal"
                  value={companyData.sector}
                  icon="🏭"
                  onEdit={(val) => updateField('sector', val)}
                  placeholder="Ex: BTP, Informatique, Consulting"
                />
                <CompanyInfoField
                  label="Activité Principale"
                  value={companyData.mainActivity}
                  icon="🎯"
                  onEdit={(val) => updateField('mainActivity', val)}
                  placeholder="Ex: Construction de bâtiments"
                />
              </div>
              <DocumentSection
                title="Activités Secondaires"
                icon="📋"
                items={companyData.secondaryActivities}
                onAddItem={(item, idx) => updateArrayField('secondaryActivities', item, idx)}
                placeholder="Ex: Travaux publics, Réhabilitation"
              />
              <DocumentSection
                title="Spécialisations"
                icon="⚡"
                items={companyData.specializations}
                onAddItem={(item, idx) => updateArrayField('specializations', item, idx)}
                placeholder="Ex: Génie civil, Électricité industrielle"
              />
              <DocumentSection
                title="Catégories de Services"
                icon="🛠️"
                items={companyData.serviceCategories}
                onAddItem={(item, idx) => updateArrayField('serviceCategories', item, idx)}
                placeholder="Ex: Études techniques, Maîtrise d'œuvre"
              />
            </div>
          )}

          {/* FINANCIER */}
          {activeTab === 'financial' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>💰 Informations Financières</h2>
              <div className={styles.grid3}>
                <CompanyInfoField
                  label="Capital Social"
                  value={companyData.capitalSocial}
                  icon="💵"
                  onEdit={(val) => updateField('capitalSocial', val)}
                  placeholder="Ex: 10 000 000 FCFA"
                />
                <CompanyInfoField
                  label="Chiffre d'Affaires Annuel"
                  value={companyData.annualRevenue}
                  icon="📊"
                  onEdit={(val) => updateField('annualRevenue', val)}
                  placeholder="Ex: 500 000 000 FCFA"
                />
                <CompanyInfoField
                  label="Année de Référence"
                  value={companyData.revenueYear}
                  icon="📅"
                  type="number"
                  onEdit={(val) => updateField('revenueYear', val)}
                  placeholder="Ex: 2023"
                />
                <CompanyInfoField
                  label="Nombre d'Employés"
                  value={companyData.employees}
                  icon="👥"
                  type="number"
                  onEdit={(val) => updateField('employees', val)}
                  placeholder="Ex: 50"
                />
              </div>
              <DocumentSection
                title="Références Bancaires"
                icon="🏦"
                items={companyData.bankReferences}
                onAddItem={(item, idx) => updateArrayField('bankReferences', item, idx)}
                placeholder="Ex: Ecobank Burkina - Compte N° 12345678"
              />
              <DocumentSection
                title="Assurances"
                icon="🛡️"
                items={companyData.insurances}
                onAddItem={(item, idx) => updateArrayField('insurances', item, idx)}
                placeholder="Ex: RC Professionnelle - NSIA Assurances"
              />
            </div>
          )}

          {/* CERTIFICATIONS */}
          {activeTab === 'certifications' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>🏆 Certifications & Agréments</h2>
              <DocumentSection
                title="Certifications ISO / Qualité"
                icon="✅"
                items={companyData.certifications}
                onAddItem={(item, idx) => updateArrayField('certifications', item, idx)}
                placeholder="Ex: ISO 9001:2015, ISO 14001"
              />
              <DocumentSection
                title="Agréments Techniques"
                icon="📜"
                items={companyData.accreditations}
                onAddItem={(item, idx) => updateArrayField('accreditations', item, idx)}
                placeholder="Ex: Agrément Catégorie B1 - Ministère des Infrastructures"
              />
              <DocumentSection
                title="Distinctions & Récompenses"
                icon="🏅"
                items={companyData.awardsAndRecognitions}
                onAddItem={(item, idx) => updateArrayField('awardsAndRecognitions', item, idx)}
                placeholder="Ex: Prix de l'Excellence 2022 - CNPB"
              />
            </div>
          )}

          {/* EXPÉRIENCE */}
          {activeTab === 'experience' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>⭐ Expérience & Références</h2>
              <DocumentSection
                title="Projets Majeurs Réalisés"
                icon="🏗️"
                items={companyData.majorProjects}
                onAddItem={(item, idx) => updateArrayField('majorProjects', item, idx)}
                placeholder="Ex: Construction du Centre Commercial XYZ - 2021 (500M FCFA)"
              />
              <DocumentSection
                title="Clients Notables"
                icon="🌟"
                items={companyData.notableClients}
                onAddItem={(item, idx) => updateArrayField('notableClients', item, idx)}
                placeholder="Ex: Ministère de l'Éducation Nationale"
              />
              <DocumentSection
                title="Références de Projets"
                icon="📋"
                items={companyData.references}
                onAddItem={(item, idx) => updateArrayField('references', item, idx)}
                placeholder="Ex: Réhabilitation Route Nationale - 2020"
              />
            </div>
          )}

          {/* RESSOURCES */}
          {activeTab === 'resources' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>🔧 Ressources & Équipements</h2>
              <DocumentSection
                title="Équipements & Matériels"
                icon="🚜"
                items={companyData.equipment}
                onAddItem={(item, idx) => updateArrayField('equipment', item, idx)}
                placeholder="Ex: 3 Camions bennes 10T, 2 Bulldozers CAT D6"
              />
              <DocumentSection
                title="Infrastructures & Locaux"
                icon="🏭"
                items={companyData.facilities}
                onAddItem={(item, idx) => updateArrayField('facilities', item, idx)}
                placeholder="Ex: Atelier de 500m² à la Zone Industrielle"
              />
              <DocumentSection
                title="Logiciels & Outils Techniques"
                icon="💻"
                items={companyData.softwareTools}
                onAddItem={(item, idx) => updateArrayField('softwareTools', item, idx)}
                placeholder="Ex: AutoCAD, MS Project, SAP"
              />
              <DocumentSection
                title="Capacités Techniques"
                icon="⚙️"
                items={companyData.capabilities}
                onAddItem={(item, idx) => updateArrayField('capabilities', item, idx)}
                placeholder="Ex: Capacité de production: 1000 m³/jour"
              />
            </div>
          )}

          {/* ÉQUIPE */}
          {activeTab === 'team' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>👥 Équipe & Personnel</h2>
              <DocumentSection
                title="Personnel Clé / Direction"
                icon="👔"
                items={companyData.keyPersonnel}
                onAddItem={(item, idx) => updateArrayField('keyPersonnel', item, idx)}
                placeholder="Ex: DG: John DOE - Ingénieur Civil (20 ans d'exp.)"
              />
              <DocumentSection
                title="Personnel Technique"
                icon="👷"
                items={companyData.technicalStaff}
                onAddItem={(item, idx) => updateArrayField('technicalStaff', item, idx)}
                placeholder="Ex: 5 Ingénieurs BTP, 10 Techniciens spécialisés"
              />
              <DocumentSection
                title="Qualifications de l'Équipe"
                icon="🎓"
                items={companyData.qualifications}
                onAddItem={(item, idx) => updateArrayField('qualifications', item, idx)}
                placeholder="Ex: 3 Ingénieurs certifiés PMP"
              />
            </div>
          )}

          {/* ZONES */}
          {activeTab === 'zones' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>🌍 Zones d'Intervention</h2>
              <DocumentSection
                title="Zones Géographiques"
                icon="📍"
                items={companyData.interventionZones}
                onAddItem={(item, idx) => updateArrayField('interventionZones', item, idx)}
                placeholder="Ex: Ouagadougou, Bobo-Dioulasso, Koudougou"
              />
              <p className={styles.hintText}>
                💡 Précisez les villes, régions ou pays où votre entreprise peut intervenir
              </p>
            </div>
          )}

          {/* PARTENARIATS */}
          {activeTab === 'partnerships' && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>🤝 Partenariats & Fournisseurs</h2>
              <DocumentSection
                title="Partenaires Stratégiques"
                icon="🤝"
                items={companyData.partnerships}
                onAddItem={(item, idx) => updateArrayField('partnerships', item, idx)}
                placeholder="Ex: Partenariat avec ABC Engineering (France)"
              />
              <DocumentSection
                title="Fournisseurs Principaux"
                icon="🏭"
                items={companyData.suppliers}
                onAddItem={(item, idx) => updateArrayField('suppliers', item, idx)}
                placeholder="Ex: CIMBURKINA pour ciments et matériaux"
              />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className={styles.footer}>
          <p className={styles.footerDate}>
            📅 Dernière mise à jour : {new Date(companyData.updatedAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className={styles.footerHint}>
            💡 <strong>Astuce IA :</strong> Plus votre profil est détaillé, plus l'assistant IA pourra générer des offres techniques
            précises et adaptées à vos capacités réelles. Pensez à mentionner vos projets récents et vos équipements disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompanyProfileLoading() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      gap: '16px'
    }}>
      <span className="loader" style={{ width: '40px', height: '40px' }}></span>
      <p style={{ color: 'var(--text-secondary)' }}>Chargement du profil d'entreprise...</p>
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

