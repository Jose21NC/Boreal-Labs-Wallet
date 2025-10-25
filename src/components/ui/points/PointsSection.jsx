import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { listenUserPoints, redeemCodeTransaction, fetchCodeInfo, listenRedemptions, listenPurchases, listenAdminGrants } from '@/lib/points';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, QrCode, CheckCircle2 } from 'lucide-react';
import { useZxing } from 'react-zxing';

const PointsSection = ({ user }) => {
  const uid = user?.uid;
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redemptions, setRedemptions] = useState([]);
  const [preview, setPreview] = useState(null); // { id, amount, active, used, expiresAt }
  const [checking, setChecking] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [grants, setGrants] = useState([]);
  const [receipt, setReceipt] = useState(null); // { id, name, quantity, total, price, imageUrl, qrUrl }

  useEffect(() => {
    if (!uid) return;
    const unsub = listenUserPoints(uid, (data) => setBalance(Number(data?.balance || 0)));
    return () => unsub && unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenRedemptions(uid, (items) => setRedemptions(items));
    return () => unsub && unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenPurchases(uid, (items) => setPurchases(items));
    return () => unsub && unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenAdminGrants(uid, (items) => setGrants(items));
    return () => unsub && unsub();
  }, [uid]);

  // Bloquear scroll del body cuando hay modales abiertos (preview o recibo)
  useEffect(() => {
    const hasModal = !!preview || !!receipt;
    if (hasModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
  }, [preview, receipt]);

  const movements = useMemo(() => {
    const plus = (redemptions || []).map((r) => ({
      id: `in_${r.id}`,
      type: 'in',
      amount: Number(r.amount || 0),
      label: `Canje de código ${r.code}`,
      at: r.redeemedAt?.toDate ? r.redeemedAt.toDate() : (r.redeemedAt instanceof Date ? r.redeemedAt : null),
      kind: 'redemption',
    }));
    const minus = (purchases || []).map((p) => ({
      id: `out_${p.id}`,
      type: 'out',
      amount: Number(p.total || (p.price || 0) * (p.quantity || 1)),
      label: `Compra: ${p.name || p.productId}`,
      at: p.purchasedAt?.toDate ? p.purchasedAt.toDate() : (p.purchasedAt instanceof Date ? p.purchasedAt : null),
      kind: 'purchase',
      purchase: p,
    }));
    const adminPlus = (grants || []).map((g) => ({
      id: `grant_${g.id}`,
      type: 'in',
      amount: Number(g.amount || 0),
      label: g.note ? `Asignación admin: ${g.note}` : 'Asignación de puntos (admin)',
      at: g.grantedAt?.toDate ? g.grantedAt.toDate() : (g.grantedAt instanceof Date ? g.grantedAt : null),
      kind: 'grant',
    }));
    const all = [...plus, ...adminPlus, ...minus];
    all.sort((a, b) => (b.at?.getTime?.() || 0) - (a.at?.getTime?.() || 0));
    return all;
  }, [redemptions, purchases, grants]);

  // El canje se realiza desde el modal de previsualización; se eliminó handleRedeem no utilizado

  const handlePreview = async (codeValue) => {
    const value = (codeValue ?? code).trim();
    if (!value) return;
    setChecking(true);
    try {
      const info = await fetchCodeInfo(value);
      // Validaciones básicas para mostrar en UI
      const now = new Date();
      const expired = info.expiresAt ? info.expiresAt < now : false;
      setPreview({ ...info, expired });
    } catch (err) {
      toast({ title: 'Código inválido', description: err?.message || 'No se pudo validar el código', variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  const { ref } = useZxing({
    onDecodeResult(result) {
      setScanning(false);
      const text = result.getText();
      // Primero previsualizar para evitar canjes accidentales
      handlePreview(text);
    },
    paused: !scanning,
  });

  return (
    <div className="rounded-2xl glass-effect p-6 w-full">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <h2 className="font-black text-[60px] leading-[60px]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-boreal-aqua to-boreal-blue">Mis puntos</span>
        </h2>
        <div className="text-6xl font-black text-boreal-aqua leading-none">{balance}</div>
      </div>
      <p className="text-gray-300 mt-2">
        Puedes ganar puntos asistiendo a eventos o participando en dinámicas de la comunidad.
      </p>

      <h3 className="mt-8 text-xl font-semibold">Canjear puntos</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm text-gray-300">Canjear con código</label>
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa tu código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
            <Button onClick={() => handlePreview()} disabled={checking || !code.trim()}>
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span className="ml-2">Verificar</span>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-gray-300">Canjear escaneando QR</label>
          <div className="relative rounded-xl overflow-hidden border border-white/10 min-h-[220px] flex items-center justify-center">
            {scanning ? (
              <video ref={ref} className="w-full h-full object-cover" />
            ) : (
              <div className="p-8 text-center text-gray-300">
                <QrCode className="w-10 h-10 mx-auto mb-3 text-boreal-aqua" />
                <p>Activa la cámara para escanear un código QR</p>
                <Button variant="outline" className="mt-3 border-white/30 text-white hover:bg-white/10" onClick={() => setScanning(true)}>
                  Usar cámara
                </Button>
              </div>
            )}
          </div>
          {scanning && (
            <Button variant="ghost" className="text-gray-300" onClick={() => setScanning(false)}>Detener cámara</Button>
          )}
        </div>
      </div>

      <div className="my-8 h-px bg-white/10" />

      {/* Movimientos (entradas y salidas) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Movimientos</h3>
        {movements?.length ? (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
            {movements.map((m) => {
              const isPurchase = m.kind === 'purchase' && m.purchase;
              return (
                <li key={m.id} className="flex items-center justify-between px-4 py-3 bg-white/5">
                  <div>
                    <div className="text-sm text-gray-300">{m.label}</div>
                    <div className="text-xs text-gray-400">{m.at ? m.at.toLocaleString() : '—'}</div>
                    {isPurchase && (
                      <button
                        className="mt-1 text-xs text-boreal-aqua hover:underline"
                        onClick={() => {
                          const p = m.purchase || {};
                          const payload = buildReceiptPayload({
                            id: p.receiptId || p.id,
                            name: p.name || p.productId || 'Artículo',
                            quantity: Number(p.quantity || 1),
                            total: Number(p.total || (p.price || 0) * (p.quantity || 1)),
                            price: Number(p.price || 0),
                          });
                          const qrUrl = buildQrUrl(payload);
                          setReceipt({
                            id: p.receiptId || p.id,
                            name: p.name || p.productId || 'Artículo',
                            quantity: Number(p.quantity || 1),
                            total: Number(p.total || (p.price || 0) * (p.quantity || 1)),
                            price: Number(p.price || 0),
                            imageUrl: p.imageUrl || '',
                            qrUrl,
                          });
                        }}
                      >
                        Ver comprobante
                      </button>
                    )}
                  </div>
                  <div className={m.type==='in' ? 'text-boreal-aqua font-bold' : 'text-red-400 font-bold'}>
                    {m.type==='in' ? '+' : '-'}{m.amount}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Aún no tienes movimientos.</p>
        )}
      </div>

      {/* Overlay de previsualización/confirmación */}
      {preview && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative z-10 overflow-y-auto overscroll-y-contain">
            <div className="min-h-screen flex items-center justify-center p-3 md:p-6">
              <div className="glass-effect rounded-2xl p-6 w-[min(92vw,420px)] max-h-[85vh] overflow-y-auto">
            <h4 className="text-xl font-semibold mb-1">Confirmar canje</h4>
            <p className="text-sm text-gray-300 mb-4">Vas a canjear el código <span className="font-mono">{preview.id}</span>.</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Monto</span><span className="font-medium">{preview.amount} puntos</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Estado</span><span className="font-medium">{preview.used ? 'Usado' : (preview.active === false ? 'Inactivo' : 'Disponible')}</span></div>
              {'multiUse' in preview && (
                <div className="flex justify-between"><span className="text-gray-400">Tipo</span><span className="font-medium">{preview.multiUse ? 'Multi-uso (un uso por persona)' : 'Uso único'}</span></div>
              )}
              {preview.expiresAt && (
                <div className="flex justify-between"><span className="text-gray-400">Expira</span><span className="font-medium">{preview.expiresAt.toLocaleString()}</span></div>
              )}
              {preview.expired && <div className="text-red-400">Este código ya expiró.</div>}
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setPreview(null)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await redeemCodeTransaction(uid, preview.id, user?.email || null);
                    toast({ title: 'Canje exitoso', description: `Se añadieron ${res.amount} puntos a tu saldo.` });
                    setCode('');
                    setPreview(null);
                  } catch (err) {
                    toast({ title: 'No se pudo canjear', description: err?.message || 'Error desconocido', variant: 'destructive' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || preview.used || preview.active === false || preview.expired}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="ml-2">Confirmar canje</span>
              </Button>
            </div>
          </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de comprobante de compra (reimpresión) */}
      {receipt && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReceipt(null)} />
          <div className="relative z-10 overflow-y-auto overscroll-y-contain">
            <div className="min-h-screen flex items-center justify-center p-3 md:p-6">
              <div className="glass-effect rounded-2xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-6 md:p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-boreal-aqua mx-auto mb-3" />
            <h4 className="text-2xl font-semibold mb-1">Comprobante de compra</h4>
            <p className="text-gray-300">Compra de <span className="font-medium">{receipt.quantity}</span> x <span className="font-medium">{receipt.name}</span>.</p>
            <p className="text-gray-300 mt-1">Total: <span className="font-semibold">{receipt.total} pts</span></p>
            <p className="text-gray-300 mt-3 text-sm">
              Para retirar tu artículo, preséntate en horario de oficina y muestra el código QR o el ID de compra.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {receipt.imageUrl ? (
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/5">
                  <img src={receipt.imageUrl} alt={receipt.name} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="flex flex-col items-center justify-center">
                <div className="text-xs text-gray-400 mb-1">ID de compra</div>
                <div className="font-mono text-lg tracking-widest">{receipt.id}</div>
                {receipt.qrUrl && (
                  <img src={receipt.qrUrl} alt="QR de compra" className="mt-3 w-40 h-40 mx-auto" />
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-col md:flex-row flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setReceipt(null)}
              >
                Cerrar
              </Button>
              <Button
                variant="outline"
                className="border-green-400 text-green-300 hover:bg-green-500/10"
                onClick={() => window.open('https://wa.me/50576796164', '_blank', 'noopener,noreferrer')}
              >
                Contactar por WhatsApp
              </Button>
            </div>
          </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PointsSection;

// Helpers locales para construir el QR del comprobante (idénticos a Marketplace)
function buildReceiptPayload({ id, name, quantity, total, price }) {
  return `ID:${id}\nNAME:${name}\nQTY:${quantity}\nPRICE:${price}\nTOTAL:${total}`;
}

function buildQrUrl(text) {
  const data = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
}
