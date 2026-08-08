import { Router } from 'express';
import { z } from 'zod';
import { paymentController } from '../controllers/payment.controller.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { paymentCreateLimiter } from '../middlewares/rateLimit.middleware.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Schema de validation Zod pour la création de paiement
const createPaymentSchema = z.object({
  userId: z.string().min(1, 'userId est requis'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().optional(),
  amount: z.number().positive('Le montant doit être un nombre positif'),
  planId: z.enum(['FREE', 'PREMIUM', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'planId doit être FREE, PREMIUM ou ENTERPRISE' })
  })
});

// Schema de validation pour le callback
const callbackSchema = z.object({
  status: z.string().min(1, 'Statut requis')
}).passthrough();

/**
 * 1) Création d'un paiement
 * POST /api/payment/create
 */
router.post(
  '/create',
  paymentCreateLimiter,
  validateBody(createPaymentSchema),
  paymentController.createPayment
);

/**
 * 2) Callback / Webhook Money Fusion
 * POST /api/payment/callback
 */
router.post(
  '/callback',
  validateBody(callbackSchema),
  paymentController.handleCallback
);

/**
 * Consultation du statut d'une transaction par sa référence
 * GET /api/payment/status/:reference
 */
router.get(
  '/status/:reference',
  paymentController.getStatus
);

/**
 * 9) Dashboard Administrateur - Statistiques de paiement
 * GET /api/payment/stats
 */
router.get(
  '/stats',
  authenticateJWT,
  paymentController.getStats
);

/**
 * 10) Récupérer l'abonnement actif d'un utilisateur
 * GET /api/payment/subscription/:userId
 */
router.get(
  '/subscription/:userId',
  paymentController.getSubscription
);

export default router;
