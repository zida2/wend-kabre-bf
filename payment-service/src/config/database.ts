import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.databaseConnected('wend-kabre-payment-postgresql');
    logger.info('Connexion à la base de données PostgreSQL établie avec succès via Prisma.');
  } catch (error: any) {
    logger.databaseError('connect', error);
    logger.error('Échec de la connexion à la base de données:', error);
    process.exit(1);
  }
}
