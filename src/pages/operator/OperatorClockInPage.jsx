import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Camera, Loader2, RefreshCw, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getEmployeeByCedula, saveClockInRecord, fetchWorkedHours } from '@/pages/workedHours/services/workedHours.services';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ClockOutDialog from '@/pages/workedHours/components/ClockOutDialog';

// Página independiente: Registrar Llegada del operario (usa cédula del usuario autenticado por defecto)
const OperatorClockInPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const passedCedula = location?.state?.cedula || null;
  const passedNombre = location?.state?.nombre || null;
  const { toast } = useToast();

  const [foundEmployee, setFoundEmployee] = useState(null);
  const [isSearching, setIsSearching] = useState(true);
  const [imgSrc, setImgSrc] = useState(null);
  const [calculatedTime, setCalculatedTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [postRecord, setPostRecord] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [clockOutRecord, setClockOutRecord] = useState(null);
  const webcamRef = useRef(null);

  const getUserCedula = () => {
    return (
      passedCedula ||
      user?.raw?.cedula ||
      user?.raw?.empleado?.cedula ||
      user?.cedula ||
      null
    );
  };

  const formatTime = (date) => date.toTimeString().slice(0, 5);

  const loadEmployee = useCallback(async () => {
    const cedula = getUserCedula();
    if (!cedula) {
      setIsSearching(false);
      setError('No se encontró cédula en el usuario autenticado.');
      toast({
        title: 'Datos incompletos',
        description: 'No se pudo obtener la cédula desde tu perfil.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsSearching(true);
      const response = await getEmployeeByCedula(cedula);
      if (response.state) {
        setFoundEmployee(response.data);
      } else {
        setError(response.message || 'Empleado no encontrado.');
        toast({ title: 'Error', description: response.message || 'No se encontró tu registro de empleado.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error loading employee by cedula:', err);
      setError('Error al buscar el empleado.');
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  useEffect(() => {
    setCalculatedTime(formatTime(new Date())); // hora exacta sin redondeo
    loadEmployee();
  }, [loadEmployee]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, []);

  const handleRetake = () => setImgSrc(null);

  const handleSubmit = async () => {
    if (!foundEmployee || !imgSrc) {
      setError('Debe existir un empleado válido y una foto.');
      return;
    }

    const lavanderiaObj = user?.lavanderia || {};

    const nowHHmm = formatTime(new Date()); // asegurar hora exacta al momento de guardar
    const record = {
      fecha: new Date(),
      horaIngreso: nowHHmm,
      lavanderia: {
        id: lavanderiaObj?.id || lavanderiaObj?._id || lavanderiaObj?.codigo || undefined,
        nombre: lavanderiaObj?.nombre || 'N/A',
      },
      empleado: {
        id: foundEmployee._id,
        nombre: `${foundEmployee.nombre} ${foundEmployee.apellido}`.trim(),
        cedula: foundEmployee.cedula,
      },
      salario: foundEmployee.salario,
      horaSalida: null,
      totalHorasTrabajadas: null,
      isAprobado: false,
      foto: imgSrc,
    };

    setIsSaving(true);
    setError('');
    try {
      await saveClockInRecord(record);
      toast({ title: 'Éxito', description: 'Se ha registrado tu llegada.' });
      // Reset para otra captura opcional
      setImgSrc(null);
      setCalculatedTime(formatTime(new Date())); // refrescar hora exacta
      setPostRecord({
        empleadoNombre: `${foundEmployee.nombre} ${foundEmployee.apellido}`.trim(),
        cedula: foundEmployee.cedula,
        horaIngreso: record.horaIngreso,
        fecha: record.fecha,
        lavanderiaNombre: record.lavanderia?.nombre || 'N/A',
        foto: record.foto,
      });
      // Refrescar registros recientes
      fetchRecentRecords();
    } catch (err) {
      console.error('Error saving clock-in:', err);
      setError('No se pudo registrar la llegada.');
      toast({ title: 'Error', description: 'No se pudo guardar el registro de llegada.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRecentRecords = useCallback(async () => {
    if (!foundEmployee) return;
    try {
      setLoadingRecent(true);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const lavanderiaObj = user?.lavanderia || {};
      const lavanderiaId = lavanderiaObj?.id || lavanderiaObj?._id || lavanderiaObj?.codigo;

      const query = {
        ...(lavanderiaId ? { "lavanderia.id": lavanderiaId } : {}),
        "empleado.cedula": foundEmployee.cedula,
        fecha: { $gte: start, $lte: end },
      };

      const resp = await fetchWorkedHours({ limit: 10, page: 1, query });
      const list = resp?.data || resp?.data?.data || resp?.data || [];
      const items = Array.isArray(resp?.data) ? resp.data : (resp?.data?.data || []);
      const finalList = Array.isArray(items) ? items : Array.isArray(list) ? list : [];
      // Ordenar por fecha descendente
      finalList.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setRecentRecords(finalList);
    } catch (e) {
      console.error('Error fetching recent records:', e);
      setRecentRecords([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [foundEmployee, user]);

  useEffect(() => {
    if (foundEmployee) fetchRecentRecords();
  }, [foundEmployee, fetchRecentRecords]);

  const hasOpenRecord = recentRecords?.some?.(r => r.horaIngreso && !r.horaSalida);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-2">
        <Button asChild variant="outline">
          <Link to="/operario-dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold">Registrar Llegada (Movil)</h1>
      <p className="text-muted-foreground">Captura una foto como evidencia y registra tu hora de llegada.</p>
      <p className="text-sm text-muted-foreground">
        {foundEmployee
          ? `${foundEmployee.nombre} ${foundEmployee.apellido || ''} • Cédula ${foundEmployee.cedula}`.trim()
          : (passedNombre && passedCedula ? `${passedNombre} • Cédula ${passedCedula}` : '')}
      </p>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Empleado</CardTitle>
          </div>
          <CardDescription>
            {isSearching ? 'Buscando tus datos...' : (foundEmployee ? `${foundEmployee.nombre} ${foundEmployee.apellido} • Cédula ${foundEmployee.cedula}` : 'No encontrado')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Label>Evidencia Fotográfica</Label>
            <div className="w-full max-w-[640px] aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
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

            <Label>Hora de Registro</Label>
            <div className="mt-1 text-center flex items-center gap-4">
              <p className="text-2xl font-bold text-primary">{calculatedTime}</p>
              {imgSrc ? (
                <Button onClick={handleRetake} size="icon" className="z-10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={capture} size="icon" className="z-10">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          {hasOpenRecord && (
            <p className="text-amber-600 text-sm text-center mt-1">Ya tienes una entrada activa sin salida. Registra tu salida antes de crear una nueva entrada.</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSaving || !foundEmployee || !imgSrc || hasOpenRecord}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {postRecord && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Llegada registrada</CardTitle>
            <CardDescription>
              {postRecord.empleadoNombre} • Cédula {postRecord.cedula}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-64 aspect-video bg-muted rounded-md overflow-hidden">
                {postRecord.foto && (
                  <img src={postRecord.foto} alt="captura" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-sm">
                <p><span className="font-medium">Fecha:</span> {new Date(postRecord.fecha).toLocaleDateString()}</p>
                <p><span className="font-medium">Hora de ingreso:</span> {postRecord.horaIngreso}</p>
                <p><span className="font-medium">Lavandería:</span> {postRecord.lavanderiaNombre}</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={async () => {
                  // Intentar abrir el modal directamente con el registro abierto más reciente
                  let openRec = recentRecords.find(r => r.horaIngreso && !r.horaSalida);
                  if (!openRec) {
                    const refreshed = await fetchRecentRecords();
                    openRec = (Array.isArray(refreshed) ? refreshed : []).find(r => r.horaIngreso && !r.horaSalida);
                  }
                  if (openRec) {
                    setClockOutRecord(openRec);
                  } else {
                    // Si no hay registro abierto aún en memoria, como fallback ir a Mis Registros
                    navigate('/operario/registros');
                  }
                }}
              >
                Registrar salida
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mis registros (últimos 2 días)</CardTitle>
          <CardDescription>Incluye registros que cruzan de día.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : recentRecords.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay registros recientes.</div>
          ) : (
            <div className="space-y-2">
              {recentRecords.map((r) => (
                <div key={r._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded border p-3">
                  <div className="text-sm">
                    <p className="font-medium">{new Date(r.fecha).toLocaleDateString()} • {r.empleado?.nombre || foundEmployee?.nombre} {r.empleado?.apellido || foundEmployee?.apellido}</p>
                    <p className="text-muted-foreground">Ingreso: {r.horaIngreso || '-'} {r.horaSalida ? `• Salida: ${r.horaSalida}` : '• Salida: Pendiente'}</p>
                  </div>
                  {!r.horaSalida && (
                    <Button size="sm" onClick={() => setClockOutRecord(r)}>Registrar salida</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClockOutDialog
        isOpen={!!clockOutRecord}
        record={clockOutRecord}
        onClose={() => setClockOutRecord(null)}
        onSuccess={() => {
          // Cerrar modal y recargar la página solo cuando backend confirma éxito
          setClockOutRecord(null);
          window.location.reload();
        }}
      />
    </div>
  );
};

export default OperatorClockInPage;
