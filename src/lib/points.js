import { doc, getDoc, getDocs, increment, serverTimestamp, onSnapshot, runTransaction, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Escuchar el saldo de puntos del usuario en tiempo real (doc: userPoints/{uid})
export function listenUserPoints(uid, callback) {
  const ref = doc(db, 'userPoints', uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback({ balance: 0 });
    } else {
      callback(snap.data());
    }
  });
}

// Listar historial de canjes: userPoints/{uid}/redemptions (más recientes primero)
export function listenRedemptions(uid, callback, max = 20) {
  const ref = collection(db, 'userPoints', uid, 'redemptions');
  const q = query(ref, orderBy('redeemedAt', 'desc'), limit(max));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  });
}

// Listar compras (salidas de puntos) más recientes
export function listenPurchases(uid, callback, max = 20) {
  const ref = collection(db, 'userPoints', uid, 'purchases');
  const q = query(ref, orderBy('purchasedAt', 'desc'), limit(max));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  });
}

// Listar asignaciones manuales de puntos (adminGrants)
export function listenAdminGrants(uid, callback, max = 20) {
  const ref = collection(db, 'userPoints', uid, 'adminGrants');
  const q = query(ref, orderBy('grantedAt', 'desc'), limit(max));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  });
}

// Asignar puntos por correo (modo admin): busca userPoints donde email == correo
// y agrega puntos al balance. Registra un log en userPoints/{uid}/adminGrants.
export async function awardPointsByEmail(targetEmail, amount, adminEmail, note = '') {
  const email = String(targetEmail || '').trim().toLowerCase();
  const pts = Number(amount);
  if (!email) throw new Error('Correo requerido');
  if (!pts || pts <= 0) throw new Error('Monto de puntos inválido');

  const upCol = collection(db, 'userPoints');
  const q = query(upCol, where('email', '==', email), limit(1));
  const qs = await getDocs(q);
  if (qs.empty) {
    throw new Error('No se encontró un usuario con ese correo. Pídele que inicie sesión primero.');
  }
  const userDoc = qs.docs[0];
  const uid = userDoc.id;
  const userPointsRef = doc(db, 'userPoints', uid);
  const grantsCol = collection(db, 'userPoints', uid, 'adminGrants');

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userPointsRef);
    if (!snap.exists()) {
      tx.set(userPointsRef, { balance: pts, updatedAt: serverTimestamp(), email });
    } else {
      tx.update(userPointsRef, { balance: increment(pts), updatedAt: serverTimestamp(), email });
    }
    const grantRef = doc(grantsCol);
    tx.set(grantRef, {
      amount: pts,
      email,
      note: note || '',
      grantedAt: serverTimestamp(),
      grantedBy: adminEmail || null,
      type: 'manual-award',
    });
  });

  return { email, amount: pts, uid };
}

// Ajustar puntos (suma o resta) asegurando que el saldo no quede negativo.
// Útil para correcciones manuales desde el panel admin oculto.
export async function adjustPointsByEmail(targetEmail, delta, adminEmail, note = '') {
  const email = String(targetEmail || '').trim().toLowerCase();
  const change = Number(delta);
  if (!email) throw new Error('Correo requerido');
  if (!Number.isFinite(change) || change === 0) throw new Error('Monto de ajuste inválido');

  const upCol = collection(db, 'userPoints');
  const q = query(upCol, where('email', '==', email), limit(1));
  const qs = await getDocs(q);
  if (qs.empty) {
    throw new Error('No se encontró un usuario con ese correo. Pídele que inicie sesión primero.');
  }

  const userDoc = qs.docs[0];
  const uid = userDoc.id;
  const userPointsRef = doc(db, 'userPoints', uid);
  const grantsCol = collection(db, 'userPoints', uid, 'adminGrants');

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userPointsRef);
    const currentBalance = Number((snap.exists() ? snap.data().balance : 0) || 0);
    const nextBalance = currentBalance + change;
    if (nextBalance < 0) throw new Error('El ajuste dejaría el saldo en negativo');

    if (!snap.exists()) {
      tx.set(userPointsRef, { balance: nextBalance, updatedAt: serverTimestamp(), email });
    } else {
      tx.update(userPointsRef, { balance: nextBalance, updatedAt: serverTimestamp(), email });
    }

    const grantRef = doc(grantsCol);
    tx.set(grantRef, {
      amount: change,
      balanceAfter: nextBalance,
      email,
      note: note || '',
      grantedAt: serverTimestamp(),
      grantedBy: adminEmail || null,
      type: 'manual-adjust',
    });
  });

  return { email, delta: change, uid };
}

