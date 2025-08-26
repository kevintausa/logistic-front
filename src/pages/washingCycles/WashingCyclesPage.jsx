import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleSlash, PlusCircle, FilterIcon, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ui/use-toast';
import { washingCyclesColumns, columnsExcel } from './utils/washingCyclesColumns';
import { fetchWashingCycles, createWashingCycle, updateWashingCycle, deleteWashingCycle, exportWashingCycles } from './services/washingCycles.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import AppliedFilters from '@/components/AppliedFilters';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { fetchMachines } from '@/pages/parametrizacion/machines/Services/machines.services';

const ITEMS_PER_PAGE = 10;

const WashingCyclesPage = () => {
  const { idLavanderia } = useParams();
  const { toast } = useToast();
  const { isAdmin } = useAuth(); // Obtener función para verificar si es administrador
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [laundryName, setLaundryName] = useState('');

  // Obtener la fecha de hoy en formato ISO para el filtro
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Inicializar filtros con la fecha actual y el ID de lavandería
  const [filters, setFilters] = useState({
    lavanderia: {
      id: idLavanderia,
    },
    fecha: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [machines, setMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [columns, setColumns] = useState([]);
  const [excelColumns, setExcelColumns] = useState(columnsExcel);
  const [machineCounters, setMachineCounters] = useState({});
  const [newCounterValues, setNewCounterValues] = useState({});

  const buildQuery = (filters) => {
    const query = { ...filters };
    if (query.maquina && typeof query.maquina === 'string') {
      query['maquina.id'] = query.maquina;
      delete query.maquina;
    }
    return query;
  };

  const fetchAndSetWashingCycles = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = buildQuery(filters);
      const response = await fetchWashingCycles({
        limit: ITEMS_PER_PAGE,
        page: currentPage,
        query: query
      });

      const data = response?.data || [];
      const totalRecords = response?.totalRecords || 0;

      setDisplayedData(Array.isArray(data) ? data : []);
      setTotalItems(totalRecords);
    } catch (error) {
      setDisplayedData([]); // En caso de error, asegurar que siga siendo un array
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron obtener los ciclos de lavado.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  // Cargar datos iniciales y configurar columnas
  useEffect(() => {
    const initialize = async () => {
      setLoadingMachines(true);
      try {
        const response = await fetchMachines({
          limit: 100,
          offset: 1,
          query: { "lavanderia.id": idLavanderia }
        });

        if (response && response.data) {
          const fetchedMachines = response.data;
          setMachines(fetchedMachines);

          // Inicializar contadores
          const countersData = {};
          const newCounters = {};
          fetchedMachines.forEach(machine => {
            countersData[machine._id] = machine.contador || 0;
            newCounters[machine._id] = machine.contador || 0;
          });

          if (fetchedMachines.length > 0) {
            setLaundryName(fetchedMachines[0].lavanderia.nombre);
          }

          setMachineCounters(countersData);
          setNewCounterValues(newCounters);

          // Configurar las columnas con los datos de las máquinas
          const machineOptions = fetchedMachines.map(machine => ({
            label: machine.nombre,
            value: machine._id
          }));

          const updatedColumns = [...washingCyclesColumns].map(column => {
            if (column.id === 'maquina') {
              return {
                ...column,
                options: machineOptions,
                onChange: (selected, formData) => {
                  if (selected && formData) {
                    const capacidad = selected.value.capacidad || 0;
                    const ciclos = formData.ciclos || 0;
                    return {
                      ...formData,
                      capacidad: capacidad,
                      kilosLavados: capacidad * ciclos
                    };
                  }
                  return formData;
                }
              };
            }

            if (column.id === 'ciclos') {
              return {
                ...column,
                onChange: (value, formData) => {
                  if (formData && formData.capacidad) {
                    const ciclos = value || 0;
                    const capacidad = formData.capacidad || 0;
                    return {
                      ...formData,
                      kilosLavados: capacidad * ciclos
                    };
                  }
                  return formData;
                }
              };
            }

            return column;
          });

          setColumns(updatedColumns);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudieron cargar las máquinas.',
          variant: 'destructive'
        });
      } finally {
        setLoadingMachines(false);
      }
    };

    initialize();
  }, [idLavanderia, toast]);

  // Efecto para cargar los ciclos de lavado cuando cambian los filtros o la página
  useEffect(() => {
    fetchAndSetWashingCycles();
  }, [fetchAndSetWashingCycles]);

  const handleSaveItem = async (itemData) => {
    try {
      setIsLoading(true);
      
      // Normalizar máquina a objeto { id, nombre }
      let maquinaObj = null;
      const mv = itemData.maquina;
      if (mv) {
        if (typeof mv === 'object') {
          const id = mv.id || mv._id;
          const nombre = mv.nombre || machines.find(m => m._id === id || m.id === id)?.nombre || '';
          maquinaObj = id ? { id, nombre } : null;
        } else {
          // mv es un string (id)
          const mach = machines.find(m => m._id === mv || m.id === mv);
          maquinaObj = { id: mv, nombre: mach?.nombre || '' };
        }
      }

      // Crear objeto con formato adecuado para la API
      const formattedData = {
        ...itemData,
        maquina: maquinaObj || null,
        fecha: new Date(new Date(itemData.fecha || new Date()).setHours(12, 0, 0, 0)).toISOString(),
        lavanderia: itemData.lavanderia || { id: idLavanderia, nombre: laundryName }
      };

      // Determinar si es creación desde tarjeta o desde modal
      const isCardSave = !modalMode || modalMode === '' || modalMode === 'create' && !currentItem;
      
      if (isCardSave) {
        // Crear nuevo ciclo
        await createWashingCycle(formattedData);
        toast({ title: 'Éxito', description: 'Ciclos registrados correctamente' });

        // Si el guardado proviene de una tarjeta de máquina, actualizar el contador local
        if (itemData.maquina && itemData.maquina.id && newCounterValues[itemData.maquina.id]) {
          // Actualizar el contador en el estado
          setMachineCounters(prev => ({
            ...prev,
            [itemData.maquina.id]: newCounterValues[itemData.maquina.id]
          }));

          // También actualizar las máquinas para reflejar el nuevo contador
          setMachines(prev => prev.map(machine => {
            if (machine._id === itemData.maquina.id) {
              return {
                ...machine,
                contador: newCounterValues[itemData.maquina.id]
              };
            }
            return machine;
          }));
        }
      } else if (modalMode === 'create') {
        // Crear desde modal
        await createWashingCycle(formattedData);
        toast({ title: 'Éxito', description: 'Ciclos registrados correctamente' });
      } else {
        // Para actualización, conservar el ID del elemento actual
        await updateWashingCycle(currentItem._id, formattedData);
        toast({ title: 'Éxito', description: 'Ciclos actualizados correctamente' });
      }

      // Cerrar modal y refrescar datos
      setIsModalOpen(false);
      setCurrentItem(null);
      setModalMode('');  // Reset modal mode
      fetchAndSetWashingCycles();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar los datos.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenModal = (mode, item = null) => {
    // Verificar si el usuario es administrador para modo edición
    if (mode === 'edit' && !isAdmin()) {
      toast({
        title: "Acceso restringido",
        description: "Solo los administradores pueden editar registros.",
        variant: "destructive",
      });
      return;
    }
    
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleDeleteConfirmation = (item) => {
    // Verificar si el usuario es administrador para eliminar
    if (!isAdmin()) {
      toast({
        title: "Acceso restringido",
        description: "Solo los administradores pueden eliminar registros.",
        variant: "destructive",
      });
      return;
    }
    
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      if (itemToDelete) {
        const response = await deleteWashingCycle(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: "Ciclo eliminado", description: "El registro fue eliminado correctamente." });
          fetchAndSetWashingCycles();
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar el registro.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error eliminando ciclo:", error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al eliminar el registro.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAction = (actionType, row) => {
    switch (actionType) {
      case 'edit':
        handleOpenModal('edit', row);
        break;
      case 'delete':
        handleDeleteConfirmation(row);
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1);
    setFilters({ ...newFilters, idLavanderia });
  };

  const handleRemoveFilter = (key) => {
    setCurrentPage(1);
    const newFilters = { ...filters };
    if (key !== 'idLavanderia') {
      delete newFilters[key];
      setFilters(newFilters);
    }
  };

  // Manejar cambios en los contadores de máquinas
  const handleCounterChange = (machineId, value) => {
    // Validar que el valor sea un número y no sea menor que el contador actual
    const numValue = parseFloat(value) || 0;

    setNewCounterValues(prev => ({
      ...prev,
      [machineId]: numValue
    }));
  };

  // Calcular la diferencia entre contadores (ciclos)
  const calculateCycles = (machineId) => {
    const currentValue = machineCounters[machineId] || 0;
    const newValue = newCounterValues[machineId] || 0;
    const difference = Math.max(0, newValue - currentValue);
    return difference;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container py-6"
    >
      <div className="mb-4 flex items-center">
        <Button asChild variant="outline" className="mr-4">
          <Link to={`/centros-lavado/${idLavanderia}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Registro de Ciclos de Lavado</h1>
      </div>

      {/* Sección de contadores de máquinas */}
      <div className="mb-6">

        <p className="text-sm text-muted-foreground mb-4">
          Actualiza el contador de cada lavadora para el registro de los ciclos de lavado
        </p>

        {loadingMachines ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando máquinas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {machines.map(machine => (
              <Card
                key={machine._id}
                className="overflow-hidden card-gradient-bg border shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between">
                    {machine.nombre}
                    <Badge variant="outline" className="ml-2">
                      {machine.marca}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Capacidad: {machine.capacidad || 0} kg
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contador actual</p>
                      <p className="font-medium">{machineCounters[machine._id] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nuevo contador</p>
                      <Input
                        type="number"
                        min={machineCounters[machine._id] || 0}
                        value={newCounterValues[machine._id] || ''}
                        onChange={(e) => handleCounterChange(machine._id, e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Ciclos calculados</p>
                    <div className="flex items-center">
                      <p className="font-bold text-lg">
                        {calculateCycles(machine._id)}
                      </p>
                      {calculateCycles(machine._id) > 0 && (
                        <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                          {(calculateCycles(machine._id) * machine.capacidad).toFixed(0)} kg
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={calculateCycles(machine._id) <= 0}
                    onClick={() => handleSaveItem({
                      maquina: { id: machine._id, nombre: machine.nombre },
                      ciclos: calculateCycles(machine._id),
                      capacidad: machine.capacidad || 0,
                      kilosLavados: (calculateCycles(machine._id) * machine.capacidad).toFixed(0),
                      fecha: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
                      lavanderia: { id: idLavanderia, nombre: laundryName },
                      contador: machine.contador || 0,
                      contadorNuevo: machine.contador + calculateCycles(machine._id),
                    })}
                  >
                    Guardar ciclos
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="card-gradient-bg border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <CircleSlash className="mr-2 h-5 w-5 text-primary" />
            Ciclos de Lavado
          </CardTitle>
          <CardDescription>
            Registra diariamente los ciclos de lavado completados por cada máquina
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
              >
                <FilterIcon className="mr-2 h-4 w-4" /> Filtros
              </Button>
              <ExportExcelButton
                service={async ({ query }) => {
                  const res = await fetchWashingCycles({ limit: 10000, page: 1, query });
                  return res?.data || [];
                }}
                filters={buildQuery(filters)}
                columns={excelColumns}
                fileName="ciclos-lavado"
              />
            </div>
            <div>
              <AppliedFilters
                filters={filters}
                fields={columns.filter(c => c.isFilter)}
                onRemoveFilter={handleRemoveFilter}
                ignoreKeys={['idLavanderia']}
              />
            </div>
          </div>

          <DataTable
            data={displayedData.map(item => ({
              ...item,
              // Asegurar que objetos complejos se rendericen correctamente
              maquina: typeof item.maquina === 'object' ? item.maquina : { nombre: 'Sin máquina' },
              lavanderia: typeof item.lavanderia === 'object' ? item.lavanderia : { nombre: 'Sin lavandería' },
            }))}
            columns={columns}
            isLoading={isLoading || loadingMachines}
            onAction={handleAction}
            showCreateButton={false}
          />

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <DynamicFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveItem}
            item={currentItem}
            fields={columns.filter(c => c.isForm !== false)}
            title={modalMode === 'create' ? 'Registrar Ciclos de Lavado' : 'Editar Ciclos de Lavado'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        fields={columns.filter(c => c.isFilter)}
        initialFilters={filters}
        onChange={handleFilterChange}
        onApply={handleFilterChange}
        initialDay={true}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de ciclos
              de la lavadora {itemToDelete?.maquina?.nombre || ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default WashingCyclesPage;
