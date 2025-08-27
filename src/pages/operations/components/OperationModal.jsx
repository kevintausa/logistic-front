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
  const [loadingSuggest, setLoadingSuggest] = useState({ cliente: false, puertoCarga: false, puertoDescarga: false });

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
    if (!value || value.length < 2) { // mínimo 2 chars
      setSuggestions(prev => ({ ...prev, [fieldBase === 'puertoCarga' ? 'puertosCarga' : 'puertosDescarga']: [] }));
      return;
    }
    const key = fieldBase === 'puertoCarga' ? 'puertoCarga' : 'puertoDescarga';
    const suggestKey = key === 'puertoCarga' ? 'puertoCarga' : 'puertoDescarga';
    setLoadingSuggest(prev => ({ ...prev, [suggestKey]: true }));
    debounce(`port-${key}`, async () => {
      try {
        const res = await fetchLoadingPorts({ limit: 10, offset: 1, query: { nombre: value } });
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
      [fieldBase]: { id: port._id || port.id, nombre: port.nombre || port.name || '' }
    }));
    setSuggestions(prev => ({ ...prev, [fieldBase === 'puertoCarga' ? 'puertosCarga' : 'puertosDescarga']: [] }));
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
                    const selected = catalogs.vias.find(v => (v._id || v.id) === val);
                    setForm(prev => ({ ...prev, via: { id: val, nombre: selected?.nombre || selected?.name || '' } }));
                  }}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder={loadingCatalogs ? 'Cargando...' : 'Seleccionar vía'} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.vias.map(v => (
                      <SelectItem key={v._id || v.id} value={(v._id || v.id)}>{v.nombre || v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors['via.nombre'] && <p className="text-sm text-destructive">{errors['via.nombre']}</p>}
              </div>
            </div>
          </div>

          {/* Puertos */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 text-blue-600">Puertos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Label>Puerto Carga</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" value={form?.puertoCarga?.nombre || ''} onChange={(e) => onPuertoNombreChange('puertoCarga', e.target.value)} />
                {loadingSuggest.puertoCarga && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                {suggestions.puertosCarga?.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                    {suggestions.puertosCarga.map(p => (
                      <button type="button" key={p._id || p.id} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => onSelectPuerto('puertoCarga', p)}>
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Label>Puerto Descarga</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" value={form?.puertoDescarga?.nombre || ''} onChange={(e) => onPuertoNombreChange('puertoDescarga', e.target.value)} />
                {loadingSuggest.puertoDescarga && <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-8 text-muted-foreground" />}
                {suggestions.puertosDescarga?.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-sm max-h-52 overflow-auto">
                    {suggestions.puertosDescarga.map(p => (
                      <button type="button" key={p._id || p.id} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => onSelectPuerto('puertoDescarga', p)}>
                        {p.nombre}
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
