import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createOrder, sendOrderPreviewEmail, reserveOrderNumber } from '../services/orders.services';

const OrderModal = ({ open, onOpenChange, idLavanderia, laundryName = '', products = [], loadingProducts = false, onCreated }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([{ id: 1, productoId: '', cantidad: '' }]);
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const productOptions = useMemo(() => Array.isArray(products) ? products : [], [products]);
  const getSelected = (pid) => productOptions.find(p => p._id === pid) || null;
  const computeLitros = (pid, qty) => {
    const sel = getSelected(pid);
    const pres = Number(sel?.presentacionLitros ?? 0) || 0;
    return (Number(qty) || 0) * pres;
  };

  const handleOpenEmail = () => {
    const valid = items.filter(it => it.productoId && Number(it.cantidad) > 0);
    if (valid.length === 0) {
      toast({ title: 'Sin ítems', description: 'Agrega al menos un producto con cantidad válida.', variant: 'destructive' });
      return;
    }
    const fecha = new Date();
    const centro = laundryName || 'Centro de lavado';
    const subject = `Resumen de pedido - ${centro}`;
    const lines = [];
    lines.push(`Centro: ${centro}`);
    lines.push(`Fecha: ${fecha.toLocaleString()}`);
    if (observaciones) lines.push(`Observaciones: ${observaciones}`);
    lines.push('');
    lines.push('Detalle:');
    let totalLitros = 0;
    valid.forEach((it, idx) => {
      const sel = getSelected(it.productoId);
      const litros = computeLitros(it.productoId, it.cantidad);
      totalLitros += Number.isFinite(litros) ? litros : 0;
      lines.push(`${idx + 1}. ${sel?.nombre || ''}  | Cant: ${Number(it.cantidad)}  | Litros: ${Number.isFinite(litros) ? litros : 0}`);
    });
    lines.push('');
    lines.push(`Total litros: ${totalLitros}`);
    const body = encodeURIComponent(lines.join('\n'));
    const to = encodeURIComponent(emailTo || '');
    const subj = encodeURIComponent(subject);
    const mailto = `mailto:${to}?subject=${subj}&body=${body}`;
    window.location.href = mailto;
  };

  const handleSendPreview = async () => {
    const valid = items.filter(it => it.productoId && Number(it.cantidad) > 0);
    if (!emailTo) {
      toast({ title: 'Correo requerido', description: 'Ingresa un correo destinatario.', variant: 'destructive' });
      return;
    }
    if (valid.length === 0) {
      toast({ title: 'Sin ítems', description: 'Agrega al menos un producto con cantidad válida.', variant: 'destructive' });
      return;
    }
    try {
      setSendingEmail(true);
      const itemsSummary = valid.map((it) => {
        const sel = getSelected(it.productoId);
        const litros = computeLitros(it.productoId, it.cantidad);
        return {
          productoNombre: sel?.nombre || '',
          cantidad: Number(it.cantidad),
          litrosTotal: Number.isFinite(litros) ? litros : 0,
        };
      });
      await sendOrderPreviewEmail({
        to: emailTo,
        lavanderiaNombre: laundryName || 'Centro de lavado',
        fecha: new Date().toISOString(),
        items: itemsSummary,
        observaciones: observaciones || undefined,
      });
      toast({ title: 'Resumen enviado', description: `Se envió el resumen a ${emailTo}` });
    } catch (error) {
      console.error('Error enviando resumen:', error);
      const message = error?.response?.data?.message || error.message || 'No se pudo enviar el correo.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setItems([{ id: 1, productoId: '', cantidad: '' }]);
      setObservaciones('');
      setSubmitting(false);
      setEmailTo('');
      setSendingEmail(false);
    }
  }, [open]);

  const addRow = () => {
    setItems((prev) => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, productoId: '', cantidad: '' }]);
  };

  const removeRow = (id) => {
    setItems((prev) => (prev.length > 1 ? prev.filter(it => it.id !== id) : prev));
  };

  const updateRow = (id, patch) => {
    setItems((prev) => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = items.filter(it => it.productoId && Number(it.cantidad) > 0);
    if (valid.length === 0) {
      toast({ title: 'Campos requeridos', description: 'Agrega al menos un producto con cantidad válida.', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      let sharedNumero = '';
      try {
        const resNum = await reserveOrderNumber();
        sharedNumero = resNum?.data?.numeroPedido || '';
      } catch (_) {
        // If reservation fails, backend will still generate numbers, but they won't be shared
        sharedNumero = '';
      }
      const results = [];
      for (const it of valid) {
        const sel = getSelected(it.productoId);
        const payload = {
          fecha: new Date().toISOString(),
          lavanderia: { id: idLavanderia, nombre: laundryName || 'Centro de lavado' },
          producto: { id: it.productoId, nombre: sel?.nombre || '' },
          cantidad: Number(it.cantidad),
          observaciones: observaciones || undefined,
          numeroPedido: sharedNumero || undefined,
        };
        const res = await createOrder(payload);
        results.push(res?.data);
      }
      const numero = (sharedNumero || results?.[0]?.numeroPedido || '').toString();
      const numText = numero ? `#${numero}` : '';
      toast({ title: 'Pedidos creados', description: `${results.length} pedido(s) creados ${numText ? '(' + numText + ')' : ''}` });
      onOpenChange(false);
      onCreated && onCreated(results);
    } catch (error) {
      console.error('Error creando pedido:', error);
      const message = error?.response?.data?.message || error.message || 'No se pudo crear el pedido.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Hacer pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rows */}
          <div className="space-y-3">
            {items.map((row) => {
              const sel = getSelected(row.productoId);
              const litros = computeLitros(row.productoId, row.cantidad);
              return (
                <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium mb-1">Producto</label>
                    <select
                      value={row.productoId}
                      onChange={(e) => updateRow(row.id, { productoId: e.target.value })}
                      className="w-full border rounded-md p-2 h-10 bg-black"
                      disabled={loadingProducts}
                      required
                    >
                      <option value="" disabled>{loadingProducts ? 'Cargando productos...' : 'Selecciona un producto'}</option>
                      {productOptions.map(p => (
                        <option key={p._id} value={p._id}>{p.nombre}{p.unidad ? ` (${p.unidad})` : ''}</option>
                      ))}
                    </select>
                    {!!sel && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Presentación: {Number(sel?.presentacionLitros ?? 0) || 0} {sel?.unidad || 'und'}{sel?.stockMinimo ? ` · Stock mínimo: ${sel.stockMinimo}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                    <Input
                      type="number"
                      value={row.cantidad}
                      onChange={(e) => updateRow(row.id, { cantidad: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Litros</label>
                    <div className="h-10 flex items-center px-3 border rounded-md text-sm bg-black">
                      {Number.isFinite(litros) ? litros : 0}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex items-end gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={addRow} title="Agregar fila" aria-label="Agregar fila">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={items.length <= 1} title="Quitar fila" aria-label="Quitar fila">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Email resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-sm font-medium mb-1">Enviar resumen a</label>
              <Input
                type="email"
                placeholder="correo@dominio.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="sm:col-span-4 flex items-end gap-2">
              <Button type="button" onClick={handleSendPreview} disabled={sendingEmail || !emailTo} className="w-full">
                {sendingEmail ? 'Enviando...' : 'Enviar resumen'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleOpenEmail} className="w-full">
                Abrir en correo
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional"
              className="w-full border rounded-md p-2 min-h-[90px] bg-black"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Crear pedidos'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
