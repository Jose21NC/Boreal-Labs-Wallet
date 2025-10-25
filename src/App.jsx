import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './lib/firebase'; // Importa desde tu archivo de config

// Layout
import AppNavbar from '@/components/ui/layout/AppNavbar';
import AppFooter from '@/components/ui/layout/AppFooter';

// Pages
import LoginPage from '@/components/ui/auth/LoginPage';
import WalletPage from '@/components/ui/wallet/WalletPage';
import faviconUrl from '@/images/favicon-f169e2d8.png';

// UI
import { Toaster } from "@/components/ui/toaster"; // Importa el Toaster de shadcn
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('certs'); // 'certs' | 'points' | 'market'

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Si no hay config de Firebase o auth falló, marcamos listo para mostrar aviso
      setAuthReady(true);
      return;
    }
    try {
      // Listener de autenticación
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      });
      // Limpiar listener
      return () => unsubscribe();
    } catch (err) {
      console.error('No se pudo suscribir a onAuthStateChanged:', err);
      setAuthReady(true);
    }
  }, []);

  return (
    <HelmetProvider>
      <div 
        className="bg-boreal-dark text-white min-h-screen flex flex-col"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <Helmet>
          <title>Boreal Wallet</title>
          <link rel="icon" type="image/png" href={faviconUrl} />
          {/* Estilos CSS variables (opcional, ya están en index.css) */}
          <style>{`
            :root {
              --boreal-dark: #010b1d;
              --boreal-aqua: #69e6af;
              --boreal-purple: #be58f0;
              --boreal-blue: #3162ed;
            }
          `}</style>
        </Helmet>
        
        <AppNavbar
          user={user}
          activeTab={activeTab}
          onNavigate={(key) => setActiveTab(key)}
        />

        <main className="flex-grow flex flex-col items-center w-full">
          <AnimatePresence mode="wait">
            {!isFirebaseConfigured && (
              <motion.div
                key="config-warning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex items-center justify-center p-6"
              >
                <div className="max-w-lg text-center space-y-3">
                  <h2 className="text-xl font-bold">Configura Firebase</h2>
                  <p className="text-white/80">
                    Faltan variables de entorno. Crea un archivo <code>.env</code> en la raíz con las claves
                    <code> VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID</code>.
                  </p>
                  <p className="text-white/60">
                    Tras guardarlo, reinicia el servidor de desarrollo.
                  </p>
                </div>
              </motion.div>
            )}
            {!authReady && (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex items-center justify-center"
              >
                <Loader2 className="w-12 h-12 text-boreal-aqua animate-spin" />
              </motion.div>
            )}

            {authReady && isFirebaseConfigured && !user && (
              <LoginPage key="login" />
            )}

            {authReady && isFirebaseConfigured && user && (
              <WalletPage key="wallet" user={user} activeTab={activeTab} onNavigateTab={(k) => setActiveTab(k)} />
            )}
          </AnimatePresence>
        </main>

        <AppFooter />
        
        {/* El Toaster de shadcn/ui para las notificaciones */}
        <Toaster />
      </div>
    </HelmetProvider>
  );
}

export default App;
