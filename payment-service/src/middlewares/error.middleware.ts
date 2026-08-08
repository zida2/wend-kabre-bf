import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  logger.error(`Erreur interceptée sur [${req.method}] ${req.url}:`, err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Erreurs non gérées (500 Internal Server Error)
  return res.status(500).json({
    success: false,
    error: 'Une erreur interne est survenue sur le service de paiement.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
