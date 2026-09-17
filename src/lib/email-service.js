import { Resend } from 'resend';
import { WelcomeEmail } from './emails/welcome';
import { MarketsEmail } from './emails/markets';
import { AiTutorialEmail } from './emails/ai-tutorial';
import { PremiumOfferEmail } from './emails/premium-offer';
import { WeeklyCheckinEmail } from './emails/weekly-checkin';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'noreply@wend-kabre.bf';
const FROM_NAME = 'Wend-Kabré';

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail, userName) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: 'Bienvenue sur Wend-Kabré 🎉',
      html: WelcomeEmail({ email: userEmail, name: userName }),
      reply_to: 'support@wend-kabre.bf',
    });

    console.log('✅ Welcome email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Send markets recommendation email
 */
export async function sendMarketsEmail(userEmail, userName, marketCount = 10) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: `📋 ${marketCount} Marchés recommandés pour vous`,
      html: MarketsEmail({ name: userName, marketCount }),
      reply_to: 'support@wend-kabre.bf',
    });

    console.log('✅ Markets email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error sending markets email:', error);
    throw error;
  }
}

/**
 * Send AI tutorial email
 */
export async function sendAiTutorialEmail(userEmail, userName) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: '🤖 Générez vos dossiers en 15 minutes avec l\'IA',
      html: AiTutorialEmail({ name: userName }),
      reply_to: 'support@wend-kabre.bf',
    });

    console.log('✅ AI tutorial email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error sending AI tutorial email:', error);
    throw error;
  }
}

/**
 * Send premium offer email
 */
export async function sendPremiumOfferEmail(userEmail, userName) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: '✨ 7 Jours Premium Gratuits - Accès Illimité',
      html: PremiumOfferEmail({ name: userName }),
      reply_to: 'support@wend-kabre.bf',
    });

    console.log('✅ Premium offer email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error sending premium offer email:', error);
    throw error;
  }
}

/**
 * Send weekly check-in email
 */
export async function sendWeeklyCheckinEmail(userEmail, userName) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: '📊 Résumé de votre semaine sur Wend-Kabré',
      html: WeeklyCheckinEmail({ name: userName }),
      reply_to: 'support@wend-kabre.bf',
    });

    console.log('✅ Weekly checkin email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error sending weekly checkin email:', error);
    throw error;
  }
}

/**
 * Send email to lead (non-converting visitor)
 */
export async function sendLeadEmail(email) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: '📋 Guide: Les 50 Meilleurs Marchés du Mois',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide des marchés</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <table role="presentation" style="width: 100%; background: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #059669 0%, #047857 100%); text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">📋 Votre Guide Gratuit</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Merci d'avoir téléchargé notre guide! 🎁</p>
              <p style="margin: 0 0 30px; font-size: 16px;">Découvrez les 50 meilleurs marchés publics du Burkina Faso.</p>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://wend-kabre-bf.vercel.app/inscription" style="display: inline-block; padding: 12px 40px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Créer mon compte gratuit</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      reply_to: 'support@wend-kabre.bf',
    });

    console.log('✅ Lead email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error sending lead email:', error);
    throw error;
  }
}
