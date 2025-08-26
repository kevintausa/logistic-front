import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Folder, Building2, Shield, FileText, Wrench, LayoutGrid, List } from 'lucide-react';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';
import { Button } from '@/components/ui/button';

export default function CentersDocsHome() {
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    // Cargar preferencia guardada
    try {
      const saved = localStorage.getItem('centers:view');
      if (saved === 'grid' || saved === 'list') setView(saved);
    } catch {}

    // Laundries feature removed: no fetch. Keep UI without data.
    setLoading(false);
    setWorkplaces([]);
  }, []);

  useEffect(() => {
    // Guardar preferencia
    try {
      localStorage.setItem('centers:view', view);
    } catch {}
  }, [view]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to="/documentacion" className="hover:underline">Documentación</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Centros de Lavado</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Centros de Lavado</h1>
          <p className="text-sm text-muted-foreground">Gestiona documentación por centro.</p>
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

      {/* Contenido: Grid o Lista */}
      {view === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="text-sm text-muted-foreground">Cargando centros...</div>
          )}
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          {/* Lista de centros como carpetas */}
          {workplaces.map(wp => (
            <Link key={wp._id || wp.id} to={`/documentacion/centros/${wp._id || wp.id}`} className="group">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="relative">
                    <Folder className="h-12 w-12 text-blue-500" />
                    <Building2 className="h-4 w-4 text-foreground absolute -right-1 -bottom-1" />
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary">{wp.nombre || wp.name}</div>
                    {(wp.direccion || wp.address) && (
                      <div className="text-xs text-muted-foreground">{wp.direccion || wp.address}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {loading && (
            <div className="text-sm text-muted-foreground p-3">Cargando centros...</div>
          )}
          {error && (
            <div className="text-sm text-destructive p-3">{error}</div>
          )}
          {workplaces.map(wp => (
            <Link key={wp._id || wp.id} to={`/documentacion/centros/${wp._id || wp.id}`} className="block hover:bg-muted/40">
              <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
                <div className="relative">
                  <Folder className="h-6 w-6 text-blue-500" />
                  <Building2 className="h-3 w-3 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{wp.nombre || wp.name}</div>
                  {(wp.direccion || wp.address) && (
                    <div className="text-xs text-muted-foreground truncate">{wp.direccion || wp.address}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
