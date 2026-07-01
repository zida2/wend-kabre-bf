import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    const data = await resend.emails.send({
      from: 'Wend-Kabré AI <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });
    
    console.log("Email envoyé avec succès via Resend:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Erreur d'envoi d'email via Resend:", error);
    return { success: false, error: error.message };
  }
}
