import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchVias } from '@/pages/parametrizacion/vias/Services/vias.services';
import { fetchOperationTypes } from '@/pages/parametrizacion/operation-types/Services/operation-types.services';
import { fetchUsers } from '@/pages/parametrizacion/usuarios/Services/users.services';
import { fetchClients } from '@/pages/parametrizacion/clients/Services/clients.services';
import { fetchLoadingPorts } from '@/pages/parametrizacion/loading-ports/Services/loading-ports.services';
import { countries, countriesMap } from '@/data/countries';

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
  const [catalogs, setCatalogs] = useState({ vias: [], tipos: [], asesores: [] });
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [suggestions, setSuggestions] = useState({ puertosCarga: [], puertosDescarga: [] });
  const [loadingSuggest, setLoadingSuggest] = useState({ cliente: false, puertoCarga: false, puertoDescarga: false, paisOrigen: false, ciudadOrigen: false, paisDestino: false, ciudadDestino: false });

  const debounceRef = useRef({});

  const isEdit = useMemo(() => Boolean(item), [item]);

  useEffect(() => {
    if (!isOpen) return;
    const initial = item || {
      cliente: { id: '', nombre: '', nit: '' },
      tipoOperacion: { id: '', nombre: '' },
      via: { id: '', nombre: '' },
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
        const [viasRes, tiposRes, asesoresRes] = await Promise.all([
          fetchVias({ limit: 50, offset: 1, query: {} }),
          fetchOperationTypes({ limit: 50, offset: 1, query: {} }),
          fetchUsers({ limit: 50, offset: 1, query: { rol: 'asesor' } }),
        ]);
        const vias = viasRes?.data?.items || viasRes?.items || viasRes?.data || [];
        const tipos = tiposRes?.data?.items || tiposRes?.items || tiposRes?.data || [];
        const asesores = asesoresRes?.data?.items || asesoresRes?.items || asesoresRes?.data || [];
        setCatalogs({ vias, tipos, asesores });
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
    if (!form?.via?.id) e['via.id'] = 'Vía ID es requerido';
    if (!form?.via?.nombre) e['via.nombre'] = 'Vía es requerida';
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
    // Normaliza numéricos
    const payload = {
      ...form,
      piezas: form.piezas === '' ? undefined : Number(form.piezas),
      pesoKg: form.pesoKg === '' ? undefined : Number(form.pesoKg),
      m3: form.m3 === '' ? undefined : Number(form.m3),
    };
    onSave(payload);
  };

  // Debounce helper
  const debounce = (key, fn, delay = 400) => {
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(fn, delay);
  };

  // Prefetch puertos for a given scope ('origen' | 'destino') using selected país and vía
  // viaOverride: 'aerea' | 'maritima' (optional)
  const fetchPortsForScope = async (scope, viaOverride) => {
    try {
      const viaNombre = viaOverride
        ? (viaOverride === 'aerea' ? 'aérea' : 'marítima')
        : (form?.via?.nombre || '').toLowerCase();
      let tipoFiltro = undefined;
      if (viaNombre.includes('érea') || viaNombre.includes('aerea')) tipoFiltro = 'aeropuerto';
      else if (viaNombre.includes('marít') || viaNombre.includes('marit')) tipoFiltro = 'puerto';
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

  // Buscar cliente por NIT y autocompletar
  const onClienteNitChange = (value) => {
    handleChange('cliente.nit', value);
    if (!value || value.length < 3) return; // evita spam
    setLoadingSuggest(prev => ({ ...prev, cliente: true }));
    debounce('clienteNit', async () => {
      try {
        const res = await fetchClients({ limit: 1, offset: 1, query: { nit: value } });
        const items = res?.data?.items || res?.items || res?.data || [];
        const found = Array.isArray(items) ? items[0] : null;
        if (found) {
          setForm(prev => ({
            ...prev,
            cliente: {
              id: found._id || found.id || prev.cliente?.id || '',
              nombre: found.nombre || found.name || prev.cliente?.nombre || '',
              nit: found.nit || value,
            }
          }));
        }
      } catch (e) {
        console.error('Error buscando cliente por NIT', e);
      } finally {
        setLoadingSuggest(prev => ({ ...prev, cliente: false }));
      }
    });
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
        // Determinar tipo según vía
        const viaNombre = (form?.via?.nombre || '').toLowerCase();
        let tipoFiltro = undefined;
        if (viaNombre.includes('érea') || viaNombre.includes('aerea')) tipoFiltro = 'aeropuerto';
        else if (viaNombre.includes('marít') || viaNombre.includes('marit')) tipoFiltro = 'puerto';
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
  const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

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
              <div>
                <Label>Cliente NIT</Label>
                <div className="relative">
                  <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" value={form?.cliente?.nit || ''} onChange={(e) => onClienteNitChange(e.target.value)} />
                  {loadingSuggest.cliente && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-2.5 text-muted-foreground" />}
                </div>
              </div>
              <div>
                <Label>Cliente Nombre</Label>
                <Input value={form?.cliente?.nombre || ''} readOnly disabled className={cn('bg-muted text-muted-foreground')} />
                {errors['cliente.nombre'] && <p className="text-sm text-destructive">{errors['cliente.nombre']}</p>}
              </div>
            </div>
          </div>

          {/* Tipo Operación y Vía en la misma fila */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo Operación *</Label>
                <Select
                  value={form?.tipoOperacion?.id || ''}
                  onValueChange={(val) => {
                    const selected = catalogs.tipos.find(t => (t._id || t.id) === val);
                    setForm(prev => ({ ...prev, tipoOperacion: { id: val, nombre: selected?.nombre || selected?.name || '' } }));
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
              <div>
                <Label>Vía *</Label>
                <Select
                  value={form?.via?.id || ''}
                  onValueChange={(val) => {
                    const nombre = val === 'aerea' ? 'Aérea' : 'Marítima';
                    const hasPaisOrigen = !!(form?.origen?.pais);
                    const hasPaisDestino = !!(form?.destino?.pais);
                    // Actualiza vía y limpia selección de puertos
                    setForm(prev => ({
                      ...prev,
                      via: { id: val, nombre },
                      puertoCarga: { id: '', nombre: '' },
                      puertoDescarga: { id: '', nombre: '' },
                    }));
                    // limpiar sugerencias de puertos al cambiar vía
                    setSuggestions(prev => ({ ...prev, puertosCarga: [], puertosDescarga: [] }));
                    // Prefetch según el país y la nueva vía
                    if (hasPaisOrigen) fetchPortsForScope('origen', val);
                    if (hasPaisDestino) fetchPortsForScope('destino', val);
                  }}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder={loadingCatalogs ? 'Cargando...' : 'Seleccionar vía'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aerea">Aérea</SelectItem>
                    <SelectItem value="maritima">Marítima</SelectItem>
                  </SelectContent>
                </Select>
                {errors['via.nombre'] && <p className="text-sm text-destructive">{errors['via.nombre']}</p>}
              </div>
            </div>
          </div>

          {/* Origen */}
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
              {/* Puerto Carga */}
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
            </div>
          </div>

          {/* Destino */}
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
              {/* Puerto Destino */}
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
            </div>
          </div>

          {/* Datos del embarque */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Datos del embarque</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Incoterm</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" value={form?.incoterm || ''} onChange={(e) => handleChange('incoterm', e.target.value)} />
              </div>
              <div>
                <Label>Piezas</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" type="number" value={form?.piezas ?? ''} onChange={(e) => handleChange('piezas', e.target.value)} />
              </div>
              <div>
                <Label>Peso (Kg)</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" type="number" value={form?.pesoKg ?? ''} onChange={(e) => handleChange('pesoKg', e.target.value)} />
              </div>
              <div>
                <Label>Volumen (m3)</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" type="number" value={form?.m3 ?? ''} onChange={(e) => handleChange('m3', e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <Label>Descripción</Label>
                <textarea
                  className="mt-1 w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  value={form?.descripcion || ''}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Detalle adicional de la operación (mercancía, consideraciones, etc.)"
                />
              </div>
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
