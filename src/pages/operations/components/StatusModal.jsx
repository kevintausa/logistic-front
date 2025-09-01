import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Circle,
  Clock,
  CircleDot,
  Truck,
  Package,
  AlertCircle,
  Info,
  Flag,
  MapPin,
  Ship,
  Plane,
  CalendarClock,
} from 'lucide-react';
import { createStatus, getStatusesByTracking } from '../Services/statuses.services';

const StatusModal = ({ isOpen, onClose, operation, onApprove, onReject }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
  const [icono, setIcono] = useState('CircleDot');
  const ICON_OPTIONS = useMemo(() => ([
    { key: 'CircleDot', label: 'Punto', Icon: CircleDot },
    { key: 'CheckCircle2', label: 'Completado', Icon: CheckCircle2 },
    { key: 'Truck', label: 'Transporte', Icon: Truck },
    { key: 'Package', label: 'Paquete', Icon: Package },
    { key: 'AlertCircle', label: 'Novedad', Icon: AlertCircle },
    { key: 'Info', label: 'Info', Icon: Info },
    { key: 'Flag', label: 'Hito', Icon: Flag },
    { key: 'MapPin', label: 'Ubicación', Icon: MapPin },
    { key: 'Ship', label: 'Barco', Icon: Ship },
    { key: 'Plane', label: 'Avión', Icon: Plane },
    { key: 'Clock', label: 'Tiempo', Icon: Clock },
    { key: 'CalendarClock', label: 'Agenda', Icon: CalendarClock },
  ]), []);

  const isEnCurso = useMemo(() => operation?.estado === 'En curso', [operation]);
  const numtraz = operation?.numTrazabilidad;

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !isEnCurso || !numtraz) return;
      setLoading(true);
      setError('');
      try {
        const resp = await getStatusesByTracking(numtraz);
        if (resp.code === 200) {
          setItems(Array.isArray(resp.data) ? resp.data : []);
        } else {
          setError(resp.message || 'No se pudo obtener estatus');
        }
      } catch (e) {
        setError(e.message || 'Error al obtener estatus');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, isEnCurso, numtraz]);

  const handleAdd = async () => {
    if (!titulo?.trim()) {
      setError('Título es requerido');
      return;
    }
    if (!numtraz) {
      setError('La operación no tiene número de trazabilidad');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        numtrazabilidad: numtraz,
        cliente: {
          id: operation?.cliente?.id || operation?.clienteId || '',
          nit: operation?.cliente?.nit || '',
          nombre: operation?.cliente?.nombre || operation?.clienteNombre || '',
        },
        operacion: {
          id: operation?._id,
          descripcion: operation?.descripcion || '',
        },
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || '',
        fecha: new Date(fecha).toISOString(),
        icono,
      };
      const resp = await createStatus(payload);
      if (resp.code === 201 || resp.code === 200) {
        // refresh
        const list = await getStatusesByTracking(numtraz);
        setItems(Array.isArray(list.data) ? list.data : []);
        setTitulo('');
        setDescripcion('');
        setFecha(new Date().toISOString().slice(0, 16));
        setIcono('CircleDot');
      } else {
        setError(resp.message || 'No se pudo crear el estatus');
      }
    } catch (e) {
      setError(e.message || 'Error al crear estatus');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-6xl xl:max-w-[90vw]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
        >
          <Card className="rounded-xl shadow-2xl border border-border/60">
            <CardHeader>
              <CardTitle>Estatus de la operación</CardTitle>
              <CardDescription>
                Operación {operation?.codigo || operation?._id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <XCircle className="h-5 w-5" />
              </button>
              <div className="max-h-[80vh] overflow-auto">
                <div className="space-y-4">
                  {!isEnCurso ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Registra el resultado de la oferta para continuar con la trazabilidad de la mercancía.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <Button onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobada la oferta
                        </Button>
                        <Button onClick={onReject} variant="destructive" className="bg-red-600 hover:bg-red-700">
                          <XCircle className="h-4 w-4 mr-2" /> Rechazada la oferta
                        </Button>
                      </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2">
                      <div className="text-sm text-muted-foreground">N° Trazabilidad</div>
                      <div className="font-medium">{numtraz || '—'}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5">
                        <div className="rounded border p-3">
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-sm">Título</label>
                              <input
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: Mercancía recogida"
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className="text-sm">Ícono</label>
                              <div className="mt-1 grid grid-cols-6 gap-2">
                                {ICON_OPTIONS.map(({ key, label, Icon }) => {
                                  const selected = icono === key;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => setIcono(key)}
                                      disabled={loading}
                                      className={`flex flex-col items-center justify-center rounded border px-2 py-2 hover:bg-accent hover:text-accent-foreground transition ${selected ? 'ring-2 ring-sky-500 bg-accent text-accent-foreground' : ''}`}
                                      title={label}
                                    >
                                      <Icon className="h-5 w-5" />
                                      <span className="mt-1 text-[10px] leading-none">{label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm">Fecha y hora</label>
                              <input
                                type="datetime-local"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className="text-sm">Descripción</label>
                              <textarea
                                rows={6}
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Detalle opcional del evento"
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button onClick={handleAdd} disabled={loading} className="bg-sky-600 hover:bg-sky-700">
                              <CircleDot className="h-4 w-4 mr-2" /> Agregar estatus
                            </Button>
                          </div>
                          {error ? (
                            <div className="mt-2 text-sm text-red-600">{error}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="md:col-span-5">
                        <div className="rounded border p-3 h-full">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">Línea de tiempo</div>
                          </div>
                          <div className="relative pl-5">
                            <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
                            <div className="space-y-4">
                              {loading && items.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Cargando…</div>
                              ) : (
                                items.map((it) => {
                                  const Icon = (() => {
                                    switch (it.icono) {
                                      case 'CircleDot': return CircleDot;
                                      case 'CheckCircle2': return CheckCircle2;
                                      case 'Truck': return Truck;
                                      case 'Package': return Package;
                                      case 'AlertCircle': return AlertCircle;
                                      case 'Info': return Info;
                                      case 'Flag': return Flag;
                                      case 'MapPin': return MapPin;
                                      case 'Ship': return Ship;
                                      case 'Plane': return Plane;
                                      case 'Clock': return Clock;
                                      case 'CalendarClock': return CalendarClock;
                                      default: return Circle;
                                    }
                                  })();
                                  return (
                                    <div key={it._id || it.fecha} className="relative">
                                      <div className="absolute left-0 top-0.5 bg-white">
                                        <Icon className="h-5 w-5 text-sky-600" />
                                      </div>
                                      <div className="ml-8">
                                        <div className="text-sm font-medium">{it.titulo}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(it.fecha).toLocaleString()}</div>
                                        {it.descripcion ? (
                                          <div className="mt-1 text-sm">{it.descripcion}</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              {(!loading && items.length === 0) ? (
                                <div className="text-sm text-muted-foreground">Sin estatus aún.</div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StatusModal;
