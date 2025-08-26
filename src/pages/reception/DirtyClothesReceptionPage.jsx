import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, PlusCircle, FilterIcon, ArrowLeft, Weight, Eye, FileText, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import ReceptionFormModal from './components/ReceptionFormModal';
import FinalizarLavadoModal from './components/FinalizarLavadoModal';
import VerRechazosModal from './components/VerRechazosModal';
import { useToast } from '@/components/ui/use-toast';
import { receptionColumns, columnsExcel } from './utils/receptionColumns';
import { fetchReceptions, createReception, updateReception, deleteReception, exportReceptions, getTotalKilos, finalizarLavado } from './services/reception.services';
import { fetchEmployees } from '@/pages/parametrizacion/employees/Services/employees.services';
import { getClientByLaundryId } from '@/pages/parametrizacion/clients/Services/clients.services';
import { getGarmentTypesByLaundryId } from '@/pages/parametrizacion/garmentTypes/Services/garmentTypes.services';
import { fetchMachines } from '@/pages/parametrizacion/machines/Services/machines.services';
import { getWashingPrograms } from '@/pages/parametrizacion/washingPrograms/Services/washingPrograms.services';
import { fetchLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import AppliedFilters from '@/components/AppliedFilters';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user.rol === 'Administrador';
};

const ITEMS_PER_PAGE = 10;

