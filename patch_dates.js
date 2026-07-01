import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
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

async function patchDates() {
  console.log("Fetching markets...");
  const snap = await getDocs(collection(db, 'marches'));
  
  const dates = [
    "2026-07-15T09:00:00Z",
    "2026-07-20T10:00:00Z",
    "2026-08-01T08:30:00Z",
    "2026-07-25T11:00:00Z"
  ];
  
  let i = 0;
  for (const document of snap.docs) {
    const deadline = dates[i % dates.length];
    const openingTime = deadline.includes('09:00') ? '09h00 GMT' : (deadline.includes('10:00') ? '10h00 GMT' : '09h30 GMT');
    
    await updateDoc(doc(db, 'marches', document.id), {
      deadline: deadline,
      openingTime: openingTime
    });
    console.log(`Updated ${document.id} with deadline ${deadline}`);
    i++;
  }
  console.log("Done updating all markets!");
  process.exit(0);
}

patchDates();
