import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog, PlusCircle, FilterIcon } from 'lucide-react'; // Ícono de engranaje como alternativa // Usando un ícono más apropiado
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { machinesColumns, columnsExcel } from '@/pages/parametrizacion/machines/utils/machinesColumns';
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
import { fetchMachines, createMachine, updateMachine, deleteMachine, exportMachines } from '@/pages/parametrizacion/machines/Services/machines.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activa' };

const MachinesPage = () => {
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
  // Opciones precargadas
  const [laundryOptionsModal, setLaundryOptionsModal] = useState([]);   // value: {id, nombre}
  const [laundryOptionsFilter, setLaundryOptionsFilter] = useState([]); // value: id

  // Precarga de catálogos (lavanderías)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services');
        const r = await fetchLaundries({ limit: 200, offset: 1, query: { estado: 'Activo' } });
        const data = r?.data || [];
        const optsModal = data.map(l => ({ value: { id: l._id, nombre: l.nombre }, label: l.nombre }));
        const optsFilter = data.map(l => ({ value: l._id, label: l.nombre }));
        if (!cancelled) {
          setLaundryOptionsModal(optsModal);
          setLaundryOptionsFilter(optsFilter);
        }
      } catch (e) {
        console.error('Error precargando lavanderías', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchAndSetMachines = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchMachines({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener las lavadoras.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchAndSetMachines();
  }, [fetchAndSetMachines]);

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
        const response = await createMachine(itemData);
        if (response.code === 201) {
          toast({ title: "Lavadora creada", description: "La lavadora fue registrada correctamente." });
        } else {
          throw new Error(response.message || "Error al crear lavadora");
        }
      } else if (modalMode === 'edit') {
        const response = await updateMachine(currentItem._id, itemData);
        if (response.code === 201) {
          toast({ title: "Lavadora actualizada", description: "Los datos fueron actualizados correctamente." });
        } else {
          throw new Error(response.message || "Error al actualizar lavadora");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al guardar la lavadora.",
        variant: "destructive",
      });
    } finally {
      handleCloseModal();
      fetchAndSetMachines();
    }
  };

  const handleDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      const response = await deleteMachine(itemToDelete._id);
      if (response.code === 200) {
        toast({ title: "Lavadora eliminada", description: "El registro fue eliminado correctamente." });
        fetchAndSetMachines();
      } else {
        throw new Error(response.message || "Error al eliminar la lavadora");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al eliminar la lavadora.",
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
              <Cog className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Módulo de Lavadoras</CardTitle>
              <CardDescription>Gestiona las lavadoras de la empresa.</CardDescription>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton
                title="Lavadoras"
                columns={columnsExcel}
                getData={() => exportMachines({query: filters})}
              />
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Lavadora
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
                  { id: 'lavanderia.id', label: 'Centro de Lavado', type: 'select', options: laundryOptionsFilter },
                ]}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>
          <DataTable
            data={displayedData}
            columns={machinesColumns}
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
              {
                id: 'lavanderia.id',
                label: 'Centro de Lavado',
                type: 'select',
                options: laundryOptionsFilter
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
            fields={machinesColumns.map(f => f.id === 'lavanderia' ? { ...f, options: laundryOptionsModal } : f)}
            title={modalMode === 'create' ? 'Crear Nueva Lavadora' : 'Editar Lavadora'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta lavadora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la lavadora
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

export default MachinesPage;
