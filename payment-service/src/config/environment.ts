import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RENDER_EXTERNAL_URL: z.string().url().default('https://payment-service-wendkabre.onrender.com'),
  APP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET doit contenir au moins 8 caractères'),
  MONEY_FUSION_API_URL: z.string().url().default('https://api.moneyfusion.net/v1'),
  MONEY_FUSION_TOKEN: z.string().default('MF_TEST_TOKEN'),
  MONEY_FUSION_API_KEY: z.string().default('MF_TEST_API_KEY'),
  MONEY_FUSION_WEBHOOK_SECRET: z.string().default('MF_WEBHOOK_SECRET'),
  MONEY_FUSION_ALLOWED_IPS: z.string().optional(),
  PAYMENT_CURRENCY: z.string().default('XOF')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuration des variables d\'environnement invalide:', _env.error.format());
  throw new Error('Variables d\'environnement invalides.');
}

export const env = _env.data;

export interface EnvironmentUrls {
  paymentService: string;
  app: string;
  callback: string;
  returnUrl: string;
  success: string;
  cancel: string;
}

export function getEnvironmentUrls(): EnvironmentUrls {
  const nodeEnv = env.NODE_ENV;
  const paymentBase = env.RENDER_EXTERNAL_URL.replace(/\/$/, '');

  const defaultAppByEnv: Record<string, string> = {
    development: 'http://localhost:3000',
    test: 'http://localhost:3000',
    production: 'https://wend-kabre.com'
  };

  const appBase = (env.APP_URL || defaultAppByEnv[nodeEnv] || 'http://localhost:3000').replace(/\/$/, '');

  return {
    paymentService: paymentBase,
    app: appBase,
    callback: `${paymentBase}/api/payment/callback`,
    returnUrl: `${paymentBase}/api/payment/return`,
    success: `${appBase}/payment/success`,
    cancel: `${appBase}/payment/cancel`
  };
}
