import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchLaundryProducts, createLaundryProduct, updateLaundryProduct } from './services/laundryProducts.services.jsx';
import { fetchProducts as fetchGlobalProducts } from '@/pages/parametrizacion/products/Services/products.services.js';
import { fetchProviders } from '@/pages/parametrizacion/providers/Services/providers.services.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function LaundryProductsPage() {
  const { idLavanderia } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [globals, setGlobals] = useState([]);
  const [form, setForm] = useState({ productoId: '', costo: '', precio: '', stockMinimo: '', proveedorId: '', presentacionLitros: '' });
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [lp, gp, prov] = await Promise.all([
        fetchLaundryProducts({ lavanderiaId: idLavanderia, onlyActive: true }),
        fetchGlobalProducts({ limit: 500, offset: 1, query: {} }),
        fetchProviders({ limit: 500, offset: 1, query: { estado: 'Activo' } }),
      ]);
      setItems(lp?.data || []);
      const gpList = Array.isArray(gp?.data) ? gp.data : Array.isArray(gp?.items) ? gp.items : [];
      setGlobals(gpList);
      const provList = Array.isArray(prov?.data) ? prov.data : Array.isArray(prov?.items) ? prov.items : [];
      setProviders(provList.map(p => ({ id: p._id || p.id, nombre: p.nombre })));
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo cargar la lista', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [idLavanderia]);

  const globalOptions = useMemo(() => globals.map(p => ({ id: p._id || p.id, nombre: p.nombre, presentacionLitros: Number(p.presentacionLitros || 0) })), [globals]);
  const selectedGlobal = useMemo(() => globalOptions.find(g => g.id === form.productoId), [globalOptions, form.productoId]);
  const providerOptions = useMemo(() => providers.map(p => ({ id: p.id, nombre: p.nombre })), [providers]);
  const selectedProvider = useMemo(() => providerOptions.find(p => p.id === form.proveedorId), [providerOptions, form.proveedorId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.productoId) {
      toast({ title: 'Producto requerido', description: 'Selecciona un producto.' , variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        lavanderia: { id: idLavanderia, nombre: '' },
        producto: { id: form.productoId },
        costo: Number(form.costo || 0),
        precio: Number(form.precio || 0),
        stockMinimo: Number(form.stockMinimo || 0),
        proveedor: form.proveedorId ? { id: form.proveedorId, nombre: selectedProvider?.nombre || '' } : undefined,
        presentacionLitros: form.presentacionLitros !== '' ? Number(form.presentacionLitros) : undefined,
      };
      await createLaundryProduct(payload);
      toast({ title: 'Creado', description: 'Producto agregado al centro.' });
      setForm({ productoId: '', costo: '', precio: '', stockMinimo: '', proveedorId: '', presentacionLitros: '' });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'No se pudo crear', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      await updateLaundryProduct(id, patch);
      toast({ title: 'Actualizado', description: 'Cambios guardados.' });
      await load();
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 space-y-6">
            <Button asChild variant="outline">
          <Link to={`/centros-lavado/${idLavanderia}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
      <div className="flex items-center">

        <div>
          <h1 className="text-2xl font-semibold">Productos del Centro</h1>
          <p className="text-sm text-muted-foreground">Gestiona costos, precios, proveedor y stock mínimo por centro de lavado.</p>
        </div>
       
      </div>

      {/* Formulario de alta */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
        <div className="md:col-span-2">
          <label className="text-sm">Producto</label>
          <Select
            value={form.productoId}
            onValueChange={(v) => {
              const prod = globals.find(p => (p._id || p.id) === v) || {};
              const prov = prod?.proveedor;
              const proveedorId = prov && typeof prov === 'object' ? (prov.id || prov._id || '') : '';
              setForm(f => ({
                ...f,
                productoId: v,
                // Autocompletar desde el producto global seleccionado; el usuario puede modificar luego
                costo: prod?.costo !== undefined && prod?.costo !== null ? String(prod.costo) : '',
                presentacionLitros: prod?.presentacionLitros !== undefined && prod?.presentacionLitros !== null ? String(prod.presentacionLitros) : '',
                proveedorId,
              }));
            }}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {globalOptions.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Presentación (L)</label>
          <Input type="number" step="0.01" value={form.presentacionLitros}
                 placeholder={selectedGlobal ? String(selectedGlobal.presentacionLitros) : 'auto'}
                 onChange={e => setForm(f => ({ ...f, presentacionLitros: e.target.value }))}
                 className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-sm">Costo</label>
          <Input type="number" step="0.01" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-sm">Precio</label>
          <Input type="number" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-sm">Stock mínimo</label>
          <Input type="number" step="1" value={form.stockMinimo} onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-sm">Proveedor</label>
          <Input value={selectedProvider?.nombre || ''} readOnly placeholder="Proveedor (auto)" className="h-8 text-sm bg-muted/50" />
        </div>
        <div className="md:col-span-7">
          <Button type="submit" disabled={saving}>Agregar</Button>
        </div>
      </form>

      {/* Lista */}
      <div className="border rounded-md">
        <div className="grid grid-cols-7 gap-2 p-2 font-medium bg-muted/40">
          <div>Producto</div>
          <div>Presentación (L)</div>
          <div>Costo</div>
          <div>Precio</div>
          <div>Stock mínimo</div>
          <div>Proveedor</div>
          <div></div>
        </div>
        {loading ? (
          <div className="p-4 text-sm">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm">No hay productos configurados para este centro.</div>
        ) : (
          items.map((it) => (
            <Row key={it._id || it.id} item={it} onUpdate={handleUpdate} providerOptions={providerOptions} />
          ))
        )}
      </div>
    </div>
  );
}

function Row({ item, onUpdate, providerOptions }) {
  const [edit, setEdit] = useState({
    costo: item.costo ?? 0,
    precio: item.precio ?? 0,
    stockMinimo: item.stockMinimo ?? 0,
    proveedorId: item?.proveedor?.id || '',
  });
  const saving = false;

  return (
    <div className="grid grid-cols-7 gap-2 p-2 border-t items-center">
      <div className="truncate" title={item?.producto?.nombre}>{item?.producto?.nombre}</div>
      <div>{Number(item.presentacionLitros || 0)}</div>
      <div>
        <Input type="number" step="0.01" value={edit.costo} onChange={e => setEdit({ ...edit, costo: e.target.value })} className="h-8 text-sm" />
      </div>
      <div>
        <Input type="number" step="0.01" value={edit.precio} onChange={e => setEdit({ ...edit, precio: e.target.value })} className="h-8 text-sm" />
      </div>
      <div>
        <Input type="number" step="1" value={edit.stockMinimo} onChange={e => setEdit({ ...edit, stockMinimo: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="text-sm truncate" title={item?.proveedor?.nombre || ''}>{item?.proveedor?.nombre || ''}</div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setEdit({
          costo: item.costo ?? 0,
          precio: item.precio ?? 0,
          stockMinimo: item.stockMinimo ?? 0,
          proveedorId: item?.proveedor?.id || '',
        })}>Reset</Button>
        <Button disabled={saving} onClick={() => onUpdate(item._id || item.id, {
          costo: Number(edit.costo || 0),
          precio: Number(edit.precio || 0),
          stockMinimo: Number(edit.stockMinimo || 0),
          // proveedor no editable
        })}>Guardar</Button>
      </div>
    </div>
  );
}
