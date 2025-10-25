import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion as m } from 'framer-motion';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

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

  // Eliminado soporte de email/contraseña. Solo Google.

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase no está configurado o el proveedor de Google no está disponible.');
      }
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged en App.jsx se encargará del resto
    } catch (err) {
      console.error(err);
      const code = err && err.code ? String(err.code) : '';
      if (code === 'auth/popup-blocked') {
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
        Inicia sesión con tu cuenta de Google para ver tus certificados.
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
  </m.div>
    </div>
  </div>
);
}

export default LoginPage;