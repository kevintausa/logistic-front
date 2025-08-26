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
import { laundriesColumns, columnsExcel } from '@/pages/parametrizacion/laundries/utils/laundriesColumns';
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
import { fetchLaundries, createLaundry, updateLaundry, deleteLaundry, exportLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const LaundriesPage = () => {
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

  const fetchAndSetLaundries = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchLaundries({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener las lavanderías.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchAndSetLaundries();
  }, [fetchAndSetLaundries]);

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
        const response = await createLaundry(itemData);
        if (response.code === 201) {
          toast({ title: "Lavandería creada", description: "La lavandería fue registrada correctamente." });
        } else {
          throw new Error(response.message || "Error al crear lavandería");
        }
      } else if (modalMode === 'edit') {
        const response = await updateLaundry(currentItem._id, itemData);
        if (response.code === 200) {
          toast({ title: "Lavandería actualizada", description: "Los datos fueron actualizados correctamente." });
        } else {
          throw new Error(response.message || "Error al actualizar lavandería");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al guardar la lavandería.",
        variant: "destructive",
      });
    } finally {
      handleCloseModal();
      fetchAndSetLaundries();
    }
  };

  const handleDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      const response = await deleteLaundry(itemToDelete._id);
      if (response.code === 200) {
        toast({ title: "Lavandería eliminada", description: "El registro fue eliminado correctamente." });
        fetchAndSetLaundries();
      } else {
        throw new Error(response.message || "Error al eliminar la lavandería");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al eliminar la lavandería.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAction = (actionType, row) => {
    if (actionType === 'edit') {
      handleOpenModal('edit', row);
    } else if (actionType === 'delete') {
      handleDeleteConfirmation(row);
    }
  };

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1);
    setFilters(newFilters);
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6"
    >
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Parametrización de Lavanderías</CardTitle>
              <CardDescription>Gestiona las lavanderías de la empresa.</CardDescription>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton
                title="Lavanderías"
                columns={columnsExcel}
                getData={() => exportLaundries({query: filters})}
              />
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Lavandería
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
                    { value: 'Activa', label: 'Activa' },
                    { value: 'Inactiva', label: 'Inactiva' },
                  ]},
                  { id: 'createdAt', label: 'Rango de fechas', type: 'daterange' },
                ]}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>
          <DataTable
            data={displayedData}
            columns={laundriesColumns}
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
                  { value: 'Activa', label: 'Activa' },
                  { value: 'Inactiva', label: 'Inactiva' },
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
            fields={laundriesColumns}
            title={modalMode === 'create' ? 'Crear Nueva Lavandería' : 'Editar Lavandería'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta lavandería?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la lavandería
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

export default LaundriesPage;
