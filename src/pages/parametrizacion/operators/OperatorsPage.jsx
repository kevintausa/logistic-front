import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { operatorsColumns, columnsExcel } from '@/pages/parametrizacion/operators/utils/operatorsColumns';
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
import { fetchOperators, createOperator, updateOperator, deleteOperator, exportOperators } from '@/pages/parametrizacion/operators/Services/operators.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const DEFAULT_FILTERS = { estado: 'Activo' };

const OperatorsPage = () => {
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchOperators({ limit: itemsPerPage, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los operadores.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast, itemsPerPage]);

  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleLimitChange = (newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); };
  const handleOpenModal = (mode, item = null) => { setModalMode(mode); setCurrentItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };

  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        const response = await createOperator(itemData);
        if (response.code === 201) toast({ title: 'Operador creado', description: 'El operador fue registrado correctamente.' });
        else throw new Error(response.message || 'Error al crear operador');
      } else if (modalMode === 'edit') {
        const response = await updateOperator(currentItem._id, itemData);
        if (response.code === 200) toast({ title: 'Operador actualizado', description: 'Los datos fueron actualizados correctamente.' });
        else throw new Error(response.message || 'Error al actualizar operador');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Ocurrió un problema al guardar el operador.', variant: 'destructive' });
    } finally {
      handleCloseModal();
      fetchAndSet();
    }
  };

  const handleDeleteConfirmation = (item) => { setItemToDelete(item); setIsDeleteDialogOpen(true); };
  const handleDeleteItem = async () => {
    try {
      const response = await deleteOperator(itemToDelete._id);
      if (response.code === 200) { toast({ title: 'Operador eliminado', description: 'El registro fue eliminado correctamente.' }); fetchAndSet(); }
      else throw new Error(response.message || 'Error al eliminar el operador');
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Ocurrió un problema al eliminar el operador.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAction = (actionType, row) => {
    if (actionType === 'edit') handleOpenModal('edit', row);
    else if (actionType === 'delete') handleDeleteConfirmation(row);
  };

  const handleFilterChange = (newFilters) => { setCurrentPage(1); setFilters(newFilters); };
  const handleRemoveFilter = (key) => { const nf = { ...filters }; delete nf[key]; setFilters(nf); setCurrentPage(1); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><Briefcase className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Parametrización de Operadores Logísticos</CardTitle>
              <CardDescription>Gestiona los operadores logísticos.</CardDescription>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton title="Operadores" columns={columnsExcel} getData={() => exportOperators({ query: filters })} />
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Operador
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
                { id: 'fecha_vencimiento_acceso', label: 'Vencimiento', type: 'daterange' },
              ]}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>
          <DataTable
            data={displayedData}
            columns={operatorsColumns}
            isLoading={isLoading}
            onAction={handleAction}
            page={currentPage}
            limit={itemsPerPage}
            totalRecords={totalItems}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
          <FilterDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            fields={[
              { id: 'estado', label: 'Estado', type: 'select', options: [
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
              ]},
              { id: 'createdAt', label: 'Rango de fechas', type: 'daterange', defaultToday: true },
              { id: 'fecha_vencimiento_acceso', label: 'Vencimiento', type: 'daterange' },
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
            fields={operatorsColumns}
            title={currentItem ? 'Editar Operador' : 'Crear Nuevo Operador'}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este operador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el operador
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

export default OperatorsPage;
