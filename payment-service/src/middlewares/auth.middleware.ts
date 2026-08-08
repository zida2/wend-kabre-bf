import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Si aucun token n'est fourni mais que nous sommes en mode dev, laisser passer avec un utilisateur par défaut si nécessaire
    if (env.NODE_ENV === 'development' && req.body.userId) {
      req.user = {
        id: req.body.userId,
        email: req.body.email || 'user@wendkabre.bf'
      };
      return next();
    }
    return next(new UnauthorizedError('Jeton d\'authentification manquant (Bearer token requis).'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return next(new UnauthorizedError('Jeton d\'authentification invalide ou expiré.'));
  }
}
