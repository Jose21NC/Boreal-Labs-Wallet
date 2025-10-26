import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion as m } from 'framer-motion';
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
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Loader2 } from 'lucide-react';
import PrivacyPage from '@/components/ui/layout/privacy/PrivacyPage';

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('certs'); // 'certs' | 'points' | 'market'
  const isWeb = Capacitor.getPlatform() === 'web';
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isPrivacyRoute = path === '/privacy';

  // Configuración básica para apps móviles (ignorada en web)
  useEffect(() => {
    const initMobile = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        // Ocultar la barra de estado en Android/iOS (se solicitó ocultarla en Android)
        if (Capacitor.getPlatform() !== 'web') {
          await StatusBar.hide();
        }
        // Opcional: en Android puedes fijar color de fondo de la status bar
        // await StatusBar.setBackgroundColor({ color: '#010b1d' });
      } catch (err) {
        console.debug('StatusBar plugin no disponible (web):', err?.message || err);
      }
      try {
        // Oculta el splash cuando la UI esté lista
        await SplashScreen.hide();
      } catch (err) {
        console.debug('SplashScreen plugin no disponible (web):', err?.message || err);
      }
    };
    initMobile();
  }, []);

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
    <SettingsProvider>
    <HelmetProvider>
      <div 
        className="bg-boreal-dark text-white min-h-screen w-full flex flex-col overflow-x-hidden"
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
        
        {!isPrivacyRoute && user && (
          <AppNavbar
            user={user}
            activeTab={activeTab}
            onNavigate={(key) => setActiveTab(key)}
          />
        )}

        {/* Spacer para compensar navbar fija */}
        {!isPrivacyRoute && user && <div className="h-16 md:h-20" />}

        <main className="flex-grow flex flex-col items-center w-full">
          {isPrivacyRoute ? (
            <PrivacyPage />
          ) : (
          <AnimatePresence mode="wait">
            {!isFirebaseConfigured && (
              <m.div
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
              </m.div>
            )}
            {!authReady && (
              <m.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex items-center justify-center"
              >
                <Loader2 className="w-12 h-12 text-boreal-aqua animate-spin" />
              </m.div>
            )}

            {authReady && isFirebaseConfigured && !user && (
              <m.div
                key="login"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full h-full flex"
              >
                <LoginPage />
              </m.div>
            )}

            {authReady && isFirebaseConfigured && user && (
              <m.div
                key="wallet"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full h-full flex"
              >
                <WalletPage user={user} activeTab={activeTab} />
              </m.div>
            )}
          </AnimatePresence>
          )}
        </main>

  {!isPrivacyRoute && user && isWeb && <AppFooter />}
        
        {/* El Toaster de shadcn/ui para las notificaciones */}
        <Toaster />
      </div>
    </HelmetProvider>
    </SettingsProvider>
  );
}

export default App;
