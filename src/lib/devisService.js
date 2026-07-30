import { db } from './firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';

// --- DEVIS CRUD ---

export async function createDevis(userId, devisData) {
  try {
    const docRef = await addDoc(collection(db, 'devis'), {
      userId,
      ...devisData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating devis: ", error);
    throw error;
  }
}

export async function getUserDevis(userId) {
  try {
    const q = query(collection(db, 'devis'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    let devisList = [];
    querySnapshot.forEach((doc) => {
      devisList.push({ id: doc.id, ...doc.data() });
    });
    // Sort locally by date descending if no index is created
    return devisList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } catch (error) {
    console.error("Error fetching user devis: ", error);
    throw error;
  }
}

export async function getDevisById(devisId) {
  try {
    const docRef = doc(db, 'devis', devisId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching devis: ", error);
    throw error;
  }
}

export async function updateDevis(devisId, updateData) {
  try {
    const docRef = doc(db, 'devis', devisId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating devis: ", error);
    throw error;
  }
}

export async function deleteDevis(devisId) {
  try {
    await deleteDoc(doc(db, 'devis', devisId));
    return true;
  } catch (error) {
    console.error("Error deleting devis: ", error);
    throw error;
  }
}

// --- CLIENTS CRUD ---

export async function saveClient(userId, clientData) {
  try {
    const docRef = await addDoc(collection(db, 'clients_devis'), {
      userId,
      ...clientData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving client: ", error);
    throw error;
  }
}

export async function getUserClients(userId) {
  try {
    const q = query(collection(db, 'clients_devis'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    let clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() });
    });
    return clients;
  } catch (error) {
    console.error("Error fetching clients: ", error);
    throw error;
  }
}

// --- ARTICLES CRUD ---

export async function saveArticle(userId, articleData) {
  try {
    const docRef = await addDoc(collection(db, 'articles_devis'), {
      userId,
      ...articleData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving article: ", error);
    throw error;
  }
}

export async function getUserArticles(userId) {
  try {
    const q = query(collection(db, 'articles_devis'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    let articles = [];
    querySnapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });
    return articles;
  } catch (error) {
    console.error("Error fetching articles: ", error);
    throw error;
  }
}
