import { db } from './src/lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  } catch (e) {
    console.error(e);
  }
}

main().then(() => process.exit(0));
