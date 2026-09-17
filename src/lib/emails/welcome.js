export const WelcomeEmail = ({ email, name }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Wend-Kabré</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <table role="presentation" style="width: 100%; background: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #059669 0%, #047857 100%); text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">Bienvenue 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Bonjour ${name || 'Ami'},</p>
              
              <p style="margin: 0 0 20px; font-size: 16px;">Merci de vous être inscrit sur <strong>Wend-Kabré</strong>! Vous avez accès à 100+ marchés publics du Burkina Faso.</p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #047857;"><strong>✅ Qu'est-ce que vous pouvez faire maintenant?</strong></p>
                <ul style="margin: 10px 0 0; padding-left: 20px;">
                  <li style="margin: 5px 0;">Accéder au tableau de bord</li>
                  <li style="margin: 5px 0;">Recevoir des alertes pour les meilleurs marchés</li>
                  <li style="margin: 5px 0;">Utiliser l'IA pour générer vos dossiers</li>
                </ul>
              </div>

              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://wend-kabre-bf.vercel.app/dashboard" style="display: inline-block; padding: 12px 40px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder au Dashboard</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280;">Besoin d'aide? <a href="mailto:support@wend-kabre.bf" style="color: #059669; text-decoration: none;">Contactez notre support</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                © 2026 Wend-Kabré. Tous droits réservés.<br>
                <a href="https://wend-kabre-bf.vercel.app/confidentialite" style="color: #059669; text-decoration: none;">Politique de confidentialité</a> |
                <a href="https://wend-kabre-bf.vercel.app/conditions" style="color: #059669; text-decoration: none;">Conditions</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
