import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageSearch, LogIn } from 'lucide-react';

function HomePublic() {
  return (
    <div className="mx-auto max-w-5xl py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">Bienvenido a Logística Internacional</h1>
        <p className="text-muted-foreground mt-1">Seleccione una opción para continuar</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5" /> Seguimiento de Carga
            </CardTitle>
            <CardDescription>
              Consulta el estado de tu carga con el N° de trazabilidad y NIT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/tracking">
              <Button className="w-full bg-sky-600 hover:bg-sky-700">Ir a trazabilidad</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Ingreso de Usuarios
            </CardTitle>
            <CardDescription>
              Acceso al sistema para usuarios internos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button variant="secondary" className="w-full">Ir al login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default HomePublic;
