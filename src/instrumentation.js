/**
 * Exécuté une fois au démarrage de chaque instance serveur Next.js.
 * Sert ici à rendre visible, dans les logs de déploiement, quelles intégrations
 * optionnelles sont désactivées faute de configuration — plutôt que de les
 * laisser échouer silencieusement à la première requête d'un utilisateur.
 */
export async function register() {
  // Le runtime edge n'a pas accès aux mêmes variables ni à Node ; on ne
  // journalise que depuis le runtime Node.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { reportIntegrations } = await import('./lib/integrations.js');
  reportIntegrations();
}
