# 💻 Exemples de Code : Extensions du Tracker

## 📚 Guide pour les Développeurs

Ce document contient des exemples de code pour étendre et personnaliser le Tracker de Dossier.

---

## 1️⃣ Ajouter une Nouvelle Pièce à la Checklist

### Étape 1 : Modifier la Structure de Données

**Fichier : `src/app/(client)/marches/dossier/page.js`**

```javascript
// Dans l'état initial du composant
const [dossier, setDossier] = useState({
  // Pièces existantes
  attestationImpots: false,
  attestationCNSS: false,
  attestationRCCM: false,
  attestationIFU: false,
  attestationARCOP: false,
  
  // NOUVELLE PIÈCE : Attestation de Situation Fiscale
  attestationSituationFiscale: false, // ← Ajouter ici
  
  // Documents ARCOP
  lettresoumission: false,
  declarationProbite: false,
  
  // Enveloppes
  enveloppe1Complete: false,
  enveloppe2Complete: false,
  
  notes: '',
});
```

### Étape 2 : Ajouter l'Élément dans l'Interface

```javascript
{/* Nouvelle attestation */}
<div style={{ 
  padding: '16px', 
  background: dossier.attestationSituationFiscale ? 'var(--success-muted)' : 'var(--color-surface-2)',
  border: `1px solid ${dossier.attestationSituationFiscale ? 'var(--green)' : 'var(--color-border)'}`,
  borderRadius: '8px'
}}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
      <input 
        type="checkbox" 
        checked={dossier.attestationSituationFiscale}
        onChange={() => toggleCheck('attestationSituationFiscale')}
        style={{ width: '20px', height: '20px' }}
      />
      <span className="text-sm" style={{ fontWeight: 600 }}>Attestation de Situation Fiscale</span>
    </label>
    {dossier.attestationSituationFiscale && <CheckCircle size={20} color="var(--green)" />}
  </div>
  <a 
    href="https://esintax.impots.bf" 
    target="_blank" 
    rel="noopener noreferrer"
    className="btn btn-outline btn-sm"
    style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
  >
    <ExternalLink size={16} /> Accéder à eSINTAX
  </a>
</div>
```

### Étape 3 : Mettre à Jour le Calcul de Progression

```javascript
// Modifier la fonction calculateProgress
const calculateProgress = () => {
  const checks = [
    dossier.attestationImpots,
    dossier.attestationCNSS,
    dossier.attestationRCCM,
    dossier.attestationIFU,
    dossier.attestationARCOP,
    dossier.attestationSituationFiscale, // ← Ajouter ici
    dossier.lettresoumission,
    dossier.declarationProbite,
    dossier.enveloppe1Complete,
    dossier.enveloppe2Complete,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};
```

---

## 2️⃣ Créer un Nouveau Type de Document ARCOP

### Étape 1 : Ajouter la Fonction de Génération

**Fichier : `src/app/api/generate-doc/route.js`**

```javascript
// Ajouter cette fonction après generateDeclarationProbite

function generateCahierCharges({ marcheTitle, entreprise, rccm, ifu, budget }) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return new Document({
    sections: [{
      properties: {},
      children: [
        // Titre
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'CAHIER DES CHARGES',
              bold: true,
              size: 28,
              underline: {},
            }),
          ],
          spacing: { after: 600 },
        }),

        // Référence du marché
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: 'Marché : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: marcheTitle,
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Entreprise
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: 'Soumissionnaire : ',
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: entreprise,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section 1
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: '1. OBJET DU MARCHÉ',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: '[Décrire l\'objet détaillé du marché...]',
              size: 22,
              italics: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section 2
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: '2. BUDGET PRÉVISIONNEL',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: `Budget estimé : ${budget || '[À compléter]'} FCFA`,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Signature
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `Fait à Ouagadougou, le ${date}`,
              size: 22,
            }),
          ],
        }),
      ],
    }],
  });
}
```

