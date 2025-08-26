import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Utilidad para generar slots de 30m
const buildSlots = () => Array.from({ length: 48 }, (_, i) => i);

const formatSlotLabel = (slotIndex) => {
  const hour = Math.floor(slotIndex / 2);
  const minutes = (slotIndex % 2) * 30;
  const hh = String(hour).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
};

export default function DayShiftModal({ open, onClose, dayDate, initialStart, initialEnd, initialLunchStart, initialExtraHours = 0, onSubmit }) {
  const slots = useMemo(buildSlots, []);
  const [start, setStart] = useState(initialStart ?? 16); // slot de inicio (08:00 por defecto)
  // baseHours = horas productivas, sin contar almuerzo
  const [baseHours, setBaseHours] = useState(8);
  const [hasLunch, setHasLunch] = useState(false);
  const [extraHours, setExtraHours] = useState(initialExtraHours || 0); // horas extra enteras

  useEffect(() => {
    if (!open) return;
    const s = initialStart ?? 16;
    const e = initialEnd ?? 32;
    const l = initialLunchStart ?? null; // null o número
    setStart(s);
    // Derivar baseHours de props iniciales si están disponibles
    if (Number.isInteger(s) && Number.isInteger(e) && e > s) {
      const lunchSlots = Number.isInteger(l) ? 2 : 0;
      const productiveSlots = Math.max(0, (e - s) - lunchSlots);
      setBaseHours(Math.max(0, productiveSlots / 2));
      setHasLunch(Number.isInteger(l));
    } else {
      setBaseHours(8);
      setHasLunch(false);
    }
    setExtraHours(initialExtraHours || 0);
  }, [open, initialStart, initialEnd, initialLunchStart, initialExtraHours]);

  // Cálculos derivados
  const safeBaseHours = Number.isFinite(Number(baseHours)) ? Number(baseHours) : 0;
  const dailyLimit = hasLunch ? 11 : 10;
  const totalDailyHours = useMemo(() => safeBaseHours + Number(extraHours || 0), [safeBaseHours, extraHours]);
  const baseSlots = Math.max(0, Math.round(safeBaseHours * 2));
  const lunchSlots = hasLunch ? 2 : 0;
  const endBase = Number(start) + baseSlots + lunchSlots; // fin del turno base (excl.)
  const endWithExtra = endBase + Math.max(0, Number(extraHours || 0) * 2);
  // Almuerzo se ubica automáticamente a la mitad de la jornada productiva
  const lunchStart = hasLunch && baseSlots >= 2 ? Number(start) + Math.floor(baseSlots / 2) : null;

  const handleSave = () => {
    const s = Number(start);
    const eh = Number(extraHours);

    if (!Number.isInteger(s) || s < 0 || s > 47) return;
    // baseHours válidas (múltiplos de 0.5 horas al menos 1 slot = 0.5h?) aquí exigimos mínimo 1h
    if (!(Number.isFinite(safeBaseHours) && safeBaseHours >= 1 && safeBaseHours <= 12)) return;
    // Si hay almuerzo, deben caber 2 slots dentro de la jornada base
    if (hasLunch && baseSlots < 2) return;

    // Validar horas extra
    if (!(Number.isInteger(eh) && eh >= 0 && eh <= 12)) return;

    // Validar límite diario: base + extra (sin contar almuerzo)
    if (totalDailyHours > dailyLimit) return;

    // Validar que el fin total no exceda el día
    if (endWithExtra > 48) return;

    onSubmit({ start: s, end: endBase, lunchStart: lunchStart, extraHours: eh });
  };

  const dateLabel = dayDate ? new Date(dayDate).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' }) : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-white text-black dark:bg-neutral-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>TURNO — {dateLabel}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2">
          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium">Hora inicio</label>
            <select className="border rounded px-2 py-1 bg-white text-black dark:bg-neutral-800 dark:text-white" value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {slots.slice(0, 47).map((s) => (
                <option key={s} value={s}>{formatSlotLabel(s)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium">Horas ordinarias</label>
            <input
              type="number"
              min={1}
              max={12}
              step={0.5}
              value={safeBaseHours}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                const clamped = Math.min(12, Math.max(0, val));
                // asegurar múltiplos de 0.5
                const rounded = Math.round(clamped * 2) / 2;
                setBaseHours(rounded);
              }}
              className="border rounded px-2 py-1 bg-white text-black dark:bg-neutral-800 dark:text-white"
              placeholder="Ej. 8"
            />
          </div>

          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium">Tiene almuerzo</label>
            <input
              type="checkbox"
              checked={hasLunch}
              onChange={(e) => setHasLunch(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium">Horas extra</label>
            <input
              type="number"
              min={0}
              max={12}
              step={1}
              value={extraHours}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0);
                setExtraHours(Math.min(12, Math.max(0, val)));
              }}
              className="border rounded px-2 py-1 bg-white text-black dark:bg-neutral-800 dark:text-white"
              placeholder="Ej. 2"
            />
          </div>

          {/* Resumen de horas del día */}
          <div className="rounded border p-2 text-sm text-muted-foreground bg-neutral-50 dark:bg-neutral-800/40">
            <div>Inicio: <span className="font-medium ">{formatSlotLabel(Number(start))}</span></div>
            {hasLunch && lunchStart !== null && (
              <div>Almuerzo: <span className="font-medium ">{formatSlotLabel(lunchStart)} - {formatSlotLabel(lunchStart + 2)}</span></div>
            )}
            <div>Fin (base): <span className="font-medium ">{endBase <= 48 ? formatSlotLabel(endBase) : '—'}</span></div>
            <div>Fin (con extra): <span className="font-medium ">{endWithExtra <= 48 ? formatSlotLabel(endWithExtra) : '—'}</span></div>
            <div>Horas Ordinarias: <span className="font-medium ">{safeBaseHours}</span></div>
            <div>Horas extra: <span className="font-medium ">{Number(extraHours || 0)}</span></div>
            <div>Total día (base + extra): <span className="font-semibold ">{totalDailyHours}</span> / límite {dailyLimit} {hasLunch ? '(con almuerzo)' : ''}</div>
            {totalDailyHours > dailyLimit && (
              <div className="text-destructive mt-1">El total diario excede el límite permitido.</div>
            )}
            {endWithExtra > 48 && (
              <div className="text-destructive mt-1">El horario calculado no cabe dentro del día.</div>
            )}
          </div>

       {/*    <p className="text-xs text-muted-foreground">Nota: la hora de fin es exclusiva.</p> */}
        </div>

        <DialogFooter>
          <Button className="text-white" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
