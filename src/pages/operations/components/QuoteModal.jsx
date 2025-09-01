import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { fetchProviders } from '@/pages/parametrizacion/providers/Services/providers.services';

const NumberInput = ({ label, value, onChange, step = '0.01', placeholder = '0.00' }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // keep display empty if value is 0 or not a finite number
    if (!Number.isFinite(value) || Number(value) === 0) {
      setInputValue('');
    } else {
      setInputValue(String(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    // allow empty and partial decimals
    setInputValue(v);
    const normalized = v.replace(/,/g, '.');
    const num = parseFloat(normalized);
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-blue-700 font-medium">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        step={step}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-background text-right"
      />
    </div>
  );
};

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
    cantidad: 0,
    unidad: 'kg',
    costoUnitarioUsd: 0,
    tarifaMinimaUsd: 0,
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
      cantidad: 0,
      unidad: 'kg',
      costoUnitarioUsd: 0,
      tarifaMinimaUsd: 0,
      gastosOrigenUsd: 0,
      gastosDestinoUsd: 0,
      otrosGastosUsd: 0,
      ttatDias: '',
      ruta: '',
      nota: '',
    });
  }, [isOpen, operation?._id]);

  const fleteCalculado = useMemo(() => {
    const cantidad = parseFloat(String(form.cantidad || 0));
    const costo = parseFloat(String(form.costoUnitarioUsd || 0));
    const valor = (isNaN(cantidad) ? 0 : cantidad) * (isNaN(costo) ? 0 : costo);
    return Number.isFinite(valor) ? valor : 0;
  }, [form.cantidad, form.costoUnitarioUsd]);

  const fleteAplicado = useMemo(() => {
    const minimo = parseFloat(String(form.tarifaMinimaUsd || 0));
    const minVal = isNaN(minimo) ? 0 : minimo;
    return Math.max(fleteCalculado, minVal);
  }, [fleteCalculado, form.tarifaMinimaUsd]);

  const total = useMemo(() => {
    const { gastosOrigenUsd, gastosDestinoUsd, otrosGastosUsd } = form;
    const sum = [fleteAplicado, gastosOrigenUsd, gastosDestinoUsd, otrosGastosUsd]
      .map(v => parseFloat(String(v || 0)))
      .reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [form.gastosOrigenUsd, form.gastosDestinoUsd, form.otrosGastosUsd, fleteAplicado]);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    // minimal validation
    if (!form.providerId) return; // Could show a toast outside
    const prov = providers.find(p => (p._id || p.id) === form.providerId);
    const payload = {
      ...form,
      fleteUsd: fleteAplicado,
      totalUsd: total,
      operationId: operation?._id,
      provider: prov ? { id: String(prov._id || prov.id), nombre: prov.nombre || prov.name, correo: prov.correo } : undefined,
      providerNombre: prov?.nombre || prov?.name,
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
          className="bg-card p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-blue-100 border-t-[6px] border-t-blue-600"
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

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-4">
              <NumberInput label="Cantidad" value={form.cantidad} onChange={(v) => handleChange('cantidad', v)} />
              <div className="flex flex-col gap-1">
                <label className="text-sm text-blue-700 font-medium">Unidad</label>
                <select
                  value={form.unidad}
                  onChange={(e) => handleChange('unidad', e.target.value)}
                  className="w-full rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-background"
                >
                  <option value="kg">kg</option>
                  <option value="m3">m3</option>
                </select>
              </div>
              <NumberInput label="Costo unitario (USD)" value={form.costoUnitarioUsd} onChange={(v) => handleChange('costoUnitarioUsd', v)} />
              <NumberInput label="Tarifa mínima (USD)" value={form.tarifaMinimaUsd} onChange={(v) => handleChange('tarifaMinimaUsd', v)} />
              <div className="flex flex-col gap-1">
                <label className="text-sm text-blue-700 font-medium">Flete (USD)</label>
                <input
                  type="number"
                  value={Number.isFinite(fleteAplicado) ? fleteAplicado.toFixed(2) : '0.00'}
                  readOnly
                  className="w-full rounded-md border border-blue-200 focus:outline-none px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput label="Gastos Origen (USD)" value={form.gastosOrigenUsd} onChange={(v) => handleChange('gastosOrigenUsd', v)} />
              <NumberInput label="Gastos Destino (USD)" value={form.gastosDestinoUsd} onChange={(v) => handleChange('gastosDestinoUsd', v)} />
              <NumberInput label="Otros Gastos (USD)" value={form.otrosGastosUsd} onChange={(v) => handleChange('otrosGastosUsd', v)} />
            </div>
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
