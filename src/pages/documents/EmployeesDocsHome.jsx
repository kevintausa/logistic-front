import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Folder, Users, FileBadge2, ShieldCheck, FileText, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchEmployees } from '@/pages/parametrizacion/employees/Services/employees.services';
import { fetchLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import { Input } from '@/components/ui/input';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';

export default function EmployeesDocsHome() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [laundries, setLaundries] = useState([]);
  const [centerId, setCenterId] = useState('');
  const [cedula, setCedula] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = { estado: 'Activo' };
        if (centerId) query['lavanderia.id'] = centerId;
        const { data } = await fetchEmployees({ limit: 200, offset: 1, query });
        setEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || 'No se pudo cargar la lista de empleados');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [centerId]);

  useEffect(() => {
    const loadLaundries = async () => {
      try {
        const { data } = await fetchLaundries({ limit: 100, offset: 1, query: {} });
        setLaundries(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    };
    loadLaundries();
  }, []);

  

  const displayedEmployees = useMemo(() => {
    const term = cedula.trim();
    if (!term) return employees;
    return employees.filter(emp => {
      const ced = emp?.documento || emp?.numeroDocumento || emp?.cedula || emp?.identificacion || '';
      return String(ced).toLowerCase().includes(term.toLowerCase());
    });
  }, [employees, cedula]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to="/documentacion" className="hover:underline">Documentación</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Empleados</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Empleados</h1>
          <p className="text-sm text-muted-foreground">Gestiona la documentación de empleados.</p>
          <StorageUsageIndicator />
        </div>
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('grid')}
            className="h-8"
            title="Vista de cuadrícula"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
            className="h-8"
            title="Vista de lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Centro de Lavado</label>
          <select
            className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm"
            value={centerId}
            onChange={e => setCenterId(e.target.value)}
          >
            <option value="">Todos</option>
            {laundries.map(l => (
              <option key={l._id || l.id} value={l._id || l.id}>{l.nombre || l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cédula</label>
          <Input
            className="mt-1 h-9"
            placeholder="Buscar por cédula"
            value={cedula}
            onChange={e => setCedula(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading && <div className="text-sm text-muted-foreground">Cargando empleados...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {view === 'grid' ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {displayedEmployees.map(emp => (
            <Link key={emp._id || emp.id} to={`/documentacion/empleados/${emp._id || emp.id}`} className="group">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <Folder className="h-9 w-9 sm:h-12 sm:w-12 text-yellow-500" />
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground absolute -right-1 -bottom-1" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium group-hover:text-primary truncate">
                      {(emp.nombre || emp.name || '') + (emp.apellidos || emp.apellido || emp.lastName ? ` ${emp.apellidos || emp.apellido || emp.lastName}` : '')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {emp.cargo || ''}
                      {(() => {
                        const doc = emp.documento || emp.numeroDocumento || emp.cedula || emp.identificacion;
                        return doc ? ` · ${doc}` : '';
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Comunicados (placeholder) */}
          <div className="group">
            <Card className="transition-colors hover:bg-muted/50 cursor-default">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Folder className="h-9 w-9 sm:h-12 sm:w-12 text-blue-500" />
                  <FileBadge2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-primary">Comunicados</div>
                  <div className="text-xs text-muted-foreground">Comunicados (Aparecen a todos los empleados).</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Otros documentos (placeholder) */}
          <div className="group">
            <Card className="transition-colors hover:bg-muted/50 cursor-default">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Folder className="h-9 w-9 sm:h-12 sm:w-12 text-purple-500" />
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-primary">Otros</div>
                  <div className="text-xs text-muted-foreground">Adjuntos varios por empleado.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {displayedEmployees.map(emp => (
            <Link key={emp._id || emp.id} to={`/documentacion/empleados/${emp._id || emp.id}`} className="block hover:bg-muted/40">
              <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
                <div className="relative">
                  <Folder className="h-6 w-6 text-yellow-500" />
                  <Users className="h-3 w-3 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {(emp.nombre || emp.name || '') + (emp.apellidos || emp.apellido || emp.lastName ? ` ${emp.apellidos || emp.apellido || emp.lastName}` : '')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {emp.cargo || ''}
                    {(() => {
                      const doc = emp.documento || emp.numeroDocumento || emp.cedula || emp.identificacion;
                      return doc ? ` · ${doc}` : '';
                    })()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
