'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, AlertTriangle, FileText, Briefcase, ChevronRight, PackageOpen, HelpCircle, Scale, Gavel } from 'lucide-react';
import {
  NATURES,
  AUTORITES,
  resolveProcedure,
  regleEnveloppe,
  estimerGarantieSoumission,
  formatFCFA,
  PIECES_ADMINISTRATIVES,
  VALIDITE_PIECES_MOIS,
  GARANTIE_SOUMISSION,
  OUVERTURE_PLIS,
  SINCERITE,
  CHECKLIST_DEPOT,
  DELAIS_OFFRES,
  ECLAIRCISSEMENTS,
  DELAIS_PAIEMENT,
  RECOURS,
  RECOURS_EXECUTION,
  REGIME_PIECES,
  PREFERENCES,
  OFFRE_ANORMALEMENT_BASSE,
  GARANTIE_BONNE_EXECUTION_MAJOREE,
  PENALITES_RETARD,
  RESILIATION_PAR_LE_TITULAIRE,
} from '@/lib/arcop';

/** Encart signalant une information non encore recoupée sur les textes 2024. */
function AVerifier({ children }) {
  return (
    <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
      <AlertTriangle size={13} className="inline mr-1" />
      {children}
    </p>
  );
}

/** Calculateur : quelle procédure s'applique à ce marché ? */
function SelecteurProcedure({ nature, setNature, montant, setMontant, autorite, setAutorite, resultat }) {
  return (
    <div className="card" style={{ padding: '20px', marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Scale size={18} />
        <h3 className="heading-sm" style={{ margin: 0 }}>Quelle procédure s'applique à votre marché ?</h3>
      </div>
      <p className="text-sm text-secondary" style={{ marginBottom: '14px' }}>
        Les règles de montage du dossier changent selon la procédure. Renseignez le marché
        visé — les étapes ci-dessous s'adaptent.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted" style={{ fontWeight: 700 }}>Nature</span>
          <select className="form-input" value={nature} onChange={(e) => setNature(e.target.value)}>
            {Object.entries(NATURES).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted" style={{ fontWeight: 700 }}>Montant prévisionnel TTC</span>
          <input
            className="form-input"
            type="number"
            min="0"
            step="100000"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="ex : 45000000"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted" style={{ fontWeight: 700 }}>Autorité contractante</span>
          <select className="form-input" value={autorite} onChange={(e) => setAutorite(e.target.value)}>
            {Object.entries(AUTORITES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: '16px', padding: '14px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
        {resultat ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-green">{resultat.procedure.label}</span>
              <span className="text-xs text-muted">{resultat.seuil} · {resultat.procedure.article} du décret n°2024-1748</span>
            </div>
            {Number(montant) > 0 && (
              <p className="text-sm text-secondary" style={{ marginTop: '10px' }}>
                Garantie de soumission si elle est exigée :{' '}
                <strong>
                  {formatFCFA(estimerGarantieSoumission(Number(montant)).min)} à{' '}
                  {formatFCFA(estimerGarantieSoumission(Number(montant)).max)}
                </strong>{' '}
                (1 % à 3 %, art. 100). Le montant exact figure au dossier.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            Aucune procédure déterminée automatiquement pour ce montant. Le dossier d'appel
            à concurrence fait foi.
          </p>
        )}
      </div>
    </div>
  );
}

export default function GuideSoumissionPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [nature, setNature] = useState('TRAVAUX');
  const [montant, setMontant] = useState('');
  const [autorite, setAutorite] = useState('ETAT');

  const resultat = useMemo(
    () => resolveProcedure({ nature, montantTTC: Number(montant), autorite }),
    [nature, montant, autorite]
  );
  const enveloppe = useMemo(() => regleEnveloppe(nature), [nature]);

  const steps = [
    {
      id: 1,
      title: "L'avis et l'acquisition du dossier",
      icon: <BookOpen size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            Tout commence par la publication de l'avis d'appel à concurrence. Une fois le marché
            identifié, vous devez acquérir le dossier correspondant à la procédure retenue par
            l'autorité contractante.
          </p>
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li>Vérifiez que vous remplissez les <strong>critères d'éligibilité</strong> annoncés (capacités techniques et financières, agrément le cas échéant).</li>
            <li>Notez le prix du dossier et le lieu de paiement indiqués dans l'avis.</li>
            <li>Conservez le <strong>reçu d'achat</strong> du dossier.</li>
            <li>Le dossier peut désormais être mis à disposition <strong>par voie électronique</strong> (art. 225 du décret n°2024-1748).</li>
          </ul>

          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px' }}>
            <h5 className="font-bold mb-2">Vous avez le droit de poser des questions ({ECLAIRCISSEMENTS.article})</h5>
            <p className="text-sm text-secondary">
              Adressez vos demandes d'éclaircissements par écrit à l'autorité contractante
              au plus tard <strong>{ECLAIRCISSEMENTS.delaiDemandeJours} jours avant la date limite de dépôt</strong>.
              Elle dispose de <strong>{ECLAIRCISSEMENTS.delaiReponseJours} jours</strong> pour répondre.
            </p>
            <p className="text-sm text-secondary" style={{ marginTop: '6px' }}>{ECLAIRCISSEMENTS.diffusion}</p>
          </div>

          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px' }}>
            <h5 className="font-bold mb-2">Combien de temps avez-vous ? ({DELAIS_OFFRES.article})</h5>
            <ul className="list-disc pl-5 text-sm text-secondary flex flex-col gap-1">
              <li><strong>{DELAIS_OFFRES.minimumJours.seuilNational} jours minimum</strong> pour un appel d'offres ou une demande de propositions au seuil national.</li>
              <li><strong>{DELAIS_OFFRES.minimumJours.seuilCommunautaire} jours minimum</strong> au seuil communautaire.</li>
              <li><strong>{DELAIS_OFFRES.minimumJours.concoursArchitectural} jours</strong> pour les concours architecturaux.</li>
              <li>Le délai court à compter de la première parution de l'avis dans la revue des marchés publics.</li>
              <li>Il peut être raccourci de {DELAIS_OFFRES.reductionElectroniqueJours} jours si l'avis et le dossier circulent au format électronique UEMOA, et ramené à {DELAIS_OFFRES.urgence.seuilNational.min}–{DELAIS_OFFRES.urgence.seuilNational.max} jours en cas d'urgence motivée (art. 97).</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Pièces administratives',
      icon: <CheckCircle size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h5 className="font-bold mb-2">Les pièces exigées des candidats burkinabè</h5>
            <ul className="flex flex-col gap-2 text-sm text-secondary">
              {PIECES_ADMINISTRATIVES.map((p) => (
                <li key={p.id} className="flex items-start gap-2">
                  <div style={{ width: '16px', height: '16px', border: '1px solid #ccc', borderRadius: '4px', flexShrink: 0, marginTop: '3px' }} />
                  <span>{p.label} <span className="text-muted">— {p.emetteur}</span></span>
                </li>
              ))}
            </ul>
            <p className="text-sm mt-3" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
              Toutes ces pièces doivent dater de moins de {VALIDITE_PIECES_MOIS} mois.
            </p>
          </div>

          <div style={{ background: 'var(--success-muted)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
            <p className="text-sm">
              <strong>Une pièce manquante ne vous élimine pas d'office.</strong> {REGIME_PIECES.auDepot}
            </p>
            <p className="text-sm" style={{ marginTop: '8px' }}>
              {REGIME_PIECES.aLAttribution} <span className="text-muted">({REGIME_PIECES.article})</span>
            </p>
          </div>

          <div style={{ background: 'var(--danger-muted)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
            <p className="text-sm">
              <strong>En revanche, une pièce non sincère fait rejeter l'offre.</strong> {SINCERITE.regle}
              <span className="text-muted"> ({SINCERITE.article})</span>
            </p>
          </div>

          <AVerifier>
            La liste ci-dessus provient du Guide du soumissionnaire ARCOP (2018).
            L'article 109 du décret n°2024-1748 renvoie désormais sa composition à un
            arrêté du ministre chargé du budget. La liste figurant dans votre dossier
            d'appel à concurrence fait foi.
          </AVerifier>

          <p className="text-xs text-muted">
            {REGIME_PIECES.dispenses}
          </p>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Contenu technique de l\'offre',
      icon: <Briefcase size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-secondary">
            C'est ici que vous démontrez votre capacité à exécuter le marché.
          </p>
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li><strong>Références similaires</strong> : copies de contrats exécutés et attestations de bonne fin.</li>
            <li><strong>Personnel</strong> : CV signés et diplômes de l'équipe proposée.</li>
            <li><strong>Matériel</strong> : justificatifs de propriété ou de mise à disposition.</li>
            <li><strong>Méthodologie</strong> : plan d'exécution détaillé.</li>
            <li><strong>Groupement</strong> : accord de groupement signé de toutes les parties, ou lettre d'intention accompagnée du projet d'accord.</li>
          </ul>
          <div style={{ background: 'var(--success-muted)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
            <p className="text-sm">
              <strong>Nouveauté du cadre 2024 :</strong> l'exigence de marchés similaires a été
              supprimée pour les marchés dont le montant prévisionnel est inférieur à 300 000 000 FCFA.
              Une entreprise sans référence peut donc concourir sur ces marchés.
            </p>
            <AVerifier>
              Mesure annoncée avec le décret d'application de décembre 2024 ; à confirmer sur
              le texte avant de s'en prévaloir dans une offre.
            </AVerifier>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Contenu financier et garantie',
      icon: <FileText size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
            <li><strong>Lettre de soumission</strong> datée et signée par vous-même ou votre représentant dûment habilité (art. 99).</li>
            <li><strong>Bordereau des prix unitaires</strong> et <strong>devis quantitatif et estimatif</strong>, remplis, datés et signés.</li>
            <li><strong>Calendrier d'exécution</strong>.</li>
            <li><strong>Garantie de soumission</strong> lorsque la nature des prestations le requiert.</li>
          </ul>

          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px' }}>
            <h5 className="font-bold mb-2">La garantie de soumission (art. 100)</h5>
            <p className="text-sm text-secondary">
              Son montant est fixé par l'autorité contractante et figure au dossier. Il est
              compris entre <strong>1 % et 3 % du montant prévisionnel</strong> du marché.
            </p>
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Elle peut prendre l'une de ces formes :</p>
            <ul className="list-disc pl-5 text-sm text-secondary" style={{ marginTop: '4px' }}>
              {GARANTIE_SOUMISSION.formes.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>{GARANTIE_SOUMISSION.restitution}</p>
          </div>

          <div style={{ background: 'var(--success-muted)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
            <h5 className="font-bold mb-2">Les marges de préférence qui vous sont dues (art. 119 à 123)</h5>
            <p className="text-sm" style={{ marginBottom: '10px' }}>
              Toute préférence doit être prévue au dossier et quantifiée en pourcentage de
              votre offre. Plusieurs se cumulent — une PME locale sur un marché de travaux
              communautaire peut atteindre 20 %.
            </p>
            <ul className="flex flex-col gap-2">
              {PREFERENCES.map((p) => (
                <li key={p.id} className="text-sm">
                  <strong>{Math.round(p.taux * 100)} %</strong> — {p.label}
                  {p.cumulable && <span className="badge badge-green" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>cumulable</span>}
                  <div className="text-xs text-muted">{p.condition} · {p.article}</div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: 'var(--accent-muted)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
            <p className="text-sm">
              <strong>Attention au prix trop agressif ({OFFRE_ANORMALEMENT_BASSE.article}).</strong>{' '}
              {OFFRE_ANORMALEMENT_BASSE.definition} {OFFRE_ANORMALEMENT_BASSE.procedure}
            </p>
            <p className="text-sm" style={{ marginTop: '8px' }}>
              Si votre offre est confirmée dans cette zone, votre garantie de bonne exécution
              passe entre <strong>{Math.round(GARANTIE_BONNE_EXECUTION_MAJOREE.tauxMin * 100)} % et {Math.round(GARANTIE_BONNE_EXECUTION_MAJOREE.tauxMax * 100)} %</strong> du prix
              de base — une immobilisation de trésorerie à anticiper avant de casser vos prix.
            </p>
            <AVerifier>{GARANTIE_BONNE_EXECUTION_MAJOREE.tauxDeDroitCommunNote}</AVerifier>
          </div>

          <Link href="/modeles-arcop" className="btn btn-outline btn-sm w-max">Modèles de documents</Link>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Montage et cachetage du pli',
      icon: <PackageOpen size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <div style={{ background: 'var(--accent-muted)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
            <p className="text-sm" style={{ fontWeight: 700, marginBottom: '6px' }}>
              Ce point a changé avec le cadre 2024.
            </p>
            <p className="text-sm">
              L'ancienne règle de la double enveloppe « offre technique / offre financière »
              ne s'applique plus aux travaux, fournitures et services courants.
            </p>
          </div>

          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${enveloppe.type === 'UNIQUE' ? 'badge-green' : 'badge-accent'}`}>
                {enveloppe.type === 'UNIQUE' ? 'Enveloppe unique' : 'Double enveloppe'}
              </span>
              <span className="text-xs text-muted">{NATURES[nature]} · {enveloppe.article}</span>
            </div>
            <p className="text-sm text-secondary" style={{ marginBottom: '8px' }}>{enveloppe.resume}</p>
            <ul className="list-disc pl-5 text-sm text-secondary flex flex-col gap-1">
              {enveloppe.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>

          <p className="text-sm text-secondary">
            L'offre est accompagnée d'une lettre de soumission signée, et transmise par tout
            moyen permettant d'établir avec certitude la date et l'heure de réception tout en
            garantissant la confidentialité (art. 99).
          </p>
        </div>
      ),
    },
    {
      id: 6,
      title: 'Dépôt et ouverture des plis',
      icon: <HelpCircle size={24} />,
      content: (
        <div className="flex flex-col gap-4">
          <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '8px' }}>
            <h5 className="font-bold mb-2">Vérification avant dépôt</h5>
            <ul className="flex flex-col gap-3">
              {CHECKLIST_DEPOT.map((b) => (
                <li key={b.id}>
                  <div className="text-sm" style={{ fontWeight: 700 }}>{b.titre}</div>
                  <div className="text-sm text-secondary">{b.controle}</div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-2">Le jour du dépôt ({OUVERTURE_PLIS.article})</h5>
            <ul className="list-disc pl-5 text-secondary flex flex-col gap-2">
              {OUVERTURE_PLIS.regles.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <p className="text-sm" style={{ color: 'var(--danger)', fontWeight: 600 }}>
            Le dépôt anticipé est permis et fortement recommandé : l'ouverture intervient
            immédiatement après l'heure limite, et les plis hors délai sont écartés.
          </p>
        </div>
      ),
    },
    {
      id: 7,
      title: 'Contester, et se faire payer',
      icon: <Gavel size={24} />,
      content: (
        <div className="flex flex-col gap-5">
          <div>
            <h5 className="font-bold mb-2">Si une décision vous fait grief</h5>
            <p className="text-sm text-secondary" style={{ marginBottom: '10px' }}>
              Candidats, soumissionnaires, attributaires et titulaires peuvent contester le
              dossier d'appel à concurrence comme les décisions prises pendant la passation,
              l'exécution ou le règlement (loi n°005-2024, art. 44).
            </p>
            <ol className="flex flex-col gap-3" style={{ paddingLeft: 0, listStyle: 'none' }}>
              {RECOURS.map((r, i) => (
                <li key={i} style={{ borderLeft: '3px solid var(--color-border-strong)', paddingLeft: '12px' }}>
                  <div className="text-sm" style={{ fontWeight: 700 }}>{r.etape}</div>
                  <div className="text-sm text-secondary">{r.objet}</div>
                  <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                    {r.delai
                      ? `Délai : ${r.delai.valeur} ${r.delai.unite}${r.delaiPourStatuer ? ` · décision sous ${r.delaiPourStatuer.valeur} ${r.delaiPourStatuer.unite}` : ''}`
                      : r.delaiInconnu
                        ? '⚠️ Délai non publié dans les textes — voir ci-dessous'
                        : ''}
                    {' · '}{r.fondement}
                  </div>
                  {r.pointDeDepart && (
                    <div className="text-xs text-muted" style={{ fontStyle: 'italic' }}>{r.pointDeDepart}</div>
                  )}
                </li>
              ))}
            </ol>

            <div style={{ background: 'var(--accent-muted)', padding: '14px', borderRadius: '8px', marginTop: '14px', borderLeft: '4px solid var(--accent)' }}>
              <p className="text-sm">
                <strong>Point à vérifier auprès de l'ARCOP.</strong> {RECOURS[0].note} Ne
                tardez pas à saisir l'ORD : rater ce délai peut rendre tout le reste
                irrecevable.
              </p>
            </div>

            <p className="text-sm text-secondary" style={{ marginTop: '12px' }}>
              Litige né pendant l'exécution après non-conciliation : {RECOURS_EXECUTION.delai.valeur} jours
              à compter de la notification du procès-verbal, {RECOURS_EXECUTION.sanction.toLowerCase()}
              {' '}({RECOURS_EXECUTION.fondement}).
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <h5 className="font-bold mb-2">Se faire payer dans les délais ({DELAIS_PAIEMENT.article})</h5>
            <ul className="list-disc pl-5 text-sm text-secondary flex flex-col gap-1">
              <li>Avance : <strong>{DELAIS_PAIEMENT.plafondsJours.avance} jours</strong> maximum.</li>
              <li>Acompte : <strong>{DELAIS_PAIEMENT.plafondsJours.acompte} jours</strong> maximum.</li>
              <li>Solde : <strong>{DELAIS_PAIEMENT.plafondsJours.solde} jours</strong> maximum.</li>
            </ul>
            <p className="text-xs text-muted" style={{ marginTop: '6px' }}>{DELAIS_PAIEMENT.pointDeDepart}</p>

            <div style={{ background: 'var(--success-muted)', padding: '14px', borderRadius: '8px', marginTop: '12px', borderLeft: '4px solid var(--primary)' }}>
              <p className="text-sm">
                <strong>Au-delà, l'administration vous doit des intérêts moratoires.</strong>{' '}
                {DELAIS_PAIEMENT.interetsMoratoires.declencheur} Taux : {DELAIS_PAIEMENT.interetsMoratoires.taux}
              </p>
              <p className="text-sm" style={{ marginTop: '6px' }}>
                Ils sont <strong>calculés sur demande</strong> : sans réclamation écrite de
                votre part, ils ne vous seront pas versés.
              </p>
            </div>

            <p className="text-sm text-secondary" style={{ marginTop: '12px' }}>
              Si le défaut de paiement rend l'exécution impossible et que votre requête
              reste sans effet pendant <strong>trois mois</strong>, vous pouvez demander la
              résiliation et prétendre à une indemnité sur les prestations restant à
              exécuter ({RESILIATION_PAR_LE_TITULAIRE.article}).
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <h5 className="font-bold mb-2">Vos pénalités sont plafonnées ({PENALITES_RETARD.article})</h5>
            <ul className="list-disc pl-5 text-sm text-secondary flex flex-col gap-1">
              <li>Travaux : de 1/5000 à 1/2000 du montant HT par jour calendaire de retard.</li>
              <li>Fournitures, services courants et prestations intellectuelles : de 1/2000 à 1/1000 par jour.</li>
              <li><strong>Plafond : {Math.round(PENALITES_RETARD.plafond * 100)} % du montant hors taxes</strong> du marché, quel que soit le retard.</li>
              <li>Elles s'appliquent sans mise en demeure préalable.</li>
            </ul>
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>
              {PENALITES_RETARD.forceMajeure}
            </p>
          </div>
        </div>
      ),
    },
  ];

  const meta = steps.find((s) => s.id === activeStep);

  return (
    <div className="container section animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg">Guide de soumission</h1>
          <p className="text-secondary mt-2">
            Aligné sur la loi n°005-2024/ALT du 20 avril 2024 et le décret n°2024-1748.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">Retour au tableau de bord</Link>
      </div>

      <SelecteurProcedure
        nature={nature} setNature={setNature}
        montant={montant} setMontant={setMontant}
        autorite={autorite} setAutorite={setAutorite}
        resultat={resultat}
      />

      <div className="grid md:grid-cols-[300px_1fr] gap-8" style={{ gridTemplateColumns: 'minmax(250px, 1fr) 2fr' }}>
        <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
          <h3 className="heading-sm mb-4 text-primary">Les {steps.length} étapes</h3>
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
                  fontWeight: activeStep === step.id ? '700' : '500',
                }}
              >
                <div style={{ opacity: activeStep === step.id ? 1 : 0.6 }}>{step.icon}</div>
                <span style={{ fontSize: '0.9rem', flexGrow: 1 }}>{step.id}. {step.title}</span>
                {activeStep === step.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ padding: '16px', background: 'var(--success-muted)', color: 'var(--primary)', borderRadius: '12px' }}>
              {meta?.icon}
            </div>
            <div>
              <span className="badge badge-green mb-2">Étape {activeStep} sur {steps.length}</span>
              <h2 className="heading-md">{meta?.title}</h2>
            </div>
          </div>

          <div className="text-base" style={{ lineHeight: '1.8' }}>{meta?.content}</div>

          <div className="flex justify-between items-center mt-12 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-outline" disabled={activeStep === 1} onClick={() => setActiveStep((p) => p - 1)}>
              Étape précédente
            </button>
            <button className="btn btn-primary" disabled={activeStep === steps.length} onClick={() => setActiveStep((p) => p + 1)}>
              {activeStep === steps.length ? 'Terminé' : 'Étape suivante'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
