'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, ChevronLeft, ChevronRight, Search, CheckSquare, 
  Sparkles, CheckCircle, AlertTriangle, ShieldCheck, Scale, 
  FileText, Award, Layers, Bookmark, ArrowRight, RefreshCw, Star
} from 'lucide-react';

// Structure des 31 Parties regroupées en 5 Tomes pour l'Expérience Livre Ouvert
const BOOK_VOLUMES = [
  {
    id: 1,
    title: "Tome I — Fondements & Acteurs de la Commande Publique",
    icon: "📜",
    color: "#059669",
    chapters: [
      {
        id: "p1",
        number: "01",
        title: "Qu'est-ce que la commande publique ?",
        content: `La commande publique désigne le système par lequel les personnes et organismes publics acquièrent des travaux, fournitures, services ou prestations auprès d'opérateurs économiques.\n\nUne structure publique a un besoin ➔ Elle organise une procédure ➔ Des entreprises proposent leurs solutions ➔ Les offres sont évaluées ➔ Un titulaire est choisi ➔ Le marché est exécuté.`
      },
      {
        id: "p2",
        number: "02",
        title: "Qu'est-ce qu'un marché public ?",
        content: `Un marché public est un contrat conclu entre une autorité contractante et un opérateur économique pour satisfaire un besoin déterminé (Travaux, Fournitures, Services, Prestations intellectuelles).\n\nLe marché définit le cahier des charges, les quantités, le prix, le délai, les garanties et les conditions de paiement.`
      },
      {
        id: "p3",
        number: "03",
        title: "Pourquoi l'État lance-t-il des marchés publics ?",
        content: `L'État et ses démembrements ont des besoins permanents :\n• Construction : Routes, écoles, hôpitaux, forages, ponts.\n• Fournitures : Ordinateurs, véhicules, médicaments, mobiliers.\n• Services : Nettoyage, gardiennage, maintenance, transport.\n• Prestations intellectuelles : Études, audits, conseil, architecture, logiciels.`
      },
      {
        id: "p4",
        number: "04",
        title: "Qui peut participer à un marché public ?",
        content: `Toute entreprise individuelle, société, PME, grande entreprise, consultant ou groupement remplissant les conditions d'éligibilité peut soumissionner.\n\nAttention : Avoir une entreprise ne signifie pas être qualifié pour tous les marchés. Chaque consultation impose ses propres critères de qualification.`
      },
      {
        id: "p5",
        number: "05",
        title: "Les Acteurs Clés (Autorité, Soumissionnaire, ARCOP)",
        content: `• Autorité contractante : Ministère, commune, établissement public qui lance le marché.\n• Soumissionnaire : L'entreprise qui dépose une offre.\n• Attributaire : L'entreprise retenue à l'issue de l'évaluation.\n• Titulaire : L'entreprise ayant signé le contrat exécutable.\n• ARCOP : L'Autorité de Régulation de la Commande Publique (Régulation, contrôle, recours).`
      }
    ]
  },
  {
    id: 2,
    title: "Tome II — Typologie & Méthodologie d'Analyse du DAO",
    icon: "🔍",
    color: "#2563EB",
    chapters: [
      {
        id: "p6",
        number: "06",
        title: "Les Procédures de Passation (Appel d'Offres, Demande de Prix)",
        content: `Tous les marchés ne sont pas des appels d'offres publics.\n• Appel d'offres : Mise en concurrence ouverte ou restreinte pour marchés importants.\n• Demande de prix / Cotation : Procédure simplifiée pour montants sous les seuils réglementaires.\n• Procédures particulières : Urgence impérieuse ou prestations spécifiques encadrées par la loi.`
      },
      {
        id: "p7",
        number: "07",
        title: "Où trouver les opportunités & Décoder l'Avis",
        content: `Les avis sont publiés sur le Quotidien des marchés publics de la DGCMEF, les portails officiels et centralisés sur Wend-Kabré.\nNe lisez pas seulement le titre. Vérifiez les lots, les garanties exigées, le délai, le lieu de livraison et les critères d'éligibilité.`
      },
      {
        id: "p8",
        number: "08",
        title: "Le DAO : Le Manuel de Soumission Indispensable",
        content: `DAO = Dossier d'Appel d'Offres. C'est le document sacré. L'avis vous informe que le marché existe ; le DAO vous explique exactement comment le gagner.\nL'ARCOP publie des Dossiers Standards Nationaux d'Acquisition (DSNA) obligatoires.`
      },
      {
        id: "p9",
        number: "09",
        title: "La Méthode des 10 Questions pour analyser un DAO",
        content: `1. Qui lance le marché ?\n2. Qu'est-ce qui est demandé exactement ?\n3. Quel est le montant prévisionnel ?\n4. Qui a le droit de participer ?\n5. Quelles pièces administratives sont obligatoires ?\n6. Quelles qualifications techniques sont requises ?\n7. Quelles sont les caractéristiques des produits/travaux ?\n8. Quel est le modèle d'offre financière ?\n9. Quand et où déposer le pli ?\n10. Quels sont les motifs d'élimination immédiate ?`
      }
    ]
  },
  {
    id: 3,
    title: "Tome III — Réglementation 2024/2025 & Pièces Exigées",
    icon: "⚖️",
    color: "#D97706",
    chapters: [
      {
        id: "p10",
        number: "10",
        title: "Nouveau Cadre Réglementaire (Loi 005-2024 & Décret 2024-1748)",
        content: `Le Burkina Faso a rénové son cadre juridique de la commande publique :\n• Loi n°005-2024/ALT du 20 avril 2024\n• Décret n°2024-1748/PRES/PM/MEF du 31 décembre 2024\n• Arrêté n°2025-0323/MEF/CAB du 09 juillet 2025 (Pièces administratives).\nTous les dossiers doivent être analysés au crible de cette réglementation actuelle.`
      },
      {
        id: "p11",
        number: "11",
        title: "Le Référentiel des 7 Pièces Administratives (Arrêté 2025-0323)",
        content: `1. RCCM : Registre du Commerce (CEFORE/Greffe).\n2. IFU : Identifiant Financier Unique (DGI Impôts).\n3. ASF : Attestation de Situation Fiscale (valide 3 mois).\n4. CNSS : Attestation de Situation Cotisante CNSS.\n5. AJE : Attestation de Jouissance d'Équipement.\n6. DRTSS : Attestation Régionale du Travail et de la Sécurité Sociale.\n7. CNF : Certificat de Non-Faillite (valide 3 mois).\n\n⚠️ Régularisation : Les pièces manquantes peuvent être régularisées dans le délai légal accordé par la commission. En revanche, une pièce falsifiée entraîne l'élimination immédiate et des poursuites.`
      },
      {
        id: "p12",
        number: "12",
        title: "La Garantie de Soumission (Caution Bancaire - Art. 100)",
        content: `Exigée pour sécuriser l'engagement du soumissionnaire (généralement 1% à 3% du montant prévisionnel selon l'Art. 100 du Décret 2024-1748).\n\n🚨 ATTENTION CRITIQUE : Une garantie manquante, insuffisante d'un seul franc ou expirée entraîne le REJET IMMÉDIAT ET NON RÉGULARISABLE à l'ouverture des plis.`
      }
    ]
  },
  {
    id: 4,
    title: "Tome IV — Construction de l'Offre & Montage du Pli",
    icon: "📦",
    color: "#DC2626",
    chapters: [
      {
        id: "p13",
        number: "13",
        title: "L'Offre Technique (Méthodologie, Personnel, Références)",
        content: `L'offre technique démontre votre capacité à exécuter le marché :\n• Lettre de soumission signée par le gérant ou mandataire habilité.\n• Références similaires (Contrats, Attestations de Bonne Exécution, PV de réception).\n• Personnel clé (CV signés, Diplômes, Attestations).\n• Matériel mobilisé (Cartes grises, factures, contrats de location).\n• Méthodologie & Planning d'exécution.`
      },
      {
        id: "p14",
        number: "14",
        title: "L'Offre Financière & Calculs Rigoureux",
        content: `Comprend le Bordereau des Prix Unitaires (BPU) et le Devis Quantitatif Estimatif (DQE).\n\n⚠️ Erreurs Fatales : Les discordances entre le prix en chiffres et le prix en lettres ou les fautes de calcul (Quantité × PU) peuvent vous faire perdre le marché. Vérifiez chaque ligne.`
      },
      {
        id: "p15",
        number: "15",
        title: "Montage de l'Enveloppe & Dépôt dans les Délais",
        content: `Avec le cadre 2024, la règle de l'enveloppe unique s'applique aux fournitures et services courants.\n• Dépôt avant l'heure pile indiquée sur l'avis. Aucun dépôt tardif n'est accepté.\n• Conservez impérativement votre récépissé de dépôt horodaté.`
      },
      {
        id: "p16",
        number: "16",
        title: "Les 10 Erreurs qui font Éliminer une Entreprise",
        content: `1. Offre déposée en retard.\n2. Garantie de soumission absente ou insuffisante.\n3. Pièces administratives non régularisées à temps.\n4. Utilisation d'un formulaire personnel au lieu du modèle DAO.\n5. Prix en chiffres ≠ Prix en lettres.\n6. Erreur de multiplication dans le devis.\n7. Spécifications techniques non conformes au cahier des charges.\n8. Références fictives sans justificatif officiel.\n9. Absence de pouvoir pour le signataire de l'offre.\n10. Non-respect du délai d'exécution imposé.`
      }
    ]
  },
  {
    id: 5,
    title: "Tome V — Exécution, Recours & Intégration Wend-Kabré",
    icon: "💡",
    color: "#7C3AED",
    chapters: [
      {
        id: "p17",
        number: "17",
        title: "Évaluation, Attribution & Voies de Recours (ARCOP)",
        content: `Les plis sont ouverts publiquement ➔ La commission évalue la conformité administrative, technique puis financière.\nSi vous estimez qu'une décision vous fait grief, vous disposez d'un droit de recours devant l'Organe de Règlement des Différends (ORD) de l'ARCOP dans les délais stricts fixés par la loi.`
      },
      {
        id: "p18",
        number: "18",
        title: "Groupement, Sous-traitance & Préférences PME",
        content: `• Groupement d'entreprises : Deux entreprises peuvent associer leurs compétences pour atteindre la qualification requise.\n• Sous-traitance : Encadrée par la loi pour favoriser l'écosystème local.\n• Marge de préférence PME : Majoration préférentielle jusqu'à 15%-20% selon les textes applicables aux entreprises locales.`
      },
      {
        id: "p19",
        number: "19",
        title: "Comment Wend-Kabré Automatise votre Confort",
        content: `Wend-Kabré ne se contente pas de lister les marchés :\n1. Analyse IA instantanée de votre DAO (Loi 005-2024 & Arrêté 2025).\n2. Génération de la fiche de synthèse et de la checklist sur-mesure.\n3. Calcul du score de compatibilité de votre profil d'entreprise.\n4. Rédaction automatique de l'offre technique dans le Studio de Candidature.`
      }
    ]
  }
];

