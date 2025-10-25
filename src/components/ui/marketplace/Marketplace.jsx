import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { listenProducts, addProduct, purchaseProductTransaction, updateProduct, deleteProduct } from '@/lib/marketplace';
import { listenUserPoints, awardPointsByEmail } from '@/lib/points';
import { listenIsAdminByEmail } from '@/lib/admin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from './ProductCard';
import { CheckCircle2, AlertTriangle, Minus, Plus } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

const Marketplace = ({ user, onViewMovements }) => {
  const uid = user?.uid;
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loadingBuyId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState('products'); // 'products' | 'points'
  const [form, setForm] = useState({ name: '', price: '', stock: '', imageUrl: '', description: '', tags: '', active: true });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [awardForm, setAwardForm] = useState({ email: '', points: '', note: '' });
  const [awardLoading, setAwardLoading] = useState(false);

  useEffect(() => {
    const unsub = listenProducts(setProducts);
    return () => unsub && unsub();
  }, []);

  // Bloquear scroll del body cuando un modal está abierto
  useEffect(() => {
    const hasModal = !!confirmProduct || !!successInfo;
    if (hasModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
  }, [confirmProduct, successInfo]);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenUserPoints(uid, (d) => setBalance(Number(d?.balance || 0)));
    return () => unsub && unsub();
  }, [uid]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = listenIsAdminByEmail(user.email, setIsAdmin);
    return () => unsub && unsub();
  }, [user?.email]);

  useEffect(() => {
    if (isAdmin) {
      // Mostrar admin por defecto y abrir tab de puntos la primera vez
      setAdminMode(true);
      setAdminTab('points');
    } else {
      setAdminMode(false);
    }
  }, [isAdmin]);

  const onBuy = (product) => {
    setConfirmProduct(product);
    setQty(1);
  };

  const confirmPurchase = async () => {
    if (!confirmProduct) return;
    const quantity = Math.max(1, Number(qty || 1));
    setConfirmLoading(true);
    try {
      const receiptId = generateReceiptId();
      const res = await purchaseProductTransaction(uid, confirmProduct.id, quantity, user?.email || null, receiptId);
      toast({ title: 'Compra realizada', description: `Se descontaron ${res.total} puntos.` });
      const payloadText = buildReceiptPayload({
        id: res.receiptId,
        name: confirmProduct.name,
        quantity,
        total: res.total,
        price: Number(confirmProduct.price || 0),
      });
      const qrUrl = buildQrUrl(payloadText);
      setSuccessInfo({ id: res.receiptId, name: confirmProduct.name, quantity, total: res.total, imageUrl: confirmProduct.imageUrl || '', qrUrl });
      setConfirmProduct(null);
    } catch (err) {
      toast({ title: 'No se pudo comprar', description: err?.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setConfirmLoading(false);
    }
  };

  function generateReceiptId() {
    // 8 caracteres alfanuméricos en mayúscula
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function buildReceiptPayload({ id, name, quantity, total, price }) {
    return `ID:${id}\nNAME:${name}\nQTY:${quantity}\nPRICE:${price}\nTOTAL:${total}`;
  }

  function buildQrUrl(text) {
    const data = encodeURIComponent(text);
    // Servicio de QR público; si prefieres local, puedo cambiarlo a una librería de QR
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
  }

  const onAddProduct = async (e) => {
    e.preventDefault();
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (editingId) {
        await updateProduct(editingId, {
          name: form.name.trim(),
          price: Number(form.price),
          stock: Number(form.stock || 0),
          imageUrl: form.imageUrl.trim(),
          description: form.description.trim(),
          tags,
          active: !!form.active,
        });
        toast({ title: 'Producto actualizado' });
      } else {
        await addProduct({
          name: form.name.trim(),
          price: Number(form.price),
          stock: Number(form.stock || 0),
          imageUrl: form.imageUrl.trim(),
          description: form.description.trim(),
          tags,
          active: !!form.active,
        });
        toast({ title: 'Producto agregado' });
      }
      setForm({ name: '', price: '', stock: '', imageUrl: '', description: '', tags: '', active: true });
      setEditingId(null);
    } catch (err) {
      toast({ title: 'No se pudo agregar', description: err?.message || 'Error desconocido', variant: 'destructive' });
    }
  };

  const allTags = useMemo(() => {
    const set = new Set();
    products.forEach((p) => (Array.isArray(p.tags) ? p.tags : []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesText = !term ||
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(term)));
      const matchesTags = !selectedTags.length || (Array.isArray(p.tags) && p.tags.some((t) => selectedTags.includes(t)));
      return matchesText && matchesTags;
    });
  }, [products, search, selectedTags]);

  const showSearch = (products?.length || 0) > 20;

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <h2 className="font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-boreal-aqua to-boreal-purple text-[40px] leading-[44px] sm:text-[60px] sm:leading-[60px] break-words">Marketplace</h2>
        <div className="text-sm text-gray-300 sm:text-right">Saldo: <span className="text-boreal-aqua font-bold">{balance}</span> pts</div>
      </div>
  <p className="text-gray-300 mb-8">Canjea tus puntos por productos y beneficios de la comunidad.</p>

      <div className="mb-6 flex flex-col items-center gap-5">
        {showSearch && (
          <div className="w-full flex justify-center">
            <Input
              placeholder="Buscar por nombre, descripción o etiqueta"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-2xl h-12 rounded-full bg-white/5 border border-boreal-aqua/40 focus-visible:ring-0 focus-visible:border-boreal-aqua text-white placeholder:text-gray-400 px-5 text-base"
            />
          </div>
        )}
        {!!allTags.length && (
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setSelectedTags([])}
                className={`px-5 py-2 text-sm rounded-full border transition ${selectedTags.length===0 ? 'bg-gradient-to-r from-boreal-purple to-boreal-blue text-white border-transparent shadow' : 'bg-transparent text-gray-200 border-boreal-aqua/50 hover:border-boreal-aqua'}`}
              >
                Todos
              </button>
              {allTags.map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTags((prev) => active ? prev.filter((x) => x !== t) : [...prev, t])}
                    className={`px-5 py-2 text-sm rounded-full border transition ${active ? 'bg-gradient-to-r from-boreal-purple to-boreal-blue text-white border-transparent shadow' : 'bg-transparent text-gray-200 border-boreal-aqua/50 hover:border-boreal-aqua'}`}
                  >
                    #{t}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="ml-2 px-5 py-2 text-sm rounded-full border text-gray-200 border-boreal-aqua/40 hover:border-boreal-aqua"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        {filtered.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence initial={false}>
              {filtered.map((p) => (
                <m.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard
                    product={p}
                    onBuy={() => onBuy(p)}
                    disabled={loadingBuyId === p.id}
                    adminMode={adminMode}
                    onEdit={() => {
                      setAdminMode(true);
                      setEditingId(p.id);
                      setForm({
                        name: p.name || '',
                        price: String(p.price ?? ''),
                        stock: String(p.stock ?? ''),
                        imageUrl: p.imageUrl || '',
                        description: p.description || '',
                        tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
                        active: p.active !== false,
                      });
                    }}
                    onDelete={async () => {
                      // Confirmación simple
                      if (window.confirm('¿Eliminar este producto?')) {
                        try {
                          await deleteProduct(p.id);
                          toast({ title: 'Producto eliminado' });
                        } catch (err) {
                          toast({ title: 'No se pudo eliminar', description: err?.message || 'Error desconocido', variant: 'destructive' });
                        }
                      }
                    }}
                  />
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-2xl glass-effect p-8 text-center text-gray-300">
            <p className="text-lg font-semibold text-white">No hay artículos disponibles</p>
            <p className="mt-1">Por el momento no hay productos publicados, pero pronto habrá novedades. Vuelve más tarde.</p>
          </div>
        )}
      </div>

      <div className="mt-10">
        {isAdmin && (
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-white/10 p-1 bg-white/5">
              <button className={`px-3 py-1.5 rounded-md text-sm ${!adminMode ? 'bg-boreal-aqua text-boreal-dark' : 'text-white hover:bg-white/10'}`} onClick={() => setAdminMode(false)}>Usuario</button>
              <button className={`px-3 py-1.5 rounded-md text-sm ${adminMode ? 'bg-boreal-aqua text-boreal-dark' : 'text-white hover:bg-white/10'}`} onClick={() => setAdminMode(true)}>Admin</button>
            </div>
          </div>
        )}
        {isAdmin && adminMode && (
          <div className="rounded-2xl glass-effect p-4">
            <div className="mb-4 inline-flex rounded-lg border border-white/10 p-1 bg-white/5">
              <button className={`px-3 py-1.5 rounded-md text-sm ${adminTab==='products' ? 'bg-boreal-aqua text-boreal-dark' : 'text-white hover:bg-white/10'}`} onClick={() => setAdminTab('products')}>Productos</button>
              <button className={`px-3 py-1.5 rounded-md text-sm ${adminTab==='points' ? 'bg-boreal-aqua text-boreal-dark' : 'text-white hover:bg-white/10'}`} onClick={() => setAdminTab('points')}>Puntos</button>
            </div>

            {adminTab==='products' && (
              <form onSubmit={onAddProduct} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-3">
                  <label className="text-xs text-gray-400">Nombre</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Precio (pts)</label>
                  <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Stock</label>
                  <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400">Imagen URL</label>
                  <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400">Etiquetas (coma separadas)</label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="md:col-span-4">
                  <label className="text-xs text-gray-400">Descripción</label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="prod-active" type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  <label htmlFor="prod-active" className="text-sm text-gray-300">Activo</label>
                </div>
                <div>
                  <Button type="submit" className="w-full">{editingId ? 'Guardar' : 'Agregar'}</Button>
                </div>
              </form>
            )}

            {adminTab==='points' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="text-xs text-gray-400">Correo del usuario</label>
                  <Input value={awardForm.email} onChange={(e) => setAwardForm({ ...awardForm, email: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Puntos a agregar</label>
                  <Input type="number" min="1" value={awardForm.points} onChange={(e) => setAwardForm({ ...awardForm, points: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs text-gray-400">Nota (opcional)</label>
                  <Input value={awardForm.note} onChange={(e) => setAwardForm({ ...awardForm, note: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button
                    onClick={async () => {
                      setAwardLoading(true);
                      try {
                        const res = await awardPointsByEmail(awardForm.email, Number(awardForm.points), user?.email || null, awardForm.note);
                        toast({ title: 'Puntos agregados', description: `Se añadieron ${res.amount} puntos a ${res.email}.` });
                        setAwardForm({ email: '', points: '', note: '' });
                      } catch (err) {
                        toast({ title: 'No se pudo agregar', description: err?.message || 'Error desconocido', variant: 'destructive' });
                      } finally {
                        setAwardLoading(false);
                      }
                    }}
                    disabled={awardLoading || !awardForm.email.trim() || !Number(awardForm.points)}
                  >
                    {awardLoading ? 'Procesando...' : 'Agregar puntos'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de compra */}
      {confirmProduct && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmProduct(null)} />
          <div className="relative z-10 overflow-y-auto overscroll-y-contain">
            <div className="min-h-screen flex items-center justify-center p-3 md:p-6">
              <div className="glass-effect rounded-2xl w-full max-w-[420px] max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-white/10">
              <h4 className="text-2xl font-bold text-white">Confirmar compra</h4>
              <p className="text-sm text-gray-200 mt-0.5">Estás canjeando puntos por <span className="font-medium">{confirmProduct.name}</span>.</p>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-4 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                  {confirmProduct.imageUrl ? (
                    <img src={confirmProduct.imageUrl} alt={confirmProduct.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="w-full -mt-2">
                  <div className="text-base font-semibold text-white">{confirmProduct.name}</div>
                  {confirmProduct.description ? (
                    <p className="text-sm text-gray-300 mt-1">{confirmProduct.description}</p>
                  ) : null}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 text-sm w-full">
                  <div className="flex justify-between"><span className="text-gray-400">Precio</span><span className="font-medium">{Number(confirmProduct.price || 0)} pts</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Saldo</span><span className="font-medium">{balance} pts</span></div>
                  <div className="col-span-2 flex items-center gap-3">
                    <span className="text-gray-400">Cantidad</span>
                    <div className="inline-flex items-center rounded-full border border-boreal-aqua/40 overflow-hidden">
                      <button type="button" className="px-2 py-1 text-white/80 hover:bg-white/10" onClick={() => setQty((q) => Math.max(1, Number(q || 1) - 1))}><Minus className="w-4 h-4"/></button>
                      <Input type="number" min="1" max={Number(confirmProduct.stock || 0)} value={qty} onChange={(e) => setQty(e.target.value)} className="bg-transparent border-0 w-16 text-center focus-visible:ring-0" />
                      <button type="button" className="px-2 py-1 text-white/80 hover:bg-white/10" onClick={() => setQty((q) => {
                        const stock = Number(confirmProduct.stock || 0);
                        return Math.min(stock || 9999, Math.max(1, Number(q || 1) + 1));
                      })}><Plus className="w-4 h-4"/></button>
                    </div>
                    <span className="text-gray-400">Stock: {Number(confirmProduct.stock || 0)}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const stock = Number(confirmProduct.stock || 0);
                const price = Number(confirmProduct.price || 0);
                const n = Math.max(1, Number(qty || 1));
                const total = price * n;
                const lacksStock = n > stock;
                const lacksPoints = total > balance;
                return (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total</span>
                      <span className="font-semibold">{total} pts</span>
                    </div>
                    {(lacksStock || lacksPoints) && (
                      <div className="mt-2 flex items-center gap-2 text-amber-300 text-xs">
                        <AlertTriangle className="w-4 h-4"/>
                        <span>
                          {lacksStock ? 'Cantidad supera el stock disponible.' : ''}
                          {lacksStock && lacksPoints ? ' ' : ''}
                          {lacksPoints ? 'No tienes puntos suficientes.' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="mt-5 flex flex-col-reverse md:flex-row gap-2 justify-end">
                <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 w-full md:w-auto" onClick={() => setConfirmProduct(null)}>Cancelar</Button>
                {(() => {
                  const stock = Number(confirmProduct.stock || 0);
                  const price = Number(confirmProduct.price || 0);
                  const n = Math.max(1, Number(qty || 1));
                  const total = price * n;
                  const disabled = confirmLoading || n > stock || total > balance;
                  return (
                    <Button onClick={confirmPurchase} disabled={disabled} className="rounded-full w-full md:w-auto bg-gradient-to-r from-boreal-purple to-boreal-blue text-white font-bold">
                      {confirmLoading ? 'Procesando...' : `Confirmar (${total} pts)`}
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de éxito */}
      {successInfo && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSuccessInfo(null)} />
          <div className="relative z-10 overflow-y-auto overscroll-y-contain">
            <div className="min-h-screen flex items-center justify-center p-3 md:p-6">
              <div className="glass-effect rounded-2xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-6 md:p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-boreal-aqua mx-auto mb-3" />
            <h4 className="text-2xl font-semibold mb-1">¡Compra confirmada!</h4>
            <p className="text-gray-300">Canjeaste <span className="font-medium">{successInfo.quantity}</span> x <span className="font-medium">{successInfo.name}</span>.</p>
            <p className="text-gray-300 mt-1">Total: <span className="font-semibold">{successInfo.total} pts</span></p>
            <p className="text-gray-300 mt-3 text-sm">
              Para retirar tu artículo, preséntate en horario de oficina y muestra el código QR o el ID de compra.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {successInfo.imageUrl ? (
                <div className="rounded-xl overflow-hidden bg-white/5 mx-auto w-40 h-40 md:w-full md:aspect-square">
                  <img src={successInfo.imageUrl} alt={successInfo.name} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="flex flex-col items-center justify-center">
                <div className="text-xs text-gray-400 mb-1">ID de compra</div>
                <div className="font-mono text-lg tracking-widest">{successInfo.id}</div>
                {successInfo.qrUrl && (
                  <img src={successInfo.qrUrl} alt="QR de compra" className="mt-3 w-40 h-40 mx-auto" />
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-col md:flex-row flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setSuccessInfo(null)}
              >
                Cerrar
              </Button>
              <Button
                className="w-full md:w-auto"
                onClick={() => {
                  setSuccessInfo(null);
                  if (typeof onViewMovements === 'function') onViewMovements();
                }}
              >
                Ver mis movimientos
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

export default Marketplace;
