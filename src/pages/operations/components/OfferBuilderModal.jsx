import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { listOfferConcepts } from '../Services/offers.services.jsx';
import { Trash2 } from 'lucide-react';

const toCurrency = (v) => {
  const n = Number(v || 0);
  return isNaN(n) ? '' : n.toFixed(2);
};

const rowBase = { tipo: 'manual', concepto: '', montoUsd: 0, grupo: 'transporte' };

const OfferBuilderModal = ({ isOpen, onClose, operation, initialDraft, onSave }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [enableAduana, setEnableAduana] = useState(false);
  const [enableTerrestre, setEnableTerrestre] = useState(false);
  const [enableSeguro, setEnableSeguro] = useState(false);
  const [notas, setNotas] = useState('');
  const [conceptsTransporte, setConceptsTransporte] = useState([]);
  const [conceptsAduana, setConceptsAduana] = useState([]);
  const [conceptsTerrestre, setConceptsTerrestre] = useState([]);
  const [conceptsSeguro, setConceptsSeguro] = useState([]);
  const [selTransporte, setSelTransporte] = useState('');
  const [selAduana, setSelAduana] = useState('');
  const [selTerrestre, setSelTerrestre] = useState('');
  const [selSeguro, setSelSeguro] = useState('');
  // Bulk add UI state
  const [bulkOpen, setBulkOpen] = useState({ transporte: false, aduana: false, terrestre: false, seguro: false });
  const [bulkSelected, setBulkSelected] = useState({ transporte: new Set(), aduana: new Set(), terrestre: new Set(), seguro: new Set() });
  const [bulkSearch, setBulkSearch] = useState({ transporte: '', aduana: '', terrestre: '', seguro: '' });
  const provider = initialDraft?.provider || operation?.cotizacionSeleccionadaProveedor || null;

  // Filtered lists for bulk search
  const conceptsTransporteFiltered = useMemo(() => {
    const q = (bulkSearch.transporte || '').toLowerCase();
    if (!q) return conceptsTransporte;
    return conceptsTransporte.filter((c) => (c.concepto || '').toLowerCase().includes(q));
  }, [conceptsTransporte, bulkSearch.transporte]);
  const conceptsAduanaFiltered = useMemo(() => {
    const q = (bulkSearch.aduana || '').toLowerCase();
    if (!q) return conceptsAduana;
    return conceptsAduana.filter((c) => (c.concepto || '').toLowerCase().includes(q));
  }, [conceptsAduana, bulkSearch.aduana]);
  const conceptsTerrestreFiltered = useMemo(() => {
    const q = (bulkSearch.terrestre || '').toLowerCase();
    if (!q) return conceptsTerrestre;
    return conceptsTerrestre.filter((c) => (c.concepto || '').toLowerCase().includes(q));
  }, [conceptsTerrestre, bulkSearch.terrestre]);
  const conceptsSeguroFiltered = useMemo(() => {
    const q = (bulkSearch.seguro || '').toLowerCase();
    if (!q) return conceptsSeguro;
    return conceptsSeguro.filter((c) => (c.concepto || '').toLowerCase().includes(q));
  }, [conceptsSeguro, bulkSearch.seguro]);

  useEffect(() => {
    if (isOpen) {
      const incoming = (initialDraft?.items || []).map((it) => ({
        ...it,
        // Asegurar grupo por defecto para ítems de cotización
        grupo: it.grupo || (it.tipo === 'cotizacion' ? 'transporte' : it.grupo) || 'transporte',
      }));
      setItems(incoming);
      setNotas(initialDraft?.notas || '');
      setEnableAduana(incoming.some((i) => i.grupo === 'aduana'));
      setEnableTerrestre(incoming.some((i) => i.grupo === 'terrestre'));
      setEnableSeguro(incoming.some((i) => i.grupo === 'seguro'));
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

  const addManual = (grupo = 'transporte') => setItems((prev) => [...prev, { ...rowBase, grupo }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, patch) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
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

  const toggleBulk = (grupo) => setBulkOpen((s) => ({ ...s, [grupo]: !s[grupo] }));
  const onBulkCheck = (grupo, id, checked) => {
    setBulkSelected((s) => {
      const next = new Set(s[grupo]);
      if (checked) next.add(String(id)); else next.delete(String(id));
      return { ...s, [grupo]: next };
    });
  };
  const onBulkCheckAll = (grupo, list, checked) => {
    setBulkSelected((s) => {
      const next = new Set(s[grupo]);
      if (checked) list.forEach((c) => next.add(String(c._id)));
      else next.clear();
      return { ...s, [grupo]: next };
    });
  };
  const doBulkAdd = (grupo) => {
    const map = {
      transporte: conceptsTransporte,
      aduana: conceptsAduana,
      terrestre: conceptsTerrestre,
      seguro: conceptsSeguro,
    };
    const selectedIds = Array.from(bulkSelected[grupo] || []);
    const concepts = map[grupo].filter((c) => selectedIds.includes(String(c._id)));
    if (!concepts.length) return;
    setItems((prev) => ([
      ...prev,
      ...concepts.map((c) => ({ tipo: c.tipo || 'manual', concepto: c.concepto, montoUsd: Number(c.montoUsd || 0), grupo: c.grupo || grupo })),
    ]));
    setBulkOpen((s) => ({ ...s, [grupo]: false }));
    setBulkSelected((s) => ({ ...s, [grupo]: new Set() }));
  };

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

            <div className="mt-2 mb-3 flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked readOnly /> Transporte internacional
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enableAduana} onChange={(e) => setEnableAduana(e.target.checked)} /> Gastos de Aduana (opcional)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enableTerrestre} onChange={(e) => setEnableTerrestre(e.target.checked)} /> Transporte Terrestre (opcional)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enableSeguro} onChange={(e) => setEnableSeguro(e.target.checked)} /> Seguros (opcional)
              </label>
            </div>

          {/* Sección: Transporte internacional */}
          <div className="border rounded-md overflow-hidden mb-4">
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-semibold">
              <div>Transporte internacional</div>
              <div className="flex items-center gap-2">
                <select className="border rounded px-2 py-1 text-xs" value={selTransporte} onChange={(e) => setSelTransporte(e.target.value)}>
                  <option value="">Seleccionar concepto</option>
                  {conceptsTransporte.map((c) => (
                    <option key={c._id || c.concepto} value={c._id}>{c.concepto} — ${toCurrency(c.montoUsd)} ({c.tipo})</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={() => { const c = conceptsTransporte.find(x => String(x._id) === String(selTransporte)); addConcept(c); }}>Agregar</Button>
                <Button size="sm" variant="outline" onClick={() => addManual('transporte')}>Agregar manual</Button>
                <Button size="sm" variant="outline" onClick={() => toggleBulk('transporte')}>{bulkOpen.transporte ? 'Cerrar selección' : 'Agregar varios'}</Button>
              </div>
            </div>
            {bulkOpen.transporte && (
              <div className="px-3 py-2 border-b bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Input className="h-8" placeholder="Buscar concepto" value={bulkSearch.transporte} onChange={(e) => setBulkSearch((s) => ({ ...s, transporte: e.target.value }))} />
                  <Button size="sm" variant="secondary" onClick={() => doBulkAdd('transporte')}>Agregar seleccionados</Button>
                </div>
                <div className="max-h-48 overflow-auto border rounded">
                  <div className="flex items-center gap-2 px-2 py-1 border-b bg-white sticky top-0">
                    <input type="checkbox" onChange={(e) => onBulkCheckAll('transporte', conceptsTransporteFiltered, e.target.checked)} />
                    <span className="text-xs text-gray-600">Seleccionar todos</span>
                  </div>
                  {conceptsTransporteFiltered.map((c) => (
                    <label key={c._id} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={bulkSelected.transporte.has(String(c._id))} onChange={(e) => onBulkCheck('transporte', c._id, e.target.checked)} />
                        <span>{c.concepto}</span>
                      </div>
                      <span className="text-xs text-gray-500">${toCurrency(c.montoUsd)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-auto">
              <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                <div className="col-span-8">Concepto</div>
                <div className="col-span-3 text-right">Monto (USD)</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((it, idx) => it.grupo === 'transporte' && (
                <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                  <div className="col-span-8">
                    <Input value={it.concepto || ''} disabled={it.tipo === 'cotizacion'} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                  </div>
                  <div className="col-span-3">
                    <Input className="text-right" value={toCurrency(it.montoUsd)} onChange={(e) => updateItem(idx, { montoUsd: e.target.value.replace(/,/g, '.') })} placeholder="0.00" />
                  </div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección: Gastos de Aduana */}
          {enableAduana && (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-semibold">
                <div>Gastos de Aduana</div>
                <div className="flex items-center gap-2">
                  <select className="border rounded px-2 py-1 text-xs" value={selAduana} onChange={(e) => setSelAduana(e.target.value)}>
                    <option value="">Seleccionar concepto</option>
                    {conceptsAduana.map((c) => (
                      <option key={c._id || c.concepto} value={c._id}>{c.concepto} — ${toCurrency(c.montoUsd)} ({c.tipo})</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => { const c = conceptsAduana.find(x => String(x._id) === String(selAduana)); addConcept(c); }}>Agregar</Button>
                  <Button size="sm" variant="outline" onClick={() => addManual('aduana')}>Agregar manual</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleBulk('aduana')}>{bulkOpen.aduana ? 'Cerrar selección' : 'Agregar varios'}</Button>
                </div>
              </div>
              {bulkOpen.aduana && (
                <div className="px-3 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Input className="h-8" placeholder="Buscar concepto" value={bulkSearch.aduana} onChange={(e) => setBulkSearch((s) => ({ ...s, aduana: e.target.value }))} />
                    <Button size="sm" variant="secondary" onClick={() => doBulkAdd('aduana')}>Agregar seleccionados</Button>
                  </div>
                  <div className="max-h-48 overflow-auto border rounded">
                    <div className="flex items-center gap-2 px-2 py-1 border-b bg-white sticky top-0">
                      <input type="checkbox" onChange={(e) => onBulkCheckAll('aduana', conceptsAduanaFiltered, e.target.checked)} />
                      <span className="text-xs text-gray-600">Seleccionar todos</span>
                    </div>
                    {conceptsAduanaFiltered.map((c) => (
                      <label key={c._id} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={bulkSelected.aduana.has(String(c._id))} onChange={(e) => onBulkCheck('aduana', c._id, e.target.checked)} />
                          <span>{c.concepto}</span>
                        </div>
                        <span className="text-xs text-gray-500">${toCurrency(c.montoUsd)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="max-h-60 overflow-auto">
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                  <div className="col-span-8">Concepto</div>
                  <div className="col-span-3 text-right">Monto (USD)</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => it.grupo === 'aduana' && (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                    <div className="col-span-8">
                      <Input value={it.concepto || ''} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                    </div>
                    <div className="col-span-3">
                      <Input className="text-right" value={toCurrency(it.montoUsd)} onChange={(e) => updateItem(idx, { montoUsd: e.target.value.replace(/,/g, '.') })} placeholder="0.00" />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Transporte Terrestre */}
          {enableTerrestre && (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-semibold">
                <div>Transporte Terrestre</div>
                <div className="flex items-center gap-2">
                  <select className="border rounded px-2 py-1 text-xs" value={selTerrestre} onChange={(e) => setSelTerrestre(e.target.value)}>
                    <option value="">Seleccionar concepto</option>
                    {conceptsTerrestre.map((c) => (
                      <option key={c._id || c.concepto} value={c._id}>{c.concepto} — ${toCurrency(c.montoUsd)} ({c.tipo})</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => { const c = conceptsTerrestre.find(x => String(x._id) === String(selTerrestre)); addConcept(c); }}>Agregar</Button>
                  <Button size="sm" variant="outline" onClick={() => addManual('terrestre')}>Agregar manual</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleBulk('terrestre')}>{bulkOpen.terrestre ? 'Cerrar selección' : 'Agregar varios'}</Button>
                </div>
              </div>
              {bulkOpen.terrestre && (
                <div className="px-3 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Input className="h-8" placeholder="Buscar concepto" value={bulkSearch.terrestre} onChange={(e) => setBulkSearch((s) => ({ ...s, terrestre: e.target.value }))} />
                    <Button size="sm" variant="secondary" onClick={() => doBulkAdd('terrestre')}>Agregar seleccionados</Button>
                  </div>
                  <div className="max-h-48 overflow-auto border rounded">
                    <div className="flex items-center gap-2 px-2 py-1 border-b bg-white sticky top-0">
                      <input type="checkbox" onChange={(e) => onBulkCheckAll('terrestre', conceptsTerrestreFiltered, e.target.checked)} />
                      <span className="text-xs text-gray-600">Seleccionar todos</span>
                    </div>
                    {conceptsTerrestreFiltered.map((c) => (
                      <label key={c._id} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={bulkSelected.terrestre.has(String(c._id))} onChange={(e) => onBulkCheck('terrestre', c._id, e.target.checked)} />
                          <span>{c.concepto}</span>
                        </div>
                        <span className="text-xs text-gray-500">${toCurrency(c.montoUsd)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="max-h-60 overflow-auto">
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                  <div className="col-span-8">Concepto</div>
                  <div className="col-span-3 text-right">Monto (USD)</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => it.grupo === 'terrestre' && (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                    <div className="col-span-8">
                      <Input value={it.concepto || ''} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                    </div>
                    <div className="col-span-3">
                      <Input className="text-right" value={toCurrency(it.montoUsd)} onChange={(e) => updateItem(idx, { montoUsd: e.target.value.replace(/,/g, '.') })} placeholder="0.00" />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Seguros */}
          {enableSeguro && (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-semibold">
                <div>Seguros</div>
                <div className="flex items-center gap-2">
                  <select className="border rounded px-2 py-1 text-xs" value={selSeguro} onChange={(e) => setSelSeguro(e.target.value)}>
                    <option value="">Seleccionar concepto</option>
                    {conceptsSeguro.map((c) => (
                      <option key={c._id || c.concepto} value={c._id}>{c.concepto} — ${toCurrency(c.montoUsd)} ({c.tipo})</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => { const c = conceptsSeguro.find(x => String(x._id) === String(selSeguro)); addConcept(c); }}>Agregar</Button>
                  <Button size="sm" variant="outline" onClick={() => addManual('seguro')}>Agregar manual</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleBulk('seguro')}>{bulkOpen.seguro ? 'Cerrar selección' : 'Agregar varios'}</Button>
                </div>
              </div>
              {bulkOpen.seguro && (
                <div className="px-3 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Input className="h-8" placeholder="Buscar concepto" value={bulkSearch.seguro} onChange={(e) => setBulkSearch((s) => ({ ...s, seguro: e.target.value }))} />
                    <Button size="sm" variant="secondary" onClick={() => doBulkAdd('seguro')}>Agregar seleccionados</Button>
                  </div>
                  <div className="max-h-48 overflow-auto border rounded">
                    <div className="flex items-center gap-2 px-2 py-1 border-b bg-white sticky top-0">
                      <input type="checkbox" onChange={(e) => onBulkCheckAll('seguro', conceptsSeguroFiltered, e.target.checked)} />
                      <span className="text-xs text-gray-600">Seleccionar todos</span>
                    </div>
                    {conceptsSeguroFiltered.map((c) => (
                      <label key={c._id} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={bulkSelected.seguro.has(String(c._id))} onChange={(e) => onBulkCheck('seguro', c._id, e.target.checked)} />
                          <span>{c.concepto}</span>
                        </div>
                        <span className="text-xs text-gray-500">${toCurrency(c.montoUsd)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="max-h-60 overflow-auto">
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold border-b sticky top-0 bg-white z-10">
                  <div className="col-span-8">Concepto</div>
                  <div className="col-span-3 text-right">Monto (USD)</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, idx) => it.grupo === 'seguro' && (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 border-b">
                    <div className="col-span-8">
                      <Input value={it.concepto || ''} disabled={it.tipo === 'cotizacion'} onChange={(e) => updateItem(idx, { concepto: e.target.value })} placeholder="Concepto" />
                    </div>
                    <div className="col-span-3">
                      <Input className="text-right" value={toCurrency(it.montoUsd)} onChange={(e) => updateItem(idx, { montoUsd: e.target.value.replace(/,/g, '.') })} placeholder="0.00" />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
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
            <div className="text-sm text-gray-500 mb-1">Notas</div>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas para el cliente" />
          </div>
          </div>

          <div className="mt-4 pt-3 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Oferta</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfferBuilderModal;
