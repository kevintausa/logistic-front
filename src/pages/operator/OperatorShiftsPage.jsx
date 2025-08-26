import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getWeeklyOverview, getEmployeeWeeklyOverview } from '@/pages/shiftManagement/services/shifts.services';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Página: Mis Turnos (Operario) con Resumen semanal
const OperatorShiftsPage = () => {
  const { idLavanderia } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  // Datos del operario proporcionados por OperatorDashboard (state) o por query params; fallback: usuario autenticado
  const stateOpName = location.state?.operatorName || location.state?.name || '';
  const stateOpCedula = location.state?.operatorCedula || location.state?.cedula || '';
  const url = new URL(window.location.href);
  const qpName = url.searchParams.get('name') || '';
  const qpCed = url.searchParams.get('cedula') || '';
  const userCed = user?.raw?.cedula || user?.raw?.empleado?.cedula || user?.cedula || '';
  const userName = user?.raw?.empleado
    ? `${user.raw.empleado.nombre || ''} ${user.raw.empleado.apellido || ''}`.trim()
    : (user?.raw?.nombre || user?.nombre || '');
  const operatorName = (stateOpName || qpName || userName || '').trim();
  const operatorCedula = (stateOpCedula || qpCed || userCed || '').trim();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekStartStr = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const weekEndStr = useMemo(() => format(weekEnd, 'yyyy-MM-dd'), [weekEnd]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Fallbacks adicionales desde overview
  const overviewEmployee = overview?.empleado || overview?.employee || null;
  const displayName = useMemo(() => {
    const ovName = overviewEmployee ? `${overviewEmployee?.nombre || ''} ${overviewEmployee?.apellido || ''}`.trim() : '';
    return (operatorName || ovName || userName || '—').trim();
  }, [operatorName, overviewEmployee, userName]);
  const displayCedula = useMemo(() => {
    const ovCed = overviewEmployee?.cedula || '';
    return (operatorCedula || ovCed || userCed || '—').trim();
  }, [operatorCedula, overviewEmployee, userCed]);

  const loadOverview = useCallback(async () => {
    const lavanderiaIdToUse = idLavanderia || user?.lavanderia?.id || user?.lavanderia?._id || user?.lavanderia?.codigo || '';
    if (!lavanderiaIdToUse) { setOverview(null); return; }
    try {
      setLoading(true);
      setError('');
      // Armar filtro de operador/empleado solo con campos disponibles
      const operatorFilter = {};
      if (operatorName) operatorFilter.nombre = operatorName;
      if (operatorCedula) operatorFilter.cedula = operatorCedula;
      const employeeId = user?.raw?.empleado?.id || user?.raw?.empleado?._id || user?.empleadoId || null;

      // Si tenemos identificador directo del empleado (id o cédula), usar endpoint específico
      let res;
      if (employeeId || operatorCedula) {
        res = await getEmployeeWeeklyOverview({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          lavanderiaId: lavanderiaIdToUse,
          employeeId: employeeId || undefined,
          cedula: operatorCedula || undefined,
          nombre: operatorName || undefined,
        });
      } else {
        res = await getWeeklyOverview({
          lavanderiaId: lavanderiaIdToUse,
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          // Filtros opcionales para que el backend limite al empleado objetivo
          ...(Object.keys(operatorFilter).length > 0 ? { operator: operatorFilter } : {}),
          ...(employeeId ? { employeeId } : {}),
          onlyEmployee: true,
        });
      }
      // Normalizar payload según estructura de semanas planificadas
      const normalize = (payload) => {
        if (!payload || typeof payload !== 'object') return null;
        // Caso 0: respuesta directa por empleado (nuevo endpoint employee-weekly-overview)
        if (Array.isArray(payload.perDay)) {
          const empleado = payload.empleado || null;
          const pd = payload.perDay || [];
          const perDay = pd.map((d) => ({
            date: d.date,
            totalHours: Number(d.totalHours || 0),
            extraHours: Number(d.overtimeHours || 0),
            lunch: d.lunch
              ? { start: d.lunch.start || '—', end: d.lunch.end || '—' }
              : null,
            blocks: Array.isArray(d.blocks)
              ? d.blocks.map((b) => ({
                  start: b.start,
                  end: b.end,
                  hours: Number(b.hours || 0),
                  type: 'base',
                }))
              : [],
          }));
          const weeklyBase = Number(payload.weeklyBase || 0);
          const weeklyExtra = Number(payload.weeklyExtra || 0);
          const weeklyTotal = Number(payload.weeklyTotal || weeklyBase + weeklyExtra);
          return { empleado, perDay, weeklyBase, weeklyExtra, weeklyTotal };
        }
        // Caso 1: backend retorna un overview agrupado con employees[] (como en la vista previa)
        if (Array.isArray(payload.employees)) {
          const list = payload.employees;
          const matchByCed = (it) => it?.empleado?.cedula && operatorCedula && String(it.empleado.cedula) === String(operatorCedula);
          const matchByName = (it) => it?.empleado?.nombre && operatorName && String(it.empleado.nombre).toLowerCase() === String(operatorName).toLowerCase();
          const target = list.find(matchByCed) || list.find(matchByName) || list[0] || null;
          if (!target) return null;

          const empleado = target.empleado || null;
          const pd = Array.isArray(target.perDay) ? target.perDay : [];
          const perDay = pd.map(d => ({
            date: d.date,
            totalHours: Number(d.totalHours || 0),
            extraHours: Number(d.overtimeHours || 0),
            lunch: d.lunch ? { start: d.lunch.start || '—', end: d.lunch.end || '—' } : null,
            blocks: Array.isArray(d.blocks) ? d.blocks.map(b => ({
              start: b.start,
              end: b.end,
              hours: Number(b.hours || 0),
              type: 'base',
            })) : [],
          }));
          const weeklyTotal = Number(target.weeklyTotal || 0);
          const weeklyExtra = Number(target.weeklyOvertime || 0);
          const weeklyBase = weeklyTotal - weeklyExtra;
          return { empleado, perDay, weeklyBase, weeklyExtra, weeklyTotal };
        }

        const empleado = payload.empleado || payload.employee || null;
        const dias = Array.isArray(payload.dias) ? payload.dias : [];
        const overtimeMap = payload.overtimeHours || {};
        const lunchMap = payload.lunchHours || {};
        const shiftsMap = payload.shifts || {};

        // Helper: diferencia en horas entre HH:mm
        const diffHours = (startHM, endHM) => {
          if (!startHM || !endHM) return 0;
          const [sh, sm] = startHM.split(':').map(n => parseInt(n, 10));
          const [eh, em] = endHM.split(':').map(n => parseInt(n, 10));
          const start = sh * 60 + (sm || 0);
          const end = eh * 60 + (em || 0);
          return Math.max(0, (end - start) / 60);
        };

        // Helper: convertir slot index (0..47) a HH:mm
        const slotToHM = (slotIdx) => {
          const hour = Math.floor(slotIdx / 2);
          const min = (slotIdx % 2) * 30;
          const hh = String(hour).padStart(2, '0');
          const mm = String(min).padStart(2, '0');
          return `${hh}:${mm}`;
        };

        // Construir perDay desde los 7 días de la semana actual
        const perDay = weekDays.map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayInfo = dias.find(x => x.fecha === dateStr) || null;
          const ot = Number(overtimeMap[dateStr] || 0);
          let start = null;
          let end = null;
          let baseHours = 0;
          const blocks = [];

          if (dayInfo) {
            start = dayInfo.horaInicio;
            end = dayInfo.horaFin;
            baseHours = diffHours(start, end);
            if (baseHours > 0) blocks.push({ start, end, hours: baseHours, type: 'base' });
          } else {
            // Fallback: derivar desde shifts[dateStr] (slots de 30min)
            const slots = Array.isArray(shiftsMap[dateStr]) ? shiftsMap[dateStr] : [];
            if (slots.length > 0) {
              const minSlot = Math.min(...slots);
              const maxSlot = Math.max(...slots);
              start = slotToHM(minSlot);
              // maxSlot es inclusivo; el fin es (maxSlot+1)
              end = slotToHM(maxSlot + 1);
              baseHours = slots.length * 0.5;
              blocks.push({ start, end, hours: baseHours, type: 'base' });
            }
          }

          if (ot > 0) {
            blocks.push({ start: end || '—', end: end || '—', hours: ot, type: 'extra' });
          }

          // Lunch desde mapa si existe
          let lunch = null;
          const lunchInfo = lunchMap[dateStr];
          if (lunchInfo && (lunchInfo.start || lunchInfo.end)) {
            lunch = { start: lunchInfo.start || '—', end: lunchInfo.end || '—' };
          } else if (dayInfo?.tieneAlmuerzo) {
            lunch = { start: null, end: null };
          }

          return { date: dateStr, totalHours: baseHours || 0, extraHours: ot, blocks, lunch };
        });

        const weeklyBase = perDay.reduce((acc, d) => acc + (Number(d.totalHours) || 0), 0);
        const weeklyExtra = perDay.reduce((acc, d) => acc + (Number(d.extraHours) || 0), 0);
        const weeklyTotal = weeklyBase + weeklyExtra;

        return { empleado, perDay, weeklyBase, weeklyExtra, weeklyTotal };
      };

      const normalized = normalize(res);
      setOverview(normalized || res);
    } catch (err) {
      const msg = err?.message || err?.error || 'No se pudo cargar el resumen semanal';
      setError(msg);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [idLavanderia, user, weekStartStr, weekEndStr, operatorName, operatorCedula]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const weeklyBase = overview?.weeklyBase ?? overview?.weeklyTotal ?? 0;
  const weeklyExtra = overview?.weeklyExtra ?? 0;
  const weeklyTotal = overview?.weeklyTotal ?? (weeklyBase + weeklyExtra);
  const perDay = overview?.perDay ?? [];

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-2">
        <Button asChild variant="outline">
          <Link to="/operario-dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold">Mis Turnos</h1>
      <p className="text-muted-foreground">Revisa el resumen semanal planificado por tu supervisor.</p>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <CardTitle>Resumen semanal</CardTitle>
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8"
                onClick={handlePrevWeek}
                disabled={loading}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="flex-1 text-center sm:flex-none font-semibold text-muted-foreground text-sm md:text-base">
                {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM, yyyy', { locale: es })}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8"
                onClick={handleNextWeek}
                disabled={loading}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Operario: <span className="font-semibold text-foreground">{displayName}</span>{' '}
            {displayCedula ? `• Cédula: ${displayCedula}` : ''}
          </div>
        </CardHeader>
        <CardContent>
          {!idLavanderia && (
            <div className="text-sm text-muted-foreground">No se encontró el centro de lavado en la ruta.</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <div className="text-sm text-muted-foreground mb-3">
            <span className="mr-3"><span className="font-bold">Base:</span> <span className="font-semibold text-foreground">{weeklyBase} h</span></span>
            <span className="mr-3"><span className="font-bold">Extra:</span> <span className="font-semibold text-foreground">{weeklyExtra} h</span></span>
            <span><span className="font-bold">Total:</span> <span className="font-semibold text-foreground">{weeklyTotal} h</span></span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Cargando…</div>
            ) : (
              perDay.map((d) => (
                <div key={d.date} className="border rounded-md p-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>
                      {d.date} ({format(parseISO(d.date), 'EEEE', { locale: es })})
                    </span>
                    <span>{d.totalHours ?? 0} h</span>
                  </div>
                  {d.lunch && (
                    <div className="text-xs text-muted-foreground mt-1">Almuerzo: {d.lunch.start} - {d.lunch.end}</div>
                  )}
                  {d.extraHours > 0 && (
                    <div className="text-xs text-amber-600 mt-0.5">Extra: {d.extraHours} h</div>
                  )}
                  <ul className="mt-2 space-y-1">
                    {d.blocks?.length ? d.blocks.map((b, idx) => (
                      <li key={idx} className="text-xs">
                        Bloque {idx+1}: {b.start} - {b.end} ({b.hours} h){b.type==='extra' ? ' Extras' : ''}
                      </li>
                    )) : (
                      <li className="text-xs text-muted-foreground">Sin bloques</li>
                    )}
                  </ul>
                </div>
              ))
            )}
            {!loading && perDay.length === 0 && (
              <div className="text-sm text-muted-foreground">No hay datos para esta semana.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorShiftsPage;
