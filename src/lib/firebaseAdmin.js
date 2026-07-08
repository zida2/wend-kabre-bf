// Initialisation du Firebase Admin SDK (côté serveur uniquement).
// Débloque : activation d'abonnement sécurisée (anti-fraude), moteur d'alertes
// réel (lister les utilisateurs, contourner les règles), rôles (custom claims).
//
// Clé de compte de service fournie via variables d'environnement (Vercel /
// .env.local), JAMAIS committée. Deux formats acceptés :
//   1) FIREBASE_SERVICE_ACCOUNT = le JSON complet de la clé (string)
//   2) FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL +
//      FIREBASE_ADMIN_PRIVATE_KEY (avec \n littéraux dans la clé)
let cachedApp = null;
let triedInit = false;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const json = JSON.parse(raw);
      if (json.private_key) json.private_key = json.private_key.replace(/\\n/g, '\n');
      return json;
    } catch (e) {
      console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT JSON invalide:', e?.message);
      return null;
    }
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    return { projectId, clientEmail, privateKey, project_id: projectId };
  }
  return null;
}

async function initAdmin() {
  if (cachedApp || triedInit) return cachedApp;
  triedInit = true;
  
  try {
    const { getApps, initializeApp, cert } = await import('firebase-admin/app');
    
    if (getApps().length) { cachedApp = getApps()[0]; return cachedApp; }
    const sa = loadServiceAccount();
    if (!sa) return null;
    
    cachedApp = initializeApp({
      credential: cert({
        projectId: sa.project_id || sa.projectId,
        clientEmail: sa.client_email || sa.clientEmail,
        privateKey: sa.private_key || sa.privateKey,
      }),
    });
    return cachedApp;
  } catch (e) {
    console.error('[firebaseAdmin] init ou import échouée:', e?.message);
    return null;
  }
}

export async function adminConfigured() {
  const app = await initAdmin();
  return !!app;
}

export async function getAdminDb() {
  const app = await initAdmin();
  if (!app) return null;
  const { getFirestore } = await import('firebase-admin/firestore');
  return getFirestore(app);
}

export async function getAdminAuth() {
  const app = await initAdmin();
  if (!app) return null;
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(app);
}
