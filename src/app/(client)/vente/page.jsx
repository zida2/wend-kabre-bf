import HeroSection from '@/components/landing/HeroSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import ExitIntentPopup from '@/components/landing/ExitIntentPopup';

export const metadata = {
  title: 'Wend-Kabré - Trouvez les Meilleurs Marchés Publics',
  description: 'Plateforme IA pour trouver et remporter les appels d\'offres publics. 500+ PME actives. 75% de succès. Gratuit.',
  openGraph: {
    title: 'Wend-Kabré - Trouvez les Meilleurs Marchés Publics',
    description: 'Plateforme IA pour trouver et remporter les appels d\'offres publics',
    type: 'website'
  }
};

export default function VentePage() {
  return (
    <main>
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <CTASection />
      <PricingSection />
      <FAQSection />
      <ExitIntentPopup />
    </main>
  );
}