### Étape 2 : Ajouter le Type dans la Route GET

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type');
  const marcheTitle = searchParams.get('marcheTitle') || '';
  const entreprise = searchParams.get('entreprise') || '';
  const rccm = searchParams.get('rccm') || '';
  const ifu = searchParams.get('ifu') || '';
  const budget = searchParams.get('budget') || ''; // ← Nouveau paramètre

  if (!type || !entreprise || !rccm) {
    return new Response('Paramètres manquants', { status: 400 });
  }

  let doc;

  if (type === 'lettre-soumission') {
    doc = generateLettreSoumission({ marcheTitle, entreprise, rccm, ifu });
  } else if (type === 'declaration-probite') {
    doc = generateDeclarationProbite({ marcheTitle, entreprise, rccm, ifu });
  } else if (type === 'cahier-charges') { // ← Nouveau type
    doc = generateCahierCharges({ marcheTitle, entreprise, rccm, ifu, budget });
  } else {
    return new Response('Type de document invalide', { status: 400 });
  }

  // ... reste du code
}
```

### Étape 3 : Ajouter le Bouton dans l'Interface

**Fichier : `src/app/(client)/marches/dossier/page.js`**

```javascript
{/* Cahier des charges */}
<div style={{ 
  padding: '16px', 
  background: dossier.cahierCharges ? 'var(--success-muted)' : 'var(--color-surface-2)',
  border: `1px solid ${dossier.cahierCharges ? 'var(--green)' : 'var(--color-border)'}`,
  borderRadius: '8px'
}}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {dossier.cahierCharges && <CheckCircle size={20} color="var(--green)" />}
      <span className="text-sm" style={{ fontWeight: 600 }}>Cahier des Charges</span>
    </div>
  </div>
  <button 
    onClick={() => generateDocument('cahier-charges')}
    className="btn btn-accent btn-sm"
    style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
  >
    <Printer size={16} /> Générer le document
  </button>
</div>
```

---

## 3️⃣ Ajouter une Notification Email

### Étape 1 : Créer un Hook de Sauvegarde

**Fichier : `src/app/(client)/marches/dossier/page.js`**

```javascript
// Ajouter un useEffect pour détecter les 100%
useEffect(() => {
  const progress = calculateProgress();
  
  if (progress === 100 && user && marche) {
    // Envoyer une notification
    notifyCompletion();
  }
}, [dossier]); // Se déclenche à chaque changement du dossier

const notifyCompletion = async () => {
  try {
    await fetch('/api/notify-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        marcheId: marche.id,
        marcheTitle: marche.title,
        userEmail: user.email,
      }),
    });
  } catch (err) {
    console.error('Erreur notification:', err);
  }
};
```

### Étape 2 : Créer la Route API

**Fichier : `src/app/api/notify-completion/route.js`**

```javascript
import { sendEmail } from '@/lib/mail';

export async function POST(request) {
  const body = await request.json();
  const { userId, marcheId, marcheTitle, userEmail } = body;

  // Validation
  if (!userId || !marcheId || !userEmail) {
    return new Response('Paramètres manquants', { status: 400 });
  }

  // Préparer l'email
  const emailContent = `
    <h2>🎉 Félicitations ! Votre dossier est complet !</h2>
    <p>Bonjour,</p>
    <p>Nous avons le plaisir de vous informer que votre dossier de candidature pour le marché suivant est maintenant à 100% :</p>
    <p><strong>${marcheTitle}</strong></p>
    <p>Vous êtes prêt à soumettre votre candidature !</p>
    <h3>Prochaines étapes :</h3>
    <ol>
      <li>Imprimez tous vos documents</li>
      <li>Organisez vos enveloppes</li>
      <li>Soumettez votre dossier avant la date limite</li>
    </ol>
    <p>Bonne chance ! 🍀</p>
    <p><em>L'équipe Wend-Kabré</em></p>
  `;

  try {
    await sendEmail({
      to: userEmail,
      subject: `✅ Dossier complet : ${marcheTitle}`,
      html: emailContent,
    });

    return Response.json({ success: true, message: 'Email envoyé' });
  } catch (err) {
    console.error('Erreur envoi email:', err);
    return new Response('Erreur envoi email', { status: 500 });
  }
}
```

---

## 4️⃣ Ajouter un Rappel Automatique

### Créer un Cron Job Vercel

**Fichier : `src/app/api/cron/remind-incomplete/route.js`**

```javascript
import { db } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/mail';

