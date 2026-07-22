import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanPdfs() {
  console.log('Connexion à Firestore et récupération des marchés...');
  const marchesSnap = await getDocs(collection(db, 'marches'));
  let deletedCount = 0;

  for (const d of marchesSnap.docs) {
    const data = d.data();
    const desc = data.description || '';
    
    // Critères pour identifier les PDF illisibles
    // Soit la description mentionne explicitement "Téléchargez le document/PDF" et rien d'autre (provenant souvent de ARCOP/DGCMEF)
    const isUnreadablePdf = 
      desc.includes('Téléchargez le document officiel') || 
      desc.includes('Téléchargez le PDF officiel') ||
      data.source === 'ARCOP Burkina Faso' ||
      data.source === 'DGCMEF Burkina Faso';

    if (isUnreadablePdf) {
      await deleteDoc(doc(db, 'marches', d.id));
      console.log(`Supprimé : [${data.source}] ${data.title}`);
      deletedCount++;
    }
  }

  console.log(`Terminé ! ${deletedCount} dossiers avec PDF illisibles ont été supprimés.`);
  process.exit(0);
}

cleanPdfs().catch(console.error);
