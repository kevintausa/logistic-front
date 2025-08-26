import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ReportsFilters = ({
  isCentroLavado,
  laundries,
  idLavanderia,
  setIdLavanderia,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  loading,
  canQuery,
  onApply,
}) => {
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <style>{`
        input.date-input::-webkit-calendar-picker-indicator { display: none; }
        input.date-input { -webkit-appearance: none; appearance: none; background-image: none; }
      `}</style>

      {!isCentroLavado && (
        <div className="flex flex-col">
          <Label>Centro de Lavado</Label>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={idLavanderia}
            onChange={(e) => setIdLavanderia(e.target.value)}
          >
            <option value="">Seleccione...</option>
            {laundries.map(l => (
              <option key={l._id} value={l._id}>{l.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col relative">
        <Label>Desde</Label>
        <Input
          ref={startDateRef}
          type="date"
          className="pr-10 date-input"
          style={{ colorScheme: 'light' }}
          value={startDate.slice(0,10)}
          onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
        />
        <button
          type="button"
          aria-label="Abrir calendario desde"
          className="absolute right-2 bottom-2.5 text-muted-foreground hover:text-foreground"
          onClick={() => startDateRef.current?.showPicker?.()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col relative">
        <Label>Hasta</Label>
        <Input
          ref={endDateRef}
          type="date"
          className="pr-10 date-input"
          style={{ colorScheme: 'light' }}
          value={endDate.slice(0,10)}
          onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
        />
        <button
          type="button"
          aria-label="Abrir calendario hasta"
          className="absolute right-2 bottom-2.5 text-muted-foreground hover:text-foreground"
          onClick={() => endDateRef.current?.showPicker?.()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      <Button onClick={onApply} disabled={loading || !canQuery} className="h-10">{loading ? 'Cargando...' : 'Aplicar'}</Button>
    </div>
  );
};

export default ReportsFilters;
