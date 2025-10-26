import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion as m } from 'framer-motion';
import { signInWithPopup, signInWithRedirect, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// UI (shadcn y lucide)
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // Hook para notificaciones
import { Loader2 } from 'lucide-react';
import logoBoreal from '@/images/logo.png';

// Icono de Google (inline SVG ya que no está en lucide)
const IconGoogle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.908 8.908 0 0 0 8.934 8.934c4.956 0 8.641-3.52 8.641-8.781 0-.593-.053-1.165-.154-1.722z"/>
  </svg>
);

const LoginPage = () => {
  const [loading, setLoading] = useState(null); // 'google' | null
  const { toast } = useToast(); // Hook de shadcn
  const [isWeb, setIsWeb] = useState(true);

  React.useEffect(() => {
    setIsWeb(Capacitor.getPlatform() === 'web');
  }, []);

  // Eliminado soporte de email/contraseña. Solo Google.

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase no está configurado o el proveedor de Google no está disponible.');
      }
      // Si estamos en plataforma nativa (Android/iOS), usar plugin nativo para no salir del app
      const platform = Capacitor.getPlatform();
      if (platform !== 'web') {
        try {
          const { credential } = await FirebaseAuthentication.signInWithGoogle({
            scopes: ['email', 'profile'],
          });
          const idToken = credential?.idToken;
          if (!idToken) throw new Error('No se recibió idToken de Google.');
          const firebaseCred = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, firebaseCred);
        } catch (nativeErr) {
          console.error('Login nativo con Google falló:', nativeErr);
          // No hacer fallback a navegador para evitar abrirlo fuera de la app
          throw nativeErr;
        }
      } else {
        // Web: intentar popup y si falla, redirect
        await signInWithPopup(auth, googleProvider);
      }
      // onAuthStateChanged en App.jsx se encargará del resto
    } catch (err) {
      console.error(err);
      const code = err && err.code ? String(err.code) : '';
      if (code === 'auth/popup-blocked' && Capacitor.getPlatform() === 'web') {
        // Fallback automático a redirect si el popup fue bloqueado
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (e) {
          console.error('Fallback a redirect falló:', e);
        }
      }
      let description = (err && (err.message || err.code)) ? String(err.message || err.code) : 'No se pudo iniciar sesión con Google.';
      if (code === 'auth/operation-not-allowed') {
        description = 'El proveedor de Google no está habilitado. Ve a Firebase Console > Authentication > Sign-in method y habilita “Google” (elige un Support email) y guarda.';
      } else if (code === 'auth/unauthorized-domain') {
        description = 'Dominio no autorizado. En Firebase Console > Authentication > Settings > Authorized domains, agrega localhost y 127.0.0.1 (los puertos no importan).';
      }
      toast({ title: 'Error con Google', description, variant: 'destructive' });
    }
    setLoading(false);
  };

return (
  <div className="min-h-screen min-h-dvh w-full bg-boreal-dark relative overflow-hidden">
    {/* Fondo animado */}
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div
        className="absolute top-0 left-0 w-full h-full animate-move-bg"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 20% 30%, rgba(105,230,175,0.45) 0%, rgba(49,98,237,0.35) 60%, rgba(190,88,240,0.32) 100%)'
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-full h-full animate-move-bg-reverse"
        style={{
          background:
            'radial-gradient(ellipse 110% 80% at 80% 70%, rgba(49,98,237,0.38) 0%, rgba(190,88,240,0.32) 60%, rgba(105,230,175,0.28) 100%)'
        }}
      />
    </div>
    <div className="relative z-10 min-h-screen min-h-dvh w-full flex items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md sm:w-[420px] mx-auto p-6 sm:p-8 rounded-3xl shadow-2xl bg-[#0a1836] bg-opacity-95 backdrop-blur-lg border border-white/20"
      >
        <Helmet>
          <title>Iniciar Sesión - Borea Wallet</title>
        </Helmet>
        <div className="flex flex-col items-center mb-3">
          <img
            src={logoBoreal}
            alt="Logo Boreal"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain mb-2 drop-shadow-lg"
          />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-boreal-aqua to-boreal-blue drop-shadow-lg">
              Accede a tu Wallet
            </span>
          </h2>
        </div>
        <p className="text-center text-gray-200 mb-8 text-base font-medium">
          Inicia sesión con tu cuenta de Google para ver tus certificados, puntos, y recompensas.
        </p>
        <Button
          variant="outline"
          className="w-full border-white/30 text-white bg-boreal-blue/30 hover:bg-boreal-blue/50 hover:scale-[1.03] transition-all duration-200 shadow-lg flex items-center justify-center gap-2 py-2 text-lg font-semibold"
          onClick={handleGoogleLogin}
          disabled={loading === 'google'}
        >
          {loading === 'google' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <IconGoogle className="w-5 h-5 mr-2" />
          )}
          Ingresar con Google
        </Button>
        {/* Espaciador visual */}
        {isWeb && (
          <div className="w-full flex items-center my-5">
            <hr className="flex-grow border-t border-gray-400 opacity-50" />
            <span className="mx-4 text-gray-400 font-semibold select-none">O</span>
            <hr className="flex-grow border-t border-gray-400 opacity-50" />
          </div>
        )}
        {/* Botón para descargar la app Android solo en web */}
        {isWeb && (
          <a
            href="https://github.com/Jose21NC/Boreal-Labs-Wallet/releases/download/Android/app-release.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full block"
          >
            <Button
              variant="default"
              className="w-full bg-boreal-aqua/80 hover:bg-boreal-aqua text-boreal-dark font-semibold flex items-center justify-center gap-2 py-2 text-lg shadow-lg"
            >
              {/* Icono Android SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="mr-2"><path d="M17.94 7.34l1.43-2.49a.5.5 0 0 0-.18-.68.5.5 0 0 0-.68.18l-1.46 2.54A7.07 7.07 0 0 0 12 6c-1.53 0-2.96.48-4.05 1.29L6.49 4.75a.5.5 0 0 0-.68-.18.5.5 0 0 0-.18.68l1.43 2.49C4.13 9.01 2.5 11.36 2.5 14.06V17c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2v-2.94c0-2.7-1.63-5.05-3.56-6.72zM7.5 19c-.83 0-1.5-.67-1.5-1.5S6.67 16 7.5 16s1.5.67 1.5 1.5S8.33 19 7.5 19zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S17.33 19 16.5 19z"/></svg>
              Descargar app Android
            </Button>
          </a>
        )}
      </m.div>
    </div>
  </div>
);
}

export default LoginPage;