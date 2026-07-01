import './globals.css';
import Navbar from '@/components/Navbar';

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
        <footer style={{
          textAlign: 'center',
          padding: '40px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-2)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <p>© 2026 Wend-Kabré. Conçu pour le développement souverain et la transparence au Burkina Faso. 🇧🇫</p>
        </footer>
      </body>
    </html>
  );
}
