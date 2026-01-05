import { collection, doc, endAt, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAt, where } from 'firebase/firestore';
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

// Listar usuarios con un límite fijo (sin filtro de búsqueda) ordenados por email.
export async function listUsers(max = 50) {
  const col = collection(db, 'userPoints');
  const q = query(col, orderBy('email'), limit(max));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => {
    const data = d.data() || {};
    const email = (data.email || '').toLowerCase();
    const fallbackName = email ? email.split('@')[0] : '';
    const displayName = data.displayName || data.name || data.nombre || fallbackName;
    out.push({
      uid: d.id,
      email,
      displayName,
      balance: Number(data.balance || 0),
    });
  });
  return hydrateNamesFromCertificates(out);
}

// Buscar usuarios por correo o nombre (búsqueda parcial) en userPoints.
// Primero intenta una búsqueda por prefijo en email; si falla por índices, hace fetch limitado y filtra local.
export async function searchUsers(term, max = 20) {
  const textRaw = String(term || '').trim();
  const text = textRaw.toLowerCase();
  if (!text) return [];
  const col = collection(db, 'userPoints');
  const rangeQuery = query(col, orderBy('email'), startAt(text), endAt(text + '\uf8ff'), limit(max));
  const fallbackQuery = query(col, orderBy('email'), limit(120));

  const run = async (qRef) => {
    const snap = await getDocs(qRef);
    const out = [];
    snap.forEach((d) => {
      const data = d.data() || {};
      const email = (data.email || '').toLowerCase();
      const fallbackName = email ? email.split('@')[0] : '';
      const displayName = data.displayName || data.name || data.nombre || fallbackName;
      out.push({
        uid: d.id,
        email,
        displayName,
        balance: Number(data.balance || 0),
      });
    });
    return out;
  };

  const match = (u) =>
    u.email.includes(text) || (u.displayName || '').toLowerCase().includes(text);

  // Si parece un email, intenta búsqueda por prefijo en email primero.
  const looksLikeEmail = text.includes('@');

  try {
    const base = looksLikeEmail ? await run(rangeQuery) : await run(fallbackQuery);
    const list = await hydrateNamesFromCertificates(base);
    return list.filter(match).slice(0, max);
  } catch (err) {
    // Probablemente falta índice; hacemos fallback cliente.
    try {
      const list = await hydrateNamesFromCertificates(await run(fallbackQuery));
      return list.filter(match).slice(0, max);
    } catch (e) {
      console.error('No se pudo buscar usuarios:', e);
      throw new Error('No se pudo buscar usuarios');
    }
  }
}

async function hydrateNamesFromCertificates(users) {
  const output = [...users];
  const tasks = output.map(async (u, idx) => {
    if (!u.email) return;
    const hasName = u.displayName && u.displayName.trim().length > 0;
    // Buscar certificado para obtener un nombre autoritativo
    const certCol = collection(db, 'certificados');
    const q1 = query(certCol, where('userEmail', '==', u.email), limit(1));
    const q2 = query(certCol, where('correoUsuario', '==', u.email), limit(1));
    let certSnap = await getDocs(q1);
    if (certSnap.empty) certSnap = await getDocs(q2);
    if (!certSnap.empty) {
      const data = certSnap.docs[0].data() || {};
      const nameFromCert = data.nombreUsuario || data.nombre || '';
      if (nameFromCert) {
        output[idx] = { ...u, displayName: nameFromCert };
        return;
      }
    }
    if (!hasName && u.email) {
      output[idx] = { ...u, displayName: u.email.split('@')[0] };
    }
  });
  await Promise.all(tasks);
  return output;
}

// Obtiene el doc userPoints por email normalizado.
export async function getUserPointsByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw new Error('Correo requerido');
  const col = collection(db, 'userPoints');
  const q = query(col, where('email', '==', normalized), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No se encontró usuario con ese correo');
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

// Obtiene certificados por email usando ambos campos admitidos.
export async function getUserCertificatesByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return [];
  const col = collection(db, 'certificados');
  const queries = [
    query(col, where('userEmail', '==', normalized)),
    query(col, where('correoUsuario', '==', normalized)),
  ];
  const results = new Map();
  for (const q of queries) {
    const snap = await getDocs(q);
    snap.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }));
  }
  return Array.from(results.values());
}
