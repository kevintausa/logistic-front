import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createInventoryRegistry } from '../services/inventoryRegistries.services';
import { useAuth } from '@/contexts/AuthContext';

const AdjustStockModal = ({
  open,
  onOpenChange,
  idLavanderia,
  laundryName = '',
  product, // { id, nombre, current }
  onSaved,
  onSavingStart,
  onSavingEnd,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newStock, setNewStock] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (open && product) {
      setNewStock(String(product.current ?? 0));
      setFecha(new Date().toISOString().slice(0, 10));
      setObs('');
      setSubmitting(false);
    }
    if (!open) {
      setNewStock('');
      setObs('');
      setSubmitting(false);
    }
  }, [open, product]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!product?.id || !idLavanderia) return;

    const current = Number(product.current ?? 0);
    const parsed = Number(newStock);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast({ title: 'Valor inválido', description: 'Ingresa un número válido mayor o igual a 0', variant: 'destructive' });
      return;
    }
    const delta = parsed - current;
    if (delta === 0) {
      toast({ title: 'Sin cambios', description: 'El stock ingresado es igual al actual.' });
      return;
    }

    try {
      onSavingStart && onSavingStart();
      setSubmitting(true);
      const base = {
        fecha: new Date(fecha).toISOString(),
        lavanderia: { id: idLavanderia, nombre: laundryName || '' },
        producto: { id: product.id, nombre: product.nombre },
      };
      const updaterNote = user ? ` · Por: ${user.name || user.email || user.id || ''}` : '';
      const observaciones = `Ajuste manual de stock${updaterNote}${obs ? ` · Nota: ${obs}` : ''}`;

      if (delta > 0) {
        const cantidad = Math.abs(delta);
        await createInventoryRegistry({
          ...base,
          tipoMovimiento: 'entrada',
          cantidad,
          cantidadInicial: cantidad,
          cantidadUsada: 0,
          cantidadRestante: cantidad,
          observaciones,
        });
        toast({ title: 'Stock ajustado', description: `${product.nombre}: +${cantidad}` });
      } else {
        const consumoAjuste = Math.abs(delta);
        await createInventoryRegistry({
          ...base,
          tipoMovimiento: 'consumo',
          cantidad: consumoAjuste,
          cantidadInicial: current,
          cantidadUsada: consumoAjuste,
          cantidadRestante: parsed,
          observaciones,
        });
        toast({ title: 'Stock ajustado', description: `${product.nombre}: -${consumoAjuste}` });
      }
      onSaved && onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error('Error ajustando stock:', err);
      toast({ title: 'Error', description: err.message || 'No se pudo ajustar el stock', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      onSavingEnd && onSavingEnd();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar stock: {product?.nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stock actual</label>
            <Input value={product?.current ?? 0} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nuevo stock</label>
            <Input type="number" min="0" step="0.01" value={newStock} onChange={(e) => setNewStock(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div>\n            <label className="block text-sm font-medium mb-1">Observaciones (opcional)</label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Motivo o nota del ajuste" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar ajuste'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustStockModal;
