import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import logoUrl from '@/images/logo.png';
import { Menu, X } from 'lucide-react';

const AppNavbar = ({ user, activeTab, onNavigate }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-effect">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 md:py-5">
        <a href="#" className="flex items-center gap-3">
          <img src={logoUrl} alt="Boreal Labs" className="h-9 md:h-11 w-auto" />
          <span className="sr-only">Boreal Labs</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <button
            className={`relative pb-2 text-base transition-colors ${activeTab==='certs' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            onClick={() => onNavigate && onNavigate('certs')}
          >
            Certificados
            {activeTab==='certs' && (
              <motion.span
                layoutId="nav-underline"
                className="absolute left-0 right-0 -bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-boreal-blue to-boreal-purple"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
          <button
            className={`relative pb-2 text-base transition-colors ${activeTab==='points' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            onClick={() => onNavigate && onNavigate('points')}
          >
            Mis puntos
            {activeTab==='points' && (
              <motion.span
                layoutId="nav-underline"
                className="absolute left-0 right-0 -bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-boreal-blue to-boreal-purple"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
          <button
            className={`relative pb-2 text-base transition-colors ${activeTab==='market' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            onClick={() => onNavigate && onNavigate('market')}
          >
            Marketplace
            {activeTab==='market' && (
              <motion.span
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
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-white/10"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-7 h-7 text-white" /> : <Menu className="w-7 h-7 text-white" />}
        </button>
      </nav>
      {/* Mobile dropdown */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden border-t border-white/10 bg-white/5 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto p-4 flex flex-col gap-3">
              <button className="text-left px-3 py-2 rounded-md text-sm hover:bg-white/10" onClick={() => { onNavigate && onNavigate('certs'); setOpen(false); }}>Certificados</button>
              <button className="text-left px-3 py-2 rounded-md text-sm hover:bg-white/10" onClick={() => { onNavigate && onNavigate('points'); setOpen(false); }}>Mis puntos</button>
              <button className="text-left px-3 py-2 rounded-md text-sm hover:bg-white/10" onClick={() => { onNavigate && onNavigate('market'); setOpen(false); }}>Marketplace</button>
              <a
                href="https://borealabs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-md text-sm bg-gradient-to-r from-boreal-purple to-boreal-blue text-white text-center font-bold"
                onClick={() => setOpen(false)}
              >
                Página principal
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppNavbar;
