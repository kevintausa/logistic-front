import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { createInventoryRegistriesBatch } from '../services/inventoryRegistries.services';

const EntryModal = ({ open, onOpenChange, idLavanderia, laundryName = '', onCreated, products = [], loadingProducts = false }) => {
  const { toast } = useToast();
  // Fecha y número de factura global para todas las líneas
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10)); // yyyy-mm-dd
  const [numeroFactura, setNumeroFactura] = useState('');
  // Líneas de productos (múltiples)
  const [lines, setLines] = useState([
    { producto: '', cantidad: '', costoUnitario: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const productOptions = useMemo(() => Array.isArray(products) ? products : [], [products]);
  const findProduct = (id) => productOptions.find(p => p._id === id) || null;

  useEffect(() => {
    if (!open) {
      setFecha(new Date().toISOString().slice(0,10));
      setNumeroFactura('');
      setLines([{ producto: '', cantidad: '', costoUnitario: '' }]);
      setSubmitting(false);
    }
  }, [open]);

  const handleLineChange = (index, field, value) => {
    setLines(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'producto') {
        const prod = findProduct(value);
        // costo unitario = costo total / presentación (p.e. litros)
        if (prod && typeof prod.costo === 'number' && typeof prod.presentacionLitros === 'number' && prod.presentacionLitros > 0) {
          const unit = prod.costo / prod.presentacionLitros;
          next[index].costoUnitario = String(unit);
        } else if (prod && typeof prod.costo === 'number') {
          next[index].costoUnitario = String(prod.costo);
        } else {
          next[index].costoUnitario = '';
        }
      }
      return next;
    });
  };

  const addLine = () => setLines(prev => ([...prev, { producto: '', cantidad: '', costoUnitario: '' }]));
  const removeLine = (idx) => setLines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validación básica
      const validLines = lines.filter(l => l.producto && l.cantidad && Number(l.cantidad) > 0);
      if (validLines.length === 0) {
        toast({ title: 'Campos requeridos', description: 'Agrega al menos una línea con producto y cantidad.', variant: 'destructive' });
        return;
      }
      setSubmitting(true);
      // Construir arreglo batch con estructura anidada solicitada
      const items = validLines.map(l => {
        const prod = findProduct(l.producto);
        return {
          lavanderia: { id: idLavanderia, nombre: laundryName || 'Centro de lavado' },
          producto: { id: l.producto, nombre: prod?.nombre || '' },
          tipoMovimiento: 'entrada',
          cantidad: Number(l.cantidad),
          costoUnitario: (l.costoUnitario === '' ? undefined : Number(l.costoUnitario)),
          fecha: new Date(fecha).toISOString(),
          numeroFactura: numeroFactura || undefined,
          stockMinimo: (typeof prod?.stockMinimo === 'number' ? prod.stockMinimo : undefined),
        };
      });
      await createInventoryRegistriesBatch(items);
      toast({ title: 'Entradas registradas', description: `${items.length} entrada(s) creadas correctamente.` });
      onOpenChange(false);
      onCreated && onCreated();
    } catch (error) {
      console.error('Error creando entrada:', error);
      const message = error?.response?.data?.message || error.message || 'No se pudo crear la entrada.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Registrar entrada de producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha y número de factura global */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Número de factura</label>
              <Input type="text" placeholder="Opcional" value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} />
            </div>
            <div className="sm:col-start-3">
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
          </div>

          {/* Líneas dinámicas */}
          <div className="space-y-3">
            {lines.map((l, idx) => {
              const prod = findProduct(l.producto);
              const total = (Number(l.cantidad) || 0) * (Number(l.costoUnitario) || 0);
              return (
                <div key={idx} className="rounded-lg border p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-start">
                    <div className="sm:col-span-2 min-w-0">
                      <label className="block text-sm font-medium mb-1">Producto</label>
                      <select
                        value={l.producto}
                        onChange={(e) => handleLineChange(idx, 'producto', e.target.value)}
                        className="w-full border rounded-md p-2 h-10 bg-black"
                        disabled={loadingProducts}
                        required
                      >
                        <option value="" disabled>{loadingProducts ? 'Cargando productos...' : 'Selecciona un producto'}</option>
                        {productOptions.map(p => (
                          <option key={p._id} value={p._id}>{p.nombre}{p.unidad ? ` (${p.unidad})` : ''}</option>
                        ))}
                      </select>
                      <div className="h-6 mt-1">
                        {prod ? (
                          <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Unidad: {prod.unidad || '-'}{prod.stockMinimo ? ` · Stock mínimo: ${prod.stockMinimo}` : ''}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium mb-1">Cantidad</label>
                      <Input
                        type="number"
                        value={l.cantidad}
                        onChange={(e) => handleLineChange(idx, 'cantidad', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        className="h-10"
                      />
                      <div className="h-6 mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Costo unitario</label>
                      <Input
                        type="number"
                        value={l.costoUnitario}
                        onChange={(e) => handleLineChange(idx, 'costoUnitario', e.target.value)}
                        min="0"
                        step="0.01"
                        className="h-10"
                      />
                      <div className="h-6 mt-1">
                        {prod && typeof prod.costo === 'number' ? (
                          <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Costo: {(prod.costo).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} / {typeof prod.presentacionLitros === 'number' ? `${prod.presentacionLitros} ${prod.unidad || 'und'}` : (prod.unidad || 'und')}</p>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Costo total</label>
                      <Input type="number" value={Number.isFinite(total) ? total : 0} readOnly className="h-10" />
                      <div className="h-6 mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 opacity-0 select-none">Acciones</label>
                      <div className="h-10 flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={addLine} aria-label="Agregar línea">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)} disabled={lines.length === 1} aria-label="Quitar línea">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="h-6 mt-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar entradas'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EntryModal;
