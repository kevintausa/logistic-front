import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { fetchQuotes } from '../Services/quotes.services';

const HeaderCell = ({ children }) => (
  <th className="px-3 py-2 text-left text-sm font-semibold text-blue-800 border-b border-blue-100 bg-blue-50">{children}</th>
);

const Cell = ({ children }) => (
  <td className="px-3 py-2 text-sm text-foreground border-b border-blue-50">{children}</td>
);

const QuotesListModal = ({ isOpen, onClose, operation, onSelect }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !operation?._id) return;
      setLoading(true);
      try {
        const { data } = await fetchQuotes({ limit: 100, offset: 1, query: { operationId: operation._id } });
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, operation?._id]);

  const hasRows = useMemo(() => rows.length > 0, [rows]);
  const selectedQuoteId = useMemo(() => operation?.cotizacionSeleccionadaId || operation?.cotizacionSeleccionada?._id, [operation?.cotizacionSeleccionadaId, operation?.cotizacionSeleccionada?._id]);

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
          className="bg-card p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-blue-100 border-t-[6px] border-t-blue-600"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-blue-700">Cotizaciones para {operation?.codigo}</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {loading ? (
            <div className="p-6 text-blue-700">Cargando cotizaciones...</div>
          ) : !hasRows ? (
            <div className="p-6 text-muted-foreground">No hay cotizaciones para esta operación todavía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-blue-100 rounded-md overflow-hidden">
                <thead>
                  <tr>
                    <HeaderCell>Proveedor</HeaderCell>
                    <HeaderCell>Total (USD)</HeaderCell>
                    <HeaderCell>Vigencia</HeaderCell>
                    <HeaderCell>Estado</HeaderCell>
                    <HeaderCell>Tránsito (días)</HeaderCell>
                    <HeaderCell>Ruta</HeaderCell>
                    <HeaderCell>Nota</HeaderCell>
                    <HeaderCell>Acción</HeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q) => {
                    const isSelected = (q?._id && q._id === selectedQuoteId) || (q?.id && q.id === selectedQuoteId);
                    const vigenciaDate = q?.vigenciaHasta ? new Date(q.vigenciaHasta) : null;
                    const today = new Date();
                    // Normalizar para comparar solo fecha
                    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                    const isVencida = vigenciaDate ? vigenciaDate < endOfToday : false;
                    return (
                    <tr key={q._id} className={`hover:bg-blue-50/40 ${isSelected ? 'bg-green-50' : ''}`}>
                      <Cell>
                        <span title={q?.provider?.correo || ''}>
                          {q?.provider?.nombre || q.providerNombre || q.providerId}
                        </span>
                      </Cell>
                      <Cell className="font-semibold text-blue-900">{Number(q.totalUsd || 0).toFixed(2)}</Cell>
                      <Cell>{q.vigenciaHasta ? new Date(q.vigenciaHasta).toLocaleDateString('es-CO') : '-'}</Cell>
                      <Cell>
                        {vigenciaDate ? (
                          isVencida ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">Vencida</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">Vigente</span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </Cell>
                      <Cell>{q.ttatDias || '-'}</Cell>
                      <Cell className="max-w-[180px] truncate" title={q.ruta || ''}>{q.ruta || '-'}</Cell>
                      <Cell className="max-w-[220px] truncate" title={q.nota || ''}>{q.nota || '-'}</Cell>
                      <Cell>
                        {isSelected ? (
                          <Button size="sm" variant="secondary" disabled title="Cotización seleccionada">
                            <Check className="h-4 w-4 mr-1 text-green-600" /> Seleccionada
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSelect && onSelect(q)}>
                            <Check className="h-4 w-4 mr-1" /> Seleccionar
                          </Button>
                        )}
                      </Cell>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuotesListModal;
