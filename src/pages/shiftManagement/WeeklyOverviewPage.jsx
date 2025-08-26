import React, { useMemo, useState } from 'react';
import { getWeeklyOverview } from '@/pages/shiftManagement/services/shifts.services';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

function fmtDate(d) {
  if (!d) return '';
  const dd = new Date(d);
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, '0');
  const day = String(dd.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}

const WeeklyOverviewPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const today = useMemo(() => fmtDate(new Date()), []);
  const defaultMonday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday of current week
    d.setDate(d.getDate() + diff);
    return fmtDate(d);
  }, []);

  const [weekStart, setWeekStart] = useState(defaultMonday);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const canFilterByLaundry = user?.rol !== 'centro_lavado';
  const [lavanderiaId, setLavanderiaId] = useState(user?.lavanderia?.id || '');

  const handleFetch = async () => {
    try {
      setLoading(true);
      const payload = {
        weekStart,
        weekEnd: addDays(weekStart, 6),
        ...(lavanderiaId ? { lavanderiaId } : {}),
        query: nombre ? { nombre } : undefined,
      };
      const res = await getWeeklyOverview(payload);
      setData(res);
    } catch (err) {
      const msg = err?.message || err?.error || 'Error al cargar vista general';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Resumen semanal (Supervisor)</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1">Inicio de semana</label>
          <input
            type="date"
            className="border rounded px-2 py-1 w-full date-input"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
        {canFilterByLaundry && (
          <div>
            <label className="block text-sm mb-1">Centro de lavado (opcional)</label>
            <input
              type="text"
              placeholder="ID de lavandería"
              className="border rounded px-2 py-1 w-full"
              value={lavanderiaId}
              onChange={(e) => setLavanderiaId(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm mb-1">Nombre empleado (contiene)</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
          >
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Rango: {data?.range?.weekStart} a {data?.range?.weekEnd} • Empleados: {data?.totals?.employees} • Horas semanales totales: {data?.totals?.weeklyHours}
          </div>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 shadow-sm bg-slate-200 text-slate-900 border-b border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                <tr className="uppercase text-[12px] tracking-wide">
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Empleado</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Lavandería</th>
                  <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">Horas Semana</th>
                  <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {(data?.employees || []).map((e, idx) => (
                  <tr key={idx} className="odd:bg-gray-50 hover:bg-gray-50/80">
                    <td className="px-3 py-2">
                      {e?.empleado?.nombre || '-'} {e?.empleado?.apellido || ''}
                      <div className="text-xs text-gray-500">{e?.empleado?.cedula || ''}</div>
                    </td>
                    <td className="px-3 py-2">{e?.lavanderia?.nombre || '-'}</td>
                    <td className="px-3 py-2 text-center font-semibold">{e?.weeklyTotal ?? 0}</td>
                    <td className="px-3 py-2 text-center">
                      {e?.flags?.overWeekly && <span title=">44h semana" className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 text-[12px]">⚠️ Semanal</span>}
                      {!e?.flags?.overWeekly && e?.flags?.overDaily && <span title=">10h algún día" className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[12px]">⚠️ Diario</span>}
                      {!e?.flags?.overWeekly && !e?.flags?.overDaily && <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[12px]">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklyOverviewPage;
