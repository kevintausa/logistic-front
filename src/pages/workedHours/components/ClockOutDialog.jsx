import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { clockOut } from '../services/workedHours.services';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';

const formatTime = (date) => {
  return date.toTimeString().slice(0, 5);
};

const ClockOutDialog = ({ record, isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
    const [adjustedTime, setAdjustedTime] = useState('');
  const [totalHours, setTotalHours] = useState('0.00');
  const [imgSrc, setImgSrc] = useState(null);
  const webcamRef = React.useRef(null);

  useEffect(() => {
    if (isOpen && record) {
      // Hora exacta actual (sin redondeo)
      setAdjustedTime(formatTime(new Date()));
      setImgSrc(null);
    }
  }, [isOpen, record]);

  useEffect(() => {
    if (!record || !record.horaIngreso || !adjustedTime) {
      setTotalHours('0.00');
      return;
    }

    try {
      // Calcular diferencia usando solo HH:mm para evitar problemas de zona horaria
      const [inH, inM] = record.horaIngreso.split(':').map(Number);
      const [outH, outM] = adjustedTime.split(':').map(Number);
      if (
        [inH, inM, outH, outM].some((v) => Number.isNaN(v) || v == null)
      ) {
        setTotalHours('0.00');
        return;
      }

      let inTotal = inH * 60 + inM;
      let outTotal = outH * 60 + outM;
      // Si la salida es menor que la entrada, se asume cruce de medianoche (+24h)
      if (outTotal < inTotal) outTotal += 24 * 60;

      const diffMinutes = Math.max(0, outTotal - inTotal);
      const hours = (diffMinutes / 60).toFixed(2);
      setTotalHours(hours);
    } catch (error) {
      console.error('Error calculating total hours:', error);
      setTotalHours('0.00');
    }
  }, [record, adjustedTime]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!imgSrc) {
        toast({ variant: 'destructive', title: 'Por favor, tome una foto como evidencia de salida.' });
        setIsLoading(false);
        return;
      }

      // Fecha local en formato YYYY-MM-DD para que el backend pueda reconstruir hora local correctamente
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const fechaSalidaLocal = `${yyyy}-${mm}-${dd}`;
      const timezoneOffset = new Date().getTimezoneOffset(); // minutos respecto a UTC

      await clockOut(record._id, { 
        horaSalida: adjustedTime, 
        totalHorasTrabajadas: parseFloat(totalHours),
        foto: imgSrc,
        fotoSalida: imgSrc,
        fechaSalidaLocal,
        timezoneOffset,
      });
      toast({ title: 'Salida registrada con éxito.' });
      // Notificar éxito al padre; el padre decide cerrar y/o recargar
      onSuccess && onSuccess();
    } catch (error) {
      console.error('ClockOut error payload:', error);
      const backendMsg = error?.message || error?.msg || error?.error || error?.detail || (Array.isArray(error?.errors) ? error.errors.map(e => e.msg || e.message).join(', ') : null);
      toast({ variant: 'destructive', title: backendMsg || 'No pudimos registrar la salida. Por favor inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Registrar Hora de Salida</DialogTitle>
          <DialogDescription>
            Confirma la hora de salida para {record?.empleado?.nombre || 'Empleado'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-2 rounded-md border bg-background">
              <p className="text-sm font-semibold">Hora de Entrada: {record.horaIngreso}</p>
            </div>
            <div className="p-2 rounded-md border bg-background">
              <p className="text-sm font-semibold">Hora de Salida: {adjustedTime}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">Evidencia Fotográfica (Salida)</p>
            <div className="w-full max-w-[520px] aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
              {imgSrc ? (
                <img src={imgSrc} alt="webcam" className="w-full h-full object-cover" />
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.6}
                  videoConstraints={{ width: 640, height: 360, facingMode: 'user' }}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
          <div className="p-1 bg-primary/20 rounded-lg text-center">
            <p className="text-sm text-white-foreground">Total de Horas a Registrar</p>
            <p className="text-lg font-bold text-primary text-center">{totalHours}</p>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t mt-auto gap-1">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          {imgSrc ? (
            <Button
              onClick={() => setImgSrc(null)}
              variant="secondary"
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retomar foto
            </Button>
          ) : (
            <Button
              onClick={() => {
                const shot = webcamRef.current?.getScreenshot?.();
                if (shot) setImgSrc(shot);
                else toast({ variant: 'destructive', title: 'No se pudo capturar la imagen. Verifique permisos de cámara.' });
              }}
              variant="secondary"
              disabled={isLoading}
            >
              <Camera className="mr-2 h-4 w-4" /> Tomar foto
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Confirmar Salida'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClockOutDialog;
