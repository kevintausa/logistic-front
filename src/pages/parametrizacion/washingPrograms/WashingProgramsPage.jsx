import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog, PlusCircle, FilterIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import DynamicFormModal from '@/components/DynamicFormModal';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import AppliedFilters from '@/components/AppliedFilters';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { washingProgramsColumns, columnsExcel } from './utils/washingProgramsColumns';
import { getWashingPrograms, createWashingProgram, updateWashingProgram, deleteWashingProgram, exportWashingPrograms } from './Services/washingPrograms.services';

const WashingProgramsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: {}, page: 1, limit: 10 });
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getWashingPrograms(filters);
      setData(response.data || []);
      setTotalRecords(response.totalRecords || 0);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los programas de lavado.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = (newFilters) => {
    setFilters((prev) => ({ ...prev, query: newFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({ ...prev, query: {}, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        await updateWashingProgram(editingItem._id, formData);
        toast({ title: 'Éxito', description: 'Programa de lavado actualizado.' });
      } else {
        await createWashingProgram(formData);
        toast({ title: 'Éxito', description: 'Programa de lavado creado.' });
      }
      fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({ title: 'Error', description: `No se pudo guardar el programa. ${error.message}`, variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteWashingProgram(itemToDelete._id);
        toast({ title: 'Éxito', description: 'Programa de lavado eliminado.' });
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el programa.', variant: 'destructive' });
      }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleAction = (action, item) => {
    if (action === 'edit') handleEdit(item);
    else if (action === 'delete') handleDelete(item);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><Cog className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Programas de Lavado</CardTitle>
              <CardDescription>Gestiona los programas de lavado del sistema.</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button onClick={() => setIsFilterOpen(true)} variant="outline"><FilterIcon className="h-4 w-4 mr-2" />Filtrar</Button>
            <ExportExcelButton service={exportWashingPrograms} filters={filters.query} columns={columnsExcel} fileName="Programas_de_Lavado" />
            <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}><PlusCircle className="h-4 w-4 mr-2" />Crear Nuevo</Button>
          </div>
        </CardHeader>
        <CardContent>
          <AppliedFilters filters={filters.query} onClear={handleClearFilters} fields={washingProgramsColumns} />
          <DataTable
            data={data}
            columns={washingProgramsColumns}
            isLoading={loading}
            onAction={handleAction}
            page={filters.page}
            limit={filters.limit}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <DynamicFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            fields={washingProgramsColumns}
            item={editingItem}
            title={editingItem ? 'Editar Programa de Lavado' : 'Crear Programa de Lavado'}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFilterOpen && (
          <FilterDrawer
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onFilter={handleFilter}
            fields={[
              ...washingProgramsColumns,
              { 
                id: 'lavanderia.id', 
                label: 'Centro de Lavado', 
                type: 'asyncSelect',
                fetchOptions: async () => {
                  const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services');
                  const response = await fetchLaundries({ limit: 100, offset: 1, query: { estado: 'Activo' } });
                  return response.data.map(laundry => ({
                    value: laundry._id,
                    label: laundry.nombre
                  }));
                }
              },
            ]}
            initialFilters={filters.query}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el programa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default WashingProgramsPage;
