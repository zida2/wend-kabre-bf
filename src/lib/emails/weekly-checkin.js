export const WeeklyCheckinEmail = ({ name }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Résumé de votre semaine</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <table role="presentation" style="width: 100%; background: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">📊 Résumé de votre semaine</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Bonjour ${name || 'Ami'},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px;">Voici ce que vous avez fait cette semaine sur Wend-Kabré:</p>
              
              <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background: #f0f9ff; border-radius: 8px; text-align: center; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #0c4a6e;">23</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #0c4a6e;">Marchés consultés</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #047857;">5</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #047857;">Favoris sauvegardés</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: #fef3c7; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #92400e;">2</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #92400e;">Dossiers générés</p>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 30px 0 15px; font-size: 16px; color: #1f2937;">🔥 Prochaines opportunités urgentes:</h3>
              <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">Fourniture de matériel - Budget: 5M FCFA</p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #92400e;">⏰ Limite: <strong>demain 17h</strong></p>
              </div>
              <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">Services informatiques - Budget: 2,5M FCFA</p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #92400e;">⏰ Limite: <strong>mercredi 18h</strong></p>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                <strong>Astuce:</strong> Les utilisateurs Premium trouvent 3x plus de marchés. Vous envisagez de passer Premium?
              </p>

              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://wend-kabre-bf.vercel.app/dashboard" style="display: inline-block; padding: 12px 40px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir votre tableau de bord</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280;">Comment pouvons-nous améliorer? <a href="mailto:support@wend-kabre.bf" style="color: #059669; text-decoration: none;">Nous aimerions entendre votre avis</a></p>
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
