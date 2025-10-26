import React, { useState } from 'react';
import { AnimatePresence, motion as m } from 'framer-motion';
import logoUrl from '@/images/logo.png';
import { Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AppNavbar = ({ user, activeTab, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Ajustes deshabilitados globalmente por solicitud

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('No se pudo cerrar sesión:', err);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full glass-effect">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 md:py-5">
        <a href="#" className="flex items-center gap-3">
          <img src={logoUrl} alt="Boreal Labs" className="h-9 md:h-11 w-auto" />
          <span className="sr-only">Boreal Labs</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <button
            className={`relative pb-2 text-base transition-colors ${activeTab==='certs' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            onClick={() => { onNavigate && onNavigate('certs'); }}
          >
            Certificados
            {activeTab==='certs' && (
              <m.span
                layoutId="nav-underline"
                className="absolute left-0 right-0 -bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-boreal-blue to-boreal-purple"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
          <button
            className={`relative pb-2 text-base transition-colors ${activeTab==='points' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            onClick={() => { onNavigate && onNavigate('points'); }}
          >
            Mis puntos
            {activeTab==='points' && (
              <m.span
                layoutId="nav-underline"
                className="absolute left-0 right-0 -bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-boreal-blue to-boreal-purple"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
          <button
            className={`relative pb-2 text-base transition-colors ${activeTab==='market' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            onClick={() => { onNavigate && onNavigate('market'); }}
          >
            Marketplace
            {activeTab==='market' && (
              <m.span
                layoutId="nav-underline"
                className="absolute left-0 right-0 -bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-boreal-blue to-boreal-purple"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
          <a
            href="https://borealabs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-base bg-gradient-to-r from-boreal-purple to-boreal-blue text-white shadow font-bold"
          >
            Página principal
          </a>
          {user && (
            <button
              onClick={() => { setConfirmOpen(true); }}
              className="ml-1 px-3 py-2 rounded-md text-sm border border-white/15 text-white/90 hover:text-white hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          )}
          {/* Ajustes deshabilitados */}
        </div>

        {/* Mobile burger */}
        <div className="md:hidden flex items-center gap-2">
        <button
          className={`md:hidden p-2 rounded-md hover:bg-white/10 ${confirmOpen ? 'opacity-60 pointer-events-none' : ''}`}
          aria-label="Abrir menú"
          onClick={() => { setOpen((v) => !v); }}
          disabled={confirmOpen}
        >
          {open ? <X className="w-7 h-7 text-white" /> : <Menu className="w-7 h-7 text-white" />}
        </button>
        {/* Ajustes deshabilitados */}
        </div>
      </nav>
      {/* Mobile dropdown */}
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden border-t border-white/10 bg-white/5 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto p-4 flex flex-col gap-3 items-center">
              <button className="px-3 py-2 rounded-md text-sm hover:bg-white/10 text-center" onClick={() => { onNavigate && onNavigate('certs'); setOpen(false); }}>Certificados</button>
              <button className="px-3 py-2 rounded-md text-sm hover:bg-white/10 text-center" onClick={() => { onNavigate && onNavigate('points'); setOpen(false); }}>Mis puntos</button>
              <button className="px-3 py-2 rounded-md text-sm hover:bg-white/10 text-center" onClick={() => { onNavigate && onNavigate('market'); setOpen(false); }}>Marketplace</button>
              <a
                href="https://borealabs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3 py-2 rounded-md text-sm bg-gradient-to-r from-boreal-purple to-boreal-blue text-white text-center font-bold"
                onClick={() => setOpen(false)}
              >
                Página principal
              </a>
              {user && (
                <button
                  className="mt-1 px-3 py-2 rounded-md text-sm hover:bg-white/10 text-red-300 hover:text-red-200 text-center"
                  onClick={() => { setOpen(false); setConfirmOpen(true); }}
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
      {/* Confirmación de cierre de sesión */}
      <AnimatePresence>
        {confirmOpen && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setConfirmOpen(false)}
            />
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 w-[min(92vw,420px)] rounded-2xl glass-effect bg-white/10 p-5 text-center mt-10 md:mt-0"
            >
              <h3 className="text-xl font-semibold mb-1">Cerrar sesión</h3>
              <p className="text-gray-300 mb-4">¿Seguro que deseas cerrar tu sesión?</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="px-4 py-2 rounded-md border border-white/20 text-white hover:bg-white/10"
                  onClick={() => { setConfirmOpen(false); }}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-boreal-purple to-boreal-blue text-white font-bold"
                  onClick={async () => { setOpen(false); await handleSignOut(); setConfirmOpen(false); }}
                >
                  Confirmar
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
      {/* Ajustes deshabilitados globalmente */}
    </header>
  );
};

export default AppNavbar;