export async function GET(request) {
  // Vérifier le secret du cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Récupérer tous les dossiers incomplets
    const dossiersSnap = await db.collection('dossiers').get();
    const reminders = [];

    for (const dossierDoc of dossiersSnap.docs) {
      const dossier = dossierDoc.data();
      
      // Calculer la progression
      const checks = [
        dossier.attestationImpots,
        dossier.attestationCNSS,
        dossier.attestationRCCM,
        dossier.attestationIFU,
        dossier.attestationARCOP,
        dossier.lettresoumission,
        dossier.declarationProbite,
        dossier.enveloppe1Complete,
        dossier.enveloppe2Complete,
      ];
      const completed = checks.filter(Boolean).length;
      const progress = Math.round((completed / checks.length) * 100);

      // Si incomplet et non mis à jour depuis 7 jours
      if (progress < 100 && dossier.lastUpdated) {
        const lastUpdate = new Date(dossier.lastUpdated);
        const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince >= 7) {
          // Récupérer les infos utilisateur
          const userSnap = await db.collection('users').doc(dossier.userId).get();
          const userData = userSnap.data();
          
          // Récupérer les infos marché
          const marcheSnap = await db.collection('marches').doc(dossier.marcheId).get();
          const marcheData = marcheSnap.data();

          // Envoyer un rappel
          await sendEmail({
            to: userData.email,
            subject: `⏰ N'oubliez pas de compléter votre dossier : ${marcheData.title}`,
            html: `
              <h2>Rappel : Dossier incomplet</h2>
              <p>Bonjour ${userData.name},</p>
              <p>Votre dossier pour le marché <strong>${marcheData.title}</strong> est incomplet (${progress}%).</p>
              <p><a href="https://wend-kabre.bf/marches/dossier?id=${dossier.marcheId}">Continuer mon dossier →</a></p>
            `,
          });

          reminders.push({ userId: dossier.userId, marcheId: dossier.marcheId, progress });
        }
      }
    }

    return Response.json({ 
      success: true, 
      reminders: reminders.length,
      details: reminders 
    });
  } catch (err) {
    console.error('Erreur cron rappels:', err);
    return new Response('Erreur cron', { status: 500 });
  }
}
```

### Configurer le Cron dans Vercel

**Fichier : `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/remind-incomplete",
      "schedule": "0 9 * * *"
    }
  ]
}
```

*(Exécute tous les jours à 9h du matin)*

---

## 5️⃣ Ajouter une Validation de Document

### Créer un Composant d'Upload

**Fichier : `src/components/client/DocumentUploader.jsx`**

```javascript
'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DocumentUploader({ documentType, onValidated }) {
  const [file, setFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateDocument(selectedFile);
    }
  };

  const validateDocument = async (file) => {
    setValidating(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    try {
      const res = await fetch('/api/validate-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
      
      if (data.valid) {
        onValidated?.(documentType);
      }
    } catch (err) {
      setResult({ valid: false, message: 'Erreur de validation' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div style={{ 
      padding: '16px', 
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px'
    }}>
      <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
        <Upload size={16} />
        {file ? file.name : 'Télécharger le document'}
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
        />
      </label>

      {validating && (
        <p className="text-xs text-muted" style={{ marginTop: '8px', textAlign: 'center' }}>
          Validation en cours...
        </p>
      )}

      {result && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: result.valid ? 'var(--success-muted)' : 'var(--danger-muted)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {result.valid ? <CheckCircle size={16} color="var(--green)" /> : <AlertTriangle size={16} color="var(--danger)" />}
          <span className="text-xs">{result.message}</span>
        </div>
      )}
    </div>
  );
}
```

### Créer l'API de Validation

**Fichier : `src/app/api/validate-document/route.js`**

```javascript
export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const type = formData.get('type');

  if (!file || !type) {
    return Response.json({ valid: false, message: 'Fichier ou type manquant' }, { status: 400 });
  }

  // Vérifications de base
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return Response.json({ valid: false, message: 'Fichier trop volumineux (max 5 MB)' });
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ valid: false, message: 'Type de fichier non autorisé' });
  }

  // Validation spécifique selon le type
  let validationResult = { valid: true, message: 'Document valide' };

  if (type === 'attestationImpots') {
    // Vérifier que c'est un PDF récent (< 3 mois)
    // Ici, on ferait de l'OCR ou de l'analyse de métadonnées
    validationResult = await validateAttestation(file, 'impots');
  }

  return Response.json(validationResult);
}

