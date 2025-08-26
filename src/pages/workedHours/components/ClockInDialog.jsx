import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, RefreshCw, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getEmployeeByCedula, saveClockInRecord } from '../services/workedHours.services';

const ClockInDialog = ({ idLavanderia, onClockIn }) => {
  const [open, setOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [foundEmployee, setFoundEmployee] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [calculatedTime, setCalculatedTime] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const webcamRef = useRef(null);
  const { toast } = useToast();

  const resetForm = () => {
    setCedula('');
    setFoundEmployee(null);
    setImgSrc(null);
    setError('');
    setIsSearching(false);
    setIsSaving(false);
  };

  const formatTime = (date) => date.toTimeString().slice(0, 5);

  useEffect(() => {
    if (open) {
      resetForm();
      // Hora exacta actual (sin redondeo)
      setCalculatedTime(formatTime(new Date()));
    }
  }, [open]);

  const handleSearch = async () => {
    if (!cedula) {
      setError('Por favor, ingrese una cédula.');
      return;
    }
    setIsSearching(true);
    setError('');
    setFoundEmployee(null);
    try {
      const response = await getEmployeeByCedula(cedula);
      if (response.state) {
        setFoundEmployee(response.data);
      } else {
        setError(response.message || 'Empleado no encontrado.');
        toast({
          title: 'Error de Búsqueda',
          description: response.message || 'No se pudo encontrar al empleado con esa cédula.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError('Error al buscar el empleado.');
      console.error('Error searching employee:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  // Eliminado redondeo: ahora usamos hora exacta (HH:mm)

  const handleRetake = () => {
    setImgSrc(null);
  };

  const handleSubmit = async () => {
    if (!foundEmployee || !imgSrc) {
      setError('Por favor, busque un empleado y tome una foto.');
      return;
    }

    const laundryData = JSON.parse(localStorage.getItem('laundry'));

    const nowHHmm = formatTime(new Date()); // asegurar hora exacta al momento de guardar
    const record = {
      fecha: new Date(),
      horaIngreso: nowHHmm,
      lavanderia: {
        id: idLavanderia,
        nombre: laundryData?.nombre || 'N/A',
      },
      empleado: {
        id: foundEmployee._id,
        nombre: foundEmployee.nombre + ' ' + foundEmployee.apellido,
        cedula: foundEmployee.cedula,
      },
      salario: foundEmployee.salario,
      horaSalida: null,
      totalHorasTrabajadas: null,
      isAprobado: false,
      foto: imgSrc, // Base64 de la imagen
    };

    setIsSaving(true);
    setError('');

    try {
      await saveClockInRecord(record);
      toast({
        title: 'Éxito',
        description: 'Se ha registrado la llegada del empleado.',
      });
      if (onClockIn) onClockIn();
      setOpen(false);
    } catch (err) {
      setError('Error al guardar el registro. Por favor, inténtelo de nuevo.');
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro de llegada.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Registrar Llegada</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="w-full flex items-center gap-4">
          <DialogTitle>Registrar Hora de Llegada</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          <div className="flex w-[350px] items-center gap-2">
            <Input
              id="cedula"
              className="flex-1"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ingrese la cédula del empleado"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching} size="icon" variant="outline">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {foundEmployee && (
            <div className="bg-primary/10 border-l-4 border-primary p-3 col-span-4">
              <p className="font-semibold">Empleado Encontrado:</p>
              <p>{foundEmployee.nombre + ' ' + foundEmployee.apellido}</p>
              <p className="text-sm text-muted-foreground">Lavandería: {foundEmployee.lavanderia?.nombre || 'N/A'} </p>
            </div>
          )}

          <div className="flex flex-col items-center col-span-4 gap-2">
            <Label>Evidencia Fotográfica</Label>
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
                  className="w-full h-full "
                />
              )}
            </div>

            <Label>Hora de Registro</Label>
            <div className="mt-1 text-center flex items-center gap-4">

              <p className="text-2xl font-bold text-primary">{calculatedTime}</p>
              {imgSrc ? (
                <Button onClick={handleRetake} size="icon" className=" z-10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={capture} size="icon" className="  z-10">
                  <Camera className="h-4 w-4" />
                </Button>
              )}

            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!foundEmployee || !imgSrc || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClockInDialog;
