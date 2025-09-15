import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { fetchProviders } from '@/pages/parametrizacion/providers/Services/providers.services';
import { sendEmail } from '@/pages/operations/Services/email.services';

export default function RequestQuoteModal({ isOpen, onClose, operation }) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const op = operation || {};

  // Subject template per requirement
  const defaultSubject = useMemo(() => {
    const codigo = op?.codigo || '';
    const tipo = op?.tipo || '';
    const paisOrigen = op?.paisOrigen || op?.puertoCarga?.pais || '';
    const paisDestino = op?.paisDestino || op?.puertoDescarga?.pais || '';
    return `solicitud cotización ${codigo} Aereo -${tipo}, ${paisOrigen} - ${paisDestino}`.trim();
  }, [op]);

  // Body template including details
  const defaultBody = useMemo(() => {
    const lines = [];
    lines.push('Estimados {{proveedor}},');
    lines.push('');
    lines.push('Solicito la siguiente cotización:');
    lines.push('');
    if (op?.descripcion) lines.push(`Descripción: ${op.descripcion}`);
    if (op?.incoterm) lines.push(`Incoterm: ${op.incoterm}`);
    const origenStr = [op?.puertoCarga?.nombre, op?.puertoCarga?.ciudad, op?.puertoCarga?.pais].filter(Boolean).join(', ');
    const destinoStr = [op?.puertoDescarga?.nombre, op?.puertoDescarga?.ciudad, op?.puertoDescarga?.pais].filter(Boolean).join(', ');
    lines.push(`Origen: ${origenStr || op?.paisOrigen || ''}`);
    lines.push(`Destino: ${destinoStr || op?.paisDestino || ''}`);
    lines.push('');
    lines.push(`Totales: Piezas=${op?.NoPiezas ?? '-'} | Peso Total=${op?.pesoTotal ?? '-'} kg | Peso Volumétrico=${op?.pesoVolumetrico ?? '-'} kg`);
    if (Array.isArray(op?.detalles) && op.detalles.length > 0) {
      lines.push('');
      lines.push('Detalles de bultos:');
      op.detalles.forEach((d, i) => {
        const line = `#${i + 1}: Pie=${d.noPiezas ?? '-'}, Dimensiones=${d.largo ?? '-'} x ${d.ancho ?? '-'} x ${d.alto ?? '-'} ${d.unidadMedida ?? ''}, Peso=${d.peso ?? '-'} ${d.unidadPeso ?? ''}, Tipo=${d.tipoMercancia ?? '-'}, Apilable=${d.isApilable ? 'Sí' : 'No'}`;
        lines.push(line);
      });
    }
    lines.push('');
    lines.push('Quedo atento(a) a su amable respuesta.');
    return lines.join('\n');
  }, [op]);

  useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject);
      setBody(defaultBody);
      setSelectedIds([]);
      setError('');
      setSuccess('');
    }
  }, [isOpen, defaultSubject, defaultBody]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await fetchProviders({ limit: 1000, offset: 1, query: {} });
        const arr = resp?.data || resp || [];
        if (mounted) setProviders(Array.isArray(arr) ? arr : []);
      } catch (e) {
        if (mounted) setProviders([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const selectedProviders = useMemo(() => {
    const set = new Set(selectedIds);
    return providers.filter(p => set.has(p._id || p.id));
  }, [selectedIds, providers]);

  const handleToggleProvider = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getProviderName = (p) => p?.name || p?.nombre || p?.razonSocial || 'Proveedor';
  const getProviderEmail = (p) => p?.email || p?.correo || p?.mail || '';

  const handleSend = async () => {
    setError(''); setSuccess('');
    if (selectedProviders.length === 0) {
      setError('Selecciona al menos un proveedor.');
      return;
    }
    // Validate emails
    const targets = selectedProviders.map(p => ({ p, email: getProviderEmail(p) })).filter(x => !!x.email);
    if (targets.length === 0) {
      setError('Los proveedores seleccionados no tienen correo configurado.');
      return;
    }
    setLoading(true);
    try {
      for (const t of targets) {
        const personalized = body.replace('{{proveedor}}', getProviderName(t.p));
        await sendEmail({ to: t.email, subject, text: personalized });
      }
      setSuccess('Correos enviados exitosamente.');
    } catch (e) {
      setError(e?.message || 'Error al enviar correos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold">Pedir Cotización</h2>
              <p className="text-xs text-muted-foreground">Selecciona proveedores, revisa el asunto y el cuerpo, y envía.</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded hover:bg-foreground/10 flex items-center justify-center" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 overflow-auto space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}

            <section>
              <h3 className="text-sm font-semibold mb-2">Proveedores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2">
                {providers.map((p) => (
                  <label key={p._id || p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedIds.includes(p._id || p.id)} onChange={() => handleToggleProvider(p._id || p.id)} />
                    <span className="truncate">{getProviderName(p)} <span className="text-muted-foreground">({getProviderEmail(p) || 'sin correo'})</span></span>
                  </label>
                ))}
                {providers.length === 0 && (
                  <div className="text-sm text-muted-foreground">No hay proveedores disponibles.</div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Asunto</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full mt-1 px-3 py-2 rounded border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cuerpo (usa {'{{proveedor}}'} para personalizar)</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full mt-1 px-3 py-2 rounded border bg-background text-sm whitespace-pre-wrap" />
              </div>
            </section>
          </div>

          <div className="p-3 border-t bg-muted/30 flex justify-end gap-2">
            <button disabled={loading} onClick={onClose} className="px-3 py-1.5 rounded border text-sm">Cancelar</button>
            <button disabled={loading} onClick={handleSend} className="px-3 py-1.5 rounded bg-foreground text-background text-sm flex items-center gap-2">
              <Send className="h-4 w-4" /> Enviar
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
