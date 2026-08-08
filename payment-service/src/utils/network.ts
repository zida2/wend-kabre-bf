/**
 * Résolution de l'adresse IP cliente et correspondance CIDR.
 *
 * Deux défauts corrigés ici :
 *
 * 1. L'ancienne extraction lisait `X-Forwarded-For.split(',')[0]`. Les proxys
 *    *ajoutent* leur valeur à la fin de cet en-tête : la première entrée est
 *    donc celle envoyée par le client lui-même. N'importe qui pouvait usurper
 *    une IP autorisée avec un simple en-tête. Express, configuré avec
 *    `trust proxy`, calcule `req.ip` correctement — c'est lui qui fait foi.
 *
 * 2. La correspondance CIDR réduisait tout préfixe à ses deux premiers octets
 *    (`196.200.15.0/24` devenait `196.200`), élargissant silencieusement une
 *    whitelist /24 à un /16 entier.
 */

/** IP cliente réelle, en s'appuyant sur le réglage `trust proxy` d'Express. */
export function extractClientIp(req: any): string {
  if (!req) return 'unknown';

  // req.ip tient compte de trust proxy et de X-Forwarded-For dans le bon ordre.
  const ip = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;
  return ip ? normalizeIp(ip) : 'unknown';
}

/** Retire le préfixe IPv4-mapped-IPv6 (`::ffff:1.2.3.4`) et les espaces. */
export function normalizeIp(ip: string): string {
  const trimmed = String(ip).trim();
  return trimmed.startsWith('::ffff:') ? trimmed.slice('::ffff:'.length) : trimmed;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

/**
 * Vraie correspondance CIDR IPv4. Une entrée sans `/` est traitée comme une
 * égalité stricte.
 *
 * @param ip     adresse à tester
 * @param allowed entrée de whitelist (`1.2.3.4` ou `1.2.3.0/24`)
 */
export function ipMatchesCidr(ip: string, allowed: string): boolean {
  const candidate = normalizeIp(ip);
  const entry = normalizeIp(allowed);

  if (!entry.includes('/')) {
    return candidate === entry;
  }

  const [network, bitsRaw] = entry.split('/');
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const candidateInt = ipv4ToInt(candidate);
  const networkInt = ipv4ToInt(network);
  if (candidateInt === null || networkInt === null) return false;

  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (candidateInt & mask) === (networkInt & mask);
}
