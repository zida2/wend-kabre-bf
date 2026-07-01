import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: '"Wend-Kabré AI" <zidadesire20@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });
    
    console.log("Email envoyé avec succès via Gmail:", info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error("Erreur d'envoi d'email via Gmail:", error);
    return { success: false, error: error.message };
  }
}
