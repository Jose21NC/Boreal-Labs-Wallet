import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

// UI (shadcn y lucide)
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // Hook para notificaciones
import { Loader2 } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-grow flex items-center justify-center p-4"
    >
      <Helmet>
        <title>Iniciar Sesión - Borea Wallet</title>
      </Helmet>
  <div className="w-full max-w-md sm:w-[420px] p-8 rounded-2xl glass-effect">
        <h2 className="text-3xl font-bold text-center mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-boreal-aqua to-boreal-blue">
            Accede a tu Wallet
          </span>
        </h2>
        <p className="text-center text-gray-300 mb-8">
          Inicia sesión con tu cuenta de Google para ver tus certificados.
        </p>
        {/* Eliminado formulario de email/contraseña. */}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-boreal-dark px-2 text-gray-400">o</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-white/30 text-white bg-transparent hover:bg-white/10" 
          onClick={handleGoogleLogin} 
          disabled={loading === 'google'}
        >
          {loading === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <IconGoogle className="w-5 h-5 mr-2" />}
          Ingresar con Google
        </Button>
      </div>
    </motion.div>
  );
};

export default LoginPage;
