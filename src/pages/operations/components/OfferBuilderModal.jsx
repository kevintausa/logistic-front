import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const toCurrency = (v) => {
  const n = Number(v || 0);
  return isNaN(n) ? '' : n.toFixed(2);
};

const rowBase = { tipo: 'manual', concepto: '', montoUsd: 0 };

const OfferBuilderModal = ({ isOpen, onClose, operation, initialDraft, onSave }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [notas, setNotas] = useState('');
  const provider = initialDraft?.provider || operation?.cotizacionSeleccionadaProveedor || null;

  useEffect(() => {
    if (isOpen) {
      setItems(initialDraft?.items || []);
      setNotas(initialDraft?.notas || '');
    }
  }, [isOpen, initialDraft]);

  const totals = useMemo(() => {
    const subtotalCotizacionUsd = (items || []).filter(i => i.tipo === 'cotizacion').reduce((a, b) => a + Number(b.montoUsd || 0), 0);
    const subtotalManualUsd = (items || []).filter(i => i.tipo === 'manual').reduce((a, b) => a + Number(b.montoUsd || 0), 0);
    return { subtotalCotizacionUsd, subtotalManualUsd, totalUsd: subtotalCotizacionUsd + subtotalManualUsd };
  }, [items]);

  const addManual = () => setItems((prev) => [...prev, { ...rowBase }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, patch) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const handleSave = async () => {
    try {
      const payload = {
        operationId: operation?._id,
        quoteId: initialDraft?.quoteId || operation?.cotizacionSeleccionadaId,
        provider,
        items: items.map((i) => ({ tipo: i.tipo, concepto: i.concepto, montoUsd: Number(i.montoUsd || 0) })),
        notas,
      };
      await onSave(payload);
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo guardar la oferta', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-4 md:p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Definir Oferta</h3>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Cliente</div>
              <div className="font-medium">{operation?.cliente?.nombre || operation?.clienteNombre}</div>
            </div>
            <div>
              <div className="text-gray-500">Proveedor</div>
              <div className="font-medium">{provider?.nombre || provider?.id || '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">Operación</div>
              <div className="font-medium">{operation?.codigo || operation?._id}</div>
            </div>
            <div>
              <div className="text-gray-500">Email Proveedor</div>
              <div className="font-medium">{provider?.correo || '—'}</div>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-xs font-semibold">
              <div className="col-span-6">Concepto</div>
              <div className="col-span-2 text-center">Tipo</div>
              <div className="col-span-3 text-right">Monto (USD)</div>
              <div className="col-span-1"></div>
            </div>
            <div className="max-h-72 overflow-auto">
              {(items || []).map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                  <div className="col-span-6">
                    <Input
                      value={it.concepto || ''}
                      disabled={it.tipo === 'cotizacion'}
                      onChange={(e) => updateItem(idx, { concepto: e.target.value })}
                      placeholder="Concepto"
                    />
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${it.tipo === 'cotizacion' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {it.tipo}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <Input
                      className="text-right"
                      value={toCurrency(it.montoUsd)}
                      disabled={it.tipo === 'cotizacion'}
                      onChange={(e) => updateItem(idx, { montoUsd: e.target.value.replace(/,/g, '.') })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {it.tipo === 'manual' && (
                      <Button variant="ghost" className="text-red-600" onClick={() => removeItem(idx)}>Eliminar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-3 py-2">
              <Button variant="outline" onClick={addManual}>Agregar cargo manual</Button>
              <div className="text-sm">
                <div>Subtotal cotización: <span className="font-semibold">${toCurrency(totals.subtotalCotizacionUsd)}</span></div>
                <div>Subtotal manual: <span className="font-semibold">${toCurrency(totals.subtotalManualUsd)}</span></div>
                <div>Total: <span className="font-bold">${toCurrency(totals.totalUsd)}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-1">Notas</div>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas para el cliente" />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Oferta</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfferBuilderModal;