const DirtyClothesReceptionPage = () => {
  const { idLavanderia } = useParams();
  const location = useLocation();
  const { workplaceName } = location.state || {};
  const laundryId = idLavanderia;

  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [laundryName, setLaundryName] = useState(workplaceName || '');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // Obtener la fecha de hoy en formato ISO para el filtro
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Inicializar filtros con la fecha actual y el ID de lavandería
  // Usando el formato que espera el componente AppliedFilters
  const [filters, setFilters] = useState({
    idLavanderia: laundryId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loteFilter, setLoteFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Estados para finalizar lavado
  const [isFinalizarModalOpen, setIsFinalizarModalOpen] = useState(false);
  const [itemToFinalize, setItemToFinalize] = useState(null);

  // Estados para ver rechazos
  const [isRechazosModalOpen, setIsRechazosModalOpen] = useState(false);
  const [itemToViewRechazos, setItemToViewRechazos] = useState(null);

  // Estados para las opciones de los selects
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [machines, setMachines] = useState([]);
  const [washingPrograms, setWashingPrograms] = useState([]);
  const [formOptionsLoading, setFormOptionsLoading] = useState(true);
  const [totalKilos, setTotalKilos] = useState(0);
  const [totalRechazo, setTotalRechazo] = useState(0);
  const [rechazoDetallado, setRechazoDetallado] = useState({});
  const [pendientesFinalizar, setPendientesFinalizar] = useState(0);
  const [loadingTotalKilos, setLoadingTotalKilos] = useState(false);

  // Función para cargar el total de kilos según los filtros actuales
  const loadTotalKilos = useCallback(async () => {
    setLoadingTotalKilos(true);
    try {
      const result = await getTotalKilos(filters);

      setTotalKilos(result.totalKilos || 0);
      setTotalRechazo(result.totalRechazo || 0);
      setPendientesFinalizar(result.pendientesFinalizar || 0);
      setRechazoDetallado({
        arrastre: result.arrastre || 0,
        amarilla: result.cloro || 0,
        grasa: result.grasa || 0,
        tintas: result.tintas || 0,
        oxido: result.oxido || 0,
        otro: result.otro || 0,
      });
    } catch (error) {
      console.error('Error cargando el total de kilos:', error);
      // No mostramos toast para no sobrecargar la interfaz con errores
    } finally {
      setLoadingTotalKilos(false);
    }
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: responseData, totalRecords } = await fetchReceptions({ limit: ITEMS_PER_PAGE, page: currentPage, query: filters });
      setData(responseData || []);
      setTotalItems(totalRecords || 0);

      // Intentar actualizar el nombre del centro de lavado desde las recepciones si está disponible
      if (responseData.length > 0) {
        if (responseData[0].lavanderia && responseData[0].lavanderia.nombre) {
          setLaundryName(responseData[0].lavanderia.nombre);
        } else if (responseData[0].laundry && responseData[0].laundry.nombre) {
          setLaundryName(responseData[0].laundry.nombre);
        }
      }

      // Cargar el total de kilos con los mismos filtros
      loadTotalKilos();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las recepciones.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast, loadTotalKilos]);

  // Cargar el nombre del centro de lavado directamente
  const loadLaundryName = useCallback(async () => {
    if (!laundryId || laundryName) return; // Si ya tenemos el nombre o no hay ID, no cargar

    try {
      const response = await fetchLaundries({ query: { _id: laundryId } });
      if (response && response.data && response.data.length > 0) {
        setLaundryName(response.data[0].nombre);
      }
    } catch (error) {
      console.error('Error cargando el centro de lavado:', error);
    }
  }, [laundryId, laundryName]);

  useEffect(() => {
    fetchData();
    loadLaundryName(); // Cargar el nombre del centro de lavado al montar el componente
  }, [fetchData, loadLaundryName]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFormOptionsLoading(true);
        const [employeesRes, clientsRes, garmentTypesRes, machinesRes, washingProgramsRes] = await Promise.all([
          fetchEmployees({
            query: {
              rol: 'Auxiliar lavanderia',
              "lavanderia.id": laundryId
            }, limit: 1000
          }),
          getClientByLaundryId({ query: { "lavanderia.id": laundryId }, limit: 1000 }),
          getGarmentTypesByLaundryId({ query: { "lavanderia.id": laundryId }, limit: 1000 }),
          fetchMachines({ query: { "lavanderia.id": laundryId }, limit: 1000 }),
          getWashingPrograms({ query: { "lavanderia.id": laundryId }, limit: 1000 })
        ]);
        // Estandarizar el acceso a los datos, ya que algunas funciones devuelven el objeto completo y otras solo la data.
        const setData = (setter, response) => {
          let data = [];
          if (Array.isArray(response)) {
            data = response;
          } else if (response && Array.isArray(response.data)) {
            data = response.data;
          }
          setter(data);
        };

        setData(setEmployees, employeesRes);
        setData(setClients, clientsRes);
        setData(setGarmentTypes, garmentTypesRes);
        setData(setMachines, machinesRes);
        setData(setWashingPrograms, washingProgramsRes);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar las opciones para el formulario.', variant: 'destructive' });
      } finally {
        setFormOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [toast]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    // Asegurar que el ID de lavandería siempre se mantenga en los filtros
    const mergedFilters = {
      ...newFilters,
      idLavanderia: laundryId // Siempre preservar el ID de lavandería
    };
    setCurrentPage(1);
    setFilters(mergedFilters);
  };

  const handleRemoveFilter = (key) => {
    // No permitir eliminar el filtro de idLavanderia
    if (key === 'idLavanderia') return;

    const newFilters = { ...filters };
    delete newFilters[key];

    if (key === 'numeroLote') {
      setLoteFilter('');
    }

    // Asegurar que el ID de lavandería siempre esté presente
    newFilters.idLavanderia = laundryId;

    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSave = async (formData) => {
    try {

      // Función para obtener el ID del campo (puede ser un string o un objeto con propiedad id)
      const getId = (value) => {
        if (!value) return null;
        return typeof value === 'object' && value.id ? value.id : value;
      };

      // Buscar los objetos completos a partir de los IDs
      const clienteId = getId(formData.cliente);
      const tipoPrendaId = getId(formData.tipoPrenda);
      const maquinaId = getId(formData.maquina);
      const programaLavadoId = getId(formData.programaLavado);
      const empleadoId = getId(formData.empleado);

      const clienteObj = clients.find(c => c._id === clienteId);
      const tipoPrendaObj = garmentTypes.find(t => t._id === tipoPrendaId);
      const maquinaObj = machines.find(m => m._id === maquinaId);
      const programaLavadoObj = washingPrograms.find(p => p._id === programaLavadoId);
      const empleadoObj = employees.find(e => e._id === empleadoId);

      if (!clienteObj || !tipoPrendaObj || !maquinaObj || !programaLavadoObj || !empleadoObj) {
        console.error('Objetos no encontrados:', { clienteObj, tipoPrendaObj, maquinaObj, programaLavadoObj, empleadoObj });
        throw new Error('No se pudieron encontrar todos los datos necesarios. Por favor, intente nuevamente.');
      }

      const dataToSave = {
        ...formData,
        pesoKg: parseFloat(formData.pesoKg) || 0,
        cliente: { id: clienteObj._id, nombre: clienteObj.nombre },
        tipoPrenda: { id: tipoPrendaObj._id, nombre: tipoPrendaObj.nombre },
        maquina: { id: maquinaObj._id, nombre: maquinaObj.nombre },
        programaLavado: { id: programaLavadoObj._id, nombre: programaLavadoObj.nombre },
        empleado: { id: empleadoObj._id, nombre: empleadoObj.nombre + ' ' + (empleadoObj.apellido || '') },
        lavanderia: { id: laundryId, nombre: laundryName },
      };

      if (editingItem) {
        await updateReception(editingItem._id, dataToSave);
        toast({ title: 'Éxito', description: 'Recepción actualizada correctamente.' });
      } else {

        try {
          const response = await createReception(dataToSave);
         
          toast({ title: 'Éxito', description: 'Recepción creada correctamente.' });
        } catch (err) {
          console.error("Error creando recepción:", err);
          throw err;
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error saving reception:', error);
      const errorMessage = error.response?.data?.message || error.message || 'No se pudo guardar la recepción.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
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

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteReception(itemToDelete._id);
        toast({ title: 'Éxito', description: 'Recepción eliminada.' });
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar la recepción.', variant: 'destructive' });
      }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Manejar la finalización de un lavado
  const handleFinalizarLavado = (item) => {
    if (item.estado === 'finalizado') {
      toast({
        title: "Lavado ya finalizado",
        description: "Este lavado ya ha sido finalizado anteriormente.",
        variant: "warning"
      });
      return;
    }
    setItemToFinalize(item);
    setIsFinalizarModalOpen(true);
  };

  // Guardar la finalización del lavado
  const saveFinalizacion = async (data) => {
    try {
      await finalizarLavado(itemToFinalize._id, data);
      toast({ title: 'Éxito', description: 'Lavado finalizado correctamente.' });
      fetchData();
      setIsFinalizarModalOpen(false);
      setItemToFinalize(null);
    } catch (error) {
      console.error('Error finalizando lavado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'No se pudo finalizar el lavado.',
        variant: 'destructive'
      });
    }
  };

  const handleAction = (action, item) => {
    if (action === 'edit') handleEdit(item);
    if (action === 'delete') handleDelete(item);
    if (action === 'finalizar') handleFinalizarLavado(item);
    if (action === 'verRechazos') {
      setItemToViewRechazos(item);
      setIsRechazosModalOpen(true);
    }
  };

  const receptionDataMapper = (item) => ({
    numeroLote: item.numeroLote || 'N/A',
    fechaPesaje: new Date(item.createdAt).toLocaleString(),
    nombreLavador: item.empleado ? `${item.empleado.nombre} ${item.empleado.apellido}` : 'N/A',
    nombreCliente: item.cliente?.nombre ?? 'N/A',
    tipoPrenda: item.tipoPrenda?.nombre ?? 'N/A',
    cantidadPesada: item.pesoKg,
    lavadora: item.maquina?.nombre ?? 'N/A',
    programaLavado: item.programaLavado?.nombre ?? 'N/A',
    observaciones: item.observaciones ?? '',
    arrastre: item.arrastre,
    cloro: item.cloro,
    grasa: item.grasa,
    tintas: item.tintas,
    oxido: item.oxido,
    otro: item.otro,
    pesoKg: item.kilosLimpios,
    totalRechazoKilos: item.totalRechazoKilos,
    lavador: item.empleado ? `${item.empleado.nombre}w` : 'N/A',
    observaciones: item.observaciones,
  });

  // Añadir acción de finalizar lavado a las columnas
  const extendColumnsWithFinalizar = (columns) => {
    const actionColumn = columns.find(col => col.key === 'actions' || col.id === 'actions' || col.key === 'opciones' || col.id === 'opciones');
    if (actionColumn && actionColumn.actions) {
      // Añadir acción de finalizar si no existe
      if (!actionColumn.actions.some(a => a.key === 'finalizar')) {
        actionColumn.actions.push({
          key: 'finalizar',
          icon: 'Check',
          tooltip: 'Finalizar Lavado',
          showWhen: (item) => item.estado !== 'finalizado', // Solo mostrar para lavados no finalizados
          className: 'text-green-600 hover:text-green-800'
        });
      }
    }
    return columns;
  };

  const cols = extendColumnsWithFinalizar(receptionColumns(employees, clients, garmentTypes, machines, washingPrograms));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to={`/centros-lavado/${laundryId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Lavado</Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><Truck className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Recepción de Ropa Sucia</CardTitle>
              <CardDescription>Centro de Lavado: {laundryName || 'Cargando...'}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Input
              placeholder="Buscar por lote..."
              value={loteFilter}
              onChange={(e) => setLoteFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newFilters = { ...filters };
                  if (loteFilter) {
                    newFilters.numeroLote = loteFilter;
                  } else {
                    delete newFilters.numeroLote;
                  }
                  handleFilterChange(newFilters);
                }
              }}
              className="w-48"
            />
            <Button onClick={() => setIsFilterOpen(true)} variant="outline"><FilterIcon className="h-4 w-4 mr-2" />Filtrar</Button>
            <ExportExcelButton
              service={exportReceptions}
              filters={filters}
              columns={columnsExcel}
              fileName="Recepciones_Ropa_Sucia"
              dataMapper={receptionDataMapper}
            />
            <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}><PlusCircle className="h-4 w-4 mr-2" />Crear Recepción</Button>
          </div>
        </CardHeader>
        <CardContent>
          {data && data.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="p-2.5 rounded-lg shadow-sm border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent w-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Total de kilos</h3>
                    <p className="text-lg font-bold mt-0.5 text-primary">
                      {loadingTotalKilos ? (
                        <span className="text-sm text-muted-foreground">Calculando...</span>
                      ) : (
                        `${totalKilos.toLocaleString()} kg`
                      )}
                    </p>
                  </div>
                  <div className="bg-primary/20 p-1.5 rounded-full">
                    <Weight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg shadow-sm border border-rose-300/50 bg-gradient-to-r from-rose-50/10 to-transparent w-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-xs font-medium text-muted-foreground">Total rechazo</h3>
                      <Popover>
                      
                        <PopoverContent className="w-64">
                          <div className="grid gap-2">
                            <div className="text-sm font-bold">Detalle del Rechazo</div>
                            {Object.entries(rechazoDetallado).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-2 items-center text-xs">
                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                <div className="text-right">
                                  <strong>{value.toLocaleString()} kg</strong>
                                  <div className="text-muted-foreground">
                                    <span style={{ fontWeight: 'bold', color: 'red' }}>({totalKilos > 0 ? ((value / totalKilos) * 100).toFixed(2) : '0.00'}% del total)</span>
                                    <span>({totalRechazo > 0 ? ((value / totalRechazo) * 100).toFixed(2) : '0.00'}% del rechazo)</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                        <PopoverTrigger asChild>
                          <Eye className="h-6 w-6 text-rose-600" />
                        </PopoverTrigger>
                      </Popover>
                    </div>
                    <div>
                      <p className="text-lg font-bold mt-0.5 text-rose-600">
                        {loadingTotalKilos ? (
                          <span className="text-sm text-muted-foreground">Calculando...</span>
                        ) : (
                          ((totalRechazo / totalKilos) * 100).toFixed(1) + '%'
                        )}
                      </p>
                      {!loadingTotalKilos && totalKilos > 0 && (
                        <span className="text-xs text-muted-foreground block -mt-1">
                          {totalRechazo.toLocaleString()} kg
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-2.5 rounded-lg shadow-sm border border-blue-300/50 bg-gradient-to-r from-blue-50/10 to-transparent w-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Total registros</h3>
                    <p className="text-lg font-bold mt-0.5 text-blue-600">
                      {loading ? (
                        <span className="text-sm text-muted-foreground">Calculando...</span>
                      ) : (
                        `${totalItems.toLocaleString()}`
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-100/50 p-1.5 rounded-full">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg shadow-sm border border-red-300/50 bg-gradient-to-r from-red-50/10 to-transparent w-32">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Pendientes finalizar</h3>
                    <p className="text-lg font-bold mt-0.5 text-red-600">
                      {loading ? (
                        <span className="text-sm text-muted-foreground">Calculando...</span>
                      ) : (
                        `${pendientesFinalizar.toLocaleString()}`
                      )}
                    </p>
                  </div>
                  <div className="bg-red-100/50 p-1.5 rounded-full">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="w-full">
            <AppliedFilters
              filters={filters}
              fields={cols.filter(c => c.isFilter)}
              onRemoveFilter={handleRemoveFilter}
              ignoreKeys={['idLavanderia']}
            />
          </div>
          <DataTable
            data={data}
            columns={cols}
            isLoading={loading || formOptionsLoading}
            onAction={handleAction}
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
          <ReceptionFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            fields={cols.filter(c => c.isForm !== false)}
            item={editingItem}
            title={editingItem ? 'Editar Recepción' : 'Crear Recepción'}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFilterOpen && (
          <FilterDrawer
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            fields={cols.filter(c => c.isFilter)}
            initialFilters={filters}
            onApply={handleFilterChange}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la recepción.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para finalizar lavado */}
      <AnimatePresence>
        {isFinalizarModalOpen && itemToFinalize && (
          <FinalizarLavadoModal
            isOpen={isFinalizarModalOpen}
            onClose={() => setIsFinalizarModalOpen(false)}
            onSave={saveFinalizacion}
            item={itemToFinalize}
          />
        )}
      </AnimatePresence>

      {/* Modal para ver detalles de rechazos */}
      <AnimatePresence>
        {isRechazosModalOpen && itemToViewRechazos && (
          <VerRechazosModal
            isOpen={isRechazosModalOpen}
            onClose={() => setIsRechazosModalOpen(false)}
            item={itemToViewRechazos}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DirtyClothesReceptionPage;