export default function GuideSoumissionInteractiveBook() {
  const [currentVolumeIndex, setCurrentVolumeIndex] = useState(0);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const currentVolume = BOOK_VOLUMES[currentVolumeIndex];
  const currentChapter = currentVolume.chapters[currentChapterIndex];

  // Navigation dans le Livre
  const goToNextChapter = () => {
    setIsFlipping(true);
    setTimeout(() => {
      if (currentChapterIndex < currentVolume.chapters.length - 1) {
        setCurrentChapterIndex(currentChapterIndex + 1);
      } else if (currentVolumeIndex < BOOK_VOLUMES.length - 1) {
        setCurrentVolumeIndex(currentVolumeIndex + 1);
        setCurrentChapterIndex(0);
      }
      setIsFlipping(false);
    }, 250);
  };

  const goToPrevChapter = () => {
    setIsFlipping(true);
    setTimeout(() => {
      if (currentChapterIndex > 0) {
        setCurrentChapterIndex(currentChapterIndex - 1);
      } else if (currentVolumeIndex > 0) {
        setCurrentVolumeIndex(currentVolumeIndex - 1);
        setCurrentChapterIndex(BOOK_VOLUMES[currentVolumeIndex - 1].chapters.length - 1);
      }
      setIsFlipping(false);
    }, 250);
  };

  const selectChapter = (volIdx, chapIdx) => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentVolumeIndex(volIdx);
      setCurrentChapterIndex(chapIdx);
      setIsFlipping(false);
    }, 250);
  };

  // Résultats de recherche
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];
    BOOK_VOLUMES.forEach((vol, vIdx) => {
      vol.chapters.forEach((chap, cIdx) => {
        if (chap.title.toLowerCase().includes(q) || chap.content.toLowerCase().includes(q)) {
          results.push({ vIdx, cIdx, volTitle: vol.title, chapTitle: chap.title });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="animate-fadeIn" style={{ background: 'var(--color-bg-0)', minHeight: '100vh', padding: '32px 16px' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        
        {/* EN-TÊTE DU GUIDE */}
        <div style={{
          background: 'linear-gradient(135deg, #022C22 0%, #064E3B 60%, #047857 100%)',
          borderRadius: '24px',
          padding: '36px 28px',
          color: '#FFFFFF',
          boxShadow: '0 20px 50px rgba(4,120,87,0.3)',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ maxWidth: '680px' }}>
              <span style={{
                background: '#10B981',
                color: '#022C22',
                fontWeight: 900,
                fontSize: '0.75rem',
                padding: '4px 12px',
                borderRadius: '50px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                📖 GUIDE OFFICIEL COMPLET & INTERACTIF
              </span>
              <h1 className="heading-lg" style={{ color: '#FFFFFF', margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: 800 }}>
                Marchés Publics au Burkina Faso
              </h1>
              <p style={{ color: '#D1FAE5', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                Comprendre, rechercher, analyser et soumissionner selon la <strong>Loi n°005-2024/ALT</strong>, le <strong>Décret n°2024-1748</strong> et l'<strong>Arrêté n°2025-0323</strong>.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/marches" className="btn" style={{ background: '#FFFFFF', color: '#064E3B', fontWeight: 800, padding: '12px 20px', borderRadius: '12px' }}>
                Explorer les marchés →
              </Link>
            </div>
          </div>
        </div>

        {/* BARRE DE RECHERCHE DANS LE LIVRE */}
        <div style={{ marginBottom: '28px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Rechercher un chapitre, une pièce (ex: RCCM, IFU, Garantie, Décret 2024)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                borderRadius: '16px',
                border: '2px solid var(--color-border)',
                background: 'var(--color-bg-1)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontWeight: 500
              }}
            />
          </div>

          {/* Résultats instantanés de recherche */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              width: '100%',
              background: 'var(--color-bg-1)',
              border: '2px solid var(--primary)',
              borderRadius: '16px',
              padding: '12px',
              zIndex: 90,
              boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px' }}>
                {searchResults.length} CHAPITRES TROUVÉS :
              </p>
              {searchResults.map((res, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    selectChapter(res.vIdx, res.cIdx);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: 'var(--color-surface-2)',
                    marginBottom: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{res.volTitle}</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{res.chapTitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INTERFACE LIVRE OUVERT INTERACTIF */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* COLONNE GAUCHE : SOMMAIRE PAR TOMES */}
          <div className="card" style={{ padding: '20px', borderRadius: '20px', background: 'var(--color-bg-1)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--primary)" /> Sommaire du Livre ({BOOK_VOLUMES.reduce((acc, v) => acc + v.chapters.length, 0)} Chapitres)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {BOOK_VOLUMES.map((vol, vIdx) => {
                const isSelectedVol = currentVolumeIndex === vIdx;
                return (
                  <div key={vol.id} style={{ borderRadius: '14px', overflow: 'hidden', border: isSelectedVol ? `2px solid ${vol.color}` : '1px solid var(--color-border)' }}>
                    {/* En-tête Tome */}
                    <div 
                      onClick={() => {
                        setCurrentVolumeIndex(vIdx);
                        setCurrentChapterIndex(0);
                      }}
                      style={{
                        padding: '12px 14px',
                        background: isSelectedVol ? `${vol.color}15` : 'var(--color-surface-2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelectedVol ? vol.color : 'var(--text-primary)' }}>
                        {vol.icon} {vol.title}
                      </span>
                    </div>

                    {/* Liste des Chapitres du Tome */}
                    {isSelectedVol && (
                      <div style={{ padding: '8px', background: 'var(--color-bg-1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {vol.chapters.map((chap, cIdx) => {
                          const isSelectedChap = currentChapterIndex === cIdx;
                          return (
                            <button
                              key={chap.id}
                              onClick={() => selectChapter(vIdx, cIdx)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isSelectedChap ? vol.color : 'transparent',
                                color: isSelectedChap ? '#FFFFFF' : 'var(--text-secondary)',
                                fontWeight: isSelectedChap ? 700 : 500,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {chap.number}. {chap.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLONNE DROITE : LE LIVRE OUVERT (PAGE FLIP ANIMÉE) */}
          <div 
            className="card" 
            style={{
              padding: '36px 32px',
              borderRadius: '24px',
              background: 'var(--color-bg-1)',
              border: `2px solid ${currentVolume.color}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'opacity 0.25s, transform 0.25s',
              opacity: isFlipping ? 0.3 : 1,
              transform: isFlipping ? 'rotateY(10deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Ruban Marque-Page Haut */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: '32px',
              background: currentVolume.color,
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '0 0 10px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
              {currentVolume.icon} {currentVolume.title.split('—')[0]}
            </div>

            <div>
              {/* Entête Chapitre */}
              <div style={{ marginBottom: '24px' }}>
                <span className="badge" style={{ background: `${currentVolume.color}20`, color: currentVolume.color, fontWeight: 800, fontSize: '0.75rem', marginBottom: '8px' }}>
                  CHAPITRE {currentChapter.number}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 0 0', lineHeight: 1.3 }}>
                  {currentChapter.title}
                </h2>
              </div>

              {/* Contenu textuel du chapitre */}
              <div style={{
                fontSize: '0.98rem',
                color: 'var(--text-primary)',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
                marginBottom: '32px'
              }}>
                {currentChapter.content}
              </div>

              {/* CHECKLIST INTERACTIVE SPÉCIALE SUR LE TOME III (RÉGLEMENTATION PIÈCES 2025) */}
              {currentVolume.id === 3 && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} /> Checklist de Conformité Réglementaire 2025
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {[
                      { id: 'rccm', label: '1. RCCM (CEFORE/Greffe)' },
                      { id: 'ifu', label: '2. IFU (Attestation Impôts)' },
                      { id: 'asf', label: '3. ASF (Moins de 3 mois)' },
                      { id: 'cnss', label: '4. Attestation CNSS' },
                      { id: 'aje', label: '5. Attestation AJE' },
                      { id: 'drtss', label: '6. Attestation DRTSS' },
                      { id: 'cnf', label: '7. Certificat Non-Faillite' },
                      { id: 'garantie', label: '⚡ Garantie de Soumission (Art. 100)' }
                    ].map((item) => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox" 
                          checked={Boolean(checkedItems[item.id])} 
                          onChange={() => toggleCheck(item.id)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontWeight: checkedItems[item.id] ? 700 : 500, textDecoration: checkedItems[item.id] ? 'line-through' : 'none' }}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COMMANDES DETOURNAGE DE PAGE (PRÉCÉDENT / SUIVANT) */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
              marginTop: 'auto'
            }}>
              <button
                onClick={goToPrevChapter}
                disabled={currentVolumeIndex === 0 && currentChapterIndex === 0}
                className="btn btn-outline"
                style={{
                  opacity: (currentVolumeIndex === 0 && currentChapterIndex === 0) ? 0.4 : 1,
                  cursor: (currentVolumeIndex === 0 && currentChapterIndex === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                  gap: '6px'
                }}
              >
                <ChevronLeft size={16} />
                <span>Page Précédente</span>
              </button>

              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Tome {currentVolumeIndex + 1} / {BOOK_VOLUMES.length} • Chapitre {currentChapterIndex + 1} / {currentVolume.chapters.length}
              </span>

              <button
                onClick={goToNextChapter}
                disabled={currentVolumeIndex === BOOK_VOLUMES.length - 1 && currentChapterIndex === currentVolume.chapters.length - 1}
                className="btn"
                style={{
                  background: currentVolume.color,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  gap: '6px',
                  opacity: (currentVolumeIndex === BOOK_VOLUMES.length - 1 && currentChapterIndex === currentVolume.chapters.length - 1) ? 0.4 : 1
                }}
              >
                <span>Page Suivante</span>
                <ChevronRight size={16} />
              </button>
            </div>

          </div>

        </div>

        {/* SECTION FOOTER APPEL À L'ACTION POUR WEND-KABRÉ */}
        <div style={{
          marginTop: '40px',
          background: 'var(--color-surface-2)',
          border: '2px solid var(--color-border)',
          borderRadius: '20px',
          padding: '28px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Prêt à appliquer cette méthode à votre prochain marché ?
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '600px', margin: '0 auto 20px' }}>
            Laissez l'intelligence artificielle de Wend-Kabré vérifier automatiquement la conformité de vos pièces administratives et vous guider pas-à-pas.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/marches" className="btn btn-primary btn-lg" style={{ fontWeight: 800 }}>
              Consulter les marchés disponibles →
            </Link>
            <Link href="/dashboard" className="btn btn-outline btn-lg">
              Mon Tableau de Bord
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
