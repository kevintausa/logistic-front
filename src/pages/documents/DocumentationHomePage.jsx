import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Building2, Users, Folder, LayoutGrid, List } from 'lucide-react';
import { useAuth, MODULES } from '@/contexts/AuthContext';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';
import { Button } from '@/components/ui/button';

export default function DocumentationHomePage() {
  const { hasPermission } = useAuth();
  const hasDocs = hasPermission(MODULES.DOCUMENTATION);
  const canEmployees = hasDocs || hasPermission(MODULES.EMPLOYEES);
  const canWorkplaces = hasDocs || hasPermission(MODULES.WORKPLACES);
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    try {
      const saved = localStorage.getItem('docs:view');
      if (saved === 'grid' || saved === 'list') setView(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('docs:view', view);
    } catch {}
  }, [view]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Documentación</h1>
          <p className="text-sm text-muted-foreground">Explora las carpetas de documentación.</p>
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

      {view === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {canEmployees && (
            <Link to="/documentacion/empleados" className="group">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="relative">
                    <Folder className="h-12 w-12 text-yellow-500" />
                    <Users className="h-4 w-4 text-foreground absolute -right-1 -bottom-1" />
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary">Empleados</div>
                    <div className="text-xs text-muted-foreground">ARL, certificaciones, etc.</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {canWorkplaces && (
            <Link to="/documentacion/centros" className="group">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="relative">
                    <Folder className="h-12 w-12 text-blue-500" />
                    <Building2 className="h-4 w-4 text-foreground absolute -right-1 -bottom-1" />
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary">Centros de Lavado</div>
                    <div className="text-xs text-muted-foreground">Fichas técnicas y seguridad.</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {canEmployees && (
            <Link to="/documentacion/empleados" className="block hover:bg-muted/40">
              <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
                <div className="relative">
                  <Folder className="h-6 w-6 text-yellow-500" />
                  <Users className="h-3 w-3 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">Empleados</div>
                  <div className="text-xs text-muted-foreground truncate">ARL, certificaciones, etc.</div>
                </div>
              </div>
            </Link>
          )}
          {canWorkplaces && (
            <Link to="/documentacion/centros" className="block hover:bg-muted/40">
              <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
                <div className="relative">
                  <Folder className="h-6 w-6 text-blue-500" />
                  <Building2 className="h-3 w-3 text-foreground absolute -right-1 -bottom-1" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">Centros de Lavado</div>
                  <div className="text-xs text-muted-foreground truncate">Fichas técnicas y seguridad.</div>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {!canEmployees && !canWorkplaces && (
        <div className="text-sm text-muted-foreground">No tienes permisos para ver módulos de Documentación.</div>
      )}
    </div>
  );
}
