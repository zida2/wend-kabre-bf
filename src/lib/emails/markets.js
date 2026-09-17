export const MarketsEmail = ({ name, marketCount = 10 }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos marchés recommandés</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <table role="presentation" style="width: 100%; background: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #059669 0%, #047857 100%); text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">📋 ${marketCount} Marchés pour Vous</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Bonjour ${name || 'Ami'},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px;">Nous avons trouvé <strong>${marketCount} marchés publics</strong> qui correspondent parfaitement à votre profil. Certains se terminent cette semaine!</p>
              
              <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #92400e;"><strong>⚠️ Attention aux délais!</strong></p>
                <p style="margin: 10px 0 0; font-size: 14px;">Certaines dates limites sont proches. Consultez votre tableau de bord dès maintenant.</p>
              </div>

              <h3 style="margin: 30px 0 15px; font-size: 16px; color: #1f2937;">Exemple de marchés trouvés:</h3>
              <ul style="margin: 0; padding: 0; list-style: none;">
                <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong>Appel d'offres - Fourniture de matériel informatique</strong><br/>
                  Budget: 5,000,000 FCFA | Limite: 3 jours
                </li>
                <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong>Marché public - Services de maintenance</strong><br/>
                  Budget: 2,500,000 FCFA | Limite: 7 jours
                </li>
                <li style="padding: 10px 0;">
                  <strong>Consultation - Audit de conformité</strong><br/>
                  Budget: 1,500,000 FCFA | Limite: 5 jours
                </li>
              </ul>

              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://wend-kabre-bf.vercel.app/marches" style="display: inline-block; padding: 12px 40px; background: #d97706; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir tous les marchés</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280;">💡 Astuce: Les marchés sont mis à jour chaque heure. Consultez votre tableau de bord régulièrement!</p>
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
