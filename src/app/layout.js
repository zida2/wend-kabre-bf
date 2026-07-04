import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Wend-Kabré - Marchés Publics & Alertes PME au Burkina Faso',
  description: 'Plateforme de centralisation des appels d\'offres, marchés publics et notifications intelligentes pour les PME sous l\'impulsion des réformes numériques au Burkina Faso.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
