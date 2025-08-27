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
                    <HeaderCell>Flete (USD)</HeaderCell>
                    <HeaderCell>G. Origen (USD)</HeaderCell>
                    <HeaderCell>G. Destino (USD)</HeaderCell>
                    <HeaderCell>Otros (USD)</HeaderCell>
                    <HeaderCell>Total (USD)</HeaderCell>
                    <HeaderCell>Tránsito (días)</HeaderCell>
                    <HeaderCell>Ruta</HeaderCell>
                    <HeaderCell>Nota</HeaderCell>
                    <HeaderCell>Acción</HeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q) => (
                    <tr key={q._id} className="hover:bg-blue-50/40">
                      <Cell>
                        <span title={q?.provider?.correo || ''}>
                          {q?.provider?.nombre || q.providerNombre || q.providerId}
                        </span>
                      </Cell>
                      <Cell>{Number(q.fleteUsd || 0).toFixed(2)}</Cell>
                      <Cell>{Number(q.gastosOrigenUsd || 0).toFixed(2)}</Cell>
                      <Cell>{Number(q.gastosDestinoUsd || 0).toFixed(2)}</Cell>
                      <Cell>{Number(q.otrosGastosUsd || 0).toFixed(2)}</Cell>
                      <Cell className="font-semibold text-blue-900">{Number(q.totalUsd || 0).toFixed(2)}</Cell>
                      <Cell>{q.ttatDias || '-'}</Cell>
                      <Cell className="max-w-[180px] truncate" title={q.ruta || ''}>{q.ruta || '-'}</Cell>
                      <Cell className="max-w-[220px] truncate" title={q.nota || ''}>{q.nota || '-'}</Cell>
                      <Cell>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSelect && onSelect(q)}>
                          <Check className="h-4 w-4 mr-1" /> Seleccionar
                        </Button>
                      </Cell>
                    </tr>
                  ))}
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
