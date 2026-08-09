import { describe, it, expect } from 'vitest';
import { extractClientIp, ipMatchesCidr, normalizeIp } from './network.js';

describe('normalizeIp', () => {
  it('retire le préfixe IPv4-mapped-IPv6', () => {
    expect(normalizeIp('::ffff:196.200.15.7')).toBe('196.200.15.7');
  });

  it('laisse une IPv4 nue intacte et retire les espaces', () => {
    expect(normalizeIp('  10.0.0.1 ')).toBe('10.0.0.1');
  });
});

describe('ipMatchesCidr', () => {
  it('accepte une IP dans le bloc /24', () => {
    expect(ipMatchesCidr('196.200.15.7', '196.200.15.0/24')).toBe(true);
  });

  // Régression : l'ancienne implémentation réduisait le préfixe à ses deux
  // premiers octets, ce qui transformait un /24 en /16 et laissait passer
  // toute la plage 196.200.*.*.
  it('refuse une IP hors du /24 mais dans le même /16', () => {
    expect(ipMatchesCidr('196.200.99.9', '196.200.15.0/24')).toBe(false);
  });

  // Régression : `startsWith('196.200')` matchait aussi '196.2000...'.
  it('ne se laisse pas piéger par une correspondance de préfixe textuel', () => {
    expect(ipMatchesCidr('196.20.1.1', '196.200.15.0/24')).toBe(false);
  });

  it('gère les masques larges et étroits', () => {
    expect(ipMatchesCidr('10.1.2.3', '10.0.0.0/8')).toBe(true);
    expect(ipMatchesCidr('11.1.2.3', '10.0.0.0/8')).toBe(false);
    expect(ipMatchesCidr('10.0.0.5', '10.0.0.5/32')).toBe(true);
    expect(ipMatchesCidr('10.0.0.6', '10.0.0.5/32')).toBe(false);
    expect(ipMatchesCidr('8.8.8.8', '0.0.0.0/0')).toBe(true);
  });

  it('traite une entrée sans masque comme une égalité stricte', () => {
    expect(ipMatchesCidr('1.2.3.4', '1.2.3.4')).toBe(true);
    // Régression : `endsWith('.' + allowed)` acceptait des suffixes.
    expect(ipMatchesCidr('11.2.3.4', '1.2.3.4')).toBe(false);
  });

  it('refuse les entrées malformées plutôt que de les accepter', () => {
    expect(ipMatchesCidr('1.2.3.4', '1.2.3.0/33')).toBe(false);
    expect(ipMatchesCidr('1.2.3.4', 'pas-une-ip/24')).toBe(false);
    expect(ipMatchesCidr('999.1.1.1', '999.1.1.0/24')).toBe(false);
  });
});

describe('extractClientIp', () => {
  // Régression : l'ancienne version lisait X-Forwarded-For[0], que le client
  // contrôle entièrement — n'importe qui pouvait usurper une IP whitelistée.
  it('ignore un X-Forwarded-For forgé et retient req.ip', () => {
    const req = {
      headers: { 'x-forwarded-for': '196.200.15.7, 8.8.8.8' },
      ip: '203.0.113.9',
      socket: { remoteAddress: '203.0.113.9' },
    };
    expect(extractClientIp(req)).toBe('203.0.113.9');
  });

  it('retombe sur la socket quand req.ip est absent', () => {
    expect(extractClientIp({ headers: {}, socket: { remoteAddress: '::ffff:10.0.0.4' } })).toBe('10.0.0.4');
  });

  it('renvoie "unknown" plutôt que de lever', () => {
    expect(extractClientIp(null)).toBe('unknown');
    expect(extractClientIp({ headers: {} })).toBe('unknown');
  });
});
