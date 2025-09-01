import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CalendarClock, CheckCircle2, Circle, CircleDot, Clock, Flag, Info, MapPin, Package, Plane, Ship, Truck } from 'lucide-react';
import { getPublicStatuses } from '@/services/tracking.services';

const ICON_MAP = {
  CircleDot,
  CheckCircle2,
  Truck,
  Package,
  AlertCircle,
  Info,
  Flag,
  MapPin,
  Ship,
  Plane,
  Clock,
  CalendarClock,
};

function Tracking() {
  const [numtrazabilidad, setNumtrazabilidad] = useState('');
  const [nit, setNit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Prefill from URL and auto-query when both params are present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const ntr = sp.get('numtrazabilidad') || sp.get('numTrazabilidad') || '';
    const nitParam = sp.get('nit') || '';
    if (ntr) setNumtrazabilidad(ntr);
    if (nitParam) setNit(nitParam);
    if (ntr && nitParam) {
      (async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
          const resp = await getPublicStatuses(ntr.trim(), nitParam.trim());
          if (resp.code === 200) {
            setResult(resp.data);
          } else {
            setError(resp.message || 'No se encontró información');
          }
        } catch (err) {
          setError(err.message || 'Error al consultar');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!numtrazabilidad.trim() || !nit.trim()) {
      setError('Ingrese N° de trazabilidad y NIT');
      return;
    }
    try {
      setLoading(true);
      const resp = await getPublicStatuses(numtrazabilidad.trim(), nit.trim());
      if (resp.code === 200) {
        setResult(resp.data);
      } else {
        setError(resp.message || 'No se encontró información');
      }
    } catch (err) {
      setError(err.message || 'Error al consultar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-10 px-4">
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle>Consulta de Trazabilidad</CardTitle>
          <CardDescription>Ingrese el N° de trazabilidad y el NIT del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <Label className="text-sm">N° de trazabilidad</Label>
              <Input value={numtrazabilidad} onChange={(e) => setNumtrazabilidad(e.target.value)} placeholder="Ej: TRZ-001234" />
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm">NIT</Label>
              <Input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="Ej: 900123456" />
            </div>
            <div className="md:col-span-3 flex items-end">
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                {loading ? 'Consultando…' : 'Consultar'}
              </Button>
            </div>
          </form>
          {error ? (
            <div className="mt-3 text-sm text-red-600">{error}</div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <Card className="mt-6 border border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Resultado</CardTitle>
            <CardDescription>
              Operación {result?.operacion?.descripcion || result?.operacion?.id || '—'} • Cliente {result?.cliente?.nombre || '—'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-5">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {(result?.estatus || []).map((it) => {
                  const Icon = ICON_MAP[it.icono] || Circle;
                  return (
                    <div key={it._id || it.fecha} className="relative">
                      <div className="absolute -left-2 top-1.5 bg-background rounded-full p-0.5">
                        <Icon className="h-4 w-4 text-sky-600" />
                      </div>
                      <div className="ml-5">
                        <div className="text-sm font-medium">{it.titulo}</div>
                        <div className="text-xs text-muted-foreground">{new Date(it.fecha).toLocaleString()}</div>
                        {it.descripcion ? (
                          <div className="mt-1 text-sm">{it.descripcion}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {result?.estatus?.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin estatus aún.</div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default Tracking;
