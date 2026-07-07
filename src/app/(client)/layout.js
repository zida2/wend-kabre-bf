import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

export default function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      <EmailVerificationBanner />
      {children}
      <Footer />
    </>
  );
}