async function validateAttestation(file, source) {
  // Simulation de validation
  // En production, utiliser Tesseract.js ou une API d'OCR
  return {
    valid: true,
    message: `Attestation ${source} valide`,
  };
}
```

---

## 6️⃣ Ajouter des Statistiques au Dashboard

### Créer un Composant de Stats

**Fichier : `src/app/(client)/dashboard/page.js`**

```javascript
// Ajouter cette section dans le Dashboard

const [stats, setStats] = useState({
  totalDossiers: 0,
  dossiersComplets: 0,
  tempssMoyen: 0,
});

useEffect(() => {
  const calculateStats = async () => {
    if (!user) return;
    
    try {
      const dossiersSnap = await getDocs(
        query(collection(db, 'dossiers'), where('userId', '==', user.uid))
      );

      let total = 0;
      let complets = 0;
      let durees = [];

      dossiersSnap.forEach(doc => {
        const data = doc.data();
        total++;

        // Calculer progression
        const checks = [
          data.attestationImpots,
          data.attestationCNSS,
          data.attestationRCCM,
          data.attestationIFU,
          data.attestationARCOP,
          data.lettresoumission,
          data.declarationProbite,
          data.enveloppe1Complete,
          data.enveloppe2Complete,
        ];
        const completed = checks.filter(Boolean).length;
        const progress = (completed / checks.length) * 100;

        if (progress === 100) {
          complets++;
          
          // Calculer la durée (si créé et complété)
          if (data.createdAt && data.lastUpdated) {
            const debut = new Date(data.createdAt);
            const fin = new Date(data.lastUpdated);
            const heures = (fin - debut) / (1000 * 60 * 60);
            durees.push(heures);
          }
        }
      });

      const moyenneHeures = durees.length > 0 
        ? durees.reduce((a, b) => a + b, 0) / durees.length 
        : 0;

      setStats({
        totalDossiers: total,
        dossiersComplets: complets,
        tempsMoyen: Math.round(moyenneHeures * 10) / 10,
      });
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  calculateStats();
}, [user]);

// Affichage des stats
<div className="card" style={{ marginBottom: '32px' }}>
  <h3 className="heading-sm" style={{ marginBottom: '16px' }}>📊 Mes Statistiques</h3>
  <div className="grid grid-3 gap-4">
    <div>
      <span className="text-sm text-muted">Total dossiers</span>
      <p className="text-2xl font-bold text-primary">{stats.totalDossiers}</p>
    </div>
    <div>
      <span className="text-sm text-muted">Dossiers complets</span>
      <p className="text-2xl font-bold text-green">{stats.dossiersComplets}</p>
    </div>
    <div>
      <span className="text-sm text-muted">Temps moyen</span>
      <p className="text-2xl font-bold text-accent">{stats.tempsMoyen}h</p>
    </div>
  </div>
</div>
```

---

## 🎓 Bonnes Pratiques

### 1. Toujours Valider les Données

```javascript
// ❌ Mauvais
await updateDoc(doc(db, 'dossiers', dossierId), dossier);

// ✅ Bon
if (!user || !marcheId) {
  showToast('Données manquantes', 'error');
  return;
}

await updateDoc(doc(db, 'dossiers', `${user.uid}_${marcheId}`), {
  ...dossier,
  lastUpdated: new Date().toISOString(),
});
```

### 2. Gérer les Erreurs Proprement

```javascript
try {
  await saveDossier();
  showToast('Sauvegarde réussie !', 'success');
} catch (err) {
  console.error('Erreur:', err);
  showToast(`Erreur : ${err.message}`, 'error');
}
```

### 3. Optimiser les Lectures Firebase

```javascript
// ❌ Mauvais : Lecture multiple
for (const marcheId of marcheIds) {
  const snap = await getDoc(doc(db, 'marches', marcheId));
  // ...
}

// ✅ Bon : Batch read
const snaps = await Promise.all(
  marcheIds.map(id => getDoc(doc(db, 'marches', id)))
);
```

---

## 🔗 Ressources Utiles

### Documentation Officielle
- [Next.js App Router](https://nextjs.org/docs/app)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [docx Library](https://docx.js.org/)

### Outils de Développement
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)

---

**Besoin d'aide ?** Consultez la documentation complète ou contactez l'équipe de développement !

