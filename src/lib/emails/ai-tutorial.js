export const AiTutorialEmail = ({ name }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comment générer vos dossiers avec l'IA</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <table role="presentation" style="width: 100%; background: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">🤖 Générez en 15 minutes</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Bonjour ${name || 'Ami'},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px;">Découvrez comment notre <strong>Studio d'IA</strong> vous fait gagner 5+ heures par dossier!</p>
              
              <h3 style="margin: 30px 0 15px; font-size: 16px; color: #1f2937;">3 étapes simples:</h3>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 15px; background: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px; margin-bottom: 15px;">
                    <p style="margin: 0; font-weight: bold; color: #0c4a6e;"><strong>1. Choisir le marché</strong></p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #0c4a6e;">Cliquez sur un marché → "Générer avec l'IA"</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; background: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px; margin-bottom: 15px;">
                    <p style="margin: 0; font-weight: bold; color: #0c4a6e;"><strong>2. Vérifier les infos</strong></p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #0c4a6e;">L'IA pré-remplit les champs. Vous vérifiez et ajoutez vos données.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; background: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #0c4a6e;"><strong>3. Télécharger le dossier</strong></p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #0c4a6e;">Téléchargez en PDF/Word prêt à envoyer!</p>
                  </td>
                </tr>
              </table>

              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #047857;"><strong>✨ Résultats réels</strong></p>
                <ul style="margin: 10px 0 0; padding-left: 20px;">
                  <li style="margin: 5px 0;">Dossiers 2x plus complets</li>
                  <li style="margin: 5px 0;">Temps réduit de 80%</li>
                  <li style="margin: 5px 0;">Taux d'acceptation +45%</li>
                </ul>
              </div>

              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://wend-kabre-bf.vercel.app/marches/studio" style="display: inline-block; padding: 12px 40px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Découvrir le Studio</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280;">Questions? <a href="mailto:support@wend-kabre.bf" style="color: #059669; text-decoration: none;">support@wend-kabre.bf</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                © 2026 Wend-Kabré. Tous droits réservés.
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
