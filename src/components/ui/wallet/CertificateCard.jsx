import React from 'react';
import { motion as m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileTextIcon, DownloadIcon } from 'lucide-react';

const CertificateCard = ({ cert }) => {
  const formatDate = (date) => {
    if (!date) return 'Fecha desconocida';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const handleValidate = () => {
    // Abrir página de validación
    if (cert?.idValidacion) {
      window.open(`https://borealabs.org/validacion?id=${cert.idValidacion}`, '_blank');
    }
  };

  const getPdfUrl = () => {
    // Busca URL en diferentes posibles estructuras
    if (Array.isArray(cert?.urlPdf) && cert.urlPdf.length > 0) {
      return cert.urlPdf[0]?.downloadURL || cert.urlPdf[0]?.url || null;
    }
    if (cert?.urlPdf?.downloadURL) return cert.urlPdf.downloadURL;
    if (cert?.downloadURL) return cert.downloadURL;
    return null;
  };

  const handleDownload = () => {
    const pdfUrl = getPdfUrl();
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };

  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-2xl p-6 glass-effect flex flex-col justify-between transition-all duration-300 hover:border-boreal-aqua/50"
    >
      <div>
        <div className="flex items-center space-x-3 mb-3">
          <FileTextIcon className="w-8 h-8 text-boreal-aqua" />
          <h3 className="text-xl font-bold text-boreal-aqua truncate">
            {cert.nombreEvento || 'Evento Desconocido'}
          </h3>
        </div>
        <p className="text-lg text-white mb-1">
          {cert.nombreUsuario || 'Usuario Desconocido'}
        </p>
        <p className="text-sm text-gray-300 mb-4">
          Emitido: {formatDate(cert.fechaEmision)}
        </p>
        <p className="text-xs text-gray-400 font-mono break-all">
          ID: {cert.idValidacion || cert.id}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button 
          className="w-full bg-gradient-to-r from-boreal-aqua to-boreal-blue text-boreal-dark font-bold hover:opacity-90"
          onClick={handleValidate}
        >
          <FileTextIcon className="w-4 h-4 mr-2" />
          Validar
        </Button>
        <Button 
          variant="outline"
          className="w-full border-white/30 text-white hover:bg-white/10"
          onClick={handleDownload}
          disabled={!getPdfUrl()}
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
      </div>
  </m.div>
  );
};

export default CertificateCard;
