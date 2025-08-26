import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

// Muestra acciones para registrar llegada y ver registros del operador.
// Próximo: integrar captura con cámara (react-webcam) y tabla de "Mis Registros".
const SelfClockInCard = ({ onClockIn, onViewRecords }) => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Registro de Horas
          </CardTitle>
          <CardDescription>Registra tu llegada con foto y revisa tus últimos registros.</CardDescription>
        </div>
        <span className="text-xs text-muted-foreground">Con foto de evidencia</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={onClockIn}>Registrar Llegada</Button>
          <Button variant="outline" onClick={onViewRecords}>Ver mis registros</Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Próximamente: listado de tus últimos registros aquí.
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfClockInCard;
