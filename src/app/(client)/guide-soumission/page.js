'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, AlertTriangle, FileText, Briefcase, ChevronRight, Download, PackageOpen, HelpCircle } from 'lucide-react';

export default function GuideSoumissionPage() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "L'Avis et l'Achat du DAO",
      icon: <BookOpen size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            Tout commence par la publication de l'<strong>Avis d'Appel d'Offres (AAO)</strong>. Une fois identifié, vous devez acquérir le <strong>Dossier d'Appel d'Offres (DAO)</strong>.
          </p>
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li>Lisez attentivement l'AAO pour vérifier si vous remplissez les <strong>critères d'éligibilité</strong> (chiffre d'affaires, agrément technique).</li>
            <li>Notez le prix du DAO et le lieu de paiement (souvent le Trésor Public, la mairie, ou l'institution financière indiquée).</li>
            <li>Conservez précieusement le <strong>reçu d'achat</strong> : il est exigé dans l'offre pour prouver que vous avez légalement acquis le dossier.</li>
          </ul>
        </div>
      )
    },
    {
      id: 2,
      title: "Pièces Administratives Obligatoires",
      icon: <CheckCircle size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            L'absence ou la non-validité d'une seule pièce de ce dossier entraîne le <strong>rejet immédiat</strong> de votre offre. Vérifiez toujours la date de validité.
          </p>
          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h5 className="font-bold mb-2">Checklist des pièces (Burkina Faso) :</h5>
            <ul className="flex flex-col gap-2 text-sm text-secondary">
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> L'attestation de situation fiscale (Impôts)</li>
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> L'attestation de cotisations sociales (CNSS)</li>
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> L'attestation d'inscription à l'ANPE</li>
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> L'attestation de l'Inspection du Travail (DRTSS)</li>
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> Le certificat de non-faillite (Tribunal de Commerce)</li>
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> L'extrait de Registre de Commerce (RCCM)</li>
              <li className="flex items-center gap-2"><div style={{width:'16px',height:'16px',border:'1px solid #ccc',borderRadius:'4px'}}/> Le reçu d'achat du DAO</li>
            </ul>
          </div>
          <p className="text-xs text-danger mt-2">
            <AlertTriangle size={14} className="inline mr-1" />
            Attention : Vérifiez si le DAO exige des copies légalisées. Si oui, passez par le commissariat ou la mairie.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "L'Offre Technique",
      icon: <Briefcase size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            C'est ici que vous prouvez votre capacité à réaliser le marché. C'est l'<strong>Enveloppe I</strong>.
          </p>
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li><strong>Expériences similaires :</strong> Fournissez les copies des contrats similaires exécutés + attestations de bonne fin.</li>
            <li><strong>Personnel :</strong> Joignez les CV (signés) et diplômes (légalisés si demandé) de votre équipe technique.</li>
            <li><strong>Matériel :</strong> Fournissez les cartes grises ou reçus prouvant que vous possédez le matériel requis.</li>
            <li><strong>Méthodologie :</strong> Un plan d'exécution détaillant comment vous comptez réaliser les travaux/services.</li>
            <li><strong>Déclaration de Probité :</strong> Document signé (disponible dans l'onglet Modèles ARCOP).</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: "L'Offre Financière",
      icon: <FileText size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            C'est le coût de votre prestation. C'est l'<strong>Enveloppe II</strong>.
          </p>
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li><strong>Lettre de Soumission :</strong> Datée, signée et cachetée (montant en chiffres ET en lettres).</li>
            <li><strong>BPU (Bordereau des Prix Unitaires) :</strong> À remplir sans erreur de calcul.</li>
            <li><strong>DQE (Devis Quantitatif et Estimatif) :</strong> Le devis final chiffré (généré depuis l'outil de devis).</li>
            <li><strong>Garantie de Soumission (Caution) :</strong> Document bancaire original ou émis par un organisme agréé (généralement 1 à 3% du montant).</li>
          </ul>
          <Link href="/modeles-arcop" className="btn btn-outline btn-sm w-max mt-2">Télécharger les modèles ARCOP</Link>
        </div>
      )
    },
    {
      id: 5,
      title: "Montage et Cachetage des Plis",
      icon: <PackageOpen size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary font-bold text-danger">
            ⚠️ Une erreur ici = Élimination immédiate (offre non ouverte).
          </p>
          <p className="text-secondary">
            L'ARCOP exige le <strong>système de la double enveloppe</strong> :
          </p>
          <ol className="list-decimal pl-5 text-secondary flex flex-col gap-3">
            <li>Mettez <strong>TOUS les documents techniques et administratifs</strong> (Étape 2 & 3) dans une enveloppe scellée marquée "OFFRE TECHNIQUE".</li>
            <li>Mettez <strong>TOUS les documents financiers</strong> (Étape 4) dans une enveloppe scellée marquée "OFFRE FINANCIÈRE".</li>
            <li>Placez ces deux enveloppes (Technique + Financière) dans <strong>UNE GRANDE ENVELOPPE EXTÉRIEURE SCELLÉE</strong>.</li>
          </ol>
          <div style={{ background: '#f8f9fa', padding: '16px', borderLeft: '4px solid var(--primary)' }}>
            <p className="text-sm font-bold mb-1">Mention obligatoire sur la grande enveloppe :</p>
            <p className="text-sm font-mono" style={{ textTransform: 'uppercase' }}>
              "Appel d'offres N° [Référence du DAO] relatif à [Objet du marché]<br/>
              A n'ouvrir qu'en séance de dépouillement."
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Le Dépôt Physique",
      icon: <HelpCircle size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            Dernière ligne droite ! Ne soyez pas en retard.
          </p>
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li>Allez sur le lieu indiqué dans le DAO avec au moins <strong>30 minutes d'avance</strong>. Passé l'heure pile (ex: 09h00:00), les plis sont refusés.</li>
            <li>Assurez-vous de <strong>signer le registre de dépôt</strong> chez le secrétariat ou la commission compétente.</li>
            <li>Vous avez le droit de demander à assister à la séance publique d'ouverture des plis pour noter les prix de vos concurrents.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="container section animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="heading-lg">Guide de Soumission ARCOP</h1>
          <p className="text-secondary mt-2">Évitez les pièges et maîtrisez la procédure de dépôt des marchés publics de A à Z.</p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">
          Retour au Dashboard
        </Link>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-8" style={{ gridTemplateColumns: 'minmax(250px, 1fr) 2fr' }}>
        
        {/* Navigation latérale (Étapes) */}
        <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
          <h3 className="heading-sm mb-4 text-primary">Les 6 Étapes Clés</h3>
          <div className="flex flex-col gap-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className="flex items-center gap-3 p-3 text-left rounded-md transition-all"
                style={{
                  background: activeStep === step.id ? 'var(--primary-muted)' : 'transparent',
                  color: activeStep === step.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  borderLeft: `3px solid ${activeStep === step.id ? 'var(--primary)' : 'transparent'}`,
                  fontWeight: activeStep === step.id ? '700' : '500'
                }}
              >
                <div style={{ opacity: activeStep === step.id ? 1 : 0.6 }}>{step.icon}</div>
                <span style={{ fontSize: '0.9rem', flexGrow: 1 }}>{step.id}. {step.title}</span>
                {activeStep === step.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu de l'étape active */}
        <div className="card" style={{ padding: '32px' }}>
          <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ padding: '16px', background: 'var(--success-muted)', color: 'var(--primary)', borderRadius: '12px' }}>
              {steps.find(s => s.id === activeStep)?.icon}
            </div>
            <div>
              <span className="badge badge-green mb-2">Étape {activeStep} sur 6</span>
              <h2 className="heading-md">{steps.find(s => s.id === activeStep)?.title}</h2>
            </div>
          </div>
          
          <div className="text-base" style={{ lineHeight: '1.8' }}>
            {steps.find(s => s.id === activeStep)?.content}
          </div>

          {/* Boutons de navigation Prev/Next */}
          <div className="flex justify-between items-center mt-12 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button 
              className="btn btn-outline" 
              disabled={activeStep === 1}
              onClick={() => setActiveStep(prev => prev - 1)}
            >
              Étape précédente
            </button>
            <button 
              className="btn btn-primary" 
              disabled={activeStep === steps.length}
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              {activeStep === steps.length ? 'Terminé' : 'Étape suivante'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
