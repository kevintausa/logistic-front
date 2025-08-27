import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { fetchProviders } from '@/pages/parametrizacion/providers/Services/providers.services';

const NumberInput = ({ label, value, onChange, step = '0.01' }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-blue-700 font-medium">{label}</label>
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value || '0'))}
      className="w-full rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-background"
    />
  </div>
);

const TextInput = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-blue-700 font-medium">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-background"
    />
  </div>
);

const TextArea = ({ label, value, onChange, rows = 3 }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-blue-700 font-medium">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-background resize-y"
    />
  </div>
);

const QuoteModal = ({ isOpen, onClose, onSave, operation }) => {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [form, setForm] = useState({
    providerId: '',
    fleteUsd: 0,
    gastosOrigenUsd: 0,
    gastosDestinoUsd: 0,
    otrosGastosUsd: 0,
    ttatDias: '',
    ruta: '',
    nota: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    const loadProviders = async () => {
      setLoadingProviders(true);
      try {
        const { data } = await fetchProviders({ limit: 100, offset: 1 });
        setProviders(Array.isArray(data) ? data : []);
      } catch (e) {
        // fallback empty
        setProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    };
    loadProviders();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // reset when opening for a specific operation
    setForm({
      providerId: '',
      fleteUsd: 0,
      gastosOrigenUsd: 0,
      gastosDestinoUsd: 0,
      otrosGastosUsd: 0,
      ttatDias: '',
      ruta: '',
      nota: '',
    });
  }, [isOpen, operation?._id]);

  const total = useMemo(() => {
    const { fleteUsd, gastosOrigenUsd, gastosDestinoUsd, otrosGastosUsd } = form;
    const sum = [fleteUsd, gastosOrigenUsd, gastosDestinoUsd, otrosGastosUsd]
      .map(v => parseFloat(String(v || 0)))
      .reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [form]);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    // minimal validation
    if (!form.providerId) return; // Could show a toast outside
    const payload = {
      ...form,
      totalUsd: total,
      operationId: operation?._id,
    };
    onSave && onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-card p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-blue-100 border-t-[6px] border-t-blue-600"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-blue-700">Agregar cotización {operation?.codigo ? `para ${operation.codigo}` : ''}</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-blue-700 font-medium">Proveedor</label>
              <select
                value={form.providerId}
                onChange={(e) => handleChange('providerId', e.target.value)}
                className="w-full rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-background"
              >
                <option value="">{loadingProviders ? 'Cargando...' : 'Seleccione un proveedor'}</option>
                {providers.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.nombre || p.name}</option>
                ))}
              </select>
            </div>

            <NumberInput label="Flete (USD)" value={form.fleteUsd} onChange={(v) => handleChange('fleteUsd', v)} />
            <NumberInput label="Gastos Origen (USD)" value={form.gastosOrigenUsd} onChange={(v) => handleChange('gastosOrigenUsd', v)} />
            <NumberInput label="Gastos Destino (USD)" value={form.gastosDestinoUsd} onChange={(v) => handleChange('gastosDestinoUsd', v)} />
            <NumberInput label="Otros Gastos (USD)" value={form.otrosGastosUsd} onChange={(v) => handleChange('otrosGastosUsd', v)} />
            <TextInput label="Tiempo de tránsito (días)" value={form.ttatDias} onChange={(v) => handleChange('ttatDias', v)} />
            <TextInput label="Ruta" value={form.ruta} onChange={(v) => handleChange('ruta', v)} />
            <div className="md:col-span-2">
              <TextArea label="Nota" value={form.nota} onChange={(v) => handleChange('nota', v)} />
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-3 rounded border border-blue-200 bg-blue-50">
              <span className="text-sm font-semibold text-blue-800">Total (USD)</span>
              <span className="text-lg font-bold text-blue-900">{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} className="text-blue-700 hover:bg-blue-50">Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuoteModal;
