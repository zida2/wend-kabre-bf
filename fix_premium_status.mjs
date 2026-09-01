#!/usr/bin/env node
/**
 * Script pour vérifier et corriger le statut Premium d'un utilisateur
 * Usage: node fix_premium_status.mjs <email>
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkAndFixPremiumStatus(email) {
  try {
    console.log('🔍 Recherche de l\'utilisateur:', email);
    
    // Connexion pour obtenir l'UID
    const password = process.argv[3];
    if (!password) {
      console.error('❌ Usage: node fix_premium_status.mjs <email> <password>');
      process.exit(1);
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    console.log('✅ UID:', uid);
    
    // Lecture du document utilisateur
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('❌ Utilisateur non trouvé dans Firestore');
      process.exit(1);
    }
    
    const userData = userSnap.data();
    console.log('📄 Données actuelles:', {
      email: userData.email,
      isPremium: userData.isPremium,
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionEndDate: userData.subscriptionEndDate,
    });
    
    // Vérification du statut Premium
    if (!userData.isPremium) {
      console.log('⚠️  isPremium = false, correction...');
      await updateDoc(userRef, {
        isPremium: true,
        subscriptionStatus: 'active',
        subscriptionPlan: 'premium',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
      });
      console.log('✅ Statut Premium activé !');
    } else {
      console.log('✅ L\'utilisateur est déjà Premium');
    }
    
    // Vérification finale
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();
    console.log('✅ Données finales:', {
      email: updatedData.email,
      isPremium: updatedData.isPremium,
      subscriptionStatus: updatedData.subscriptionStatus,
      subscriptionPlan: updatedData.subscriptionPlan,
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: node fix_premium_status.mjs <email> <password>');
  process.exit(1);
}

checkAndFixPremiumStatus(email);
