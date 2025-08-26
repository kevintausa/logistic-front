import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Calculator, Droplet, Flame, Zap, Wifi, HelpCircle, FilterIcon, Trash2, AlertTriangle } from 'lucide-react';
import DynamicFormModal from '@/components/DynamicFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { fetchServicesByLaundry, createUtilityService, fetchUtilityServices, deleteUtilityService, updateUtilityService } from './services/utilityServices.services';
import ExportExcelButton from '@/components/ExportExcelButton';
import AppliedFilters from '@/components/AppliedFilters';
import { utilityServicesColumns, columnsExcel } from './utils/utilityServicesColumns';
import FilterDrawer from '@/components/FilterDrawer';
import DataTable from '@/components/DataTable';

const ITEMS_PER_PAGE = 10;
/**
 * Componente UtilityServicesPage
 * Este componente muestra tarjetas para cada servicio de utilidad registrado,
 * permitiendo a los usuarios ver el contador actual y registrar nuevas lecturas
 * para calcular el consumo diario y su costo asociado.
 */
const UtilityServicesPage = () => {
  // ---------- ESTADOS BÁSICOS ----------
  const { idLavanderia } = useParams();
  const { toast } = useToast();
  const { isAdmin } = useAuth(); // Obtener función para verificar si es administrador
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [laundryName, setLaundryName] = useState('');
  const [newReadings, setNewReadings] = useState({});
  const [excelColumns, setExcelColumns] = useState(columnsExcel);
  const [displayedData, setDisplayedData] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [columns, setColumns] = useState(utilityServicesColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentItem, setCurrentItem] = useState(null);
  

  // Obtener la fecha de hoy en formato ISO para el filtro
  const today = new Date();

  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  const [filters, setFilters] = useState({
    "lavanderia.id": idLavanderia,
    fecha: {
      $gte: yesterday,
      $lte: endOfDay
    }
  });
  // ---------- FUNCIONES ----------

  /**
   * Obtiene los servicios registrados para la lavandería
   */
  const fetchServices = useCallback(async () => {
    if (!idLavanderia) return;

    setIsLoading(true);
    try {
      const response = await fetchServicesByLaundry(idLavanderia);
      setServices(response);

      // Inicializa el estado para las nuevas lecturas
      const initialReadings = {};
      response.forEach(service => {
        initialReadings[service._id] = '';
      });
      setNewReadings(initialReadings);

      // Guarda el nombre de la lavandería si está disponible
      if (response.length > 0 && response[0].lavanderia?.nombre) {
        setLaundryName(response[0].lavanderia.nombre);
      }
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los servicios públicos.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [idLavanderia, toast]);


  const fetchAndSetUtilityServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchUtilityServices({
        limit: ITEMS_PER_PAGE,
        page: currentPage,
        query: filters
      });

      const data = response?.data || [];
      const totalRecords = response?.totalRecords || 0;

      setDisplayedData(Array.isArray(data) ? data : []);
      setTotalItems(totalRecords);
    } catch (error) {
      setDisplayedData([]); // En caso de error, asegurar que siga siendo un array
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron obtener los servicios públicos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  /**
   * Maneja el cambio en una lectura de contador
   */
  const handleReadingChange = (serviceId, value) => {
    setNewReadings(prev => ({
      ...prev,
      [serviceId]: value
    }));
  };

  /**
   * Calcula el consumo basado en la lectura anterior y la nueva
   */
  const calculateConsumption = (currentReading, newReading) => {
    if (!newReading || isNaN(newReading)) return 0;
    const current = parseFloat(currentReading) || 0;
    const newValue = parseFloat(newReading) || 0;
    return Math.max(0, newValue - current); // Asegura que el consumo no sea negativo
  };

  const calculateConsumptionLitros = (currentReading, newReading, factorConversion) => {  
    if (!newReading || isNaN(newReading)) return 0;
    const current = parseFloat(currentReading) || 0;
    const newValue = parseFloat(newReading) || 0;
    return Math.max(0, newValue - current) * factorConversion; // Asegura que el consumo no sea negativo
  };

  /**
   * Calcula el costo basado en el consumo y el precio unitario
   */
  const calculateCost = (consumption, unitPrice, ) => {
    return consumption * (parseFloat(unitPrice) || 0) ;
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
    
    if (item && mode === 'edit') {
      // Crear una versión aplanada del item para que el formulario pueda manejarlo correctamente
      const flattenedItem = {
        ...item,
        // Aplanar propiedades anidadas para que coincidan con los IDs de los campos
        'servicio.nombre': item.servicio?.nombre,
        'servicio.tipo': item.servicio?.tipo,
        'servicio.unidad': item.servicio?.unidad,
        'servicio.precio': item.servicio?.precio,
        'lavanderia.nombre': item.lavanderia?.nombre,
        // Mantener referencias originales también
        servicio: item.servicio,
        lavanderia: item.lavanderia
      };
      setCurrentItem(flattenedItem);
    } else {
      setCurrentItem(item);
    }
    
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };
  
  const handleSaveItem = async (formData) => {
    setIsLoading(true);
    try {
      // Procesar los datos del formulario para manejar propiedades anidadas
      const processedData = {
        ...formData,
        // Construir el objeto servicio adecuadamente
        servicio: {
          id: currentItem?.servicio?.id || formData?.servicio?.id,
          nombre: formData['servicio.nombre'] || currentItem?.servicio?.nombre,
          tipo: formData['servicio.tipo'] || currentItem?.servicio?.tipo,
          unidad: formData['servicio.unidad'] || currentItem?.servicio?.unidad,
          precio: formData['servicio.precio'] || currentItem?.servicio?.precio
        },
        // Construir el objeto lavandería adecuadamente
        lavanderia: {
          id: currentItem?.lavanderia?.id || idLavanderia,
          nombre: formData['lavanderia.nombre'] || currentItem?.lavanderia?.nombre || laundryName
        }
      };

      // Eliminar las propiedades aplanadas para evitar duplicidad
      delete processedData['servicio.nombre'];
      delete processedData['servicio.tipo'];
      delete processedData['servicio.unidad'];
      delete processedData['servicio.precio'];
      delete processedData['lavanderia.nombre'];
      
      if (modalMode === 'create') {
        await createUtilityService(processedData);
        toast({
          title: 'Éxito',
          description: 'Registro creado correctamente',
        });
      } else {
        await updateUtilityService(currentItem._id, processedData);
  
        toast({
          title: 'Éxito',
          description: 'Registro actualizado correctamente',
        });
      }
      handleCloseModal();
      fetchAndSetUtilityServices();
      fetchServices();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el registro',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Estado para el diálogo de confirmación
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

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
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      handleDeleteItem(itemToDelete);
    }
    setIsConfirmDialogOpen(false);
    setItemToDelete(null);
  };
  
  const handleCancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setItemToDelete(null);
  };
  
  const handleDeleteItem = async (item) => {
    setIsLoading(true);
    try {
      // Llamar al servicio de eliminación
      await deleteUtilityService(item._id);
      
      toast({
        title: 'Éxito',
        description: 'Registro eliminado correctamente',
      });
      
      // Recargar datos después de eliminar
      await fetchAndSetUtilityServices();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el registro',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1);
    
    // Procesar específicamente el filtro de fecha para asegurar formato adecuado
    const processedFilters = { ...newFilters };
    
    // Asegurar que lavanderia.id siempre esté presente
    processedFilters["lavanderia.id"] = idLavanderia;
    
    // Si hay un filtro de fecha, asegurarse de que tenga el formato correcto
    if (newFilters.fecha) {
      // Si es un objeto con propiedades $gte y $lte (rango de fechas)
      if (typeof newFilters.fecha === 'object' && (newFilters.fecha.$gte || newFilters.fecha.$lte)) {
        // Ya está en formato correcto, no hacer nada
      } else if (newFilters.fecha instanceof Date) {
        // Si es una fecha simple, convertir a rango de ese día
        const fecha = new Date(newFilters.fecha);
        const startOfDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0).toISOString();
        const endOfDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59).toISOString();
        
        processedFilters.fecha = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      } else if (typeof newFilters.fecha === 'string' && newFilters.fecha.trim() !== '') {
        // Si es un string, intentar convertirlo a fecha
        try {
          const fecha = new Date(newFilters.fecha);
          if (!isNaN(fecha.getTime())) {
            const startOfDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0).toISOString();
            const endOfDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59).toISOString();
            
            processedFilters.fecha = {
              $gte: startOfDay,
              $lte: endOfDay
            };
          }
        } catch (error) {
          console.error('Error al procesar filtro de fecha:', error);
          // Si hay error, eliminar el filtro de fecha
          delete processedFilters.fecha;
        }
      } else {
        // Si no es ninguno de los formatos anteriores, eliminar el filtro
        delete processedFilters.fecha;
      }
    }
    
    setFilters(processedFilters);
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    if (key !== 'idLavanderia') {
      delete newFilters[key];
      setFilters(newFilters);
      setCurrentPage(1);
    }
  };

  /**
   * Renderiza el icono correspondiente según el tipo de servicio
   */
  const renderServiceTypeIcon = (tipo) => {
    const iconSize = "h-10 ";

    switch (tipo) {
      case 'Agua':
        return <Droplet className={`${iconSize}`} color="#3b82f6" />;
      case 'Gas':
        return <Flame className={`${iconSize}`} color="#d97706" />;
      case 'Electricidad':
        return <Zap className={`${iconSize}`} color="#eab308" />;
      case 'Internet':
        return <Wifi className={`${iconSize}`} color="#8b5cf6" />;
      default:
        return <HelpCircle className={`${iconSize} text-gray-500`} />;
    }
  };

  /**
   * Guarda el nuevo registro de consumo
   */
  const saveConsumptionRecord = async (service) => {
    const newReading = newReadings[service._id];

    if (!newReading || isNaN(newReading)) {
      toast({
        title: "Error",
        description: "Por favor ingrese una lectura de contador válida.",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(newReading) <= parseFloat(service.contador)) {
      toast({
        title: "Error",
        description: "La nueva lectura debe ser mayor que la lectura actual",
        variant: "destructive",
      });
      return;
    }

    const consumption = calculateConsumption(service.contador, newReading);
    const cost = calculateCost(consumption, service.precio);
    const consumptionLitros = calculateConsumptionLitros(service.contador, newReading, service.factorConversion);
    
    
    setIsLoading(true);
    try {
      // Crear el registro de consumo restarle un dia a la fecha actual
      const today = new Date();
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      await createUtilityService({
        fecha: yesterday.toISOString(),
        servicio: {
          id: service._id,
          nombre: service.nombre,
          tipo: service.tipo,
          unidad: service.unidad,
          precio: service.precio,
        },
        contadorAnterior: service.contador,
        contadorNuevo: parseFloat(newReading),
        consumo: consumption,
        costo: cost,
        lavanderia: {
          id: idLavanderia,
          nombre: laundryName
        },
        consumoLitros: consumptionLitros,
      });

      toast({
        title: "Éxito",
        description: `Registro de consumo guardado para ${service.nombre}`,
      });

      // Limpiar la entrada después de guardar
      setNewReadings(prev => ({
        ...prev,
        [service._id]: ''
      }));

      // Actualizar la lista de servicios para reflejar el nuevo contador
      fetchServices();
      // Actualizar la tabla de consumos
      fetchAndSetUtilityServices();

    } catch (error) {
      console.error('Error al guardar el registro:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el registro de consumo.',
      });
    }
  };

  // ---------- CICLO DE VIDA DEL COMPONENTE ----------
  useEffect(() => {
    fetchServices();
    fetchAndSetUtilityServices();
  }, [fetchServices, fetchAndSetUtilityServices]);
  
  useEffect(() => {
    fetchAndSetUtilityServices();
  }, [currentPage, filters]);



  // ---------- RENDERIZADO DEL COMPONENTE ----------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container p-6 mx-auto"
    >
      {/* ---------- ENCABEZADO Y BARRA DE ACCIONES ---------- */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="mr-4">
            <Link to={`/centros-lavado/${idLavanderia}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Link>
          </Button>
        </div>

        {/* Título y descripción */}
        <div className="mb-4 flex items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Servicios Públicos: {laundryName}
            </h1>
            <p className="text-muted-foreground">
              Registra el consumo diario de servicios públicos y calcula los costos asociados.
            </p>
          </div>
        </div>


        {/* ---------- ESTADO DE CARGA O CONTENIDO PRINCIPAL ---------- */}
        {isLoading ? (
          // Indicador de carga cuando se están obteniendo datos
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            <span className="ml-2 text-lg">Cargando registros...</span>
          </div>
        ) : services.length === 0 ? (
          // Mensaje cuando no hay servicios registrados
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay servicios públicos registrados para esta lavandería.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Por favor, registre los servicios en la sección de Parameterización primero.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service._id}
                className="overflow-hidden border-l-4 bg-background/50 border-border focus:border-primary"
                style={{
                  borderLeftColor:
                    service.tipo === 'Agua' ? '#3b82f6' :
                      service.tipo === 'Gas' ? '#d97706' :
                        service.tipo === 'Electricidad' ? '#eab308' :
                          service.tipo === 'Internet' ? '#8b5cf6' :
                            '#6b7280'
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-0">
                    <CardTitle className="text-lg">{service.nombre}</CardTitle>
                    {renderServiceTypeIcon(service.tipo)}
                  </div>
                  <CardDescription>
                    <div className="flex flex-col gap-1 text-sm mt-0">
                      <span className="font-medium" style={{
                        color: service.tipo === 'Agua' ? '#3b82f6' :
                          service.tipo === 'Gas' ? '#d97706' :
                            service.tipo === 'Electricidad' ? '#eab308' :
                              service.tipo === 'Internet' ? '#8b5cf6' :
                                '#6b7280'
                      }} >
                        {service.tipo}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Contador actual</p>
                      <p className="text-lg font-bold">{service.contador} {service.unidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium mb-1">Precio unitario</p>
                      <p className="text-lg font-bold">${service.precio}/{service.unidad}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`new-reading-${service._id}`}>Nueva lectura de contador</Label>
                      <Input
                        id={`new-reading-${service._id}`}
                        type="number"
                        placeholder={`Ultima lectura ${service.contador}`}
                        min={service.contador}
                        value={newReadings[service._id] || ''}
                        onChange={(e) => handleReadingChange(service._id, e.target.value)}
                      />
                    </div>

                    {newReadings[service._id] && !isNaN(newReadings[service._id]) && (
                      <div className=" p-3 rounded-md space-y-2">
                        <div className="flex items-center">
                          <Calculator className="h-4 w-4 mr-1 text-blue-600" />
                          <span className="text-sm font-medium">Consumo:</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {calculateConsumption(service.contador, newReadings[service._id]).toFixed(2)} {service.unidad} /  ${calculateCost(
                            calculateConsumption(service.contador, newReadings[service._id]),
                            service.precio
                          ).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveConsumptionRecord(service)}
                    disabled={!newReadings[service._id] || isNaN(newReadings[service._id]) || parseFloat(newReadings[service._id]) <= parseFloat(service.contador)}
                    className="w-full"
                    style={{
                      backgroundColor:
                        service.tipo === 'Agua' ? '#3b82f6' :
                          service.tipo === 'Gas' ? '#d97706' :
                            service.tipo === 'Electricidad' ? '#eab308' :
                              service.tipo === 'Internet' ? '#8b5cf6' :
                                undefined
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar registro
                  </Button>
                </CardFooter>
              </Card>

            ))}
          </div>
        )}

      </div>


      <Card className="pt-2">
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
                service={fetchUtilityServices}
                filters={filters}
                columns={excelColumns}
                fileName="servicios-publicos-consumo"
                dataMapper={(item) => {
                  const safeFormat = (value) => {
                    try {
                      if (!value) return '';
                      const d = typeof value === 'string' ? new Date(value) : value;
                      if (isNaN(new Date(d).getTime())) return '';
                      return format(new Date(d), 'dd/MM/yyyy', { locale: es });
                    } catch (_) {
                      return '';
                    }
                  };
                  return {
                    ...item,
                    fecha: safeFormat(item.fecha),
                    createdAt: safeFormat(item.createdAt),
                  };
                }}
              />
            </div>
            <div>
              <AppliedFilters
                filters={{
                  ...filters,
                  // Formatear la fecha para que se muestre correctamente
                  ...(filters.fecha ? {
                    fecha: typeof filters.fecha === 'object' ? 
                      // Si es un rango de fechas
                      (filters.fecha.$gte && filters.fecha.$lte ? 
                        format(new Date(filters.fecha.$gte), 'dd/MM/yyyy', { locale: es }) + 
                        ' - ' + 
                        format(new Date(filters.fecha.$lte), 'dd/MM/yyyy', { locale: es })
                      : 
                      // Si solo es una fecha
                      format(new Date(filters.fecha), 'dd/MM/yyyy', { locale: es }))
                    : filters.fecha
                  } : {})
                }}
                fields={columns.filter(c => c.isFilter)}
                onRemoveFilter={handleRemoveFilter}
                ignoreKeys={['idLavanderia', 'lavanderia.id']}
              />
            </div>
          </div>

          <DataTable
            data={displayedData.map(item => ({
              ...item,
              // Asegurar que objetos complejos se rendericen correctamente
              servicio: typeof item.servicio === 'object' ? item.servicio : { nombre: 'Sin servicio', tipo: 'Desconocido', unidad: '', precio: 0 },
              lavanderia: typeof item.lavanderia === 'object' ? item.lavanderia : { nombre: 'Sin lavandería', id: '' },
              // Convertir fechas a strings legibles si no lo son ya
              fecha: item.fecha ? (typeof item.fecha === 'string' ? item.fecha : new Date(item.fecha).toISOString()) : '',
            }))}
            columns={columns}
            isLoading={isLoading}
            onAction={handleAction}
            showCreateButton={false}
            page={currentPage}
            totalRecords={totalItems}
            limit={ITEMS_PER_PAGE}
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
            title={modalMode === 'create' ? 'Registrar Consumo de Servicios' : 'Editar Consumo de Servicios'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete ? (
                <div className="space-y-2">
                  <p>¿Estás seguro de que deseas eliminar el siguiente registro?</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p><span className="font-medium">Servicio:</span> {itemToDelete.servicio?.nombre}</p>
                    <p><span className="font-medium">Tipo:</span> {itemToDelete.servicio?.tipo}</p>
                    <p><span className="font-medium">Fecha:</span> {itemToDelete.fecha ? format(new Date(itemToDelete.fecha), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
                    <p><span className="font-medium">Consumo:</span> {itemToDelete.consumo} {itemToDelete.servicio?.unidad}</p>
                  </div>
                  <p className="text-red-500">Esta acción no se puede deshacer.</p>
                </div>
              ) : (
                <p>¿Estás seguro de que deseas eliminar este registro?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        fields={columns.filter(c => c.isFilter)}
        initialFilters={filters}
        onChange={handleFilterChange}
        onApply={handleFilterChange}
        initialDay={true}
      />
    </motion.div>
  );
};

export default UtilityServicesPage;
