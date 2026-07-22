import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { translate } from '@vitalets/google-translate-api';
import dotenv from 'dotenv';
import fs from 'fs';

// Charger les variables d'environnement
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

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

// Fonction basique pour détecter l'anglais
function isEnglish(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  // Recherche de mots très communs en anglais (avec espaces pour éviter les faux positifs)
  const englishWords = [' the ', ' and ', ' of ', ' to ', ' in ', ' is ', ' for '];
  let matches = 0;
  for (const word of englishWords) {
    if (lower.includes(word)) matches++;
  }
  return matches >= 2;
}

async function translateText(text) {
  if (!text) return text;
  try {
    const { text: translated } = await translate(text, { to: 'fr' });
    return translated;
  } catch (e) {
    console.error("Erreur de traduction:", e.message);
    return text;
  }
}

async function runTranslation() {
  console.log('Connexion à Firestore et récupération des marchés...');
  const marchesSnap = await getDocs(collection(db, 'marches'));
  let translatedCount = 0;

  for (const d of marchesSnap.docs) {
    const data = d.data();
    const title = data.title || '';
    const desc = data.description || '';

    if (isEnglish(title) || isEnglish(desc)) {
      console.log(`\n📄 Détecté en anglais : ${title}`);
      console.log(`Traduction en cours...`);
      
      const newTitle = await translateText(title);
      const newDesc = await translateText(desc);

      await updateDoc(doc(db, 'marches', d.id), {
        title: newTitle,
        description: newDesc,
        originalLanguage: 'en',
        translatedAt: new Date().toISOString()
      });

      console.log(`✅ Traduit : ${newTitle}`);
      translatedCount++;
    }
  }

  console.log(`\n🎉 Terminé ! ${translatedCount} marchés ont été traduits en français.`);
  process.exit(0);
}

runTranslation().catch(console.error);
