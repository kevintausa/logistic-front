import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Folder, Users, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchClients } from '@/pages/parametrizacion/clients/Services/clients.services.jsx';
import { Input } from '@/components/ui/input';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';

export default function ClientsDocsHome() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = { estado: 'Activo' };
        const { data } = await fetchClients({ limit: 200, offset: 1, query });
        setClients(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || 'No se pudo cargar la lista de clientes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayedClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      const name = `${c?.nombre || c?.name || ''} ${c?.apellidos || c?.apellido || c?.lastName || ''}`.toLowerCase();
      const nit = String(c?.nit || c?.documento || c?.identificacion || '').toLowerCase();
      return name.includes(term) || nit.includes(term);
    });
  }, [clients, search]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to="/documentacion" className="hover:underline">Documentación</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Clientes</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona la documentación por cliente.</p>
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
        <div className="sm:col-span-1">
          <label className="text-xs text-muted-foreground">Buscar</label>
          <Input
            className="mt-1 h-9"
            placeholder="Nombre o NIT"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading && <div className="text-sm text-muted-foreground">Cargando clientes...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {view === 'grid' ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {displayedClients.map((c) => (
            <Link key={c._id || c.id} to={`/documentacion/clientes/${c._id || c.id}`} className="group">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <Folder className="h-9 w-9 sm:h-12 sm:w-12 text-emerald-500" />
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground absolute -right-1 -bottom-1" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium group-hover:text-primary truncate">
                      {c?.nombre || c?.name || 'Cliente'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {(() => {
                        const doc = c?.nit || c?.documento || c?.identificacion;
                        return doc ? `NIT: ${doc}` : '';
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {displayedClients.map((c) => (
            <Link key={c._id || c.id} to={`/documentacion/clientes/${c._id || c.id}`} className="block hover:bg-muted/40">
              <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
                <div className="relative">
                  <Folder className="h-6 w-6 text-emerald-500" />
                  <Users className="h-3 w-3 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c?.nombre || c?.name || 'Cliente'}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {(() => {
                      const doc = c?.nit || c?.documento || c?.identificacion;
                      return doc ? `NIT: ${doc}` : '';
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
