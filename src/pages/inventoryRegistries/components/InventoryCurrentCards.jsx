import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentInventory } from '../services/inventoryCurrent.services';
import { createInventoryRegistry } from '../services/inventoryRegistries.services';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AdjustStockModal from './AdjustStockModal';

const InventoryCurrentCards = ({ idLavanderia, laundryName, refreshKey, onSavingStart, onSaved, onSavingEnd }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState({}); // { [productId]: enteredCount }
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null); // { id, nombre, current }

  const load = useCallback(async () => {
    if (!idLavanderia) return;
    setIsLoading(true);
    try {
      const res = await getCurrentInventory({ lavanderiaId: idLavanderia });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error('Error cargando inventario actual:', e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [idLavanderia]);

  // Auto-cargar al montar y cuando cambie la lavandería o el refreshKey
  useEffect(() => {
    load();
  }, [load, idLavanderia, refreshKey]);

  const inventoryByProduct = useMemo(() => {
    const list = (items || []).map((it) => ({
      id: it?.producto?.id || it?.producto?._id,
      nombre: it?.producto?.nombre || 'Producto',
      stock: Number(it?.stockActual ?? 0),
      min: typeof it?.stockMinimo === 'number' ? Number(it.stockMinimo) : 0,
    }));
    return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [items]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Package className="mr-2 h-5 w-5 text-primary" /> Inventario actual
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            {isLoading ? 'Consultando…' : 'Consultar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : inventoryByProduct.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos. Usa "Actualizar" para calcular bajo demanda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {inventoryByProduct.map((p) => {
              const current = p.stock < 0 ? 0 : p.stock;
              const min = typeof p.min === 'number' ? p.min : 0;
              const belowMin = current < min;
              const rawEntered = counts[p.id];
              const hasInput = !(rawEntered === undefined || rawEntered === null || rawEntered === '');
              const entered = hasInput ? Number(rawEntered) : NaN;
              const validEntered = hasInput && !Number.isNaN(entered) && entered >= 0;
              const consumo = validEntered ? Math.max(0, current - entered) : 0;
              const disabled = !hasInput || !validEntered || consumo <= 0 || !p.id || !idLavanderia || saving;

              const handleChange = (e) => {
                const v = e.target.value;
                setCounts((prev) => ({ ...prev, [p.id]: v }));
              };

              const handleSave = async () => {
                try {
                  onSavingStart && onSavingStart();
                  setSaving(true);
                  await createInventoryRegistry({
                    tipoMovimiento: 'consumo',
                    fecha: new Date().toISOString(),
                    lavanderia: { id: idLavanderia, nombre: laundryName || '' },
                    producto: { id: p.id, nombre: p.nombre },
                    cantidad: consumo,
                    cantidadInicial: current,
                    cantidadUsada: consumo,
                    cantidadRestante: validEntered ? entered : 0,
                  });
                  toast({ title: 'Consumo registrado', description: `${p.nombre}: -${consumo}` });
                  // refrescar inventario y limpiar campo
                  await load();
                  setCounts((prev) => ({ ...prev, [p.id]: '' }));
                  onSaved && onSaved();
                } catch (err) {
                  console.error('Error registrando consumo:', err);
                  toast({ title: 'Error', description: err.message || 'No se pudo registrar el consumo', variant: 'destructive' });
                } finally {
                  setSaving(false);
                  onSavingEnd && onSavingEnd();
                }
              };

              const handleOpenAdjustModal = () => {
                setAdjustProduct({ id: p.id, nombre: p.nombre, current });
                setAdjustOpen(true);
              };

              return (
                <div
                  key={p.id || p.nombre}
                  className={`rounded-lg border p-4 space-y-2 ${belowMin ? 'border-red-300 bg-red-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{p.nombre}</p>
                    <div className="flex items-center gap-2">
                      {belowMin && (
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="h-3 w-3" /> Bajo stock
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">Actual: {current}</span>
                    </div>
                  </div>
                  {min > 0 && (
                    <div className="text-[11px] text-muted-foreground">Mínimo: {min}</div>
                  )}
                  <input
                    type="number"
                    min="0"
                    value={counts[p.id] ?? ''}
                    onChange={handleChange}
                    placeholder="Conteo físico"
                    className="w-full rounded-md border px-3 py-2 text-sm bg-primary/10"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Consumo calculado:</span>
                    <span className="font-medium">{consumo}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={disabled} className="flex-1">
                      Guardar consumo
                    </Button>
                    {isAdmin() && (
                      <Button size="sm" variant="outline" onClick={handleOpenAdjustModal} disabled={saving}>
                        Ajustar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {isAdmin() && (
        <AdjustStockModal
          open={adjustOpen}
          onOpenChange={(v) => {
            setAdjustOpen(v);
            if (!v) setAdjustProduct(null);
          }}
          idLavanderia={idLavanderia}
          laundryName={laundryName}
          product={adjustProduct}
          onSaved={async () => {
            await load();
            onSaved && onSaved();
          }}
          onSavingStart={onSavingStart}
          onSavingEnd={onSavingEnd}
        />
      )}
    </Card>
  );
};

export default InventoryCurrentCards;
