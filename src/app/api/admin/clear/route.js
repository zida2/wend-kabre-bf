import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const marchesSnap = await getDocs(collection(db, 'marches'));
    const batch = [];
    marchesSnap.forEach(d => {
      batch.push(deleteDoc(doc(db, 'marches', d.id)));
    });
    await Promise.all(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
