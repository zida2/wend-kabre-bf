import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const adminRouter = Router();

// ─── Routes Administrateurs Protégées ────────────────────────────────────
// Toutes ces routes sont montées sur /api/admin et nécessitent JWT + rôle ADMIN/SUPER_ADMIN

adminRouter.get(
  '/payment/transactions',
  authenticateJWT,
  requireAdmin,
  paymentController.listTransactions
);

adminRouter.get(
  '/payment/webhooks',
  authenticateJWT,
  requireAdmin,
  paymentController.listWebhookEvents
);

adminRouter.get(
  '/audit-logs',
  authenticateJWT,
  requireAdmin,
  paymentController.listAuditLogs
);

adminRouter.patch(
  '/users/:userId/role',
  authenticateJWT,
  requireAdmin,
  paymentController.updateUserRole
);

export default adminRouter;
