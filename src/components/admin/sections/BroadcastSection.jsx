import { useState, useMemo } from 'react';
import layout from '../adminLayout.module.css';

export default function BroadcastSection({ users }) {
  const [message, setMessage] = useState('Bonjour !\nNous avons détecté de nouveaux marchés dans votre secteur d\'activité. Connectez-vous sur Wend-Kabré pour les découvrir.');
  const [sectorFilter, setSectorFilter] = useState('');

  // Extract unique sectors from users to build filter options
  const availableSectors = useMemo(() => {
    const sectors = new Set();
    users.forEach(u => {
      if (u.secteur && u.secteur !== 'Non spécifié') {
        sectors.add(u.secteur);
      }
    });
    return Array.from(sectors).sort();
  }, [users]);

  // Filter users based on sector
  const targetUsers = useMemo(() => {
    if (!sectorFilter) return users;
    return users.filter(u => u.secteur === sectorFilter);
  }, [users, sectorFilter]);

  return (
    <div className="animate-fadeIn">
      <div className={layout.card} style={{ marginBottom: '24px' }}>
        <h2 className="heading-md" style={{ marginBottom: '16px' }}>📢 Créer une campagne de relance</h2>
        <p className="text-secondary text-sm" style={{ marginBottom: '24px' }}>
          Sélectionnez un secteur d'activité, rédigez votre message, puis utilisez les liens générés pour envoyer vos messages via WhatsApp Web ou votre client Email.
        </p>

        <div className="grid grid-2 gap-4" style={{ marginBottom: '24px' }}>
          <div>
            <label className="form-label">Filtrer par secteur cible</label>
            <select 
              className="form-input" 
              value={sectorFilter} 
              onChange={(e) => setSectorFilter(e.target.value)}
            >
              <option value="">Tous les utilisateurs ({users.length})</option>
              {availableSectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Message à envoyer</label>
          <textarea 
            className="form-input" 
            rows={5} 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre message ici..."
          />
        </div>

        <div style={{ background: 'var(--success-muted)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--green)' }}>
          <p className="text-sm" style={{ fontWeight: 'bold', color: 'var(--green)', marginBottom: '8px' }}>
            Destinataires ciblés : {targetUsers.length} utilisateurs
          </p>
          <p className="text-xs text-secondary">
            Note: Étant donné que l'API WhatsApp Business n'est pas encore activée, vous devez cliquer sur chaque lien ci-dessous pour ouvrir WhatsApp Web et envoyer le message manuellement.
          </p>
        </div>
      </div>

      <div className={layout.card}>
        <h3 className="heading-sm" style={{ marginBottom: '16px' }}>Liste d'envoi ({targetUsers.length})</h3>
        
        {targetUsers.length === 0 ? (
          <p className="text-muted text-sm">Aucun utilisateur ne correspond à ce filtre.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={layout.table}>
              <thead>
                <tr>
                  <th>Nom / Email</th>
                  <th>Secteur</th>
                  <th>Téléphone</th>
                  <th>Actions d'envoi</th>
                </tr>
              </thead>
              <tbody>
                {targetUsers.map(u => {
                  const encodedMessage = encodeURIComponent(message);
                  const waLink = u.phone ? `https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}` : null;
                  const mailLink = `mailto:${u.email}?subject=Opportunités sur Wend-Kabré&body=${encodedMessage}`;
                  
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name || 'PME'}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </td>
                      <td>{u.secteur || '-'}</td>
                      <td>{u.phone || 'Non renseigné'}</td>
                      <td>
                        <div className="flex gap-2">
                          {waLink ? (
                            <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: '#25D366', color: '#fff', border: 'none' }}>
                              WhatsApp
                            </a>
                          ) : (
                            <span className="text-xs text-muted" style={{ padding: '6px' }}>Pas de tel</span>
                          )}
                          <a href={mailLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{ borderColor: 'var(--color-border)', color: 'var(--text-secondary)' }}>
                            Email
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
