import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, Plus, Minus } from 'lucide-react';
import { fetchUsers } from '@/pages/parametrizacion/usuarios/Services/users.services';
import { fetchClients } from '@/pages/parametrizacion/clients/Services/clients.services';
import { fetchLoadingPorts } from '@/pages/parametrizacion/loading-ports/Services/loading-ports.services';

const AirOperationModal = ({ isOpen, onClose, onSave, title = 'Crear Solicitud Aérea' }) => {
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState({ asesores: [] });
  const [suggestions, setSuggestions] = useState({ clientes: [], carga: [], descarga: [] });

  const [form, setForm] = useState({
    tipo: 'importacion',
    cliente: { id: '', nombre: '', nit: '' },
    incoterm: '',
    asesor: { id: '', nombre: '', correo: '' },
    puertoCarga: { id: '', nombre: '' },
    puertoDescarga: { id: '', nombre: '' },
    descripcion: '',
    NoPiezas: '',
    detalles: [
      { largo: '', ancho: '', alto: '', unidadMedida: 'cm', peso: '', unidadPeso: 'kg', tipoMercancia: 'general', isApilable: false }
    ]
  });

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
    const base = { tipo: 'aeropuerto', $or: [
      { nombre: { $regex: term, $options: 'i' } },
      { ciudad: { $regex: term, $options: 'i' } },
      { iata: { $regex: term, $options: 'i' } },
      { unlocode: { $regex: term, $options: 'i' } },
    ]};
    const res = await fetchLoadingPorts({ limit: 10, offset: 1, query: base });
    const items = res?.data?.items || res?.items || res?.data || [];
    setSuggestions(prev => ({ ...prev, [scope]: items }));
  };

  const addDetalle = () => {
    setForm(prev => ({ ...prev, detalles: [...prev.detalles, { largo: '', ancho: '', alto: '', unidadMedida: 'cm', peso: '', unidadPeso: 'kg', tipoMercancia: 'general', isApilable: false }] }));
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
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg shadow-lg w-full max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Aeropuerto Origen (carga)</Label>
                <Input value={form.puertoCarga.nombre} onChange={(e) => { update('puertoCarga.nombre', e.target.value); onPortSearch('carga', e.target.value); }} placeholder="Nombre/IATA/UNLOCODE" />
                {suggestions.carga?.length > 0 && (
                  <div className="mt-1 border rounded max-h-40 overflow-auto bg-background">
                    {suggestions.carga.map((p) => (
                      <button type="button" key={p._id || p.id} className="w-full text-left px-2 py-1 hover:bg-muted" onClick={() => { setForm(prev => ({ ...prev, puertoCarga: { id: p._id || p.id, nombre: p.nombre, ciudad: p.ciudad, iata: p.iata, unlocode: p.unlocode, pais: p.pais } })); setSuggestions(s => ({ ...s, carga: [] })); }}>
                        {p.nombre} {p.iata ? `(${p.iata})` : ''} {p.ciudad ? `- ${p.ciudad}` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Aeropuerto Destino (descarga)</Label>
                <Input value={form.puertoDescarga.nombre} onChange={(e) => { update('puertoDescarga.nombre', e.target.value); onPortSearch('descarga', e.target.value); }} placeholder="Nombre/IATA/UNLOCODE" />
                {suggestions.descarga?.length > 0 && (
                  <div className="mt-1 border rounded max-h-40 overflow-auto bg-background">
                    {suggestions.descarga.map((p) => (
                      <button type="button" key={p._id || p.id} className="w-full text-left px-2 py-1 hover:bg-muted" onClick={() => { setForm(prev => ({ ...prev, puertoDescarga: { id: p._id || p.id, nombre: p.nombre, ciudad: p.ciudad, iata: p.iata, unlocode: p.unlocode, pais: p.pais } })); setSuggestions(s => ({ ...s, descarga: [] })); }}>
                        {p.nombre} {p.iata ? `(${p.iata})` : ''} {p.ciudad ? `- ${p.ciudad}` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => update('descripcion', e.target.value)} placeholder="Descripción corta" />
              </div>
              <div>
                <Label>No. Piezas</Label>
                <Input type="number" inputMode="numeric" value={form.NoPiezas} onChange={(e) => update('NoPiezas', e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Detalles de paquetes</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={addDetalle}><Plus className="h-4 w-4 mr-1" /> Añadir</Button>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {form.detalles.map((d, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-8 gap-2 items-end">
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
                          <SelectItem value="ton">ton</SelectItem>
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
                    <div className="flex items-center gap-2">
                      <input id={`apilable-${idx}`} type="checkbox" checked={!!d.isApilable} onChange={(e) => setDetalle(idx, 'isApilable', e.target.checked)} />
                      <Label htmlFor={`apilable-${idx}`}>Apilable</Label>
                      {form.detalles.length > 1 && (
                        <Button type="button" variant="ghost" className="text-red-600" onClick={() => removeDetalle(idx)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t flex items-center justify-end gap-2">
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
