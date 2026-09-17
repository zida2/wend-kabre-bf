export const PremiumOfferEmail = ({ name }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Débloquez l'accès illimité</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <table role="presentation" style="width: 100%; background: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">✨ 7 Jours Premium Gratuits</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Bonjour ${name || 'Ami'},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px;">Vous utilisez Wend-Kabré depuis quelques jours. Il est temps de <strong>débloquer le potentiel complet!</strong></p>
              
              <h3 style="margin: 30px 0 15px; font-size: 16px; color: #1f2937;">Ce que vous obtenez avec Premium:</h3>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #10b981; font-weight: bold;">✓</span> Marchés illimités (pas de limite de 5/mois)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #10b981; font-weight: bold;">✓</span> Analyse IA complète (pièces exigées, budget, calendrier)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #10b981; font-weight: bold;">✓</span> Studio de génération de dossiers
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #10b981; font-weight: bold;">✓</span> Alertes intelligentes en temps réel
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px;">
                    <span style="color: #10b981; font-weight: bold;">✓</span> Support 24/7 via WhatsApp
                  </td>
                </tr>
              </table>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #92400e;"><strong>🎁 Offre spéciale pour vous</strong></p>
                <p style="margin: 10px 0 0; font-size: 14px;">Essayez Premium gratuitement pendant 7 jours. Pas de carte bancaire exigée. Annulez à tout moment.</p>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280; text-align: center;">Après 7 jours: <strong>15 000 FCFA/mois</strong> (annulation à tout moment)</p>

              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://wend-kabre-bf.vercel.app/tarifs" style="display: inline-block; padding: 12px 40px; background: #d97706; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Commencer l'essai gratuit</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 13px; color: #6b7280; text-align: center;">
                Pas sûr? <a href="mailto:support@wend-kabre.bf" style="color: #d97706; text-decoration: none;">Discutez avec notre équipe</a> avant de décider.
              </p>
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
