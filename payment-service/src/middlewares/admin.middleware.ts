import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { prisma } from '../config/database.js';
import { AuditLogService } from '../services/auditLog.service.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger.js';

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

export async function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return next(new UnauthorizedError('Authentification requise pour accÃ©der Ã  cette ressource.'));
    }

    let role = (user.role as UserRole | undefined) || null;

    if (!role) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, email: true }
      }).catch(() => null);
      role = dbUser?.role || null;
      if (dbUser?.email && !user.email) {
        user.email = dbUser.email;
      }
    }

    if (!role || !ADMIN_ROLES.includes(role)) {
      logger.warn(`[ADMIN_MIDDLEWARE] AccÃ¨s refusÃ© user=${user.id} role=${role || 'aucun'}`);
      return next(new ForbiddenError('AccÃ¨s rÃ©servÃ© aux administrateurs.'));
    }

    user.role = role;
    logger.debug(`[ADMIN_MIDDLEWARE] AccÃ¨s autorisÃ© ${user.email || user.id} (${role})`);
    next();
  } catch (err: any) {
    logger.error(`[ADMIN_MIDDLEWARE] Erreur: ${err?.message}`);
    next(err);
  }
}

export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return next(new UnauthorizedError('Authentification requise.'));
    }
    let role = (user.role as UserRole | undefined) || null;
    if (!role) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, email: true }
      }).catch(() => null);
      role = dbUser?.role || null;
    }
    if (role !== UserRole.SUPER_ADMIN) {
      logger.warn(`[ADMIN_MIDDLEWARE] Super-Admin requis user=${user.id} role=${role}`);
      return next(new ForbiddenError('AccÃ¨s rÃ©servÃ© aux Super-Administrateurs.'));
    }
    user.role = role;
    next();
  } catch (err: any) {
    next(err);
  }
}
