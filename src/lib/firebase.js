import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";

// Importa las variables de entorno de Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Chequeo defensivo: no inicializar si faltan credenciales
const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

let isFirebaseConfigured = requiredKeys.every(
  (k) => typeof firebaseConfig[k] === "string" && firebaseConfig[k].length > 0
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    try {
      // Sugerencias de UX: forzar selección de cuenta
      googleProvider.setCustomParameters({ prompt: "select_account" });
    } catch {}
    // setLogLevel('debug'); // opcional
  } else {
    console.warn(
      "Firebase no configurado: faltan variables en .env (VITE_FIREBASE_*)"
    );
  }
} catch (e) {
  console.error("Error inicializando Firebase:", e);
  isFirebaseConfigured = false;
}

// Habilitar logs de Firestore para debugging (opcional)
// setLogLevel('debug');

export { app, auth, db, googleProvider, isFirebaseConfigured };
