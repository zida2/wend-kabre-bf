import { env, getEnvironmentUrls } from './environment.js';

const urls = getEnvironmentUrls();

export const moneyFusionConfig = {
  apiUrl: env.MONEY_FUSION_API_URL,
  token: env.MONEY_FUSION_TOKEN,
  apiKey: env.MONEY_FUSION_API_KEY,
  webhookSecret: env.MONEY_FUSION_WEBHOOK_SECRET,
  allowedIps: env.MONEY_FUSION_ALLOWED_IPS
    ? env.MONEY_FUSION_ALLOWED_IPS.split(',').map((ip) => ip.trim()).filter(Boolean)
    : [],
  defaultCurrency: env.PAYMENT_CURRENCY,
  callbackUrl: urls.callback,
  returnUrl: urls.returnUrl,
  appSuccessUrl: urls.success,
  appCancelUrl: urls.cancel,
  appUrl: urls.app
};
