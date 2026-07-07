import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

export default function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '70px' }}>
        <EmailVerificationBanner />
        {children}
        <Footer />
      </div>
    </>
  );
}
