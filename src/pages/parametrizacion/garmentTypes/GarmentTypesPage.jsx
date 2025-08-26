import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';

import DynamicFormModal from '@/components/DynamicFormModal';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { garmentTypesColumns, columnsExcel } from './utils/garmentTypesColumns';
import { createGarmentType, getGarmentTypes, updateGarmentType, deleteGarmentType, exportGarmentTypes } from './Services/garmentTypes.services';

const GarmentTypesPage = () => {
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
      const response = await getGarmentTypes(filters);
      setData(response.data || []);
      setTotalRecords(response.totalRecords || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de prenda.',
        variant: 'destructive',
      });
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
        await updateGarmentType(editingItem._id, formData);
        toast({ title: 'Éxito', description: 'Tipo de prenda actualizado correctamente.' });
      } else {
        await createGarmentType(formData);
        toast({ title: 'Éxito', description: 'Tipo de prenda creado correctamente.' });
      }
      fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: `No se pudo guardar el tipo de prenda. ${error.message}`,
        variant: 'destructive',
      });
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
        await deleteGarmentType(itemToDelete._id);
        toast({ title: 'Éxito', description: 'Tipo de prenda eliminado correctamente.' });
        fetchData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el tipo de prenda.',
          variant: 'destructive',
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleAction = (action, item) => {
    if (action === 'edit') {
      handleEdit(item);
    } else if (action === 'delete') {
      handleDelete(item);
    }
  };

  const tableColumns = garmentTypesColumns;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 lg:p-8"
    >
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Shirt className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Parametrización de Tipos de Prenda</CardTitle>
              <CardDescription>Gestiona los tipos de prenda del sistema.</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button onClick={() => setIsFilterOpen(true)} variant="outline">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <ExportExcelButton
              service={exportGarmentTypes}
              filters={filters.query}
              columns={columnsExcel}
              fileName="Tipos_de_Prenda"
            />
            <Button onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Crear Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AppliedFilters filters={filters.query} onClear={handleClearFilters} fields={garmentTypesColumns} />
          <DataTable
            data={data}
            columns={tableColumns}
            isLoading={loading}
            onAction={handleAction}
            page={filters.page}
            limit={filters.limit}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            columnsConfig={garmentTypesColumns}
          />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <DynamicFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            fields={garmentTypesColumns}
            item={editingItem}
            title={editingItem ? 'Editar Tipo de Prenda' : 'Crear Tipo de Prenda'}
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
              ...garmentTypesColumns,
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
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de prenda.
            </AlertDialogDescription>
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

export default GarmentTypesPage;
