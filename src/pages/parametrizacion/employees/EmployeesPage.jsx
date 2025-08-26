import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { employeesColumns, columnsExcel } from '@/pages/parametrizacion/employees/utils/employeesColumns';
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
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, exportEmployees } from '@/pages/parametrizacion/employees/Services/employees.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const EmployeesPage = () => {
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

  const fetchAndSetEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchEmployees({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los empleados.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchAndSetEmployees();
  }, [fetchAndSetEmployees]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        await createEmployee(itemData);
        toast({ title: "Éxito", description: "Empleado creado correctamente." });
      } else if (modalMode === 'edit') {
        await updateEmployee(currentItem._id, itemData);
        toast({ title: "Éxito", description: "Empleado actualizado correctamente." });
      }
      handleCloseModal();
      fetchAndSetEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      const errorMessage = error.response?.data?.message || error.message || "Ocurrió un problema al guardar el empleado.";
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
        const response = await deleteEmployee(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: "Empleado eliminado", description: "El empleado fue eliminado correctamente." });
        } else {
          throw new Error(response.message || "Error al eliminar empleado");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al eliminar el empleado.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchAndSetEmployees();
    }
  };

  const handleAction = (actionType, row) => {
    if (actionType === 'edit') {
      handleOpenModal('edit', row);
    } else if (actionType === 'delete') {
      handleDeleteConfirmation(row);
    } else if (actionType === 'view') {
      toast({ title: "Ver Empleado", description: `Visualizando empleado: ${row.nombre}` });
    }
  };

  const modalFields = employeesColumns.map(col => ({
    id: col.id,
    label: col.label,
    type: col.type === 'number' ? 'number' : (col.type === 'status' ? 'select' : 'text'),
    options: col.type === 'status' ? [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
    ] : undefined,
  }));

  const handleFilterChange = (filters) => {
    setFilters(filters);
    setIsDrawerOpen(false);
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="w-full md:w-auto">
            <div className="flex items-center space-x-3 mb-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Parametrización de Empleados</CardTitle>
            </div>
            <CardDescription>Gestiona los empleados de la empresa.</CardDescription>
          </div>

          <div className="w-full flex flex-col gap-3">
    
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton
                title="Empleados"
                columns={columnsExcel}
                getData={() => exportEmployees({query: filters})}
              />
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Empleado
              </Button>
              <Button onClick={() => setIsDrawerOpen(true)} className="flex items-center font-semibold bg-black hover:bg-white/20 ">
                <FilterIcon className="mr-2 h-4 w-4" variant="outline" size={20} />
                Filtros
              </Button>
            </div>
          </div>
          
        </CardHeader>
        <CardContent>
        <div className="w-full">
              <AppliedFilters 
                filters={filters} 
                fields={[
                  { id: 'estado', label: 'Estado', type: 'select', options: [
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Inactivo', label: 'Inactivo' },
                  ]},
                  { id: 'createdAt', label: 'Rango de fechas', type: 'daterange' },
                  { id: 'lavanderia.id', label: 'Centro de Lavado', type: 'asyncSelect',
                    fetchOptions: async () => {
                      try {
                        const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services.jsx');
                        const response = await fetchLaundries({ limit: 100, offset: 1, query: { estado: 'Activo' } });
                        const arr = Array.isArray(response?.data) ? response.data : [];
                        return arr.map(laundry => ({ value: laundry._id, label: laundry.nombre }));
                      } catch (e) {
                        console.error('Error loading laundries:', e);
                        return [];
                      }
                    }
                  },
                ]}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>
          <DataTable
            data={displayedData}
            columns={employeesColumns}
            isLoading={isLoading}
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
            fields={employeesColumns}
            title={modalMode === 'create' ? 'Crear Nuevo Empleado' : 'Editar Empleado'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el empleado
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

export default EmployeesPage;