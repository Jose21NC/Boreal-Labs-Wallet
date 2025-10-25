import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  increment,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// Escuchar productos activos
export function listenProducts(callback, { includeInactive = false } = {}) {
  const colRef = collection(db, 'productos');
  const q = query(colRef, orderBy('name'));
  return onSnapshot(q, (snap) => {
    let list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    if (!includeInactive) list = list.filter((p) => p.active !== false);
    callback(list);
  });
}

// Agregar producto (modo admin simple)
export async function addProduct({ name, price, stock = 0, imageUrl = '', active = true, description = '', tags = [] }) {
  if (!name || !price) throw new Error('Nombre y precio son obligatorios');
  const colRef = collection(db, 'productos');
  const payload = {
    name,
    price: Number(price),
    stock: Number(stock || 0),
    imageUrl: imageUrl || '',
    active: active !== false,
    description: description || '',
    tags: Array.isArray(tags) ? tags : [],
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

// Actualizar producto (modo admin)
export async function updateProduct(productId, changes) {
  if (!productId) throw new Error('Producto inválido');
  const ref = doc(db, 'productos', productId);
  const payload = {};
  const allow = ['name', 'price', 'stock', 'imageUrl', 'description', 'tags', 'active'];
  for (const k of allow) {
    if (k in changes && changes[k] !== undefined) {
      if (k === 'price' || k === 'stock') payload[k] = Number(changes[k]);
      else if (k === 'tags') payload[k] = Array.isArray(changes[k]) ? changes[k] : [];
      else payload[k] = changes[k];
    }
  }
  await updateDoc(ref, payload);
}

// Eliminar producto (modo admin)
export async function deleteProduct(productId) {
  if (!productId) throw new Error('Producto inválido');
  const ref = doc(db, 'productos', productId);
  await deleteDoc(ref);
}

// Comprar un producto con puntos (transacción)
export async function purchaseProductTransaction(uid, productId, qty = 1, userEmail, receiptId) {
  if (!uid) throw new Error('Usuario no autenticado');
  if (!productId) throw new Error('Producto inválido');
  const quantity = Math.max(1, Number(qty || 1));

  const productRef = doc(db, 'productos', productId);
  const userPointsRef = doc(db, 'userPoints', uid);
  const purchasesCol = collection(db, 'userPoints', uid, 'purchases');

  return runTransaction(db, async (tx) => {
    // LECTURAS
    const [pSnap, uSnap] = await Promise.all([tx.get(productRef), tx.get(userPointsRef)]);
    if (!pSnap.exists()) throw new Error('Producto no encontrado');
    const product = pSnap.data();
    if (product.active === false) throw new Error('Producto inactivo');
    const stock = Number(product.stock || 0);
    const price = Number(product.price || 0);
    if (!price || price < 0) throw new Error('Precio inválido');
    if (stock < quantity) throw new Error('Stock insuficiente');
    const total = price * quantity;

    const currentBalance = Number((uSnap.exists() ? uSnap.data().balance : 0) || 0);
    if (currentBalance < total) throw new Error('No tienes puntos suficientes');

    // ESCRITURAS
    tx.update(productRef, {
      stock: stock - quantity,
      lastPurchasedAt: serverTimestamp(),
    });

    const safeEmail = (userEmail || '').toLowerCase() || null;
    if (!uSnap.exists()) {
      tx.set(userPointsRef, { balance: currentBalance - total, updatedAt: serverTimestamp(), email: safeEmail });
    } else {
      tx.update(userPointsRef, { balance: increment(-total), updatedAt: serverTimestamp(), email: safeEmail });
    }

    const purchaseDoc = receiptId ? doc(purchasesCol, String(receiptId)) : doc(purchasesCol);
    tx.set(purchaseDoc, {
      receiptId: receiptId || purchaseDoc.id,
      productId,
      name: product.name,
      price,
      quantity,
      total,
      imageUrl: product.imageUrl || '',
      purchasedAt: serverTimestamp(),
      userEmail: userEmail || null,
    });

    return { total, receiptId: receiptId || purchaseDoc.id };
  });
}
