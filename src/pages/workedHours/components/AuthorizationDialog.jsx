import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { updateWorkedHours } from '../services/workedHours.services';

const AuthorizationDialog = ({ isOpen, onClose, record, onSuccess }) => {
  const [totalHours, setTotalHours] = useState(0);
  const [hasLunch, setHasLunch] = useState(false);
  const [authIngreso, setAuthIngreso] = useState('');
  const [authSalida, setAuthSalida] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const normalizeTimeHHMM = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return '';
    const [h, m] = hhmm.split(':');
    const hh = String(parseInt(h || '0', 10)).padStart(2, '0');
    const mm = String(parseInt(m || '0', 10)).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatToAmPm = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return '';
    const [h, m] = hhmm.split(':').map((n) => parseInt(n || '0', 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return '';
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const hh12 = String(hour12).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh12}:${mm} ${period}`;
  };

  const timeToMinutes = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const [hh, mm] = hhmm.split(':').map((n) => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const computeTotal = (ingreso, salida, lunch) => {
    const mi = timeToMinutes(ingreso);
    const ms = timeToMinutes(salida);
    if (mi == null || ms == null) return 0;
    let diff = ms - mi;
    if (diff < 0) diff += 24 * 60; // cruza medianoche
    let hours = diff / 60;
    if (lunch) hours = Math.max(0, hours - 1);
    // mantener 2 decimales sin redondeos agresivos
    return Math.round(hours * 100) / 100;
  };

  useEffect(() => {
    if (record) {
      const initialHours = record.totalHorasTrabajadas || 0;
      const lunchTaken = true; // marcado por defecto
      setHasLunch(lunchTaken);
      // Prefill horas autorizadas con las originales (formato 24h HH:mm)
      const hi = normalizeTimeHHMM(record.horaIngreso || '');
      const hs = normalizeTimeHHMM(record.horaSalida || '');
      setAuthIngreso(hi);
      setAuthSalida(hs);
      const computed = computeTotal(hi, hs, lunchTaken);
      setTotalHours(computed);
    } else {
      setTotalHours(0);
      setHasLunch(false);
      setAuthIngreso('');
      setAuthSalida('');
    }
  }, [record]);

  const handleLunchChange = (checked) => {
    setHasLunch(checked);
    const computed = computeTotal(authIngreso, authSalida, checked);
    setTotalHours(computed);
  };

  const handleAuthorize = async () => {
    if (!record) return;

    setIsLoading(true);
    try {
      const updatedData = {
        totalHorasAutorizadas: totalHours,
        almuerzo: hasLunch,
        horaIngresoAutorizada: authIngreso,
        horaSalidaAutorizada: authSalida,
        isAprobado: true,
      };

      await updateWorkedHours(record._id, updatedData);

      toast({
        title: 'Horas Autorizadas',
        description: `Las horas de ${record?.empleado?.nombre || 'Empleado'} han sido autorizadas con éxito.`,
      });
      onSuccess();
    } catch (error) {
      console.error('Error authorizing hours:', error);
      toast({
        title: 'Error al autorizar',
        description: 'No se pudo actualizar el registro. Inténtelo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Autorizar Horas Trabajadas</DialogTitle>
          <DialogDescription>
            Revisa y ajusta las horas para {record?.empleado?.nombre || 'Empleado'} del día {record?.fecha ? new Date(record.fecha).toLocaleDateString() : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Fila: originales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Hora de Ingreso</Label>
              <Input value={formatToAmPm(record?.horaIngreso || '')} readOnly />
            </div>
            <div>
              <Label>Hora de Salida</Label>
              <Input value={formatToAmPm(record?.horaSalida || '')} readOnly />
            </div>
            <div>
              <Label>Total Horas Original</Label>
              <Input value={(record?.totalHorasTrabajadas ?? 0).toFixed(2)} readOnly />
            </div>
          </div>
          {/* Fila: autorizadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Hora de Ingreso (autorizada)</Label>
              <Input
                type="time"
                value={authIngreso}
                onChange={(e) => {
                  const v = normalizeTimeHHMM(e.target.value);
                  setAuthIngreso(v);
                  setTotalHours(computeTotal(v, authSalida, hasLunch));
                }}
              />
              <div className="text-xs text-muted-foreground mt-1">{formatToAmPm(authIngreso)}</div>
            </div>
            <div>
              <Label>Hora de Salida (autorizada)</Label>
              <Input
                type="time"
                value={authSalida}
                onChange={(e) => {
                  const v = normalizeTimeHHMM(e.target.value);
                  setAuthSalida(v);
                  setTotalHours(computeTotal(authIngreso, v, hasLunch));
                }}
              />
              <div className="text-xs text-muted-foreground mt-1">{formatToAmPm(authSalida)}</div>
            </div>
            <div>
              <Label>Total Horas a Aprobar</Label>
              <Input value={totalHours.toFixed(2)} readOnly />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="lunch" checked={hasLunch} onCheckedChange={handleLunchChange} />
            <Label htmlFor="lunch">¿Tuvo 1 hora de almuerzo? (se restará del total)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleAuthorize} disabled={isLoading}>
            {isLoading ? 'Autorizando...' : 'Autorizar y Finalizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorizationDialog;
