import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, MapPin, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';
import { useToast } from "@/components/ui/use-toast";

const TimeClockPage = () => {
  const { employees, workplaces, timeClockActions, timeClockEntries } = useData();
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Detectando...');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [lastEntry, setLastEntry] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`);
        },
        () => {
          setCurrentLocation('Ubicación no disponible');
        }
      );
    } else {
      setCurrentLocation('Geolocalización no soportada');
    }
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      const employeeEntries = timeClockEntries
        .filter(entry => entry.employeeId === selectedEmployeeId)
        .sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
      
      if (employeeEntries.length > 0) {
        const latestEntry = employeeEntries[0];
        setLastEntry(latestEntry);
        setIsClockedIn(!!latestEntry.entryTime && !latestEntry.exitTime);
      } else {
        setLastEntry(null);
        setIsClockedIn(false);
      }
    } else {
        setLastEntry(null);
        setIsClockedIn(false);
    }
  }, [selectedEmployeeId, timeClockEntries]);


  const handleClockIn = () => {
    if (!selectedEmployeeId) {
      toast({ title: "Error", description: "Por favor, selecciona un empleado.", variant: "destructive" });
      return;
    }
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) {
      toast({ title: "Error", description: "Empleado no encontrado.", variant: "destructive" });
      return;
    }

    const newEntry = {
      employeeId: selectedEmployeeId,
      workplaceId: employee.workplaceId,
      entryTime: new Date().toISOString(),
      exitTime: null,
      date: new Date().toISOString().split('T')[0],
      locationIn: currentLocation,
    };
    timeClockActions.create(newEntry);
    setIsClockedIn(true);
    toast({ title: "Entrada Marcada", description: `${employee.name} ha marcado su entrada.` });
  };

  const handleClockOut = () => {
    if (!selectedEmployeeId || !lastEntry || lastEntry.exitTime) {
      toast({ title: "Error", description: "No hay una entrada activa para este empleado.", variant: "destructive" });
      return;
    }
     const employee = employees.find(e => e.id === selectedEmployeeId);
    timeClockActions.update(lastEntry.id, { exitTime: new Date().toISOString(), locationOut: currentLocation });
    setIsClockedIn(false);
    toast({ title: "Salida Marcada", description: `${employee.name} ha marcado su salida.` });
  };
  
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const workplaceName = selectedEmployee ? workplaces.find(w => w.id === selectedEmployee.workplaceId)?.name : 'N/A';

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  
  const calculateHoursToday = () => {
    if (!lastEntry || !lastEntry.exitTime) return '0h 0m';
    const entry = new Date(lastEntry.entryTime);
    const exit = new Date(lastEntry.exitTime);
    const diffMs = exit - entry;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 flex flex-col items-center"
    >
      <h1 className="text-3xl font-bold gradient-text text-center">Registro de Jornada Laboral</h1>
      <p className="text-muted-foreground text-center max-w-xl px-4 sm:px-0">
        Selecciona tu nombre, marca tu entrada al llegar y tu salida al finalizar. Tu ubicación actual puede ser registrada.
      </p>

      <Card className="w-full max-w-md card-gradient-bg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary-foreground flex items-center justify-center">
            <User className="mr-2 h-7 w-7" /> Fichaje
          </CardTitle>
          <div className="pt-4">
            <Label htmlFor="employee-select" className="sr-only">Seleccionar Empleado</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger id="employee-select" className="w-full bg-background/70 border-border focus:border-primary text-base py-3">
                <SelectValue placeholder="Selecciona tu nombre" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id} className="text-base">{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           {selectedEmployee && (
            <CardDescription className="text-muted-foreground pt-2">
              Lugar: {workplaceName}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{currentLocation}</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white py-6 sm:py-8 text-lg disabled:opacity-50"
              onClick={handleClockIn}
              disabled={!selectedEmployeeId || isClockedIn}
            >
              <LogIn className="mr-2 h-6 w-6" /> Marcar Entrada
            </Button>
            <Button 
              size="lg" 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 text-white py-6 sm:py-8 text-lg disabled:opacity-50"
              onClick={handleClockOut}
              disabled={!selectedEmployeeId || !isClockedIn}
            >
              <LogOut className="mr-2 h-6 w-6" /> Marcar Salida
            </Button>
          </div>
          
          {isClockedIn && lastEntry && (
            <div className="text-center pt-4 text-green-400 font-semibold flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5" /> Entrada Marcada a las {formatTime(lastEntry.entryTime)}
            </div>
          )}

          {lastEntry && (
             <div className="text-center pt-2">
                <p className="text-sm text-primary-foreground">
                    Último fichaje: {formatTime(lastEntry.entryTime)} - {formatTime(lastEntry.exitTime)} ({new Date(lastEntry.date).toLocaleDateString()})
                </p>
                <p className="text-xs text-muted-foreground">Total horas: {calculateHoursToday()}</p>
            </div>
          )}

        </CardContent>
      </Card>
      <img  
        alt="Calendario con marcas de fichaje" 
        class="w-full max-w-xs sm:max-w-sm mx-auto mt-8 rounded-lg shadow-md" src="https://images.unsplash.com/photo-1692158962119-8103c7d78c86" />
    </motion.div>
  );
};

export default TimeClockPage;