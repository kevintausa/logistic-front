import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, FilterIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

import ClockInDialog from './components/ClockInDialog';
import ClockOutDialog from './components/ClockOutDialog';
import AuthorizationDialog from './components/AuthorizationDialog';
import ActiveEmployees from './components/ActiveEmployees';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import AppliedFilters from '@/components/AppliedFilters';

import { workedHoursColumns, workedHoursColumnsExcel, workedHoursDataMapper } from './utils/workedHoursColumns.jsx';
import { getWorkedHours, exportWorkedHours, fetchWorkedHours, getWorkedHoursSummary, getAllEmployees } from './services/workedHours.services';


const ITEMS_PER_PAGE = 10;

const WorkedHoursPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [clockOutRecord, setClockOutRecord] = useState(null);
  const [authorizationRecord, setAuthorizationRecord] = useState(null);
  const [summary, setSummary] = useState({ totalHorasTrabajadas: 0, totalHorasAutorizadas: 0 });
  const [employeeOptions, setEmployeeOptions] = useState([]);
 
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
 
  const [filters, setFilters] = useState({
    fecha: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { idLavanderia } = useParams();
  const { toast } = useToast();

  const activeEmployees = useMemo(() => {
    return records.filter(record => record.horaIngreso && !record.horaSalida);
  }, [records]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleAction = (actionKey, record) => {
    if (actionKey === 'edit') {
      setClockOutRecord(record);
    } else if (actionKey === 'authorize') {
      setAuthorizationRecord(record);
    }
  };

  const dynamicColumns = useMemo(() => {
    return workedHoursColumns.map(col => {
      if (col.id === 'empleado.nombre') {
        return { ...col, options: employeeOptions };
      }
      return col;
    });
  }, [employeeOptions]);

  const fetchRecords = async () => {
    if (!idLavanderia) return;
    setLoading(true);
    try {
      const query = {
        "lavanderia.id": idLavanderia,
        ...filters
      };
      const { data: responseData, totalRecords } = await fetchWorkedHours({limit: ITEMS_PER_PAGE, page: currentPage, query});
      setRecords(responseData || []);
      setTotalItems(totalRecords || 0);
    } catch (error) {
      console.error('Error fetching worked hours:', error);
      setRecords([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 500);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [idLavanderia, debouncedFilters, currentPage]);

  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!idLavanderia) return;
      try {
        const query = {
          "lavanderia.id": idLavanderia,
          ...debouncedFilters,
        };
        const summaryData = await getWorkedHoursSummary(query);
        setSummary(summaryData.data || { totalHorasTrabajadas: 0, totalHorasAutorizadas: 0 });
      } catch (error) {
        console.error('Error fetching summary:', error);
        setSummary({ totalHorasTrabajadas: 0, totalHorasAutorizadas: 0 });
      }
    };

    fetchSummaryData();
  }, [idLavanderia, debouncedFilters]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const employees = await getAllEmployees();
        const options = employees.map(emp => ({
          value: `${emp.nombre} ${emp.apellido}`,
          label: `${emp.nombre} ${emp.apellido}`,
        }));
        setEmployeeOptions([{ value: '', label: 'Todos los empleados' }, ...options]);
      } catch (error) {
        toast({
          title: 'Error al cargar filtros',
          description: 'No se pudo obtener la lista de empleados.',
          variant: 'destructive',
        });
      }
    };

    fetchFilterOptions();
  }, [toast]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRemoveFilter = (key) => {
    setCurrentPage(1);
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="p-4 md:p-6 lg:p-8"
    >
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to={`/centros-lavado/${idLavanderia}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas Trabajadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHorasTrabajadas?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Calculadas al registrar salida</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas Autorizadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHorasAutorizadas?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Ajustadas y aprobadas por supervisor</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Horas Trabajadas</CardTitle>
              <CardDescription>
                Control de tiempo y asistencia del personal (Escritorio).
              </CardDescription>
            </div>
            <ActiveEmployees employees={activeEmployees} />
            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={() => setIsFilterOpen(true)} variant="outline"><FilterIcon className="h-4 w-4 mr-2" />Filtrar</Button>
              <ExportExcelButton 
                service={exportWorkedHours} 
                filters={filters}
                columns={workedHoursColumnsExcel}
                fileName="Horas_Trabajadas"
                dataMapper={workedHoursDataMapper}
              />
              <ClockInDialog onClockIn={fetchRecords} idLavanderia={idLavanderia} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <AppliedFilters 
            filters={filters}
            fields={workedHoursColumns.filter(c => c.isFilter)}
            onRemoveFilter={handleRemoveFilter}
            ignoreKeys={['nombre']}
          />
          <div className="flex justify-between items-center mb-4">
            
          </div>
          <DataTable 
            data={records} 
            columns={dynamicColumns}
            isLoading={loading}
            onAction={handleAction}
            onImageClick={handleImageClick}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}

          />
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Foto de Llegada</DialogTitle>
              </DialogHeader>
              <img src={selectedImage} alt="Foto de llegada en tamaño completo" className="w-full h-auto rounded-md" />
            </DialogContent>
          </Dialog>

          <ClockOutDialog 
            isOpen={!!clockOutRecord}
            record={clockOutRecord}
            onClose={() => setClockOutRecord(null)}
            onSuccess={() => {
              fetchRecords();
              setClockOutRecord(null);
            }}
          />

          <AuthorizationDialog 
            isOpen={!!authorizationRecord}
            record={authorizationRecord}
            onClose={() => setAuthorizationRecord(null)}
            onSuccess={() => {
              fetchRecords();
              setAuthorizationRecord(null);
            }}
          />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isFilterOpen && (
          <FilterDrawer
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            fields={dynamicColumns.filter(c => c.isFilter)}
            initialFilters={filters}
            onApply={handleFilterChange}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkedHoursPage;
