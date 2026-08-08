import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { apiGlobalLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './utils/errors.js';
import { moneyFusionConfig } from './config/moneyFusion.config.js';
import { env } from './config/environment.js';

const app = express();

// Trust proxy pour Render (nécessaire pour rate limiting et X-Forwarded-For)
app.set('trust proxy', 1);

const corsAllowedOrigins = (() => {
  const explicit = [
    moneyFusionConfig.appUrl,
    env.RENDER_EXTERNAL_URL.replace(/\/$/, ''),
    'https://wend-kabre.com',
    'https://www.wend-kabre.com',
    'https://payment.wend-kabre.com',
    'https://api.wend-kabre.com'
  ];
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    explicit.push('http://localhost:3000', 'http://localhost:5000');
    // En dev seulement : autoriser toute URL Render (pratique pendant tests/staging)
    return Array.from(new Set(explicit.filter(Boolean)));
  }
  // PRODUCTION : origins EXPLICITES uniquement. AUCUN wildcard *.onrender.com.
  return Array.from(new Set(explicit.filter(Boolean)));
})();

app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Appels server-to-server sans en-tête Origin :
      // Les webhooks Money Fusion n'envoient pas d'Origin. → HMAC fait la sécurité réelle.
      // On autorise pour ne pas bloquer MF.
      return callback(null, true);
    }
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = corsAllowedOrigins.some((allowed) => {
      try {
        const allowedNormalized = allowed.replace(/\/$/, '');
        if (allowedNormalized === normalizedOrigin) return true;
        const allowedHost = new URL(allowedNormalized).hostname;
        const originHost = new URL(normalizedOrigin).hostname;
        if (env.NODE_ENV !== 'production') {
          return originHost === allowedHost
            || originHost.endsWith('.' + allowedHost)
            || originHost.endsWith('.onrender.com');
        }
        // PRODUCTION : correspondance EXACTE. AUCUN wildcard.
        return originHost === allowedHost;
      } catch {
        return false;
      }
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} non autorisé sur ce service.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-moneyfusion-signature', 'x-webhook-signature', 'x-requested-with', 'signature'],
  credentials: false,
  maxAge: 86400
}));

app.use((req: any, _res, next) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    try {
      req.rawBody = Buffer.concat(chunks).toString('utf8');
    } catch {
      req.rawBody = '';
    }
    next();
  });
  if (chunks.length === 0) {
    next();
  }
});

app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    try { req.rawBody = buf.toString('utf8'); } catch { req.rawBody = ''; }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(apiGlobalLimiter);

app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    service: 'Wend-Kabré Payment Microservice',
    status: 'UP',
    version: '1.1.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/payment/return', (req: Request, res: Response) => {
  const ref = (req.query.ref as string) || (req.query.reference as string) || '';
  const rawStatus = String(req.query.status || req.query.state || 'UNKNOWN').toUpperCase();

  const isSuccess = ['SUCCESS', 'PAID', 'COMPLETED', 'OK', 'APPROVED', 'VALIDATED'].includes(rawStatus);
  const isCancelled = ['CANCELLED', 'CANCELED', 'CANCEL', 'ABORTED', 'REJECTED', 'FAILED', 'ERROR'].includes(rawStatus);

  const target = isSuccess
    ? `${moneyFusionConfig.appSuccessUrl}?ref=${encodeURIComponent(ref)}&status=SUCCESS`
    : isCancelled
      ? `${moneyFusionConfig.appCancelUrl}?ref=${encodeURIComponent(ref)}&status=${encodeURIComponent(rawStatus)}`
      : `${moneyFusionConfig.appSuccessUrl}?ref=${encodeURIComponent(ref)}&status=PENDING`;

  res.redirect(302, target);
});});

// Interception des routes inexistantes (404)
app.use((req: Request, res: Response, next) => {
  next(new NotFoundError(`Route non trouvée: [${req.method}] ${req.url}`));
});

// Middleware central de gestion des erreurs
app.use(errorHandler);

export default app;

