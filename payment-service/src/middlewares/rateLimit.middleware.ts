import rateLimit from 'express-rate-limit';

export const paymentCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limite chaque IP à 30 demandes de création de paiement par 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de tentatives de paiement. Veuillez réespayer dans 15 minutes.'
  }
});

export const apiGlobalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requêtes par minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Limite de requêtes API dépassée. Veuillez ralentir vos appels.'
  }
});
