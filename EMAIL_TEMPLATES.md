# 📧 Templates Email - Système de Paiement OCR

## Configuration SendGrid / Resend

### Variables d'environnement requises
```bash
# .env.production
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# OU
RESEND_API_KEY=re_xxxxxxxxxxxxx

EMAIL_FROM=noreply@wend-kabre.com
EMAIL_FROM_NAME=Wend-Kabré
```

---

## 📨 Template 1 : Paiement Validé (payment-approved)

### Sujet
```
✅ Paiement validé - Bienvenue sur Wend-Kabré {{plan}}
```

### Contenu HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f9fafb; padding: 40px 30px; }
    .badge { display: inline-block; background: #059669; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .info-box { background: white; border: 2px solid #d1fae5; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">✅ Paiement Validé !</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Votre abonnement est maintenant actif</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>{{userName}}</strong>,</p>
      
      <p>Nous avons le plaisir de vous confirmer que votre paiement a été validé avec succès ! 🎉</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">📋 Détails de votre abonnement</h3>
        <p><strong>Plan :</strong> <span class="badge">{{plan}}</span></p>
        <p><strong>Montant payé :</strong> {{amount}} FCFA</p>
        <p><strong>Durée :</strong> {{duration}} jours</p>
        <p><strong>Date de validation :</strong> {{validatedAt}}</p>
      </div>
      
      <p>Vous pouvez maintenant profiter de tous les avantages de votre plan {{plan}} :</p>
      <ul>
        <li>✓ Accès illimité aux marchés publics</li>
        <li>✓ Alertes personnalisées par email et SMS</li>
        <li>✓ Détails complets des appels d'offres</li>
        <li>✓ Support prioritaire</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="https://wend-kabre-bf.vercel.app/dashboard" class="button">
          Accéder à mon tableau de bord →
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Si vous avez des questions, n'hésitez pas à nous contacter :<br>
        📧 contact@wend-kabre.com<br>
        📱 WhatsApp : +226 06 13 90 16
      </p>
    </div>
    
    <div class="footer">
      <p>© 2026 Wend-Kabré • Marchés publics du Burkina Faso</p>
      <p style="font-size: 12px; margin-top: 10px;">
        Vous recevez cet email car vous avez souscrit à un abonnement sur wend-kabre.com
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 📨 Template 2 : Paiement Rejeté (payment-rejected)

### Sujet
```
❌ Paiement non validé - Action requise
```

### Contenu HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f9fafb; padding: 40px 30px; }
    .warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">❌ Paiement Non Validé</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Une vérification est nécessaire</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>{{userName}}</strong>,</p>
      
      <p>Nous vous informons que votre demande de paiement n'a pas pu être validée.</p>
      
      <div class="warning-box">
        <h3 style="margin-top: 0; color: #f59e0b;">⚠️ Détails de la demande</h3>
        <p><strong>Plan :</strong> {{plan}}</p>
        <p><strong>Montant :</strong> {{amount}} FCFA</p>
        <p><strong>Raison :</strong> {{reason}}</p>
      </div>
      
      <h3 style="color: #059669;">🔍 Raisons possibles :</h3>
      <ul>
        <li>La capture d'écran n'est pas lisible</li>
        <li>Le montant ne correspond pas au plan sélectionné</li>
        <li>Le numéro de destinataire est incorrect</li>
        <li>La transaction n'a pas été reçue</li>
      </ul>
      
      <h3 style="color: #059669;">✅ Que faire maintenant ?</h3>
      <p>Veuillez vérifier votre paiement et soumettre une nouvelle demande avec :</p>
      <ul>
        <li>Une capture d'écran claire du SMS de confirmation</li>
        <li>Le bon montant ({{amount}} FCFA)</li>
        <li>Le bon numéro de destinataire :
          <ul>
            <li><strong>Orange Money :</strong> 62 20 28 77</li>
            <li><strong>Moov Money :</strong> 06 13 90 16</li>
          </ul>
        </li>
      </ul>
      
      <div style="text-align: center;">
        <a href="https://wend-kabre-bf.vercel.app/paiement-ocr?plan={{plan_lower}}&amount={{amount}}" class="button">
          Soumettre un nouveau paiement →
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>Besoin d'aide ?</strong> Contactez notre équipe :<br>
        📧 contact@wend-kabre.com<br>
        📱 WhatsApp : +226 06 13 90 16<br>
        💬 Nous sommes disponibles du lundi au vendredi, 8h-18h
      </p>
    </div>
    
    <div class="footer">
      <p>© 2026 Wend-Kabré • Marchés publics du Burkina Faso</p>
      <p style="font-size: 12px; margin-top: 10px;">
        Vous recevez cet email car vous avez soumis une demande de paiement sur wend-kabre.com
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 📨 Template 3 : Paiement En Attente (payment-pending)

### Sujet
```
⏳ Paiement reçu - Validation en cours
```

### Contenu HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f9fafb; padding: 40px 30px; }
    .info-box { background: white; border: 2px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⏳ Paiement Reçu</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Validation en cours</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>{{userName}}</strong>,</p>
      
      <p>Nous avons bien reçu votre preuve de paiement ! 🎉</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0ea5e9;">📋 Récapitulatif</h3>
        <p><strong>Plan :</strong> {{plan}}</p>
        <p><strong>Montant :</strong> {{amount}} FCFA</p>
        <p><strong>Date de soumission :</strong> {{submittedAt}}</p>
      </div>
      
      <p>Notre équipe va vérifier votre paiement sous <strong>24 heures ouvrées</strong>.</p>
      
      <h3 style="color: #059669;">🔍 Processus de validation :</h3>
      <ol>
        <li>Vérification de la capture d'écran</li>
        <li>Confirmation du montant et du destinataire</li>
        <li>Activation de votre abonnement</li>
        <li>Envoi de l'email de confirmation</li>
      </ol>
      
      <p>Vous recevrez un email dès que votre paiement sera validé.</p>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>Vous avez une question ?</strong><br>
        📧 contact@wend-kabre.com<br>
        📱 WhatsApp : +226 06 13 90 16
      </p>
    </div>
    
    <div class="footer">
      <p>© 2026 Wend-Kabré • Marchés publics du Burkina Faso</p>
      <p style="font-size: 12px; margin-top: 10px;">
        Vous recevez cet email car vous avez soumis une demande de paiement sur wend-kabre.com
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 🛠️ Intégration API Route

### Fichier : `src/app/api/send-email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// OU Resend
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, template, data } = await request.json();
    
    if (!to || !subject || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sélectionner le template HTML
    let html = '';
    switch (template) {
      case 'payment-approved':
        html = getPaymentApprovedTemplate(data);
        break;
      case 'payment-rejected':
        html = getPaymentRejectedTemplate(data);
        break;
      case 'payment-pending':
        html = getPaymentPendingTemplate(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid template' },
          { status: 400 }
        );
    }

    // Envoyer avec SendGrid
    await sgMail.send({
      to,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@wend-kabre.com',
        name: process.env.EMAIL_FROM_NAME || 'Wend-Kabré'
      },
      subject,
      html
    });

    // OU avec Resend
    /*
    await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    */

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

function getPaymentApprovedTemplate(data: any): string {
  return `
    <!-- Coller le HTML du template payment-approved ici -->
    <!-- Remplacer {{userName}} par ${data.userName} etc. -->
  `;
}

function getPaymentRejectedTemplate(data: any): string {
  return `
    <!-- Coller le HTML du template payment-rejected ici -->
  `;
}

function getPaymentPendingTemplate(data: any): string {
  return `
    <!-- Coller le HTML du template payment-pending ici -->
  `;
}
```

---

## 📦 Installation des dépendances

```bash
# SendGrid
npm install @sendgrid/mail

# OU Resend
npm install resend
```

---

## ✅ Checklist Intégration

- [ ] Créer compte SendGrid ou Resend
- [ ] Récupérer API key
- [ ] Ajouter variables d'environnement (`.env.production` et Vercel)
- [ ] Créer route API `/api/send-email/route.ts`
- [ ] Tester l'envoi d'email en local
- [ ] Décommenter le code email dans `admin/page.js`
- [ ] Tester validation paiement → email reçu
- [ ] Vérifier les emails dans spam/indésirables
- [ ] Configurer SPF/DKIM pour domaine wend-kabre.com

---

## 🎨 Personnalisation

### Logo
Ajouter le logo Wend-Kabré dans le header :
```html
<img src="https://wend-kabre-bf.vercel.app/logo.png" alt="Wend-Kabré" style="max-width: 150px;" />
```

### Couleurs
- Primary : `#059669` (vert Wend-Kabré)
- Success : `#10b981`
- Warning : `#f59e0b`
- Danger : `#dc2626`

---

**Date** : 8 août 2026  
**Version** : 1.0  
**Status** : Templates prêts, intégration en attente
