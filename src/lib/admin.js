import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Escucha si un email es admin basado en la colección isAdmin.
// Soporta Rowy (IDs aleatorios): busca por campo 'email' == normalized.
// También intenta fallback por docId = email (por si hay registros antiguos).
export function listenIsAdminByEmail(email, callback) {
  if (!email) {
    callback(false);
    return () => {};
  }
  const normalized = String(email).toLowerCase();
  const col = collection(db, 'isAdmin');
  const q = query(col, where('email', '==', normalized), limit(1));

  const unsubQuery = onSnapshot(q, (snap) => {
    if (!snap.empty) {
      const data = snap.docs[0].data() || {};
      const active = data.active !== false;
      callback(active);
      return;
    }
    // Fallback: intentar docId = email
    const ref = doc(db, 'isAdmin', normalized);
    const unsubDoc = onSnapshot(ref, (docSnap) => {
      if (!docSnap.exists()) {
        callback(false);
      } else {
        const data = docSnap.data() || {};
        const active = data.active !== false;
        callback(active);
      }
    }, () => callback(false));
    // Devolver un unsub que cancele ambos
    return () => unsubDoc();
  }, () => callback(false));

  return unsubQuery;
}
