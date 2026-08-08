import jwt from 'jsonwebtoken';

/**
 * Émet le jeton HS256 attendu par payment-service.
 *
 * Le navigateur ne détient qu'un ID token Firebase (RS256, signé par Google),
 * que payment-service ne sait pas vérifier. Les routes serveur de Next.js
 * valident cet ID token avec l'Admin SDK, puis signent ce jeton de service avec
 * le `JWT_SECRET` partagé. Durée courte : il ne sert qu'à l'appel sortant.
 *
 * @param {{uid: string, email?: string, role?: 'USER'|'ADMIN'|'SUPER_ADMIN'}} params
 */
export function mintServiceJwt({ uid, email, role = 'USER' }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET absent : impossible de signer le jeton de service.');
  }
  if (!uid) {
    throw new Error('uid requis pour signer un jeton de service.');
  }
  return jwt.sign({ id: uid, userId: uid, email, role }, secret, { expiresIn: '5m' });
}
