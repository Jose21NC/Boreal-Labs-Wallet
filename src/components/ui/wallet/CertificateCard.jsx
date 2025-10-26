import React from 'react';
import { motion as m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileTextIcon, DownloadIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

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
    if (typeof cert?.urlPdf === 'string') return cert.urlPdf;
    if (cert?.urlPdf?.downloadURL) return cert.urlPdf.downloadURL;
    if (cert?.downloadURL) return cert.downloadURL;
    return null;
  };

  const isMobileBrowser = () => {
    if (Capacitor?.getPlatform && Capacitor.getPlatform() !== 'web') return false; // app nativa no es navegador
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const sanitizeFileName = (name) => {
    return (name || 'certificado').toString().replace(/[^a-zA-Z0-9-_\.]+/g, '_') + '.pdf';
  };

  const ensureDownloadUrl = (url, filename) => {
    try {
      const u = new URL(url);
      // Forzar descarga en Firebase Storage (GCS) añadiendo content-disposition como adjunto
      if (u.hostname.includes('firebasestorage.googleapis.com')) {
        u.searchParams.set('alt', 'media');
        u.searchParams.set('response-content-type', 'application/pdf');
        const disp = `attachment; filename="${filename}"`;
        u.searchParams.set('response-content-disposition', disp);
      }
      return u.toString();
    } catch {
      return url;
    }
  };

  const downloadViaFetch = async (url, filename) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      return true;
    } catch (e) {
      console.warn('Fallo descarga via fetch, se usará window.open:', e);
      return false;
    }
  };

  const handleDownload = async () => {
    const baseUrl = getPdfUrl();
    const filename = sanitizeFileName(cert?.nombreEvento || 'certificado');
    const pdfUrl = ensureDownloadUrl(baseUrl, filename);
    if (!pdfUrl) return;

    try {
      if (isMobileBrowser()) {
        // En navegadores móviles, intentamos forzar descarga directa
        const ok = await downloadViaFetch(pdfUrl, filename);
        if (ok) return;
      }
      // En otros casos, abrir en una nueva pestaña/visor
      window.open(pdfUrl, '_blank', 'noopener');
    } catch (e) {
      // Fallback seguro si falla el plugin o está ausente
      try {
        window.open(pdfUrl, '_blank', 'noopener');
      } catch {
        // último recurso: crear un enlace temporal
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.download = filename;
        // Nota: el atributo download no funciona en cross-origin en la mayoría de navegadores
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    }
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
