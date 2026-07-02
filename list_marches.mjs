import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function listDB() {
  const marchesSnap = await getDocs(collection(db, 'marches'));
  console.log("Total markets:", marchesSnap.size);
  let count = 0;
  marchesSnap.forEach(d => {
    if (count > 5) return;
    const data = d.data();
    console.log(`\n--- Market ${count+1} ---`);
    console.log("Title:", data.title);
    console.log("Category:", data.category);
    console.log("Source:", data.source);
    console.log("Desc length:", data.description?.length);
    console.log("Desc preview:", data.description?.substring(0, 300).replace(/\n/g, ' '));
    count++;
  });
}
listDB();
