import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Filter, Download, CalendarDays, User, Building2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ALL_FILTER_VALUE = "ALL";

const HoursTrackingPage = () => {
  const { timeClockEntries, employees, workplaces } = useData();
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(ALL_FILTER_VALUE);
  const [selectedWorkplace, setSelectedWorkplace] = useState(ALL_FILTER_VALUE);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getEmployeeName = (employeeId) => employees.find(e => e.id === employeeId)?.name || 'Desconocido';
  const getWorkplaceName = (workplaceId) => workplaces.find(w => w.id === workplaceId)?.name || 'Desconocido';

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  const calculateTotalHours = (entryTime, exitTime) => {
    if (!entryTime || !exitTime) return 'N/A';
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffMs = exit - entry;
    if (diffMs < 0) return 'Error';
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  const applyFilters = () => {
    let entries = [...timeClockEntries];

    if (selectedEmployee && selectedEmployee !== ALL_FILTER_VALUE) {
      entries = entries.filter(entry => entry.employeeId === selectedEmployee);
    }
    if (selectedWorkplace && selectedWorkplace !== ALL_FILTER_VALUE) {
      entries = entries.filter(entry => entry.workplaceId === selectedWorkplace);
    }
    if (startDate) {
      entries = entries.filter(entry => new Date(entry.date) >= new Date(startDate));
    }
    if (endDate) {
      entries = entries.filter(entry => new Date(entry.date) <= new Date(endDate));
    }
    setFilteredEntries(entries.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.entryTime) - new Date(a.entryTime)));
  };
  
  useEffect(() => {
    applyFilters();
  }, [timeClockEntries, selectedEmployee, selectedWorkplace, startDate, endDate]);

  const handleExport = () => {
    if (filteredEntries.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    const headers = "Empleado,Lugar de Trabajo,Fecha,Entrada,Salida,Total Horas\n";
    const rows = filteredEntries.map(entry => 
        [
            getEmployeeName(entry.employeeId),
            getWorkplaceName(entry.workplaceId),
            new Date(entry.date).toLocaleDateString('es-ES'),
            formatDateTime(entry.entryTime).split(' ')[1], 
            entry.exitTime ? formatDateTime(entry.exitTime).split(' ')[1] : 'N/A',
            calculateTotalHours(entry.entryTime, entry.exitTime)
        ].join(',')
    ).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "horas_trabajadas.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold gradient-text">Seguimiento de Horas Trabajadas</h1>
        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
          <Download className="mr-2 h-5 w-5" /> Exportar CSV
        </Button>
      </div>
      <p className="text-muted-foreground">
        Consulta y filtra las horas trabajadas por empleado, lugar de trabajo o rango de fechas.
      </p>

      <Card className="card-gradient-bg shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary-foreground flex items-center"><Filter className="mr-2 h-5 w-5"/>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="filter-employee" className="text-primary-foreground/80">Empleado</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="filter-employee" className="w-full bg-background/50 border-border focus:border-primary">
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                <SelectItem value={ALL_FILTER_VALUE}>Todos los empleados</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-workplace" className="text-primary-foreground/80">Lugar de Trabajo</Label>
            <Select value={selectedWorkplace} onValueChange={setSelectedWorkplace}>
              <SelectTrigger id="filter-workplace" className="w-full bg-background/50 border-border focus:border-primary">
                <SelectValue placeholder="Todos los lugares" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                <SelectItem value={ALL_FILTER_VALUE}>Todos los lugares</SelectItem>
                {workplaces.map(wp => (
                  <SelectItem key={wp.id} value={wp.id}>{wp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-startDate" className="text-primary-foreground/80">Fecha Inicio</Label>
            <Input id="filter-startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background/50 border-border focus:border-primary" />
          </div>
          <div>
            <Label htmlFor="filter-endDate" className="text-primary-foreground/80">Fecha Fin</Label>
            <Input id="filter-endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-background/50 border-border focus:border-primary" />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={applyFilters} variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto">
                <Filter className="mr-2 h-5 w-5" /> Aplicar Filtros
            </Button>
        </CardFooter>
      </Card>
      
      {filteredEntries.length === 0 ? (
        <div className="card-gradient-bg p-8 rounded-lg shadow-xl text-center">
          <img  
            alt="Gráfico de ejemplo de horas trabajadas" 
            class="w-full md:w-3/4 lg:w-1/2 mx-auto mb-4 rounded"
           src="https://images.unsplash.com/photo-1595383892613-3831355376c0" />
          <h2 className="text-2xl font-semibold text-primary-foreground mb-2">No hay datos para mostrar.</h2>
          <p className="text-muted-foreground mb-4">Aplica filtros para ver el seguimiento de horas o registra actividad laboral en la sección de Fichaje.</p>
        </div>
      ) : (
        <Card className="card-gradient-bg shadow-lg">
            <CardHeader>
                <CardTitle className="text-primary-foreground">Resultados</CardTitle>
                <CardDescription className="text-muted-foreground">Total de {filteredEntries.length} registros encontrados.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="text-primary-foreground/90"><User className="inline mr-1 h-4 w-4"/>Empleado</TableHead>
                            <TableHead className="text-primary-foreground/90"><Building2 className="inline mr-1 h-4 w-4"/>Lugar</TableHead>
                            <TableHead className="text-primary-foreground/90"><CalendarDays className="inline mr-1 h-4 w-4"/>Fecha</TableHead>
                            <TableHead className="text-primary-foreground/90"><Clock className="inline mr-1 h-4 w-4"/>Entrada</TableHead>
                            <TableHead className="text-primary-foreground/90"><Clock className="inline mr-1 h-4 w-4"/>Salida</TableHead>
                            <TableHead className="text-primary-foreground/90"><Clock className="inline mr-1 h-4 w-4"/>Total Horas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEntries.map(entry => (
                            <TableRow key={entry.id} className="border-border/30 hover:bg-primary/5">
                                <TableCell className="font-medium text-primary-foreground/80">{getEmployeeName(entry.employeeId)}</TableCell>
                                <TableCell className="text-muted-foreground">{getWorkplaceName(entry.workplaceId)}</TableCell>
                                <TableCell className="text-muted-foreground">{new Date(entry.date).toLocaleDateString('es-ES')}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDateTime(entry.entryTime).split(' ')[1]}</TableCell>
                                <TableCell className="text-muted-foreground">{entry.exitTime ? formatDateTime(entry.exitTime).split(' ')[1] : 'Pendiente'}</TableCell>
                                <TableCell className="font-semibold text-primary-foreground/80">{calculateTotalHours(entry.entryTime, entry.exitTime)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default HoursTrackingPage;