import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { fetchEmployees } from '@/pages/parametrizacion/employees/Services/employees.services';
import { saveShifts, getShifts } from '../services/shiftManagement.services';
import { getWeeklyOverview } from '../services/shifts.services';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeeklySummaryModal from './WeeklySummaryModal';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DayShiftModal from './DayShiftModal';

const ShiftCalendar = () => {
  const { idLavanderia } = useParams();
  const [employees, setEmployees] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState({});
  const [lunchSlots, setLunchSlots] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null);
  const [dragMode, setDragMode] = useState('select'); // 'select' or 'deselect'
  const [slotsBeforeDrag, setSlotsBeforeDrag] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const { toast } = useToast();

  // Modal por día
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState(null); // Date
  const [dayModalInitial, setDayModalInitial] = useState({ start: 16, end: 32, lunchStart: null });

  // Horas extra por slot (mapa de slotId -> true)
  const [overtimeSlots, setOvertimeSlots] = useState({});

  // Estado para Resumen semanal general (todos los empleados)
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overview, setOverview] = useState(null);

  const currentEmployee = useMemo(() => {
    const id = String(selectedEmployee || '');
    return employees.find((e) => String(e._id ?? e.id ?? '') === id) || null;
  }, [employees, selectedEmployee]);

  // Día libre planificado (puede diferir del de BD)
  const [plannedDayOff, setPlannedDayOff] = useState(null);

  useEffect(() => {
    // Cuando cambia el empleado seleccionado, sincronizar el día libre planificado con el de BD
    setPlannedDayOff(currentEmployee?.dayOff || null);
  }, [currentEmployee]);



  // Visualización por HORA (24 filas). La lógica interna sigue usando slots de 30 min.
  const hourRows = Array.from({ length: 24 }, (_, h) => h);

  const formatHourLabel = (hour) => {
    const hh = String(hour).padStart(2, '0');
    return `${hh}:00`;
  };

  // Determina la clase para una hora combinando sus 2 slots de 30 min (idx = h*2 y h*2+1)
  const getHourClassName = (day, hour) => {
    const h1 = hour * 2;
    const h2 = h1 + 1;
    const slotId1 = `${day.toISOString()}-${h1}`;
    const slotId2 = `${day.toISOString()}-${h2}`;

    const employee = employees.find(e => e.id === selectedEmployee);
    const dayName = format(day, 'EEEE', { locale: es });
    const dayOffName = (plannedDayOff || (employee?.dayOff ?? '')).toString();
    const isDayOff = dayOffName && dayOffName.toLowerCase() === dayName.toLowerCase();

    // Pintar almuerzo si cualquier mitad de la hora cae dentro del almuerzo
    // (antes exigíamos las dos mitades; eso fallaba para almuerzos 30-min desfasados, p.ej. 09:30-10:30)
    const isLunch = !!(lunchSlots[slotId1] || lunchSlots[slotId2]);
    const isExtra = !!(overtimeSlots[slotId1] || overtimeSlots[slotId2]);
    const isWork = !!((selectedSlots[slotId1] && !lunchSlots[slotId1] && !overtimeSlots[slotId1]) ||
                      (selectedSlots[slotId2] && !lunchSlots[slotId2] && !overtimeSlots[slotId2]));

    if (isLunch) return 'slot slot--lunch';
    if (isExtra) return 'slot slot--extra';
    if (isWork) return 'slot slot--work';
    if (isDayOff) return 'slot slot--dayoff';
    return 'slot slot--free';
  };
  
  const weekStartsOn = 1; // Lunes
  const weekInterval = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn }),
    end: endOfWeek(currentDate, { weekStartsOn }),
  });

  const weekDays = weekInterval.map(day => ({
    date: day,
    name: format(day, 'EEEE', { locale: es }),
    dayNumber: format(day, 'd'),
  }));

  const weekStartStr = format(weekInterval[0], 'yyyy-MM-dd');
  const weekEndStr = format(weekInterval[6], 'yyyy-MM-dd');

  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  const openDayModal = (dayDate) => {
    // Derivar valores iniciales desde el estado actual
    const dayISO = dayDate.toISOString().split('T')[0];
    const slots = Object.keys(selectedSlots)
      // Solo slots BASE: excluir almuerzo y horas extra para no extender el fin con extra
      .filter(k => k.startsWith(dayISO) && !lunchSlots[k] && !overtimeSlots[k])
      .map(k => parseInt(k.split('-').pop(), 10))
      .sort((a,b)=>a-b);
    let start = 16; // 08:00 por defecto
    let end = 32;   // 16:00 por defecto (exclusivo)
    if (slots.length > 0) {
      start = slots[0];
      end = slots[slots.length - 1] + 1; // exclusivo
    }

    const lunchSlotsDay = Object.keys(lunchSlots)
      .filter(k => k.startsWith(dayISO))
      .map(k => parseInt(k.split('-').pop(), 10));
    const lunchStart = lunchSlotsDay.length ? Math.min(...lunchSlotsDay) : null;

    // Calcular horas extra iniciales del día (en horas enteras)
    const otCountSlots = Object.keys(overtimeSlots).filter(k => k.startsWith(dayISO)).length;
    const initialExtraHours = Math.floor(otCountSlots / 2);

    setDayModalInitial({ start, end, lunchStart, initialExtraHours });
    setDayModalDate(dayDate);
    setDayModalOpen(true);
  };

  const applyDaySelection = ({ start, end, lunchStart, extraHours = 0 }) => {
    if (!dayModalDate) return;

    // Validaciones básicas
    if (!(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 48 && start < end)) {
      toast({ title: 'Selección inválida', description: 'Rango de horas inválido.', variant: 'destructive' });
      return;
    }
    // Almuerzo si existe: dos slots consecutivos dentro del rango
    if (lunchStart != null) {
      if (!(Number.isInteger(lunchStart) && lunchStart >= start && lunchStart + 2 <= end)) {
        toast({ title: 'Almuerzo inválido', description: 'El almuerzo debe ser 1 hora dentro del rango seleccionado.', variant: 'destructive' });
        return;
      }
    }

    const dayISO = dayModalDate.toISOString().split('T')[0];

    // Calcular nuevo conjunto por día y validar límites diario/semanal
    const newDaySlots = new Set();
    for (let s = start; s < end; s++) newDaySlots.add(`${dayModalDate.toISOString()}-${s}`);

    const newDayLunch = new Set();
    if (lunchStart != null) {
      newDayLunch.add(`${dayModalDate.toISOString()}-${lunchStart}`);
      newDayLunch.add(`${dayModalDate.toISOString()}-${lunchStart + 1}`);
    }

    // Construir nuevos estados
    const nextSelected = { ...selectedSlots };
    const nextLunch = { ...lunchSlots };
    const nextOvertime = { ...overtimeSlots };

    // Limpiar selección del día y re-aplicar
    Object.keys(nextSelected).forEach(k => { if (k.startsWith(dayISO)) delete nextSelected[k]; });
    Object.keys(nextLunch).forEach(k => { if (k.startsWith(dayISO)) delete nextLunch[k]; });
    Object.keys(nextOvertime).forEach(k => { if (k.startsWith(dayISO)) delete nextOvertime[k]; });

    newDaySlots.forEach(k => { nextSelected[k] = true; });
    newDayLunch.forEach(k => { nextLunch[k] = true; });

    // Marcar horas extra del día (en slots contiguos después del fin si es posible)
    const dayDate = new Date(dayISO + 'T00:00:00');
    const needSlots = Math.max(0, (Number(extraHours) || 0) * 2);
    if (needSlots > 0) {
      // Acomodar extra empezando en 'end'
      const startExtra = end;
      for (let s = startExtra; s < startExtra + needSlots && s <= 47; s++) {
        const sid = `${dayDate.toISOString()}-${s}`;
        nextOvertime[sid] = true;
        if (!nextSelected[sid]) nextSelected[sid] = true;
      }
    }

    // Nueva validación diaria: (horas base + extra) <= 10 (<= 11 si tiene almuerzo)
    const daySelected = Object.keys(nextSelected).filter(k => k.startsWith(dayISO)).length;
    const dayLunchCount = Object.keys(nextLunch).filter(k => k.startsWith(dayISO)).length; // 0 o 2
    const baseSlots = daySelected - dayLunchCount - (Math.max(0, (Number(extraHours) || 0) * 2));
    const baseHours = Math.max(0, baseSlots / 2);
    const hasLunch = dayLunchCount > 0;
    const dailyLimit = hasLunch ? 11 : 10;
    const totalDailyHours = baseHours + (Number(extraHours) || 0);
    if (totalDailyHours > dailyLimit) {
      toast({ title: 'Límite diario excedido', description: `Base + Extra (${totalDailyHours}h) supera ${dailyLimit}h${hasLunch ? ' con almuerzo' : ''}.`, variant: 'destructive' });
      return;
    }

    setSelectedSlots(nextSelected);
    setLunchSlots(nextLunch);
    setOvertimeSlots(nextOvertime);
    setDayModalOpen(false);
  };

  const handleMouseDown = (day, slotIndex) => {
    setSlotsBeforeDrag(selectedSlots); // Guardar estado antes de cualquier cambio
    setIsDragging(true);
    const slotId = `${day.toISOString()}-${slotIndex}`;
    const mode = selectedSlots[slotId] ? 'deselect' : 'select';
    setDragMode(mode);
    setDragStartSlot({ day, hour: slotIndex });
  };

  const handleMouseEnter = (day, slotIndex) => {
    if (!isDragging || !dragStartSlot) return;

    // Solo permitir arrastre en el mismo día
    if (dragStartSlot.day.toISOString().split('T')[0] !== day.toISOString().split('T')[0]) {
      return;
    }

    const startSlot = Math.min(dragStartSlot.hour, slotIndex);
    const endSlot = Math.max(dragStartSlot.hour, slotIndex);

    const newSelectedSlots = { ...selectedSlots };

    for (let s = startSlot; s <= endSlot; s++) {
      const slotId = `${day.toISOString()}-${s}`;
      if (dragMode === 'select') {
        newSelectedSlots[slotId] = true;
      } else {
        delete newSelectedSlots[slotId];
      }
    }

    setSelectedSlots(newSelectedSlots);
  };

  const handleMouseUp = (day, slotIndex) => {
    if (!isDragging) return;

    // Determinar si fue un clic o un arrastre
    const isClick = dragStartSlot && dragStartSlot.day.toISOString() === day.toISOString() && dragStartSlot.hour === slotIndex;

    if (isClick) {
      // Es un clic simple, ejecutar la lógica de clic
      handleSlotClick(day, slotIndex);
    } else {
      // Es un arrastre, finalizar y validar
      const dayISO = dragStartSlot.day.toISOString().split('T')[0];
      const dailySelected = Object.keys(selectedSlots).filter(key => key.startsWith(dayISO)).length;
      const dailyLunch = Object.keys(lunchSlots).filter(key => key.startsWith(dayISO)).length;
      const dailyEffective = dailySelected - dailyLunch;

      // Límite diario: 20 slots efectivos
      if (dailyEffective > 20) {
        toast({ title: 'Límite Diario Excedido', description: 'No puedes asignar más de 10 horas al día.', variant: 'destructive' });
        setSelectedSlots(slotsBeforeDrag);
        setIsDragging(false);
        setDragStartSlot(null);
        return;
      }

      // Límite semanal: 88 slots efectivos
      const totalSelected = Object.keys(selectedSlots).length;
      const totalLunch = Object.keys(lunchSlots).length;
      const totalEffective = totalSelected - totalLunch;
      if (totalEffective > 88) { // 44h => 88 slots
        toast({ title: 'Límite Semanal Excedido', description: 'No puedes asignar más de 44 horas.', variant: 'destructive' });
        // Revertir al estado original antes del arrastre
        setSelectedSlots(slotsBeforeDrag);
        setIsDragging(false);
        setDragStartSlot(null);
        return;
      }
    }

    setIsDragging(false);
    setDragStartSlot(null);
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      toast({ title: 'Selecciona un empleado', description: 'Debes seleccionar un empleado para poder guardar.', variant: 'destructive' });
      return;
    }

    if (!currentEmployee) return;

    // Validación semanal de 44h: solo al guardar (horas efectivas sin contar almuerzo ni extra)
    // - Base <= 44h (sin almuerzo ni extra)
    // - Extra <= 12h
    // - Total <= 56h
    const weeklyBaseHours = (Object.keys(selectedSlots).length - Object.keys(lunchSlots).length - Object.keys(overtimeSlots).length) / 2;
    const weeklyExtraHours = Object.keys(overtimeSlots).length / 2;
    const weeklyTotalHours = weeklyBaseHours + weeklyExtraHours;

    if (weeklyBaseHours > 44) {
      toast({ title: 'Límite semanal de base excedido', description: `Asignaste ${weeklyBaseHours}h base. El máximo es 44h.`, variant: 'destructive' });
      return;
    }
    if (weeklyExtraHours > 12) {
      toast({ title: 'Límite semanal de extras excedido', description: `Asignaste ${weeklyExtraHours}h extra. El máximo es 12h.`, variant: 'destructive' });
      return;
    }
    if (weeklyTotalHours > 56) {
      toast({ title: 'Límite semanal total excedido', description: `El total semanal es ${weeklyTotalHours}h. El máximo permitido es 56h.`, variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    // Transformar datos para el backend
    const shifts = {};
    Object.keys(selectedSlots).forEach(key => {
      if (lunchSlots[key]) return; // No incluir almuerzo
      if (overtimeSlots[key]) return; // No incluir horas extra en payload normal
      const [isoDate, hour] = key.split('T');
      const dateKey = isoDate;
      const hourNumber = parseInt(key.split('-').pop(), 10);
      
      if (!shifts[dateKey]) {
        shifts[dateKey] = [];
      }
      shifts[dateKey].push(hourNumber);
    });

    // Construir lunchHours por día como slot inicial (de los 2 consecutivos)
    const lunchHours = {};
    const lunchByDay = {};
    Object.keys(lunchSlots).forEach(key => {
      const [isoDate] = key.split('T');
      const slotNumber = parseInt(key.split('-').pop(), 10);
      if (!lunchByDay[isoDate]) lunchByDay[isoDate] = [];
      lunchByDay[isoDate].push(slotNumber);
    });
    Object.entries(lunchByDay).forEach(([dateKey, slots]) => {
      const sorted = slots.sort((a,b)=>a-b);
      // Tomar el primero como inicio
      lunchHours[dateKey] = sorted[0];
    });

    // Construir overtimeHours por día en HORAS (enteras)
    const overtimeHours = {};
    const otByDay = {};
    Object.keys(overtimeSlots).forEach(key => {
      const [isoDate] = key.split('T');
      if (!otByDay[isoDate]) otByDay[isoDate] = 0;
      otByDay[isoDate] += 1; // contar slots
    });
    Object.entries(otByDay).forEach(([dateKey, slotCount]) => {
      overtimeHours[dateKey] = Math.floor(slotCount / 2);
    });

    const empleado = currentEmployee
      ? {
          id: String(currentEmployee._id ?? currentEmployee.id ?? selectedEmployee),
          nombre: currentEmployee.nombre ?? currentEmployee.name ?? '',
          cedula: currentEmployee.cedula ?? currentEmployee.identificacion ?? currentEmployee.documento ?? '',
          celular: currentEmployee.celular,
          salario: currentEmployee.salario,
          correo: currentEmployee.correo,
          // Guardar el día libre planificado si fue modificado
          diaDescanso: plannedDayOff ?? currentEmployee.dayOff,
        }
      : null;

    const lavanderia = idLavanderia
      ? { id: String(idLavanderia), nombre: undefined }
      : null;

    const payload = {
      employeeId: selectedEmployee,
      laundryCenterId: idLavanderia,
      shifts,
      lunchHours,
      overtimeHours,
      // Persistir día libre por semana en el plan de turnos
      dayOff: plannedDayOff || currentEmployee?.dayOff || null,
      empleado,
      lavanderia,
    };

    try {
      await saveShifts(payload);
      // Refrescar resumen semanal general tras guardar
      if (typeof loadOverview === 'function') {
        await loadOverview();
      }
      // Nota: el día de descanso ahora se guarda por semana en el plan (payload.dayOff),
      // no actualizamos el empleado global para no afectar otras semanas.
      const empLabel = empleado?.nombre || currentEmployee?.name || 'el empleado';
      toast({ title: 'Turnos Guardados', description: `Los horarios para ${empLabel} han sido guardados.` });
    } catch (error) {
      toast({ title: 'Error al Guardar', description: error.message || 'No se pudieron guardar los turnos.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Vaciar tablero: elimina toda la planificación actual (mantiene empleado y día libre seleccionado)
  const handleClearBoard = () => {
    const confirmed = window.confirm('¿Deseas vaciar toda la planificación de la semana para este empleado?');
    if (!confirmed) return;
    setSelectedSlots({});
    setLunchSlots({});
    setOvertimeSlots({});
    toast({ title: 'Tablero vaciado', description: 'Se eliminó la planificación actual.', variant: 'default' });
  };

  // Limpiar un día específico (solo ese día)
  const handleClearDay = (dayDate) => {
    if (!dayDate) return;
    const dayISO = dayDate.toISOString().split('T')[0];
    const confirmed = window.confirm(`¿Eliminar la programación del día ${dayISO}?`);
    if (!confirmed) return;
    const nextSelected = { ...selectedSlots };
    const nextLunch = { ...lunchSlots };
    const nextOvertime = { ...overtimeSlots };
    Object.keys(nextSelected).forEach(k => { if (k.startsWith(dayISO)) delete nextSelected[k]; });
    Object.keys(nextLunch).forEach(k => { if (k.startsWith(dayISO)) delete nextLunch[k]; });
    Object.keys(nextOvertime).forEach(k => { if (k.startsWith(dayISO)) delete nextOvertime[k]; });
    setSelectedSlots(nextSelected);
    setLunchSlots(nextLunch);
    setOvertimeSlots(nextOvertime);
    toast({ title: 'Día limpiado', description: `Se eliminó la planificación del ${dayISO}.`, variant: 'default' });
  };

  const handleRightClick = (e, day, slotIndex) => {
    e.preventDefault(); // Prevenir el menú contextual del navegador
    const slotId = `${day.toISOString()}-${slotIndex}`;

    // Solo se puede asignar almuerzo a una hora ya seleccionada
    if (!selectedSlots[slotId]) {
      toast({ title: 'Slot no seleccionado', description: 'Solo puedes marcar almuerzo sobre tiempo seleccionado.', variant: 'destructive' });
      return;
    }

    // El almuerzo es 1 hora = 2 slots consecutivos
    if (slotIndex >= 47) {
      toast({ title: 'Almuerzo inválido', description: 'El almuerzo debe ocupar 2 slots consecutivos de 30 minutos.', variant: 'destructive' });
      return;
    }

    const nextSlotId = `${day.toISOString()}-${slotIndex + 1}`;
    if (!selectedSlots[nextSlotId]) {
      toast({ title: 'Almuerzo fuera de rango', description: 'Ambos slots del almuerzo deben estar seleccionados.', variant: 'destructive' });
      return;
    }

    const newLunchSlots = { ...lunchSlots };
    const dayISO = day.toISOString().split('T')[0];

    const isCurrentlyLunch = !!newLunchSlots[slotId] || !!newLunchSlots[nextSlotId];

    // Limpiar cualquier otra hora de almuerzo en el mismo día
    Object.keys(newLunchSlots).forEach(key => {
      if (key.startsWith(dayISO)) {
        delete newLunchSlots[key];
      }
    });

    // Toggle: si ya era almuerzo, lo quitamos (ya quedó limpio). Si no, asignamos el par.
    if (!isCurrentlyLunch) {
      newLunchSlots[slotId] = true;
      newLunchSlots[nextSlotId] = true;
    }

    setLunchSlots(newLunchSlots);
  };

  const handleSlotClick = (day, slotIndex) => {
    const slotId = `${day.toISOString()}-${slotIndex}`;
    const newSelectedSlots = { ...selectedSlots };
    const newLunchSlots = { ...lunchSlots };
    const dayISO = day.toISOString().split('T')[0];

    if (newSelectedSlots[slotId]) { // Deseleccionar
      delete newSelectedSlots[slotId];
      // Si la hora deseleccionada era el almuerzo, simplemente se elimina.
      if (newLunchSlots[slotId]) {
        delete newLunchSlots[slotId];
      }
    } else { // Seleccionar
      const totalWorkSlots = Object.keys(selectedSlots).length - Object.keys(lunchSlots).length;
      if (totalWorkSlots >= 88) {
        toast({ title: 'Límite Semanal Excedido', description: 'No puedes asignar más de 44 horas.', variant: 'destructive' });
        return;
      }

      const dailyWorkSlots = Object.keys(selectedSlots).filter(key => key.startsWith(dayISO)).length - Object.keys(lunchSlots).filter(key => key.startsWith(dayISO)).length;
      if (dailyWorkSlots >= 20) {
        toast({ title: 'Límite Diario Excedido', description: 'No puedes asignar más de 10 horas al día.', variant: 'destructive' });
        return;
      }
      newSelectedSlots[slotId] = true;
    }
    setSelectedSlots(newSelectedSlots);
    setLunchSlots(newLunchSlots);
  };

  const getSlotClassName = (day, slotIndex) => {
    const slotId = `${day.toISOString()}-${slotIndex}`;
    const employee = employees.find(e => e.id === selectedEmployee);
    const dayName = format(day, 'EEEE', { locale: es });
    const dayOffName = (plannedDayOff || (employee?.dayOff ?? '')).toString();
    const isDayOff = dayOffName && dayOffName.toLowerCase() === dayName.toLowerCase();

    // Clases puras CSS (ver src/index.css)
    if (lunchSlots[slotId]) {
      return 'slot slot--lunch';
    } else if (overtimeSlots[slotId]) {
      return 'slot slot--extra';
    } else if (selectedSlots[slotId]) {
      return 'slot slot--work';
    } else if (isDayOff) {
      return 'slot slot--dayoff';
    }
    return 'slot slot--free';
  };

  useEffect(() => {
    const loadEmployees = async () => {
      if (!idLavanderia) return;
      try {
        setLoadingEmployees(true);
        const response = await fetchEmployees({ query: { 
            "lavanderia.id": idLavanderia, estado: "Activo" }, limit: 100 });
        const formattedEmployees = response.data.map(emp => ({
          id: emp._id,
          name: `${emp.nombre} ${emp.apellido}`,
          dayOff: emp.diaDescanso || 'Domingo',
          cedula: emp.cedula,
          celular: emp.celular,
          salario: emp.salario,
          correo: emp.correo,
        }));
        setEmployees(formattedEmployees);
        if (formattedEmployees.length > 0) {
          setSelectedEmployee(formattedEmployees[0].id);
        }
      } catch (error) {
        toast({ title: 'Error al cargar empleados', description: 'No se pudieron obtener los empleados para este centro de lavado.', variant: 'destructive' });
      } finally {
        setLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, [idLavanderia]);

  useEffect(() => {
    const loadShifts = async () => {
      if (!selectedEmployee) return;

      setLoadingShifts(true);
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

      try {
        const resp = await getShifts({
          employeeId: selectedEmployee,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        });
        const { shifts, lunchHours, overtimeHours, dayOff, diaDescanso, plannedDayOff: pd } = resp || {};
        const weekDayOff = pd || dayOff || diaDescanso || null;
        if (weekDayOff) {
          setPlannedDayOff(weekDayOff);
        } else {
          // Si el plan no trae día libre, sincronizar con el del empleado
          setPlannedDayOff(currentEmployee?.dayOff || null);
        }

        const newSelectedSlots = {};
        const newLunchSlots = {};
        const newOvertimeSlots = {};

        if (shifts) {
          Object.entries(shifts).forEach(([dateStr, hours]) => {
            const dayDate = parseISO(`${dateStr}T00:00:00`);
            hours.forEach(hour => {
              const slotId = `${dayDate.toISOString()}-${hour}`;
              newSelectedSlots[slotId] = true;
            });
          });
        }

        if (lunchHours) {
          Object.entries(lunchHours).forEach(([dateStr, lunchVal]) => {
            const dayDate = parseISO(`${dateStr}T00:00:00`);
            const addLunchSlot = (idx) => {
              const sid = `${dayDate.toISOString()}-${idx}`;
              newLunchSlots[sid] = true;
              if (!newSelectedSlots[sid]) newSelectedSlots[sid] = true;
            };
            if (Array.isArray(lunchVal)) {
              lunchVal.forEach(addLunchSlot);
            } else if (Number.isInteger(lunchVal)) {
              // Se asume que el backend envía el slot de inicio: marcamos 2 slots
              addLunchSlot(lunchVal);
              if (lunchVal + 1 <= 47) addLunchSlot(lunchVal + 1);
            }
          });
        }

        // Cargar horas extra si el backend las provee: número de horas por día
        if (overtimeHours) {
          Object.entries(overtimeHours).forEach(([dateStr, otHours]) => {
            const hours = parseInt(otHours, 10) || 0;
            if (hours <= 0) return;
            const dayDate = parseISO(`${dateStr}T00:00:00`);
            const dayISO = dayDate.toISOString().split('T')[0];
            // Encontrar último slot trabajado del día (excluyendo almuerzo)
            const dayWorkSlots = Object.keys(newSelectedSlots)
              .filter(k => k.startsWith(dayISO) && !newLunchSlots[k])
              .map(k => parseInt(k.split('-').pop(), 10));
            if (dayWorkSlots.length === 0) return; // no hay trabajo base para colgar extra
            const maxSlot = Math.max(...dayWorkSlots);
            let start = maxSlot + 1; // fin exclusivo del trabajo base
            const needSlots = hours * 2;
            for (let s = start; s < start + needSlots && s <= 47; s++) {
              const sid = `${dayDate.toISOString()}-${s}`;
              newOvertimeSlots[sid] = true;
              if (!newSelectedSlots[sid]) newSelectedSlots[sid] = true;
            }
          });
        }

        setSelectedSlots(newSelectedSlots);
        setLunchSlots(newLunchSlots);
        setOvertimeSlots(newOvertimeSlots);

      } catch (error) {
        toast({ title: 'Error al cargar los turnos', description: error.message, variant: 'destructive' });
        setSelectedSlots({});
        setLunchSlots({});
      } finally {
        setLoadingShifts(false);
      }
    };

    loadShifts();
  }, [selectedEmployee, currentDate]);

  // Cargar Resumen semanal general al cambiar semana o lavandería
  const loadOverview = useCallback(async () => {
    if (!idLavanderia) return; // si aplica, filtrar por lavandería
    try {
      setOverviewLoading(true);
      const res = await getWeeklyOverview({
        lavanderiaId: idLavanderia,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
      });
      setOverview(res);
    } catch (err) {
      const msg = err?.message || err?.error || 'No se pudo cargar el resumen semanal general';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [idLavanderia, weekStartStr, weekEndStr, toast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const totalSelectedHours = useMemo(() => {
    const slots = Object.keys(selectedSlots).filter(slot => !lunchSlots[slot] && !overtimeSlots[slot]).length;
    return (slots / 2);
  }, [selectedSlots, lunchSlots, overtimeSlots]);

  const totalOvertimeHours = useMemo(() => {
    // overtimeSlots ya está limitado a la semana actual
    const slots = Object.keys(overtimeSlots).length;
    return (slots / 2);
  }, [overtimeSlots]);

  const getDayEffectiveHours = (dayDate) => {
    const dayISO = dayDate.toISOString().split('T')[0];
    const daySlots = Object.keys(selectedSlots).filter(key => key.startsWith(dayISO)).length;
    const dayLunch = Object.keys(lunchSlots).filter(key => key.startsWith(dayISO)).length;
    const dayOver = Object.keys(overtimeSlots).filter(key => key.startsWith(dayISO)).length;
    return (daySlots - dayLunch - dayOver) / 2;
  };

  const getDayOvertimeHours = (dayDate) => {
    const dayISO = dayDate.toISOString().split('T')[0];
    const dayOver = Object.keys(overtimeSlots).filter(key => key.startsWith(dayISO)).length;
    return dayOver / 2;
  };

  // Resumen semanal para header
  const weeklyBaseHours = useMemo(() => {
    return (Object.keys(selectedSlots).length - Object.keys(lunchSlots).length - Object.keys(overtimeSlots).length) / 2;
  }, [selectedSlots, lunchSlots, overtimeSlots]);

  const weeklyExtraHours = useMemo(() => {
    return Object.keys(overtimeSlots).length / 2;
  }, [overtimeSlots]);

  const weeklyTotalHours = useMemo(() => weeklyBaseHours + weeklyExtraHours, [weeklyBaseHours, weeklyExtraHours]);

  const slotToTime = (slotIdx) => {
    const h = Math.floor(slotIdx / 2);
    const m = (slotIdx % 2) * 30;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const buildWeeklySummary = () => {
    // Recorre cada día de la semana y arma bloques de trabajo excluyendo almuerzo
    const perDay = weekDays.map(({ date }) => {
      const dayISO = date.toISOString().split('T')[0];
      // Construir bloques: base (sin almuerzo ni extra) y extra (solo overtime)
      const allDaySlots = Object.keys(selectedSlots)
        .filter(k => k.startsWith(dayISO))
        .map(k => parseInt(k.split('-').pop(), 10))
        .sort((a,b)=>a-b);

      const baseSlots = allDaySlots.filter(idx => !lunchSlots[`${date.toISOString()}-${idx}`] && !overtimeSlots[`${date.toISOString()}-${idx}`]);
      const extraSlots = allDaySlots.filter(idx => overtimeSlots[`${date.toISOString()}-${idx}`]);

      const buildBlocks = (slotsArr) => {
        const res = [];
        let start = null, prev = null;
        for (const s of slotsArr) {
          if (start === null) { start = s; prev = s; continue; }
          if (s === prev + 1) { prev = s; continue; }
          res.push({ from: start, to: prev + 1 });
          start = s; prev = s;
        }
        if (start !== null) res.push({ from: start, to: prev + 1 });
        return res;
      };

      const baseBlocks = buildBlocks(baseSlots).map(b => ({
        start: slotToTime(b.from),
        end: slotToTime(b.to),
        hours: (b.to - b.from) / 2,
        type: 'base',
      }));
      const extraBlocks = buildBlocks(extraSlots).map(b => ({
        start: slotToTime(b.from),
        end: slotToTime(b.to),
        hours: (b.to - b.from) / 2,
        type: 'extra',
      }));
      // Combinar y ordenar por inicio
      const blocksFmt = [...baseBlocks, ...extraBlocks].sort((a,b)=> a.start.localeCompare(b.start));

      // Almuerzo: tomar inicio si existe
      const lunchSlotsDay = Object.keys(lunchSlots)
        .filter(k => k.startsWith(dayISO))
        .map(k => parseInt(k.split('-').pop(), 10))
        .sort((a,b)=>a-b);
      const lunchStart = lunchSlotsDay.length ? Math.min(...lunchSlotsDay) : null;

      const totalHours = baseBlocks.reduce((acc,b)=>acc+b.hours,0);
      // Horas extra del día (en horas)
      const extraSlotsCount = Object.keys(overtimeSlots).filter(k => k.startsWith(dayISO)).length;
      const extraHours = extraSlotsCount / 2;

      return {
        date: dayISO,
        totalHours, // horas base (sin almuerzo ni extra)
        extraHours,
        blocks: blocksFmt,
        lunch: lunchStart !== null ? { start: slotToTime(lunchStart), end: slotToTime(lunchStart + 2) } : null,
      };
    });

    const weeklyBase = perDay.reduce((acc,d)=>acc + d.totalHours, 0);
    const weeklyExtra = perDay.reduce((acc,d)=>acc + (d.extraHours || 0), 0);
    const weeklyTotal = weeklyBase + weeklyExtra;
    return { weeklyBase, weeklyExtra, weeklyTotal, perDay };
  };

  return (
    <>
    <Card onMouseUp={handleMouseUp} onMouseLeave={isDragging ? handleMouseUp : undefined}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Programación de Turnos</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-48 text-center font-semibold text-muted-foreground">
              {format(weekInterval[0], 'd MMM', { locale: es })} - {format(weekInterval[6], 'd MMM, yyyy', { locale: es })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <label htmlFor="employee-select" className="text-sm font-medium">
            Empleado
          </label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={loadingEmployees || employees.length === 0}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={loadingEmployees ? 'Cargando...' : 'Seleccionar empleado'} />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selector de día libre planificado */}
          <label htmlFor="dayoff-select" className="text-sm font-medium">
            Día libre
          </label>
          <Select value={plannedDayOff ?? ''} onValueChange={setPlannedDayOff} disabled={!currentEmployee}>
            <SelectTrigger id="dayoff-select" className="w-[180px]">
              <SelectValue placeholder="Seleccionar día" />
            </SelectTrigger>
            <SelectContent>
              {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><div className="slot-badge slot--work"></div><span>Trabajo</span></div>
            <div className="flex items-center gap-1"><div className="slot-badge slot--lunch"></div><span>Almuerzo</span></div>
            <div className="flex items-center gap-1"><div className="slot-badge slot--extra"></div><span>Extra</span></div>
            <div className="flex items-center gap-1"><div className="slot-badge slot--dayoff"></div><span>Día libre</span></div>
            <div className="flex items-center gap-1"><div className="slot-badge"></div><span>Libre</span></div>
          </div>
          <div className="text-right text-sm">
            <div><span className="font-bold">Base:</span> <span className="font-semibold">{weeklyBaseHours}</span> / 44h</div>
            <div><span className="font-bold">Extra:</span> <span className="font-semibold text-amber-600">{weeklyExtraHours}</span> / 12h</div>
            <div><span className="font-bold">Total:</span> <span className="font-semibold">{weeklyTotalHours}</span> / 56h</div>
          </div>
        </div>

        <div className="relative">
          {loadingShifts && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <p>Cargando turnos...</p>
            </div>
          )}
          <div className="grid grid-cols-8 text-center font-semibold text-muted-foreground">
            <div className="p-2"></div>
            {weekDays.map(day => (
              <div key={day.date.toISOString()} className="p-2">
                <span className="block text-xs">{day.name.substring(0, 3)}</span>
                <span className="text-lg">{day.dayNumber}</span>
                <span className="block text-[10px] text-muted-foreground">{getDayEffectiveHours(day.date)}h</span>
                {getDayOvertimeHours(day.date) > 0 && (
                  <span className="block text-[10px] text-amber-600">Extra: {getDayOvertimeHours(day.date)}h</span>
                )}
                <div className="mt-1">
                  <div className="flex gap-1 justify-center">
                    <Button variant="outline" className="h-6 px-2 text-[10px]" onClick={() => openDayModal(day.date)}>Configurar</Button>
                    <Button variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => handleClearDay(day.date)}>Borrar día</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hourRows.map((hour) => (
            <div key={hour} className="grid grid-cols-8 text-center items-center">
              <div className="text-[10px] font-semibold text-muted-foreground pr-2">{formatHourLabel(hour)}</div>
              {weekDays.map((day) => (
                <div key={day.date.toISOString()} className="p-0.5">
                  <div
                    key={`${day.date.toISOString()}-h-${hour}`}
                    className={getHourClassName(day.date, hour)}
                    // Interacciones deshabilitadas: la planificación se hará solo desde el modal
                    style={{ height: '24px', userSelect: 'none', cursor: 'default' }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
  <CardFooter className="flex items-center justify-between gap-2">
    <div className="text-sm text-muted-foreground">Horas efectivas de la semana: <span className="font-semibold text-foreground">{totalSelectedHours} h</span></div>
    <div className="flex gap-2">
      <Button
        variant="destructive"
        onClick={handleClearBoard}
      >
        Limpiar tablero
      </Button>
      <Button
        variant="secondary"
        onClick={() => { const s = buildWeeklySummary(); setWeeklySummary(s); setShowSummary(true); }}
      >
        Ver Resumen
      </Button>
      <Button disabled={isSaving} onClick={handleSave}>
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  </CardFooter>
</Card>
  
<WeeklySummaryModal open={showSummary} onClose={setShowSummary} summary={weeklySummary} employee={currentEmployee} />

 <DayShiftModal
   open={dayModalOpen}
   onClose={() => setDayModalOpen(false)}
   dayDate={dayModalDate}
   initialStart={dayModalInitial.start}
   initialEnd={dayModalInitial.end}
   initialLunchStart={dayModalInitial.lunchStart}
   initialExtraHours={dayModalInitial.initialExtraHours}
   onSubmit={applyDaySelection}
 />

{/* Resumen semanal general (Supervisor) */}
<div className="mt-6">
  <Card>
    <CardHeader>
      <CardTitle>Resumen semanal general</CardTitle>
      <div className="text-sm text-muted-foreground">
        Rango: {weekStartStr} a {weekEndStr}
      </div>
    </CardHeader>
    <CardContent>
      {overviewLoading && <div className="py-6">Cargando resumen...</div>}
      {!overviewLoading && !overview && (
        <div className="py-6 text-sm text-muted-foreground">Sin datos para el rango seleccionado.</div>
      )}
      {!overviewLoading && overview && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Empleados: {overview?.totals?.employees ?? 0} • Horas totales: {overview?.totals?.weeklyHours ?? 0} • Horas extra: {overview?.totals?.weeklyOvertime ?? 0}
          </div>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-primary text-foreground border-b">
                <tr className="uppercase text-[12px] tracking-wide">
                  <th className="p-2 text-left font-medium whitespace-nowrap">Empleado</th>
                  
                  {weekDays.map((d) => (
                    <th key={`h-${d.date.toISOString()}`} className="p-2 text-center font-medium hidden md:table-cell whitespace-nowrap">
                      {d.name.substring(0,3)}
                    </th>
                  ))}
                  <th className="p-2 text-center font-medium whitespace-nowrap">Horas Semana</th>
                  <th className="p-2 text-center font-medium whitespace-nowrap">Horas Extra</th>
                  <th className="p-2 text-center font-medium whitespace-nowrap">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(overview?.employees || []).map((e, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      {e?.empleado?.nombre || '-'} {e?.empleado?.apellido || ''}
                      <div className="text-xs text-muted-foreground">{e?.empleado?.cedula || ''}</div>
                    </td>
                    {weekDays.map((d) => {
                      const dStr = format(d.date, 'yyyy-MM-dd');
                      const dayInfo = (e?.perDay || []).find((pd) => pd?.date === dStr);
                      let baseLabel = '-';
                      let extraLabel = '';
                      let extraH = 0;
                      // Helpers para trabajar HH:mm
                      const toMinutes = (hhmm) => {
                        const [hh, mm] = String(hhmm || '00:00').split(':').map(n => parseInt(n, 10) || 0);
                        return hh * 60 + mm;
                      };
                      const toHHMM = (mins) => {
                        const m = ((mins % (24*60)) + (24*60)) % (24*60); // asegurar rango 0..1439
                        const hh = String(Math.floor(m / 60)).padStart(2, '0');
                        const mm = String(m % 60).padStart(2, '0');
                        return `${hh}:${mm}`;
                      };
                      if (dayInfo) {
                        // horas extra declaradas
                        extraH = Number(dayInfo.overtimeHours ?? dayInfo.extra ?? dayInfo.overtime ?? 0) || 0;
                      }
                      if (dayInfo && Array.isArray(dayInfo.blocks) && dayInfo.blocks.length > 0) {
                        const first = dayInfo.blocks[0];
                        const last = dayInfo.blocks[dayInfo.blocks.length - 1];
                        // Si no hay extra, mostrar rango completo
                        if (!extraH) {
                          baseLabel = `${first.start} - ${last.end}`;
                        } else {
                          // Intentar detectar si el último bloque coincide con horas extra
                          const lastDurMins = toMinutes(last.end) - toMinutes(last.start);
                          const extraMins = extraH * 60;
                          if (Math.abs(lastDurMins - extraMins) < 1) {
                            // Último bloque es Extra (backend ya separó el bloque de extra)
                            baseLabel = `${first.start} - ${last.start}`;
                            extraLabel = ` ${last.start} - ${last.end}`;
                          } else {
                            // Backend no incluyó bloque de extra en 'blocks': asumir que el extra
                            // es contiguo después del último fin de bloque base.
                            const extraStartM = toMinutes(last.end);
                            const extraEndM = extraStartM + extraMins;
                            baseLabel = `${first.start} - ${last.end}`;
                            extraLabel = ` ${toHHMM(extraStartM)} - ${toHHMM(extraEndM)}`;
                          }
                        }
                      }
                      return (
                        <td key={`c-${e?.empleado?.id || idx}-${d.date.toISOString()}`} className="p-2 text-center align-middle hidden md:table-cell">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={baseLabel === '-' ? 'text-[12px] text-muted-foreground' : 'text-[12px] font-medium'}>{baseLabel}</span>
                            {extraH > 0 && extraLabel && (
                              <span className="text-[12px] text-amber-600 font-medium">{extraLabel}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-semibold">{e?.weeklyTotal ?? 0}</td>
                    <td className="p-2 text-center font-semibold">
                      {(() => {
                        const perDay = e?.perDay || [];
                        const totalExtra = perDay.reduce((acc, pd) => acc + (Number(pd?.overtimeHours ?? pd?.extra ?? pd?.overtime ?? 0) || 0), 0);
                        return totalExtra;
                      })()}
                    </td>
                    <td className="p-2 text-center">
                      {e?.flags?.overWeekly && <span title="Más de 44h en la semana" className="text-red-600">⚠️ Semanal</span>}
                      {!e?.flags?.overWeekly && e?.flags?.overDaily && <span title="Más de 10h en algún día" className="text-amber-600">⚠️ Diario</span>}
                      {!e?.flags?.overWeekly && !e?.flags?.overDaily && <span className="text-emerald-600">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</div>
</>
);
};

export default ShiftCalendar;
