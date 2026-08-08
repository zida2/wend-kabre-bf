import { IPaymentProvider } from './PaymentProvider.interface.js';
import { MoneyFusionProvider } from './MoneyFusionProvider.js';
import { OrangeMoneyProvider } from './OrangeMoneyProvider.js';
import { MoovMoneyProvider } from './MoovMoneyProvider.js';

export class PaymentProviderFactory {
  private static providers: Map<string, IPaymentProvider> = new Map<string, IPaymentProvider>([
    ['MONEY_FUSION', new MoneyFusionProvider()],
    ['ORANGE_MONEY', new OrangeMoneyProvider()],
    ['MOOV_MONEY', new MoovMoneyProvider()]
  ]);

  public static getProvider(providerName: string = 'MONEY_FUSION'): IPaymentProvider {
    const key = providerName.toUpperCase();
    const provider = this.providers.get(key);

    if (!provider) {
      // Par défaut, retourner le provider Money Fusion
      return this.providers.get('MONEY_FUSION')!;
    }

    return provider;
  }
}
