import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// Vía eliminada: no se requiere fetch de vías
import { fetchUsers } from '@/pages/parametrizacion/usuarios/Services/users.services';
import { fetchClients } from '@/pages/parametrizacion/clients/Services/clients.services';
import { fetchLoadingPorts } from '@/pages/parametrizacion/loading-ports/Services/loading-ports.services';
import { countries, countriesMap } from '@/data/countries';
import { colombiaGeo } from '@/data/colombiaGeo';

// Modal especializado para crear/editar Operaciones
// Props:
// - isOpen: boolean
// - onClose: fn
// - onSave: fn(payload)
// - item: operación existente (para editar) o null (crear)
// - title: string
const OperationModal = ({ isOpen, onClose, onSave, item, title = 'Crear Operación' }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [catalogs, setCatalogs] = useState({ tipos: [], asesores: [] });
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [suggestions, setSuggestions] = useState({ clientes: [], puertosCarga: [], puertosDescarga: [] });
  const [loadingSuggest, setLoadingSuggest] = useState({ cliente: false, puertoCarga: false, puertoDescarga: false, paisOrigen: false, ciudadOrigen: false, paisDestino: false, ciudadDestino: false });

  const debounceRef = useRef({});

  const isEdit = useMemo(() => Boolean(item), [item]);

  useEffect(() => {
    if (!isOpen) return;
    const initial = item || {
      cliente: { id: '', nombre: '', nit: '' },
      tipoOperacion: { id: '', nombre: '' },
      puertoCarga: { id: '', nombre: '' },
      puertoDescarga: { id: '', nombre: '' },
      incoterm: '', piezas: '', pesoKg: '', m3: '', descripcion: '',
      asesorId: '', asesorNombre: '', asesorCorreo: ''
    };
    setForm(initial);
    setErrors({});
    // Cargar catálogos básicos cuando abre
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [asesoresRes] = await Promise.all([
          fetchUsers({ limit: 50, offset: 1, query: { rol: 'asesor' } }),
        ]);
  
        const tipos = [
          { id: 'agenciamiento_aduanero', nombre: 'Agenciamiento aduanero' },
          { id: 'transporte_terrestre', nombre: 'Transporte terrestre' },
          { id: 'importacion_lcl', nombre: 'Importación LCL' },
          { id: 'importacion_fcl', nombre: 'Importación FCL' },
          { id: 'exportacion_lcl', nombre: 'Exportación LCL' },
          { id: 'exportacion_fcl', nombre: 'Exportación FCL' },
          { id: 'importacion_aerea', nombre: 'Importación Aérea' },
          { id: 'exportacion_aerea', nombre: 'Exportación Aérea' },
          { id: 'triangulacion', nombre: 'Triangulación' },
        ];
        const asesores = asesoresRes?.data?.items || asesoresRes?.items || asesoresRes?.data || [];
        setCatalogs({ tipos, asesores });
      } catch (e) {
        console.error('Error cargando catálogos', e);
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
    return () => {
      if (!isOpen) { setForm({}); setErrors({}); }
    };
  }, [isOpen, item]);

  const requiredChecks = () => {
    const e = {};
    if (!form?.cliente?.id) e['cliente.id'] = 'Cliente ID es requerido';
    if (!form?.cliente?.nombre) e['cliente.nombre'] = 'Cliente Nombre es requerido';
    if (!form?.tipoOperacion?.id) e['tipoOperacion.id'] = 'Tipo Operación ID es requerido';
    if (!form?.tipoOperacion?.nombre) e['tipoOperacion.nombre'] = 'Tipo Operación es requerido';
    const tipoId = (form?.tipoOperacion?.id || '').toLowerCase();
    if (tipoId === 'transporte_terrestre') {
      if (!form?.departamentoRecogida) e['departamentoRecogida'] = 'Departamento de recogida es requerido';
      if (!form?.ciudadRecogida) e['ciudadRecogida'] = 'Ciudad de recogida es requerida';
      if (!form?.departamentoEntrega) e['departamentoEntrega'] = 'Departamento de entrega es requerido';
      if (!form?.ciudadEntrega) e['ciudadEntrega'] = 'Ciudad de entrega es requerida';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (path, value) => {
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
    if (errors[path]) setErrors(prev => ({ ...prev, [path]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requiredChecks()) return;
    // Normaliza numéricos (acepta valores con comas para miles)
    const toNum = (v) => {
      if (v === '' || v === undefined || v === null) return undefined;
      if (typeof v === 'string') {
        const cleaned = v.replace(/,/g, '');
        const num = Number(cleaned);
        return Number.isNaN(num) ? undefined : num;
      }
      return Number(v);
    };
    const esp = form.especifico || {};
    const det = esp.detalles || {};
    const payload = {
      ...form,
      piezas: toNum(form.piezas),
      pesoKg: toNum(form.pesoKg),
      m3: toNum(form.m3),
      especifico: {
        ...esp,
        valorMercancia: toNum(esp.valorMercancia),
        numeroContenedores: toNum(esp.numeroContenedores),
        detalles: {
          ...det,
          piezas: toNum(det.piezas),
          largo: toNum(det.largo),
          ancho: toNum(det.ancho),
          alto: toNum(det.alto),
          peso: toNum(det.peso),
        },
      },
    };
    // Normalizar por tipo de operación
    const tipoId = (form?.tipoOperacion?.id || '').toLowerCase();
    if (tipoId === 'agenciamiento_aduanero') {
      payload.origen = undefined;
      payload.destino = undefined;
      payload.puertoCarga = undefined;
      payload.puertoDescarga = undefined;
      payload.incoterm = undefined;
    } else if (tipoId === 'transporte_terrestre') {
      // Mantener campos terrestres y limpiar marítimo/aéreo
      payload.ciudadRecogida = form.ciudadRecogida || '';
      payload.ciudadEntrega = form.ciudadEntrega || '';
      payload.departamentoRecogida = form.departamentoRecogida || '';
      payload.departamentoEntrega = form.departamentoEntrega || '';
      payload.origen = undefined;
      payload.destino = undefined;
      payload.puertoCarga = undefined;
      payload.puertoDescarga = undefined;
      payload.incoterm = undefined;
    }
    onSave(payload);
  };

  // Debounce helper
  const debounce = (key, fn, delay = 400) => {
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(fn, delay);
  };

  // Prefetch puertos for a given scope ('origen' | 'destino') using selected país and tipo de operación
  const fetchPortsForScope = async (scope) => {
    try {
      const tipoId = (form?.tipoOperacion?.id || '').toLowerCase();
      let tipoFiltro = undefined; // aeropuerto | puerto | undefined
      if (tipoId.includes('aerea')) tipoFiltro = 'aeropuerto';
      else if (tipoId.includes('fcl') || tipoId.includes('lcl')) tipoFiltro = 'puerto';
      const paisSel = form?.[scope]?.pais || '';
      if (!paisSel && !tipoFiltro) return;
      const base = { ...(tipoFiltro ? { tipo: tipoFiltro } : {}) };
      if (paisSel) base.pais = { $regex: `^${paisSel}$`, $options: 'i' };
      const res = await fetchLoadingPorts({ limit: 20, offset: 1, query: base });
      const items = res?.data?.items || res?.items || res?.data || [];
      setSuggestions(prev => ({ ...prev, [scope === 'origen' ? 'puertosCarga' : 'puertosDescarga']: items }));
    } catch (e) {
      console.error('Error pre-cargando puertos por país', e);
    }
  };

  // Buscar cliente por NOMBRE y mostrar sugerencias; al seleccionar, autocompletar NIT
  const onClienteNombreChange = (value) => {
    handleChange('cliente.nombre', value);
    // Al tipear nombre, limpiar id y mantener NIT si ya estaba, se actualizará al seleccionar
    handleChange('cliente.id', '');
    if (!value || value.trim().length < 2) {
      setSuggestions(prev => ({ ...prev, clientes: [] }));
      return;
    }
    setLoadingSuggest(prev => ({ ...prev, cliente: true }));
    const term = value.trim();
    debounce('clienteNombre', async () => {
      try {
        const query = {
          $or: [
            { nombre: { $regex: term, $options: 'i' } },
            { name: { $regex: term, $options: 'i' } },
            { nit: { $regex: term, $options: 'i' } },
          ],
        };
        const res = await fetchClients({ limit: 10, offset: 1, query });
        const items = res?.data?.items || res?.items || res?.data || [];
        setSuggestions(prev => ({ ...prev, clientes: Array.isArray(items) ? items : [] }));
      } catch (e) {
        console.error('Error buscando clientes por nombre', e);
      } finally {
        setLoadingSuggest(prev => ({ ...prev, cliente: false }));
      }
    });
  };

  const onSelectCliente = (cli) => {
    setForm(prev => ({
      ...prev,
      cliente: {
        id: cli._id || cli.id || prev?.cliente?.id || '',
        nombre: cli.nombre || cli.name || '',
        nit: cli.nit || cli.ruc || cli.documento || prev?.cliente?.nit || '',
      },
    }));
    setSuggestions(prev => ({ ...prev, clientes: [] }));
  };

  // Sugerencias de puertos por nombre (carga/descarga)
  const onPuertoNombreChange = (fieldBase, value) => {
    handleChange(`${fieldBase}.nombre`, value);
    // limpiar id cuando cambia el nombre manualmente
    handleChange(`${fieldBase}.id`, '');
    // limpiar ciudad mostrada si el usuario vuelve a tipear
    handleChange(`${fieldBase}.ciudad`, '');
    // limpiar códigos y país
    handleChange(`${fieldBase}.iata`, '');
    handleChange(`${fieldBase}.unlocode`, '');
    // Nota: no limpiamos el país seleccionado; país se elige de forma independiente
    if (!value || value.length < 2) { // mínimo 2 chars
      setSuggestions(prev => ({ ...prev, [fieldBase === 'puertoCarga' ? 'puertosCarga' : 'puertosDescarga']: [] }));
      return;
    }
    const key = fieldBase === 'puertoCarga' ? 'puertoCarga' : 'puertoDescarga';
    const suggestKey = key === 'puertoCarga' ? 'puertoCarga' : 'puertoDescarga';
    setLoadingSuggest(prev => ({ ...prev, [suggestKey]: true }));
    debounce(`port-${key}`, async () => {
      try {
        // Determinar tipo según tipo de operación
        const tipoId = (form?.tipoOperacion?.id || '').toLowerCase();
        let tipoFiltro = undefined; // aeropuerto | puerto | undefined
        if (tipoId.includes('aerea')) tipoFiltro = 'aeropuerto';
        else if (tipoId.includes('fcl') || tipoId.includes('lcl')) tipoFiltro = 'puerto';
        // Filtros por país según si es carga o descarga (ciudad es opcional y NO filtra puertos)
        const scope = fieldBase === 'puertoCarga' ? 'origen' : 'destino';
        const paisSel = form?.[scope]?.pais || '';
        const term = value.trim();
        const or = [
          { nombre: { $regex: term, $options: 'i' } },
          { ciudad: { $regex: term, $options: 'i' } },
          { iata: { $regex: term, $options: 'i' } },
          { unlocode: { $regex: term, $options: 'i' } },
        ];
        const base = tipoFiltro ? { tipo: tipoFiltro } : {};
        if (paisSel) base.pais = { $regex: `^${paisSel}$`, $options: 'i' };
        const query = { ...base, $or: or };
        const res = await fetchLoadingPorts({ limit: 10, offset: 1, query });
        const items = res?.data?.items || res?.items || res?.data || [];
        setSuggestions(prev => ({
          ...prev,
          [key === 'puertoCarga' ? 'puertosCarga' : 'puertosDescarga']: items,
        }));
      } catch (e) {
        console.error('Error buscando puertos', e);
      } finally {
        setLoadingSuggest(prev => ({ ...prev, [suggestKey]: false }));
      }
    });
  };

  const onSelectPuerto = (fieldBase, port) => {
    setForm(prev => ({
      ...prev,
      [fieldBase]: {
        id: port._id || port.id,
        nombre: port.nombre || port.name || '',
        ciudad: port.ciudad || '',
        iata: port.iata || '',
        unlocode: port.unlocode || '',
        pais: port.pais || '',
      }
    }));
    // Si faltan país/ciudad en origen/destino, complétalos con el puerto seleccionado
    const scope = fieldBase === 'puertoCarga' ? 'origen' : 'destino';
    if (!form?.[scope]?.pais || !form?.[scope]?.ciudad) {
      setForm(prev => ({
        ...prev,
        [scope]: {
          ...(prev?.[scope] || {}),
          pais: port.pais || (prev?.[scope]?.pais || ''),
          ciudad: port.ciudad || (prev?.[scope]?.ciudad || ''),
        }
      }));
    }
    setSuggestions(prev => ({ ...prev, [fieldBase === 'puertoCarga' ? 'puertosCarga' : 'puertosDescarga']: [] }));
  };

  // Helpers

// Defaults por tipo de operación
const getDefaultsForType = (tipoId) => {
  switch (tipoId) {
    case 'agenciamiento_aduanero':
      return { partidaArancelaria: '', valorMercancia: '', uso: '', tipoMercancia: 'general', moneda: 'USD' };
    case 'transporte_terrestre':
      return { valorMercancia: '', moneda: 'USD', detalles: { piezas: '', largo: '', ancho: '', alto: '', peso: '', pesoUnidad: 'kg', tipo: 'pallet', unidadMedida: 'cm' }, apilable: false };
    case 'importacion_lcl':
    case 'exportacion_lcl':
      return { valorMercancia: '', moneda: 'USD', detalles: { piezas: '', largo: '', ancho: '', alto: '', peso: '', pesoUnidad: 'kg', tipo: 'pallet', unidadMedida: 'cm' }, apilable: false };
    case 'importacion_fcl':
    case 'exportacion_fcl':
      return { valorMercancia: '', moneda: 'USD', numeroContenedores: '', detalles: { tipoContenedor: '20_pies', peso: '', pesoUnidad: 'kg', tipo: 'pallet' } };
    case 'importacion_aerea':
    case 'exportacion_aerea':
      return { detalles: { piezas: '', largo: '', ancho: '', alto: '', peso: '', pesoUnidad: 'kg', unidadMedida: 'cm' }, tipoMercancia: 'general', apilable: false };
    default:
      return {};
  }
};

  const renderTypeSpecific = () => {
    const t = form?.tipoOperacion?.id;
    const esp = form?.especifico || {};
    const det = esp.detalles || {};
    if (!t) return null;
    // UI helpers
    const SelectSimple = ({ value, onValueChange, options, placeholder }) => (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    // Helpers para dinero: formato con comas y parsing básico
    const formatNumberWithCommas = (val) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (!str) return '';
      const cleaned = str.replace(/[^0-9.]/g, '');
      const [intPart, decPart] = cleaned.split('.');
      const withCommas = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
      return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
    };

    const onMoneyInput = (path, raw) => {
      const formatted = formatNumberWithCommas(raw);
      handleChange(path, formatted);
    };

    const tipoBultoOpts = [
      { value: 'pallet', label: 'Pallet' },
      { value: 'cajas', label: 'Cajas' },
      { value: 'drum', label: 'Drum' },
      { value: 'crates', label: 'Crates' },
      { value: 'contenedor', label: 'Contenedor' },
      { value: 'otro', label: 'Otro' },
    ];
    const tipoMercanciaOpts = [
      { value: 'general', label: 'General' },
      { value: 'peligroso', label: 'Peligroso' },
      { value: 'perecedero', label: 'Perecedero' },
      { value: 'otro', label: 'Otro' },
    ];
    const tipoContenedorOpts = [
      { value: '20_pies', label: '20 pies' },
      { value: '40_pies', label: '40 pies' },
      { value: 'open_top', label: 'Open Top' },
      { value: 'flat_rack', label: 'Flat Rack' },
    ];

    const incotermOpts = [
      { value: 'EXW', label: 'EXW' },
      { value: 'FCA', label: 'FCA' },
      { value: 'FOB', label: 'FOB' },
      { value: 'CIF', label: 'CIF' },
      { value: 'CPT', label: 'CPT' },
      { value: 'CFR', label: 'CFR' },
      { value: 'DAP', label: 'DAP' },
      { value: 'DDP', label: 'DDP' },
    ];

    // Agenciamiento aduanero
    if (t === 'agenciamiento_aduanero') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Partida arancelaria</Label>
            <Input value={esp.partidaArancelaria || ''} onChange={(e) => handleChange('especifico.partidaArancelaria', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <Label>Valor de la mercancía</Label>
            <div className="flex gap-2 items-center">
              <Input
                inputMode="decimal"
                value={formatNumberWithCommas(esp.valorMercancia ?? '')}
                onChange={(e) => onMoneyInput('especifico.valorMercancia', e.target.value)}
                placeholder="0"
                className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base py-2.5"
              />
              <div className="min-w-[140px]">
                <SelectSimple
                  value={esp.moneda || 'USD'}
                  onValueChange={(v) => handleChange('especifico.moneda', v)}
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'COP', label: 'COP' },
                    { value: 'GBP', label: 'GBP' },
                  ]}
                  placeholder="Moneda"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Uso</Label>
            <Input value={esp.uso || ''} onChange={(e) => handleChange('especifico.uso', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
          </div>
          <div>
            <Label>Tipo de mercancía</Label>
            <SelectSimple
              value={esp.tipoMercancia || 'general'}
              onValueChange={(v) => handleChange('especifico.tipoMercancia', v)}
              options={tipoMercanciaOpts}
              placeholder="Selecciona tipo"
            />
          </div>
        </div>
      );
    }

    // Terrestre y LCL comparten estructura base (incoterm solo en LCL)
    if (t === 'transporte_terrestre' || t === 'importacion_lcl' || t === 'exportacion_lcl') {
      return (
        <div className="space-y-4">
          {t !== 'transporte_terrestre' && (
            <div className="max-w-[220px]">
              <Label>Incoterm</Label>
              <SelectSimple
                value={form?.incoterm || ''}
                onValueChange={(v) => handleChange('incoterm', v)}
                options={incotermOpts}
                placeholder="Selecciona incoterm"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Valor de la mercancía</Label>
              <div className="flex gap-2 items-center">
                <Input
                  inputMode="decimal"
                  value={formatNumberWithCommas(esp.valorMercancia ?? '')}
                  onChange={(e) => onMoneyInput('especifico.valorMercancia', e.target.value)}
                  placeholder="0"
                  className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base py-2.5"
                />
                <div className="min-w-[140px]">
                  <SelectSimple
                    value={esp.moneda || 'USD'}
                    onValueChange={(v) => handleChange('especifico.moneda', v)}
                    options={[
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'COP', label: 'COP' },
                      { value: 'GBP', label: 'GBP' },
                    ]}
                    placeholder="Moneda"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Piezas</Label>
              <Input type="number" value={det.piezas ?? ''} onChange={(e) => handleChange('especifico.detalles.piezas', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
            </div>
            <div className="md:col-span-3">
              <Label>Detalles</Label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input type="number" placeholder="Largo" aria-label="Largo" value={det.largo ?? ''} onChange={(e) => handleChange('especifico.detalles.largo', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <Input type="number" placeholder="Ancho" aria-label="Ancho" value={det.ancho ?? ''} onChange={(e) => handleChange('especifico.detalles.ancho', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <Input type="number" placeholder="Alto" aria-label="Alto" value={det.alto ?? ''} onChange={(e) => handleChange('especifico.detalles.alto', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <SelectSimple
                  value={det.unidadMedida || 'cm'}
                  onValueChange={(v) => handleChange('especifico.detalles.unidadMedida', v)}
                  options={[
                    { value: 'cm', label: 'cm' },
                    { value: 'm', label: 'metros' },
                    { value: 'ft', label: 'pies' },
                  ]}
                  placeholder="Unidad"
                />
              </div>
            </div>
            <div>
              <Label>Peso</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" value={det.peso ?? ''} onChange={(e) => handleChange('especifico.detalles.peso', e.target.value)} className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <div className="min-w-[120px]">
                  <SelectSimple
                    value={det.pesoUnidad || 'kg'}
                    onValueChange={(v) => handleChange('especifico.detalles.pesoUnidad', v)}
                    options={[
                      { value: 'kg', label: 'kg' },
                      { value: 'lb', label: 'lb' },
                      { value: 'ton', label: 'ton' },
                    ]}
                    placeholder="Unidad"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <SelectSimple
                value={det.tipo || 'pallet'}
                onValueChange={(v) => handleChange('especifico.detalles.tipo', v)}
                options={tipoBultoOpts}
                placeholder="Selecciona tipo"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input id="apilable" type="checkbox" checked={!!esp.apilable} onChange={(e) => handleChange('especifico.apilable', e.target.checked)} />
              <Label htmlFor="apilable">Apilable</Label>
            </div>
          </div>
        </div>
      );
    }

    // FCL
    if (t === 'importacion_fcl' || t === 'exportacion_fcl') {
          return (
            <div className="space-y-4">
              <div className="max-w-[220px]">
                <Label>Incoterm</Label>
                <SelectSimple
                  value={form?.incoterm || ''}
                  onValueChange={(v) => handleChange('incoterm', v)}
                  options={incotermOpts}
                  placeholder="Selecciona incoterm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Valor de la mercancía</Label>
              <div className="flex gap-2 items-center">
                <Input
                  inputMode="decimal"
                  value={formatNumberWithCommas(esp.valorMercancia ?? '')}
                  onChange={(e) => onMoneyInput('especifico.valorMercancia', e.target.value)}
                  placeholder="0"
                  className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-base py-2.5"
                />
                <div className="min-w-[140px]">
                  <SelectSimple
                    value={esp.moneda || 'USD'}
                    onValueChange={(v) => handleChange('especifico.moneda', v)}
                    options={[
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'COP', label: 'COP' },
                      { value: 'GBP', label: 'GBP' },
                    ]}
                    placeholder="Moneda"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Número de contenedores</Label>
              <Input type="number" value={esp.numeroContenedores ?? ''} onChange={(e) => handleChange('especifico.numeroContenedores', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
            </div>
            <div>
              <Label>Tipo contenedor</Label>
              <SelectSimple
                value={det.tipoContenedor || '20_pies'}
                onValueChange={(v) => handleChange('especifico.detalles.tipoContenedor', v)}
                options={tipoContenedorOpts}
                placeholder="Selecciona tipo contenedor"
              />
            </div>
            <div>
              <Label>Peso</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" value={det.peso ?? ''} onChange={(e) => handleChange('especifico.detalles.peso', e.target.value)} className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <div className="min-w-[120px]">
                  <SelectSimple
                    value={det.pesoUnidad || 'kg'}
                    onValueChange={(v) => handleChange('especifico.detalles.pesoUnidad', v)}
                    options={[
                      { value: 'kg', label: 'kg' },
                      { value: 'lb', label: 'lb' },
                      { value: 'ton', label: 'ton' },
                    ]}
                    placeholder="Unidad"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <SelectSimple
                value={det.tipo || 'pallet'}
                onValueChange={(v) => handleChange('especifico.detalles.tipo', v)}
                options={tipoBultoOpts}
                placeholder="Selecciona tipo"
              />
            </div>
          </div>
        </div>
      );
    }

    // Aérea
    if (t === 'importacion_aerea' || t === 'exportacion_aerea') {
      return (
        <div className="space-y-4">
          <div className="max-w-[220px]">
            <Label>Incoterm</Label>
            <SelectSimple
              value={form?.incoterm || ''}
              onValueChange={(v) => handleChange('incoterm', v)}
              options={incotermOpts}
              placeholder="Selecciona incoterm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Piezas</Label>
              <Input type="number" value={det.piezas ?? ''} onChange={(e) => handleChange('especifico.detalles.piezas', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
            </div>
            <div className="md:col-span-3">
              <Label>Detalles</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input type="number" placeholder="Largo" aria-label="Largo" value={det.largo ?? ''} onChange={(e) => handleChange('especifico.detalles.largo', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <Input type="number" placeholder="Ancho" aria-label="Ancho" value={det.ancho ?? ''} onChange={(e) => handleChange('especifico.detalles.ancho', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <Input type="number" placeholder="Alto" aria-label="Alto" value={det.alto ?? ''} onChange={(e) => handleChange('especifico.detalles.alto', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
              </div>
            </div>
            <div>
              <Label>Peso</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" value={det.peso ?? ''} onChange={(e) => handleChange('especifico.detalles.peso', e.target.value)} className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                <div className="min-w-[120px]">
                  <SelectSimple
                    value={det.pesoUnidad || 'kg'}
                    onValueChange={(v) => handleChange('especifico.detalles.pesoUnidad', v)}
                    options={[
                      { value: 'kg', label: 'kg' },
                      { value: 'lb', label: 'lb' },
                      { value: 'ton', label: 'ton' },
                    ]}
                    placeholder="Unidad"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Tipo de mercancía</Label>
              <SelectSimple
                value={esp.tipoMercancia || 'general'}
                onValueChange={(v) => handleChange('especifico.tipoMercancia', v)}
                options={tipoMercanciaOpts}
                placeholder="Selecciona tipo"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input id="apilable" type="checkbox" checked={!!esp.apilable} onChange={(e) => handleChange('especifico.apilable', e.target.checked)} />
              <Label htmlFor="apilable">Apilable</Label>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // País (origen/destino) con sugerencias locales
  const onPaisChange = (scope, value) => {
    // scope: 'origen' | 'destino'
    // Edita solo el display; el código se fija al seleccionar una opción
    handleChange(`${scope}.paisDisplay`, value);
    // al cambiar país, limpiar ciudad y puerto
    handleChange(`${scope}.ciudad`, '');
    const portKey = scope === 'origen' ? 'puertoCarga' : 'puertoDescarga';
    handleChange(`${portKey}.nombre`, '');
    setSuggestions(prev => ({
      ...prev,
      [scope === 'origen' ? 'puertosCarga' : 'puertosDescarga']: [],
    }));
    if (!value || value.length < 1) {
      // si el usuario borra, también limpiamos el código almacenado
      handleChange(`${scope}.pais`, '');
      setSuggestions(prev => ({ ...prev, [`paises${scope === 'origen' ? 'Origen' : 'Destino'}`]: [] }));
      return;
    }
    // filtrar localmente por código o nombre
    const term = value.trim().toLowerCase();
    const matches = countries.filter(c => c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)).slice(0, 20);
    setSuggestions(prev => ({ ...prev, [`paises${scope === 'origen' ? 'Origen' : 'Destino'}`]: matches }));
  };

  // Selección de país desde sugerencias: fija el CÓDIGO (ISO2) y el display "Nombre (CODE)", luego pre-carga puertos
  const onSelectPais = async (scope, countryObj) => {
    handleChange(`${scope}.pais`, countryObj.code);
    handleChange(`${scope}.paisDisplay`, `${countryObj.name} (${countryObj.code})`);
    handleChange(`${scope}.ciudad`, '');
    const portKey = scope === 'origen' ? 'puertoCarga' : 'puertoDescarga';
    handleChange(`${portKey}.nombre`, '');
    setSuggestions(prev => ({
      ...prev,
      [`paises${scope === 'origen' ? 'Origen' : 'Destino'}`]: [],
    }));
    await fetchPortsForScope(scope);
  };

  // Ciudad (origen/destino) local: no realiza consultas ni sugiere
  const onCiudadChange = (scope, value) => {
    handleChange(`${scope}.ciudad`, value);
    // limpiar cualquier sugerencia previa de ciudades
    setSuggestions(prev => ({ ...prev, [`ciudades${scope === 'origen' ? 'Origen' : 'Destino'}`]: [] }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-card p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-blue-100 border-t-[6px] border-t-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-700">{isEdit ? 'Editar Operación' : title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Label>Cliente Nombre</Label>
                <Input
                  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  value={form?.cliente?.nombre || ''}
                  onChange={(e) => onClienteNombreChange(e.target.value)}
                  placeholder="Buscar por nombre o NIT"
                />
                {loadingSuggest.cliente && (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />
                )}
                {Array.isArray(suggestions.clientes) && suggestions.clientes.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-60 overflow-auto">
                    {suggestions.clientes.map((c) => (
                      <button
                        type="button"
                        key={c._id || c.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent"
                        onClick={() => onSelectCliente(c)}
                      >
                        <span className="font-medium">{c.nombre || c.name}</span>
                        {c.nit || c.ruc || c.documento ? (
                          <span className="text-muted-foreground"> — {c.nit || c.ruc || c.documento}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Cliente NIT</Label>
                <Input value={form?.cliente?.nit || ''} readOnly disabled className={cn('bg-muted text-muted-foreground')} />
                {errors['cliente.nombre'] && <p className="text-sm text-destructive">{errors['cliente.nombre']}</p>}
              </div>
            </div>
          </div>

          {/* Tipo de operación */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <Label>Tipo Operación *</Label>
                <Select
                  value={form?.tipoOperacion?.id || ''}
                  onValueChange={(val) => {
                    const selected = catalogs.tipos.find(t => (t._id || t.id) === val);
                    setForm(prev => ({
                      ...prev,
                      tipoOperacion: { id: val, nombre: selected?.nombre || selected?.name || '' },
                      especifico: getDefaultsForType(val),
                      ...(val !== 'transporte_terrestre' ? { ciudadRecogida: undefined, ciudadEntrega: undefined, departamentoRecogida: undefined, departamentoEntrega: undefined } : {}),
                      ...(val === 'agenciamiento_aduanero'
                        ? { origen: undefined, destino: undefined, puertoCarga: undefined, puertoDescarga: undefined, incoterm: undefined }
                        : {}),
                    }));
                    // limpiar sugerencias de puertos al cambiar el tipo (por si cambia el modo a aéreo/marítimo)
                    setSuggestions(prev => ({ ...prev, puertosCarga: [], puertosDescarga: [] }));
                  }}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder={loadingCatalogs ? 'Cargando...' : 'Seleccionar tipo de operación'} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.tipos.map(t => (
                      <SelectItem key={t._id || t.id} value={(t._id || t.id)}>{t.nombre || t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors['tipoOperacion.nombre'] && <p className="text-sm text-destructive">{errors['tipoOperacion.nombre']}</p>}
              </div>
            </div>
          </div>

          {/* Origen */}
          {form?.tipoOperacion?.id !== 'agenciamiento_aduanero' && form?.tipoOperacion?.id !== 'transporte_terrestre' && (
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Origen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* País Origen */}
              <div className="relative">
                <Label>País Origen</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={
                      form?.origen?.paisDisplay
                        || (form?.origen?.pais && countriesMap[form.origen.pais] ? `${countriesMap[form.origen.pais]} (${form.origen.pais})` : (form?.origen?.pais || ''))
                    }
                    onChange={(e) => onPaisChange('origen', e.target.value)}
                    className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  />
                </div>
                {loadingSuggest.paisOrigen && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                {Array.isArray(suggestions.paisesOrigen) && suggestions.paisesOrigen.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                    {suggestions.paisesOrigen.map(c => (
                      <button type="button" key={c.code} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => onSelectPais('origen', c)}>
                        {c.name} ({c.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Ciudad Origen */}
              <div className="relative">
                <Label>Ciudad Origen</Label>
                <Input value={form?.origen?.ciudad || ''} onChange={(e) => onCiudadChange('origen', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                {loadingSuggest.ciudadOrigen && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                {Array.isArray(suggestions.ciudadesOrigen) && suggestions.ciudadesOrigen.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                    {suggestions.ciudadesOrigen.map(c => (
                      <button type="button" key={c} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => handleChange('origen.ciudad', c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Puerto Carga (no aplica para transporte terrestre) */}
              {form?.tipoOperacion?.id !== 'transporte_terrestre' && (
                <div className="relative">
                  <Label>Puerto Carga</Label>
                  <div className="flex items-center gap-2">
                    <Input className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" value={form?.puertoCarga?.nombre || ''} onChange={(e) => onPuertoNombreChange('puertoCarga', e.target.value)} />
                    {(form?.puertoCarga?.ciudad || form?.puertoCarga?.iata || form?.puertoCarga?.unlocode) && (
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {form?.puertoCarga?.ciudad || ''}
                        {(form?.puertoCarga?.iata || form?.puertoCarga?.unlocode) && (
                          <span> ({[form?.puertoCarga?.iata, form?.puertoCarga?.unlocode].filter(Boolean).join(' / ')})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {loadingSuggest.puertoCarga && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                  {suggestions.puertosCarga?.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                      {suggestions.puertosCarga.map(p => (
                        <button type="button" key={p._id || p.id} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => onSelectPuerto('puertoCarga', p)}>
                          <span className="font-medium">{p.nombre}</span>
                          {p.ciudad ? <span className="text-muted-foreground"> — {p.ciudad}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Destino */}
          {form?.tipoOperacion?.id !== 'agenciamiento_aduanero' && form?.tipoOperacion?.id !== 'transporte_terrestre' && (
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Destino</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* País Destino */}
              <div className="relative">
                <Label>País Destino</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={
                      form?.destino?.paisDisplay
                        || (form?.destino?.pais && countriesMap[form.destino.pais] ? `${countriesMap[form.destino.pais]} (${form.destino.pais})` : (form?.destino?.pais || ''))
                    }
                    onChange={(e) => onPaisChange('destino', e.target.value)}
                    className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  />
                </div>
                {loadingSuggest.paisDestino && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                {Array.isArray(suggestions.paisesDestino) && suggestions.paisesDestino.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                    {suggestions.paisesDestino.map(c => (
                      <button type="button" key={c.code} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => onSelectPais('destino', c)}>
                        {c.name} ({c.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Ciudad Destino */}
              <div className="relative">
                <Label>Ciudad Destino</Label>
                <Input value={form?.destino?.ciudad || ''} onChange={(e) => onCiudadChange('destino', e.target.value)} className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" />
                {loadingSuggest.ciudadDestino && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                {Array.isArray(suggestions.ciudadesDestino) && suggestions.ciudadesDestino.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                    {suggestions.ciudadesDestino.map(c => (
                      <button type="button" key={c} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => handleChange('destino.ciudad', c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Puerto Destino (no aplica para transporte terrestre) */}
              {form?.tipoOperacion?.id !== 'transporte_terrestre' && (
                <div className="relative">
                  <Label>Puerto Destino</Label>
                  <div className="flex items-center gap-2">
                    <Input className="flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" value={form?.puertoDescarga?.nombre || ''} onChange={(e) => onPuertoNombreChange('puertoDescarga', e.target.value)} />
                    {(form?.puertoDescarga?.ciudad || form?.puertoDescarga?.iata || form?.puertoDescarga?.unlocode) && (
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {form?.puertoDescarga?.ciudad || ''}
                        {(form?.puertoDescarga?.iata || form?.puertoDescarga?.unlocode) && (
                          <span> ({[form?.puertoDescarga?.iata, form?.puertoDescarga?.unlocode].filter(Boolean).join(' / ')})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {loadingSuggest.puertoDescarga && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                  {suggestions.puertosDescarga?.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                      {suggestions.puertosDescarga.map(p => (
                        <button type="button" key={p._id || p.id} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => onSelectPuerto('puertoDescarga', p)}>
                          <span className="font-medium">{p.nombre}</span>
                          {p.ciudad ? <span className="text-muted-foreground"> — {p.ciudad}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Ciudades (solo Transporte terrestre) */}
          {form?.tipoOperacion?.id === 'transporte_terrestre' && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-2 text-blue-600">Ciudades</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recogida */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label>Departamento de recogida</Label>
                    <Select
                      value={form?.departamentoRecogida || ''}
                      onValueChange={(v) => {
                        handleChange('departamentoRecogida', v);
                        handleChange('ciudadRecogida', ''); // limpiar ciudad al cambiar dpto
                      }}
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Selecciona departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(colombiaGeo).sort().map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ciudad de recogida</Label>
                    <Select
                      value={form?.ciudadRecogida || ''}
                      onValueChange={(v) => handleChange('ciudadRecogida', v)}
                      disabled={!form?.departamentoRecogida}
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500" disabled={!form?.departamentoRecogida}>
                        <SelectValue placeholder={form?.departamentoRecogida ? 'Selecciona ciudad' : 'Selecciona departamento primero'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(colombiaGeo[form?.departamentoRecogida] || []).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Entrega */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label>Departamento de entrega</Label>
                    <Select
                      value={form?.departamentoEntrega || ''}
                      onValueChange={(v) => {
                        handleChange('departamentoEntrega', v);
                        handleChange('ciudadEntrega', '');
                      }}
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Selecciona departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(colombiaGeo).sort().map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ciudad de entrega</Label>
                    <Select
                      value={form?.ciudadEntrega || ''}
                      onValueChange={(v) => handleChange('ciudadEntrega', v)}
                      disabled={!form?.departamentoEntrega}
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500" disabled={!form?.departamentoEntrega}>
                        <SelectValue placeholder={form?.departamentoEntrega ? 'Selecciona ciudad' : 'Selecciona departamento primero'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(colombiaGeo[form?.departamentoEntrega] || []).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Datos según tipo de operación */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Datos específicos</h3>
            {renderTypeSpecific()}
            <div className="mt-4">
              <Label>Descripción</Label>
              <textarea
                className="mt-1 w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                value={form?.descripcion || ''}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Detalle adicional de la operación (mercancía, consideraciones, etc.)"
              />
            </div>
          </div>

          {/* Asesor */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Asesor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Seleccionar asesor</Label>
                <Select
                  value={form?.asesorId || ''}
                  onValueChange={(val) => {
                    const selected = catalogs.asesores.find(a => (a._id || a.id) === val);
                    const name = selected?.nombre || selected?.name || `${selected?.firstName || ''} ${selected?.lastName || ''}`.trim();
                    const mail = selected?.correo || selected?.email || '';
                    setForm(prev => ({ ...prev, asesorId: val, asesorNombre: name, asesorCorreo: mail }));
                  }}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder={loadingCatalogs ? 'Cargando...' : 'Seleccionar asesor'} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.asesores.map(a => {
                      const name = a.nombre || a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
                      return (
                        <SelectItem key={a._id || a.id} value={(a._id || a.id)}>
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Correo</Label>
                <Input value={form?.asesorCorreo || ''} readOnly disabled className={cn('bg-muted text-muted-foreground')} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-blue-200 text-blue-700 hover:bg-blue-50">Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{isEdit ? 'Guardar Cambios' : 'Crear'}</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OperationModal;
