import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkedHours } from '@/pages/workedHours/services/workedHours.services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Página: Mis Registros (Operario) - Responsive para móvil
const ITEMS_PER_PAGE = 31;

const OperatorRecordsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`; // formato para input type="month"
  });

  const getUserCedula = useCallback(() => {
    return user?.raw?.cedula || user?.raw?.empleado?.cedula || user?.cedula || null;
  }, [user]);

  const formatAmPm = (hhmm) => {
    if (!hhmm) return '-';
    const [h, m] = String(hhmm).split(':').map((n) => parseInt(n || '0', 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return String(hhmm);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);

  const loadData = useCallback(async (targetPage = 1) => {
    const cedula = getUserCedula();
    if (!cedula) return;
    setLoading(true);
    try {
      // Determinar primer y último día del mes seleccionado
      const [yStr, mStr] = month.split('-');
      const y = parseInt(yStr, 10);
      const mIdx = parseInt(mStr, 10) - 1; // 0-11
      const firstDay = new Date(y, mIdx, 1);
      const lastDay = new Date(y, mIdx + 1, 0);

      // Construir rango con ventana 05:00 a 04:59:59 (día siguiente) en hora local
      const start = new Date(firstDay);
      start.setHours(5, 0, 0, 0); // 05:00:00
      const end = new Date(lastDay);
      end.setDate(end.getDate() + 1); // día siguiente al último
      end.setHours(5, 0, 0, 0); // 05:00
      end.setSeconds(end.getSeconds() - 1); // 04:59:59

      const query = {
        'empleado.cedula': cedula,
        fecha: {
          $gte: start.toISOString(),
          $lte: end.toISOString(),
        },
      };
      const { data: responseData, totalRecords } = await fetchWorkedHours({ limit: ITEMS_PER_PAGE, page: targetPage, query });
      setRecords(Array.isArray(responseData) ? responseData : []);
      setTotal(totalRecords || 0);
    } catch (e) {
      console.error('Error cargando registros del operario:', e);
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [month, getUserCedula]);

  useEffect(() => {
    setPage(1);
    loadData(1);
  }, [month, loadData]);

  const handleApplyMonth = () => loadData(1);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <Button asChild variant="outline">
          <Link to="/operario-dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold">Mis Registros</h1>
      <p className="text-muted-foreground">Consulta el historial de tus horas trabajadas.</p>

      {/* Filtro por mes */}
      <div className="rounded-md border bg-background p-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-3">
            <Label>Mes</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button className="w-full" onClick={handleApplyMonth} disabled={loading}>Aplicar</Button>
          </div>
        </div>
      </div>

      {/* Lista responsive */}
      <div className="rounded-md border bg-background">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
        ) : records.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No hay registros para el rango seleccionado.</div>
        ) : (
          <ul className="divide-y">
            {records.map((r) => (
              <li key={r._id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ingreso: {formatAmPm(r.horaIngreso)} • Salida: {r.horaSalida ? formatAmPm(r.horaSalida) : 'Pendiente'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div>
                      <span className="font-medium">Total: </span>
                      {r.totalHorasTrabajadas?.toFixed(2) ?? '0.00'} h
                    </div>
                    <div>
                      <span className="font-medium">Autorizado: </span>
                      {r.totalHorasAutorizadas?.toFixed(2) ?? '—'} h
                    </div>
                    <div>
                      <span className="font-medium">Estado: </span>
                      {r.isAprobado ? 'Aprobado' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Página {page} de {totalPages} • {total} registros
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); loadData(p); }}
            disabled={loading || page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); loadData(p); }}
            disabled={loading || page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OperatorRecordsPage;
