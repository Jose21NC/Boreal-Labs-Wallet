import React, { useEffect, useMemo, useState } from 'react';
import { listenProducts, addProduct, updateProduct, deleteProduct } from '@/lib/marketplace';
import { adjustPointsByEmail } from '@/lib/points';
import { searchUsers, listUsers, getUserCertificatesByEmail, getUserPointsByEmail } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Edit2,
  Loader2,
  Lock,
  LogOut,
  PackagePlus,
  Power,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User2,
  Wand2,
  X,
} from 'lucide-react';

const SESSION_KEY = 'boreal-admin-session';
const productDefaults = {
  name: '',
  price: '',
  stock: '',
  imageUrl: '',
  description: '',
  tags: '',
  active: true,
};

const getUserName = (u, certs = []) => {
  if (u?.displayName) return u.displayName;
  const certName = certs.find((c) => c?.nombreUsuario)?.nombreUsuario;
  if (certName) return certName;
  if (u?.email) return u.email.split('@')[0];
  return '';
};

const AdminPage = ({ isFirebaseConfigured, adminEmail }) => {
  const { toast } = useToast();
  const [authError, setAuthError] = useState('');
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [authenticated, setAuthenticated] = useState(false);

  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(productDefaults);
  const [productLoading, setProductLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [sortKey, setSortKey] = useState('name'); // name | points | certs
  const [sortDir, setSortDir] = useState('asc');
  const [userLayout, setUserLayout] = useState('grid'); // grid | list

  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ delta: '', note: '', email: '' });

  const adminUser = import.meta.env.VITE_ADMIN_USER || '';
  const adminPass = import.meta.env.VITE_ADMIN_PASS || '';
  const expectedToken = useMemo(() => {
    if (!adminUser || !adminPass) return null;
    return btoa(`${adminUser}:${adminPass}`);
  }, [adminUser, adminPass]);

  useEffect(() => {
    if (!expectedToken) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    if (stored === expectedToken) setAuthenticated(true);
  }, [expectedToken]);

  useEffect(() => {
    if (!authenticated) return undefined;
    const unsub = listenProducts(setProducts, { includeInactive: true });
    return () => unsub && unsub();
  }, [authenticated]);

  useEffect(() => {
    const hasModal = showProductModal || showUserModal;
    if (!hasModal) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [showProductModal, showUserModal]);

  useEffect(() => {
    const prev = document.documentElement.style.scrollbarGutter;
    const prevBodyOverflow = document.body.style.overflowY;
    const prevBodyGutter = document.body.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = 'stable both-edges';
    document.body.style.scrollbarGutter = 'stable both-edges';
    document.body.style.overflowY = 'scroll';
    return () => {
      document.documentElement.style.scrollbarGutter = prev;
      document.body.style.scrollbarGutter = prevBodyGutter;
      document.body.style.overflowY = prevBodyOverflow;
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!expectedToken) {
      setAuthError('Configura VITE_ADMIN_USER y VITE_ADMIN_PASS en tu entorno');
      return;
    }
    if (creds.username === adminUser && creds.password === adminPass) {
      localStorage.setItem(SESSION_KEY, expectedToken);
      setAuthenticated(true);
      setAuthError('');
      toast({ title: 'Acceso concedido', description: 'Sesión iniciada en /admin.' });
    } else {
      setAuthenticated(false);
      setAuthError('Credenciales incorrectas');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    setCreds({ username: '', password: '' });
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm(productDefaults);
    setShowProductModal(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      price: String(prod.price ?? ''),
      stock: String(prod.stock ?? ''),
      imageUrl: prod.imageUrl || '',
      description: prod.description || '',
      tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : '',
      active: prod.active !== false,
    });
    setShowProductModal(true);
  };

  const handleImageUpload = async (file) => {
    if (!file || !storage) throw new Error('No se pudo subir la imagen');
    setUploadingImage(true);
    try {
      const path = `product-images/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProductForm((prev) => ({ ...prev, imageUrl: url }));
      toast({ title: 'Imagen subida', description: 'Se actualizó imageUrl automáticamente.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        price: Number(productForm.price || 0),
        stock: Number(productForm.stock || 0),
        imageUrl: productForm.imageUrl.trim(),
        description: productForm.description.trim(),
        tags: productForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        active: !!productForm.active,
      };
      if (!payload.name || !payload.price) throw new Error('Nombre y precio son requeridos');
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, payload);
        toast({ title: 'Producto actualizado' });
      } else {
        await addProduct(payload);
        toast({ title: 'Producto creado' });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm(productDefaults);
    } catch (err) {
      toast({ title: 'No se guardó el producto', description: err?.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setProductLoading(false);
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      await updateProduct(prod.id, { active: prod.active === false });
      toast({ title: prod.active === false ? 'Producto activado' : 'Producto desactivado' });
    } catch (err) {
      toast({ title: 'No se pudo cambiar estado', description: err?.message || 'Error desconocido', variant: 'destructive' });
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(prod.id);
      toast({ title: 'Producto eliminado' });
    } catch (err) {
      toast({ title: 'No se pudo eliminar', description: err?.message || 'Error desconocido', variant: 'destructive' });
    }
  };

  const hydrateUserMeta = async (users) => {
    const tasks = users.map(async (u) => {
      try {
        const certs = await getUserCertificatesByEmail(u.email);
        return { ...u, certificateCount: certs.length };
      } catch {
        return { ...u, certificateCount: 0 };
      }
    });
    const enriched = await Promise.all(tasks);
    return enriched.map((u) => ({
      ...u,
      balance: Number(u.balance || 0),
      certificateCount: Number(u.certificateCount || 0),
    }));
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserResults([]);
    setUserLayout('grid');
    try {
      const res = await searchUsers(userSearch, 50);
      const hydrated = await hydrateUserMeta(res);
      setUserResults(hydrated);
      if (!hydrated.length) toast({ title: 'Sin resultados', description: 'No se encontraron usuarios con ese criterio' });
    } catch (err) {
      toast({ title: 'No se pudo buscar', description: err?.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setUserLoading(false);
    }
  };

  const handleListAll = async () => {
    setUserLoading(true);
    setUserResults([]);
    setUserLayout('list');
    try {
      const res = await listUsers(80);
      const hydrated = await hydrateUserMeta(res);
      setUserResults(hydrated);
      if (!hydrated.length) toast({ title: 'Sin usuarios', description: 'No se encontraron usuarios' });
    } catch (err) {
      toast({ title: 'No se pudieron listar usuarios', description: err?.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setUserLoading(false);
    }
  };

  const sortedUsers = useMemo(() => {
    const list = [...userResults];
    const dir = sortDir === 'desc' ? -1 : 1;
    return list.sort((a, b) => {
      if (sortKey === 'points') {
        return (Number(a.balance || 0) - Number(b.balance || 0)) * dir;
      }
      if (sortKey === 'certs') {
        return (Number(a.certificateCount || 0) - Number(b.certificateCount || 0)) * dir;
      }
      const an = (a.displayName || a.email || '').toLowerCase();
      const bn = (b.displayName || b.email || '').toLowerCase();
      return an.localeCompare(bn) * dir;
    });
  }, [userResults, sortKey, sortDir]);

  const formatDate = (date) => {
    if (!date) return 'Fecha desconocida';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Fecha inválida';
    }
  };

  const openUserModal = async (user) => {
    setUserModalLoading(true);
    setShowUserModal(true);
    try {
      const pointsDoc = await getUserPointsByEmail(user.email);
      const certs = await getUserCertificatesByEmail(user.email);
      setUserDetail({ profile: user, points: pointsDoc, certs });
      setAdjustForm((prev) => ({ ...prev, email: user.email }));
    } catch (err) {
      toast({ title: 'No se pudo cargar el usuario', description: err?.message || 'Error desconocido', variant: 'destructive' });
      setShowUserModal(false);
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!userDetail?.profile?.email) return;
    setAdjustLoading(true);
    try {
      const delta = Number(adjustForm.delta);
      const res = await adjustPointsByEmail(userDetail.profile.email, delta, adminEmail || null, adjustForm.note);
      toast({ title: 'Puntos ajustados', description: `Delta ${delta > 0 ? '+' : ''}${delta} aplicado a ${res.email}.` });
      const pointsDoc = await getUserPointsByEmail(userDetail.profile.email);
      setUserDetail((prev) => (prev ? { ...prev, points: pointsDoc } : prev));
      setAdjustForm({ delta: '', note: '', email: userDetail.profile.email });
    } catch (err) {
      toast({ title: 'No se pudo ajustar', description: err?.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setAdjustLoading(false);
    }
  };

  const renderProductModal = () => {
    if (!showProductModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-boreal-purple/30 backdrop-blur-md"
          onClick={() => setShowProductModal(false)}
        />
        <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0a0f1d]/90 shadow-[0_25px_80px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="relative p-6 bg-gradient-to-r from-boreal-aqua/15 via-boreal-purple/15 to-boreal-blue/15 border-b border-white/10">
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(105,230,175,0.12), transparent 35%), radial-gradient(circle at 80% 0%, rgba(190,88,240,0.12), transparent 30%)',
              }}
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-300">Producto</p>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <PackagePlus className="text-boreal-aqua" size={18} />
                  {editingProduct ? 'Editar artículo' : 'Nuevo artículo'}
                </h3>
              </div>
              <button aria-label="Cerrar" onClick={() => setShowProductModal(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>
          <form onSubmit={handleProductSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Nombre</label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400">Precio</label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400">Stock</label>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">Descripción</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-boreal-purple"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Tags (separa con coma)</label>
              <Input
                value={productForm.tags}
                onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Imagen</label>
              <div className="flex items-center gap-2">
                <Input
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white"
                />
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white cursor-pointer hover:border-boreal-aqua">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                  {uploadingImage ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Subir
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <input
                id="active"
                type="checkbox"
                checked={productForm.active}
                onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5"
              />
              <label htmlFor="active">Activo en marketplace</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowProductModal(false)} className="text-white/70">
                Cancelar
              </Button>
              <Button type="submit" disabled={productLoading} className="bg-boreal-aqua text-black hover:brightness-110">
                {productLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderUserModal = () => {
    if (!showUserModal || !userDetail) return null;
    const { profile, points, certs } = userDetail;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-boreal-purple/40 backdrop-blur-md" onClick={() => setShowUserModal(false)} />
        <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0a0f1d]/90 shadow-[0_25px_80px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-boreal-purple/20 via-boreal-blue/10 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-300">Usuario</p>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <User2 className="text-boreal-aqua" size={18} />
                  {getUserName(profile, certs)}
                </h3>
                <p className="text-sm text-gray-300">{profile.email}</p>
              </div>
              <button aria-label="Cerrar" onClick={() => setShowUserModal(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                <p className="text-xs text-gray-300">Balance</p>
                <p className="text-2xl font-black">{points?.balance ?? 0} pts</p>
                <p className="text-xs text-gray-400">Actualizado {points?.updatedAt ? formatDate(points.updatedAt) : '—'}</p>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                <p className="text-xs text-gray-300 mb-2">Certificados</p>
                <div className="max-h-40 overflow-auto space-y-2 pr-2 text-sm">
                  {certs && certs.length
                    ? certs.map((c) => (
                        <div key={c.id || c.urlPdf} className="rounded-xl border border-white/5 bg-black/30 px-3 py-2">
                          <div className="flex items-center justify-between text-gray-200">
                            <span>{c?.nombreCurso || c?.nombreEvento || 'Curso'}</span>
                            <span className="text-xs text-gray-400">
                              {formatDate(c?.fechaEmision || c?.fecha || c?.fechaCurso)}
                            </span>
                          </div>
                          {c?.descripcion ? (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.descripcion}</p>
                          ) : null}
                        </div>
                      ))
                    : <p className="text-gray-400">Sin certificados</p>}
                </div>
              </div>
            </div>

            <form onSubmit={handleAdjust} className="rounded-2xl border border-white/10 bg-gradient-to-r from-boreal-aqua/10 via-boreal-blue/10 to-boreal-purple/10 p-4 text-white space-y-3">
              <p className="text-xs text-gray-300 uppercase tracking-[0.25em]">Ajustar puntos</p>
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  type="number"
                  placeholder="Delta"
                  value={adjustForm.delta}
                  onChange={(e) => setAdjustForm({ ...adjustForm, delta: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  placeholder="Nota (opcional)"
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button type="submit" disabled={adjustLoading} className="bg-boreal-aqua text-black hover:brightness-110">
                  {adjustLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Aplicar
                </Button>
              </div>
            </form>
          </div>
          {userModalLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white">
              <Loader2 className="animate-spin" />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[#050915] text-white flex items-center justify-center p-6">
        <div className="max-w-xl rounded-3xl border border-red-500/40 bg-red-500/10 p-8 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-red-200">
            <AlertTriangle />
            <h1 className="text-xl font-bold">Faltan variables de Firebase</h1>
          </div>
          <p className="text-sm text-red-100">Define VITE_FIREBASE_* en tu entorno para habilitar el panel admin.</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#050915] text-white flex items-center justify-center p-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-boreal-blue/20 via-black/60 to-black/80 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
          <div className="absolute -top-24 -right-32 h-64 w-64 rounded-full bg-boreal-aqua/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-24 h-56 w-56 rounded-full bg-boreal-purple/25 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-3 text-boreal-aqua">
              <Shield size={20} />
              <p className="text-xs uppercase tracking-[0.3em] text-gray-200">Panel seguro</p>
            </div>
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <Wand2 className="text-boreal-purple" /> Accede al panel admin
              </h1>
              <p className="text-sm text-gray-300">Usa las credenciales configuradas en variables de entorno.</p>
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Usuario</label>
                <Input
                  value={creds.username}
                  onChange={(e) => setCreds((prev) => ({ ...prev, username: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Contraseña</label>
                <Input
                  type="password"
                  value={creds.password}
                  onChange={(e) => setCreds((prev) => ({ ...prev, password: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  autoComplete="current-password"
                />
              </div>
              {authError ? <p className="text-sm text-red-300">{authError}</p> : null}
              <Button type="submit" className="w-full bg-boreal-aqua text-black hover:brightness-110">
                <Lock className="mr-2 h-4 w-4" /> Entrar
              </Button>
            </form>
            {!expectedToken ? (
              <p className="text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle size={14} /> Configura VITE_ADMIN_USER y VITE_ADMIN_PASS para habilitar el acceso.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#040814] via-[#03060f] to-black text-white overflow-y-scroll"
      style={{ scrollbarGutter: 'stable both-edges' }}
    >
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-boreal-purple/20 via-boreal-blue/15 to-boreal-aqua/10 px-6 py-6 md:py-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 15% 20%, rgba(105,230,175,0.12), transparent 30%), radial-gradient(circle at 80% 0%, rgba(190,88,240,0.12), transparent 28%)' }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-300">Panel administrativo</p>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <Sparkles className="text-boreal-aqua" /> Gestión Boreal
            </h1>
            <p className="text-sm text-gray-200">Control de productos, usuarios y puntos en tiempo real.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={openNewProductModal} className="bg-boreal-aqua text-black hover:brightness-110">
              <PackagePlus className="mr-2 h-4 w-4" /> Nuevo producto
            </Button>
            <Button variant="outline" onClick={handleLogout} className="border-white/20 text-white hover:bg-white/10">
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8 md:py-8 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <form onSubmit={handleUserSearch} className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-end md:gap-4">
            <div className="md:col-span-5">
              <label className="text-xs text-gray-400">Buscar usuario por email, uid o displayName</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <Search className="text-gray-400" size={16} />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                  placeholder="ej: usuario@correo.com"
                />
              </div>
            </div>
            <div className="md:col-span-3 flex flex-col gap-2">
              <label className="text-xs text-gray-400">Ordenar</label>
              <div className="flex gap-2">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="w-40 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="name">Nombre</option>
                  <option value="points">Puntos</option>
                  <option value="certs">Certificados</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="border-white/20 text-white hover:bg-white/10 px-3"
                  aria-label="Cambiar orden"
                >
                  {sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </Button>
              </div>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" disabled={userLoading} className="flex-1 bg-boreal-purple text-white hover:brightness-110">
                {userLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User2 className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
              {!userSearch.trim() ? (
                <Button type="button" variant="outline" disabled={userLoading} onClick={handleListAll} className="border-white/20 text-white hover:bg-white/10">
                  Ver todos
                </Button>
              ) : null}
            </div>
          </form>
          {sortedUsers.length ? (
            userLayout === 'list' ? (
              <div className="mt-4 overflow-auto" style={{ scrollbarGutter: 'stable both-edges' }}>
                <table className="min-w-full text-sm text-white">
                  <thead className="text-gray-300 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Correo</th>
                      <th className="px-3 py-2 text-left">Puntos</th>
                      <th className="px-3 py-2 text-left">Certificados</th>
                      <th className="px-3 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => (
                      <tr key={u.uid || u.email} className="border-b border-white/5">
                        <td className="px-3 py-2 font-semibold">{getUserName(u)}</td>
                        <td className="px-3 py-2 text-gray-200">{u.email}</td>
                        <td className="px-3 py-2">{u.balance || 0}</td>
                        <td className="px-3 py-2">{u.certificateCount || 0}</td>
                        <td className="px-3 py-2">
                          <Button size="sm" variant="outline" onClick={() => openUserModal(u)} className="border-white/20 text-white hover:bg-white/10">
                            Detalles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" style={{ scrollbarGutter: 'stable both-edges' }}>
                {sortedUsers.map((u) => (
                  <div key={u.uid || u.email} className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{getUserName(u)}</p>
                        <p className="text-xs text-gray-300">{u.email}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openUserModal(u)} className="border-white/20 text-white hover:bg-white/10">
                        Detalles
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-300">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">{u.balance || 0} pts</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">{u.certificateCount || 0} certs</span>
                    </div>
                    <p className="text-xs text-gray-400">UID: {u.uid}</p>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-300">Marketplace</p>
              <h2 className="text-xl font-bold">Productos</h2>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-gray-300">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left">Imagen</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Precio</th>
                  <th className="px-3 py-2 text-left">Stock</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 text-white">
                    <td className="px-3 py-2">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name || 'Producto'}
                          className="h-12 w-12 rounded-xl object-cover border border-white/10 bg-black/30"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl border border-dashed border-white/10 bg-black/20" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-400 line-clamp-1">{p.description}</div>
                    </td>
                    <td className="px-3 py-2">{p.price} pts</td>
                    <td className="px-3 py-2">{p.stock}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${p.active === false ? 'bg-white/5 text-gray-400' : 'bg-boreal-aqua/20 text-boreal-aqua'}`}>
                        <Power size={12} /> {p.active === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditProductModal(p)} className="border-white/20 text-white hover:bg-white/10">
                          <Edit2 size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleActive(p)} className="border-white/20 text-white hover:bg-white/10">
                          <Power size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(p)} className="border-red-500/60 text-red-200 hover:bg-red-500/10">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!products.length ? (
              <div className="py-10 text-center text-gray-400">Sin productos cargados.</div>
            ) : null}
          </div>
        </section>
      </main>

      {renderProductModal()}
      {renderUserModal()}
    </div>
  );
};

export default AdminPage;
