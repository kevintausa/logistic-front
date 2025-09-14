import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { fetchUsers } from '@/pages/parametrizacion/usuarios/Services/users.services';
import { fetchClients } from '@/pages/parametrizacion/clients/Services/clients.services';
import { searchAirports, getUniqueCountries } from '@/pages/operations/services/airports.services';
import { createAirRequest } from '@/pages/operations/services/air-requests.services';

const AirOperationModal = ({ isOpen, onClose, onSave, title = 'Crear Solicitud Aérea' }) => {
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState({ asesores: [] });
  const [suggestions, setSuggestions] = useState({ clientes: [], paisOrigen: [], paisDestino: [] });
  const [airportOptions, setAirportOptions] = useState({ carga: [], descarga: [] });

  const [form, setForm] = useState({
    tipo: 'importacion',
    cliente: { id: '', nombre: '', nit: '' },
    incoterm: '',
    asesor: { id: '', nombre: '', correo: '' },
    puertoCarga: { id: '', nombre: '' },
    puertoDescarga: { id: '', nombre: '' },
    paisOrigen: '',
    paisDestino: '',
    descripcion: '',
    NoPiezas: '',
    detalles: [
      { largo: '', ancho: '', alto: '', unidadMedida: 'cm', peso: '', unidadPeso: 'kg', tipoMercancia: 'general', isApilable: 'Si', noPiezas: '' }
    ]
  });

  // Cálculos automáticos
  const pesoTotal = useMemo(() => {
    return form.detalles.reduce((total, detalle) => {
      const peso = parseFloat(detalle.peso) || 0;
      const piezas = parseFloat(detalle.noPiezas) || 1;
      return total + (peso * piezas);
    }, 0);
  }, [form.detalles]);

  const pesoVolumetrico = useMemo(() => {
    return form.detalles.reduce((total, detalle) => {
      const largo = parseFloat(detalle.largo) || 0;
      const ancho = parseFloat(detalle.ancho) || 0;
      const alto = parseFloat(detalle.alto) || 0;
      const piezas = parseFloat(detalle.noPiezas) || 1;
      
      // Convertir dimensiones a metros si están en cm
      const factor = detalle.unidadMedida === 'cm' ? 0.01 : 
                   detalle.unidadMedida === 'in' ? 0.0254 : 
                   detalle.unidadMedida === 'ft' ? 0.3048 : 1;
      
      const largoM = largo * factor;
      const anchoM = ancho * factor;
      const altoM = alto * factor;
      
      // Peso volumétrico = (L x A x H en metros) x 167 kg/m³ (factor estándar aéreo)
      const pesoVolPorPieza = (largoM * anchoM * altoM) * 167;
      return total + (pesoVolPorPieza * piezas);
    }, 0);
  }, [form.detalles]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const asesRes = await fetchUsers({ limit: 50, offset: 1, query: { rol: 'asesor' } });
        const asesores = asesRes?.data?.items || asesRes?.items || asesRes?.data || [];
        setCatalogs({ asesores });
      } catch (_) { /* noop */ }
    };
    load();
  }, [isOpen]);

  const incotermOpts = useMemo(() => ['EXW','FCA','FOB','CIF','CPT','CFR','DAP','DDP'], []);

  const update = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const onClienteSearch = async (term) => {
    if (!term || term.trim().length < 2) { setSuggestions(s => ({ ...s, clientes: [] })); return; }
    const query = { $or: [ { nombre: { $regex: term, $options: 'i' } }, { name: { $regex: term, $options: 'i' } }, { nit: { $regex: term, $options: 'i' } } ] };
    const res = await fetchClients({ limit: 10, offset: 1, query });
    const items = res?.data?.items || res?.items || res?.data || [];
    setSuggestions(prev => ({ ...prev, clientes: items }));
  };

  const onPortSearch = async (scope, term) => {
    if (!term || term.trim().length < 2) { setSuggestions(s => ({ ...s, [scope]: [] })); return; }
    try {
      // Get the selected country to filter airports
      const selectedCountry = scope === 'carga' ? form.paisOrigen : form.paisDestino;
      
      let searchParams = { name: term, limit: 10 };
      if (selectedCountry) {
        searchParams.country = selectedCountry;
      }
      
      const res = await searchAirports(searchParams);
      const items = res?.data || [];
      setSuggestions(prev => ({ ...prev, [scope]: items }));
    } catch (error) {
      console.error('Error searching airports:', error);
      setSuggestions(prev => ({ ...prev, [scope]: [] }));
    }
  };

  const onCountrySearch = async (scope, term) => {
    if (!term || term.trim().length < 2) { setSuggestions(s => ({ ...s, [scope]: [] })); return; }
    try {
      const res = await getUniqueCountries(term, 10);
      const countries = res?.data || [];
      setSuggestions(prev => ({ ...prev, [scope]: countries }));
    } catch (error) {
      console.error('Error searching countries:', error);
      setSuggestions(prev => ({ ...prev, [scope]: [] }));
    }
  };

  const onCountrySelect = async (scope, country) => {
    // Update the country field
    update(scope, country);
    
    // Clear country suggestions
    setSuggestions(s => ({ ...s, [scope]: [] }));
    
    // Load airports for the selected country and populate dropdown options
    try {
      const res = await searchAirports({ country, limit: 50 });
      const airports = res?.data || [];
      
      if (scope === 'paisOrigen') {
        // Clear the airport field and populate options
        update('puertoCarga.nombre', '');
        update('puertoCarga.id', '');
        setAirportOptions(prev => ({ ...prev, carga: airports }));
      } else if (scope === 'paisDestino') {
        // Clear the airport field and populate options
        update('puertoDescarga.nombre', '');
        update('puertoDescarga.id', '');
        setAirportOptions(prev => ({ ...prev, descarga: airports }));
      }
    } catch (error) {
      console.error('Error loading airports for country:', error);
    }
  };

  const addDetalle = () => {
    setForm(prev => ({ ...prev, detalles: [...prev.detalles, { largo: '', ancho: '', alto: '', unidadMedida: 'cm', peso: '', unidadPeso: 'kg', tipoMercancia: 'general', isApilable: 'Si', noPiezas: '' }] }));
  };
  const removeDetalle = (idx) => {
    setForm(prev => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== idx) }));
  };
  const setDetalle = (idx, key, value) => {
    setForm(prev => ({ ...prev, detalles: prev.detalles.map((d, i) => i === idx ? { ...d, [key]: value } : d) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Construir payload según especificación
      const legacyId = form.tipo === 'importacion' ? 'importacion_aerea' : 'exportacion_aerea';
      const legacyName = form.tipo === 'importacion' ? 'Importación Aérea' : 'Exportación Aérea';
      const payload = {
        codigo: '', // backend generará si aplica
        consecutivo: '',
        estado: 'Pendiente',
        cliente: form.cliente,
        tipoOperacion: { id: legacyId, nombre: legacyName },
        incoterm: form.incoterm,
        asesor: form.asesor,
        puertoCarga: form.puertoCarga,
        puertoDescarga: form.puertoDescarga,
        paisOrigen: form.paisOrigen,
        paisDestino: form.paisDestino,
        descripcion: form.descripcion,
        NoPiezas: Number(form.NoPiezas || 0) || 0,
        detalles: form.detalles.map(d => ({
          ...d,
          largo: Number(d.largo || 0) || 0,
          ancho: Number(d.ancho || 0) || 0,
          alto: Number(d.alto || 0) || 0,
          peso: Number(d.peso || 0) || 0,
        })),
      };
      const result = await createAirRequest(payload);
      if (result.success || result.code === 201) {
        await onSave(result.data || payload);
      } else {
        throw new Error(result.message || 'Error al crear la solicitud aérea');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg shadow-lg w-full max-w-6xl h-[85vh] flex flex-col relative z-10">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => update('tipo', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="importacion">Importación</SelectItem>
                    <SelectItem value="exportacion">Exportación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Incoterm</Label>
                <Select value={form.incoterm} onValueChange={(v) => update('incoterm', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona incoterm" /></SelectTrigger>
                  <SelectContent>
                    {incotermOpts.map(i => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Cliente (buscar por nombre/NIT)</Label>
                <Input value={form.cliente.nombre} onChange={(e) => { update('cliente.nombre', e.target.value); onClienteSearch(e.target.value); }} placeholder="Cliente" />
                {suggestions.clientes?.length > 0 && (
                  <div className="mt-1 border rounded max-h-40 overflow-auto bg-background">
                    {suggestions.clientes.map((c) => (
                      <button type="button" key={c._id || c.id} className="w-full text-left px-2 py-1 hover:bg-muted" onClick={() => { setForm(prev => ({ ...prev, cliente: { id: c._id || c.id, nombre: c.nombre || c.name, nit: c.nit || c.ruc || c.documento || '' } })); setSuggestions(s => ({ ...s, clientes: [] })); }}>
                        {(c.nombre || c.name) + (c.nit ? ` — ${c.nit}` : '')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Asesor</Label>
                <Select value={form.asesor.id} onValueChange={(v) => {
                  const a = catalogs.asesores.find(x => (x._id || x.id) === v);
                  setForm(prev => ({ ...prev, asesor: { id: a?._id || a?.id || v, nombre: a?.nombre || a?.name || '', correo: a?.correo || a?.email || '' } }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecciona asesor" /></SelectTrigger>
                  <SelectContent>
                    {catalogs.asesores.map(a => (
                      <SelectItem key={a._id || a.id} value={a._id || a.id}>{a.nombre || a.name || a.correo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>País de Origen</Label>
                <Input value={form.paisOrigen} onChange={(e) => { update('paisOrigen', e.target.value); onCountrySearch('paisOrigen', e.target.value); }} placeholder="Escriba el país de origen" />
                {suggestions.paisOrigen?.length > 0 && (
                  <div className="mt-1 border rounded max-h-40 overflow-auto bg-background">
                    {suggestions.paisOrigen.map((country, index) => (
                      <button type="button" key={index} className="w-full text-left px-2 py-1 hover:bg-muted" onClick={() => onCountrySelect('paisOrigen', country)}>
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>País de Destino</Label>
                <Input value={form.paisDestino} onChange={(e) => { update('paisDestino', e.target.value); onCountrySearch('paisDestino', e.target.value); }} placeholder="Escriba el país de destino" />
                {suggestions.paisDestino?.length > 0 && (
                  <div className="mt-1 border rounded max-h-40 overflow-auto bg-background">
                    {suggestions.paisDestino.map((country, index) => (
                      <button type="button" key={index} className="w-full text-left px-2 py-1 hover:bg-muted" onClick={() => onCountrySelect('paisDestino', country)}>
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Aeropuerto Origen (carga)</Label>
                <Select value={form.puertoCarga.id} onValueChange={(v) => {
                  const airport = airportOptions.carga.find(a => (a._id || a.id) === v);
                  if (airport) {
                    setForm(prev => ({ 
                      ...prev, 
                      puertoCarga: { 
                        id: airport._id || airport.id, 
                        nombre: airport.nombre, 
                        ciudad: airport.ciudad, 
                        iata: airport.iata, 
                        unlocode: airport.unlocode, 
                        pais: airport.pais 
                      } 
                    }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={form.paisOrigen ? "Selecciona aeropuerto" : "Primero selecciona un país"} />
                  </SelectTrigger>
                  <SelectContent>
                    {airportOptions.carga.map((airport) => (
                      <SelectItem key={airport._id || airport.id} value={airport._id || airport.id}>
                        {airport.nombre} {airport.iata ? `(${airport.iata})` : ''} {airport.ciudad ? `- ${airport.ciudad}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Aeropuerto Destino (descarga)</Label>
                <Select value={form.puertoDescarga.id} onValueChange={(v) => {
                  const airport = airportOptions.descarga.find(a => (a._id || a.id) === v);
                  if (airport) {
                    setForm(prev => ({ 
                      ...prev, 
                      puertoDescarga: { 
                        id: airport._id || airport.id, 
                        nombre: airport.nombre, 
                        ciudad: airport.ciudad, 
                        iata: airport.iata, 
                        unlocode: airport.unlocode, 
                        pais: airport.pais 
                      } 
                    }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={form.paisDestino ? "Selecciona aeropuerto" : "Primero selecciona un país"} />
                  </SelectTrigger>
                  <SelectContent>
                    {airportOptions.descarga.map((airport) => (
                      <SelectItem key={airport._id || airport.id} value={airport._id || airport.id}>
                        {airport.nombre} {airport.iata ? `(${airport.iata})` : ''} {airport.ciudad ? `- ${airport.ciudad}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => update('descripcion', e.target.value)} placeholder="Descripción corta" />
              </div>
              <div>
                <Label>No. Piezas Total</Label>
                <Input type="number" inputMode="numeric" value={form.NoPiezas} onChange={(e) => update('NoPiezas', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Peso Total (kg)</Label>
                <Input type="number" value={pesoTotal.toFixed(2)} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Peso Volumétrico (kg)</Label>
                <Input type="number" value={pesoVolumetrico.toFixed(2)} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <Label>Detalles de paquetes</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={addDetalle}><Plus className="h-4 w-4 mr-1" /> Añadir</Button>
                </div>
              </div>
              <div className="mt-2 space-y-2 relative z-0">
                {form.detalles.map((d, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-10 gap-1 items-end">
                    <div>
                      <Label>No. Piezas</Label>
                      <Input type="number" inputMode="numeric" value={d.noPiezas} onChange={(e) => setDetalle(idx, 'noPiezas', e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <Label>Largo</Label>
                      <Input type="number" value={d.largo} onChange={(e) => setDetalle(idx, 'largo', e.target.value)} />
                    </div>
                    <div>
                      <Label>Ancho</Label>
                      <Input type="number" value={d.ancho} onChange={(e) => setDetalle(idx, 'ancho', e.target.value)} />
                    </div>
                    <div>
                      <Label>Alto</Label>
                      <Input type="number" value={d.alto} onChange={(e) => setDetalle(idx, 'alto', e.target.value)} />
                    </div>
                    <div>
                      <Label>Unidad</Label>
                      <Select value={d.unidadMedida} onValueChange={(v) => setDetalle(idx, 'unidadMedida', v)}>
                        <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="in">in</SelectItem>
                          <SelectItem value="ft">ft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Peso</Label>
                      <Input type="number" value={d.peso} onChange={(e) => setDetalle(idx, 'peso', e.target.value)} />
                    </div>
                    <div>
                      <Label>Unidad Peso</Label>
                      <Select value={d.unidadPeso} onValueChange={(v) => setDetalle(idx, 'unidadPeso', v)}>
                        <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo Mercancía</Label>
                      <Select value={d.tipoMercancia} onValueChange={(v) => setDetalle(idx, 'tipoMercancia', v)}>
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="peligroso">Peligroso</SelectItem>
                          <SelectItem value="perecedero">Perecedero</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Apilable</Label>
                      <Select value={d.isApilable} onValueChange={(v) => setDetalle(idx, 'isApilable', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Si">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end h-10">
                      {form.detalles.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 h-8 w-8 p-0" onClick={() => removeDetalle(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 border-t flex items-center justify-end gap-2 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>) : 'Guardar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AirOperationModal;
