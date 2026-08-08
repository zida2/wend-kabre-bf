import app from './app.js';
import { env } from './config/environment.js';
import { connectDatabase, prisma } from './config/database.js';
import { logger } from './utils/logger.js';

async function startServer() {
  // Connexion à la base de données
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.serverStarted(env.PORT, env.RENDER_EXTERNAL_URL, env.NODE_ENV);
    logger.info(`=======================================================`);
    logger.info(`🚀 Microservice de Paiement Wend-Kabré actif`);
    logger.info(`🌐 URL locale: http://localhost:${env.PORT}`);
    logger.info(`🌍 URL publique Render: ${env.RENDER_EXTERNAL_URL}`);
    logger.info(`📡 Mode: ${env.NODE_ENV}`);
    logger.info(`💳 Gateway principal: Money Fusion`);
    logger.info(`=======================================================`);
  });

  // Gérer l'arrêt propre de l'application (Graceful Shutdown)
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Signal ${signal} reçu. Fermeture du serveur en cours...`);
    server.close(async () => {
      logger.info('Serveur HTTP fermé.');
      await prisma.$disconnect();
      logger.info('Connexion Prisma PostgreSQL fermée.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Fermeture forcée du serveur après délai d\'attente.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Échec critique lors du démarrage du microservice:', error);
  process.exit(1);
});
