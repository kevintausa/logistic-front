import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getAirOperationById } from '@/pages/operations/Services/air-requests.services';

export default function AirOperationDetails({ isOpen, onClose, operation, operationId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(operation || null);

  const opId = useMemo(() => operationId || operation?._id, [operationId, operation]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isOpen) return;
      setError('');
      // Si ya nos pasaron el objeto completo y no hay id, no hace falta pedirlo
      if (!opId) {
        setData(operation || null);
        return;
      }
      try {
        setLoading(true);
        const resp = await getAirOperationById(opId);
        const payload = resp?.data || resp; // servicio backend devuelve { success, data } o el objeto
        if (isMounted) {
          setData(payload);
        }
      } catch (e) {
        if (isMounted) setError(e?.message || 'Error al cargar detalles');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [isOpen, opId]);

  if (!isOpen) return null;

  const d = data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div>
              <h2 className="text-xl font-semibold">Detalle de Operación Aérea</h2>
              <p className="text-sm text-muted-foreground">
                {d?.codigo ? `Código: ${d.codigo}` : 'Sin código'}{d?.asesor?.nombre ? ` — Asesor: ${d.asesor.nombre}` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded hover:bg-foreground/10 flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 overflow-auto space-y-4">
            {loading && (
              <div className="text-sm text-muted-foreground">Cargando detalles...</div>
            )}
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {/* Información principal (compacta) */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <InfoItem label="Tipo" value={d.tipo} />
                  <InfoItem label="Incoterm" value={d.incoterm} />
                  <InfoItem label="Cliente" value={d?.cliente?.nombre} />
                </section>

                {/* Descripción */}
                {d?.descripcion && (
                  <section className="grid grid-cols-1 gap-2">
                    <InfoItem label="Descripción" value={d.descripcion} />
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-semibold mb-2">Origen y Destino</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoItem label="Aeropuerto Origen" value={d?.puertoCarga?.nombre} subtitle={d?.puertoCarga?.pais || d?.puertoCarga?.ciudad} />
                    <InfoItem label="Aeropuerto Destino" value={d?.puertoDescarga?.nombre} subtitle={d?.puertoDescarga?.pais || d?.puertoDescarga?.ciudad} />
                  </div>
                </section>

                

                <section>
                  <h3 className="text-sm font-semibold mb-2">Totales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InfoItem label="No. Piezas" value={d.NoPiezas} />
                    <InfoItem label="Peso Total (kg)" value={d.pesoTotal} />
                    <InfoItem label="Peso Volumétrico (kg)" value={d.pesoVolumetrico} />
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2">Detalles de Bultos</h3>
                  {Array.isArray(d.detalles) && d.detalles.length > 0 ? (
                    <div className="overflow-x-auto rounded border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <Th>Pie.</Th>
                            <Th>Largo</Th>
                            <Th>Ancho</Th>
                            <Th>Alto</Th>
                            <Th>U.Medida</Th>
                            <Th>Peso</Th>
                            <Th>U.Peso</Th>
                            <Th>Tipo Mercancía</Th>
                            <Th>Apilable</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.detalles.map((it, idx) => (
                            <tr key={idx} className="odd:bg-background even:bg-muted/20">
                              <Td>{it.noPiezas}</Td>
                              <Td>{it.largo}</Td>
                              <Td>{it.ancho}</Td>
                              <Td>{it.alto}</Td>
                              <Td>{it.unidadMedida}</Td>
                              <Td>{it.peso}</Td>
                              <Td>{it.unidadPeso}</Td>
                              <Td>{it.tipoMercancia}</Td>
                              <Td>{it.isApilable ? 'Sí' : 'No'}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Sin detalles registrados.</div>
                  )}
                </section>
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-muted/30 flex justify-end">
            <button onClick={onClose} className="px-3 py-1.5 rounded bg-foreground text-background text-sm">Cerrar</button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ label, value, subtitle }) {
  return (
    <div className="p-2 rounded border bg-background">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value ?? 'N/A'}</div>
      {subtitle && <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>}
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">{children}</th>;
}
function Td({ children }) {
  return <td className="text-left px-2 py-1.5 whitespace-nowrap">{children}</td>;
}
