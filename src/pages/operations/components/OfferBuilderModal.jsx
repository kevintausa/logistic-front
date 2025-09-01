import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { listOfferConcepts } from '../Services/offers.services.jsx';
import ConceptPickerModal from './ConceptPickerModal.jsx';
import { Trash2 } from 'lucide-react';

const toCurrency = (v) => {
  const n = Number(v || 0);
  return isNaN(n) ? '' : n.toFixed(2);
};

const rowBase = { tipo: 'manual', concepto: '', montoUsd: 0, grupo: 'transporte' };

const OfferBuilderModal = ({ isOpen, onClose, operation, initialDraft, onSave, readOnly = false }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  // Section visibility is derived from items
  const [notas, setNotas] = useState('');
  const [conceptsTransporte, setConceptsTransporte] = useState([]);
  const [conceptsAduana, setConceptsAduana] = useState([]);
  const [conceptsTerrestre, setConceptsTerrestre] = useState([]);
  const [conceptsSeguro, setConceptsSeguro] = useState([]);
  // Concept picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerGroup, setPickerGroup] = useState('transporte');
  const provider = initialDraft?.provider || operation?.cotizacionSeleccionadaProveedor || null;

  // (Bulk/select state and filtered lists removed — using ConceptPickerModal instead)

  useEffect(() => {
    if (isOpen) {
      const incoming = (initialDraft?.items || []).map((it) => ({
        ...it,
        // Asegurar grupo por defecto para ítems de cotización
        grupo: it.grupo || (it.tipo === 'cotizacion' ? 'transporte' : it.grupo) || 'transporte',
      }));
      setItems(incoming);
      setNotas(initialDraft?.notas || '');
      // visibility derived from items; no explicit flags
      // Cargar conceptos predefinidos por grupo
      (async () => {
        try {
          const [ct, ca, ctr, cs] = await Promise.all([
            listOfferConcepts({ grupo: 'transporte', activos: true }),
            listOfferConcepts({ grupo: 'aduana', activos: true }),
            listOfferConcepts({ grupo: 'terrestre', activos: true }),
            listOfferConcepts({ grupo: 'seguro', activos: true }),
          ]);
          setConceptsTransporte(ct?.data || []);
          setConceptsAduana(ca?.data || []);
          setConceptsTerrestre(ctr?.data || []);
          setConceptsSeguro(cs?.data || []);
        } catch (e) {
          toast({ title: 'Aviso', description: 'No se pudieron cargar conceptos predefinidos', variant: 'destructive' });
        }
      })();
    }
  }, [isOpen, initialDraft]);

  const totals = useMemo(() => {
    const subtotalCotizacionUsd = (items || []).filter(i => i.tipo === 'cotizacion').reduce((a, b) => a + Number(b.montoUsd || 0), 0);
    const subtotalManualUsd = (items || []).filter(i => i.tipo === 'manual').reduce((a, b) => a + Number(b.montoUsd || 0), 0);
    return { subtotalCotizacionUsd, subtotalManualUsd, totalUsd: subtotalCotizacionUsd + subtotalManualUsd };
  }, [items]);
  const hasAduana = useMemo(() => (items || []).some(i => i.grupo === 'aduana'), [items]);
  const hasTerrestre = useMemo(() => (items || []).some(i => i.grupo === 'terrestre'), [items]);
  const hasSeguro = useMemo(() => (items || []).some(i => i.grupo === 'seguro'), [items]);

  const addManual = (grupo = 'transporte') => setItems((prev) => [...prev, { ...rowBase, grupo }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, patch) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  // Sanitize decimal input to a user-friendly raw string (allow one decimal separator)
  const sanitizeAmount = (v) => {
    if (v === null || v === undefined) return '';
    let s = String(v).replace(/,/g, '.');
    s = s.replace(/[^0-9.]/g, '');
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    }
    return s;
  };
  const handleAmountChange = (idx, raw) => {
    const val = sanitizeAmount(raw);
    updateItem(idx, { montoUsd: val });
  };
  const addConcept = (concept) => {
    if (!concept) return;
    setItems((prev) => [
      ...prev,
      {
        tipo: concept.tipo || 'manual',
        concepto: concept.concepto,
        montoUsd: Number(concept.montoUsd || 0),
        grupo: concept.grupo || 'transporte',
      },
    ]);
  };
  const addConceptsFromPicker = (group, list) => {
    if (!list || !list.length) return;
    setItems((prev) => ([
      ...prev,
      ...list.map((c) => ({ tipo: c.tipo || 'manual', concepto: c.concepto, montoUsd: Number(c.montoUsd || 0), grupo: group }))
    ]));
  };
  const conceptsMap = useMemo(() => ({
    transporte: conceptsTransporte,
    aduana: conceptsAduana,
    terrestre: conceptsTerrestre,
    seguro: conceptsSeguro,
  }), [conceptsTransporte, conceptsAduana, conceptsTerrestre, conceptsSeguro]);

  // (Old bulk handlers removed)

  const handleSave = async () => {
    try {
      const payload = {
        operationId: operation?._id,
        quoteId: initialDraft?.quoteId || operation?.cotizacionSeleccionadaId,
        provider,
        items: items.map((i) => ({ tipo: i.tipo, concepto: i.concepto, montoUsd: Number(i.montoUsd || 0), grupo: i.grupo || 'transporte' })),
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
        <motion.div className="bg-white w-[95vw] max-w-6xl max-h-[90vh] rounded-lg shadow-lg p-4 md:p-6 flex flex-col" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Definir Oferta</h3>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
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

            {!readOnly && (
              <div className="mt-2 mb-3 flex flex-wrap gap-2 items-center">
                <Button onClick={() => setPickerOpen(true)}>Agregar conceptos</Button>
                <span className="text-xs text-gray-500">Selecciona múltiples conceptos por grupo</span>
              </div>
            )}

            {/* Bloque de notas generales removido: solo se mantienen las notas para el cliente al final */}

          {/* Sección: Transporte internacional */}
          <div className="border rounded-md overflow-hidden mb-4">
            <div className="flex items-center justify-between bg-primary/5 px-3 py-2 text-xs font-semibold border-l-4 border-primary">
              <div className="text-primary">Transporte internacional</div>
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => addManual('transporte')}>Agregar manual</Button>
                  </>
                )}
              </div>
            </div>
            {/* Bulk UI removido en favor del modal de selección */}
            <div className="max-h-60 overflow-auto">
              <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                <div className="col-span-8">Concepto</div>
                <div className="col-span-3 text-right">Monto (USD)</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((it, idx) => it.grupo === 'transporte' && (
                <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                  <div className="col-span-8">
                    <Input value={it.concepto || ''} disabled={readOnly || it.tipo === 'cotizacion'} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                  </div>
                  <div className="col-span-3">
                    <Input
                      className="text-right"
                      inputMode="decimal"
                      type="text"
                      pattern="[0-9]*[.,]?[0-9]*"
                      value={typeof it.montoUsd === 'number' ? String(it.montoUsd) : (it.montoUsd || '')}
                      disabled={readOnly}
                      onChange={(e) => handleAmountChange(idx, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {!readOnly && (
                      <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección: Gastos de Aduana */}
          {hasAduana && (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="flex items-center justify-between bg-primary/5 px-3 py-2 text-xs font-semibold border-l-4 border-primary">
                <div className="text-primary">Gastos de Aduana</div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => addManual('aduana')}>Agregar manual</Button>
                    </>
                  )}
                </div>
              </div>
              {/* Bulk UI removido en favor del modal de selección */}
              <div className="max-h-60 overflow-auto">
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                  <div className="col-span-8">Concepto</div>
                  <div className="col-span-3 text-right">Monto (USD)</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => it.grupo === 'aduana' && (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                    <div className="col-span-8">
                      <Input value={it.concepto || ''} disabled={readOnly} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                    </div>
                    <div className="col-span-3">
                      <Input
                        className="text-right"
                        inputMode="decimal"
                        type="text"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={typeof it.montoUsd === 'number' ? String(it.montoUsd) : (it.montoUsd || '')}
                        disabled={readOnly}
                        onChange={(e) => handleAmountChange(idx, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {!readOnly && (
                        <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Transporte Terrestre */}
          {hasTerrestre && (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="flex items-center justify-between bg-primary/5 px-3 py-2 text-xs font-semibold border-l-4 border-primary">
                <div className="text-primary">Transporte Terrestre</div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => addManual('terrestre')}>Agregar manual</Button>
                    </>
                  )}
                </div>
              </div>
              {/* Bulk UI removido en favor del modal de selección */}
              <div className="max-h-60 overflow-auto">
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                  <div className="col-span-8">Concepto</div>
                  <div className="col-span-3 text-right">Monto (USD)</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => it.grupo === 'terrestre' && (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                    <div className="col-span-8">
                      <Input value={it.concepto || ''} disabled={readOnly} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                    </div>
                    <div className="col-span-3">
                      <Input
                        className="text-right"
                        inputMode="decimal"
                        type="text"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={typeof it.montoUsd === 'number' ? String(it.montoUsd) : (it.montoUsd || '')}
                        disabled={readOnly}
                        onChange={(e) => handleAmountChange(idx, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {!readOnly && (
                        <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Seguros */}
          {hasSeguro && (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="flex items-center justify-between bg-primary/5 px-3 py-2 text-xs font-semibold border-l-4 border-primary">
                <div className="text-primary">Seguros</div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => addManual('seguro')}>Agregar manual</Button>
                    </>
                  )}
                </div>
              </div>
              {/* Bulk UI removido en favor del modal de selección */}
              <div className="max-h-60 overflow-auto">
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                  <div className="col-span-8">Concepto</div>
                  <div className="col-span-3 text-right">Monto (USD)</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => it.grupo === 'seguro' && (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                    <div className="col-span-8">
                      <Input value={it.concepto || ''} disabled={readOnly || it.tipo === 'cotizacion'} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                    </div>
                    <div className="col-span-3">
                      <Input
                        className="text-right"
                        inputMode="decimal"
                        type="text"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={typeof it.montoUsd === 'number' ? String(it.montoUsd) : (it.montoUsd || '')}
                        disabled={readOnly}
                        onChange={(e) => handleAmountChange(idx, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {!readOnly && (
                        <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="flex justify-end items-center px-1 py-2">
            <div className="text-sm">
              <div>Subtotal cotización: <span className="font-semibold">${toCurrency(totals.subtotalCotizacionUsd)}</span></div>
              <div>Subtotal manual: <span className="font-semibold">${toCurrency(totals.subtotalManualUsd)}</span></div>
              <div>Total: <span className="font-bold">${toCurrency(totals.totalUsd)}</span></div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-1">Notas para el cliente</div>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[120px]"
              value={notas}
              disabled={readOnly}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe las notas para el cliente aquí..."
              rows={6}
            />
          </div>
          </div>

          <div className="mt-4 pt-3 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{readOnly ? 'Cerrar' : 'Cancelar'}</Button>
            {!readOnly && <Button onClick={handleSave}>Guardar Oferta</Button>}
          </div>
          {/* Concept Picker Modal */}
          <ConceptPickerModal
            isOpen={pickerOpen}
            onClose={() => setPickerOpen(false)}
            conceptsMap={conceptsMap}
            defaultGroup={pickerGroup}
            readOnly={readOnly}
            onConfirm={(group, chosen) => addConceptsFromPicker(group, chosen)}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfferBuilderModal;