// Traer info de un código antes de canjear (para previsualizar)
async function resolvePointCodeDoc(codeId) {
  const id = String(codeId).trim();
  if (!id) throw new Error('Código vacío');
  // 1) Intentar por ID de documento = código (modo tradicional)
  const directRef = doc(db, 'pointCodes', id);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) return { ref: directRef, snap: directSnap };
  // 2) Soporte Rowy: buscar por campo 'code'
  const byCodeQ = query(collection(db, 'pointCodes'), where('code', '==', id), limit(1));
  let qs = await getDocs(byCodeQ);
  if (!qs.empty) {
    const docSnap = qs.docs[0];
    return { ref: docSnap.ref, snap: docSnap };
  }
  // 3) Alternativa: buscar por campo 'id'
  const byIdFieldQ = query(collection(db, 'pointCodes'), where('id', '==', id), limit(1));
  qs = await getDocs(byIdFieldQ);
  if (!qs.empty) {
    const docSnap = qs.docs[0];
    return { ref: docSnap.ref, snap: docSnap };
  }
  throw new Error('Código no válido');
}

export async function fetchCodeInfo(code) {
  const { snap } = await resolvePointCodeDoc(code);
  const data = snap.data();
  let expiresAt = null;
  try {
    if (data.expiresAt?.toDate) expiresAt = data.expiresAt.toDate();
  } catch (err) {
    console.debug('No se pudo convertir expiresAt a Date:', err?.message || err);
  }
  // Retornamos id = el código ingresado (no el docId aleatorio) para mantener UX
  return { id: String(code).trim(), ...data, expiresAt };
}

// Redimir un código: pointCodes/{code} -> amount
// Transacción: marca el código como usado y suma al balance del usuario
export async function redeemCodeTransaction(uid, code, userEmail) {
  if (!uid) throw new Error('Usuario no autenticado');
  const codeId = String(code).trim();
  if (!codeId) throw new Error('Código vacío');
  // Resolver referencia del documento, compatible con Rowy (IDs aleatorios)
  const { ref: codeRef } = await resolvePointCodeDoc(codeId);
  const userPointsRef = doc(db, 'userPoints', uid);
  const redemptionRef = doc(collection(db, 'userPoints', uid, 'redemptions'), codeId);

  return runTransaction(db, async (tx) => {
    // 1) LECTURAS (todas antes de cualquier escritura)
    const [codeSnap, userSnap] = await Promise.all([
      tx.get(codeRef),
      tx.get(userPointsRef),
    ]);

    if (!codeSnap.exists()) throw new Error('Código no válido');
    const codeData = codeSnap.data();
    const isMultiUse = !!codeData.multiUse;
    if (!isMultiUse && (codeData.used || codeData.active === false)) throw new Error('Código ya utilizado');
    if (isMultiUse && codeData.active === false) throw new Error('Código inactivo');
    const amount = Number(codeData.amount || 0);
    if (!amount || Number.isNaN(amount)) throw new Error('Código inválido (monto)');
    // Expiración opcional
    if (codeData.expiresAt?.toDate) {
      const exp = codeData.expiresAt.toDate();
      if (exp < new Date()) throw new Error('El código expiró');
    }

    // Si es multi-uso, validar que este uid no lo haya usado antes
    let useRef, useSnap;
    if (isMultiUse) {
      const usesCol = collection(codeRef, 'uses');
      useRef = doc(usesCol, uid);
      useSnap = await tx.get(useRef);
      if (useSnap.exists()) throw new Error('Ya usaste este código');
    }

    // 2) ESCRITURAS
    if (isMultiUse) {
      // Registrar uso del uid y aumentar contador
      tx.set(useRef, { uid, usedAt: serverTimestamp(), userEmail: userEmail || null });
      tx.update(codeRef, {
        redeemedCount: increment(1),
        lastUsedAt: serverTimestamp(),
      });
    } else {
      // Dejar el código como usado (single-use)
      tx.update(codeRef, {
        used: true,
        active: false,
        usedBy: uid,
        usedAt: serverTimestamp(),
        userEmail: userEmail || null,
      });
    }

    const safeEmail = (userEmail || '').toLowerCase() || null;
    if (!userSnap.exists()) {
      tx.set(userPointsRef, { balance: amount, updatedAt: serverTimestamp(), email: safeEmail });
    } else {
      tx.update(userPointsRef, { balance: increment(amount), updatedAt: serverTimestamp(), email: safeEmail });
    }

    tx.set(redemptionRef, {
      code: codeId,
      amount,
      redeemedAt: serverTimestamp(),
      userEmail: safeEmail,
    });

    return { amount };
  });
}
