import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { servicesColumns, columnsExcel } from '@/pages/parametrizacion/services/utils/servicesColumns.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchServices, createService, updateService, deleteService, exportServices } from '@/pages/parametrizacion/services/Services/services.services.jsx';
import { fetchLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const ServicesPage = () => {
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [laundries, setLaundries] = useState([]);
  const [loadingLaundries, setLoadingLaundries] = useState(true);
  const [columns, setColumns] = useState(servicesColumns);

  // Función para cargar lavanderías una sola vez
  const loadLaundries = useCallback(async () => {
    setLoadingLaundries(true);
    try {
      const response = await fetchLaundries({
        limit: 100,
        offset: 1,
        query: {}
      });

      if (response && response.data) {
        const laundryData = response.data;
        setLaundries(laundryData);

        // Actualizar las columnas con las opciones de lavandería precargadas
        const updatedColumns = servicesColumns.map(column => {
          if (column.id === 'lavanderia') {
            return {
              ...column,
              // Sobreescribir la función fetchOptions para usar los datos ya cargados
              fetchOptions: () => {
                return Promise.resolve(laundryData.map(laundry => ({
                  value: {
                    id: laundry._id,
                    nombre: laundry.nombre
                  },
                  label: laundry.nombre
                })));
              }
            };
          }
          return column;
        });

        setColumns(updatedColumns);
      }
    } catch (error) {
      console.error('Error al cargar lavanderías:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron cargar las lavanderías.',
        variant: 'destructive'
      });
    } finally {
      setLoadingLaundries(false);
    }
  }, [toast]);

  // Cargar lavanderías al iniciar el componente
  useEffect(() => {
    loadLaundries();
  }, [loadLaundries]);

  const fetchAndSetServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchServices({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los servicios.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);


    

  useEffect(() => {
    fetchAndSetServices();
    loadLaundries();
  }, [fetchAndSetServices]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    
    // Si estamos en modo edición, asegurar que los objetos complejos estén correctamente formateados
    if (mode === 'edit' && item) {
      // Hacer una copia para no mutar el original
      const itemCopy = {...item};
      
      // Asegurar que lavanderia sea un objeto con formato correcto {id, nombre}
      if (itemCopy.lavanderia) {
        
        if (typeof itemCopy.lavanderia === 'string') {
          // Si es solo un ID, usar las lavanderías ya cargadas
          const laundry = laundries.find(l => l._id === itemCopy.lavanderia);
          if (laundry) {
            itemCopy.lavanderia = {
              id: laundry._id,
              nombre: laundry.nombre
            };
          } else {
            console.log('No se encontró lavandería con ID:', itemCopy.lavanderia);
          }
        } else if (itemCopy.lavanderia && !itemCopy.lavanderia.id && itemCopy.lavanderia._id) {
          // Si tiene formato MongoDB pero no el formato esperado por el frontend
          itemCopy.lavanderia = {
            id: itemCopy.lavanderia._id,
            nombre: itemCopy.lavanderia.nombre
          };
        }
      }

      setCurrentItem(itemCopy);
    } else {
      setCurrentItem(item);
    }
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (itemData) => {
    try {
      
      // Asegurar que el objeto lavanderia tiene el formato correcto {id, nombre}
      const preparedData = {...itemData};
      
      // Verificar si lavanderia existe y procesarla correctamente
      if (preparedData.lavanderia) {
        if (typeof preparedData.lavanderia === 'string') {
          // Si es solo un ID, buscar la lavandería completa
          const laundry = laundries.find(l => l._id === preparedData.lavanderia);
          if (laundry) {
            preparedData.lavanderia = {
              id: laundry._id,
              nombre: laundry.nombre
            };
          }
        } else if (typeof preparedData.lavanderia === 'object') {
          // Si es un objeto, asegurarse de que tenga el formato correcto
          if (preparedData.lavanderia._id && !preparedData.lavanderia.id) {
            preparedData.lavanderia = {
              id: preparedData.lavanderia._id,
              nombre: preparedData.lavanderia.nombre
            };
          }
          // Si es un ID como string o number, convertirlo a objeto
          else if (!preparedData.lavanderia.id && !preparedData.lavanderia._id && typeof preparedData.lavanderia === 'object') {
            // Podría ser una referencia al objeto value sin el formato correcto
            const laundryId = Object.values(preparedData.lavanderia)[0];
            const laundry = laundries.find(l => l._id === laundryId);
            if (laundry) {
              preparedData.lavanderia = {
                id: laundry._id,
                nombre: laundry.nombre
              };
            }
          }
        }
      }  
      
      if (modalMode === 'create') {
        await createService(preparedData);
        toast({ title: "Éxito", description: "Servicio creado correctamente." });
      } else if (modalMode === 'edit') {
        await updateService(currentItem._id, preparedData);
        toast({ title: "Éxito", description: "Servicio actualizado correctamente." });
      }
      handleCloseModal();
      fetchAndSetServices();
    } catch (error) {
      console.error("Error saving service:", error);
      const errorMessage = error.response?.data?.message || error.message || "Ocurrió un problema al guardar el servicio.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      if (itemToDelete) {
        const response = await deleteService(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: "Servicio eliminado", description: "El servicio fue eliminado correctamente." });
          fetchAndSetServices();
        } else {
          toast({ 
            title: "Error", 
            description: response.message || "Hubo un problema al eliminar el servicio.", 
            variant: "destructive" 
          });
        }
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Hubo un problema al eliminar el servicio.", 
        variant: "destructive" 
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
        console.warn(`Acción no implementada: ${actionType}`);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const blob = await exportServices(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servicios_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Éxito", description: "Servicios exportados correctamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron exportar los servicios.", variant: "destructive" });
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (key) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Servicios</CardTitle>
              <CardDescription>Gestión de servicios</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setIsDrawerOpen(true)}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                Filtrar
              </Button>
              <ExportExcelButton onClick={handleExportToExcel} />
              <Button onClick={() => handleOpenModal('create')} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Nuevo Servicio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
              <AppliedFilters 
                filters={filters} 
                fields={[
                  { id: 'estado', label: 'Estado', type: 'select', options: [
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Inactivo', label: 'Inactivo' },
                  ]},
                  { id: 'createdAt', label: 'Rango de fechas', type: 'daterange' },
                  { id: 'lavanderia.id', label: 'Centro de Lavado', type: 'asyncSelect',
                    options: laundries.map(laundry => ({
                      value: laundry._id,
                      label: laundry.nombre
                    })),
                    fetchOptions: () => Promise.resolve(laundries.map(laundry => ({
                      value: laundry._id,
                      label: laundry.nombre
                    })))
                  },
                ]}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>
          <DataTable
            data={displayedData}
            columns={columns}
            isLoading={isLoading || loadingLaundries}
            onAction={handleAction}
            showCreateButton={false}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
          <FilterDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            fields={[
              {
                id: 'estado', label: 'Estado', type: 'select', options: [
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Inactivo', label: 'Inactivo' },
                ]
              },
              { id: 'createdAt', label: 'Rango de fechas', type: 'daterange', defaultToday: true },
              { 
                id: 'lavanderia.id', 
                label: 'Centro de Lavado', 
                type: 'asyncSelect',
                options: laundries.map(laundry => ({
                  value: laundry._id,
                  label: laundry.nombre
                })),
                fetchOptions: () => Promise.resolve(laundries.map(laundry => ({
                  value: laundry._id,
                  label: laundry.nombre
                })))
              },
            ]}
            initialFilters={filters}
            onChange={handleFilterChange}
            onApply={handleFilterChange}
            initialDay={true}
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
            fields={columns}
            title={modalMode === 'create' ? 'Crear Nuevo Servicio' : 'Editar Servicio'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio
              "{itemToDelete?.nombre}" de tus registros.
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

export default ServicesPage;
