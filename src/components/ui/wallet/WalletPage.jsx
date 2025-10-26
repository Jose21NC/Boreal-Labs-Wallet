import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion as m, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PointsSection from '@/components/ui/points/PointsSection';
import Marketplace from '@/components/ui/marketplace/Marketplace';
import CertificateCard from './CertificateCard';
import { Loader2, AlertTriangleIcon } from 'lucide-react';

const WalletPage = ({ user, activeTab = 'certs', onNavigateTab }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    setLoading(true);

    // Asociación exclusivamente por correo del usuario
    // Soporta dos nombres de campo: userEmail y correoUsuario
    const colRef = collection(db, 'certificados');

    const qs = [];
    if (user.email) {
      qs.push(query(colRef, where('userEmail', '==', user.email)));
      qs.push(query(colRef, where('correoUsuario', '==', user.email)));
    }

    const resultsMap = new Map();
    let listenersFired = 0;
    const unsubs = qs.map((qRef) => onSnapshot(qRef, (snap) => {
      snap.forEach((d) => {
        resultsMap.set(d.id, { id: d.id, ...d.data() });
      });
      listenersFired += 1;
      setCertificates(Array.from(resultsMap.values()));
      if (listenersFired >= 1) setLoading(false);
    }, (error) => {
      console.error('Error al obtener certificados:', error);
      listenersFired += 1;
      if (listenersFired >= 1) setLoading(false);
    }));

    return () => unsubs.forEach((u) => u && u());
  }, [user]);

  const userName = user.displayName || user.email.split('@')[0];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl w-full mx-auto p-4 md:p-8"
    >
      <Helmet>
        <title>Boreal Wallet</title>
      </Helmet>
      {activeTab === 'certs' && (
        <>
          <h1 className="font-black tracking-tight mb-2 text-[40px] leading-[44px] sm:text-[60px] sm:leading-[60px]">
            <span className="text-white">Hola, </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-boreal-aqua to-boreal-blue">
              {userName}
            </span>
          </h1>
          <p className="text-gray-300 mb-6">
            Aquí están tus certificados y puntos de Boreal Labs.
          </p>
        </>
      )}

      {/* Navegación movida a la Navbar */}

      <AnimatePresence mode="wait">
      {activeTab==='certs' && loading && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Loader2 className="w-12 h-12 mb-4 animate-spin" />
          <p>Buscando tus certificados...</p>
        </div>
      )}

      {activeTab==='certs' && !loading && certificates.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl glass-effect p-8">
          <AlertTriangleIcon className="w-16 h-16 text-boreal-purple mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No se encontraron certificados</h2>
          <p className="text-gray-300 text-center max-w-md">
            No pudimos encontrar certificados asociados a la cuenta <span className="font-medium text-white">{user.email}</span>.
          </p>
        </div>
      )}

      {activeTab==='certs' && !loading && certificates.length > 0 && (
        <m.div
          key="certs"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))}
        </m.div>
      )}

      {activeTab==='points' && (
        <m.div key="points" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mt-4">
          <PointsSection user={user} />
        </m.div>
      )}

      {activeTab==='market' && (
        <m.div key="market" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mt-4">
          <Marketplace user={user} onViewMovements={() => onNavigateTab && onNavigateTab('points')} />
        </m.div>
      )}
      </AnimatePresence>

    </m.div>
  );
};

export default WalletPage;
export { WalletPage };
