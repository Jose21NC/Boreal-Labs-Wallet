import React, { useEffect, useRef, useState } from 'react';
import { motion as m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileTextIcon, DownloadIcon, Share2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const CertificateCard = ({ cert }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLinkedInLoading, setShareLinkedInLoading] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handlePointer = (e) => {
      if (!shareRef.current) return;
      if (!shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer, { capture: true });
    return () => document.removeEventListener('pointerdown', handlePointer, { capture: true });
  }, [shareOpen]);

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

  // Nota: Firebase Dynamic Links dejó de estar disponible; no se usa acortador automático aquí.

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

  const handleShareLink = async () => {
    const pdfUrl = getPdfUrl();
    if (!pdfUrl) return;
    const title = cert?.nombreEvento || 'Certificado Boreal Labs';
    const text = `Mira mi certificado de ${title}`;
    if (navigator?.share) {
      try {
        await navigator.share({ title, text, url: pdfUrl });
        return;
      } catch (err) {
        console.debug('Share API falló, se usará copia al portapapeles:', err?.message || err);
      }
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(pdfUrl);
        alert('Enlace copiado al portapapeles.');
        return;
      }
    } catch (err) {
      console.debug('No se pudo copiar al portapapeles:', err?.message || err);
    }
    // Fallback: mostrar en prompt para copiar manualmente
    window.prompt('Copia el enlace del certificado:', pdfUrl);
  };

  const buildLinkedInUrl = async () => {
    const pdfUrlFull = getPdfUrl();
    const validationUrl = cert?.idValidacion ? `https://borealabs.org/validacion?id=${cert.idValidacion}` : null;
    const name = cert?.nombreEvento || 'Certificado Boreal Labs';
    const org = 'Boreal Labs';
    const id = cert?.idValidacion || cert?.id || '';
    let issueYear = '';
    let issueMonth = '';
    try {
      const d = cert?.fechaEmision?.toDate ? cert.fechaEmision.toDate() : new Date(cert?.fechaEmision);
      if (!Number.isNaN(d?.getTime?.())) {
        issueYear = String(d.getFullYear());
        issueMonth = String(d.getMonth() + 1); // 1-12
      }
    } catch {
      // Ignorar si no hay fecha válida
    }

    const shortenPdfUrl = (url) => {
      try {
        const u = new URL(url);
        u.searchParams.delete('response-content-disposition');
        u.searchParams.delete('response-content-type');
        return u.toString();
      } catch {
        return url;
      }
    };

    const certUrl = validationUrl || null;

    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name,
      organizationName: org,
      organizationId: '110436617',
    });

    if (certUrl && certUrl.length <= 262) params.set('certUrl', certUrl);
    if (id) params.set('certId', id);
    if (issueYear) params.set('issueYear', issueYear);
    if (issueMonth) params.set('issueMonth', issueMonth);

    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  };

  const LinkedInIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.339 18.337H5.667V9.873h2.672v8.464ZM7.003 8.676a1.548 1.548 0 1 1 0-3.096 1.548 1.548 0 0 1 0 3.096ZM18.333 18.337h-2.666v-4.112c0-.981-.017-2.24-1.365-2.24-1.367 0-1.576 1.067-1.576 2.169v4.183H10.06V9.873h2.559v1.156h.036c.357-.676 1.228-1.39 2.53-1.39 2.709 0 3.208 1.783 3.208 4.099v4.599Z" />
    </svg>
  );

  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-2xl p-6 glass-effect flex flex-col justify-between transition-all duration-300 hover:border-boreal-aqua/50"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center space-x-3 min-w-0">
          <FileTextIcon className="w-8 h-8 text-boreal-aqua flex-shrink-0" />
          <h3 className="text-xl font-bold text-boreal-aqua truncate">
            {cert.nombreEvento || 'Evento Desconocido'}
          </h3>
        </div>
        <div className="relative" ref={shareRef}>
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-full border-white/25 text-white hover:bg-white/10"
            onClick={() => setShareOpen((v) => !v)}
            disabled={!getPdfUrl()}
            aria-label="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          {shareOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/25 bg-[#050910]/95 backdrop-blur-lg shadow-2xl p-2 z-30">
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white"
                onClick={() => { setShareOpen(false); handleShareLink(); }}
              >
                Compartir enlace
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white flex items-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  setShareLinkedInLoading(true);
                  try {
                    const url = await buildLinkedInUrl();
                    if (url) window.open(url, '_blank', 'noopener');
                  } finally {
                    setShareLinkedInLoading(false);
                    setShareOpen(false);
                  }
                }}
                disabled={shareLinkedInLoading}
              >
                <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
                {shareLinkedInLoading ? 'Abriendo…' : 'Añadir en LinkedIn'}
              </button>
            </div>
          )}
        </div>
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
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>
  </m.div>
  );
};

export default CertificateCard;
