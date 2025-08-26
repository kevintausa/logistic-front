import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ListChecks } from 'lucide-react';

// Lista los turnos planificados del operador.
const MyShiftsCard = ({ onViewCalendar }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Mis Turnos
        </CardTitle>
        <CardDescription>Turnos planificados por tu supervisor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">No hay turnos para mostrar.</div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onViewCalendar}>
          <ListChecks className="h-4 w-4" /> Ver calendario de turnos
        </Button>
      </CardContent>
    </Card>
  );
};

export default MyShiftsCard;
