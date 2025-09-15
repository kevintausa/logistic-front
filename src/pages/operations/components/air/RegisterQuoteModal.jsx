import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Loader2, Plus, Trash } from 'lucide-react';
import { fetchProviders } from '@/pages/parametrizacion/providers/Services/providers.services';
import { createQuote } from '@/pages/operations/Services/quotes.services';

const numberOrZero = (v) => {
  const n = parseFloat(String(v).replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
};

const CargoDetails = ({ op }) => {
  if (!op) return null;
  const origen = [op?.puertoCarga?.nombre, op?.puertoCarga?.ciudad, op?.puertoCarga?.pais].filter(Boolean).join(', ');
  const destino = [op?.puertoDescarga?.nombre, op?.puertoDescarga?.ciudad, op?.puertoDescarga?.pais].filter(Boolean).join(', ');
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded border bg-muted/30 text-sm">
      <div>
        <div className="text-muted-foreground">Código</div>
        <div className="font-semibold">{op?.codigo || '-'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Tipo</div>
        <div className="font-semibold">{op?.tipo || '-'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Incoterm</div>
        <div className="font-semibold">{op?.incoterm || '-'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Origen</div>
        <div className="font-semibold">{origen || op?.paisOrigen || '-'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Destino</div>
        <div className="font-semibold">{destino || op?.paisDestino || '-'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Totales</div>
        <div className="font-semibold">Piezas: {op?.NoPiezas ?? '-'} | Peso Kg: {op?.pesoTotal ?? '-'} | Peso Vol.: {op?.pesoVolumetrico ?? '-'}</div>
      </div>
    </div>
  );
};

export default function RegisterQuoteModal({ isOpen, onClose, operation, onSaved }) {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [ttatDias, setTtatDias] = useState('');
  const [ruta, setRuta] = useState('');
  const [nota, setNota] = useState('');
  const [vigenciaHasta, setVigenciaHasta] = useState('');

  // Concept form state
  const [conceptForm, setConceptForm] = useState({
    concepto: '',
    valor: '',
    unidadCobro: 'Peso volumetrico',
    minima: '',
    pesoVolumetrico: operation?.pesoVolumetrico || '',
    pesoKg: operation?.pesoTotal || '',
  });
  const [concepts, setConcepts] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setProviderId('');
    setTtatDias('');
    setRuta('');
    setNota('');
    setVigenciaHasta('');
    setConceptForm({
      concepto: '', valor: '', unidadCobro: 'Peso volumetrico', minima: '',
      pesoVolumetrico: operation?.pesoVolumetrico || '',
      pesoKg: operation?.pesoTotal || '',
    });
    setConcepts([]);
  }, [isOpen, operation?.pesoVolumetrico, operation?.pesoTotal]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoadingProviders(true);
      try {
        const { data } = await fetchProviders({ limit: 200, offset: 1 });
        setProviders(Array.isArray(data) ? data : []);
      } catch (e) {
        setProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    };
    load();
  }, [isOpen]);

  const addConcept = () => {
    const c = {
      concepto: conceptForm.concepto?.trim(),
      valor: numberOrZero(conceptForm.valor),
      unidadCobro: conceptForm.unidadCobro,
      minima: numberOrZero(conceptForm.minima),
      pesoVolumetrico: numberOrZero(conceptForm.pesoVolumetrico),
      pesoKg: numberOrZero(conceptForm.pesoKg),
    };
    if (!c.concepto) return;
    setConcepts(prev => [...prev, c]);
    // reset concepto/valor/minima, keep weights as defaults
    setConceptForm(f => ({ ...f, concepto: '', valor: '', minima: '' }));
  };

  const removeConcept = (idx) => setConcepts(prev => prev.filter((_, i) => i !== idx));

  const conceptTotal = (c) => {
    const base = c.unidadCobro === 'Peso volumetrico'
      ? c.valor * c.pesoVolumetrico
      : c.unidadCobro === 'kg'
        ? c.valor * c.pesoKg
        : c.valor; // Fijo
    return Math.max(base, c.minima || 0);
  };

  const grandTotal = useMemo(() => concepts.reduce((sum, c) => sum + conceptTotal(c), 0), [concepts]);

  const handleSave = async () => {
    if (!providerId) return;
    const provider = providers.find(p => (p._id || p.id) === providerId);
    const payload = {
      operationId: operation?._id,
      providerId: providerId,
      provider: provider ? { id: String(provider._id || provider.id), nombre: provider.nombre || provider.name } : undefined,
      currency: 'USD',
      concepts: concepts.map(c => ({ ...c, total: conceptTotal(c) })),
      totalUsd: grandTotal,
      tipo: 'AEREO',
      ttatDias: Number(ttatDias) || 0,
      ruta: ruta?.trim() || undefined,
      nota: nota?.trim() || undefined,
      vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta).toISOString() : undefined,
    };
    try {
      setSaving(true);
      await createQuote(payload);
      if (onSaved) onSaved(payload);
      onClose && onClose();
    } catch (e) {
      // Could show a local error UI; relying on page toast for now
      console.error(e);
    } finally {
      setSaving(false);
    }
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
          className="bg-card p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto border border-blue-100 border-t-[6px] border-t-amber-600"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-amber-700">Registrar cotización {operation?.codigo ? `para ${operation.codigo}` : ''}</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-amber-700 hover:text-amber-800 hover:bg-amber-50">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cargo details */}
          <CargoDetails op={operation} />

          {/* Provider selector */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
            <label className="text-sm text-amber-800 font-medium">Proveedor</label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full mt-1 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background"
            >
              <option value="">{loadingProviders ? 'Cargando...' : 'Seleccione un proveedor'}</option>
              {providers.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.nombre || p.name}</option>
              ))}
            </select>
            </div>
            
            <div>
              <label className="text-sm text-amber-800 font-medium">Vigencia hasta</label>
              <input
                type="date"
                value={vigenciaHasta}
                onChange={(e) => setVigenciaHasta(e.target.value)}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background"
              />
            </div>
          </div>
        
          {/* Transit days and Route */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-amber-800 font-medium">Tiempo de tránsito (días)</label>
              <input
                value={ttatDias}
                onChange={(e) => setTtatDias(e.target.value)}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background"
                placeholder="Ej. 5"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-sm text-amber-800 font-medium">Ruta</label>
              <input
                value={ruta}
                onChange={(e) => setRuta(e.target.value)}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background"
                placeholder="Ej. BOG -> MIA -> LAX"
              />
            </div>
          </div>

          {/* Concept entry */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm text-amber-800 font-medium">Concepto</label>
              <input
                value={conceptForm.concepto}
                onChange={(e) => setConceptForm(f => ({ ...f, concepto: e.target.value }))}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background"
                placeholder="Ej. Flete aéreo"
              />
            </div>
            <div>
              <label className="text-sm text-amber-800 font-medium">Valor (USD)</label>
              <input
                value={conceptForm.valor}
                onChange={(e) => setConceptForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background text-right"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-amber-800 font-medium">Unidad Cobro</label>
              <select
                value={conceptForm.unidadCobro}
                onChange={(e) => setConceptForm(f => ({ ...f, unidadCobro: e.target.value }))}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background"
              >
                <option value="Peso volumetrico">Peso volumetrico</option>
                <option value="kg">kg</option>
                <option value="Fijo">Fijo</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-amber-800 font-medium">Mínima (USD)</label>
              <input
                value={conceptForm.minima}
                onChange={(e) => setConceptForm(f => ({ ...f, minima: e.target.value }))}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background text-right"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-amber-800 font-medium">Peso Volumétrico</label>
              <input
                value={conceptForm.pesoVolumetrico}
                onChange={(e) => setConceptForm(f => ({ ...f, pesoVolumetrico: e.target.value }))}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background text-right"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-amber-800 font-medium">Peso Kg</label>
              <input
                value={conceptForm.pesoKg}
                onChange={(e) => setConceptForm(f => ({ ...f, pesoKg: e.target.value }))}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background text-right"
                placeholder="0.00"
              />
            </div>
            <div className="flex">
              <Button onClick={addConcept} className="mt-auto w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </div>
          </div>

          {/* Concepts table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border border-amber-100 rounded-md overflow-hidden">
              <thead>
                <tr className="bg-amber-50">
                  <th className="px-3 py-2 text-left text-sm font-semibold text-amber-800 border-b">Concepto</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-amber-800 border-b">Valor</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-amber-800 border-b">Unidad Cobro</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-amber-800 border-b">Mínima</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-amber-800 border-b">Peso Vol.</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-amber-800 border-b">Peso Kg</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-amber-800 border-b">Total</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-amber-800 border-b">Acción</th>
                </tr>
              </thead>
              <tbody>
                {concepts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-sm text-muted-foreground">Agrega conceptos para esta cotización.</td>
                  </tr>
                ) : concepts.map((c, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40">
                    <td className="px-3 py-2 text-sm">{c.concepto}</td>
                    <td className="px-3 py-2 text-sm text-right">{numberOrZero(c.valor).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm">{c.unidadCobro}</td>
                    <td className="px-3 py-2 text-sm text-right">{numberOrZero(c.minima).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right">{numberOrZero(c.pesoVolumetrico).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right">{numberOrZero(c.pesoKg).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right font-semibold">{conceptTotal(c).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-center">
                      <Button size="icon" variant="ghost" onClick={() => removeConcept(idx)} className="text-red-600 hover:text-white hover:bg-red-600">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
              <label className="text-sm text-amber-800 font-medium">Nota general</label>
              <textarea
                rows={3}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 px-3 py-2 bg-background resize-y"
                placeholder="Observaciones generales de la cotización"
              />
            </div>

          {/* Footer total and actions */}
          <div className="mt-4 flex items-center justify-between p-3 rounded border border-amber-200 bg-amber-50">
            <div className="text-sm font-semibold text-amber-900">Total cotización (USD)</div>
            <div className="text-lg font-bold text-amber-900">{grandTotal.toFixed(2)}</div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="text-amber-700 hover:bg-amber-50 disabled:opacity-60">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !providerId || concepts.length === 0} className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
